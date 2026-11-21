(function () {
  'use strict';

  /* ---------- Orari e stato "aperto ora" (ora di Roma) ---------- */
  var LUNCH = [720, 870];      // 12:00-14:30
  var DINNER = [1140, 1350];   // 19:00-22:30
  // 0 = domenica ... 6 = sabato. Lunedì chiuso (orari Google)
  var HOURS = { 0: [LUNCH, DINNER], 1: [], 2: [LUNCH, DINNER], 3: [LUNCH, DINNER], 4: [LUNCH, DINNER], 5: [LUNCH, DINNER], 6: [LUNCH, DINNER] };
  var DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

  function romeNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
      return { day: wd, min: Number(o.hour) * 60 + Number(o.minute) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function hhmm(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    return h + ':' + (mm < 10 ? '0' : '') + mm;
  }
  function status(now) {
    var today = HOURS[now.day], i, r, m = now.min;
    for (i = 0; i < today.length; i++) {
      r = today[i];
      if (m >= r[0] && m < r[1]) {
        return r[1] - m <= 30
          ? { open: true, text: 'Aperto ora, chiude tra poco (' + hhmm(r[1]) + ')' }
          : { open: true, text: 'Aperto ora, chiude alle ' + hhmm(r[1]) };
      }
    }
    for (i = 0; i < today.length; i++) {
      if (today[i][0] > m) return { open: false, text: 'Chiuso ora, riapre alle ' + hhmm(today[i][0]) };
    }
    for (var k = 1; k <= 7; k++) {
      var nd = (now.day + k) % 7;
      if (HOURS[nd].length) {
        return { open: false, text: 'Chiuso ora, riapre ' + (k === 1 ? 'domani' : DAYS[nd]) + ' alle ' + hhmm(HOURS[nd][0][0]) };
      }
    }
    return { open: false, text: 'Chiuso ora' };
  }
  function renderStatus() {
    var now = romeNow();
    var s = status(now);
    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      var t = el.querySelector('[data-status-text]');
      if (t) t.textContent = s.text;
    });
    document.querySelectorAll('[data-hours] tr').forEach(function (tr) {
      tr.classList.toggle('is-today', Number(tr.getAttribute('data-dow')) === now.day);
    });
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* ---------- Sotto i tre volti: si passa sotto gli archi scorrendo ---------- */
  var sec = document.querySelector('[data-volti]');
  if (!sec) return;
  var scene = sec.querySelector('[data-scene]');
  var layers = Array.prototype.slice.call(sec.querySelectorAll('.volto'));
  var imgs = layers.map(function (l) { return l.querySelector('img'); });
  var caps = Array.prototype.slice.call(sec.querySelectorAll('[data-cap]'));
  var steps = Array.prototype.slice.call(sec.querySelectorAll('.volti__steps li'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var F = 0.62;          // grandezza del primo arco all'inizio
  var ZMAX = 3.3;        // profondità totale del portico
  var live = false, W = 0, H = 0, ww = 0, sCover = 1.5, range = 1, lastIdx = -2;

  function clearStyles() {
    layers.forEach(function (l, k) {
      l.style.transform = ''; l.style.visibility = ''; l.style.removeProperty('--dim');
      imgs[k].style.transform = '';
    });
  }

  function measure() {
    live = !reduce.matches;
    sec.classList.toggle('is-live', live);
    if (!live) {
      clearStyles();
      caps.forEach(function (c) { c.classList.remove('is-on'); });
      steps.forEach(function (s) { s.classList.remove('is-on'); });
      lastIdx = -2;
      return;
    }
    W = scene.clientWidth;
    H = scene.clientHeight;
    ww = Math.round(Math.min(W * 0.86, H * 0.74));
    sec.style.setProperty('--ww', ww + 'px');
    sec.style.setProperty('--sw', W + 'px');
    var r = ww / 2;
    sCover = Math.max(H / Math.max(1, H - r), W / ww) * 1.12;
    range = Math.max(1, sec.offsetHeight - window.innerHeight);
    lastIdx = -2;
    update();
  }

  function update() {
    if (!live) return;
    var top = sec.getBoundingClientRect().top;
    var p = Math.min(1, Math.max(0, -top / range));
    var z = p * ZMAX;
    var idx = -1, k, s;
    var scales = [];
    for (k = 0; k < layers.length; k++) {
      var d = k + 1 - z;
      s = d > 0 ? F / d : sCover;
      if (s >= sCover) { s = sCover; idx = k; }
      scales.push(s);
    }
    for (k = 0; k < layers.length; k++) {
      s = scales[k];
      var hidden = k < idx; // coperto da un arco più vicino
      layers[k].style.visibility = hidden ? 'hidden' : '';
      if (hidden) continue;
      layers[k].style.transform = 'translateX(-50%) scale(' + s.toFixed(4) + ')';
      imgs[k].style.transform = 'translateX(-50%) scale(' + (1 / s).toFixed(4) + ')';
      var dim = Math.max(0, 0.55 * (1 - s / (0.7 * sCover)));
      layers[k].style.setProperty('--dim', dim.toFixed(3));
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      caps.forEach(function (c) { c.classList.toggle('is-on', Number(c.getAttribute('data-cap')) === idx); });
      steps.forEach(function (st, i) { st.classList.toggle('is-on', i <= idx); });
    }
  }

  // aggiornamento diretto dallo scroll: leggero e non dipende da requestAnimationFrame
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', measure);
  if (reduce.addEventListener) reduce.addEventListener('change', measure);
  measure();
  window.addEventListener('load', measure);
})();
