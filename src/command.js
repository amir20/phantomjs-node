// @flow
import crypto from 'crypto';

/**
 * A simple command class that gets deserialized when it is sent to phantom
 */
export default class Command {
    id: string;
    target: string;
    name: string;
    params: mixed[];
    deferred: ?{resolve: Function, reject: Function};

    constructor(target: string, name: string, params: mixed[] = []) {
        this.target = target;
        this.name = name;
        this.params = params;
        this.deferred = null;
        this.id = crypto.createHash('md5').update(target + name + params.join()).digest('hex');
    }
}
