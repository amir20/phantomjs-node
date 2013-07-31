var phantom = require('phantom');

phantom.create(function(ph) {
  ph.createPage(function(page) {
    page.open('http://www.mdscollections.com/cat_mds_accessories.cfm',
      function(status) {
        console.log('Opened site? %s', status);
        another_funny(page, ph);
      });
  });
});

function another_funny(page, ph) {
  page.evaluate(function() {
    var h2Arr = [];
    var pArr = [];

    function funny() {
      var h2Arr = [];
      var results = document.querySelectorAll('.listing_product_name');
      var i;
      for (i = 0; i < results.length; i++) {
        h2Arr.push(results[i].innerHTML);
      }
      return h2Arr;
    }

    h2Arr = funny();
    return {h2: h2Arr};
  },
  function(result) {
    console.log(result);
    ph.exit();
  });
}
