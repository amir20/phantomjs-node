import crypto from 'crypto';

export default class OutObject {
    constructor(phantom) {
        this._phantom = phantom;
        this.target = 'OutObject$' + crypto.randomBytes(16).toString('hex');
    }

    property(name) {
        return this._phantom.execute(this.target, 'property', [name]);
    }
}
