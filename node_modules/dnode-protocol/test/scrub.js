var test;
try { test = require('tap').test; }
catch (e) { test = require('testling') }
var scrubber = require('../lib/scrub');

test('no functions', function (t) {
    var s = scrubber([]);
    t.deepEqual(
        s.scrub([ 1, 2, 3 ]),
        {
            arguments : [ 1, 2, 3 ],
            callbacks : {},
            links : [],
        }
    );
    
    t.deepEqual(
        s.scrub([ 4, { a : 5, b : 6 } ]),
        {
            arguments : [ 4, { a : 5, b : 6 } ],
            callbacks : {},
            links : [],
        }
    );
    t.end();
});

test('functions', function (t) {
    var s = scrubber([]);
    
    var calls = { f : 0, g : 0 };
    var f = function () { calls.f ++ };
    var g = function () { calls.g ++ };
    
    var sc = s.scrub([ 1, 2, f, g ]);
    t.deepEqual(sc, {
        arguments : [ 1, 2, '[Function]', '[Function]' ],
        callbacks : { 0 : [ '2' ], 1 : [ '3' ] },
        links : [],
    });
    
    s.callbacks[0]();
    t.deepEqual(calls, { f : 1, g : 0 });
    
    s.callbacks[1]();
    t.deepEqual(calls, { f : 1, g : 1 });
    
    t.end();
});

test('link', function (t) {
    var s = scrubber([]);
    var x = [ [ 0, { a : 1, b : 2, c : 3 }, 4 ], 5, 6 ];
    x[0][1].d = x[0][1];
    var sc = s.scrub(x);
    
    t.deepEqual(sc, {
        arguments : [
            [ 0, { a : 1, b : 2, c : 3, d : '[Circular]' }, 4 ], 5, 6
        ],
        callbacks : {},
        links : [ { from : [ '0', '1'  ], to : [ '0', '1', 'd' ] } ],
    });
    t.end();
});

test('multilink', function (t) {
    var s = scrubber([]);
    var x = [ [ 0, { a : 1, b : 2, c : 3 }, 4 ], 5, 6 ];
    x[0][1].d = x[0][1];
    x.push(x);
    var sc = s.scrub(x);
    
    t.deepEqual(sc, {
        arguments : [
            [ 0, { a : 1, b : 2, c : 3, d : '[Circular]' }, 4 ],
            5, 6, '[Circular]'
        ],
        callbacks : {},
        links : [
            { from : [ '0', '1'  ], to : [ '0', '1', 'd' ] },
            { from : [], to : [ '3' ] },
        ],
    });
    t.end();
});

test('enum set link', function (t) {
    var s = scrubber([]);
    var req = {
        method : 0,
        arguments : [ 33, '[Function]' ],
        callbacks : { 0 : [ '1' ] },
        links : [ {
            from : [ '0' ],
            to : [ '1', 'constructor', 'prototype', 'beep' ]
        } ]
    };
    
    var args = s.unscrub(req, function (id) {
        return function () {};
    });
    t.ok(!(function () {}).beep, 'created non-enumerable property');
    t.end();
});

test('enum get link', function (t) {
    var s = scrubber([]);
    var req = {
        method : 0,
        arguments : [ 'doom', '[Function]' ],
        callbacks : { 0 : [ '1' ] },
        links : [ {
            from : [ '1', 'constructor', 'prototype', 'toString' ],
            to : [ '0' ]
        } ]
    };
    
    var args = s.unscrub(req, function (id) {
        return function () {};
    });
    
    t.ok(args[0] === undefined);
    t.end();
});

test('skip set', function (t) {
    var s = scrubber([]);
    var req = {
        method : 0,
        arguments : [ { x : 33 }, '[Function]' ],
        callbacks : { 0 : [ '1' ] },
        links : [ { from : [ '0', 'x' ], to : [ '2' ] } ]
    };
    
    var args = s.unscrub(req, function (id) {
        return function () {};
    });
    t.equal(args[2], 33);
    t.end();
});
