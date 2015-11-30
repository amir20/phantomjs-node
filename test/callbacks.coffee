vows    = require 'vows'
assert  = require 'assert'
phantom = require '../phantom'
Promise = require 'bluebird'

describe = (name, bat) -> vows.describe(name).addBatch(bat).export(module)

# Make coffeescript not return anything
# This is needed because vows topics do different things if you have a return
# value
t = (fn) ->
  ->
    fn.apply this, arguments
    return

# Inject an `onExit` callback on `create` to resolve this promise.
exitPromise = new Promise (resolve) ->
  wrapCreate = (p) ->
    _cached = p.create
    wrapped = false

    p.create = (args...) ->
      for arg, idx in args when typeof arg is 'object'
        args[idx]['onExit'] = resolve
        wrapped = true
        break

      args.push {onExit: resolve} unless wrapped is true
      _cached.apply phantom, args

  wrapCreate phantom

describe "The phantom module (callbacks)",
  "Can create an instance":
    topic: t ->
      phantom.create {port: 12305}, (ph) =>
        @callback null, ph

    "and can add cookies":
      topic: t (ph) ->
        ph.addCookie
          name: "cookieName"
          value: "cookieValue"
          path: "/testPath"
          domain: "localhost", (status) =>
            @callback null, status

      "which succeeds": (status) ->
        assert.ok status, "addCookie should succeed"

    "and, when getCookies is called,":
      topic: t (ph) ->
        ph.getCookies (cookies) =>
          @callback null, cookies

      "the cookie is available": (cookies) ->
        assert.equal (c for c in cookies when (c) ->
          c.name is "cookieName" and
          c.value is "cookieValue" and
          c.path is "/testPath").length, 1, "cookie must be in phantom.cookies"


    "which, when you call exit()":
      topic: t (ph) ->
        countdown = null

        exitPromise.then =>
          clearTimeout countdown
          @callback null, 'success'

        ph.exit()

        countdown = setTimeout =>
          @callback 'timeout'
        , 500

      "runs the onExit callback within 500ms": (status) ->
        assert.equal status, 'success'
