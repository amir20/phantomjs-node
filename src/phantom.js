import phantomjs from 'phantomjs-prebuilt';
import {spawn} from 'child_process';
import os from 'os';
import path from 'path';
import Linerstream from 'linerstream';
import winston from 'winston';
import Page from './page';
import Command from './command';
import OutObject from './out_object';
import EventEmitter from 'events';

const defaultLogLevel = process.env.DEBUG === 'true' ? 'debug' : 'info';

/**
 * Creates a logger using winston
 */
function createLogger() {
    return new winston.Logger({
        transports: [
            new winston.transports.Console({
                level: defaultLogLevel,
                colorize: true,
            }),
        ],
    });
}

const defaultLogger = createLogger();

/**
 * A phantom instance that communicates with phantomjs
 */
export default class Phantom {

    /**
     * Creates a new instance of Phantom
     *
     * @param args command args to pass to phantom process
     * @param [phantomPath] path to phantomjs executable
     * @param [logger] object containing functions used for logging
     * @param [logLevel] log level to apply on the logger (if unset or default)
     */
    constructor(args = [], {phantomPath = phantomjs.path, logger = defaultLogger, logLevel = defaultLogLevel} = {
        phantomPath: phantomjs.path,
        logger: defaultLogger,
        logLevel: defaultLogLevel,
    }) {
        if (!Array.isArray(args)) {
            throw new Error('Unexpected type of parameters. Expecting args to be array.');
        }

        if (typeof phantomPath !== 'string') {
            throw new Error('PhantomJS binary was not found. ' +
                'This generally means something went wrong when installing phantomjs-prebuilt. Exiting.');
        }

        if (typeof logger !== 'object') {
            throw new Error('logger must be ba valid object.');
        }

        ['debug', 'info', 'warn', 'error'].forEach(method => {
            if (typeof logger[method] !== 'function') {
                logger[method] = () => undefined;
            }
        });

        this.logger = logger;

        if (logLevel !== defaultLogLevel) {
            this.logger = createLogger();
            this.logger.transports.console.level = logLevel;
        }

        const pathToShim = path.normalize(__dirname + '/shim/index.js');
        this.logger.debug(`Starting ${phantomPath} ${args.concat([pathToShim]).join(' ')}`);

        this.process = spawn(phantomPath, args.concat([pathToShim]));
        this.process.stdin.setEncoding('utf-8');

        this.commands = new Map();
        this.events = new Map();

        this.process.stdout.pipe(new Linerstream()).on('data', data => {
            const message = data.toString('utf8');
            if (message[0] === '>') {
                const json = message.substr(1);
                this.logger.debug('Parsing: %s', json);
                const command = JSON.parse(json);
                const deferred = this.commands.get(command.id).deferred;

                if (command.error === undefined) {
                    deferred.resolve(command.response);
                } else {
                    deferred.reject(new Error(command.error));
                }
                this.commands.delete(command.id);
            } else if (message.indexOf('<event>') === 0) {
                const json = message.substr(7);
                this.logger.debug('Parsing: %s', json);
                const event = JSON.parse(json);

                const emitter = this.events[event.target];
                if (emitter) {
                    emitter.emit.apply(emitter, [event.type].concat(event.args));
                }
            } else {
                this.logger.info(message);
            }
        });

        this.process.stderr.on('data', data => this.logger.error(data.toString('utf8')));
        this.process.on('exit', code => this.logger.debug(`Child exited with code {${code}}`));
        this.process.on('error', error => {
            this.logger.error(`Could not spawn [${phantomPath}] executable. ` +
                'Please make sure phantomjs is installed correctly.');
            this.logger.error(error);
            this.kill(`Process got an error: ${error}`);
            process.exit(1);
        });

        this.process.stdin.on('error', (e) => {
            this.logger.debug(`Child process received error ${e}, sending kill signal`);
            this.kill(`Error reading from stdin: ${e}`);
        });

        this.process.stdout.on('error', (e) => {
            this.logger.debug(`Child process received error ${e}, sending kill signal`);
            this.kill(`Error reading from stdout: ${e}`);
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
        const logger = this.logger;
        return this.execute('phantom', 'createPage').then(response => {
            let page = new Page(this, response.pageId);
            if (typeof Proxy === 'function') {
                page = new Proxy(page, {
                    set: function(target, prop) {
                        logger.warn(`Using page.${prop} = ...; is not supported. Use page.property('${prop}', ...) ` +
                        'instead. See the README file for more examples of page#property.');
                        return false;
                    },
                });
            }
            return page;
        });
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
        this.commands.set(command.id, command);

        let json = JSON.stringify(command, (key, val) => {
            if (key[0] === '_') {
                return undefined;
            } else if (typeof val === 'function') {
                if (!val.hasOwnProperty('prototype')) {
                    this.logger.warn('Arrow functions such as () => {} are not supported in PhantomJS. ' +
                        'Please use function(){} or compile to ES5.');
                    throw new Error('Arrow functions such as () => {} are not supported in PhantomJS.');
                }
                return val.toString();
            }
            return val;
        });

        command.deferred = {};

        let promise = new Promise((res, rej) => {
            command.deferred.resolve = res;
            command.deferred.reject = rej;
        });

        this.logger.debug('Sending: %s', json);

        this.process.stdin.write(json + os.EOL, 'utf8');

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
        const eventDescriptor = {type: event};

        if (runOnPhantom) {
            eventDescriptor.event = callback;
            eventDescriptor.args = args;
        } else {
            const emitter = this.getEmitterForTarget(target);
            emitter.on(event, function() {
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
        const emitter = this.getEmitterForTarget(target);
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
        this.execute('phantom', 'invokeMethod', ['exit']);
    }

    /**
     * Clean up and force kill this process
     */
    kill(errmsg = 'Phantom process was killed') {
        this._rejectAllCommands(errmsg);
        this.process.kill('SIGKILL');
    }

    _heartBeat() {
        if (this.commands.size === 0) {
            this.execute('phantom', 'noop');
        }
    }

    /**
     * rejects all commands in this.commands
     */
    _rejectAllCommands(errmsg = 'Phantom exited prematurely') {
        // prevent heartbeat from preventing this from terminating
        clearInterval(this.heartBeatId);
        for (const command of this.commands.values()) {
            command.deferred.reject(new Error(errmsg));
        }
    }
}
