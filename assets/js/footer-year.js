// footer-year.js — 自动更新页脚版权年份
// 将页面中带 data-current-year 属性的元素内容设为当前年份，
// 避免每年手动修改页脚的版权信息。

(function () {
  'use strict';

  function updateYear() {
    const year = new Date().getFullYear();
    const targets = document.querySelectorAll('[data-current-year]');

    targets.forEach(function (el) {
      el.textContent = year;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateYear);
  } else {
    updateYear();
  }
})();
