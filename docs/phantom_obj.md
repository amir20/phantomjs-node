# phantom object API

## create

To create a new instance of `phantom` use `phantom.create()` which returns a `Promise` which should resolve with a `phantom` object.
If you want add parameters to the phantomjs process you can do so by doing:

```js
var phantom = require('phantom');
phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']).then(...)
```
You can also explicitly set :

- The phantomjs path to use
- The path to the shim/index.js to use
- A logger object
- A log level if no logger was specified

by passing them in config object:
```js
var phantom = require('phantom');
phantom.create([], {
    phantomPath: '/path/to/phantomjs',
    shimPath: '/path/to/shim/index.js',
    logger: yourCustomLogger,
    logLevel: 'debug',
}).then(...)
```

The `logger` parameter should be a `logger` object containing your logging functions. The `logLevel` parameter should be log level like `"warn"` or `"debug"` (It uses the same log levels as `npm`), and will be ignored if `logger` is set. Have a look at the `logger` property below for more information about these two parameters.

## createPage

To create a new `page`, you have to call `createPage()`:

```js
var sitepage = null;
var phInstance = null;
phantom.create()
    .then(instance => {
        phInstance = instance;
        return instance.createPage();
    })
    .then(page => {
	// use page
    })
    .catch(error => {
        console.log(error);
        phInstance.exit();
    });
```

## exit

Sends an exit call to phantomjs process.

Make sure to call it on the phantom instance to kill the phantomjs process. Otherwise, the process will never exit.

## kill

Kills the underlying phantomjs process (by sending `SIGKILL` to it).

It may be a good idea to register handlers to `SIGTERM` and `SIGINT` signals with `#kill()`.

However, be aware that phantomjs process will get detached (and thus won't exit) if node process that spawned it receives `SIGKILL`!

## logger

The property containing the [winston](https://www.npmjs.com/package/winston) `logger` used by a `phantom` instance. You may change parameters like verbosity or redirect messages to a file with it.

You can also use your own logger by providing it to the `create` method. The `logger` object can contain four functions : `debug`, `info`, `warn` and `error`. If one of them is empty, its output will be discarded.

Here are two ways of handling it :
```js
/* Set the log level to 'error' at creation, and use the default logger  */
phantom.create([], { logLevel: 'error' }).then(function(ph) {
    // use ph
});

/* Set a custom logger object directly in the create call. Note that `info` is not provided here and so its output will be discarded */
var log = console.log;
var nolog = function() {};
phantom.create([], { logger: { warn: log, debug: nolog, error: log } }).then(function(ph) {
    // use ph
});
```
