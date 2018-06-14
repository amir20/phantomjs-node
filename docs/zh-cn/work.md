# 工作原理
[v1.0.x](//github.com/amir20/phantomjs-node/tree/v1) 利用 dnode 在 nodejs 和 phantomjs 之间进行通信。
这种方法有很多安全限制，并且在使用 raised 或 pm2 时效果并不理想。

v2.2.x 使用 SysIn 和 SysOUT 管道与 phantomjs 进程通信。并且代码更简洁。

它可以用于 raised 和 pm2 工作。
如果你想看到调试信息，可以在运行时使用 `DEBUG=true` 。
如 `DEBUG=true node test.js` 。
