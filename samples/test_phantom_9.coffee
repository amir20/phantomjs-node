# Corner case scenario: page open was called multiple times. One for each iframe loaded
phantom = require 'phantom'

# Creates one process
phantom.create (ph) ->
  # Creates on page
  ph.createPage (page) ->
  
    page.set('Referer', 'http://google.com')
    page.set 'settings.userAgent', 
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.89 Safari/537.1'
    page.open "http://www.facebook.com/VintrySingapore", (status) ->
      console.log status
      someFunc = (aaa, my_obj)->
        attribute_to_want = aaa
        h2Arr = []        
        results = document.querySelectorAll(attribute_to_want)
        for x in [0...results.length]
          h2Arr.push(results[x].innerText)
        return {
          h2: h2Arr
          aaa: this.arguments
          obj: my_obj
        }
    
      finishedFunc = (result)->
        console.log result
    
      page.evaluate someFunc, finishedFunc, 'div', {wahtt: 111}
