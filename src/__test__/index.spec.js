import phantom from '../index';
import Phantom from '../phantom';

describe('index.js', () => {
    it('phantom#create().then() returns a new Phantom instance', () => {
        return phantom.create().then(ph => {
            expect(ph).toBeInstanceOf(Phantom);
            ph.exit();
        });
    });

    it('phantom#create() returns a new Promise instance', () => {
        let promise = phantom.create();
        expect(promise).toBeInstanceOf(Promise);
        return promise.then(ph => ph.exit());
    });

    it('#create([], {}) errors with undefined phantomjs-prebuilt to throw exception', async () => {
        await expect(phantom.create([], {phantomPath: null})).rejects
            .toEqual(new Error('PhantomJS binary was not found. ' +
                'This generally means something went wrong when installing phantomjs-prebuilt. Exiting.'));
    });

    it('#create([], {}) errors with string for logger', async () => {
        await expect(phantom.create([], {logger: 'log'})).rejects
            .toEqual(new Error('logger must be a valid object.'));
    });

    it('#create([], {}) errors with string for logger', async () => {
        await expect(phantom.create('str')).rejects
            .toEqual(new Error('Unexpected type of parameters. Expecting args to be array.'));
    });

});
