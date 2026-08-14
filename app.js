/* 포레스트 레이디 — 그리드, 갈래 거르기, 사진 크게 보기, 고치기·추가 */
(function () {
  'use strict';

  var BAKED = (window.PHOTOS || []).slice();
  var START_YEAR = 2018;
  var END_YEAR = new Date().getFullYear();

  var STORE_KEY = 'forest-lady-site-v1';
  var ADD_MAX_EDGE = 1200;      // 추가한 사진을 줄일 크기
  var ADD_QUALITY = 0.72;

  var $ = function (s) { return document.querySelector(s); };

  var store = { v: 1, edits: {}, added: [], deleted: [] };
  var PHOTOS = [];
  var kindFilter = null;
  var editing = false;
  var shown = [];

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  function years() {
    var out = [];
    var last = END_YEAR;
    PHOTOS.forEach(function (p) { if (p.year > last) last = p.year; });
    for (var y = START_YEAR; y <= last; y++) out.push(y);
    return out;
  }

  /* ══════════════ 고친 내용 보관 ══════════════ */
  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && s.v === 1) {
        store.edits = s.edits || {};
        store.added = s.added || [];
        store.deleted = s.deleted || [];
      }
    } catch (e) { /* 저장소를 못 쓰면 원본 그대로 봅니다 */ }
  }

  var flashTimer;
  function saveStore(quiet) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
      if (!quiet) {
        var f = $('#flash');
        f.classList.add('on');
        clearTimeout(flashTimer);
        flashTimer = setTimeout(function () { f.classList.remove('on'); }, 1400);
      }
      return true;
    } catch (e) {
      window.alert(
        '브라우저에 더 담을 자리가 없습니다.\n' +
        '「내보내기」로 지금까지 고친 내용을 받아두신 뒤, 사진은 조금씩 나눠 추가해 주세요.'
      );
      return false;
    }
  }

  function rebuild() {
    var gone = {};
    store.deleted.forEach(function (id) { gone[id] = 1; });
    PHOTOS = BAKED.concat(store.added)
      .filter(function (p) { return !gone[p.id]; })
      .map(function (base) {
        var out = {}, k;
        for (k in base) out[k] = base[k];
        var e = store.edits[base.id];
        if (e) for (k in e) out[k] = e[k];
        return out;
      });
  }

  function setField(photo, field, value) {
    (store.edits[photo.id] = store.edits[photo.id] || {})[field] = value;
    photo[field] = value;
    saveStore();
  }

  function removePhoto(photo) {
    if (!window.confirm('「' + (photo.title || '제목 없음') + '」을 목록에서 뺄까요?')) return;
    store.deleted.push(photo.id);
    delete store.edits[photo.id];
    store.added = store.added.filter(function (a) { return a.id !== photo.id; });
    saveStore();
    rebuild(); paintAll();
  }

  function resetAll() {
    if (!window.confirm('고친 내용과 추가한 사진을 모두 버리고 처음 상태로 돌아갑니다. 계속할까요?')) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    store.edits = {}; store.added = []; store.deleted = [];
    rebuild(); paintAll();
  }

  function hasChanges() {
    return Object.keys(store.edits).length > 0 || store.added.length > 0 || store.deleted.length > 0;
  }

  /* ══════════════ 갈래 ══════════════ */
  function allKinds() {
    var out = [];
    PHOTOS.forEach(function (p) { if (p.kind && out.indexOf(p.kind) < 0) out.push(p.kind); });
    return out;
  }

  /* ══════════════ 머리말 숫자 ══════════════ */
  function paintTally() {
    var seen = {};
    PHOTOS.forEach(function (p) { seen[p.year] = 1; });
    var data = [
      ['함께한 해', years().length, '년째'],
      ['모아둔 사진', PHOTOS.length, '장'],
      ['기록된 해', Object.keys(seen).length, '해']
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

  /* ══════════════ 연도 이동 · 갈래 거르기 ══════════════ */
  function visible() {
    if (!kindFilter) return PHOTOS;
    return PHOTOS.filter(function (p) { return p.kind === kindFilter; });
  }

  function paintNav() {
    var rows = visible();

    var ul = $('#yearNav');
    ul.innerHTML = '';
    years().forEach(function (y) {
      if (!rows.some(function (p) { return p.year === y; })) return;
      var li = el('li');
      var a = el('a', null, String(y));
      a.href = '#y' + y;
      li.appendChild(a);
      ul.appendChild(li);
    });

    var host = $('#kindNav');
    host.innerHTML = '';
    var all = el('button', null, '전체');
    all.type = 'button';
    all.setAttribute('aria-pressed', kindFilter ? 'false' : 'true');
    all.addEventListener('click', function () { kindFilter = null; paintAll(); });
    host.appendChild(all);

    allKinds().forEach(function (k) {
      var b = el('button', null, k);
      b.type = 'button';
      b.setAttribute('aria-pressed', kindFilter === k ? 'true' : 'false');
      b.addEventListener('click', function () {
        kindFilter = (kindFilter === k) ? null : k;
        paintAll();
      });
      host.appendChild(b);
    });
  }

  /* ══════════════ 타일 ══════════════ */
  function tile(p, idx) {
    var li = el('li', 'tile' + (editing ? ' editing' : '') + (p.src ? ' added' : ''));
    var fig = el('figure');
    fig.style.margin = '0';

    var b = el('button', 'shot');
    b.type = 'button';
    b.setAttribute('aria-label', p.year + ' ' + p.title + ' 크게 보기');
    var im = el('img');
    im.src = p.src || p.thumb;
    im.alt = p.year + ' ' + (p.title || '');
    im.loading = 'lazy';
    im.decoding = 'async';
    b.appendChild(im);
    if (!editing) b.addEventListener('click', function () { openLB(idx); });
    fig.appendChild(b);

    if (editing) {
      var box = el('div', 'edit-fields');

      var t = el('input');
      t.type = 'text';
      t.value = p.title || '';
      t.placeholder = '제목';
      t.setAttribute('aria-label', '제목');
      t.addEventListener('input', function () { setField(p, 'title', t.value); });
      box.appendChild(t);

      var row = el('div', 'edit-row');

      var yr = el('input', 'yr');
      yr.type = 'number';
      yr.min = '1990'; yr.max = '2100';
      yr.value = p.year;
      yr.setAttribute('aria-label', '연도');
      yr.addEventListener('change', function () {
        var v = parseInt(yr.value, 10);
        if (v >= 1990 && v <= 2100) { setField(p, 'year', v); paintAll(); }
      });
      row.appendChild(yr);

      var sel = el('select');
      sel.setAttribute('aria-label', '갈래');
      var kinds = allKinds();
      if (p.kind && kinds.indexOf(p.kind) < 0) kinds.push(p.kind);
      kinds.forEach(function (k) {
        var o = el('option', null, k);
        o.value = k;
        if (k === p.kind) o.selected = true;
        sel.appendChild(o);
      });
      var nk = el('option', null, '＋ 새 갈래…');
      nk.value = '__new__';
      sel.appendChild(nk);
      sel.addEventListener('change', function () {
        if (sel.value === '__new__') {
          var name = (window.prompt('새 갈래 이름을 적어주세요', '') || '').trim();
          if (!name) { sel.value = p.kind; return; }
          setField(p, 'kind', name);
        } else {
          setField(p, 'kind', sel.value);
        }
        paintAll();
      });
      row.appendChild(sel);
      box.appendChild(row);

      var acts = el('div', 'edit-actions');
      var del = el('button', null, '빼기');
      del.type = 'button';
      del.addEventListener('click', function () { removePhoto(p); });
      acts.appendChild(del);
      box.appendChild(acts);

      fig.appendChild(box);
    } else {
      var cap = el('figcaption');
      cap.appendChild(el('span', 't', p.title || '제목 없음'));
      cap.appendChild(document.createElement('br'));
      if (p.kind) cap.appendChild(el('span', 'k', p.kind));
      fig.appendChild(cap);
    }

    li.appendChild(fig);
    return li;
  }

  /* ══════════════ 그리드 ══════════════ */
  function paintGallery() {
    var host = $('#gallery');
    host.innerHTML = '';
    var rows = visible();
    shown = [];

    years().forEach(function (y) {
      var mine = rows.filter(function (p) { return p.year === y; });
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
        grid.appendChild(tile(p, idx));
      });
      sec.appendChild(grid);
      host.appendChild(sec);
    });

    if (editing) {
      var sec2 = el('section', 'year');
      var grid2 = el('ul', 'grid');
      var box = el('div', 'addbox');
      box.appendChild(el('b', null, '사진을 더 넣으려면'));
      box.appendChild(document.createTextNode('위쪽 「사진 추가」를 누르거나, 사진 파일을 이 화면에 끌어다 놓으세요.'));
      grid2.appendChild(box);
      sec2.appendChild(grid2);
      host.appendChild(sec2);
    }

    markCurrentYear();
  }

  function paintAll() {
    paintTally();
    paintNav();
    paintGallery();
    paintEditBar();
  }

  /* ══════════════ 사진 추가 ══════════════ */
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('파일을 읽지 못했습니다')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('사진을 열지 못했습니다')); };
        img.onload = function () {
          var scale = Math.min(1, ADD_MAX_EDGE / Math.max(img.width, img.height));
          var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
          var cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve({ src: cv.toDataURL('image/jpeg', ADD_QUALITY), w: w, h: h });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function addFiles(files) {
    var list = Array.prototype.slice.call(files).filter(function (f) {
      return /^image\//.test(f.type);
    });
    if (!list.length) return;

    var kinds = allKinds();
    var defaultKind = kinds.length ? kinds[0] : '그 밖';

    Promise.all(list.map(shrink)).then(function (results) {
      results.forEach(function (r, i) {
        store.added.push({
          id: 'u' + Date.now().toString(36) + i,
          year: END_YEAR,
          title: '',
          kind: defaultKind,
          src: r.src,
          w: r.w, h: r.h
        });
      });
      if (saveStore()) {
        rebuild();
        if (!editing) setEditing(true); else paintAll();
        window.setTimeout(function () {
          var last = document.querySelector('.tile.added input[type="text"]');
          if (last) { last.focus(); last.scrollIntoView({ block: 'center' }); }
        }, 60);
      } else {
        store.added = store.added.slice(0, store.added.length - results.length);
        rebuild(); paintAll();
      }
    }).catch(function (err) {
      window.alert('사진을 넣지 못했습니다: ' + err.message);
    });
  }

  $('#filePicker').addEventListener('change', function (e) {
    addFiles(e.target.files);
    e.target.value = '';
  });

  $('#addBtn').addEventListener('click', function () { $('#filePicker').click(); });

  // 끌어다 놓기
  ['dragover', 'drop'].forEach(function (evt) {
    document.addEventListener(evt, function (e) {
      if (!editing) return;
      e.preventDefault();
      if (evt === 'drop' && e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
  });

  /* ══════════════ 내보내기 ══════════════ */
  function exportEdits() {
    var payload = {
      group: '포레스트 레이디',
      exportedAt: new Date().toISOString().slice(0, 10),
      edits: store.edits,
      deleted: store.deleted,
      added: store.added,
      photos: PHOTOS.map(function (p) {
        return { id: p.id, year: p.year, title: p.title, kind: p.kind };
      })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'forest-lady-edits.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  $('#exportBtn').addEventListener('click', exportEdits);
  $('#resetBtn').addEventListener('click', resetAll);

  /* ══════════════ 고치기 켜고 끄기 ══════════════ */
  function paintEditBar() {
    $('#addBtn').hidden = !editing;
    $('#exportBtn').hidden = !editing && !hasChanges();
    $('#resetBtn').hidden = !hasChanges();
    $('#editToggle').textContent = editing ? '고치기 끝내기' : '고치기';
    $('#editToggle').setAttribute('aria-pressed', editing ? 'true' : 'false');

    var note = $('#editNote');
    if (editing) {
      note.textContent = '제목·연도·갈래를 바로 고칠 수 있습니다. 고친 내용은 이 브라우저에만 저장되니, '
        + '다 하시면 「내보내기」로 파일을 받아 저에게 주세요. 사이트에 영구 반영해 드립니다.';
    } else if (hasChanges()) {
      note.textContent = '고친 내용이 이 브라우저에 남아 있습니다. 「내보내기」로 파일을 받아 저에게 주시면 사이트에 반영됩니다.';
    } else {
      note.textContent = '';
    }
  }

  function setEditing(on) {
    editing = on;
    paintAll();
  }

  $('#editToggle').addEventListener('click', function () { setEditing(!editing); });

  /* ══════════════ 크게 보기 ══════════════ */
  var lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  var at = 0, lastFocus = null;

  function showLB() {
    var p = shown[at];
    lbImg.src = p.src || p.full;
    lbImg.alt = p.year + ' ' + (p.title || '');
    lbCap.innerHTML = '';
    lbCap.appendChild(el('b', null, String(p.year)));
    lbCap.appendChild(document.createTextNode(p.title || '제목 없음'));
    lbCap.appendChild(el('span', 'c', (p.kind || '') + '  ·  ' + (at + 1) + ' / ' + shown.length));
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

  /* ══════════════ 스크롤에 따라 연도 표시 ══════════════ */
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
        if (!sec.id) return;
        var top = sec.getBoundingClientRect().top - 100;
        if (top <= 0 && top > bestTop) { bestTop = top; best = sec.id.slice(1); }
      });
      Object.keys(navLinks).forEach(function (y) {
        navLinks[y].classList.toggle('on', y === best);
      });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ══════════════ 시작 ══════════════ */
  loadStore();
  rebuild();
  paintAll();
})();
