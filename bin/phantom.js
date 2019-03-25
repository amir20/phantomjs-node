#!/usr/bin/env node

const phantom = require('phantom');

const [, , url] = process.argv;

(async function main() {
  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on('onResourceRequested', (requestData) => {
    console.info('Requesting', requestData.url);
  });

  await page.open(url);
  const content = await page.property('content');
  console.log(content);

  await instance.exit();
}());
