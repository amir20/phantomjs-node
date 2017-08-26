import http from 'http';
import 'babel-polyfill';
import Phantom from '../phantom';
import OutObject from '../out_object';

describe('Command', () => {
  let server;
  let phantom;
  let port;
  beforeAll((done) => {
    server = http.createServer((request, response) => response.end(`hi, ${request.url}`));
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

  it('target to be set', () => {
    expect(phantom.createOutObject().target).toBeDefined();
  });

  it('#createOutObject() is a valid OutObject', () => {
    const outObj = phantom.createOutObject();
    expect(outObj).toBeInstanceOf(OutObject);
  });

  it('#property() returns a value set by phantom', async () => {
    const page = await phantom.createPage();
    const outObj = phantom.createOutObject();

    await page.property('onResourceReceived', (response, out) => {
      out.lastResponse = response; // eslint-disable-line no-param-reassign
    }, outObj);

    await page.open(`http://localhost:${port}/test`);

    const lastResponse = await outObj.property('lastResponse');

    expect(lastResponse.url).toEqual(`http://localhost:${port}/test`);
  });

  it('#property() returns a value set by phantom and node', async () => {
    const page = await phantom.createPage();
    const outObj = phantom.createOutObject();

    outObj.test = 'fooBar$';

    await page.property('onResourceReceived', (response, out) => {
      out.data = out.test + response.url; // eslint-disable-line no-param-reassign
    }, outObj);

    await page.open(`http://localhost:${port}/test2`);
    const data = await outObj.property('data');
    expect(data).toEqual(`fooBar$http://localhost:${port}/test2`);
  });

  it('#property() works with input params', async () => {
    const page = await phantom.createPage();
    const outObj = phantom.createOutObject();

    await page.property('onResourceReceived', (response, test, out) => {
      out.data = test; // eslint-disable-line no-param-reassign
    }, 'test', outObj);

    await page.open(`http://localhost:${port}/test2`);
    const data = await outObj.property('data');
    expect(data).toEqual('test');
  });
});
