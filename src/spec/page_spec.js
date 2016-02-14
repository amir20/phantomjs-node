import http from "http";
import Phantom from "../phantom";

describe('Page', () => {
    let server;
    let phantom;
    beforeAll((done) => {
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

    it('#open() a valid page', (done) => {
        phantom.createPage().then((page) => {
            page.open('http://localhost:8888/test').then((status)=> {
                expect(status).toEqual('success');
                done();
            });
        })
    });

    it('#property(\'plainText\') returns valid content', (done) => {
        phantom.createPage().then((page) => {
            page.open('http://localhost:8888/test').then((status) => {
                page.property('plainText').then((content) => {
                    expect(content).toEqual('hi, /test');
                    done();
                })
            });
        })
    });

    it('#property(\'onResourceRequested\', function(){}) sets property', (done) => {
        phantom.createPage().then((page) => {
            page.property('onResourceRequested', (requestData, networkRequest) => {
                page.foo = requestData.url;
            }).then(() => {
                page.open('http://localhost:8888/foo-bar-xyz').then((status)=> {
                    page.property('foo').then((value) => {
                        expect(value).toEqual('http://localhost:8888/foo-bar-xyz');
                        done();
                    });
                });
            });
        })
    });

    it('#property(\'key\', value) sets property', (done) => {
        phantom.createPage().then((page) => {
            page.property('viewportSize', {width: 800, height: 600}).then(() => {
                page.property('viewportSize').then((value) => {
                    expect(value).toEqual({width: 800, height: 600});
                    done();
                })
            });
        })
    });

    it('#setting(\'javascriptEnabled\') returns true', (done) => {
        phantom.createPage().then((page) => {
            page.setting('javascriptEnabled').then((value) => {
                expect(value).toEqual(true);
                done();
            });
        })
    });

    it('#setting(\'key\', value) sets setting', (done) => {
        phantom.createPage().then((page) => {
            page.setting('javascriptEnabled', false);
            page.setting('javascriptEnabled').then((value) => {
                expect(value).toEqual(false);
                done();
            });
        })
    });

    it('#evaluate(function(){...}) executes correctly', (done) => {
        phantom.createPage().then((page) => {
            page.evaluate(function () {
                return 'test'
            }).then((response) => {
                expect(response).toEqual('test');
                done();
            });
        })
    });

    it('#injectJs() properly injects a js file', (done) => {
        phantom.createPage().then((page) => {
            page.open('http://localhost:8888/test').then((status) => {
                // inject_example.js: window.foo = 1;
                page.injectJs(__dirname + '/inject_example.js').then(() => {
                    page.evaluate(function () {
                        return foo;
                    }).then((response) => {
                        expect(response).toEqual(1);
                        done();
                    });
                })
            });
        })
    });

    it('#includeJs() properly injects a js file', (done) => {
        phantom.createPage().then((page) => {
            page.open('http://localhost:8888/test').then((status) => {
                page.includeJs('http://localhost:8888/script.js').then(() => {
                    page.evaluate(function () {
                        return fooBar;
                    }).then((response) => {
                        expect(response).toEqual(2);
                        done();
                    });
                })
            });
        })
    });
});

