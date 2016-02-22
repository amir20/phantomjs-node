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
    'evaluate', 'setting', 'addCookie', 'deleteCookie', 'clearCookies', 'eval'
];

methods.forEach(method => {
    Page.prototype[method] = function () {
        const args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
        return this.phantom.execute(this.target, method, args);
    }
});