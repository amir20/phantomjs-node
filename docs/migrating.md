## Migrating from 2.x

Going forward, version phantom@3 will only support Node v5 and above. This adds the extra benefit of less code and faster performance.

## Migrating from 1.0.x

  Version 2.0.x is not backward compatible with previous versions. Most notability, method calls do not take a callback function anymore. Since `node` supports `Promise`, each of the methods return a promise. Instead of writing `page.open(url, function(){})` you would have to write `page.open(url).then(function(){})`.

  The API is much more consistent now. All properties can be read with `page.property(key)` and settings can be read with `page.setting(key)`. See below for more example.
