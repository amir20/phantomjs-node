(function() {
  var child, dnode, express, phanta, startPhantomProcess, wrap,
    __slice = Array.prototype.slice;

  dnode = require('dnode');

  express = require('express');

  child = require('child_process');

  phanta = [];

  startPhantomProcess = function(port, args) {
    var ps;
    ps = child.spawn('phantomjs', args.concat([__dirname + '/shim.js', port]));
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
    create: function() {
      var app, appServer, args, cb, io, phantom, ps, server, _i;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      app = express.createServer();
      app.use(express.static(__dirname));
      appServer = app.listen();
      server = dnode();
      phantom = null;
      ps = startPhantomProcess(appServer.address().port, args);
      ps.on('exit', function(code) {
        var p;
        appServer.close();
        return phanta = (function() {
          var _j, _len, _results;
          _results = [];
          for (_j = 0, _len = phanta.length; _j < _len; _j++) {
            p = phanta[_j];
            if (p !== phantom) _results.push(p);
          }
          return _results;
        })();
      });
      io = {
        log: null,
        'client store expiration': 0
      };
      return server.listen(appServer, {
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
