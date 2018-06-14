# page object API

  The `page` object that is returned with `#createPage` is a proxy that sends all methods to `phantom`. Most method calls should be identical to PhantomJS API. You must remember that each method returns a `Promise`.

## setting

`page.settings` can be accessed via `page.setting(key)` or set via `page.setting(key, value)`. Here is an example to read `javascriptEnabled` property.

```js
page.setting('javascriptEnabled').then(function(value){
    expect(value).toEqual(true);
});
```

## property


  Page properties can be read using the `#property(key)` method.

  ```js
page.property('plainText').then(function(content) {
  console.log(content);
});
  ```

  Page properties can be set using the `#property(key, value)` method.

  ```js
page.property('viewportSize', {width: 800, height: 600}).then(function() {
});
  ```
When setting values, using `then()` is optional. But beware that the next method to phantom will block until it is ready to accept a new message.

~~You can set events using `#property()` because they are property members of `page`.~~

```js
page.property('onResourceRequested', function(requestData, networkRequest) {
    console.log(requestData.url);
});
```
~~It is important to understand that the function above executes in the PhantomJS process. PhantomJS does not share any memory or variables with node. So using closures in javascript to share any variables outside of the function is not possible. Variables can be passed to `#property` instead. So for example, let's say you wanted to pass `process.env.DEBUG` to `onResourceRequested` method above. You could do this by:~~

**Using `page#property` to set events will be deprecated in next release. Please use `page#on()` instead.**

Even if it is possible to set the events using this way, we recommend you use `#on()` for events (see below).


You can return data to NodeJS by using `#createOutObject()`. This is a special object that let's you write data in PhantomJS and read it in NodeJS. Using the example above, data can be read by doing:

```js
var outObj = phInstance.createOutObject();
outObj.urls = [];
page.property('onResourceRequested', function(requestData, networkRequest, out) {
    out.urls.push(requestData.url);
}, outObj);

// after call to page.open()
outObj.property('urls').then(function(urls){
   console.log(urls);
});

```

## on

By using `on(event, [runOnPhantom=false],listener, args*)`, you can listen to the events the page emits.

```js
var urls = [];

page.on('onResourceRequested', function (requestData, networkRequest) {
    urls.push(requestData.url); // this would push the url into the urls array above
    networkRequest.abort(); // This will fail, because the params are a serialized version of what was provided
});

page.open('http://google.com');
```
As you see, using on you have access to the closure variables and all the node goodness using this function ans in contrast of setting and event with property, you can set as many events as you want.

If you want to register a listener to run in phantomjs runtime (and thus, be able to cancel the request lets say), you can make it by passing the optional param `runOnPhantom` as `true`;

```js
var urls = [];

page.on('onResourceRequested', true, function (requestData, networkRequest) {
    urls.push(requestData.url); // now this wont work, because this function would execute in phantom runtime and thus wont have access to the closure.
    networkRequest.abort(); // This would work, because you are accessing to the non serialized networkRequest.
});

page.open('http://google.com');
```
The same as in property, you can pass additional params to the function in the same way, and even use the object created by `#createOutObject()`.

You cannot use `#property()` and `#on()` at the same time, because it would conflict. Property just sets the function in phantomjs, while `#on()` manages the event in a different way.

## off

`#off(event)` is usefull to remove all the event listeners set by `#on()` for ans specific event.

## evaluate

Using `#evaluate()` is similar to passing a function above. For example, to return HTML of an element you can do:

```js
page.evaluate(function() {
    return document.getElementById('foo').innerHTML;
}).then(function(html){
    console.log(html);
});
```

## evaluateAsync

Same as `#evaluate()`, but function will be executed asynchronously and there is no return value. You can specify delay of execution.

```js
page.evaluateAsync(function(apiUrl) {
    $.ajax({url: apiUrl, success: function() {}});
}, 0, "http://mytestapi.com")
```

## evaluateJavaScript

Evaluate a function contained in a string. It is similar to `#evaluate()`, but the function can't take any arguments. This example does the same thing as the example of `#evaluate()`:

```js
page.evaluateJavaScript('function() { return document.getElementById(\'foo\').innerHTML; }').then(function(html){
    console.log(html);
});
```

## switchToFrame

Switch to the frame specified by a frame name or a frame position:

```js
page.switchToFrame(framePositionOrName).then(function() {
    // now the context of `page` will be the iframe if frame name or position exists
});
```

## switchToMainFrame

Switch to the main frame of the page:

```js
page.switchToMainFrame().then(function() {
    // now the context of `page` will the main frame
});
```

## uploadFile

A file can be inserted into file input fields using the `#uploadFile(selector, file)` method.

```js
page.uploadFile('#selector', '/path/to/file').then(function() {

});
```
