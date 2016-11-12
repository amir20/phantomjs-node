const phantom = require('phantom');

(async function() {
    const instance = await phantom.create();
    const page = await instance.createPage();
    await page.on("onResourceRequested", function(requestData) {
        console.info('Requesting', data.url)
    });

    const status = await page.open('https://stackoverflow.com/');
    console.log(status);

    const content = await page.property('content');
    console.log(content);

    await instance.exit();
}());

// node --harmony-async-await async.js
