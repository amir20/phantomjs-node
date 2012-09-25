var test = require('tap').test;
var proto = require('../');
var traverse = require('traverse');

test('proto hashes', function (t) {
    t.plan(10);
    var pending = 5;
    
    var times = { s : 0, c : 0 };
    function done () {
        t.same(times.s, 2); // f, g
        t.same(times.c, 1); // x(f,g)
        t.end();
    }
    
    function swrapper (fn) {
        // 1 of these
        t.equal(typeof fn, 'function');
        times.s ++;
        if (--pending === 0) done();
        return fn;
    }
    
    function cwrapper (fn) {
        // 2 of these
        t.equal(typeof fn, 'function');
        times.c ++;
        if (--pending === 0) done();
        return fn;
    }
    
    var s = proto({
        x : function (f, g) {
            setTimeout(f.bind({}, 7, 8, 9), 25);
            setTimeout(g.bind({}, [ 'q', 'r' ]), 50);
        },
        y : 555
    }, { wrap : swrapper });
    
    var c = proto({}, { wrap : cwrapper });
    
    var sreqs = [];
    s.on('request', function (req) {
        sreqs.push(traverse.clone(req));
        c.handle(req);
    });
    
    var creqs = [];
    c.on('request', function (req) {
        creqs.push(traverse.clone(req));
        s.handle(req);
    });
    
    s.start();
    
    t.deepEqual(sreqs, [ {
        method : 'methods',
        arguments : [ { x : '[Function]', y : 555 } ],
        callbacks : { 0 : [ '0', 'x' ] },
        links : [],
    } ]);
    
    c.start();
    
    t.deepEqual(creqs, [ {
        method : 'methods',
        arguments : [ {} ],
        callbacks : {},
        links : [],
    } ]);
    
    c.request('x', [
        function (x, y , z) {
            t.deepEqual([ x, y, z ], [ 7, 8, 9 ]);
            if (--pending === 0) done();
        },
        function (qr) {
            t.deepEqual(qr, [ 'q', 'r' ]);
            if (--pending === 0) done();
        }
    ]);
    
    t.deepEqual(creqs.slice(1), [ {
        method : 'x',
        arguments : [ '[Function]', '[Function]' ],
        callbacks : { 0 : [ '0' ], 1 : [ '1' ] },
        links : [],
    } ]);
});
