vows    = require 'vows'
assert  = require 'assert'
psTree  = require 'ps-tree'
child   = require 'child_process'
phantom = require '../phantom'


describe = (name, bat) -> vows.describe(name).addBatch(bat).export(module)

# Make coffeescript not return anything
# This is needed because vows topics do different things if you have a return value
t = (fn) ->
  (args...) ->
    fn.apply this, args
    return

describe "The phantom module"
  "Can create an instance":
    topic: t -> phantom.create (p) => @callback null, p
    
    "which is an object": (p) -> assert.isObject p
    
    "with a version":
      topic: t (p) -> p.get 'version', (val) => @callback null, val
      
      "defined": (ver) -> assert.notEqual ver, undefined
      
      "greater than or equal to 1.3": (ver) ->
        assert.ok ver.major >= 1, "major version too low"
        assert.ok ver.minor >= 3, "minor version too low"


    "which can inject Javascript from a file":
      topic: t (p) ->
        p.injectJs 'test/inject.js', (success) =>
          @callback null, (success)
      
      "and succeed": (success) ->
        assert.ok success, "Injection should return true"

    "which can create a page":
      topic: t (p) -> p.createPage (page) => @callback null, page

      "which is an object": (page) -> assert.isObject page

    "which, when you call exit()":
      topic: t (p) ->
        test = this
        
        # Make sure other tests get a chance to run first. There's probably a better way to do this.
        setTimeout ->
          p.exit()
          setTimeout ->
            psTree process.pid, test.callback
          , 500
        , 500
      "exits after 500ms": (children) ->
        # 1 instead of 0 because pstree spawns a subprocess
        assert.equal children.length, 1, "process still has #{children.length} child(ren): #{JSON.stringify children}"
        

