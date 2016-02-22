import http from "http";
import fs from "fs";
import Phantom from "../phantom";
import "babel-polyfill";

require('jasmine-co').install();

describe('Page', () => {
    let server;
    let phantom;
    beforeAll(done => {
        server = http.createServer((request, response) => {
            if (request.url === '/script.js') {
                response.end('window.fooBar = 2;');
            } else if (request.url === '/test.html') {
                response.end('<html><head><title>Page Title</title></head><body>Test</body></html>');
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
            networkRequest.changeUrl('http://localhost:8888/foo-bar-xyz');
        });
        yield page.open('http://localhost:8888/whatever');
        let content = yield page.property('plainText');
        expect(content).toEqual('hi, /foo-bar-xyz'); // should have been changed to /foo-bar-xyz
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

    it('#evaluate(function(){return document.title}) executes correctly', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test.html');
        let response = yield page.evaluate(function () {
            return document.title
        });
        expect(response).toEqual('Page Title');
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
            return foo; // eslint-disable-line no-undef
        });

        expect(response).toEqual(1);
    });

    it('#includeJs() properly injects a js file', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test');
        yield page.includeJs('http://localhost:8888/script.js');
        let response = yield page.evaluate(function () {
            return fooBar; // eslint-disable-line no-undef
        });
        expect(response).toEqual(2);
    });

    it('#render() creates a file', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test');
        let file = 'test.png';
        yield page.render(file);
        expect(function () {
            fs.accessSync(file, fs.F_OK)
        }).not.toThrow();
        fs.unlinkSync(file);
    });

    it('#renderBase64() returns encoded PNG', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test');
        let content = yield  page.renderBase64('PNG');
        expect(content).not.toBeNull();
    });

    it('#addCookie() adds a cookie to the page', function*() {
        let page = yield phantom.createPage();
        yield page.addCookie({
            'name': 'Valid-Cookie-Name',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': (new Date()).getTime() + (1000 * 60 * 60)
        });
        let cookies = yield page.property('cookies');
        expect(cookies[0].name).toEqual('Valid-Cookie-Name');
    });

    it('#clearCookies() removes all cookies', function*() {
        let page = yield phantom.createPage();

        // Probably not the best test if this method doesn't work
        yield page.addCookie({
            'name': 'Valid-Cookie-Name',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': (new Date()).getTime() + (1000 * 60 * 60)
        });

        yield page.clearCookies();
        let cookies = yield page.property('cookies');
        expect(cookies).toEqual([]);
    });

    it('#deleteCookie() removes one cookie', function*() {
        let page = yield phantom.createPage();

        // Probably not the best test if this method doesn't work
        yield page.addCookie({
            'name': 'cookie-1',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': (new Date()).getTime() + (1000 * 60 * 60)
        });

        yield page.addCookie({
            'name': 'cookie-2',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': (new Date()).getTime() + (1000 * 60 * 60)
        });

        let cookies = yield page.property('cookies');
        expect(cookies.length).toBe(2);

        yield page.deleteCookie('cookie-1');
        cookies = yield page.property('cookies');

        expect(cookies.length).toBe(1);
        expect(cookies[0].name).toEqual('cookie-2');
    });

    it('#reject(...) works when there is an error', function*() {
        try {
            yield phantom.execute('phantom', 'doesNotExist');
        } catch (e) {
            expect(e.message).toEqual("undefined is not an object (evaluating 'method.apply')");
        }
    });

    it('multiple pages can be opened', function*() {
        let page1 = yield phantom.createPage();
        yield page1.open('http://localhost:8888/test1');
        page1.close();

        let page2 = yield phantom.createPage();
        yield page2.open('http://localhost:8888/test2');
        let content = yield page2.property('plainText');
        expect(content).toEqual('hi, /test2');
        page2.close();
    });

    fit('#evaluate(function(){...}) executes correctly', function*() {
        let page = yield phantom.createPage();

        yield page.property('onResourceReceived', function (response) {
            lastResponse = response;
        });

        yield page.open('http://amirraminfar.com/');
        
        let lastResponse = yield page.eval('lastResponse');

        console.log(lastResponse);
    });
});

