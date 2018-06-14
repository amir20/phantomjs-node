# PHANTOM

> `PhantomJS` 的 node 版本。

- **官网:** http://amirraminfar.com/phantomjs-node/
- **GITHUB:** https://github.com/amir20/phantomjs-node

## 是什么

可以方便的在 node 程序中使用 `PhantomJS` 相关的 api 。

## 例子

``` js
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
更多例子:

[examples](https://github.com/amir20/phantomjs-node/tree/master/examples) 。
