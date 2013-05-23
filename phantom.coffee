dnode    = require 'dnode'
http     = require 'http'
shoe     = require 'shoe'
child    = require 'child_process'

# the list of phantomjs RPC wrapper
phanta = []

# @Description: starts and returns a child process running phantomjs
# @param: port:int
# @args: args:object
# @return: ps:object
startPhantomProcess = (binary, port, args) ->
  ps = child.spawn binary, args.concat [__dirname+'/shim.js', port]

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
  create: (args..., cb, binary = 'phantomjs', port = 12300) ->

    phantom = null

    httpServer = http.createServer()
    httpServer.listen port

    httpServer.on 'listening', () ->

      ps = startPhantomProcess binary, port, args

      # @Description: when the background phantomjs child process exits or crashes
      #   removes the current dNode phantomjs RPC wrapper from the list of phantomjs RPC wrapper
      ps.on 'exit', (code) ->
        httpServer.close()
        if phantom
          phantom && phantom.onExit && phantom.onExit() # calls the onExit method if it exist
          phanta = (p for p in phanta when p isnt phantom)

    sock = shoe (stream) ->

      d = dnode()

      d.on 'remote', (phantom) ->
        wrap phantom
        phanta.push phantom
        cb? phantom

      d.pipe stream
      stream.pipe d

    sock.install httpServer, '/dnode'
