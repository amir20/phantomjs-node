vows    = require 'vows'
assert  = require 'assert'
phantom = require '../phantom'

describe = (name, bat) -> vows.describe(name).addBatch(bat).export(module)

# Make coffeescript not return anything
# This is needed because vows topics do different things if you have a return
# value
t = (fn) ->
  ->
    fn.apply this, arguments
    return

describe  "The phantom module (error behavior)",
  "Can try to spawn instance at nonexistent path":
    topic: t ->
      phantom.create {port: 12311, path: "./test/doesn't-exist"}, (ph, err) =>
        @callback null, [ph, err]

    "which is null": ([ph, err]) ->
      assert.isNull ph

    "which returned an error": ([ph, err]) ->
      assert.isObject err

    "with an error code of ENOENT": ([ph, err]) ->
      assert.strictEqual err?.code, "ENOENT"

  "Can try to spawn two instances on the same port":
    topic: t ->
      phantom.create {port: 12312}, (ph, err) =>
        @callback null, [ph, err]

    "where the first succeeds": ([ph, err]) ->
      assert.isObject ph

    "and does not error": ([ph, err]) ->
      assert.isNull err

    "but, when the second is run,":
      topic: t ->
        phantom.create {port: 12312}, (ph2, err2) =>
          @callback null, [ph2, err2]

      "it fails": ([ph2, err2]) ->
        assert.isNull ph2

      "and it errors": ([ph2, err2]) ->
        assert.isObject err2

      "with error code EADDRINUSE": ([ph2, err2]) ->
        assert.equal err2.code, "EADDRINUSE"
