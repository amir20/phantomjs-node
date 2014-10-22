# Require gets overwritten by browserify, so we have to reimplement it from scratch - boo :(
webpage = core_require('webpage');

shoe     = require('shoe');
dnode    = require('dnode');
system   = core_require('system');

port = system.args[1]
hostname = system.args[2]

# controlPage = webpage.create()

fnwrap = (target) -> -> target.apply this, arguments

# Descend into objects with dotted keys
descend = (op, obj, key, val) ->
  cur = obj
  keys = key.split '.'
  cur = cur[keys.shift()] while keys.length > 1

  cur[keys[0]] = val if op is 'set'

  cur[keys[0]]

_transform = (val) ->
  if typeof val is "string" and val.indexOf('__phantomCallback__') is 0
    val = 'return ' + val.replace('__phantomCallback__', '');
    val = phantom.callback(new Function(val)());

  return val;

transform = (obj) ->
  if typeof obj is "string"
    _transform(obj)
  else if typeof obj is "object"
    for key of obj
      if typeof obj[key] is "object"
        transform(obj[key])
      else
        obj[key] = _transform(obj[key])

  return obj


mkwrap = (src, pass=[], special={}) ->
  obj =
    set: (key, val, cb=->) ->

      #Fnwrap so PhantomJS doesn't segfault when it tries to call the callback
      val = fnwrap val if typeof val is "function"

      val = transform(val)

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
  ['open','close','includeJs','sendEvent','release','uploadFile','goBack','goForward','reload']
  # this is here to let the user pass in a function that has access to request.abort() and other functions on the request object.
  onConsoleMessage: (fn, cb=(->)) ->
    page.onConsoleMessage = ->
      fn.apply(this, arguments)
    cb()
  onResourceRequested: (fn, cb=(->)) ->
    page.onResourceRequested = ->
      # give a name to the anonymouse function so that we can call it
      fn = fn.replace /function.*\(/, 'function x('
      # the only way we can access the request object is by passing a function to this point as a string and expanding it
      eval(fn) # :(
      # this function has access to request.abort()
      x.apply(this, arguments)
      # this function does not have access to request.abort()
      cb.apply(this, arguments)
  injectJs: (js, cb=->) -> cb page.injectJs js
  evaluate: (fn, cb=(->), args...) -> cb page.evaluate.apply(page, [fn].concat(args))
  render: (file, opts={}, cb) ->
    unless cb?
      if typeof opts is 'function'
        cb = opts
        opts = {}
      else
        cb = ->

    page.render file, opts; cb()
  getContent: (cb=->) -> cb page.content
  getCookies: (cb=->) -> cb page.cookies
  renderBase64: (type, cb=->) -> cb page.renderBase64 type
  setHeaders: (headers, cb=->) -> page.customHeaders = headers; cb()
  setContent: (html, url, cb=->) ->
    page.onLoadFinished = (status) ->
      page.onLoadFinished = null
      cb status
    page.setContent html, url
  setViewportSize: (width, height, cb=->) ->
    page.viewportSize = {width:width, height:height}; cb()
  setPaperSize: (options, cb=->) ->
    page.paperSize = transform(options); cb()
  setZoomFactor: (zoomFactor, cb=->) -> page.zoomFactor = zoomFactor; cb()

_phantom = mkwrap phantom,
  ['exit'],
  injectJs: (js, cb=->) -> cb phantom.injectJs js
  getCookies: (cb=->) -> cb(phantom.cookies)
  addCookie: (name, value, domain, cb=->) ->
    cookie = {name:name, value:value, domain:domain}
    cb(phantom.addCookie(cookie))
  clearCookies: (cb=->) -> cb phantom.clearCookies()
  createPage: (cb) -> cb pageWrap webpage.create()


stream = shoe('http://' + hostname + ':' + port + '/dnode')

d = dnode _phantom

d.pipe stream
stream.pipe d
