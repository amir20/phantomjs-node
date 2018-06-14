## PHANTOM

> Fast NodeJS API for PhantomJS.

- **WEBSITE:** http://amirraminfar.com/phantomjs-node/
- **GITHUB:** https://github.com/amir20/phantomjs-node

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

See [examples](https://github.com/amir20/phantomjs-node/tree/master/examples) folder for more ways to use this module.
