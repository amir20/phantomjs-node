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
      port = server.address().port; // eslint-disable-line
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
});
