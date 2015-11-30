# Test to see what kind of header values can be set
phantom = require 'phantom'

# Creates one process
phantom.create (ph) ->
  # Creates on page
  console.log ph
  ph.createPage (page) ->
    console.log page
    page.set('Referer', 'http://google.com')
    page.set 'settings.userAgent',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.1 (KHTML,
      like Gecko) Chrome/21.0.1180.89 Safari/537.1'
    page.open "http://localhost:9901", (status) ->
      ph.exit()
