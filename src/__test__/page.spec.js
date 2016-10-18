import http from 'http';
import fs from 'fs';
import Phantom from '../phantom';
import 'babel-polyfill';

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
                response.end('<html><head><title>Page Title</title></head><body>' +
                    '<input type="file" id="upload" /></body></html>');
            } else {
                response.end('hi, ' + request.url);
            }
        });
        server.listen(8888, done);
    });

    afterAll(() => server.close());
    beforeEach(() => phantom = new Phantom());
    afterEach(() => phantom.exit());

    it('#open() a valid page', async () => {
        let page = await phantom.createPage();
        let status = await page.open('http://localhost:8888/test');
        expect(status).toEqual('success');
    });

    it('#property(\'plainText\') returns valid content', async () => {
        let page = await phantom.createPage();
        await page.open('http://localhost:8888/test');
        let content = await page.property('plainText');
        expect(content).toEqual('hi, /test');
    });

    it('#property(\'onResourceRequested\', function(){}) sets property', async () => {
        let page = await phantom.createPage();
        await page.property('onResourceRequested', function(requestData, networkRequest) {
            networkRequest.changeUrl('http://localhost:8888/foo-bar-xyz');
        });
        await page.open('http://localhost:8888/whatever');
        let content = await page.property('plainText');
        expect(content).toEqual('hi, /foo-bar-xyz'); // should have been changed to /foo-bar-xyz
    });

    it('#property(\'onResourceRequested\', function(){}, params...) passes parameters', async () => {
        let page = await phantom.createPage();
        page.property('onResourceRequested', function(requestData, networkRequest, foo, a, b) {
            RESULT = [foo, a, b];
        }, 'foobar', 1, -100);
        await page.open('http://localhost:8888/whatever');

        let RESULT = await phantom.windowProperty('RESULT');
        expect(RESULT).toEqual(['foobar', 1, -100]);
    });

    it('#property(\'key\', value) sets property', async () => {
        let page = await phantom.createPage();
        await page.property('viewportSize', {width: 800, height: 600});
        let value = await page.property('viewportSize');
        expect(value).toEqual({width: 800, height: 600});
    });

    it('#property(\'paperSize\', value) sets value properly with phantom.paperSize', async () => {
        let page = await phantom.createPage();
        page.property('paperSize', {
            width: '8.5in',
            height: '11in',
            header: {
                height: '1cm',
                contents: phantom.callback(function(pageNum, numPages) {
                    return "<h1>Header <span style='float:right'>" + pageNum + ' / ' + numPages + '</span></h1>';
                }),
            },
            footer: {
                height: '1cm',
                contents: phantom.callback(function(pageNum, numPages) {
                    return "<h1>Footer <span style='float:right'>" + pageNum + ' / ' + numPages + '</span></h1>';
                }),
            },
        });

        await page.open('http://localhost:8888/test');
        let file = 'test.pdf';
        await page.render(file);
        expect(function() {
            fs.accessSync(file, fs.F_OK);
        }).not.toThrow();
        fs.unlinkSync(file);
    });

    it('#setting(\'javascriptEnabled\') returns true', async () => {
        let page = await phantom.createPage();
        let value = await page.setting('javascriptEnabled');
        expect(value).toBe(true);
    });

    it('#setting(\'key\', value) sets setting', async () => {
        let page = await phantom.createPage();
        await page.setting('javascriptEnabled', false);
        let value = await page.setting('javascriptEnabled');
        expect(value).toBe(false);
    });


    it('#injectJs() properly injects a js file', async () => {
        let page = await phantom.createPage();
        await page.open('http://localhost:8888/test');
        // inject_example.js: window.foo = 1;
        await page.injectJs(__dirname + '/inject_example.js');

        let response = await page.evaluate(function() {
            return foo; // eslint-disable-line no-undef
        });

        expect(response).toEqual(1);
    });

    it('#includeJs() properly injects a js file', async () => {
        let page = await phantom.createPage();
        await page.open('http://localhost:8888/test');
        await page.includeJs('http://localhost:8888/script.js');
        let response = await page.evaluate(function() {
            return fooBar; // eslint-disable-line no-undef
        });
        expect(response).toEqual(2);
    });

    it('#render() creates a file', async () => {
        let page = await phantom.createPage();
        await page.open('http://localhost:8888/test');
        let file = 'test.png';
        await page.render(file);
        expect(function() {
            fs.accessSync(file, fs.F_OK);
        }).not.toThrow();
        fs.unlinkSync(file);
    });

    it('#renderBase64() returns encoded PNG', async () => {
        let page = await phantom.createPage();
        await page.open('http://localhost:8888/test');
        let content = await  page.renderBase64('PNG');
        expect(content).not.toBeNull();
    });

    it('#addCookie() adds a cookie to the page', async () => {
        let page = await phantom.createPage();
        await page.addCookie({
            'name': 'Valid-Cookie-Name',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': (new Date()).getTime() + (1000 * 60 * 60),
        });
        let cookies = await page.property('cookies');
        expect(cookies[0].name).toEqual('Valid-Cookie-Name');
    });

    it('#clearCookies() removes all cookies', async () => {
        let page = await phantom.createPage();

        // Probably not the best test if this method doesn't work
        await page.addCookie({
            'name': 'Valid-Cookie-Name',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': (new Date()).getTime() + (1000 * 60 * 60),
        });

        await page.clearCookies();
        let cookies = await page.property('cookies');
        expect(cookies).toEqual([]);
    });

    it('#deleteCookie() removes one cookie', async () => {
        let page = await phantom.createPage();

        // Probably not the best test if this method doesn't work
        await page.addCookie({
            'name': 'cookie-1',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': (new Date()).getTime() + (1000 * 60 * 60),
        });

        await page.addCookie({
            'name': 'cookie-2',
            'value': 'Valid-Cookie-Value',
            'domain': 'localhost',
            'path': '/foo',
            'httponly': true,
            'secure': false,
            'expires': (new Date()).getTime() + (1000 * 60 * 60),
        });

        let cookies = await page.property('cookies');
        expect(cookies.length).toBe(2);

        await page.deleteCookie('cookie-1');
        cookies = await page.property('cookies');

        expect(cookies.length).toBe(1);
        expect(cookies[0].name).toEqual('cookie-2');
    });

    it('#reject(...) works when there is an error', async () => {
        try {
            await phantom.execute('page', 'nonexistentCommand');
        } catch (e) {
            expect(e.message).toEqual("'nonexistentCommand' isn't a command.");
        }
    });

    it('#open opens multiple pages', async () => {
        let page1 = await phantom.createPage();
        await page1.open('http://localhost:8888/test1');
        page1.close();

        let page2 = await phantom.createPage();
        await page2.open('http://localhost:8888/test2');
        let content = await page2.property('plainText');
        expect(content).toEqual('hi, /test2');
        page2.close();
    });

    it('#windowProperty() returns a window value', async () => {
        let page = await phantom.createPage();

        await page.property('onResourceReceived', function(response) {
            lastResponse = response;
        });
        await page.open('http://localhost:8888/test');
        let lastResponse = await phantom.windowProperty('lastResponse');
        expect(lastResponse.url).toEqual('http://localhost:8888/test');
    });

    it('#setContent() works with custom url', async () => {
        let page = await phantom.createPage();
        let html = '<html><head><title>setContent Title</title></head><body></body></html>';

        await page.setContent(html, 'http://localhost:8888/');

        let response = await page.evaluate(function() {
            return [document.title, location.href];
        });

        expect(response).toEqual(['setContent Title', 'http://localhost:8888/']);
    });

    it('#sendEvent() sends an event', async () => {
        let page = await phantom.createPage();
        let html = '<html  onclick="docClicked = true;"><head><title>setContent Title</title>' +
            '</head><body></body></html>';

        await page.setContent(html, 'http://localhost:8888/');
        await page.sendEvent('click', 1, 2);

        let response = await page.evaluate(function() {
            return window.docClicked;
        });

        expect(response).toBe(true);
    });


    it('#switchToFrame(framePosition) will switch to frame of framePosition', async () => {
        let page = await phantom.createPage();
        let html = '<html><head><title>Iframe Test</title></head><body>' +
            '<iframe id="testframe" src="http://localhost:8888/test.html"></iframe></body></html>';

        await page.setContent(html, 'http://localhost:8888/');
        await page.switchToFrame(0);

        let inIframe = await page.evaluate(function() {
            // are we in the iframe?
            return window.frameElement && window.frameElement.id === 'testframe';
        });

        // confirm we are in an iframe
        expect(inIframe).toBe(true);
    });

    it('#switchToMainFrame() will switch back to the main frame', async () => {
        let page = await phantom.createPage();
        let html = '<html><head><title>Iframe Test</title></head><body>' +
            '<iframe id="testframe" src="http://localhost:8888/test.html"></iframe></body></html>';

        await page.setContent(html, 'http://localhost:8888/');
        // need to switch to child frame here to test switchToMainFrame() works
        await page.switchToFrame(0);
        await page.switchToMainFrame();

        let inMainFrame = await page.evaluate(function() {
            // are we in the main frame?
            return !window.frameElement;
        });

        // confirm we are in the main frame
        expect(inMainFrame).toBe(true);
    });

    it('#reload() will reload the current page', async () => {
        let page = await phantom.createPage();
        let reloaded = false;

        await page.open('http://localhost:8888/test');
        await page.on('onNavigationRequested', function(url, type) {
            if (type === 'Reload') {
                reloaded = true;
            }
        });
        await page.reload();

        expect(reloaded).toBe(true);
    });

    it('#invokeAsyncMethod(\'includeJs\', \'http://localhost:8888/script.js\') executes correctly', async () => {
        let page = await phantom.createPage();
        await page.open('http://localhost:8888/test');
        await page.invokeAsyncMethod('includeJs', 'http://localhost:8888/script.js');
        let response = await page.evaluate(function() {
            return fooBar; // eslint-disable-line no-undef
        });
        expect(response).toEqual(2);
    });

    it('#invokeAsyncMethod(\'open\', \'http://localhost:8888/test\') executes correctly', async () => {
        let page = await phantom.createPage();
        let status = await page.invokeAsyncMethod('open', 'http://localhost:8888/test');
        expect(status).toEqual('success');
    });

    it('#invokeMethod(\'evaluate\', \'function () { return document.title }\') executes correctly', async () => {
        let page = await phantom.createPage();
        await page.open('http://localhost:8888/test.html');
        let response = await page.invokeMethod('evaluate', 'function () { return document.title }');
        expect(response).toEqual('Page Title');
    });

    it('#invokeMethod(\'renderBase64\') executes correctly', async () => {
        let page = await phantom.createPage();
        await page.open('http://localhost:8888/test');
        let content = await page.invokeMethod('renderBase64', 'PNG');
        expect(content).not.toBeNull();
    });

    it('#defineMethod(name, definition) defines a method', async () => {
        let page = await phantom.createPage();
        await page.defineMethod('getZoomFactor', function() {
            return this.zoomFactor; // eslint-disable-line no-invalid-this
        });
        let zoomFactor = await page.invokeMethod('getZoomFactor');
        expect(zoomFactor).toEqual(1);
    });

    it('#openUrl() opens a URL', function(done) {
        phantom.createPage().then(function(page) {
            page.on('onLoadFinished', false, function(status) {
                expect(status).toEqual('success');
                done();
            });
            return page.openUrl('http://localhost:8888/test', 'GET', {});
        });
    });

    it('#setProxy() sets the proxy', async () => {
        let page = await phantom.createPage();
        await page.setProxy('http://localhost:8888');
        await page.open('http://phantomjs.org/');
        let text = await page.property('plainText');
        expect(text).toEqual('hi, http://phantomjs.org/');
    });

    it('#property = something shows a warning', async () => {
        if (typeof Proxy === 'function') {
            let logger = {warn: jest.fn()};

            let pp = new Phantom([], {logger});
            let page = await pp.createPage();

            try {
                page.foo = 'test';
            } catch (e) {
                expect(e).toBeInstanceOf(TypeError);
            } finally {
                expect(logger.warn).toHaveBeenCalled();
                pp.exit();
            }
        }
    });

    it('#goBack()', function(done) {
        let page;
        phantom.createPage().then(function(instance) {
            page = instance;
            return page.open('http://localhost:8888/test1');
        }).then(function() {
            return page.open('http://localhost:8888/test2');
        }).then(function() {
            page.on('onNavigationRequested', false, function() {
                done();
            });
            return page.goBack();
        });
    });

    it('#uploadFile() inserts file into file input field', async () => {
        let page = await phantom.createPage();
        await page.open('http://localhost:8888/upload.html');
        await page.uploadFile('#upload', process.env.PWD + '/package.json');
        let response = await page.evaluate(function() {
            return document.querySelector('#upload').files[0].name;
        });
        expect(response).toEqual('package.json');
    });

});
