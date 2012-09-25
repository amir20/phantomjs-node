var weak = require('weak');
var proto = require('../');

var s = (function () {
    var cons = {
        x : function (f, g) {
            setTimeout(function () { f(5) }, 200);
            setTimeout(function () { g(6) }, 400);
        },
        y : 555
    };
    return proto(cons, {
        wrap : function (cb, id) {
            return weak(cb, function () {
                console.log('s.cull(' + id + ')')
                s.cull(id);
            });
        },
        unwrap : function (ref, id) {
            var cb = weak.get(ref);
            return cb || function () {};
        }
    });
})();

var c = proto();

s.on('request', c.handle.bind(c));
c.on('request', s.handle.bind(s));

c.on('remote', function (remote) {
    function f (x) { console.log('f(' + x + ')') }
    function g (x) { console.log('g(' + x + ')') }
    remote.x(f, g);
});

s.start();
c.start();

setTimeout(function () {
    // switch on the garbage disposal to full blast:
    var xs = [];
    for (var i = 0; i < 1000 * 1000; i++) xs.push(function () {});
    xs = [];
}, 1000);
