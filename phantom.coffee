dnode   = require 'dnode'
express = require 'express'
child   = require 'child_process'

phanta = []
startPhantomProcess = (port, args) ->
  ps = child.spawn 'phantomjs', args.concat [__dirname+'/shim.js', port]

  ps.stdout.on 'data', (data) -> console.log "phantom stdout: #{data}"
  ps.stderr.on 'data', (data) -> 
    return if data.toString('utf8').match /No such method.*socketSentData/ #Stupid, stupid QTWebKit
    console.warn "phantom stderr: #{data}"
  ps

process.on 'exit', ->
  phantom.exit() for phantom in phanta


# We need this because dnode does magic clever stuff with functions, but we want the function to make it intact to phantom
wrap = (ph) ->
  ph._createPage = ph.createPage
  ph.createPage = (cb) ->
    ph._createPage (page) ->
      page._evaluate = page.evaluate
      page.evaluate = (fn, cb) -> page._evaluate fn.toString(), cb
      cb page



module.exports = 
  create: (args..., cb) ->
    app = express.createServer()
    app.use express.static __dirname
    
    appServer = app.listen()

    server = dnode()

    phantom = null

    ps = startPhantomProcess appServer.address().port, args

    ps.on 'exit', (code) ->
      appServer.close()
      phanta = (p for p in phanta when p isnt phantom)

    io =
      log: null,
      'client store expiration': 0

    server.listen appServer, {io}, (obj, conn) ->
      phantom = conn.remote
      wrap phantom
      phanta.push phantom
      cb? phantom



