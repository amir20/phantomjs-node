import Command from './command'
import Page from './page'

export default class Phantom {
    constructor(session) {
        this.session = session;
    }

    createPage() {
        return this.session.execute(new Command(null, null, 'createPage')).then(() => new Page(this.session));
    }

    exit() {
        this.session.close();
    }
}