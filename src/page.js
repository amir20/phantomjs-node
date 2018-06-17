// @flow

import Phantom from './phantom';

/**
 * Page class that proxies everything to phantomjs
 */
export default class Page {
  $phantom: Phantom;
  target: string;

  constructor(phantom: Phantom, pageId: string) {
    this.target = `page$${pageId}`;
    this.$phantom = phantom;
  }

  /**
     * Add an event listener to the page on phantom
     *
     * @param event The name of the event (Ej. onResourceLoaded)
     * @param [runOnPhantom=false] Indicate if the event must run on the phantom runtime or not
     * @param listener The event listener. When runOnPhantom=true, this listener code would be
     * run on phantom, and thus, all the closure info wont work
     * @returns {*}
     */
  on(event: string, runOnPhantom: boolean = false, listener: Function, ...args: any[]) {
    let mustRunOnPhantom;
    let callback;
    let params;

    if (typeof runOnPhantom === 'function') {
      mustRunOnPhantom = false;
      params = [listener, ...args];
      callback = runOnPhantom.bind(this);
    } else {
      params = args;
      mustRunOnPhantom = runOnPhantom;
      callback = mustRunOnPhantom ? listener : listener.bind(this);
    }

    return this.$phantom.on(event, this.target, mustRunOnPhantom, callback, params);
  }

  /**
     * Removes an event listener
     *
     * @param event the event name
     * @returns {*}
     */
  off(event: string) {
    return this.$phantom.off(event, this.target);
  }

  /**
     * Invokes an asynchronous method
     */
  invokeAsyncMethod(...args: any[]) {
    return this.$phantom.execute(this.target, 'invokeAsyncMethod', args);
  }

  /**
     * Invokes a method
     */
  invokeMethod(...args: any[]) {
    return this.$phantom.execute(this.target, 'invokeMethod', args);
  }

  /**
     * Defines a method
     */
  defineMethod(name: string, definition: Function) {
    return this.$phantom.execute(this.target, 'defineMethod', [name, definition]);
  }

  /**
     * Gets or sets a property
     */
  property(...args: any[]): Promise<*> {
    if (args.length > 1 && typeof args[1] === 'function') {
      throw new Error('page.property(key, function(){}) has been removed. Use page.on(key, function(){}) instead.');
    }
    return this.$phantom.execute(this.target, 'property', args);
  }

  /**
     * Gets or sets a setting
     */
  setting(...args: any[]): Promise<*> {
    return this.$phantom.execute(this.target, 'setting', args);
  }

  cookies(): Promise<*> {
    return this.property('cookies');
  }
}

const asyncMethods = ['includeJs', 'open'];

const methods = [
  'addCookie',
  'clearCookies',
  'close',
  'deleteCookie',
  'evaluate',
  'evaluateAsync',
  'evaluateJavaScript',
  'injectJs',
  'openUrl',
  'reload',
  'render',
  'renderBase64',
  'sendEvent',
  'setContent',
  'setProxy',
  'stop',
  'switchToFrame',
  'switchToMainFrame',
  'goBack',
  'uploadFile',
];

asyncMethods.forEach((method) => {
  // $FlowFixMe: no way to provide dynamic functions
  Page.prototype[method] = function _(...args: any[]) {
    return this.invokeAsyncMethod.apply(this, [method, ...args]);
  };
});

methods.forEach((method) => {
  // $FlowFixMe: no way to provide dynamic functions
  Page.prototype[method] = function _(...args: any[]) {
    return this.invokeMethod.apply(this, [method, ...args]);
  };
});
