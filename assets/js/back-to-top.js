// back-to-top.js — 返回顶部按钮
// 页面向下滚动超过一屏后显示一个悬浮按钮，点击平滑滚回页面顶部。

(function () {
  'use strict';

  function createButton() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', '返回顶部');
    btn.textContent = '↑';
    btn.style.cssText = [
      'position:fixed',
      'right:24px',
      'bottom:24px',
      'width:44px',
      'height:44px',
      'border:none',
      'border-radius:50%',
      'background:#333',
      'color:#fff',
      'font-size:20px',
      'cursor:pointer',
      'opacity:0',
      'visibility:hidden',
      'transition:opacity .3s, visibility .3s',
      'z-index:999'
    ].join(';');

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.body.appendChild(btn);
    return btn;
  }

  function init() {
    const btn = createButton();

    function toggle() {
      const show = window.scrollY > window.innerHeight;
      btn.style.opacity = show ? '1' : '0';
      btn.style.visibility = show ? 'visible' : 'hidden';
    }

    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
