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
    function applyFont() { root.style.fontSize = (100 + level * 8) + '%'; }
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

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initSearch();
    initPrint();
    initSW();
    initPrefs();
    initSpeak();
    initMic();
  });
})();
