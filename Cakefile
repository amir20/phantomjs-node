{spawn} = require 'child_process'
Promise = require 'bluebird'

bin = "./node_modules/.bin"
sh = "/bin/sh"

_runCmd = (prev, current) ->
  prev.then ->
    new Promise (resolve, reject) ->
      args = ['-c', current]
      child = spawn sh, args, {stdio: 'inherit'}

      child.on 'error', reject

      child.on 'exit', (code) ->
        if (code or 0) is 0 then resolve() else reject()

run = (cmds...) ->
  seq = cmds.reduce _runCmd, Promise.resolve()
  seq.error (err) -> console.log 'Failed.', err

cleanup = ->
  run "rm -rf .test .shim.js"

exit = (code = 0) ->
  process.exit code

callbacks =
  success: -> console.log 'Great Success!'
  error: -> console.error 'Task failed.'

task "clean", "cleanup build and test artifacts", ->
  cleanup().then -> console.log 'All clean.'

task "build", "coffee-compile and browserify phantom", ->
  run(
    "#{bin}/coffee -c phantom.coffee"
    "#{bin}/browserify shim.coffee -o .shim.js"
    "cat pre_shim.js .shim.js > shim.js"
  )
    .then(callbacks.success, callbacks.error)
    .finally cleanup

task "test", "run phantom's unit tests", ->
  invoke('build').then ->
    batch = run(
      "#{bin}/coffee -o .test -c test/*.coffee"
      "cp test/*.gif test/*.js .test/"
      "#{bin}/vows --spec .test/*.js"
    )

    batch
      .then(callbacks.success, callbacks.error)
      .then(cleanup)
      .catch -> exit(1)
