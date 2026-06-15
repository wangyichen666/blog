// reading-time.js — 估算文章阅读时长
// 统计正文字数（中文按字符、英文按单词），按平均阅读速度估算分钟数，
// 并写入带 data-reading-time 属性的元素。

(function () {
  'use strict';

  // 平均阅读速度：中文 ~300 字/分钟，英文 ~200 词/分钟
  const CN_WPM = 300;
  const EN_WPM = 200;

  function countWords(text) {
    const cnChars = (text.match(/[一-龥]/g) || []).length;
    const enWords = (text.match(/[a-zA-Z0-9]+/g) || []).length;
    return { cnChars: cnChars, enWords: enWords };
  }

  function estimate(text) {
    const { cnChars, enWords } = countWords(text);
    const minutes = cnChars / CN_WPM + enWords / EN_WPM;
    return Math.max(1, Math.round(minutes));
  }

  function render() {
    const content = document.querySelector('.post-content, article, main');
    if (!content) return;

    const minutes = estimate(content.textContent || '');
    const targets = document.querySelectorAll('[data-reading-time]');

    targets.forEach(function (el) {
      el.textContent = '预计阅读 ' + minutes + ' 分钟';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
