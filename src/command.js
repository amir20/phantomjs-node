// @flow

/**
 * A simple command class that gets deserialized when it is sent to phantom
 */
let NEXT_ID: number = 1;

export default class Command {
  id: number;
  target: string;
  name: string;
  params: mixed[];
  deferred: ?{ resolve: Function, reject: Function };

  constructor(target: string, name: string, params: mixed[] = []) {
    this.id = NEXT_ID;
    NEXT_ID += 1;
    this.target = target;
    this.name = name;
    this.params = params;
    this.deferred = null;
  }
}
