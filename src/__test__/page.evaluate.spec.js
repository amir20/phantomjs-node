import http from 'http';
import 'babel-polyfill';
import Phantom from '../phantom';

describe('Page', () => {
    let server;
    let phantom;
    let port;
    beforeAll(done => {
        server = http.createServer((request, response) => {
            response.end('<html><head><title>Page Title</title></head><body>Test</body></html>');
        });

        server.listen(0, () => {
            port = server.address().port;
            done();
        });
    });

    afterAll(() => server.close());
    beforeEach(() => phantom = new Phantom());
    afterEach(() => phantom.exit());
    
    it('#evaluate(function(){return document.title}) executes correctly', async () => {
        let page = await phantom.createPage();
        await page.open(`http://localhost:${port}/test.html`);
        let response = await page.evaluate(function() {
            return document.title;
        });
        expect(response).toEqual('Page Title');
    });

    it('#evaluate(function(){...}) executes correctly', async () => {
        let page = await phantom.createPage();
        let response = await page.evaluate(function() {
            return 'test';
        });
        expect(response).toEqual('test');
    });

    it('#evaluate(function(arg){...}, argument) executes correctly with a non-null argument', async () => {
        let page = await phantom.createPage();
        let response = await page.evaluate(function(arg) {
            return 'Value: ' + arg;
        }, 'test');
        expect(response).toEqual('Value: test');
    });

    it('#evaluate(function(arg){...}, argument) executes correctly with a null argument', async () => {
        let page = await phantom.createPage();
        let response = await page.evaluate(function(arg) {
            return 'Value is null: ' + (arg === null);
        }, null);
        expect(response).toEqual('Value is null: true');
    });

    it('#evaluateAsync(function(){...}) executes correctly', async () => {
        let page = await phantom.createPage();
        await page.on('onCallback', function(response) {
            expect(response).toEqual('test');
        });
        await page.evaluateAsync(function() {
            window.callPhantom('test');
        });
    });

    it('#evaluateAsync(function(){...}) executes correctly with a delay and a non-null argument', async () => {
        let page = await phantom.createPage();
        await page.on('onCallback', function(response) {
            expect(response).toEqual('testarg');
        });
        await page.evaluateAsync(function(arg) {
            window.callPhantom('test' + arg);
        }, 0, 'arg');
    });

    it('#evaluateJavaScript(\'function(){return document.title}\') executes correctly', async () => {
        let page = await phantom.createPage();
        await page.open(`http://localhost:${port}/test.html`);
        let response = await page.evaluate('function () { return document.title }');
        expect(response).toEqual('Page Title');
    });

    it('#evaluateJavaScript(\'function(){...}\') executes correctly', async () => {
        let page = await phantom.createPage();
        let response = await page.evaluate('function () { return \'test\' }');
        expect(response).toEqual('test');
    });
});
