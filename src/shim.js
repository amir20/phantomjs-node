// todo read port from system
import webpage from 'webpage'

const socket = new WebSocket(`ws://127.0.0.1:9999`);
const objectSpace = {};

socket.onclose = () => phantom.exit();
socket.onmessage = (event) => {
    const command = JSON.parse(event.data);
    executeCommand(command);
};

function executeCommand(command) {
    if (commands[command.name]) {
        return commands[command.name](command);
    } else if (objectSpace[command.target]) {
        const target = objectSpace[command.target];
        const method = target[command.name];
        command.response = method.apply(target, command.params);
    }
}

const commands = {
    createPage: (command) => {
        objectSpace['page'] = webpage.create();
        socket.send(JSON.stringify(command));
    },
    open: (command) => {
        objectSpace['page'].open(command.params[0], (status) => {
            command.response = status;
            socket.send(JSON.stringify(command));
        })
    }
};



