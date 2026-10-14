/* Sattam static site: mobile menu + client-side search.
   The site is fully readable without JavaScript. */
(function () {
  'use strict';

  function norm(s) {
    return (s || '').toString().toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim();
  }
  function esc(s) {
    return (s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function base() {
    var el = document.querySelector('meta[name="site-base"]');
    return el ? el.getAttribute('content') || '' : '';
  }

  function cardHtml(it) {
    return '<a class="card" href="' + it.url + '">' +
      '<span class="card-emj" aria-hidden="true">' + it.emoji + '</span>' +
      '<span class="card-cat"><span class="ta" lang="ta">' + esc(it.catTa) + '</span><span class="en" lang="en">' + esc(it.catEn) + '</span></span>' +
      '<span class="card-title"><span class="ta" lang="ta">' + esc(it.titleTa) + '</span><span class="en" lang="en">' + esc(it.titleEn) + '</span></span>' +
      '<span class="card-sum"><span class="ta" lang="ta">' + esc(it.sumTa) + '</span><span class="en" lang="en">' + esc(it.sumEn) + '</span></span>' +
      '</a>';
  }

  function initMenu() {
    var btn = document.querySelector('.menu-btn');
    var nav = document.getElementById('mnav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function score(it, terms) {
    if (!terms.length) return 1;
    var t = norm(it.titleTa + ' ' + it.titleEn);
    var k = norm(it.keywords);
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      if (t.indexOf(terms[i]) !== -1) s += 6;
      else if (k.indexOf(terms[i]) !== -1) s += 2;
      else s -= 12;
    }
    return s;
  }

  function initSearch() {
    var form = document.getElementById('filters');
    var results = document.getElementById('results');
    if (!form || !results) return;
    var qEl = document.getElementById('fq');
    var cEl = document.getElementById('fc');
    var reset = document.getElementById('freset');
    var rc = document.getElementById('rc');
    var empty = document.getElementById('empty');
    var index = [];

    var params = new URLSearchParams(location.search);
    if (params.get('q')) qEl.value = params.get('q');
    if (params.get('category')) cEl.value = params.get('category');

    fetch(base() + '/assets/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { index = d; render(); })
      .catch(function () { index = []; render(); });

    function render() {
      var q = norm(qEl.value);
      var terms = q ? q.split(' ').filter(Boolean) : [];
      var cat = cEl.value;
      var out = index
        .filter(function (it) { return !cat || it.category === cat; })
        .map(function (it) { return { it: it, s: score(it, terms) }; })
        .filter(function (x) { return x.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .map(function (x) { return x.it; });

      results.innerHTML = out.map(cardHtml).join('');
      empty.hidden = out.length !== 0;
      rc.textContent = q ? out.length + ' \u00B7 "' + qEl.value + '"' : '';

      var usp = new URLSearchParams();
      if (qEl.value) usp.set('q', qEl.value);
      if (cat) usp.set('category', cat);
      var qs = usp.toString();
      history.replaceState(null, '', qs ? '?' + qs : location.pathname);
    }

    var timer;
    qEl.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(render, 120); });
    cEl.addEventListener('change', render);
    reset.addEventListener('click', function () { qEl.value = ''; cEl.value = ''; render(); });
  }

  function initPrint() {
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-print]');
      if (!btn) return;
      var box = btn.closest('.letter-box');
      if (box) box.classList.add('printing');
      document.body.classList.add('print-one');
      window.print();
      setTimeout(function () {
        document.body.classList.remove('print-one');
        if (box) box.classList.remove('printing');
      }, 600);
    });
  }

  function initSW() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(base() + '/sw.js').catch(function () {});
    });
  }

  function initPrefs() {
    var root = document.documentElement;

    var level = parseInt(localStorage.getItem('sattam-font') || '0', 10);
    if (isNaN(level)) level = 0;
    var BASE_PX = 17.5;
    function applyFont() { root.style.fontSize = (BASE_PX * (1 + level * 0.09)).toFixed(1) + 'px'; }
    applyFont();
    Array.prototype.forEach.call(document.querySelectorAll('[data-font]'), function (b) {
      b.addEventListener('click', function () {
        level = Math.min(3, Math.max(-1, level + parseInt(b.getAttribute('data-font'), 10)));
        try { localStorage.setItem('sattam-font', String(level)); } catch (e) {}
        applyFont();
      });
    });

    var tb = document.querySelector('[data-theme-toggle]');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    function applyTheme(th) {
      root.setAttribute('data-theme', th);
      if (tb) tb.textContent = th === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
    }
    var savedTheme = null;
    try { savedTheme = localStorage.getItem('sattam-theme'); } catch (e) {}
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    if (tb) tb.addEventListener('click', function () {
      var th = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('sattam-theme', th); } catch (e) {}
      applyTheme(th);
    });
  }

  function initSpeak() {
    if (!('speechSynthesis' in window)) return;
    var synth = window.speechSynthesis;
    var taVoice = null;
    function pickVoice() {
      var vs = synth.getVoices() || [];
      for (var i = 0; i < vs.length; i++) { if (/^ta([-_]|$)/i.test(vs[i].lang)) { taVoice = vs[i]; return; } }
    }
    pickVoice();
    if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = pickVoice;

    function speak(text) {
      if (!text) return;
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ta-IN';
      if (taVoice) u.voice = taVoice;
      u.rate = 0.9;
      synth.speak(u);
    }

    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-speak]');
      if (b) { ev.preventDefault(); speak(b.getAttribute('data-speak')); return; }
      if (ev.target.closest('[data-stop]')) { ev.preventDefault(); synth.cancel(); }
    });
  }

  function initMic() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-mic]');
      if (!b) return;
      ev.preventDefault();
      if (!SR) { window.alert('Voice search is not supported in this browser. Please type your question.'); return; }
      var input = document.getElementById(b.getAttribute('data-mic'));
      var rec = new SR();
      rec.lang = 'ta-IN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      b.classList.add('is-listening');
      rec.onresult = function (e) {
        var text = e.results[0][0].transcript;
        if (input) { input.value = text; input.dispatchEvent(new Event('input', { bubbles: true })); }
        var form = b.closest('form');
        if (form && !form.id) { try { form.submit(); } catch (err) {} }
      };
      rec.onerror = function () { b.classList.remove('is-listening'); };
      rec.onend = function () { b.classList.remove('is-listening'); };
      try { rec.start(); } catch (err) { b.classList.remove('is-listening'); }
    });
  }

  var HELPLINES = ['15100', '14567', '14448', '1098', '1930', '1915', '181', '112'];
  function initAutoTel() {
    var root = document.querySelector('.prose');
    if (!root || !document.createTreeWalker) return;
    var re = new RegExp('(^|[^0-9])(' + HELPLINES.join('|') + ')(?![0-9])', 'g');
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue) continue;
      if (n.parentNode && n.parentNode.closest && n.parentNode.closest('a, button')) continue;
      re.lastIndex = 0;
      if (re.test(n.nodeValue)) nodes.push(n);
    }
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      var text = node.nodeValue, last = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(text))) {
        var start = m.index + m[1].length;
        if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start)));
        var a = document.createElement('a');
        a.href = 'tel:' + m[2];
        a.className = 'tel-link';
        a.textContent = m[2];
        frag.appendChild(a);
        last = start + m[2].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function initSave() {
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-save]');
      if (!b) return;
      ev.preventDefault();
      var mark = function () { b.textContent = '\u2713';
        var u = document.documentElement.lang || '';
      };
      if (!('caches' in window)) { b.classList.add('is-saved'); b.textContent = '\u2713'; return; }
      var urls = [location.pathname, base() + '/assets/style.css', base() + '/assets/app.js', base() + '/assets/search-index.json'];
      caches.open('sattam-v1')
        .then(function (c) { return Promise.all(urls.map(function (u) { return c.add(u).catch(function () {}); })); })
        .then(function () { b.classList.add('is-saved'); mark(); })
        .catch(function () { b.classList.add('is-saved'); mark(); });
    });
  }

  function initShare() {
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-share]');
      if (!b) return;
      ev.preventDefault();
      var url = b.getAttribute('data-share');
      var text = b.getAttribute('data-share-text') || '';
      if (navigator.share) {
        navigator.share({ title: text, text: text, url: url }).catch(function () {});
        return;
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          var old = b.textContent; b.textContent = '\u2713';
          setTimeout(function () { b.textContent = old; }, 1500);
        }).catch(function () {});
      }
    });
  }

  function initQuickExit() {
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest('[data-quick-exit]')) return;
      ev.preventDefault();
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
      document.title = 'Weather';
      location.replace('https://www.google.com/search?q=today+weather');
    });
  }

  function initShareImage() {
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-share-image]');
      if (!b) return;
      ev.preventDefault();
      var ta = b.getAttribute('data-ta') || '';
      var en = b.getAttribute('data-en') || '';
      var pt = b.getAttribute('data-point') || '';
      var url = b.getAttribute('data-url') || location.href;
      var W = 1080, H = 1350, pad = 80;
      var c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d');
      function wrap(text, font, maxW) {
        x.font = font;
        var words = (text || '').split(' '), lines = [], cur = '';
        words.forEach(function (w) {
          var t = (cur + ' ' + w).trim();
          if (x.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
        });
        if (cur) lines.push(cur);
        return lines;
      }
      function roundRect(x0, y0, w, h, r) {
        x.beginPath(); x.moveTo(x0 + r, y0);
        x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
        x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath();
      }
      function draw() {
        var g = x.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#0e4d3a'); g.addColorStop(1, '#082a20');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        x.fillStyle = '#e8a33d'; x.fillRect(0, 0, 16, H);
        var maxW = W - pad * 2, y = 240;
        x.fillStyle = '#e8a33d'; x.font = '600 36px "Noto Sans Tamil", sans-serif';
        x.fillText('\u0b9a\u0b9f\u0bcd\u0b9f\u0bae\u0bcd \u00b7 Sattam', pad, 130);
        x.fillStyle = '#ffffff';
        var f1 = '800 68px "Noto Sans Tamil", sans-serif';
        wrap(ta, f1, maxW).slice(0, 4).forEach(function (l) { x.font = f1; x.fillText(l, pad, y); y += 86; });
        y += 24;
        x.fillStyle = '#c6ded0';
        var f2 = '600 40px "Noto Sans Tamil", sans-serif';
        wrap(en, f2, maxW).slice(0, 3).forEach(function (l) { x.font = f2; x.fillText(l, pad, y); y += 54; });
        if (pt) {
          y += 50;
          x.fillStyle = 'rgba(255,255,255,0.10)';
          roundRect(pad, y, maxW, 330, 26); x.fill();
          x.fillStyle = '#ffffff';
          var f3 = '600 44px "Noto Sans Tamil", sans-serif';
          var yy = y + 82;
          wrap(pt, f3, maxW - 80).slice(0, 5).forEach(function (l) { x.font = f3; x.fillText(l, pad + 40, yy); yy += 60; });
        }
        x.fillStyle = '#e8a33d'; x.font = '700 34px sans-serif';
        x.fillText('sattam \u00b7 free legal guides', pad, H - 96);
        x.fillStyle = '#9fb8aa'; x.font = '400 28px sans-serif';
        x.fillText(url.replace(/^https?:\/\//, ''), pad, H - 50);
      }
      function done() {
        draw();
        c.toBlob(function (blob) {
          if (!blob) return;
          var file = null;
          try { file = new File([blob], 'sattam.png', { type: 'image/png' }); } catch (e) { file = null; }
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: en, text: en }).catch(function () {});
            return;
          }
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = 'sattam.png';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
        }, 'image/png');
      }
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(done); else done();
    });
  }

  function initDistrictFilter() {
    var q = document.getElementById('nmq');
    var grid = document.getElementById('nmgrid');
    if (!q || !grid) return;
    var none = document.getElementById('nmnone');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.nm-card'));
    q.addEventListener('input', function () {
      var t = q.value.toLowerCase().trim();
      var shown = 0;
      cards.forEach(function (c) {
        var hit = !t || (c.getAttribute('data-name') || '').indexOf(t) !== -1;
        c.hidden = !hit;
        if (hit) shown++;
      });
      if (none) none.hidden = shown !== 0;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initDistrictFilter();
    initAutoTel();
    initSave();
    initShare();
    initShareImage();
    initQuickExit();
    initSearch();
    initPrint();
    initSW();
    initPrefs();
    initSpeak();
    initMic();
  });
})();
