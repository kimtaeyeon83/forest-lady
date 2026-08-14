/* 포레스트 레이디 — 그리드, 필터, 라이트박스 */
(function () {
  'use strict';

  var PHOTOS = window.PHOTOS || [];
  var START_YEAR = 2018;
  var END_YEAR = new Date().getFullYear();

  var $ = function (s) { return document.querySelector(s); };
  var kindFilter = null;   // null = 전체
  var shown = [];          // 라이트박스가 훑을 현재 목록

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function years() {
    var out = [];
    for (var y = START_YEAR; y <= END_YEAR; y++) out.push(y);
    return out;
  }

  function visible() {
    if (!kindFilter) return PHOTOS;
    return PHOTOS.filter(function (p) { return p.kind === kindFilter; });
  }

  /* ── 머리말 숫자 ── */
  function paintTally() {
    var data = [
      ['함께한 해', END_YEAR - START_YEAR + 1, '년째'],
      ['모아둔 사진', PHOTOS.length, '장'],
      ['기록된 해', countYears(), '해']
    ];
    var dl = $('#tally');
    dl.innerHTML = '';
    data.forEach(function (d) {
      var wrap = el('div');
      wrap.appendChild(el('dt', null, d[0]));
      var dd = el('dd', null, String(d[1]));
      dd.appendChild(el('small', null, d[2]));
      wrap.appendChild(dd);
      dl.appendChild(wrap);
    });
  }

  function countYears() {
    var seen = {};
    PHOTOS.forEach(function (p) { seen[p.year] = 1; });
    return Object.keys(seen).length;
  }

  /* ── 연도 이동 · 갈래 거르기 ── */
  function paintNav() {
    var ul = $('#yearNav');
    ul.innerHTML = '';
    var rows = visible();
    years().forEach(function (y) {
      var has = rows.some(function (p) { return p.year === y; });
      if (!has) return;
      var li = el('li');
      var a = el('a', null, String(y));
      a.href = '#y' + y;
      li.appendChild(a);
      ul.appendChild(li);
    });

    var kinds = [];
    PHOTOS.forEach(function (p) { if (kinds.indexOf(p.kind) < 0) kinds.push(p.kind); });

    var host = $('#kindNav');
    host.innerHTML = '';
    var all = el('button', null, '전체');
    all.type = 'button';
    all.setAttribute('aria-pressed', kindFilter ? 'false' : 'true');
    all.addEventListener('click', function () { kindFilter = null; paintNav(); paintGallery(); });
    host.appendChild(all);

    kinds.forEach(function (k) {
      var b = el('button', null, k);
      b.type = 'button';
      b.setAttribute('aria-pressed', kindFilter === k ? 'true' : 'false');
      b.addEventListener('click', function () {
        kindFilter = (kindFilter === k) ? null : k;
        paintNav();
        paintGallery();
      });
      host.appendChild(b);
    });
  }

  /* ── 그리드 ── */
  function paintGallery() {
    var host = $('#gallery');
    host.innerHTML = '';
    var rows = visible();
    shown = [];

    years().forEach(function (y) {
      var mine = rows.filter(function (p) { return p.year === y; });
      // 갈래로 거를 때는 해당 사진이 있는 해만 보여줍니다
      if (!mine.length) return;

      var sec = el('section', 'year');
      sec.id = 'y' + y;

      var head = el('div', 'year-head');
      head.appendChild(el('h2', null, String(y)));
      head.appendChild(el('span', 'n', mine.length + '장'));
      sec.appendChild(head);

      var grid = el('ul', 'grid');
      mine.forEach(function (p) {
        var idx = shown.length;
        shown.push(p);

        var li = el('li', 'tile');
        var fig = el('figure', null);
        fig.style.margin = '0';

        var b = el('button');
        b.type = 'button';
        b.setAttribute('aria-label', p.year + ' ' + p.title + ' 크게 보기');
        var im = el('img');
        im.src = p.thumb;
        im.alt = p.year + ' ' + p.title;
        im.loading = 'lazy';
        im.decoding = 'async';
        b.appendChild(im);
        b.addEventListener('click', function () { openLB(idx); });

        var cap = el('figcaption');
        cap.appendChild(el('span', 't', p.title));
        cap.appendChild(document.createElement('br'));
        cap.appendChild(el('span', 'k', p.kind));

        fig.appendChild(b);
        fig.appendChild(cap);
        li.appendChild(fig);
        grid.appendChild(li);
      });
      sec.appendChild(grid);

      host.appendChild(sec);
    });

    markCurrentYear();
  }

  /* ── 라이트박스 ── */
  var lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  var at = 0, lastFocus = null;

  function showLB() {
    var p = shown[at];
    lbImg.src = p.full;
    lbImg.alt = p.year + ' ' + p.title;
    lbCap.innerHTML = '';
    var b = el('b', null, String(p.year));
    lbCap.appendChild(b);
    lbCap.appendChild(document.createTextNode(p.title));
    lbCap.appendChild(el('span', 'c', p.kind + '  ·  ' + (at + 1) + ' / ' + shown.length));
  }

  function openLB(i) {
    lastFocus = document.activeElement;
    at = i;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    showLB();
    $('#lbClose').focus();
  }

  function closeLB() {
    lb.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function step(d) {
    if (!shown.length) return;
    at = (at + d + shown.length) % shown.length;
    showLB();
  }

  $('#lbClose').addEventListener('click', closeLB);
  $('#lbPrev').addEventListener('click', function () { step(-1); });
  $('#lbNext').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLB();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  /* ── 스크롤에 따라 연도 표시 ── */
  var navLinks = {};
  function markCurrentYear() {
    navLinks = {};
    Array.prototype.forEach.call(document.querySelectorAll('#yearNav a'), function (a) {
      navLinks[a.getAttribute('href').slice(2)] = a;
    });
    onScroll();
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      var best = null, bestTop = -Infinity;
      Array.prototype.forEach.call(document.querySelectorAll('.year'), function (sec) {
        var top = sec.getBoundingClientRect().top - 90;
        if (top <= 0 && top > bestTop) { bestTop = top; best = sec.id.slice(1); }
      });
      Object.keys(navLinks).forEach(function (y) {
        navLinks[y].classList.toggle('on', y === best);
      });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── 시작 ── */
  paintTally();
  paintNav();
  paintGallery();
})();
