var phantom = require('phantom');
var co = require('co');

co(function*() {
    var instance = yield phantom.create();
    try {
        var page = yield instance.createPage();
        var status = yield page.open('https://stackoverflow.com/');
        console.log(status);
        var content = yield page.property('content');
        console.log(content);
    } catch (e) {
        console.log('Error found: ' + e.message);
    } finally {
        instance.exit();
    }
}).catch(console.error);
