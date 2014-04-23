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
        if code? then resolve() else reject()

run = (cmds...) ->
  seq = cmds.reduce _runCmd, Promise.resolve()
  seq.error (err) -> console.log 'Failed.', err

cleanup = ->
  run "rm -rf .test .shim.js"

task "clean", "cleanup build and test artifacts", ->
  cleanup().then -> console.log 'All clean.'

task "build", "coffee-compile and browserify phantom", ->
  run(
    "#{bin}/coffee -c phantom.coffee"
    "#{bin}/browserify shim.coffee -o .shim.js"
    "cat pre_shim.js .shim.js > shim.js"
  ).then(cleanup).then ->
    console.log 'Build successful.'

task "test", "run phantom's unit tests", ->
  invoke('build').then ->
    run(
      "#{bin}/coffee -o .test -c test/*.coffee"
      "cp test/*.gif test/*.js .test/"
      "#{bin}/vows --spec .test/*.js"
    ).then(cleanup).then ->
      console.log 'Great Success!'
