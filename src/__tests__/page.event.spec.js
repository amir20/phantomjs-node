/* eslint-disable no-use-before-define */

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
      port = server.address().port; // eslint-disable-line
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
    let ranHere = false;

    await page.on('onResourceReceived', () => {
      ranHere = true;
    });

    await page.open(`http://localhost:${port}/test`);

    expect(ranHere).toBe(true);
  });

  it('#on() event registered does not run if not triggered', async () => {
    const page = await phantom.createPage();
    let ranHere = false;

    await page.on('onResourceReceived', () => {
      ranHere = true;
    });

    expect(ranHere).toBe(false);
  });

  it('#on() can register more than one event of the same type', async () => {
    const page = await phantom.createPage();
    let ranHere = false;

    await page.on('onResourceReceived', () => {
      ranHere = true;
    });

    let runnedHereToo = false;

    await page.on('onResourceReceived', () => {
      runnedHereToo = true;
    });

    await page.open(`http://localhost:${port}/test`);

    expect(ranHere).toBe(true);
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
    let ranHere = false;

    // eslint-disable-next-line
    await page.on('onLoadFinished', true, function() {
      ranHere = true;
      ranInPhantomRuntime = true;
    });

    await page.open(`http://localhost:${port}/test`);

    let ranInPhantomRuntime = await phantom.windowProperty('ranInPhantomRuntime');

    expect(ranHere).toBe(false);
    expect(ranInPhantomRuntime).toBe(true);
  });

  it('#on() can pass parameters to functions to be executed in phantom runtime', async () => {
    const page = await phantom.createPage();

    await page.on(
      'onResourceReceived',
      true,
      function(status, param) { // eslint-disable-line
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

    // eslint-disable-next-line
    await page.on('onResourceReceived', true, function() {
      ranInPhantomRuntime = true;
    });

    let ranInPhantomRuntime = await phantom.windowProperty('ranInPhantomRuntime');

    expect(ranInPhantomRuntime).toBeFalsy();
  });

  it('#on() can register at the same event to run locally or in phantom runtime', async () => {
    const page = await phantom.createPage();
    let ranHere = false;

    // eslint-disable-next-line
    await page.on('onResourceReceived', true, function() {
      runnedInPhantomRuntime = true;
    });

    await page.on('onResourceReceived', () => {
      ranHere = true;
    });

    await page.open(`http://localhost:${port}/test`);

    let runnedInPhantomRuntime = await phantom.windowProperty('runnedInPhantomRuntime');

    expect(ranHere).toBe(true);
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

    // eslint-disable-next-line
    await page.on('onResourceReceived', true, function() {
      runnedInPhantomRuntime = true;
    });

    await page.off('onResourceReceived');

    await page.open(`http://localhost:${port}/test`);

    let runnedInPhantomRuntime = await phantom.windowProperty('runnedInPhantomRuntime');

    expect(runnedInPhantomRuntime).toBeFalsy();
  });
});
