import Command from './command'

export default class Page {
    constructor(phantom) {
        this.phantom = phantom;
    }
}


const methods = ['open', 'render', 'close', 'property'];

methods.forEach((method) => {
    Page.prototype[method] = function () {
        const args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
        return this.phantom.execute(new Command(null, 'page', method, args));
    }
});