import http from 'http';
import Phantom from '../phantom';
import 'babel-polyfill';

describe('Page', () => {
    let server;
    let phantom;
    let port;
    beforeAll(done => {
        server = http.createServer((request, response) => {
            response.end('hi, ' + request.url);
        });
        server.listen(0, () => {
            port = server.address().port;
            done();
        });
    });

    afterAll(() => server.close());
    beforeEach(() => phantom = new Phantom());
    afterEach(() => phantom.exit());
    

    it('#on() can register an event in the page and run the code locally', async () => {
        let page = await phantom.createPage();
        let runnedHere = false;

        await page.on('onResourceReceived', function() {
            runnedHere = true;
        });

        await page.open(`http://localhost:${port}/test`);

        expect(runnedHere).toBe(true);
    });

    it('#on() event registered does not run if not triggered', async () => {
        let page = await phantom.createPage();
        let runnedHere = false;

        await page.on('onResourceReceived', function() {
            runnedHere = true;
        });

        expect(runnedHere).toBe(false);
    });

    it('#on() can register more than one event of the same type', async () => {
        let page = await phantom.createPage();
        let runnedHere = false;

        await page.on('onResourceReceived', function() {
            runnedHere = true;
        });

        let runnedHereToo = false;

        await page.on('onResourceReceived', function() {
            runnedHereToo = true;
        });

        await page.open(`http://localhost:${port}/test`);

        expect(runnedHere).toBe(true);
        expect(runnedHereToo).toBe(true);
    });

    it('#on() can pass parameters', async () => {
        let page = await phantom.createPage();
        let parameterProvided = false;

        await page.on('onResourceReceived', function(status, param) {
            parameterProvided = param;
        }, 'param');

        await page.open(`http://localhost:${port}/test`);

        expect(parameterProvided).toBe('param');
    });

    it('#on() can register an event in the page which code runs in phantom runtime', async () => {
        let page = await phantom.createPage();
        let runnedHere = false;

        await page.on('onLoadFinished', true, function() {
            runnedHere = true;
            runnedInPhantomRuntime = true;
        });

        await page.open(`http://localhost:${port}/test`);

        let runnedInPhantomRuntime = await phantom.windowProperty('runnedInPhantomRuntime');

        expect(runnedHere).toBe(false);
        expect(runnedInPhantomRuntime).toBe(true);
    });

    it('#on() can pass parameters to functions to be executed in phantom runtime', async () => {
        let page = await phantom.createPage();

        await page.on('onResourceReceived', true, function(status, param) {
            parameterProvided = param;
        }, 'param');

        await page.open(`http://localhost:${port}/test`);

        let parameterProvided = await phantom.windowProperty('parameterProvided');

        expect(parameterProvided).toBe('param');
    });

    it('#on() event supposed to run in phantom runtime wont run if not triggered', async () => {
        let page = await phantom.createPage();

        await page.on('onResourceReceived', true, function() {
            runnedInPhantomRuntime = true;
        });

        let runnedInPhantomRuntime = await phantom.windowProperty('runnedInPhantomRuntime');

        expect(runnedInPhantomRuntime).toBeFalsy();
    });

    it('#on() can register at the same event to run locally or in phantom runtime', async () => {
        let page = await phantom.createPage();
        let runnedHere = false;

        await page.on('onResourceReceived', true, function() {
            runnedInPhantomRuntime = true;
        });

        await page.on('onResourceReceived', function() {
            runnedHere = true;
        });

        await page.open(`http://localhost:${port}/test`);

        let runnedInPhantomRuntime = await phantom.windowProperty('runnedInPhantomRuntime');

        expect(runnedHere).toBe(true);
        expect(runnedInPhantomRuntime).toBe(true);
    });

    it('#off() can disable an event whose listener is going to run locally', async () => {

        let page = await phantom.createPage();
        let runnedHere = false;

        await page.on('onResourceReceived', function() {
            runnedHere = true;
        });

        await page.off('onResourceReceived');

        await page.open(`http://localhost:${port}/test`);

        expect(runnedHere).toBe(false);
    });

    it('#off() can disable an event whose listener is going to run on the phantom process', async () => {

        let page = await phantom.createPage();

        await page.on('onResourceReceived', true, function() {
            runnedInPhantomRuntime = true;
        });

        await page.off('onResourceReceived');

        await page.open(`http://localhost:${port}/test`);

        let runnedInPhantomRuntime = await phantom.windowProperty('runnedInPhantomRuntime');

        expect(runnedInPhantomRuntime).toBeFalsy();
    });
});
