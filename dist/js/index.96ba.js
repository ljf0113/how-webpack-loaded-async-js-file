webpackJsonp([1],{

/***/ "JkW7":
/***/ (function(module, exports, __webpack_require__) {

//index.js

const p = document.querySelector('.p');
const btn = document.querySelector('.btn');

btn.addEventListener('click', function() {
  //只有触发事件才回家再对应的js 也就是异步加载
  __webpack_require__.e/* require.ensure */(0).then((function() {
    const data = __webpack_require__("zFrx");
    p.innerHTML = data;
  }).bind(null, __webpack_require__)).catch(__webpack_require__.oe)
})


/***/ })

},["JkW7"]);