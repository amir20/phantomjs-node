var test;
try { test = require('tap').test; }
catch (e) { test = require('testling') }
var Store = require('../').Store;

test('store', function (t) {
    var s = new Store;
    
    t.deepEqual(s.items.length, 0);
    
    var i = 0;
    var cb = function() {
        i++;
    };
    
    var fn1 = function () {
        cb();
    };
    s.add(fn1);
    t.deepEqual(s.items.length, 1);
    s.get(0)();
    fn1();
    t.deepEqual(i, 2);
    t.deepEqual(s.items[0].times, undefined);
    
    var fn2 = function() {
        cb();
    };
    fn2.times = 2;
    s.add(fn2);
    t.deepEqual(s.items.length, 2);
    s.get(1)();
    fn2();
    t.deepEqual(i, 4);
    t.deepEqual(s.items[1].times, 1);
    s.get(1)();
    t.deepEqual(s.items[1], undefined);
    
    var fn3 = function() {
        cb2();
    };
    s.add(fn3);
    t.deepEqual(s.items.length, 3);
    t.end();
});


