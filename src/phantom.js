import phantomjs from "phantomjs-prebuilt";
import {spawn} from "child_process";
import winston from "winston";
import os from "os";
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

export default class Phantom {
    constructor(args = []) {
        logger.debug(`Starting ${phantomjs.path} ${args.concat([__dirname + '/shim.js']).join(' ')}`);
        this.process = spawn(phantomjs.path, args.concat([__dirname + '/shim.js']));
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

        this.process.stderr.on('data', data => logger.error(data));
        this.process.on('exit', code => logger.debug(`Child exited with code [${code}]`));
        this.process.on('error', error => {
            logger.error(`Could not spawn [${phantomjs.path}] executable. Please make sure phantomjs is installed correctly.`);
            process.exit(1);
        });
    }

    createPage() {
        return this.execute('phantom', 'createPage').then(response => new Page(this, response.pageId));
    }

    executeCommand(command) {
        let resolve, reject;
        let promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });

        command.deferred = {resolve: resolve, reject: reject};

        this.commands.set(command.id, command);

        let json = JSON.stringify(command, (key, val) => typeof val === 'function' ? val.toString() : val);
        logger.debug('Sending: %s', json);

        this.process.stdin.write(
            json + os.EOL, 'utf8'
        );

        return promise;
    }

    execute(target, name, args = []) {
        return this.executeCommand(new Command(null, target, name, args));
    }

    exit() {
        this.execute('phantom', 'exit');
    }
}