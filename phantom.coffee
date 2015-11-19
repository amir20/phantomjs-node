dnode    = require 'dnode'
http     = require 'http'
shoe     = require 'shoe'
spawn    = require 'win-spawn'

# the list of phantomjs RPC wrapper
phanta = []

# @Description: starts and returns a child process running phantomjs
# @param: port:int
# @args: args:object
# @return: ps:object
startPhantomProcess = (binary, port, hostname, args) ->
  spawn binary, args.concat([
    __dirname + '/shim.js'
    port
    hostname
  ])

# @Description: kills off all phantom processes within spawned by this parent
# process when it is exits

cleanUp = ->
  phantom.exit() for phantom in phanta

onSignalClean = (signal) ->
  return ->
    if process.listeners(signal).length is 1
      process.exit(0)

process.on('exit', cleanUp)
process.on(signal, onSignalClean(signal)) for signal in ['SIGINT', 'SIGTERM']

# @Description: We need this because dnode does magic clever stuff with
# functions, but we want the function to make it intact to phantom
wrap = (ph) ->
  ph.callback = (fn) ->
    return '__phantomCallback__'+fn.toString()
  ph._createPage = ph.createPage
  ph.createPage = (cb) ->
    ph._createPage (page) ->
      page._evaluate = page.evaluate
      page.evaluate = (fn, cb, args...) ->
        page._evaluate.apply(page, [fn.toString(), cb].concat(args))
      page._onResourceRequested = page.onResourceRequested
      # can apply extra args which will be passed to phantomjs
      # onResourceRequested scope
      page.onResourceRequested = (fn, cb, args...) ->
        page._onResourceRequested.apply(page, [fn.toString(), cb].concat(args))
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
    if typeof options.parameters is 'object'
      for key, value of options.parameters
        args.push '--'+key+'='+value
    options.path ?= ''
    options.binary ?= options.path+'phantomjs'
    options.port ?= 0
    options.hostname ?= 'localhost'
    options.dnodeOpts ?= {}

    ps = null
    phantom = null

    httpServer = http.createServer()
    httpServer.listen options.port, options.hostname

    httpServer.on "error", (err) ->
      if cb?
        cb null, err
      else
        throw err

    httpServer.on 'listening', ->
      port = httpServer.address().port
      hostname = httpServer.address().address
      ps = startPhantomProcess options.binary, port, hostname, args

      ps.stdout.on 'data', options.onStdout || (data) ->
        console.log "phantom stdout: #{data}"

      ps.stderr.on 'data', options.onStderr || (data) ->
        module.exports.stderrHandler(data.toString('utf8'))

      ps.on 'error', (err) ->
        httpServer.close()
        if err?.code is 'ENOENT'
          console.error "phantomjs-node: You don't have 'phantomjs' installed"
        if cb?
          cb null, err
        else
          throw err

      # @Description: when the background phantomjs child process exits or
      # crashes removes the current dNode phantomjs RPC wrapper from the list of
      # phantomjs RPC wrapper
      ps.on 'exit', (code, signal) ->
        httpServer.close()
        if phantom
          phantom.onExit?()
          phanta = (p for p in phanta when p isnt phantom)

        if options.onExit
          options.onExit code, signal
        else
          console.assert not signal?, "signal killed phantomjs: #{signal}"
          if code isnt 0
            process.exit code

    sock = shoe (stream) ->

      d = dnode({}, options.dnodeOpts)

      d.on 'remote', (_phantom) ->
        phantom = _phantom
        wrap phantom
        phantom.process = ps
        phanta.push phantom
        cb? phantom, null

      d.pipe stream
      stream.pipe d

    sock.install httpServer, '/dnode'

  stderrHandler: (message) ->
    NON_ERROR_MESSAGE =
      /No such method.*socketSentData|CoreText performance note/

    if NON_ERROR_MESSAGE.test message
      return # Stupid, stupid QTWebKit
    console.warn "phantom stderr: #{message}"
