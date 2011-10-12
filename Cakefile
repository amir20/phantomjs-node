{exec} = require 'child_process'

bin = "./node_modules/.bin"

run = (cmds...) ->
  exec cmds.join(' && '), (err, stdout, stderr) ->
    if err
      console.log stderr.trim()
    else
      console.log "done"

task "build", "coffee-compile and browserify phantom", ->
  run(
    "#{bin}/coffee -c phantom.coffee"
    "rm shim.js"
    "#{bin}/browserify shim.coffee -o shim.js"
  )
task "test", "run phantom's unit tests", -> run "#{bin}/vows test"
