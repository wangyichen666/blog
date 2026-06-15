// toc.js — 为文章页自动生成目录（Table of Contents）
// 扫描正文中的 h2/h3 标题，生成可点击锚点的侧边目录

(function () {
  'use strict';

  function slugify(text) {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^\w一-龥]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function buildToc() {
    const content = document.querySelector('.post-content, article, main');
    if (!content) return;

    const headings = content.querySelectorAll('h2, h3');
    if (headings.length === 0) return;

    const toc = document.createElement('nav');
    toc.className = 'post-toc';
    toc.innerHTML = '<h4>目录</h4>';

    const list = document.createElement('ul');

    headings.forEach(function (heading) {
      if (!heading.id) {
        heading.id = slugify(heading.textContent);
      }

      const item = document.createElement('li');
      item.className = 'toc-' + heading.tagName.toLowerCase();

      const link = document.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent;

      item.appendChild(link);
      list.appendChild(item);
    });

    toc.appendChild(list);
    content.parentNode.insertBefore(toc, content);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildToc);
  } else {
    buildToc();
  }
})();
