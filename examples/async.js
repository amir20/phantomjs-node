import {
    create
} from "phantom";

(async function() {
    const phantom = await create(["--ignore-ssl-errors=true", "--local-to-remote-url-access=true"]);
    const page = await phantom.createPage();
    await page.property("onResourceRequested", requestData => console.log('requesting', requestData.url));

    let status  = await page.open('https://stackoverflow.com/');
    console.log(status);

    let content = await page.property('content');
    console.log(content);

    await phantom.exit();
}());

// npm install babel-cli
// babel-node async.js
