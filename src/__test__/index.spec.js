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
});
