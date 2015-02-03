vows    = require 'vows'
assert  = require 'assert'
phantom = require '../phantom'

describe = (name, bat) -> vows.describe(name).addBatch(bat).export(module)

# Make coffeescript not return anything
# This is needed because vows topics do different things if you have a return value
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

    # "which is an object": ([ph, err]) ->
    #   assert.isObject ph

    # "which did not error": ([ph, err]) ->
    #     assert.isNull err

#     "with a version":
#       topic: t ([ph, err]) ->
#         ph.get 'version', (val) =>
#           @callback null, val

#       "defined": (ver) ->
#         assert.notEqual ver, undefined

#       "an object": (ver) ->
#         assert.isObject ver

#       "greater than or equal to 1.3": (ver) ->
#         assert.ok ver.major >= 1, "major version too low"
#         if (ver.major == 1)
#           assert.ok ver.minor >= 3, "minor version too low"

#     "which can inject Javascript from a file":
#       topic: t ([ph, err]) ->
#         ph.injectJs 'test/inject.js', (success) =>
#           @callback null, success

#       "and succeed": (success) ->
#         assert.ok success, "Injection should return true"

#     "which can create a page":
#       topic: t ([ph, err]) ->
#         ph.createPage (page) =>
#           @callback null, page

#       "which is an object": (page) ->
#         assert.isObject page

#   "Cannot create an instance at a nonexistent path":
#     topic: t ->
#       phantom.create {port: 12302, path: "./test/dir-does-not-exist"}, (ph, err) =>
#         console.log "CREATED"
#         @callback null, [ph, err]

#       "which is null": ([ph, err]) ->
#         assert.isNull ph

#       "which returned an error": ([ph, err]) ->
#         assert.isObject err

#       "with an error code of ENOENT": ([ph, err]) ->
#         assert.strictEqual err?.code, "ENOENT"


# # vows    = require 'vows'
# # assert  = require 'assert'
# # phantom = require '../phantom'

# # describe = (name, bat) -> vows.describe(name).addBatch(bat).export(module)

# # # Make coffeescript not return anything
# # # This is needed because vows topics do different things if you have a return value
# # t = (fn) ->
# #   ->
# #     fn.apply this, arguments
# #     return

# # describe "The phantom module (error behavior)",
# #   "Cannot create an instance at a nonexistent path":
# #     topic: t ->
# #       phantom.create {port: 0}, (ph, err) =>
# #         console.log "CREATED"
# #         @callback null, [ph, err]

# #       "which is null": ([ph, err]) ->
# #         assert.isNull ph

# #       "which returned an error": ([ph, err]) ->
# #         assert.isObject err

# #       "with an error code of ENOENT": ([ph, err]) ->
# #         assert.strictEqual err?.code, "ENOENT"
