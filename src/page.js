import Command from './command'

export default class Page {
    constructor(phantom) {
        this.phantom = phantom;
    }

    open(url) {
        return this.phantom.execute(new Command(null, 'page', 'open', [url]));
    }

    render(path) {
        return this.phantom.execute(new Command(null, 'page', 'render', [path]));
    }

    close() {
        return this.phantom.execute(new Command(null, 'page', 'close'));
    }
}