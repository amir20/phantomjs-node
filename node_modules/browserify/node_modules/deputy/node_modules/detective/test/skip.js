var test = require('tap').test;
var detective = require('../');
var fs = require('fs');
var src = fs.readFileSync(__dirname + '/files/skip.js');

test('skip', function (t) {
    t.deepEqual(detective(src), [ 'a', 'b', 'c' ]);
    t.end();
});
