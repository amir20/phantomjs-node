export default class Session {
    constructor(server, ws) {
        this.server = server;
        this.ws = ws;
        this.commands = new Map();
        this.ws.on('message', message => {
            console.log('Received: %s', message);
            let command = JSON.parse(message);
            this.commands.get(command.id).deferred.resolve(command.response);
        });
    }

    execute(command) {
        command.deferred = Promise.defer();
        this.commands.set(command.id, command);
        console.log('Sending: %s' , JSON.stringify(command));
        this.ws.send(JSON.stringify(command));

        return command.deferred.promise;
    }

    close() {
        this.ws.close();
        this.server.tryShutdown();
    }
}