import phantomjs from "phantomjs-prebuilt";
import {spawn} from "child_process";
import winston from "winston";
import os from "os";
import path from "path";
import Linerstream from "linerstream";
import Page from "./page";
import Command from "./command";

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
            } else {
                logger.info(message);
            }
        });

        this.process.stderr.on('data', data => logger.error(data.toString('utf8')));
        this.process.on('exit', code => logger.debug(`Child exited with code [${code}]`));
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

        let json = JSON.stringify(command, (key, val) => typeof val === 'function' ? val.toString() : val);
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
