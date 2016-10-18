import phantom from '../index';
import Phantom from '../phantom';

describe('index.js', () => {
    it('phantom#create().then() returns a new Phantom instance', done => {
        phantom.create().then(ph => {
            expect(ph).toBeInstanceOf(Phantom);
            ph.exit();
            done();
        });
    });

    it('phantom#create() returns a new Promise instance', done => {
        let promise = phantom.create();
        expect(promise).toBeInstanceOf(Promise);
        promise.then(ph => {
            ph.exit();
            done();
        });
    });
});
