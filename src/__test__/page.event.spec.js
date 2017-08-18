import 'babel-polyfill';
import http from 'http';
import Phantom from '../phantom';

describe('Page', () => {
  let server;
  let phantom;
  let port;
  beforeAll((done) => {
    server = http.createServer((request, response) => {
      response.end(`hi, ${request.url}`);
    });
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll(() => server.close());
  beforeEach(() => {
    phantom = new Phantom();
  });
  afterEach(() => phantom.exit());

  it('#on() can register an event in the page and run the code locally', async () => {
    const page = await phantom.createPage();
    let runnedHere = false;

    await page.on('onResourceReceived', () => {
      runnedHere = true;
    });

    await page.open(`http://localhost:${port}/test`);

    expect(runnedHere).toBe(true);
  });

  it('#on() event registered does not run if not triggered', async () => {
    const page = await phantom.createPage();
    let runnedHere = false;

    await page.on('onResourceReceived', () => {
      runnedHere = true;
    });

    expect(runnedHere).toBe(false);
  });

  it('#on() can register more than one event of the same type', async () => {
    const page = await phantom.createPage();
    let runnedHere = false;

    await page.on('onResourceReceived', () => {
      runnedHere = true;
    });

    let runnedHereToo = false;

    await page.on('onResourceReceived', () => {
      runnedHereToo = true;
    });

    await page.open(`http://localhost:${port}/test`);

    expect(runnedHere).toBe(true);
    expect(runnedHereToo).toBe(true);
  });

  it('#on() can pass parameters', async () => {
    const page = await phantom.createPage();
    let parameterProvided = false;

    await page.on(
      'onResourceReceived',
      (status, param) => {
        parameterProvided = param;
      },
      'param',
    );

    await page.open(`http://localhost:${port}/test`);

    expect(parameterProvided).toBe('param');
  });

  it('#on() can register an event in the page which code runs in phantom runtime', async () => {
    const page = await phantom.createPage();
    let runnedHere = false;

    await page.on('onLoadFinished', true, () => {
      runnedHere = true;
      runnedInPhantomRuntime = true;
    });

    await page.open(`http://localhost:${port}/test`);

    let runnedInPhantomRuntime = await phantom.windowProperty('runnedInPhantomRuntime');

    expect(runnedHere).toBe(false);
    expect(runnedInPhantomRuntime).toBe(true);
  });

  it('#on() can pass parameters to functions to be executed in phantom runtime', async () => {
    const page = await phantom.createPage();

    await page.on(
      'onResourceReceived',
      true,
      (status, param) => {
        parameterProvided = param;
      },
      'param',
    );

    await page.open(`http://localhost:${port}/test`);

    let parameterProvided = await phantom.windowProperty('parameterProvided');

    expect(parameterProvided).toBe('param');
  });

  it('#on() event supposed to run in phantom runtime wont run if not triggered', async () => {
    const page = await phantom.createPage();

    await page.on('onResourceReceived', true, () => {
      runnedInPhantomRuntime = true;
    });

    let runnedInPhantomRuntime = await phantom.windowProperty('runnedInPhantomRuntime');

    expect(runnedInPhantomRuntime).toBeFalsy();
  });

  it('#on() can register at the same event to run locally or in phantom runtime', async () => {
    const page = await phantom.createPage();
    let runnedHere = false;

    await page.on('onResourceReceived', true, () => {
      runnedInPhantomRuntime = true;
    });

    await page.on('onResourceReceived', () => {
      runnedHere = true;
    });

    await page.open(`http://localhost:${port}/test`);

    let runnedInPhantomRuntime = await phantom.windowProperty('runnedInPhantomRuntime');

    expect(runnedHere).toBe(true);
    expect(runnedInPhantomRuntime).toBe(true);
  });

  it('#off() can disable an event whose listener is going to run locally', async () => {
    const page = await phantom.createPage();
    let runnedHere = false;

    await page.on('onResourceReceived', () => {
      runnedHere = true;
    });

    await page.off('onResourceReceived');

    await page.open(`http://localhost:${port}/test`);

    expect(runnedHere).toBe(false);
  });

  it('#off() can disable an event whose listener is going to run on the phantom process', async () => {
    const page = await phantom.createPage();

    await page.on('onResourceReceived', true, () => {
      runnedInPhantomRuntime = true;
    });

    await page.off('onResourceReceived');

    await page.open(`http://localhost:${port}/test`);

    let runnedInPhantomRuntime = await phantom.windowProperty('runnedInPhantomRuntime');

    expect(runnedInPhantomRuntime).toBeFalsy();
  });
});
