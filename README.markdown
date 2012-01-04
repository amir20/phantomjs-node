# PhantomJS bridge for NodeJS

"It sure would be neat if [PhantomJS](http://www.phantomjs.org/) was a NodeJS module", I hear you say. Well, wait no longer! This node module implements a nauseously clever bridge between Phantom and Node, so that you can use all your favourite PhantomJS functions without leaving NPM behind and living in a cave.

## How do I use it?

First, make sure PhantomJS is installed. This module expects the ```phantomjs``` binary to be in PATH somewhere. In other words, type this:

    $ phantomjs

If that works, so will phantomjs-node. It's only been tested with PhantomJS 1.3, and almost certainly doesn't work with anything older.

Install it like this:

    npm install phantom

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

In Javascript, do the same but add parentheses and curly braces everywhere.

You can use all the methods listed on the [PhantomJS API page](http://code.google.com/p/phantomjs/wiki/Interface)


Due to the async nature of the bridge, some things have changed, though:

* Return values (ie, of ```page.evaluate```) are returned in a callback instead
* ```page.render()``` takes a callback so you can tell when it's done writing the file
* Properties can't be get/set directly, instead use ```p.get('version', callback)``` or ```p.page.set('viewportSize', {width:640,height:480})```, etc. Nested objects can be accessed by including dots in keys, such as ```p.page.set('settings.loadImages', false)```

```ph.createPage()``` makes new PhantomJS WebPage objects, so use that if you want to open lots of webpages. You can also make multiple phantomjs processes by calling ```phantom.create()``` multiple times, so if you need that for some crazy reason, knock yourself out!

You can also pass command line switches to the phantomjs process by specifying additional args to ```phantom.create()```, eg:

```coffeescript
phantom.create '--load-images=no', '--local-to-remote-url-access=yes', (page) ->
```


## How does it work?

Don't ask. The things these eyes have seen.

## No really, how does it work?

I will answer that question with a question. How do you communicate with a process that doesn't support shared memory, sockets, FIFOs, or standard input?

Well, there's one thing PhantomJS does support, and that's opening webpages. In fact, it's really good at opening web pages. So we communicate with PhantomJS by spinning up an instance of ExpressJS, opening Phantom in a subprocess, and pointing it at a special webpage that turns socket.io messages into ```alert()``` calls. Those ```alert()``` calls are picked up by Phantom and there you go!

The communication itself happens via James Halliday's fantastic [dnode](https://github.com/substack/dnode) library, which fortunately works well enough when combined with [browserify](https://github.com/substack/node-browserify) to run straight out of PhantomJS's pidgin Javascript environment.

If you'd like to hack on phantom, please do! You can run the tests with ```cake test``` or ```npm test```, and rebuild the coffeescript/browserified code with ```cake build```. You might need to ```npm install -g coffeescript``` for cake to work.
