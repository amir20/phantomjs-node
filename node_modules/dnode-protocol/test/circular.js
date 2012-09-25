var test;
try { test = require('tap').test; }
catch (e) { test = require('testling') }
var Scrubber = require('../lib/scrub');

test('circular', function (t) {
    var s = new Scrubber;
    
    var obj = { a : 1, b : 2 };
    obj.c = obj;
    
    t.deepEqual(
        s.scrub([ obj ]),
        {
            arguments : [ { a : 1, b : 2, c : '[Circular]' } ],
            callbacks : {},
            links : [ { 'from' : [ '0' ], 'to' : [ '0', 'c' ] } ],
        }
    );
    
    t.end();
});
