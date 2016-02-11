import Phantom from '../phantom'
import Page from '../page'

describe('Phantom', () => {
    let instance;
    beforeAll(() => instance = new Phantom());
    beforeAll(() => instance.exit());

    it('createPage() returns a Promise', () => {
        expect(instance.createPage()).toEqual(jasmine.any(Promise));
    });

    it('createPage() resolves to a Page', (done) => {
        instance.createPage().then((page) => {
            expect(page).toEqual(jasmine.any(Page));
            done();
        });
    });
});