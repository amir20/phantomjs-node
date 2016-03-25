phantom - Fast NodeJS API for PhantomJS
========
[![NPM](https://nodei.co/npm/phantom.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/phantom/)

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Linux Build][travis-image]][travis-url]
[![Dependencies][david-image]][david-url]


## Super easy to use
```js
var phantom = require('phantom');

var sitepage = null;
var phInstance = null;
phantom.create()
    .then((instance) => {
        phInstance = instance;
        return instance.createPage();
    })
    .then((page) => {
        sitepage = page;
        return page.open('https://stackoverflow.com/');
    })
    .then((status) => {
        console.log(status);
        return sitepage.property('content');
    })
    .then((content) => {
        console.log(content);
        sitepage.close();
        phInstance.exit();
    })
    .catch((error) => {
        console.log(error);
        phInstance.exit(); 
    });
```

See [examples](examples) folder for more ways to use this module.

## Installation

```bash
$ npm install phantom --save
```

## How does it work?

  [v1.0.x](//github.com/amir20/phantomjs-node/tree/v1) used to use `dnode` to communicate between nodejs and phantomjs. This approach raised a lot of security restrictions and did not work well when using `cluster` or `pm2`.

  v2.0.x has been completely rewritten to use `sysin` and `sysout` pipes to communicate with the phantomjs process. It works out of the box with `cluster` and `pm2`. If you want to see the messages that are sent try adding `DEBUG=true` to your execution, ie. `DEBUG=true node path/to/test.js`. The new code is much cleaner and simpler. PhantomJS is started with `shim.js` which proxies all messages to the `page` or `phantom` object.

## Migrating from 1.0.x

  Version 2.0.x is not backward compatible with previous versions. Most notability, method calls do not take a callback function anymore. Since `node` supports `Promise`, each of the methods return a promise. Instead of writing `page.open(url, function(){})` you would have to write `page.open(url).then(function(){})`.

  The API is much more consistent now. All properties can be read with `page.property(key)` and settings can be read with `page.setting(key)`. See below for more example.

## `phantom` object API

To create a new instance of `phantom` use `phantom.create()` to return a `Promise` which should resolve to a `phantom` object. If you want add parameters to the phantomjs process you can do so by doing:

```js
var phantom = require('phantom');
phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']).then(...)
```
To create a new `page`, you have to call `createPage()`:

```js
var phantom = require('phantom');
phantom.create().then(function(ph) {
    ph.createPage().then(function(page) {
        // use page
        ph.exit();
    });
});
```

Make sure to call `#exit()` on the phantom instance to kill the phantomjs process. Otherwise, the process will never exit.

## `page` object API

  The `page` object that is returned with `#createPage` is a proxy that sends all methods to `phantom`. Most method calls should be identical to PhantomJS API. You must remember that each method returns a `Promise`.

### `page#setting`

`page.settings` can be accessed via `page.setting(key)` or set via `page.setting(key, value)`. Here is an example to read `javascriptEnabled` property.

```js
page.setting('javascriptEnabled').then(function(value){
    expect(value).toEqual(true);
});
```

### `page#property`


  Page properties can be read using the `#property(key)` method.

  ```js
page.property('plainText').then(function(content) {
  console.log(content);
});
  ```

  Page properties can be set using the `#property(key, value)` method.

  ```js
page.property('viewportSize', {width: 800, height: 600}).then(function() {  
});
  ```
When setting values, using `then()` is optional. But beware that the next method to phantom will block until it is ready to accept a new message.

You can set events using `#property()` because they are property members of `page`.

```js
page.property('onResourceRequested', function(requestData, networkRequest) {
    console.log(requestData.url);
});
```
It is important to understand that the function above executes in the PhantomJS process. PhantomJS does not share any memory or variables with node. So using closures in javascript to share any variables outside of the function is not possible. Variables can be passed to `#property` instead. So for example, let's say you wanted to pass `process.env.DEBUG` to `onResourceRequested` method above. You could do this by:

```js
page.property('onResourceRequested', function(requestData, networkRequest, debug) {
    if(debug){
      // do something with it
    }
}, process.env.DEBUG);
```

You can return data to NodeJS by using `#createOutObject()`. This is a special object that let's you write data in PhantomJS and read it in NodeJS. Using the example above, data can be read by doing:

```js
var outObj = phantom.createOutObject();
page.property('onResourceRequested', function(requestData, networkRequest, debug, out) {
    if(debug){      
      out.url = requestData.url;
    }
}, process.env.DEBUG, outObj);

outObj.property('url').then(function(url){
   console.log(url);
});

```

### `page#evaluate`

Using `#evaluate()` is similar to passing a function above. For example, to return HTML of an element you can do:

```js
page.evaluate(function() {
    return document.getElementById('foo').innerHTML;
}).then(function(html){
    console.log(html);
});
```

### `page#evaluateJavaScript`

Evaluate a function contained in a string. It is similar to `#evaluate()`, but the function can't take any arguments. This example does the same thing as the example of `#evaluate()`:

```js
page.evaluateJavaScript('function() { return document.getElementById(\'foo\').innerHTML; }').then(function(html){
    console.log(html);
});
```


## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## Contributing

  This package is under development. Pull requests are welcomed. Please make sure tests are added for new functionalities and that your build does pass in TravisCI.

## People

  The current lead maintainer is [Amir Raminfar](https://github.com/amir20)

  [List of all contributors](https://github.com/amir20/phantomjs-node/graphs/contributors)

## License

  [ISC](LICENSE)

[npm-image]: https://img.shields.io/npm/v/phantom.svg?style=flat-square
[npm-url]: https://npmjs.org/package/phantom
[downloads-image]: https://img.shields.io/npm/dm/phantom.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/phantom
[travis-image]: https://img.shields.io/travis/amir20/phantomjs-node.svg?style=flat-square
[travis-url]: https://travis-ci.org/amir20/phantomjs-node
[david-image]: https://david-dm.org/amir20/phantomjs-node.svg?style=flat-square
[david-url]: https://david-dm.org/amir20/phantomjs-node
