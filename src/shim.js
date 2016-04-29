import webpage from "webpage";
import system from "system";

/**
 * Stores all all pages and single instance of phantom
 */
const objectSpace = {
    phantom: phantom
};

const events = {};

const eventsForEntities = {
    page: [
        'onInitialized',
        'onLoadStarted',
        'onLoadFinished',
        'onUrlChanged',
        'onNavigationRequested',
        'onRepaintRequested',
        'onResourceRequested',
        'onResourceReceived',
        'onResourceError',
        'onResourceTimeout',
        'onAlert',
        'onConsoleMessage',
        'onClosing'
    ]
};

/**
 * All methods that have a callback in their signature
 * @type {string[]}
 */
const haveCallbacks = ['open', 'includeJs'];

/**
 * All commands that have a custom implementation
 */
const commands = {
    createPage: command => {
        let page = webpage.create();
        objectSpace['page$' + command.id] = page;

        page.onClosing = () => delete objectSpace['page$' + command.id];

        command.response = {pageId: command.id};
        completeCommand(command);
    },
    property: command => {
        if (command.params.length > 1) {
            if (typeof command.params[1] === 'function') {
                // If the second parameter is a function then we want to proxy and pass parameters too
                let callback = command.params[1];
                let args = command.params.slice(2);
                syncOutObjects(args);
                objectSpace[command.target][command.params[0]] = function () {
                    let params = [].slice.call(arguments).concat(args);
                    return callback.apply(objectSpace[command.target], params);
                };
            } else {
                // If the second parameter is not a function then just assign
                objectSpace[command.target][command.params[0]] = command.params[1];
            }
        } else {
            command.response = objectSpace[command.target][command.params[0]];
        }

        completeCommand(command);
    },
    setting: command => {
        if (command.params.length === 2) {
            objectSpace[command.target].settings[command.params[0]] = command.params[1];
        } else {
            command.response = objectSpace[command.target].settings[command.params[0]];
        }

        completeCommand(command);
    },

    windowProperty: command => {
        if (command.params.length === 2) {
            window[command.params[0]] = command.params[1];
        } else {
            command.response = window[command.params[0]];
        }
        completeCommand(command);
    },

    addEvent: command => {
        let type = getTargetType(command.target);

        if (isEventSupported(type, command.params[0].type)) {
            let listeners = getEventListeners(command.target, command.params[0].type);

            if (typeof command.params[0].event === 'function') {
                listeners.otherListeners.push(function () {
                    let params = [].slice.call(arguments).concat(command.params[0].args);
                    return command.params[0].event.apply(objectSpace[command.target], params);
                });
            }
        }

        completeCommand(command);
    },

    removeEvent: function (command) {
        let type = getTargetType(command.target);

        if (isEventSupported(type, command.params[0].type)) {
            events[command.target][command.params[0].type] = null;
            objectSpace[command.target][command.params[0].type] = null;
        }

        completeCommand(command);
    },

    noop: command => completeCommand(command)
};

/**
 * Calls readLine() and blocks until a message is ready
 */
function read() {
    let line = system.stdin.readLine();
    if (line) {
        let command = JSON.parse(line, function (key, value) {
            if (value && typeof value === 'string' && value.substr(0, 8) === 'function' && value.indexOf('[native code]') === -1) {
                var startBody = value.indexOf('{') + 1;
                var endBody = value.lastIndexOf('}');
                var startArgs = value.indexOf('(') + 1;
                var endArgs = value.indexOf(')');
                return new Function(value.substring(startArgs, endArgs), value.substring(startBody, endBody));
            }
            return value;
        });

        // Call here to look for transform key
        transform(command.params);

        try {
            executeCommand(command);
        } catch (e) {
            command.error = e.message;
            completeCommand(command);
        }

    }
}

/**
 * Looks for transform key and uses objectSpace to call objects
 * @param object
 */
function transform(object) {
    for (let key in object) {
        if (object.hasOwnProperty(key)) {
            let child = object[key];
            if (child.transform === true) {
                object[key] = objectSpace[child.parent][child.method](child.target);
            } else if (typeof child === 'object') {
                transform(child);
            }
        }
    }
}

/**
 * Sync all OutObjects present in the array
 *
 * @param objects
 */
function syncOutObjects(objects) {
    objects.forEach(param => {
        if (param.target !== undefined) {
            objectSpace[param.target] = param;
        }
    });
}

/**
 * Executes a command by first checking if it is a custom method and then calling the method on the target.
 * @param command the command to execute
 */
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
            params.push(status => {
                command.response = status;
                completeCommand(command);
            });
            method.apply(target, params);
        }
    } else {
        throw new Error(`Cannot find ${command.name} method to execute on ${command.target} object.`);
    }
}

/**
 * Verifies if an event is supported for a type of target
 *
 * @param type
 * @param eventName
 * @returns {boolean}
 */
function isEventSupported(type, eventName) {
    return eventsForEntities[type] && eventsForEntities[type].indexOf(eventName) !== -1;
}

/**
 * Gets an object containing all the listeners for an event of a target
 *
 * @param target the target id
 * @param eventName the event name
 */
function getEventListeners(target, eventName) {
    if (!events[target]) {
        events[target] = {};
    }

    if (!events[target][eventName]) {
        events[target][eventName] = {
            outsideListener: getOutsideListener(eventName, target),
            otherListeners: []
        };

        objectSpace[target][eventName] = triggerEvent.bind(null, target, eventName);
    }

    return events[target][eventName];
}

/**
 * Determines a targets type using its id
 *
 * @param target
 * @returns {*}
 */
function getTargetType(target) {
    return target.toString().split('$')[0];
}

/**
 * Executes all the listeners for an event from a target
 *
 * @param target
 * @param eventName
 */
function triggerEvent(target, eventName) {
    let args = [].slice.call(arguments, 2);
    let listeners = events[target][eventName];
    listeners.outsideListener.apply(null, args);
    listeners.otherListeners.forEach(function (listener) {
        listener.apply(objectSpace[target], args);
    });
}

/**
 * Returns a function that will notify to node that an event have been triggered
 *
 * @param eventName
 * @param targetId
 * @returns {Function}
 */
function getOutsideListener(eventName, targetId) {
    return function () {
        var args = [].slice.call(arguments, 0);
        system.stdout.writeLine('<event>' + JSON.stringify({target: targetId, type: eventName, args}));
    };
}


/**
 * Completes a command by return a response to node and listening again for next command.
 * @param command
 */
function completeCommand(command) {
    system.stdout.writeLine('>' + JSON.stringify(command));
    // Prevent event-queue from clogging up by reads that block.
    setTimeout(read, 0);
}

read();
