import "babel-polyfill"
import http from "http";
import fs from "fs";
import Phantom from "../phantom";

require('jasmine-co').install();

describe('Page', () => {
    let server;
    let phantom;
    beforeAll(done => {
        server = http.createServer((request, response) => {
            if (request.url === '/script.js') {
                response.end('window.fooBar = 2;');
            } else {
                response.end('hi, ' + request.url);
            }
        });
        server.listen(8888, done);
    });

    afterAll(() => server.close());
    beforeEach(() => phantom = new Phantom());
    afterEach(() => phantom.exit());

    it('#open() a valid page', function*() {
        let page = yield phantom.createPage();
        let status = yield page.open('http://localhost:8888/test');
        expect(status).toEqual('success');
    });

    it('#property(\'plainText\') returns valid content', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test');
        let content = yield page.property('plainText');
        expect(content).toEqual('hi, /test');
    });

    it('#property(\'onResourceRequested\', function(){}) sets property', function*() {
        let page = yield phantom.createPage();
        yield page.property('onResourceRequested', (requestData, networkRequest) => {
            page.foo = requestData.url;
        });
        yield page.open('http://localhost:8888/foo-bar-xyz');
        let value = yield page.property('foo');
        expect(value).toEqual('http://localhost:8888/foo-bar-xyz');
    });

    it('#property(\'key\', value) sets property', function*() {
        let page = yield phantom.createPage();
        yield page.property('viewportSize', {width: 800, height: 600});
        let value = yield page.property('viewportSize');
        expect(value).toEqual({width: 800, height: 600});
    });

    it('#setting(\'javascriptEnabled\') returns true', function*() {
        let page = yield phantom.createPage();
        let value = yield page.setting('javascriptEnabled');
        expect(value).toBe(true);
    });

    it('#setting(\'key\', value) sets setting', function*() {
        let page = yield phantom.createPage();
        yield page.setting('javascriptEnabled', false);
        let value = yield page.setting('javascriptEnabled');
        expect(value).toBe(false);
    });

    it('#evaluate(function(){...}) executes correctly', function*() {
        let page = yield phantom.createPage();
        let response = yield page.evaluate(function () {
            return 'test'
        });
        expect(response).toEqual('test');
    });

    it('#injectJs() properly injects a js file', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test');
        // inject_example.js: window.foo = 1;
        yield page.injectJs(__dirname + '/inject_example.js');

        let response = yield page.evaluate(function () {
            return foo;
        });

        expect(response).toEqual(1);
    });

    it('#includeJs() properly injects a js file', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test');
        yield page.includeJs('http://localhost:8888/script.js');
        let response = yield page.evaluate(function () {
            return fooBar;
        });
        expect(response).toEqual(2);
    });

    it('#render() creates a file', function* () {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test');
        let file = 'test.png';
        yield page.render(file);
        expect(function(){fs.accessSync(file, fs.F_OK)}).not.toThrow();
        fs.unlinkSync(file);
    });

    it('#renderBase64() returns encoded PNG', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test');
        let content = yield  page.renderBase64('PNG');
        expect(content).not.toBeNull();
    });
});

