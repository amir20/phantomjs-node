/**
 * Page class that proxies everything to phantomjs
 */
export default class Page {
    constructor(phantom, pageId) {
        this.target = 'page$' + pageId;
        this.phantom = phantom;
    }

    on(event, runOnPhantom, callback) {
        let mustRunOnPhantom;
        let listener;
        let args;

        if (typeof runOnPhantom === 'function') {
            args = [].slice.call(arguments, 2);
            mustRunOnPhantom = false;
            listener = runOnPhantom.bind(this);
        } else {
            args = [].slice.call(arguments, 3);
            mustRunOnPhantom = runOnPhantom;
            listener = mustRunOnPhantom ? callback : callback.bind(this)
        }

        return this.phantom.on(event, this.target, mustRunOnPhantom, listener, args);
    }

    off(event) {
        return this.phantom.off(event, this.target);
    }
}


const methods = [
    'open', 'render', 'close', 'property', 'injectJs', 'includeJs', 'openUrl', 'stop', 'renderBase64',
    'evaluate', 'evaluateJavaScript', 'setting', 'addCookie', 'deleteCookie', 'clearCookies', 'setContent', 'sendEvent'
];

methods.forEach(method => {
    Page.prototype[method] = function () {
        return this.phantom.execute(this.target, method, [].slice.call(arguments));
    }
});
