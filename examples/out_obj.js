import phantom from "phantom";

let _ph, _page, _outObj;

phantom.create().then(ph => {
  _ph = ph;
  return _ph.createPage();
}).then(page => {
  _page = page;
  _outObj = _ph.createOutObject();

  _outObj.urls = [];
  page.property('onResourceRequested', function(requestData, networkRequest, out) {
    out.urls.push(requestData.url);
  }, _outObj);

  return _page.open('https://stackoverflow.com/');
}).then(status => {
  return _outObj.property('urls');
}).then(urls => {
  console.log(urls);
  _page.close();
  _ph.exit();
}).catch(console.error);

// babel-node out_obj.js
