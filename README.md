# 简单易懂的 webpack 打包后 JS 的运行过程（二）

hello~亲爱的看官老爷们大家好!上周写下一篇 [简单易懂的 webpack 打包后 JS 的运行过程]() 后，还是挺受小伙伴们欢迎的。然而这篇文章挖了坑还没填完，这次就把剩下的内容补完。

本文主要是关于异步加载的 `js` 是如何执行，较少使用 `webpack` 问题也不大。而如果看过前一篇文章相关的知识那就更好了。若已经了解过相关知识的小伙伴，不妨快速阅读一下，算是温故知新，~~其实是想请你告诉我哪里写得不对~~。

## 简单配置

`webpack` 的配置就不贴出来了，就是确定一下入口，提取 `webpack` 运行时需要用到的 `minifest.js` 而已。这里简单贴一下 `html` 模板与需要的两个 `js` 文件：
    
    <!--index.html-->
    <!doctype html>
    <html lang="en">
    <body>
        <p class="p">Nothing yet.</p>
        <button class="btn">click</button>
    </body>
    </html>


    //index.js
    const p = document.querySelector('.p');
    const btn = document.querySelector('.btn');
    btn.addEventListener('click', function() {
      //只有触发事件才回家再对应的js 也就是异步加载 
      require.ensure([], function() {
        const data = require('./src/js/test');
        p.innerHTML = data;
      })
    })
    
    //test.js
    const data = 'success!';
    module.exports = data;

这样配置示例配置就完成了。可能有小伙伴不太熟悉 `require.ensure`，简单地说，就是告诉 `webpack`，请懒加载 `test.js`，别一打开页面就给我下载下来。相关的知识不妨看[这里](http://www.css88.com/doc/webpack2/guides/code-splitting-require/)。

打包完的目录架构画风是这样的：
    
![](https://user-gold-cdn.xitu.io/2017/12/16/1605e1875ff58c8e?w=278&h=331&f=jpeg&s=14917)

至此，配置就完成啦~

## 从 `index.js` 开始探索

先用浏览器打开 `index.html`，查看资源加载情况，能发现只加载了 `index.js` 与 `minifest.js`：

![](https://user-gold-cdn.xitu.io/2017/12/16/1605e202f546d52c?w=620&h=97&f=jpeg&s=11838)

之后点击按钮，会再加多一个 `0.7f0a.js`：

![](https://user-gold-cdn.xitu.io/2017/12/16/1605e218907ba5fd?w=620&h=117&f=jpeg&s=14380)

可以说明代码是被分割了的，只要当对应的条件触发时，浏览器才会去加载指定的资源。而无论之后我们点击多少次，`0.7f0a.js` 文件都不会重复加载，此时小本本应记下第一个问题：如何做到不重复加载。

按照加载顺序，其实是应该先砍 `minifest.js` 的，但不妨先看看 `index.js` 的代码，带着问题有助于寻找答案。代码如下：
    
    webpackJsonp([1], {
      "JkW7":
        (function(module, exports, __webpack_require__) {
          const p = document.querySelector('.p');
          const btn = document.querySelector('.btn');
    
          btn.addEventListener('click', function() {
            __webpack_require__.e(0).then((function() {
              const data = __webpack_require__("zFrx");
              p.innerHTML = data;
            }).bind(null, __webpack_require__)).catch(__webpack_require__.oe)
          })
        })
    }, ["JkW7"]);

可能有些小伙伴已经忘记了上一篇文章的内容，`__webpack_require__` 作用是加载对应 `module` 的内容。这里提一句， `module` 其实就是打包前，`import` 或者 `require` 的一个个 `js` 文件，如`test.js` 与 `index.js`。后文说到的 `chunk` 是打包后的文件，即 `index.ad23.js`、`manifest.473d.js` 与 `0.7f0a.js`文件。一个 `chunk` 可能包含若干 `module`。

回忆起相关知识后，我们看看异步加载到底有什么不同。`index.js` 中最引入注目的应该是 `__webpack_require__.e` 这个方法了，传入一个数值之后返回一个 `promise`。这方法当 `promise` 决议成功后执行切换文本的逻辑，失败则执行 `__webpack_require__.oe`。因而小本本整理一下，算上刚才的问题，需要为这些问题找到答案：

* 如何做到不重复加载。
*  `__webpack_require__.e` 方法的逻辑。
*  `__webpack_require__.oe` 方法的逻辑。

## 在 `minifest.js` 中寻找答案

我们先查看一下 `__webpack_require__.e` 方法，为方法查看起见，贴一下对应的代码，大家不妨先试着自己寻找一下刚才问题的答案。

    var installedChunks = {
      2: 0
    };
    
    __webpack_require__.e = function requireEnsure(chunkId) {
      var installedChunkData = installedChunks[chunkId];
      if (installedChunkData === 0) {
        return new Promise(function(resolve) {
          resolve();
        });
    
      }
      if (installedChunkData) {
        return installedChunkData[2];
      }
    
      var promise = new Promise(function(resolve, reject) {
        installedChunkData = installedChunks[chunkId] = [resolve, reject];
      });
      installedChunkData[2] = promise;
      var head = document.getElementsByTagName('head')[0];
      var script = document.createElement('script');
      script.src = "js/" + chunkId + "." + {
        "0": "7f0a",
        "1": "ad23"
      }[chunkId] + ".js";
      script.onerror = script.onload = onScriptComplete;
    
      function onScriptComplete() {
        script.onerror = script.onload = null;
        var chunk = installedChunks[chunkId];
        if (chunk !== 0) {
          if (chunk) {
            chunk[1](new Error('Loading chunk ' + chunkId + ' failed.'));
          }
          installedChunks[chunkId] = undefined;
        }
      };
      head.appendChild(script);
      return promise;
    };

该方法中接受一个名为 `chunkId` 的参数，返回一个 `promise`，印证了我们阅读 `index.js` 时的猜想，也确认了传入的数字是 `chunkId`。之后变量 `installedChunkData` 被赋值为对象 `installedChunks` 中键为 `chunkId` 的值，可以推想出 `installedChunks` 对象其实就是记录已加载 `chunk` 的地方。此时我们尚未加载对应模块，理所当然是 `undefined`。

之后我们想跳过两个判断，查看一下 `__webpack_require__.e` 方法返回值的 `promise` 是怎样的：

    var promise = new Promise(function(resolve, reject) {
        installedChunkData = installedChunks[chunkId] = [resolve, reject];
    });
    installedChunkData[2] = promise;

可以看到 `installedChunkData` 与 `installedChunks[chunkId]` 被重新赋值为一个数组，存放着返回值 `promise` 的 `resolve` 与 `reject`，而令人不解的是，为何将数组的第三项赋值为这个 `promise`呢?

其实此前有一个条件判断：
    
    if (installedChunkData) {
        return installedChunkData[2];
    }

那你明白为什么了吗？在此例中1，假设网络很差的情况下，我们疯狂点击按钮，为避免浏览器发出若干个请求，通过条件判断都返回同一个 `promise`，当它决议后，所有挂载在它之上的 `then` 方法都能得到结果运行下去，相当于构造了一个队列，返回结果后按顺序执行对应方法，此处还是十分巧妙的。

之后就是创造一个 `script` 标签插入头部，加载指定的 `js` 了。值得关注的是 `onScriptComplete` 方法中的判断：
    
    var chunk = installedChunks[chunkId];
    if (chunk !== 0) {
        ...
    }

明明 `installedChunks[chunkId]` 被赋值为数组，它肯定不可能为0啊，这不是铁定失败了么？先别急，要知道 `js` 文件下载成功之后，先执行内容，再执行 `onload` 方法的，那么它的内容是什么呢？
    
    webpackJsonp([0], {
      "zFrx":
        (function(module, exports) {
          const data = 'success!';
          module.exports = data;
        })
    });

可以看到，和 `index.js` 还是很像的。这个 `js` 文件的 `chunkId` 是0。它的内容很简单，只不过是 `module.exports` 出去了一些东西。关键还是 `webpackJsonp` 方法，此处截取关键部分：
    
    var resolves = [];
    
    for (; i < chunkIds.length; i++) {
      chunkId = chunkIds[i];
      if (installedChunks[chunkId]) {
        resolves.push(installedChunks[chunkId][0]);
      }
      installedChunks[chunkId] = 0;
    }
    
    while (resolves.length) {
      resolves.shift()();
    }

当它执行的时候，会判断 `installedChunks[chunkId]` 是否存在，若存在则往数组中 `push(installedChunks[chunkId][0])` 并将 `installedChunks[chunkId]` 赋值为0; 。还得记得数组的首项是什么吗？是 `__webpack_require__.e` 返回 `promise` 的 `resolve`！之后执行这个 `resolve`。当然， `webpackJsonp` 方法会将下载下来文件所有的 `module` 存起来，当 `__webpack_require__` 对应 `modulIde` 时，返回对应的值。

让我们目光返回 `__webpack_require__.e` 方法。
已知对应的 `js` 文件下载成功后，`installedChunks[chunkId]` 被赋值为0。文件执行完或下载失败后都会触发 `onScriptComplete` 方法，在该方法中，如若 `installedChunks[chunkId] !== 0`，这是下载失败的情况，那么此时 `installedChunks[chunkId]` 的第二项是返回 `promise` 的 `reject`，执行这个 `reject` 以抛出错误：
    
    if (chunk !== 0) {
      if (chunk) {
        chunk[1](new Error('Loading chunk ' + chunkId + ' failed.'));
      }
      installedChunks[chunkId] = undefined;
    }

当再次请求同一文件时，由于对应的 `module` 已经被加载，因而直接返回一个成功的 `promise` 即可，对应的逻辑如下：

    var installedChunkData = installedChunks[chunkId];
    if (installedChunkData === 0) {
      return new Promise(function(resolve) {
        resolve();
      });
    }

最后看一下 `__webpack_require__.oe` 方法：
    
    __webpack_require__.oe = function(err) { console.error(err); throw err; };

特别简单对吧？最后整理一下流程：当异步请求文件发起时，先判断该 `chunk` 是否已被加载，是的话直接返回一个成功的 `promise`，让 `then` 执行的函数 `require` 对应的 `module` 即可。不然则构造一个 `script` 标签加载对应的 `chunk`，下载成功后挂载该 `chunk` 内所有的 `module`。下载失败则打印错误。

## 小结

以上就是 `webpack` 异步加载 `js` 文件过程的简单描述，其实流程真的特别简单易懂，只是代码的编写十分巧妙，值得仔细研究学习。对应的代码会放到 [github](https://github.com/ljf0113/how-webpack-loaded-async-js-file) 中，欢迎查阅点 `star`。

感谢各位看官大人看到这里，知易行难，希望本文对你有所帮助~谢谢！
