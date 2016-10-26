// @flow
import randId from './util/random_id';

/**
 * A simple command class that gets deserialized when it is sent to phantom
 */
export default class Command {
    id: string;
    target: string;
    name: string;
    params: mixed[];
    deferred: ?{resolve: Function, reject: Function};

    constructor(id: ?string, target: string, name: string, params:mixed[] = []) {
        this.id = id || randId(16);
        this.target = target;
        this.name = name;
        this.params = params;
        this.deferred = null;
    }
}
