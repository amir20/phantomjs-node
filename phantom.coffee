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
  child.spawn binary, args.concat [__dirname+'/shim.js', port]

# @Description: kills off all phantom processes within spawned by this parent process when it is exits
onSignal = ->
  phantom.exit() for phantom in phanta
  process.exit()

process.on 'exit', ->
  phantom.exit() for phantom in phanta
process.on 'SIGINT', onSignal
process.on 'SIGTERM', onSignal

# @Description: We need this because dnode does magic clever stuff with functions, but we want the function to make it intact to phantom
wrap = (ph) ->
  ph._createPage = ph.createPage
  ph.createPage = (cb) ->
    ph._createPage (page) ->
      page._evaluate = page.evaluate
      page.evaluate = (fn, cb, args...) -> page._evaluate.apply(page, [fn.toString(), cb].concat(args))
      page._onResourceRequested = page.onResourceRequested
      page.onResourceRequested = (fn, cb) -> page._onResourceRequested.apply(page, [fn.toString(), cb])
      cb page



module.exports =
  create: ->
    args = []
    options = {}
    for arg in arguments
      switch typeof arg
        when 'function' then cb = arg
        when 'string' then args.push arg
        when 'object' then options = arg
    options.binary ?= 'phantomjs'
    options.port ?= 12300

    phantom = null

    httpServer = http.createServer()
    httpServer.listen options.port

    httpServer.on 'listening', () ->

      ps = startPhantomProcess options.binary, options.port, args

      ps.stdout.on 'data', options.onStdout || (data) -> console.log "phantom stdout: #{data}"
      
      ps.stderr.on 'data', options.onStderr || (data) -> module.exports.stderrHandler(data.toString('utf8'))
      
      ps.on 'error', (err) ->
        if err?.code is 'ENOENT'
          console.error "phantomjs-node: You don't have 'phantomjs' installed"
        else
          throw err

      # @Description: when the background phantomjs child process exits or crashes
      #   removes the current dNode phantomjs RPC wrapper from the list of phantomjs RPC wrapper
      ps.on 'exit', (code, signal) ->
        httpServer.close()
        if phantom
          phantom && phantom.onExit && phantom.onExit() # calls the onExit method if it exist
          phanta = (p for p in phanta when p isnt phantom)

        if options.onExit
          options.onExit code, signal
        else
          console.assert not signal?, "signal killed phantomjs: #{signal}"
          console.assert code is 0, "abnormal phantomjs exit code: #{code}"

    sock = shoe (stream) ->

      d = dnode()

      d.on 'remote', (phantom) ->
        wrap phantom
        phanta.push phantom
        cb? phantom

      d.pipe stream
      stream.pipe d

    sock.install httpServer, '/dnode'

  stderrHandler: (message) ->
    return if message.match /(No such method.*socketSentData)|(CoreText performance note)/ #Stupid, stupid QTWebKit
    console.warn "phantom stderr: #{message}"

