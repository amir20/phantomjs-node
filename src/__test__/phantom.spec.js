import phantomjs from 'phantomjs-prebuilt';
import path from 'path';
import Phantom from '../phantom';
import Page from '../page';

describe('Phantom', () => {
    let instance;
    beforeAll(() => jest.resetModules());
    beforeAll(() => instance = new Phantom());
    afterAll(() => instance.exit());

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
        expect(mockedSpawn).toHaveBeenCalledWith(phantomjs.path, [pathToShim]);
    });


    it('#create([], {}) execute with undefined phantomjs-prebuilt to throw exception', () => {
        expect(() => new Phantom([], {phantomPath: null})).toThrow();
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
        expect(mockedSpawn).toHaveBeenCalledWith(phantomjs.path, ['--ignore-ssl-errors=yes', pathToShim]);
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
        expect(mockedSpawn).toHaveBeenCalledWith('phantomjs', [pathToShim]);
        pp.exit();
    });

    it('#create([], {logger: logger}) to log messages', () => {
        let logger = {debug: jest.fn()};

        let pp = new Phantom([], {logger});
        expect(logger.debug).toHaveBeenCalled();
        pp.exit();
    });

    it('#create([], {logLevel: \'debug\'}) change logLevel', () => {
        const logLevel = 'error';

        let pp = new Phantom([], {logLevel});
        expect(pp.logger.transports.console.level).toEqual(logLevel);
        pp.exit();
    });

    it('#create([], {logLevel: \'debug\'}) should not change other log levels', () => {
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

    it('catches errors when stdin closes unexpectedly', (done) => {
        instance.process.stdin.end();
        instance.createPage().catch((err) => {
            if (err.message.includes('Error reading from stdin')) {
                done();
            } else {
                done(new Error('Wrong error message'));
            }
        });
    });

    it('catches errors when stdout closes unexpectedly', (done) => {
        instance.process.stdout.end();
        instance.createPage().catch((err) => {
            if (err.message.includes('Error reading from stdout')) {
                done();
            } else {
                done(new Error('Wrong error message'));
            }
        });
    });
});
