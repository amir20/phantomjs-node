var cluster = require("cluster");

if (cluster.isMaster) {
    var cpuCount = require('os').cpus().length;

    for (var i = 0; i < cpuCount; i++) {
        console.log('Forking process #' + (i + 1));
        cluster.fork();
    }

    cluster.on('exit', function (worker) {
        console.log('Worker ' + woker.id + ' died. Forking...');
        cluster.fork();
    });

} else {
    var phantom = require("phantom"),
        express = require("express"),
        serve = express();

    serve.get('/foo', function (req, res) {
        phantom.create().then(function (ph) {
            ph.createPage().then(function (page) {
                page.setting('userAgent', 'foo app');
                page.open('http://localhost:8080/test.html').then(function (status) {
                    res.json({
                        pageStatus: status
                    });
                    page.close();
                    ph.exit();
                });
            });
        });
    }).listen(3000);
}

// npm install express
// node cluster.js
