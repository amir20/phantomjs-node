vows    = require 'vows'
assert  = require 'assert'
express = require 'express'
phantom = require '../phantom'

describe = (name, bat) -> vows.describe(name).addBatch(bat).export(module)

# Make coffeescript not return anything
# This is needed because vows topics do different things if you have a return
# value
t = (fn) ->
  ->
    fn.apply this, arguments
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
        <iframe src="/inner" name="inner"></iframe>
      </body>
    </html>
  """

app.get '/inner', (req, res) ->
  res.send """
    <html>
      <head>
        <title>Inner page title</title>
      </head>
      <body>
      </body>
    </html>
  """

appServer = app.listen()



describe "The phantom module (frames)",
  "Can switch to inner frame on the page":
    topic: t ->
      phantom.create (ph) =>
        @callback null, ph

    "which, when you open a page":
      topic: t (ph) ->
        ph.createPage (page) =>
          page.open "http://127.0.0.1:#{appServer.address().port}/", (status) =>
            setTimeout =>
              @callback null, page, status
            , 1500

      "and extract the inner frame's title":
        topic: t (page, status) ->
          page.switchToFrame("inner")
          page.evaluate (-> document.title), (title) =>
            @callback null, title

        "it is correct": (title) ->
          assert.equal title, "Inner page title"

      "and switch back to parent frame and extract the title":
        topic: t (page, status) ->
          page.switchToParentFrame()
          page.evaluate (-> document.title), (title) =>
            @callback null, title

        "it is correct": (title) ->
          assert.equal title, "Test page title"

      "and switch from inner frame to main frame and extract the title":
        topic: t (page, status) ->
          page.switchToFrame("inner")
          page.switchToMainFrame()
          page.evaluate (-> document.title), (title) =>
            @callback null, title

        "it is correct": (title) ->
          assert.equal title, "Test page title"

      "succeeds": (err, page, status) ->
        assert.equal status, 'success'

    teardown: (ph) ->
      appServer.close()
      ph.exit()
