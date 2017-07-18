import phantomjs from 'phantomjs-prebuilt';
import path from 'path';
import Phantom from '../phantom';
import Page from '../page';

describe('Phantom', () => {
    let instance;
    beforeEach(() => jest.resetModules());
    beforeEach(() => instance = new Phantom());
    afterEach(() => instance.exit());

    it('#createPage() returns a Promise', () => {
        expect(instance.createPage()).toBeInstanceOf(Promise);
    });

    it('#createPage() resolves to a Page', (done) => {
        instance.createPage().then((page) => {
            expect(page).toBeInstanceOf(Page);
            done();
        });
    });

    it('#create([], {}) execute with no parameters', () => {
        jest.mock('child_process');

        const actual_spawn = require.requireActual('child_process').spawn;
        let mockedSpawn = jest.fn((...args) => actual_spawn(...args));
        require('child_process').setMockedSpawn(mockedSpawn);

        const MockedProcess = require('../phantom').default;

        let pp = new MockedProcess();
        pp.exit();

        let pathToShim = path.normalize(__dirname + '/../shim/index.js');
        expect(mockedSpawn).toHaveBeenCalledWith(phantomjs.path, [pathToShim], {env: process.env});
    });


    it('#create(["--ignore-ssl-errors=yes"]) adds parameter to process', () => {
        jest.mock('child_process');

        const actual_spawn = require.requireActual('child_process').spawn;
        let mockedSpawn = jest.fn((...args) => actual_spawn(...args));
        require('child_process').setMockedSpawn(mockedSpawn);

        const MockedProcess = require('../phantom').default;

        let pp = new MockedProcess(['--ignore-ssl-errors=yes']);
        pp.exit();

        let pathToShim = path.normalize(__dirname + '/../shim/index.js');
        const {env} = process;
        expect(mockedSpawn).toHaveBeenCalledWith(phantomjs.path, ['--ignore-ssl-errors=yes', pathToShim], {env});
    });

    it('#create([], {phantomPath: \'phantomjs\'}) execute phantomjs from custom path with no parameters', () => {
        jest.mock('child_process');

        const actual_spawn = require.requireActual('child_process').spawn;
        let mockedSpawn = jest.fn((...args) => actual_spawn(...args));
        require('child_process').setMockedSpawn(mockedSpawn);

        const MockedProcess = require('../phantom').default;

        let pp = new MockedProcess([], {phantomPath: 'phantomjs'});
        pp.exit();

        let pathToShim = path.normalize(__dirname + '/../shim/index.js');
        expect(mockedSpawn).toHaveBeenCalledWith('phantomjs', [pathToShim], {env: process.env});
        pp.exit();
    });

    it('#create([], {logger: logger}) to log messages', () => {
        let logger = {debug: jest.fn()};

        let pp = new Phantom([], {logger});
        expect(logger.debug).toHaveBeenCalled();
        pp.exit();
    });

    it.skip('#create([], {logLevel: \'debug\'}) change logLevel', () => {
        const logLevel = 'error';

        let pp = new Phantom([], {logLevel});
        expect(pp.logger.transports.console.level).toEqual(logLevel);
        pp.exit();
    });

    it.skip('#create([], {logLevel: \'debug\'}) should not change other log levels', () => {
        const logLevel = 'error';
        let p1 = new Phantom([], {logLevel});
        p1.exit();

        let p2 = new Phantom();
        expect(p2.logger.transports.console.level).toEqual('info');
        p2.exit();
    });

    it('#create("--ignore-ssl-errors=yes") to throw an exception', () => {
        expect(() => new Phantom('--ignore-ssl-errors=yes')).toThrow();
    });

    it('#create(true) to throw an exception', () => {
        expect(() => new Phantom(true)).toThrow();
    });

    xit('catches errors when stdin closes unexpectedly', async () => {
        instance.process.stdin.end();
        await expect(instance.createPage()).rejects.toEqual({
            error: 'Error reading from stdin: Error: write after end',
        });
    });

    xit('catches errors when stdout closes unexpectedly', async () => {
        instance.process.stdout.end();
        try {
            await expect(instance.createPage()).rejects.toEqual();
        } catch (e) {
            expect(e).toEqual(new Error('Error reading from stdout: Error: shutdown ENOTCONN'));
        }
    });

    it('.cookies() should return an empty cookies array', async () => {
        let cookies = await instance.cookies();
        expect(cookies).toEqual([]);
    });
});
