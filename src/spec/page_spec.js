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
            } else if (request.url === '/upload.html') {
                response.end('<html><head><title>Page Title</title></head><body><input type="file" id="upload" /></body></html>');
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

    it('#property(\'onResourceRequested\', function(){}, params...) passes parameters', function*() {
        let page = yield phantom.createPage();
        page.property('onResourceRequested', (requestData, networkRequest, foo, a, b) => {
            RESULT = [foo, a, b];
        }, 'foobar', 1, -100);
        yield page.open('http://localhost:8888/whatever');

        let RESULT = yield phantom.windowProperty('RESULT');
        expect(RESULT).toEqual(['foobar', 1, -100]);
    });

    it('#property(\'key\', value) sets property', function*() {
        let page = yield phantom.createPage();
        yield page.property('viewportSize', {width: 800, height: 600});
        let value = yield page.property('viewportSize');
        expect(value).toEqual({width: 800, height: 600});
    });

    it('#property(\'paperSize\', value) sets value properly with phantom.paperSize', function*() {
        let page = yield phantom.createPage();
        page.property('paperSize', {
            width: '8.5in',
            height: '11in',
            header: {
                height: "1cm",
                contents: phantom.callback(function (pageNum, numPages) {
                    return "<h1>Header <span style='float:right'>" + pageNum + " / " + numPages + "</span></h1>";
                })
            },
            footer: {
                height: "1cm",
                contents: phantom.callback(function (pageNum, numPages) {
                    return "<h1>Footer <span style='float:right'>" + pageNum + " / " + numPages + "</span></h1>";
                })
            }
        });

        yield page.open('http://localhost:8888/test');
        let file = 'test.pdf';
        yield page.render(file);
        expect(function () {
            fs.accessSync(file, fs.F_OK)
        }).not.toThrow();
        fs.unlinkSync(file);
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

    it('#evaluate(function(arg){...}, argument) executes correctly with a non-null argument', function*() {
        let page = yield phantom.createPage();
        let response = yield page.evaluate(function (arg) {
            return 'Value: ' + arg;
        }, 'test');
        expect(response).toEqual('Value: test');
    });

    it('#evaluate(function(arg){...}, argument) executes correctly with a null argument', function*() {
        let page = yield phantom.createPage();
        let response = yield page.evaluate(function (arg) {
            return 'Value is null: ' + (arg === null);
        }, null);
        expect(response).toEqual('Value is null: true');
    });

    it('#evaluateAsync(function(){...}) executes correctly', function*() {
        let page = yield phantom.createPage();
        yield page.on('onCallback', function (response) {
            expect(response).toEqual('test');
        });
        yield page.evaluateAsync(function () {
            window.callPhantom('test');
        });
    });

    it('#evaluateAsync(function(){...}) executes correctly with a delay and a non-null argument', function*() {
        let page = yield phantom.createPage();
        yield page.on('onCallback', function (response) {
            expect(response).toEqual('testarg');
        });
        yield page.evaluateAsync(function (arg) {
            window.callPhantom('test' + arg);
        }, 0, 'arg');
    });

    it('#evaluateJavaScript(\'function(){return document.title}\') executes correctly', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test.html');
        let response = yield page.evaluate('function () { return document.title }');
        expect(response).toEqual('Page Title');
    });

    it('#evaluateJavaScript(\'function(){...}\') executes correctly', function*() {
        let page = yield phantom.createPage();
        let response = yield page.evaluate('function () { return \'test\' }');
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
            yield phantom.execute('page', 'nonexistentCommand');
        } catch (e) {
            expect(e.message).toEqual("'nonexistentCommand' isn't a command.");
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

    it('#windowProperty() returns a window value', function*() {
        let page = yield phantom.createPage();

        yield page.property('onResourceReceived', function (response) {
            lastResponse = response;
        });
        yield page.open('http://localhost:8888/test');
        let lastResponse = yield phantom.windowProperty('lastResponse');
        expect(lastResponse.url).toEqual('http://localhost:8888/test');
    });

    it('#setContent() works with custom url', function*() {
        let page = yield phantom.createPage();
        let html = '<html><head><title>setContent Title</title></head><body></body></html>';

        yield page.setContent(html, 'http://localhost:8888/');

        let response = yield page.evaluate(function () {
            return [document.title, location.href];
        });

        expect(response).toEqual(['setContent Title', 'http://localhost:8888/']);
    });

    it('#sendEvent() sends an event', function*() {
        let page = yield phantom.createPage();
        let html = '<html  onclick="docClicked = true;"><head><title>setContent Title</title></head><body></body></html>';

        yield page.setContent(html, 'http://localhost:8888/');
        yield page.sendEvent('click', 1, 2);

        let response = yield page.evaluate(function () {
            return window.docClicked;
        });

        expect(response).toBe(true);
    });

    it('#on() can register an event in the page and run the code locally', function*() {
        let page = yield phantom.createPage();
        let runnedHere = false;

        yield page.on('onResourceReceived', function () {
            runnedHere = true;
        });

        yield page.open('http://localhost:8888/test');

        expect(runnedHere).toBe(true);
    });

    it('#on() event registered does not run if not triggered', function*() {
        let page = yield phantom.createPage();
        let runnedHere = false;

        yield page.on('onResourceReceived', function () {
            runnedHere = true;
        });

        expect(runnedHere).toBe(false);
    });

    it('#on() can register more than one event of the same type', function*() {
        let page = yield phantom.createPage();
        let runnedHere = false;

        yield page.on('onResourceReceived', function () {
            runnedHere = true;
        });

        let runnedHereToo = false;

        yield page.on('onResourceReceived', function () {
            runnedHereToo = true;
        });

        yield page.open('http://localhost:8888/test');

        expect(runnedHere).toBe(true);
        expect(runnedHereToo).toBe(true);
    });

    it('#on() can pass parameters', function*() {
        let page = yield phantom.createPage();
        let parameterProvided = false;

        yield page.on('onResourceReceived', function (status, param) {
            parameterProvided = param;
        }, 'param');

        yield page.open('http://localhost:8888/test');

        expect(parameterProvided).toBe('param');
    });

    it('#on() can register an event in the page which code runs in phantom runtime', function*() {
        let page = yield phantom.createPage();
        let runnedHere = false;

        yield page.on('onLoadFinished', true, function () {
            runnedHere = true;
            runnedInPhantomRuntime = true;
        });

        yield page.open('http://localhost:8888/test');

        let runnedInPhantomRuntime = yield phantom.windowProperty('runnedInPhantomRuntime');

        expect(runnedHere).toBe(false);
        expect(runnedInPhantomRuntime).toBe(true);
    });

    it('#on() can pass parameters to functions to be executed in phantom runtime', function*() {
        let page = yield phantom.createPage();

        yield page.on('onResourceReceived', true, function (status, param) {
            parameterProvided = param;
        }, 'param');

        yield page.open('http://localhost:8888/test');

        let parameterProvided = yield phantom.windowProperty('parameterProvided');

        expect(parameterProvided).toBe('param');
    });

    it('#on() event supposed to run in phantom runtime wont run if not triggered', function*() {
        let page = yield phantom.createPage();

        yield page.on('onResourceReceived', true, function () {
            runnedInPhantomRuntime = true;
        });

        let runnedInPhantomRuntime = yield phantom.windowProperty('runnedInPhantomRuntime');

        expect(runnedInPhantomRuntime).toBeFalsy();
    });

    it('#on() can register at the same event to run locally or in phantom runtime', function*() {
        let page = yield phantom.createPage();
        let runnedHere = false;

        yield page.on('onResourceReceived', true, function () {
            runnedInPhantomRuntime = true;
        });

        yield page.on('onResourceReceived', function () {
            runnedHere = true;
        });

        yield page.open('http://localhost:8888/test');

        let runnedInPhantomRuntime = yield phantom.windowProperty('runnedInPhantomRuntime');

        expect(runnedHere).toBe(true);
        expect(runnedInPhantomRuntime).toBe(true);
    });

    it('#off() can disable an event whose listener is going to run locally', function*() {

        let page = yield phantom.createPage();
        let runnedHere = false;

        yield page.on('onResourceReceived', function () {
            runnedHere = true;
        });

        yield page.off('onResourceReceived');

        yield page.open('http://localhost:8888/test');

        expect(runnedHere).toBe(false);
    });

    it('#off() can disable an event whose listener is going to run on the phantom process', function*() {

        let page = yield phantom.createPage();

        yield page.on('onResourceReceived', true, function () {
            runnedInPhantomRuntime = true;
        });

        yield page.off('onResourceReceived');

        yield page.open('http://localhost:8888/test');

        let runnedInPhantomRuntime = yield phantom.windowProperty('runnedInPhantomRuntime');

        expect(runnedInPhantomRuntime).toBeFalsy();
    });

    it('#switchToFrame(framePosition) will switch to frame of framePosition', function*() {
        let page = yield phantom.createPage();
        let html = '<html><head><title>Iframe Test</title></head><body><iframe id="testframe" src="http://localhost:8888/test.html"></iframe></body></html>';

        yield page.setContent(html, 'http://localhost:8888/');
        yield page.switchToFrame(0);

        let inIframe = yield page.evaluate(function () {
            // are we in the iframe?
            return window.frameElement && window.frameElement.id === 'testframe';
        });

        // confirm we are in an iframe
        expect(inIframe).toBe(true);
    });

    it('#switchToMainFrame() will switch back to the main frame', function*() {
        let page = yield phantom.createPage();
        let html = '<html><head><title>Iframe Test</title></head><body><iframe id="testframe" src="http://localhost:8888/test.html"></iframe></body></html>';

        yield page.setContent(html, 'http://localhost:8888/');
        // need to switch to child frame here to test switchToMainFrame() works
        yield page.switchToFrame(0);
        yield page.switchToMainFrame();

        let inMainFrame = yield page.evaluate(function () {
            // are we in the main frame?
            return !window.frameElement;
        });

        // confirm we are in the main frame
        expect(inMainFrame).toBe(true);
    });

    it('#reload() will reload the current page', function*() {
        let page = yield phantom.createPage();
        let reloaded = false;

        yield page.open('http://localhost:8888/test');
        yield page.on('onNavigationRequested', function (url, type) {
            if (type === 'Reload') {
                reloaded = true;
            }
        });
        yield page.reload();

        expect(reloaded).toBe(true);
    });

    it('#invokeAsyncMethod(\'includeJs\', \'http://localhost:8888/script.js\') executes correctly', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test');
        yield page.invokeAsyncMethod('includeJs', 'http://localhost:8888/script.js');
        let response = yield page.evaluate(function () {
            return fooBar; // eslint-disable-line no-undef
        });
        expect(response).toEqual(2);
    });

    it('#invokeAsyncMethod(\'open\', \'http://localhost:8888/test\') executes correctly', function*() {
        let page = yield phantom.createPage();
        let status = yield page.invokeAsyncMethod('open', 'http://localhost:8888/test');
        expect(status).toEqual('success');
    });

    it('#invokeMethod(\'evaluate\', \'function () { return document.title }\') executes correctly', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test.html');
        let response = yield page.invokeMethod('evaluate', 'function () { return document.title }');
        expect(response).toEqual('Page Title');
    });

    it('#invokeMethod(\'renderBase64\') executes correctly', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/test');
        let content = yield page.invokeMethod('renderBase64', 'PNG');
        expect(content).not.toBeNull();
    });

    it('#defineMethod(name, definition) defines a method', function*() {
        let page = yield phantom.createPage();
        yield page.defineMethod('getZoomFactor', function () {
            return this.zoomFactor; // eslint-disable-line no-invalid-this
        });
        let zoomFactor = yield page.invokeMethod('getZoomFactor');
        expect(zoomFactor).toEqual(1);
    });

    it('#openUrl() opens a URL', function (done) {
        phantom.createPage().then(function (page) {
            page.on('onLoadFinished', false, function (status) {
                expect(status).toEqual('success');
                done();
            });
            return page.openUrl('http://localhost:8888/test', 'GET', {});
        });
    });

    it('#setProxy() sets the proxy', function*() {
        let page = yield phantom.createPage();
        yield page.setProxy('http://localhost:8888');
        yield page.open('http://phantomjs.org/');
        let text = yield page.property('plainText');
        expect(text).toEqual('hi, http://phantomjs.org/');
    });

    it('this.property = something shows a warning', function*() {
        if (typeof Proxy === 'function') {
            let logger = jasmine.createSpyObj('logger', ['debug', 'info', 'warn', 'error']);

            let pp = new Phantom([], {logger});
            let page = yield pp.createPage();

            try {
                page.foo = 'test';
            } catch (e) {
                expect(e).toEqual(jasmine.any(TypeError));
            } finally {
                expect(logger.warn).toHaveBeenCalledWith(jasmine.any(String));
                pp.exit();
            }
        }
    });

    it('#goBack()', function (done) {
        let page;
        phantom.createPage().then(function (instance) {
            page = instance;
            return page.open('http://localhost:8888/test1');
        }).then(function () {
            return page.open('http://localhost:8888/test2')
        }).then(function () {
            page.on('onNavigationRequested', false, function () {
                done();
            });
            return page.goBack();
        });
    });

    it('#uploadFile() inserts file into file input field', function*() {
        let page = yield phantom.createPage();
        yield page.open('http://localhost:8888/upload.html');
        yield page.uploadFile('#upload', process.env.PWD + '/package.json');
        let response = yield page.evaluate(function () {
            return document.querySelector("#upload").files[0].name;
        });
        expect(response).toEqual('package.json');
    });

});
