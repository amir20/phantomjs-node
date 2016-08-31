/**
 * Page class that proxies everything to phantomjs
 */
export default class Page {
    constructor(phantom, pageId) {
        this.target = 'page$' + pageId;
        this.phantom = phantom;
    }

    /**
     * Add an event listener to the page on phantom
     *
     * @param event The name of the event (Ej. onResourceLoaded)
     * @param [runOnPhantom=false] Indicate if the event must run on the phantom runtime or not
     * @param listener The event listener. When runOnPhantom=true, this listener code would be run on phantom, and thus,
     * all the closure info wont work
     * @returns {*}
     */
    on(event, runOnPhantom, listener) {
        let mustRunOnPhantom;
        let callback;
        let args;

        if (typeof runOnPhantom === 'function') {
            args = [].slice.call(arguments, 2);
            mustRunOnPhantom = false;
            callback = runOnPhantom.bind(this);
        } else {
            args = [].slice.call(arguments, 3);
            mustRunOnPhantom = runOnPhantom;
            callback = mustRunOnPhantom ? listener : listener.bind(this)
        }

        return this.phantom.on(event, this.target, mustRunOnPhantom, callback, args);
    }

    /**
     * Removes an event listener
     *
     * @param event the event name
     * @returns {*}
     */
    off(event) {
        return this.phantom.off(event, this.target);
    }

    /**
     * Invokes an asynchronous method
     */
    invokeAsyncMethod() {
        return this.phantom.execute(this.target, 'invokeAsyncMethod', [].slice.call(arguments));
    }

    /**
     * Invokes a method
     */
    invokeMethod() {
        return this.phantom.execute(this.target, 'invokeMethod', [].slice.call(arguments));
    }

    /**
     * Defines a method
     */
    defineMethod(name, definition) {
        return this.phantom.execute(this.target, 'defineMethod', [name, definition]);
    }

    /**
     * Gets or sets a property
     */
    property() {
        return this.phantom.execute(this.target, 'property', [].slice.call(arguments));
    }

    /**
     * Gets or sets a setting
     */
    setting() {
        return this.phantom.execute(this.target, 'setting', [].slice.call(arguments));
    }
}

const asyncMethods = [
    'includeJs',
    'open'
];

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
    'uploadFile'
];

asyncMethods.forEach(method => {
    Page.prototype[method] = function () {
        return this.invokeAsyncMethod.apply(this, [method].concat([].slice.call(arguments)));
    };
});

methods.forEach(method => {
    Page.prototype[method] = function () {
        return this.invokeMethod.apply(this, [method].concat([].slice.call(arguments)));
    }
});
