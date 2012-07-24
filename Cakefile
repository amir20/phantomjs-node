{exec} = require 'child_process'

bin = "./node_modules/.bin"

run = (cmds...) ->
  exec cmds.join(' && '), (err, stdout, stderr) ->
    stderr = stderr.trim()
    stdout = stdout.trim()
    console.log stderr if stderr
    console.log stdout if stdout
    if err
      console.log "Failed."
    else
      console.log "Great success!"

task "build", "coffee-compile and browserify phantom", ->
  run(
    "#{bin}/coffee -c phantom.coffee"
    "rm shim.js"
    "#{bin}/browserify shim.coffee -o .shim.js"
    "cat pre_shim.js .shim.js > shim.js"
    "rm .shim.js"
  )
task "test", "run phantom's unit tests", -> run "#{bin}/vows --spec test/*.coffee"
