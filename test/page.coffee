vows    = require 'vows'
assert  = require 'assert'
phantom = require '../phantom'
express = require 'express'
temp    = require 'temp'
path    = require 'path'
fs      = require 'fs'

describe = (name, bat) -> vows.describe(name).addBatch(bat).export(module)

# Make coffeescript not return anything
# This is needed because vows topics do different things if you have a return value
t = (fn) ->
  (args...) ->
    fn.apply this, args
    return

app = express()

app.get '/', (req, res) ->
  res.send """
    <html>
      <head>
        <title>Test page title</title>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js"></script>
      </head>
      <body>
        <div id="somediv">
          <div class="anotherdiv">Some page content</div>
        </div>
        <button class="clickme" style="position: absolute; top: 123px; left: 123px; width: 20px; height; 20px" onclick="window.i_got_clicked = true;" />
      </body>
    </html>
  """

appServer = app.listen()

describe "Pages"
  "A Phantom page":
    topic: t ->
      phantom.create {port: 12303}, (ph) =>
        ph.createPage (page) =>
          @callback null, page, ph

    "can open a URL on localhost":
      topic: t (page) ->
        page.open "http://127.0.0.1:#{appServer.address().port}/", (status) =>
          @callback null, page, status

      "and succeed": (err, page, status) ->
        assert.equal status, "success"

      "and the page, once it loads,":
        topic: t (page, status) ->
          setTimeout =>
            @callback null, page
          , 1500

        "has a title":
          topic: t (page) ->
            page.evaluate (-> document.title), (title) =>
              @callback null, title

          "which is correct": (title) ->
            assert.equal title, "Test page title"

        "can inject Javascript from a file":
          topic: t (page) ->
            page.injectJs 'test/inject.js', (success) =>
              @callback null, success

          "and succeed": (success) ->
            assert.ok success, "Injection should return true"

        "can evaluate DOM nodes":
          topic: t (page) ->
            page.evaluate (-> document.getElementById('somediv')), (node) =>
              @callback null, node

          "which match": (node) ->
            assert.equal node.tagName, 'DIV'
            assert.equal node.id, 'somediv'

        "can evaluate scripts defined in the header":
          topic: t (page) ->
            page.evaluate (-> $('#somediv').html()), (html) =>
              @callback null, html

          "which return the correct result": (html) ->
            html = html.replace(/\s\s+/g, "")
            assert.equal html, '<div class="anotherdiv">Some page content</div>'
        
        "can set a nested property":
          topic: t (page) ->
            page.set 'settings.loadPlugins', true, (oldVal) =>
              @callback null, page, oldVal

          "and get it again":
            topic: t (page, oldVal) ->
              page.get 'settings.loadPlugins', (val) =>
                @callback null, oldVal, val

            "and they match": (err, oldVal, val) ->
              assert.equal oldVal, val

        "can simulate clicks on page locations":
          topic: t (page) ->
            page.sendEvent 'click', 133, 133
            page.evaluate (-> window.i_got_clicked), (clicked) =>
              @callback null, clicked

          "and have those clicks register": (clicked) ->
            assert.ok clicked

        ###
        "can register an onAlert handler":
          topic: t (page) ->
            page.set 'onAlert', (msg) =>
              @callback null, msg
            page.evaluate (-> alert "Hello, world!")

          "which works correctly": (msg) ->
            assert.equal msg, "Hello, world!"

        "can register an onConsoleMessage handler":
          topic: t (page) ->
            page.set 'onConsoleMessage', (msg) =>
              @callback null, msg
            page.evaluate (-> console.log "Hello, world!")

          "which works correctly": (msg) ->
            assert.equal msg, "Hello, world!"
        ###

        "can render the page to a file":
          topic: t (page) ->
            fileName = temp.path suffix: '.png'
            page.render fileName, =>
              @callback null, fileName

          "which is created": (fileName) ->
            assert.ok fs.existsSync(fileName), "rendered image should exist"

          teardown: (fileName) ->
            fs.unlink fileName
    teardown: (page, ph) ->
      appServer.close()
      ph.exit()
