import phantomjs from "phantomjs-prebuilt";
import {spawn} from "child_process";
import winston from "winston";
import os from "os";
import path from "path";
import Linerstream from "linerstream";
import Page from "./page";
import Command from "./command";
import OutObject from "./out_object";
import EventEmitter from 'events';

const logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: process.env.DEBUG === 'true' ? 'debug' : 'info',
            colorize: true
        })
    ]
});

/**
 * A phantom instance that communicates with phantomjs
 */
export default class Phantom {

    /**
     * Creates a new instance of Phantom
     *
     * @param args command args to pass to phantom process
     */
    constructor(args = []) {
        if (!Array.isArray(args)) {
            throw new Error('Unexpected type of parameters. Expecting args to be array.');
        }

        let pathToShim = path.normalize(__dirname + '/shim.js');
        logger.debug(`Starting ${phantomjs.path} ${args.concat([pathToShim]).join(' ')}`);
        this.process = spawn(phantomjs.path, args.concat([pathToShim]));
        this.commands = new Map();
        this.events = new Map();

        this.process.stdin.setEncoding('utf-8');

        this.process.stdout.pipe(new Linerstream()).on('data', data => {
            const message = data.toString('utf8');
            if (message[0] === '>') {
                let json = message.substr(1);
                logger.debug('Parsing: %s', json);
                const command = JSON.parse(json);

                let deferred = this.commands.get(command.id).deferred;
                if (command.error === undefined) {
                    deferred.resolve(command.response);
                } else {
                    deferred.reject(new Error(command.error));
                }
                this.commands.delete(command.id);
            } else if (message.indexOf('<event>') === 0) {
                let json = message.substr(7);
                logger.debug('Parsing: %s', json);
                const event = JSON.parse(json);

                var emitter = this.events[event.target];
                if (emitter) {
                    emitter.emit.apply(emitter, [event.type].concat(event.args));
                }
            } else {
                logger.info(message);
            }
        });


        this.process.stderr.on('data', data => logger.error(data.toString('utf8')));
        this.process.on('exit', code => logger.debug(`Child exited with code {${code}}`));
        this.process.on('error', error => {
            logger.error(`Could not spawn [${phantomjs.path}] executable. Please make sure phantomjs is installed correctly.`);
            logger.error(error);
            process.exit(1);
        });

        this.heartBeatId = setInterval(this._heartBeat.bind(this), 100);
    }

    /**
     * Returns a value in the global space of phantom process
     * @returns {Promise}
     */
    windowProperty() {
        return this.execute('phantom', 'windowProperty', [].slice.call(arguments));
    }

    /**
     * Returns a new instance of Promise which resolves to a {@link Page}.
     * @returns {Promise.<Page>}
     */
    createPage() {
        return this.execute('phantom', 'createPage').then(response => new Page(this, response.pageId));
    }


    /**
     * Creates a special object that can be used for returning data back from PhantomJS
     * @returns {OutObject}
     */
    createOutObject() {
        return new OutObject(this);
    }

    /**
     * Used for creating a callback in phantomjs for content header and footer
     * @param obj
     */
    callback(obj) {
        return {transform: true, target: obj, method: 'callback', parent: 'phantom'};
    }

    /**
     * Executes a command object
     * @param command the command to run
     * @returns {Promise}
     */
    executeCommand(command) {
        command.deferred = {};

        let promise = new Promise((res, rej) => {
            command.deferred.resolve = res;
            command.deferred.reject = rej;
        });

        this.commands.set(command.id, command);

        let json = JSON.stringify(command, (key, val) => {
            let r;
            if (key[0] === '_') {
                r = undefined
            } else {
                r = typeof val === 'function' ? val.toString() : val
            }
            return r;
        });
        logger.debug('Sending: %s', json);

        this.process.stdin.write(
            json + os.EOL, 'utf8'
        );

        return promise;
    }

    /**
     * Executes a command
     *
     * @param target target object to execute against
     * @param name the name of the method execute
     * @param args an array of args to pass to the method
     * @returns {Promise}
     */
    execute(target, name, args = []) {
        return this.executeCommand(new Command(null, target, name, args));
    }

    /**
     * Adds an event listener to a target object (currently only works on pages)
     *
     * @param event the event type
     * @param target target object to execute against
     * @param runOnPhantom would the callback run in phantomjs or not
     * @param callback the event callback
     * @param args an array of args to pass to the callback
     */
    on(event, target, runOnPhantom, callback, args = []) {
        var eventDescriptor = {type: event};

        if (runOnPhantom) {
            eventDescriptor.event = callback;
            eventDescriptor.args = args;
        } else {
            var emitter = this.getEmitterForTarget(target);
            emitter.on(event, function () {
                let params = [].slice.call(arguments).concat(args);
                return callback.apply(null, params);
            });
        }
        return this.execute(target, 'addEvent', [eventDescriptor]);
    }

    /**
     * Removes an event from a target object
     *
     * @param event
     * @param target
     */
    off(event, target) {
        var emitter = this.getEmitterForTarget(target);
        emitter.removeAllListeners(event);
        return this.execute(target, 'removeEvent', [{type: event}]);
    }

    getEmitterForTarget(target) {
        if (!this.events[target]) {
            this.events[target] = new EventEmitter();
        }

        return this.events[target];
    }

    /**
     * Cleans up and end the phantom process
     */
    exit() {
        clearInterval(this.heartBeatId);
        this.execute('phantom', 'exit');
    }

    _heartBeat() {
        if (this.commands.size === 0) {
            this.execute('phantom', 'noop');
        }
    }
}
