import { Server as WebSocketServer} from 'ws'
import phantomjs from 'phantomjs-prebuilt'
import { spawn } from 'child_process'
import Phantom from './phantom'
import Session from './session'

export default class Server {
    constructor(port = 9999) {
        this.port = port;
        this.wss = null;
        this.defers = [];
    }

    start() {
        if (this.wss == null) {
            console.log('Starting server...');
            this.wss = new WebSocketServer({port: this.port});
            this.wss.on('connection', ws => {
                console.log('Connected to client...');
                const phantom = new Phantom(new Session(this, ws));
                this.defers.pop().resolve(phantom);
            });
        }
    }

    stop() {
        if (this.wss != null && this.defers.length == 0) {
            this.wss.close();
            this.wss = null;
        }
    }

    createPhantom() {
        this.start();
        let deferred = Promise.defer();
        this.defers.push(deferred);
        this._spawnPhantom();
        return deferred.promise;
    }

    tryShutdown() {
        if (this.defers.length == 0) {
            this.stop();
        }
    }

    _spawnPhantom() {
        console.log(`${new Date()} Starting ${phantomjs.path} ${[__dirname + '/shim.js', this.port].join(' ')}`);
        const process = spawn(phantomjs.path, [__dirname + '/shim.js', this.port]);

        process.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        process.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });
    }
}