# PhantomJS bridge for NodeJS [![Build Status](https://travis-ci.org/sgentle/phantomjs-node.svg?branch=master)](https://travis-ci.org/sgentle/phantomjs-node)

"It sure would be neat if [PhantomJS](http://www.phantomjs.org/) was a NodeJS module", I hear you say. Well, wait no longer! This node module implements a nauseously clever bridge between Phantom and Node, so that you can use all your favourite PhantomJS functions without leaving NPM behind and living in a cave.

## Installation

First, make sure PhantomJS is installed. This module expects the ```phantomjs``` binary to be in PATH somewhere. In other words, type this:

    $ phantomjs

If that works, so will phantomjs-node. It's only been tested with PhantomJS 1.3, and almost certainly doesn't work with anything older.

Install it like this:

    npm install phantom


For a brief introduction continue reading, otherwise **go to the [Wiki page](https://github.com/sgentle/phantomjs-node/wiki) for more information!**


## How do I use it?

Use it like this in Coffeescript:

```coffeescript
phantom = require 'phantom'

phantom.create (ph) ->
  ph.createPage (page) ->
    page.open "http://www.google.com", (status) ->
      console.log "opened google? ", status
      page.evaluate (-> document.title), (result) ->
        console.log 'Page title is ' + result
        ph.exit()
```

In Javascript:

```js
var phantom = require('phantom');

phantom.create(function (ph) {
  ph.createPage(function (page) {
    page.open("http://www.google.com", function (status) {
      console.log("opened google? ", status);
      page.evaluate(function () { return document.title; }, function (result) {
        console.log('Page title is ' + result);
        ph.exit();
      });
    });
  });
});
```

### Use it in Windows

It would use `dnode` with `weak` module by default. It means that you need to setup `node-gyp` with Microsoft VS2010 or VS2012, which is a huge installation on Windows.

`dnodeOpts` property could help you to control dnode settings, so you could disable `weak` by setting it `false` to avoid that complicated installations.

```js
var phantom = require('phantom');

phantom.create(function (ph) {
  ph.createPage(function (page) {
    /* the page actions */
  });
}, {
  dnodeOpts: {
    weak: false
  }
});
```

### Use it in restricted enviroments

Some enviroments (eg. [OpenShift](https://help.openshift.com/hc/en-us/articles/202185874-I-can-t-bind-to-a-port)) have special requirements that are difficult or impossible to change, especifficaly: hostname/ip and port restrictions for the internal communication server and path for the phantomjs binary.

By default, the hostname/ip used for this will be `localhost`, the port will be port `0` and the phantomjs binary is going to be assumed to be in the `PATH` enviroment variable, but you can use specific configurations using an `options` object like this:

```js
var options = {
  port: 16000,
  hostname: "192.168.1.3",
  path: "/phantom_path/"
}

phantom.create(function, options);
```

## Functionality details

You can use all the methods listed on the [PhantomJS API page](http://phantomjs.org/api/)


Due to the async nature of the bridge, some things have changed, though:

* Return values (ie, of ```page.evaluate```) are returned in a callback instead
* ```page.render()``` takes a callback so you can tell when it's done writing the file
* Properties can't be get/set directly, instead use ```page.get('version', callback)``` or ```page.set('viewportSize', {width:640,height:480})```, etc. Nested objects can be accessed by including dots in keys, such as ```page.set('settings.loadImages', false)```
* Callbacks can't be set directly, instead use ```page.set('callbackName', callback)```, e.g. ```page.set('onLoadFinished', function(success) {})```
* onResourceRequested takes a function that executes in the scope of phantom which has access to ```request.abort()```, ```request.changeUrl(url)```, and ```request.setHeader(key,value)```. The second argument is the callback which can execute in the scope of your code, with access to just the requestData. This function can apply extra arguments which can be passed into the first function e.g.
```
page.onResourceRequested(
	function(requestData, request, arg1, arg2) { request.abort(); },
	function(requestData) { console.log(requestData.url) },
	arg1, arg2
);
```

```ph.createPage()``` makes new PhantomJS WebPage objects, so use that if you want to open lots of webpages. You can also make multiple phantomjs processes by calling ```phantom.create('flags', { port: someDiffNumber})``` multiple times, so if you need that for some crazy reason, knock yourself out!

Also, you can set exit callback, which would be invoked after ```phantom.exit()``` or after phantom process crash:
```
phantom.create('flags', { port: 8080, onExit: exitCallback})
```

You can also pass command line switches to the phantomjs process by specifying additional args to ```phantom.create()```, eg:

```coffeescript
phantom.create '--load-images=no', '--local-to-remote-url-access=yes', (page) ->
```

or by specifying them in the options object:

```coffeescript
phantom.create {parameters: {'load-images': 'no', 'local-to-remote-url-access': 'yes'}}, (page) ->
```

If you need to access the [ChildProcess](http://nodejs.org/api/child_process.html#child_process_class_childprocess) of the phantom process to get its PID, for instance, you can access it through the `process` property like this:
```
phantom.create(function (ph) {
  console.log('phantom process pid:', ph.process.pid);
});
```

##Note for Mac users

Phantom requires you to have the XCode Command Line Tools installed on your box, or else you will get some nasty errors (`xcode` not found or `make` not found).  If you haven't already, simply install XCode through the App Store, then [install the command line tools](http://stackoverflow.com/questions/6767481/where-can-i-find-make-program-for-mac-os-x-lion).  

## How does it work?

Don't ask. The things these eyes have seen.

## No really, how does it work?

I will answer that question with a question. How do you communicate with a process that doesn't support shared memory, sockets, FIFOs, or standard input?

Well, there's one thing PhantomJS does support, and that's opening webpages. In fact, it's really good at opening web pages. So we communicate with PhantomJS by spinning up an instance of ExpressJS, opening Phantom in a subprocess, and pointing it at a special webpage that turns socket.io messages into ```alert()``` calls. Those ```alert()``` calls are picked up by Phantom and there you go!

The communication itself happens via James Halliday's fantastic [dnode](https://github.com/substack/dnode) library, which fortunately works well enough when combined with [browserify](https://github.com/substack/node-browserify) to run straight out of PhantomJS's pidgin Javascript environment.

If you'd like to hack on phantom, please do! You can run the tests with ```cake test``` or ```npm test```, and rebuild the coffeescript/browserified code with ```cake build```. You might need to ```npm install -g coffee-script``` for cake to work.
