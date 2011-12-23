(function() {
  var child, dnode, express, phanta, startPhantomProcess, wrap;

  dnode = require('dnode');

  express = require('express');

  child = require('child_process');

  phanta = [];

  startPhantomProcess = function(port) {
    var ps;
    ps = child.spawn('phantomjs', [__dirname + '/shim.js', port]);
    ps.stdout.on('data', function(data) {
      return console.log("phantom stdout: " + data);
    });
    ps.stderr.on('data', function(data) {
      if (data.toString('utf8').match(/No such method.*socketSentData/)) return;
      return console.warn("phantom stderr: " + data);
    });
    return ps;
  };

  process.on('exit', function() {
    var phantom, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = phanta.length; _i < _len; _i++) {
      phantom = phanta[_i];
      _results.push(phantom.exit());
    }
    return _results;
  });

  wrap = function(ph) {
    ph._createPage = ph.createPage;
    return ph.createPage = function(cb) {
      return ph._createPage(function(page) {
        page._evaluate = page.evaluate;
        page.evaluate = function(fn, cb) {
          return page._evaluate(fn.toString(), cb);
        };
        return cb(page);
      });
    };
  };

  module.exports = {
    create: function(cb) {
      var app, io, phantom, ps, server;
      app = express.createServer();
      app.use(express.static(__dirname));
      app.listen();
      server = dnode();
      phantom = null;
      ps = startPhantomProcess(app.address().port);
      ps.on('exit', function(code) {
        var p;
        app.close();
        return phanta = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = phanta.length; _i < _len; _i++) {
            p = phanta[_i];
            if (p !== phantom) _results.push(p);
          }
          return _results;
        })();
      });
      io = {
        log: null,
        'client store expiration': 0
      };
      return server.listen(app, {
        io: io
      }, function(obj, conn) {
        phantom = conn.remote;
        wrap(phantom);
        phanta.push(phantom);
        return typeof cb === "function" ? cb(phantom) : void 0;
      });
    }
  };

}).call(this);
