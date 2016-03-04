/**
 * Page class that proxies everything to phantomjs
 */
export default class Page {
    constructor(phantom, pageId) {
        this.target = 'page$' + pageId;
        this.phantom = phantom;
    }
}


const methods = [
    'open', 'render', 'close', 'property', 'injectJs', 'includeJs', 'openUrl', 'stop', 'renderBase64',
    'evaluate', 'setting', 'addCookie', 'deleteCookie', 'clearCookies', 'setContent', 'sendEvent'
];

methods.forEach(method => {
    Page.prototype[method] = function () {
        return this.phantom.execute(this.target, method, [].slice.call(arguments));
    }
});