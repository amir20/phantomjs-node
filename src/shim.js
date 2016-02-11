import webpage from 'webpage'
import system from 'system'
const page = webpage.create();


const objectSpace = {
    phantom: phantom,
    page: page
};

const commands = {
    createPage: (command) => {
        completeCommand(command);
    },
    open: (command) => {
        page.open(command.params[0], (status) => {
            command.response = status;
            completeCommand(command);
        })
    },
    includeJs: (command) => {
        page.includeJs(command.params[0], () => {
            completeCommand(command);
        })
    },
    exit: (command) => {
        if (command.target === 'phantom') {
            phantom.exit();
        }
    },
    property: (command) => {
        if (command.target === 'page') {
            command.response = page[command.params[0]];

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

        command.response = method.apply(target, command.params);
        completeCommand(command);
    }
}

function completeCommand(command) {
    system.stdout.writeLine('>' + JSON.stringify(command));
    read();
}

read();

