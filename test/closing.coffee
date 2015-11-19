vows    = require 'vows'
child_process   = require 'child_process'
exec = child_process.exec
spawn = child_process.spawn
assert = require 'assert'

describe = (name, bat) -> vows.describe(name).addBatch(bat).export(module)

t = (fn) ->
  ->
    fn.apply this, arguments
    return

program = '''
var phantom = require('./');
process.on('SIGINT', function() {
  console.log('SIGINT');
  process.exit(0);
});
process.on('SIGTERM', function() {
  console.log('SIGTERM');
  process.exit(0);
});
process.on('exit', function() {
  console.log('EXIT');
});
console.log('Setup');
setTimeout(function() {
  console.log('Going out');
}, 1000);
'''

programCbless = '''
var phantom = require('./');
console.log('Setup');
setTimeout(function() {
  console.log('Going out');
}, 200);
'''

createTopic = (signal, p) ->
  ->
    that = this
    result = ''
    co = child_process.exec 'node -e "' + p + '"'
    cb = ->
    if signal
      cb = ->
        process.kill co.pid, signal
    else
      cb = ->

    co.stdout.on 'data', (data) ->
      result += data
      cb() if data.toString().match /^Setup/g
    co.stderr.on 'data', (data) ->
      result += data
    co.on 'exit', (code) ->
      that.callback null, [result, co.pid]
    return undefined

createExitTest = (expect) ->
  (err, [r, pid]) ->
    assert.isNull err
    assert.deepEqual('Setup\n' + expect, r)

createExitTestCbLess = (expect) ->
  (err, [r, pid]) ->
    assert.isNull err
    assert.deepEqual('Setup\n' + expect, r)
    try
      process.kill(pid)
      assert.fail()

describe "The phantom module",
  "SIGINT":
    "with callbacks":
      topic: createTopic('SIGINT', program)
      "exited": createExitTest('SIGINT\nEXIT\n')
    "without callbacks":
      topic: createTopic('SIGINT', programCbless)
      "exited": createExitTestCbLess('')
  "SIGTERM":
    "with callbacks":
      topic: createTopic('SIGTERM', program)
      "exited": createExitTest('SIGTERM\nEXIT\n')
    "without callbacks":
      topic: createTopic('SIGTERM', programCbless)
      "exited": createExitTestCbLess('')
  "without signals":
    "with callbacks":
      topic: createTopic(false, program)
      "exited": createExitTest('Going out\nEXIT\n')
    "without callbacks":
      topic: createTopic(false, programCbless)
      "exited": createExitTestCbLess('Going out\n')
