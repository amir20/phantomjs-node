dnode   = require 'dnode'
express = require 'express'
child   = require 'child_process'

PORT = 6123

listenOnSomePort = (app, startPort) ->
  loop
    try
      app.listen startPort
      return startPort
    catch err
      if err.code is "EADDRINUSE"
        startPort++
      else
        throw err

phanta = []
startPhantomProcess = (port) ->
  ps = child.spawn 'phantomjs', [__dirname+'/shim.js', port]

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
  create: (cb) ->
    app = express.createServer()
    app.use express.static __dirname
    
    port = listenOnSomePort app, PORT

    server = dnode()

    phantom = null

    ps = startPhantomProcess port

    ps.on 'exit', (code) ->
      app.close()
      phanta = (p for p in phanta when p isnt phantom)


    server.listen app, {io: log: null}, (obj, conn) ->
      phantom = conn.remote
      wrap phantom
      phanta.push phantom
      cb? phantom



