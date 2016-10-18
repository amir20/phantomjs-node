import http from 'http';
import Phantom from '../phantom';
import 'babel-polyfill';
import OutObject from '../out_object';

describe('Command', () => {
    let server;
    let phantom;
    beforeAll(done => {
        server = http.createServer((request, response) => response.end('hi, ' + request.url));
        server.listen(8898, done);
    });

    afterAll(() => server.close());
    beforeEach(() => phantom = new Phantom());
    afterEach(() => phantom.exit());

    it('target to be set', () => {
        expect(phantom.createOutObject().target).toBeDefined();
    });

    it('#createOutObject() is a valid OutObject', () => {
        let outObj = phantom.createOutObject();
        expect(outObj).toBeInstanceOf(OutObject);
    });

    it('#property() returns a value set by phantom', async () => {
        let page = await phantom.createPage();
        let outObj = phantom.createOutObject();

        await page.property('onResourceReceived', function(response, out) {
            out.lastResponse = response;
        }, outObj);

        await page.open('http://localhost:8898/test');

        let lastResponse = await outObj.property('lastResponse');

        expect(lastResponse.url).toEqual('http://localhost:8898/test');
    });

    it('#property() returns a value set by phantom and node', async () => {
        let page = await phantom.createPage();
        let outObj = phantom.createOutObject();

        outObj.test = 'fooBar$';

        await page.property('onResourceReceived', function(response, out) {
            out.data = out.test + response.url;
        }, outObj);

        await page.open('http://localhost:8898/test2');
        let data = await outObj.property('data');
        expect(data).toEqual('fooBar$http://localhost:8898/test2');
    });

    it('#property() works with input params', async () => {
        let page = await phantom.createPage();
        let outObj = phantom.createOutObject();

        await page.property('onResourceReceived', function(response, test, out) {
            out.data = test;
        }, 'test', outObj);

        await page.open('http://localhost:8898/test2');
        let data = await outObj.property('data');
        expect(data).toEqual('test');
    });
});
