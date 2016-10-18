import crypto from 'crypto';

/**
 * A simple command class that gets deserialized when it is sent to phantom
 */
export default class Command {
    constructor(id, target, name, params = []) {
        this.id = id || crypto.randomBytes(16).toString('hex');
        this.target = target;
        this.name = name;
        this.params = params;
        this.deferred = undefined;
    }
}
