#!/usr/bin/env node

const phantom = require('phantom'); // eslint-disable-line

const [, , url] = process.argv;

(async function main() {
  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on('onResourceRequested', (requestData) => {
    console.info('Requesting', requestData.url); // eslint-disable-line
  });

  await page.open(url);
  const content = await page.property('content');
  console.log(content); // eslint-disable-line

  await instance.exit();
}());
