// @flow
import Phantom from './phantom';
import randId from './util/random_id';

export default class OutObject {
    _phantom: Phantom;
    target: string;

    constructor(phantom:Phantom) {
        this._phantom = phantom;
        this.target = 'OutObject$' + randId(16);
    }

    property(name: string) {
        return this._phantom.execute(this.target, 'property', [name]);
    }
}
