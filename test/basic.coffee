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

describe "The phantom module (basic)",
  "Can create an instance":
    topic: t ->
      phantom.create {port: 12302}, (ph, err) =>
        @callback null, [ph, err]

    "which is an object": ([ph, err]) ->
      assert.isObject ph

    "which did not error": ([ph, err]) ->
      assert.isNull err

    "with a version":
      topic: t ([ph, err]) ->
        ph.get 'version', (val) =>
          @callback null, val

      "defined": (ver) ->
        assert.notEqual ver, undefined

      "an object": (ver) ->
        assert.isObject ver

      "greater than or equal to 1.3": (ver) ->
        assert.ok ver.major >= 1, "major version too low"
        if (ver.major is 1)
          assert.ok ver.minor >= 3, "minor version too low"

    "which can inject Javascript from a file":
      topic: t ([ph, err]) ->
        ph.injectJs 'test/inject.js', (success) =>
          @callback null, success

      "and succeed": (success) ->
        assert.ok success, "Injection should return true"

    "which can create a page":
      topic: t ([ph, err]) ->
        ph.createPage (page) =>
          @callback null, page

      "which is an object": (page) ->
        assert.isObject page
