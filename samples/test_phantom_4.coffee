# Success: Working model on using PhantonJS to get results from pages
phantom = require 'phantom'

# Creates one process
phantom.create (ph) ->
  # Creates on page
  ph.createPage (page) ->
    page.open "http://www.mdscollections.com/cat_mds_accessories.cfm", (status) ->
      console.log "opened page? ", status
      someFunc = (aaa)->
        attribute_to_want = aaa
        h2Arr = []        
        results = document.querySelectorAll(attribute_to_want)
        for x in [0...results.length]
          h2Arr.push(results[x].href)
        return {
          h2: h2Arr
          aaa: this.aaa
          sample_dom: results[0]
        }
      
      finishedFunc = (result)->
        console.log result
        ph.exit()
      
      page.evaluate someFunc, finishedFunc, '.listing_product_name'
      