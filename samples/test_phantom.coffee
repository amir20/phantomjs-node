# This script demonstrates how phantomjs is used within Nodejs in replacement of JSDOM
phantom =  require 'phantom'
phantom.create (ph)->
  ph.createPage (page)->
    page.open 'http://www.mdscollections.com/cat_mds_accessories.cfm', (status)->
      console.log 'Opened site? %s', status
      another_funny page, ph
            
another_funny = (page, ph)->
  # query page for results
  page.evaluate ()->
  
    # function needs to be within the page evaluate callback
    funny = ()->
      h2Arr = []
      results = document.querySelectorAll('.listing_product_name')
      for x in [0...results.length]
        h2Arr.push(results[x].innerHTML);        
      return h2Arr
            
    h2Arr = []
    pArr = []          
    h2Arr = funny()
    return {
      h2: h2Arr
    }
  
  , (result)->
    console.log result
    ph.exit()
