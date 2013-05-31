vows    = require 'vows'
assert  = require 'assert'
express = require 'express'
phantom = require '../phantom'

describe = (name, bat) -> vows.describe(name).addBatch(bat).export(module)

# Make coffeescript not return anything
# This is needed because vows topics do different things if you have a return value
t = (fn) ->
  (args...) ->
    fn.apply this, args
    return

app = express()
app.use express.static __dirname

app.get '/', (req, res) ->
  res.send """
    <html>
      <head>
        <title>Test page title</title>
      </head>
      <body>
        <img src="/test.gif" />
      </body>
    </html>
  """

appServer = app.listen()

describe "The phantom module (adv)"
  "Can create an instance with --load-images=no":
    topic: t ->
      phantom.create '--load-images=no', (ph) =>
        @callback null, ph

    "which, when you open a page":
      topic: t (ph) ->
        ph.createPage (page) =>
          page.open "http://127.0.0.1:#{appServer.address().port}/", (status) =>
            setTimeout =>
              @callback null, page, status
            , 1500

      "and check the settings object":
        topic: t (page, status) ->
          page.get 'settings', (s) =>
            @callback null, s

        "loadImages isn't set": (s) ->
          assert.strictEqual s.loadImages, false

      "succeeds": (err, page, status) ->
        assert.equal status, 'success'

      "and check a test image":
        topic: t (page) ->
          page.evaluate (-> document.getElementsByTagName('img')[0]), (img) =>
            @callback null, img

        "it doesn't load": (img) ->
          assert.strictEqual img.width, 0, "width should be 0"
          assert.strictEqual img.height, 0, "height should be 0"

    teardown: (ph) ->
      appServer.close()
      ph.exit()

  "Can create an instance with a custom port and --load-images=yes":
    topic: t ->
      phantom.create '--load-images=yes', {port: 12301}, (ph) =>
        ph.get 'args', (args) =>
          # TODO: not sure why args doesn't contain load-images
          [port] = args
          @callback null, port

    "which loads on the correct port": (port) ->
      assert.equal port, 12301

