
# Require gets overwritten by browserify, so we have to reimplement it from scratch - boo :(
mkweb = new Function "exports", "window", phantom.loadModuleSource('webpage')
webpage = {}
mkweb.call {}, webpage, {} 

proto = require 'dnode-protocol'

[port] = phantom.args

controlPage = webpage.create()

fnwrap = (target) -> -> target.apply this, arguments

# Descend into objects with dotted keys
descend = (op, obj, key, val) ->
  cur = obj
  keys = key.split '.'
  cur = cur[keys.shift()] while keys.length > 1

  cur[keys[0]] = val if op is 'set'
    
  cur[keys[0]]


mkwrap = (src, pass=[], special={}) ->
  obj =
    set: (key, val, cb=->) ->
      
      #Fnwrap so PhantomJS doesn't segfault when it tries to call the callback
      val = fnwrap val if typeof val is "function"
      cb descend 'set', src, key, val

    get: (key, cb) -> cb descend 'get', src, key

  for k in pass
    do (k) ->
      obj[k] = (args...) ->

        # This idempotent tomfoolery is required to stop PhantomJS from segfaulting
        args[i] = fnwrap arg for arg, i in args when typeof arg is 'function'
          
        src[k] args...

  for own k of special
    obj[k] = special[k]
  obj

pageWrap = (page) -> mkwrap page,
  ['open','includeJs','sendEvent','release','uploadFile']
  injectJs: (js, cb=->) -> cb page.injectJs js
  evaluate: (fn, cb=->) -> cb page.evaluate fn
  render: (file, cb=->) -> page.render file; cb()

_phantom = mkwrap phantom,
  ['exit'],
  injectJs: (js, cb=->) -> cb phantom.injectJs js
  createPage: (cb) -> cb pageWrap webpage.create()


server = proto _phantom
s = server.create()


s.on 'request', (req) ->
  #console.log "phantom sending request #{JSON.stringify req}"
  #evil = "function(){socket.send(#{JSON.stringify JSON.stringify req} + '\\n');}"
  evil = "function(){socket.emit('message', #{JSON.stringify JSON.stringify req} + '\\n');}"
  controlPage.evaluate evil

controlPage.onAlert = (msg) ->
  return unless msg[0..5] is "PCTRL "
  #console.log "phantom got request " + msg[6..]
  s.parse msg[6..]


controlPage.onConsoleMessage = (msg...) -> console.log msg...

controlPage.open "http://127.0.0.1:#{port}/", (status) ->
  #console.log 'Control page title is ' + controlPage.evaluate -> document.title
  s.start()

