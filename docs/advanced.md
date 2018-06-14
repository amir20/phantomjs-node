# Advanced
Methods below are for advanced users. Most people won't need these methods.

## page.defineMethod

A method can be defined using the `#defineMethod(name, definition)` method.

```js
page.defineMethod('getZoomFactor', function() {
	return this.zoomFactor;
});
```

## page.invokeAsyncMethod

An asynchronous method can be invoked using the `#invokeAsyncMethod(method, arg1, arg2, arg3...)` method.

```js
page.invokeAsyncMethod('open', 'http://phantomjs.org/').then(function(status) {
	console.log(status);
});
```

## page.invokeMethod

A method can be invoked using the `#invokeMethod(method, arg1, arg2, arg3...)` method.

```js
page.invokeMethod('evaluate', function() {
	return document.title;
}).then(function(title) {
	console.log(title);
});
```

```js
page.invokeMethod('evaluate', function(selector) {
	return document.querySelector(selector) !== null;
}, '#element').then(function(exists) {
	console.log(exists);
});
```
