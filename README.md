phantom
========
phantom is fast and reliable node wrapper for phantomjs.


[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Linux Build][travis-image]][travis-url]

```js
var phantom = require('phantom');

phantom.create().then(function(ph) {
  ph.createPage().then(function(page) {
    page.open('https://stackoverflow.com/').then(function(status) {
      console.log(status);
      page.property('content').then(function(content) {
        console.log(content);
        page.close();
        ph.exit();
      })
    })
  });
});
```

## Installation

```bash
$ npm install phantom --save
```

## How does it work?

  [v1.0.x](//github.com/amir20/phantomjs-node/tree/v1) used to use `dnode` to communicate between nodejs and phantomjs. This approach raised a lot of security restrictions and did not work well when using `cluster` or `pm2`. 

  v2.0.x has been completely rewritten to use `sysin` and `sysout` pipes to communicate with the phantomjs process. It works out of the box with `cluster` and `pm2`. If you want to see the messages that are send try adding `DEBUG=true` to your execution, ie. `DEBUG=true node path/to/test.js`. The new code is much cleaner and simpler. PhantomJS is started with `shim.js` which proxies all messages to the `page` or `phantom` object.

## Migrating from 1.0.x

  Version 2.0.x is not backward compatible with previous versions. Most notability, method calls do not take a callback function anymore. Since `node` supports `Promise`, each of the methods return a promise. Instead of writing `page.open(url, function(){})` you would have to write `page.open(url).then(function(){})`.

  The API is much more consistent now. All properties can be read with `page.property(key)` and settings can be read with `page.setting(key)`. See below for more example.

## `page` API

  The `page` object that is returned with `createPage` is a proxy that sends all methods to `phantom`. Most method calls should be identical to PhantomJS API. You must remember that each method returns a `Promise`.

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

`page.settings` can also be accessed via `page.setting(key)` or set via `page.setting(key, value)`. Here is an example to read `javascriptEnabled` property.

```js
page.setting('javascriptEnabled').then(function(value){
    expect(value).toEqual(true);
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

[npm-image]: https://img.shields.io/npm/v/phantom.svg
[npm-url]: https://npmjs.org/package/phantom
[downloads-image]: https://img.shields.io/npm/dm/phantom.svg
[downloads-url]: https://npmjs.org/package/phantom
[travis-image]: https://img.shields.io/travis/amir20/phantomjs-node.svg
[travis-url]: https://travis-ci.org/amir20/phantomjs-node
