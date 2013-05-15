# Require gets overwritten by browserify, so we have to reimplement it from scratch - boo :(
webpage = core_require('webpage');

shoe     = require('shoe');
dnode    = require('dnode');

[port] = phantom.args

# controlPage = webpage.create()

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
  ['open','close','includeJs','sendEvent','release','uploadFile','close']
  injectJs: (js, cb=->) -> cb page.injectJs js
  evaluate: (fn, cb=(->), args...) -> cb page.evaluate.apply(page, [fn].concat(args))
  render: (file, cb=->) -> page.render file; cb()
  renderBase64: (type, cb=->) -> cb page.renderBase64 type
  setHeaders: (headers, cb=->) -> page.customHeaders = headers; cb()
  setContent: (html, url, cb=->) ->
    page.onLoadFinished = (status) ->
      page.onLoadFinished = null
      cb status
    page.setContent html, url
  setViewportSize: (width, height, cb=->) ->
    page.viewportSize = {width:width, height:height}; cb()

_phantom = mkwrap phantom,
  ['exit'],
  injectJs: (js, cb=->) -> cb phantom.injectJs js
  getCookies: (cb=->) -> cb(phantom.cookies)
  addCookie: (name, value, domain, cb=->) ->
    cookie = {name:name, value:value, domain:domain}
    cb(phantom.addCookie(cookie))
  clearCookies: (cb=->) -> cb phantom.clearCookies()
  createPage: (cb) -> cb pageWrap webpage.create()

    
stream = shoe('http://localhost:' + port + '/dnode')

d = dnode _phantom

d.pipe stream
stream.pipe d
