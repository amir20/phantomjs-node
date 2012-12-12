var spawn = require('child_process').spawn
var concat = require('./')

// real world example
var cmd = spawn('ls')
cmd.stdout.pipe(
  concat(function(err, out) {
    console.log('`ls`', err, out.toString())
  })
)

// array stream
var arrays = concat(function(err, out) {
  console.log('arrays', err, out)
})
arrays.write([1,2,3])
arrays.write([4,5,6])
arrays.end()

// buffer stream
var buffers = concat(function(err, out) {
  console.log('buffers', err, out)
})
buffers.write(new Buffer('pizza '))
buffers.write(new Buffer('cats'))
buffers.end()

// string stream
var strings = concat(function(err, out) {
  console.log('strings', err, out)
})
strings.write("nacho ")
strings.write("dogs")
strings.end()
