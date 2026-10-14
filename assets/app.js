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

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initSearch();
    initPrint();
    initSW();
  });
})();
