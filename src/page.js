import Command from './command'

export default class Page {
    constructor(session) {
        this.session = session;
    }

    open(url) {
        return this.session.execute(new Command(null, 'page', 'open', [url]));
    }

    render(path) {
        return this.session.execute(new Command(null, 'page', 'render', [path]));
    }

    close() {
        return this.session.execute(new Command(null, 'page', 'close'));
    }
}