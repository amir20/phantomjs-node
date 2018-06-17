// @flow

import phantomjs from 'phantomjs-prebuilt';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import split from 'split';
import winston from 'winston';
import EventEmitter from 'events';
import Page from './page';
import Command from './command';
import OutObject from './out_object';

type Response = { pageId: string };

const defaultLogLevel = process.env.DEBUG === 'true' ? 'debug' : 'info';
const defaultPathToShim = path.normalize(`${__dirname}/shim/index.js`);
const NOOP = 'NOOP';

/**
 * Creates a logger using winston
 */
function createLogger({ logLevel = defaultLogLevel } = {}) {
  const { format } = winston;
  return winston.createLogger({
    transports: [
      new winston.transports.Console({
        level: logLevel,
        format: format.combine(winston.format.colorize(), format.splat(), format.simple()),
      }),
    ],
  });
}

/**
 * A phantom instance that communicates with phantomjs
 */
export default class Phantom {
  logger: Logger;
  isNoOpInProgress: boolean;
  commands: Map<number, Command>;
  events: Map<string, EventEmitter>;
  heartBeatId: IntervalID;
  process: child_process$ChildProcess; // eslint-disable-line camelcase

  /**
   * Creates a new instance of Phantom
   *
   * @param args command args to pass to phantom process
   * @param [phantomPath] path to phantomjs executable
   * @param [logger] object containing functions used for logging
   * @param [logLevel] log level to apply on the logger (if unset or default)
   */
  // eslint-disable-next-line
  constructor(
    args?: string[] = [],
    {
      phantomPath = phantomjs.path,
      shimPath = defaultPathToShim,
      logLevel = defaultLogLevel,
      logger = createLogger({ logLevel }),
    }: Config = {},
  ) {
    if (!Array.isArray(args)) {
      throw new Error('Unexpected type of parameters. Expecting args to be array.');
    }

    if (typeof phantomPath !== 'string') {
      throw new Error('PhantomJS binary was not found. ' +
          'This generally means something went wrong when installing phantomjs-prebuilt. Exiting.');
    }

    if (typeof shimPath !== 'string') {
      throw new Error('Path to shim file was not found. ' +
          'Are you sure you entered the path correctly? Exiting.');
    }

    if (!logger.info && !logger.debug && !logger.error && !logger.warn) {
      throw new Error('logger must be a valid object.');
    }

    // eslint-disable-next-line no-unused-vars
    const noop = (...msg) => undefined;

    this.logger = {
      info: logger.info ? (...msg) => logger.info(...msg) : noop,
      debug: logger.debug ? (...msg) => logger.debug(...msg) : noop,
      error: logger.error ? (...msg) => logger.error(...msg) : noop,
      warn: logger.warn ? (...msg) => logger.warn(...msg) : noop,
    };

    this.logger.debug(`Starting ${phantomPath} ${args.concat([shimPath]).join(' ')}`);

    this.process = spawn(phantomPath, args.concat([shimPath]), { env: process.env });
    this.process.stdin.setDefaultEncoding('utf-8');

    this.commands = new Map();
    this.events = new Map();

    this.process.stdout.pipe(split()).on('data', (data) => {
      const message = data.toString('utf8');
      if (message[0] === '>') {
        // Server end has finished NOOP, lets allow NOOP again..
        if (message === `>${NOOP}`) {
          this.logger.debug('Received NOOP command.');
          this.isNoOpInProgress = false;
          return;
        }
        const json = message.substr(1);
        this.logger.debug('Parsing: %s', json);

        const parsedJson = JSON.parse(json);
        const command = this.commands.get(parsedJson.id);

        if (command != null) {
          const { deferred } = command;

          if (deferred != null) {
            if (parsedJson.error === undefined) {
              deferred.resolve(parsedJson.response);
            } else {
              deferred.reject(new Error(parsedJson.error));
            }
          } else {
            this.logger.error(`deferred object not found for command.id: ${parsedJson.id}`);
          }

          this.commands.delete(command.id);
        } else {
          this.logger.error(`command not found for command.id: ${parsedJson.id}`);
        }
      } else if (message.indexOf('<event>') === 0) {
        const json = message.substr(7);
        this.logger.debug('Parsing: %s', json);
        const event = JSON.parse(json);

        const emitter = this.events.get(event.target);
        if (emitter) {
          emitter.emit(...[event.type].concat(event.args));
        }
      } else if (message && message.length > 0) {
        this.logger.info(message);
      }
    });

    this.process.stderr.on('data', data => this.logger.error(data.toString('utf8')));
    this.process.on('exit', (code) => {
      this.logger.debug(`Child exited with code {${code}}`);
      this.rejectAllCommands(`Phantom process stopped with exit code ${code}`);
    });
    this.process.on('error', (error) => {
      this.logger.error(`Could not spawn [${phantomPath}] executable. ` +
          'Please make sure phantomjs is installed correctly.');
      this.logger.error(error);
      this.kill(`Process got an error: ${error}`);
      process.exit(1);
    });

    this.process.stdin.on('error', (e) => {
      this.logger.debug(`Child process received error ${e}, sending kill signal`);
      this.kill(`Error reading from stdin: ${e}`);
    });

    this.process.stdout.on('error', (e) => {
      this.logger.debug(`Child process received error ${e}, sending kill signal`);
      this.kill(`Error reading from stdout: ${e}`);
    });

    this.heartBeatId = setInterval(this.heartBeat.bind(this), 100);
  }

  /**
   * Returns a value in the global space of phantom process
   */
  windowProperty(...args: mixed[]): Promise<mixed> {
    return this.execute('phantom', 'windowProperty', args);
  }

  /**
   * Returns a new instance of Promise which resolves to a {@link Page}.
   * @returns {Promise.<Page>}
   */
  createPage(): Promise<Page> {
    const { logger } = this;
    return this.execute('phantom', 'createPage').then((response: Response) => {
      let page = new Page(this, response.pageId);
      if (typeof Proxy !== 'function') {
        throw new Error('Expected object Proxy to be defined. Make sure you are using Node 6+.');
      }
      page = new Proxy(page, {
        set(target, prop) {
          logger.warn(`Using page.${prop} = ...; is not supported. Use page.property('${prop}', ...) ` +
              'instead. See the README file for more examples of page#property.');
          return false;
        },
      });
      return page;
    });
  }

  /**
   * Creates a special object that can be used for returning data back from PhantomJS
   * @returns {OutObject}
   */
  createOutObject(): OutObject {
    return new OutObject(this);
  }

  /**
   * Used for creating a callback in phantomjs for content header and footer
   * @param obj
   */
  // eslint-disable-next-line class-methods-use-this
  callback(obj: Function): { transform: true, target: Function, method: 'callback', parent: 'phantom' } {
    return {
      transform: true,
      target: obj,
      method: 'callback',
      parent: 'phantom',
    };
  }

  /**
   * Executes a command object
   * @param command the command to run
   * @returns {Promise}
   */
  executeCommand(command: Command): Promise<Response> {
    this.commands.set(command.id, command);

    const json = JSON.stringify(command, (key, val) => {
      if (key[0] === '$') {
        // if key starts with $ then ignore because it's private
        return undefined;
      } else if (typeof val === 'function') {
        if (!Object.prototype.hasOwnProperty.call(val, 'prototype')) {
          this.logger.warn('Arrow functions such as () => {} are not supported in PhantomJS. ' +
              'Please use function(){} or compile to ES5.');
          throw new Error('Arrow functions such as () => {} are not supported in PhantomJS.');
        }
        return val.toString();
      }
      return val;
    });

    const promise = new Promise((res, rej) => {
      command.deferred = { resolve: res, reject: rej }; // eslint-disable-line no-param-reassign
    });

    this.logger.debug('Sending: %s', json);

    this.process.stdin.write(json + os.EOL, 'utf8');

    return promise;
  }

  /**
   * Executes a command
   *
   * @param target target object to execute against
   * @param name the name of the method execute
   * @param args an array of args to pass to the method
   * @returns {Promise}
   */
  execute(target: string, name: string, args: mixed[] = []): Promise<Response> {
    return this.executeCommand(new Command(target, name, args));
  }

  /**
   * Adds an event listener to a target object (currently only works on pages)
   *
   * @param event the event type
   * @param target target object to execute against
   * @param runOnPhantom would the callback run in phantomjs or not
   * @param callback the event callback
   * @param args an array of args to pass to the callback
   */
  on(event: string, target: string, runOnPhantom: boolean, callback: Function, args: mixed[] = []) {
    const eventDescriptor: { type: string, args?: mixed[], event?: Function } = { type: event };

    if (runOnPhantom) {
      eventDescriptor.event = callback;
      eventDescriptor.args = args;
    } else {
      const emitter = this.getEmitterForTarget(target);
      emitter.on(event, (...eArgs) => {
        const params = eArgs.concat(args);
        return callback(...params);
      });
    }
    return this.execute(target, 'addEvent', [eventDescriptor]);
  }

  /**
   * Removes an event from a target object
   *
   * @param event
   * @param target
   */
  off(event: string, target: string): Promise<mixed> {
    const emitter = this.getEmitterForTarget(target);
    emitter.removeAllListeners(event);
    return this.execute(target, 'removeEvent', [{ type: event }]);
  }

  getEmitterForTarget(target: string): EventEmitter {
    let emitter = this.events.get(target);

    if (emitter == null) {
      emitter = new EventEmitter();
      this.events.set(target, emitter);
    }

    return emitter;
  }

  cookies(): Promise<*> {
    return this.execute('phantom', 'property', ['cookies']);
  }

  /**
   * Cleans up and end the phantom process
   */
  exit(): Promise<Response> {
    clearInterval(this.heartBeatId);
    if (this.commands.size > 0) {
      this.logger.warn('exit() was called before waiting for commands to finish. ' +
          'Make sure you are not calling exit() prematurely.');
    }
    return this.execute('phantom', 'invokeMethod', ['exit']);
  }

  /**
   * Clean up and force kill this process
   */
  kill(errmsg: string = 'Phantom process was killed'): void {
    this.rejectAllCommands(errmsg);
    this.process.kill('SIGKILL');
  }

  heartBeat(): void {
    if (!this.isNoOpInProgress) {
      this.isNoOpInProgress = true;
      this.logger.debug('Sending NOOP command.');
      this.process.stdin.write(NOOP + os.EOL, 'utf8');
    }
  }

  /**
   * rejects all commands in this.commands
   */
  rejectAllCommands(msg: string = 'Phantom exited prematurely'): void {
    // prevent heartbeat from preventing this from terminating
    clearInterval(this.heartBeatId);

    this.commands.forEach((command) => {
      const { params: [name] } = command;
      if (name !== 'exit' && command.deferred) {
        command.deferred.reject(new Error(msg));
      }
    });
  }
}
