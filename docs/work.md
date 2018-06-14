# How does it work?

  [v1.0.x](//github.com/amir20/phantomjs-node/tree/v1) used to leverage `dnode` to communicate between nodejs and phantomjs. This approach raised a lot of security restrictions and did not work well when using `cluster` or `pm2`.

  v2.0.x has been completely rewritten to use `sysin` and `sysout` pipes to communicate with the phantomjs process. It works out of the box with `cluster` and `pm2`. If you want to see the messages that are sent try adding `DEBUG=true` to your execution, ie. `DEBUG=true node path/to/test.js`. The new code is much cleaner and simpler. PhantomJS is started with a shim which proxies all messages to the `page` or `phantom` object.
