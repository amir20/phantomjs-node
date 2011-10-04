(function() {
  var controlPage, mkweb, mkwrap, pageWrap, port, proto, s, server, webpage, _phantom;
  var __slice = Array.prototype.slice, __hasProp = Object.prototype.hasOwnProperty;
  mkweb = new Function("exports", "window", phantom.loadModuleSource('webpage'));
  webpage = {};
  mkweb.call({}, webpage, {});
  proto = require('dnode-protocol');
  port = phantom.args[0];
  controlPage = webpage.create();
  mkwrap = function(src, pass, special) {
    var k, obj, _fn, _i, _len;
    if (pass == null) {
      pass = [];
    }
    if (special == null) {
      special = {};
    }
    obj = {
      set: function(key, val, cb) {
        if (cb == null) {
          cb = function() {};
        }
        return cb(src[key] = val);
      },
      get: function(key, cb) {
        return cb(src[key]);
      }
    };
    _fn = function(k) {
      return obj[k] = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return src[k].apply(src, args);
      };
    };
    for (_i = 0, _len = pass.length; _i < _len; _i++) {
      k = pass[_i];
      _fn(k);
    }
    for (k in special) {
      if (!__hasProp.call(special, k)) continue;
      obj[k] = special[k];
    }
    return obj;
  };
  pageWrap = function(page) {
    return mkwrap(page, ['open', 'includeJs', 'injectJs', 'render', 'sendEvent'], {
      evaluate: function(fn, cb) {
        if (cb == null) {
          cb = function() {};
        }
        return cb(page.evaluate(fn));
      }
    });
  };
  _phantom = mkwrap(phantom, ['exit', 'injectJS'], {
    page: pageWrap(webpage.create())
  });
  server = proto(_phantom);
  s = server.create();
  s.on('request', function(req) {
    var evil;
    evil = "function(){socket.send('" + (JSON.stringify(req)) + "'+'\\n');}";
    return controlPage.evaluate(evil);
  });
  controlPage.onAlert = function(msg) {
    if (msg.slice(0, 6) !== "PCTRL ") {
      return;
    }
    return s.parse(msg.slice(6));
  };
  controlPage.onConsoleMessage = function() {
    var msg;
    msg = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return console.log.apply(console, msg);
  };
  controlPage.open("http://127.0.0.1:" + port + "/", function(status) {
    return s.start();
  });
}).call(this);
