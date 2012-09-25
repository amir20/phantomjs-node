var proto = require('../');

var s = proto({
    x : function (f, g) {
        setTimeout(function () { f(5) }, 200);
        setTimeout(function () { g(6) }, 400);
    },
    y : 555
});
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
