# 版本迁移
## 2.x
为了更好的发展空间， `phantom@3` 只支持 `node v5` 以上版本。
代码更少，性能更快。

## 1.0.x
版本 2.0.x 不再使用回调函数。而使用 `Promise` 。
例如 `page.open(url, function(){})` => `page.open(url).then(function(){})` 。

API 更加一致， 所有属性都只可以读取。
如 `page.property(key)` => `page.setting(key)` 。

更多 API 请参见后文。
