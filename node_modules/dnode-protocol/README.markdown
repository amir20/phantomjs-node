dnode-protocol
==============

This module implements the dnode protocol in a reusable form that is presently
used for both the server-side and browser-side dnode code.

[Read about the protocol itself here.](https://github.com/substack/dnode-protocol/blob/master/doc/protocol.markdown)

[![build status](https://secure.travis-ci.org/substack/dnode-protocol.png)](http://travis-ci.org/substack/dnode-protocol)

example
=======

``` js
var proto = require('dnode-protocol');

var s = proto({
    x : function (f, g) {
        setTimeout(function () { f(5) }, 200);
        setTimeout(function () { g(6) }, 400);
    },
    y : 555
});
var c = proto();

s.on('request', c.handle.bind(c));
c.on('request', s.handle.bind(s));

c.on('remote', function (remote) {
    function f (x) { console.log('f(' + x + ')') }
    function g (x) { console.log('g(' + x + ')') }
    remote.x(f, g);
});

s.start();
c.start();
```

***

```
f(5)
g(6)
```

methods
=======

``` js
var protocol = require('dnode-protocol')
```

var proto = protocol(cons, opts={})
-----------------------------------

Create a new protocol object with a constructor `cons` and an optional callback
wrapper `wrap`.

`cons` should be a function, in which case it will be used to create an instance
by `new cons(remote, proto)` where `remote` is an empty reference to the remote
object before being populated and `proto` is the protocol instance.

If you return an object in `cons` the return value will be used
(`new` does that part).

If you pass in a non-function as `cons`, its value will be used as the instance
directly.

You can optionally specify `opts.wrap` and `opts.unwrap` to wrap and unwrap
remote values for implementing weakmaps or marking callbacks.

The return value of `opts.wrap(cb, id)` will be stored in `proto.callbacks.remote[id]`
and `opts.unwrap(ref, id)` will be called with the `ref` obtained from `wrap()`
previously to turn `ref` back into a `cb`.

proto.handle(req)
-----------------

Handle a request object emitted by the request event, calling the method the
request mentions with the provided arguments.

proto.request(method, args)
---------------------------

Emit a request event for the method id `method` and the raw arguments `args`.
The args will be scrubbed for callbacks and emitted in normal form suitable for
passing to `JSON.stringify()`.

proto.start()
-------------

Begin the methods exchange. All listeners should be bound before this function
is called.

proto.cull(id)
--------------

Instruct the opposing connection to drop all references to the callback
specified by `id`.

events
======

proto.on('request', function (req) { ... })
-------------------------------------------

Emitted when a request is ready to be sent.

The request should be serialized and passed to the opposing connection's
`.handle()`.

proto.on('remote', function (remote) { ... })
---------------------------------------------

Emitted when the remote reference has been populated.

proto.on('fail', function (err) { ... })
----------------------------------------

Emitted when there is a non-fatal failed request.

proto.on('error', function (err) { ... })
-----------------------------------------

Emitted when there is a fatal exception one of the local callbacks.

install
=======

With [npm](http://npmjs.org) do:

```
npm install dnode-protocol
```

license
=======

MIT
