import webpage from 'webpage'
import system from 'system'
const page = webpage.create();


const objectSpace = {
    phantom: phantom,
    page: page
};

const haveCallbacks = ['open', 'includeJs'];

const commands = {
    createPage: (command) => {
        completeCommand(command);
    },
    exit: (command) => {
        if (command.target === 'phantom') {
            phantom.exit();
        }
    },
    property: (command) => {
        if (command.target === 'page') {
            if (command.params.length == 2) {
                page[command.params[0]] = command.params[1];
            } else {
                command.response = page[command.params[0]];
            }

            completeCommand(command);
        }
    }
};

function read() {
    let line = system.stdin.readLine();
    if (line) {
        let command = JSON.parse(line);
        executeCommand(command)
    }
}

function executeCommand(command) {
    if (commands[command.name]) {
        return commands[command.name](command);
    } else if (objectSpace[command.target]) {
        const target = objectSpace[command.target];
        const method = target[command.name];

        if (haveCallbacks.indexOf(command.name) === -1) {
            command.response = method.apply(target, command.params);
            completeCommand(command);
        } else {
            let params = command.params.slice();
            params.push((status) => {
                command.response = status;
                completeCommand(command);
            });
            method.apply(target, params);
        }
    }
}

function completeCommand(command) {
    system.stdout.writeLine('>' + JSON.stringify(command));
    read();
}

read();

