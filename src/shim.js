import webpage from "webpage";
import system from "system";


const objectSpace = {
    phantom: phantom
};

const haveCallbacks = ['open', 'includeJs'];

const commands = {
    createPage: command => {
        let page = webpage.create();
        objectSpace['page$' + command.id] = page;
        page.onClosing = () => delete objectSpace['page$' + command.id];
        page.onConsoleMessage = (msg, lineNum, sourceId) => console.log(msg);

        command.response = {pageId: command.id};
        completeCommand(command);
    },
    exit: command => {
        if (command.target === 'phantom') {
            phantom.exit();
        }
    },
    property: command => {
        if (command.params.length == 2) {
            objectSpace[command.target][command.params[0]] = command.params[1];
        } else {
            command.response = objectSpace[command.target][command.params[0]];
        }

        completeCommand(command);
    },
    setting: command => {
        if (command.params.length == 2) {
            objectSpace[command.target].settings[command.params[0]] = command.params[1];
        } else {
            command.response = objectSpace[command.target].settings[command.params[0]];
        }

        completeCommand(command);
    }
};

function read() {
    let line = system.stdin.readLine();
    if (line) {
        let command = JSON.parse(line, function (key, value) {

            if (value && typeof value === 'string' && value.substr(0, 8) == 'function' && value.indexOf('[native code]') === -1) {
                var startBody = value.indexOf('{') + 1;
                var endBody = value.lastIndexOf('}');
                var startArgs = value.indexOf('(') + 1;
                var endArgs = value.indexOf(')');

                return new Function(value.substring(startArgs, endArgs), value.substring(startBody, endBody));
            }
            return value;
        });

        try {
            executeCommand(command);
        } catch (e) {
            command.error = e.message;
            completeCommand(command);
        }

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
            let params = command.params.slice(); // copy params
            params.push((status) => {
                command.response = status;
                completeCommand(command);
            });
            method.apply(target, params);
        }
    } else {
        throw new Error(`Cannot find ${command.name} method to execute on ${command.target} object.`);
    }
}

function completeCommand(command) {
    system.stdout.writeLine('>' + JSON.stringify(command));
    // Prevent event-queue from clogging up by reads that block.
    setTimeout(read, 0);
}

read();

