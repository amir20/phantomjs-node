import phantomjs from 'phantomjs-prebuilt'
import { spawn } from 'child_process'
import os from 'os'
import Page from './page'
import Command from './command'

export default class Phantom {
    constructor() {
        console.log(`${new Date()} Starting ${phantomjs.path} ${__dirname + '/shim.js'}`);
        this.process = spawn(phantomjs.path, [__dirname + '/shim.js']);
        this.commands = new Map();

        this.process.stdin.setEncoding('utf-8');

        this.process.stdout.on('data', (data) => {
            const message = data.toString();
            if (message[0] === '>') {
                const json = message.substr(1);
                console.log('Parsing: %s', json);

                const command = JSON.parse(json);
                this.commands.get(command.id).deferred.resolve(command.response);
                this.commands.delete(command.id);
            } else {
                console.log(message);
            }
        });

        this.process.stderr.on('data', (data) => {
            console.log('Error:' + data);
        });

        this.process.on('exit', (code) => {
            console.log(`Child exited with code ${code}`);
        });
    }

    createPage() {
        return Promise.resolve(new Page(this));
    }

    execute(command) {
        command.deferred = Promise.defer();
        this.commands.set(command.id, command);
        console.log('Sending: %s', JSON.stringify(command));
        this.process.stdin.write(JSON.stringify(command) + os.EOL, 'utf8');

        return command.deferred.promise;
    }

    exit() {
        this.execute(new Command(null, 'phantom', 'exit'));
        //this.process.kill('SIGINT');
    }
}