import phantom from '../index';
import Phantom from '../phantom';

describe('index.js', () => {
  it('phantom#create().then() returns a new Phantom instance', () => phantom.create().then((ph) => {
    expect(ph).toBeInstanceOf(Phantom);
    ph.exit();
  }));

  it('phantom#create() returns a new Promise instance', () => {
    const promise = phantom.create();
    expect(promise).toBeInstanceOf(Promise);
    return promise.then(ph => ph.exit());
  });

  it('phantom#create([], {}).then() with a custom shim path returns a new Phantom instance', () => phantom.create([], { shimPath: `${__dirname}/shim/index.js` }).then((ph) => {
    expect(ph).toBeInstanceOf(Phantom);
    ph.exit();
  }));

  it('#create([], {}) errors with undefined phantomjs-prebuilt to throw exception', async () => {
    await expect(phantom.create([], { phantomPath: null })).rejects
      .toEqual(new Error('PhantomJS binary was not found. '
                + 'This generally means something went wrong when installing phantomjs-prebuilt. Exiting.'));
  });

  it('#create([], {}) errors with non-string passed in as shimPath', async () => {
    await expect(phantom.create([], { shimPath: 12 })).rejects
      .toEqual(new Error('Path to shim file was not found. '
                + 'Are you sure you entered the path correctly? Exiting.'));
  });

  it('#create([], {}) errors with string for logger', async () => {
    await expect(phantom.create([], { logger: 'log' })).rejects
      .toEqual(new Error('logger must be a valid object.'));
  });

  it('#create([], {}) errors with string for logger', async () => {
    await expect(phantom.create('str')).rejects
      .toEqual(new Error('Unexpected type of parameters. Expecting args to be array.'));
  });
});
