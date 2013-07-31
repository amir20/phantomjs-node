# Setting cookie header to phantomJS from NodeJS - using Phantom version 0.4.1
phantom = require 'phantom'

# Creates one process
phantom.create (ph) ->

  ph.addCookie 'cookie_name', 'cookie_value', 'localhost', ()->
    console.log 'Cookie was added'
  
  # Creates on page  
  ph.createPage (page) ->  
    
    page.set('Referer', 'http://google.com')
    page.set 'settings.userAgent', 
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.89 Safari/537.1'
    page.open "http://localhost:9901/cookie", (status) ->
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
        ph.exit()
    
      page.evaluate someFunc, finishedFunc, 'div', {wahtt: 111}
