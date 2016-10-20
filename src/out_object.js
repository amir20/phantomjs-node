// @flow
import Phantom from './phantom';
import crypto from 'crypto';

export default class OutObject {
    _phantom: Phantom;
    target: string;

    constructor(phantom:Phantom) {
        this._phantom = phantom;
        this.target = 'OutObject$' + crypto.randomBytes(16).toString('hex');
    }

    property(name: string) {
        return this._phantom.execute(this.target, 'property', [name]);
    }
}
