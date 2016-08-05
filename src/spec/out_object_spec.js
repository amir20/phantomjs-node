import http from "http";
import Phantom from "../phantom";
import "babel-polyfill";
import OutObject from "../out_object";

require('jasmine-co').install();

describe('Command', () => {
    let server;
    let phantom;
    beforeAll(done => {
        server = http.createServer((request, response) => response.end('hi, ' + request.url));
        server.listen(8888, done);
    });

    afterAll(() => server.close());
    beforeEach(() => phantom = new Phantom());
    afterEach(() => phantom.exit());

    it('target to be set', () => {
        expect(phantom.createOutObject().target).toEqual(jasmine.any(String));
    });

    it('#createOutObject() is a valid OutObject', () => {
        let outObj = phantom.createOutObject();
        expect(outObj).toEqual(jasmine.any(OutObject));
    });

    it('#property() returns a value set by phantom', function*() {
        let page = yield phantom.createPage();
        let outObj = phantom.createOutObject();

        yield page.property('onResourceReceived', function (response, out) {
            out.lastResponse = response;
        }, outObj);

        yield page.open('http://localhost:8888/test');

        let lastResponse = yield outObj.property('lastResponse');

        expect(lastResponse.url).toEqual('http://localhost:8888/test');
    });

    it('#property() returns a value set by phantom and node', function*() {
        let page = yield phantom.createPage();
        let outObj = phantom.createOutObject();

        outObj.test = 'fooBar$';

        yield page.property('onResourceReceived', function (response, out) {
            out.data = out.test + response.url;
        }, outObj);

        yield page.open('http://localhost:8888/test2');
        let data = yield outObj.property('data');
        expect(data).toEqual('fooBar$http://localhost:8888/test2');
    });

    it('#property() works with input params', function*() {
        let page = yield phantom.createPage();
        let outObj = phantom.createOutObject();

        yield page.property('onResourceReceived', function (response, test, out) {
            out.data = test;
        }, 'test', outObj);

        yield page.open('http://localhost:8888/test2');
        let data = yield outObj.property('data');
        expect(data).toEqual('test');
    });
});
