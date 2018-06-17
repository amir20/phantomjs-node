// @flow
import crypto from 'crypto';
import Phantom from './phantom';

// TODO deprecate this
export default class OutObject {
  $phantom: Phantom;
  target: string;

  constructor(phantom: Phantom) {
    this.$phantom = phantom;
    this.target = `OutObject$${crypto.randomBytes(16).toString('hex')}`;
  }

  property(name: string) {
    return this.$phantom.execute(this.target, 'property', [name]);
  }
}
