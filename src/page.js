/**
 * Page class that proxies everything to phantomjs
 */
export default class Page {
    constructor(phantom, pageId) {
        this.target = 'page$' + pageId;
        this.phantom = phantom;
    }

    on(event, runOnPhantom, callback) {
        if (typeof runOnPhantom === 'function') {
            let args = [].slice.call(arguments, 2);
            return this.phantom.on(event, this.target, false, runOnPhantom.bind(this), args);
        } else {
            let args = [].slice.call(arguments, 3);
            return this.phantom.on(event, this.target, runOnPhantom, runOnPhantom ? callback : callback.bind(this), args);
        }
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
