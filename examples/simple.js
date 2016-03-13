let _ph, _page;

phantom.create().then(ph => {
    _ph = ph;
    return _ph.createPage();
}).then(page => {
    _page = page;
    return _page.open('https://stackoverflow.com/');
}).then(status => {
    console.log(status);
    return _page.property('content')
}).then(content => {
    console.log(content);
    _page.close();
    _ph.exit();
});