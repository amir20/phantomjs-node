# Error --- Corner case scenario: page open was called multiple times. One for
# each iframe loaded
phantom = require 'phantom'

# Creates one process
phantom.create (ph) ->
  # Creates on page
  ph.createPage (page) ->
    page.set('Referer', 'http://google.com')
    page.set 'settings.userAgent',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.1 (KHTML,
      like Gecko) Chrome/21.0.1180.89 Safari/537.1'
    page.open "http://www.meetup.com/sgphpug/members/37086072/", (status) ->
      console.log 'page open successfully'
      ph.exit()
