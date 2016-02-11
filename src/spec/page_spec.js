import http from 'http'
import Phantom from '../phantom'
import Page from '../page'

describe('Page', () => {
    let server;
    beforeAll((done) => {
        server = http.createServer((request, response) => {
            response.end('hi, ' + request.url);
        });
        server.listen(8888, () => {
            done()
        });
    });

    afterAll(() => {
        server.close();
    });

    it('.open() a valid page', (done) => {
        let phantom = new Phantom();
        phantom.createPage().then((page) => {
            page.open('http://localhost:8888/test').then((status)=> {
                expect(status).toEqual('success');
                phantom.exit();
                done();
            });
        })
    });
});