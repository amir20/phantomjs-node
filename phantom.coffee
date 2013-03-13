dnode   = require 'dnode'
express = require 'express'
child   = require 'child_process'

# the list of phantomjs RPC wrapper
phanta = []

# @Description: starts and returns a child process running phantomjs
# @param: port:int
# @args: args:object
# @return: ps:object
startPhantomProcess = (port, args) ->
  ps = child.spawn 'phantomjs', args.concat [__dirname+'/shim.js', port]

  ps.stdout.on 'data', (data) -> console.log "phantom stdout: #{data}"
  ps.stderr.on 'data', (data) ->
    return if data.toString('utf8').match /No such method.*socketSentData/ #Stupid, stupid QTWebKit
    console.warn "phantom stderr: #{data}"
  ps

# @Description: kills off all phantom processes within spawned by this parent process when it is exits
process.on 'exit', ->
  phantom.exit() for phantom in phanta


# @Description: We need this because dnode does magic clever stuff with functions, but we want the function to make it intact to phantom
wrap = (ph) ->
  ph._createPage = ph.createPage
  ph.createPage = (cb) ->
    ph._createPage (page) ->
      page._evaluate = page.evaluate
      page.evaluate = (fn, cb, args...) -> page._evaluate.apply(page, [fn.toString(), cb].concat(args))
      cb page



module.exports =
  create: (args..., cb) ->
    app = express()
    app.use express.static __dirname

    appServer = app.listen()

    server = dnode()

    phantom = null

    ps = startPhantomProcess appServer.address().port, args

    # @Description: when the background phantomjs child process exits or crashes
    #   removes the current dNode phantomjs RPC wrapper from the list of phantomjs RPC wrapper
    ps.on 'exit', (code) ->
      phantom.onExit && phantom.onExit() # calls the onExit method if it exist
      appServer.close()
      phanta = (p for p in phanta when p isnt phantom)

    io =
      log: null,
      'client store expiration': 0

    # Creates a dNode server that listens to 
    server.listen appServer, {io}, (obj, conn) ->
      phantom = conn.remote # remote phantomjs RPC wrapper
      wrap phantom
      phanta.push phantom
      cb? phantom



