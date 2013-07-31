# Success: Working model on using PhantonJS to get results from pages
phantom = require 'phantom'

# Creates one process
phantom.create (ph) ->
  # Creates on page
  ph.createPage (page) ->
    page.open "http://www.deal.com.sg/deals/singapore", (status) ->
      console.log "opened page? ", status
      someFunc = (aaa, my_obj)->
        attribute_to_want = aaa
        h2Arr = []        
        results = document.querySelectorAll(attribute_to_want)
        for x in [0...results.length]
          h2Arr.push(results[x].src)
        return {
          h2: h2Arr
          aaa: this.arguments
          obj: my_obj
        }
      
      finishedFunc = (result)->
        console.log result
        ph.exit()
      
      page.evaluate someFunc, finishedFunc, '#deal-main-pic img', {wahtt: 111}
      
