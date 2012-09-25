var test;
try { test = require('tap').test; }
catch (e) { test = require('testling') }

var proto = require('../');
var traverse = require('traverse');
var EventEmitter = require('events').EventEmitter;

test('protoFn', function (t) {
    t.plan(10);
    
    var server = proto(function (remote, conn) {
        t.ok(conn);
        t.ok(conn instanceof EventEmitter);
        
        conn.on('ready', function () {
            t.deepEqual(remote, { a : 1, b : 2 });
        });
        
        this.x = function (f, g) {
            setTimeout(f.bind({}, 7, 8, 9), 25);
            setTimeout(g.bind({}, [ 'q', 'r' ]), 50);
        };
        this.y = 555;
    });
    
    var client = proto({ a : 1, b : 2 });
    
    var s = server.create();
    var c = client.create();
    
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
        links : []
    } ]);
    
    c.start();
    
    t.deepEqual(creqs, [ {
        method : 'methods',
        arguments : [ { a : 1, b : 2 } ],
        callbacks : {},
        links : []
    } ]);
    
    var pending = 2;
    c.request('x', [
        function (x, y , z) {
            t.deepEqual([ x, y, z ], [ 7, 8, 9 ]);
            if (--pending === 0) t.end();
        },
        function (qr) {
            t.deepEqual(qr, [ 'q', 'r' ]);
            if (--pending === 0) t.end();
        }
    ]);
    
    t.deepEqual(creqs.slice(1), [ {
        method : 'x',
        arguments : [ '[Function]', '[Function]' ],
        callbacks : { 0 : [ '0' ], 1 : [ '1' ] },
        links : []
    } ]);
    
    c.on('error', function (err) {
        t.ok(/JSON/.test(String(err)));
        t.ok(err instanceof SyntaxError);
    });
    c.parse('{');
});
