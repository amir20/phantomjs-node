const phantom_node = require('phantom');

(async function() {
    const phantom = await phantom_node.create(["--ignore-ssl-errors=true", "--local-to-remote-url-access=true"]);
    const page = await phantom.createPage();
    await page.on("onResourceRequested", function(requestData) {
        console.info('Requesting', requestData.url)
    });

    const status = await page.open('https://stackoverflow.com/');
    console.log(status);

    const content = await page.property('content');
    console.log(content);

    await phantom.exit();
}());

// node--harmony - async - await async.js
