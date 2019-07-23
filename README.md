phantom - Fast NodeJS API for PhantomJS
========
[![NPM](https://nodei.co/npm/phantom.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/phantom/)

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Linux Build][travis-image]][travis-url]
[![Node Version][node-image]][node-url]


## Super easy to use
```js
const phantom = require('phantom');

(async function() {
  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on('onResourceRequested', function(requestData) {
    console.info('Requesting', requestData.url);
  });

  const status = await page.open('https://stackoverflow.com/');
  const content = await page.property('content');
  console.log(content);

  await instance.exit();
})();

```

Using Node v7.9.0+ you can run the above example with `node file.js`

See [examples](examples) folder for more ways to use this module.

## Use it with npx
You can quickly test any website with phantomjs-node without needing to install the package.

```
$ npx phantom@latest https://stackoverflow.com/
```

The above command is very useful to test if your website works on older browsers. I frequently use it to ensure [polyfills](https://github.com/Modernizr/Modernizr/wiki/HTML5-Cross-browser-Polyfills) have been installed correctly. 

## Deprecation warnings of PhantomJs
In March 2018, the owner of PhantomJS [announced](https://phantomjs.org/) suspension of development. There hasn't been any updates since. Since phantomjs-node is only a wrapper around phantomjs, then you should use it at your own risk because the underlying dependency is no longer supported. I plan to maintain this project until usage has dropped significantly.  

## Installation

### Node v6.x and later
Latest version of phantom does **require Node v6.x and later**. You can install with
```bash
$ npm install phantom --save
```

### Node v5.x
To use version 3.x you need to have at least Node v5+. You can install it using

```bash
$ npm install phantom@3 --save
```

### Versions _older_ than 5.x, install with

```bash
$ npm install phantom@2 --save
```

## Documents
- [in website](http://amirraminfar.com/phantomjs-node/#/)
- [in github](./docs/)

## Pooling

Creating new phantom instances with `phantom.create()` can be slow. If
you are frequently creating new instances and destroying them, as a
result of HTTP requests for example, it might be worth creating a pool
of instances that are re-used.

See the [phantom-pool](https://github.com/blockai/phantom-pool) module
for more info.

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

  [ISC](LICENSE.md)

[npm-image]: https://img.shields.io/npm/v/phantom.svg?style=for-the-badge
[npm-url]: https://npmjs.org/package/phantom
[downloads-image]: https://img.shields.io/npm/dm/phantom.svg?style=for-the-badge
[downloads-url]: https://npmjs.org/package/phantom
[travis-image]: https://img.shields.io/travis/amir20/phantomjs-node.svg?style=for-the-badge
[travis-url]: https://travis-ci.org/amir20/phantomjs-node
[dependencies-image]: https://dependencyci.com/github/amir20/phantomjs-node/badge?style=for-the-badge
[dependencies-url]: https://dependencyci.com/github/amir20/phantomjs-node
[node-image]: https://img.shields.io/node/v/phantom.svg?style=for-the-badge
[node-url]: https://nodejs.org/en/download/
[codecov-image]: https://codecov.io/gh/amir20/phantomjs-node/branch/master/graph/badge.svg?style=for-the-badge
[codecov-url]: https://codecov.io/gh/amir20/phantomjs-node
