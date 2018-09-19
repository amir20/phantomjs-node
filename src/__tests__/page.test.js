import http from 'http';
import fs from 'fs';
import 'babel-polyfill';
import Phantom from '../phantom';

describe('Page', () => {
  let server;
  let phantom;
  let port;
  beforeAll((done) => {
    server = http.createServer((request, response) => {
      if (request.url === '/script.js') {
        response.end('window.fooBar = 2;');
      } else if (request.url === '/test.html') {
        response.end('<html><head><title>Page Title</title></head><body>Test</body></html>');
      } else if (request.url === '/upload.html') {
        response.end('<html><head><title>Page Title</title></head><body>'
            + '<input type="file" id="upload" /></body></html>');
      } else {
        response.end(`hi, ${request.url}`);
      }
    });
    server.listen(0, () => {
      port = server.address().port; // eslint-disable-line
      done();
    });
  });

  afterAll(() => server.close());
  beforeEach(() => {
    phantom = new Phantom();
  });
  afterEach(() => phantom.exit());

  it('#open() a valid page', async () => {
    const page = await phantom.createPage();
    const status = await page.open(`http://localhost:${port}/test`);
    expect(status).toEqual('success');
  });

  it("#property('plainText') returns valid content", async () => {
    const page = await phantom.createPage();
    await page.open(`http://localhost:${port}/test`);
    const content = await page.property('plainText');
    expect(content).toEqual('hi, /test');
  });

  it("#property('onResourceRequested', function(){}, params...) to throw exception", async () => {
    const page = await phantom.createPage();
    expect(() => {
      page.property(
        'onResourceRequested',
        function(requestData, networkRequest, foo, a, b) { // eslint-disable-line
          RESULT = [foo, a, b]; // eslint-disable-line
        },
        'foobar',
        1,
        -100,
      );
    }).toThrow();
  });

  it("#property('onResourceRequested', function(){}) to throw exception", async () => {
    const page = await phantom.createPage();
    expect(() => {
      page.property('onResourceRequested', function(){}); // eslint-disable-line
    }).toThrow();
  });

  it("#property('key', value) sets property", async () => {
    const page = await phantom.createPage();
    await page.property('viewportSize', { width: 800, height: 600 });
    const value = await page.property('viewportSize');
    expect(value).toEqual({ width: 800, height: 600 });
  });

  xit("#property('paperSize', value) sets value properly with phantom.paperSize", async () => {
    const page = await phantom.createPage();
    page.property('paperSize', {
      width: '8.5in',
      height: '11in',
      header: {
        height: '1cm',
        contents: phantom.callback((pageNum, numPages) => `<h1>Header <span style='float:right'>${pageNum} / ${numPages}</span></h1>`),
      },
      footer: {
        height: '1cm',
        contents: phantom.callback((pageNum, numPages) => `<h1>Footer <span style='float:right'>${pageNum} / ${numPages}</span></h1>`),
      },
    });

    await page.open(`http://localhost:${port}/test`);
    const file = 'test.pdf';
    await page.render(file);
    expect(() => {
      fs.accessSync(file, fs.F_OK);
    }).not.toThrow();
    fs.unlinkSync(file);
  });

  it("#setting('javascriptEnabled') returns true", async () => {
    const page = await phantom.createPage();
    const value = await page.setting('javascriptEnabled');
    expect(value).toBe(true);
  });

  it("#setting('key', value) sets setting", async () => {
    const page = await phantom.createPage();
    await page.setting('javascriptEnabled', false);
    const value = await page.setting('javascriptEnabled');
    expect(value).toBe(false);
  });

  it('#injectJs() properly injects a js file', async () => {
    const page = await phantom.createPage();
    await page.open(`http://localhost:${port}/test`);
    // inject_example.js: window.foo = 1;
    await page.injectJs(`${__dirname}/inject_example.js`);
    const response = await page.evaluate(function(){return foo}); // eslint-disable-line
    expect(response).toEqual(1);
  });

  it('#includeJs() properly injects a js file', async () => {
    const page = await phantom.createPage();
    await page.open(`http://localhost:${port}/test`);
    await page.includeJs(`http://localhost:${port}/script.js`);
    const response = await page.evaluate(function(){return fooBar}); // eslint-disable-line
    expect(response).toEqual(2);
  });

  it('#render() creates a file', async () => {
    const page = await phantom.createPage();
    await page.open(`http://localhost:${port}/test`);
    const file = 'test.png';
    await page.render(file);
    expect(() => {
      fs.accessSync(file, fs.F_OK);
    }).not.toThrow();
    fs.unlinkSync(file);
  });

  it('#renderBase64() returns encoded PNG', async () => {
    const page = await phantom.createPage();
    await page.open(`http://localhost:${port}/test`);
    const content = await page.renderBase64('PNG');
    expect(content).not.toBeNull();
  });

  it('#addCookie() adds a cookie to the page', async () => {
    const page = await phantom.createPage();
    await page.addCookie({
      name: 'Valid-Cookie-Name',
      value: 'Valid-Cookie-Value',
      domain: 'localhost',
      path: '/foo',
      httponly: true,
      secure: false,
      expires: new Date().getTime() + (1000 * 60 * 60),
    });
    const cookies = await page.cookies();
    expect(cookies[0].name).toEqual('Valid-Cookie-Name');
  });

  it('#clearCookies() removes all cookies', async () => {
    const page = await phantom.createPage();

    // Probably not the best test if this method doesn't work
    await page.addCookie({
      name: 'Valid-Cookie-Name',
      value: 'Valid-Cookie-Value',
      domain: 'localhost',
      path: '/foo',
      httponly: true,
      secure: false,
      expires: new Date().getTime() + (1000 * 60 * 60),
    });

    await page.clearCookies();
    const cookies = await page.cookies();
    expect(cookies).toEqual([]);
  });

  it('#deleteCookie() removes one cookie', async () => {
    const page = await phantom.createPage();

    // Probably not the best test if this method doesn't work
    await page.addCookie({
      name: 'cookie-1',
      value: 'Valid-Cookie-Value',
      domain: 'localhost',
      path: '/foo',
      httponly: true,
      secure: false,
      expires: new Date().getTime() + (1000 * 60 * 60),
    });

    await page.addCookie({
      name: 'cookie-2',
      value: 'Valid-Cookie-Value',
      domain: 'localhost',
      path: '/foo',
      httponly: true,
      secure: false,
      expires: new Date().getTime() + (1000 * 60 * 60),
    });

    let cookies = await page.cookies();
    expect(cookies.length).toBe(2);

    await page.deleteCookie('cookie-1');
    cookies = await page.cookies();

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
    const page1 = await phantom.createPage();
    await page1.open(`http://localhost:${port}/test1`);
    page1.close();

    const page2 = await phantom.createPage();
    await page2.open(`http://localhost:${port}/test2`);
    const content = await page2.property('plainText');
    expect(content).toEqual('hi, /test2');
    page2.close();
  });

  it('#windowProperty() returns a window value', async () => {
    const page = await phantom.createPage();

    await page.on('onResourceReceived', true, function(response) { // eslint-disable-line
      lastResponse = response; // eslint-disable-line
    });
    await page.open(`http://localhost:${port}/test`);
    let lastResponse = await phantom.windowProperty('lastResponse');
    expect(lastResponse.url).toEqual(`http://localhost:${port}/test`);
  });

  it('#setContent() works with custom url', async () => {
    const page = await phantom.createPage();
    const html = '<html><head><title>setContent Title</title></head><body></body></html>';

    await page.setContent(html, `http://localhost:${port}/`);

    // eslint-disable-next-line
    const response = await page.evaluate(function() {return [document.title, window.location.href]});

    expect(response).toEqual(['setContent Title', `http://localhost:${port}/`]);
  });

  it('#sendEvent() sends an event', async () => {
    const page = await phantom.createPage();
    const html = '<html  onclick="docClicked = true;"><head><title>setContent Title</title>'
      + '</head><body></body></html>';

    await page.setContent(html, `http://localhost:${port}/`);
    await page.sendEvent('click', 1, 2);

    const response = await page.evaluate(function() {return window.docClicked}); // eslint-disable-line

    expect(response).toBe(true);
  });

  it('#switchToFrame(framePosition) will switch to frame of framePosition', async () => {
    const page = await phantom.createPage();
    const html = '<html><head><title>Iframe Test</title></head><body>'
      + `<iframe id="testframe" src="http://localhost:${port}/test.html"></iframe></body></html>`;

    await page.setContent(html, `http://localhost:${port}/`);
    await page.switchToFrame(0);

    // eslint-disable-next-line
    const inIframe = await page.evaluate(function() {return window.frameElement && window.frameElement.id === 'testframe'});
    expect(inIframe).toBe(true);
  });

  it('#switchToMainFrame() will switch back to the main frame', async () => {
    const page = await phantom.createPage();
    const html = '<html><head><title>Iframe Test</title></head><body>'
      + `<iframe id="testframe" src="http://localhost:${port}/test.html"></iframe></body></html>`;

    await page.setContent(html, `http://localhost:${port}/`);
    // need to switch to child frame here to test switchToMainFrame() works
    await page.switchToFrame(0);
    await page.switchToMainFrame();

    // eslint-disable-next-line
    const inMainFrame = await page.evaluate(function(){return !window.frameElement});

    expect(inMainFrame).toBe(true);
  });

  it('#reload() will reload the current page', async () => {
    const page = await phantom.createPage();
    let reloaded = false;

    await page.open(`http://localhost:${port}/test`);
    await page.on('onNavigationRequested', (url, type) => {
      if (type === 'Reload') {
        reloaded = true;
      }
    });
    await page.reload();

    expect(reloaded).toBe(true);
  });

  it("#invokeAsyncMethod('includeJs', 'http://localhost:port/script.js') executes correctly", async () => {
    const page = await phantom.createPage();
    await page.open(`http://localhost:${port}/test`);
    await page.invokeAsyncMethod('includeJs', `http://localhost:${port}/script.js`);
    const response = await page.evaluate(function() {return fooBar}); // eslint-disable-line
    expect(response).toEqual(2);
  });

  it("#invokeAsyncMethod('open', 'http://localhost:port/test') executes correctly", async () => {
    const page = await phantom.createPage();
    const status = await page.invokeAsyncMethod('open', `http://localhost:${port}/test`);
    expect(status).toEqual('success');
  });

  it("#invokeMethod('evaluate', 'function () { return document.title }') executes correctly", async () => {
    const page = await phantom.createPage();
    await page.open(`http://localhost:${port}/test.html`);
    const response = await page.invokeMethod('evaluate', 'function () { return document.title }');
    expect(response).toEqual('Page Title');
  });

  it("#invokeMethod('renderBase64') executes correctly", async () => {
    const page = await phantom.createPage();
    await page.open(`http://localhost:${port}/test`);
    const content = await page.invokeMethod('renderBase64', 'PNG');
    expect(content).not.toBeNull();
  });

  it('#defineMethod(name, definition) defines a method', async () => {
    const page = await phantom.createPage();
    await page.defineMethod('getZoomFactor', function zoom() {
      return this.zoomFactor; // eslint-disable-line no-invalid-this
    });
    const zoomFactor = await page.invokeMethod('getZoomFactor');
    expect(zoomFactor).toEqual(1);
  });

  it('#openUrl() opens a URL', (done) => {
    phantom.createPage().then((page) => {
      page.on('onLoadFinished', false, (status) => {
        expect(status).toEqual('success');
        done();
      });
      return page.openUrl(`http://localhost:${port}/test`, 'GET', {});
    });
  });

  it('#setProxy() sets the proxy', async () => {
    const page = await phantom.createPage();
    await page.setProxy(`http://localhost:${port}/`);
    await page.open('http://phantomjs.org/');
    const text = await page.property('plainText');
    expect(text).toEqual('hi, http://phantomjs.org/');
  });

  it('#property = something shows a warning', async () => {
    if (typeof Proxy === 'function') {
      const logger = { warn: jest.fn() };

      const pp = new Phantom([], { logger });
      const page = await pp.createPage();

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

  it('#goBack()', (done) => {
    let page;
    phantom
      .createPage()
      .then((instance) => {
        page = instance;
        return page.open(`http://localhost:${port}/test1`);
      })
      .then(() => page.open(`http://localhost:${port}/test2`))
      .then(() => {
        page.on('onNavigationRequested', false, () => {
          done();
        });
        return page.goBack();
      });
  });

  it('#uploadFile() inserts file into file input field', async () => {
    const page = await phantom.createPage();
    await page.open(`http://localhost:${port}/upload.html`);
    await page.uploadFile('#upload', `${process.env.PWD}/package.json`);

    // eslint-disable-next-line
    const response = await page.evaluate(function() {return document.querySelector('#upload').files[0].name});
    expect(response).toEqual('package.json');
  });
});
