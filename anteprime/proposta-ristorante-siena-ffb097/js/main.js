(function () {
  'use strict';

  /* ---------- Orari e stato "aperto ora" (ora di Roma) ---------- */
  var SERA = [1140, 1380]; // 19:00-23:00
  // 0 = domenica ... 6 = sabato. Lunedì chiuso (orari Google)
  var HOURS = { 0: [SERA], 1: [], 2: [SERA], 3: [SERA], 4: [SERA], 5: [SERA], 6: [SERA] };
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
          : { open: true, text: 'Aperto ora, fino alle ' + hhmm(r[1]) };
      }
    }
    for (i = 0; i < today.length; i++) {
      if (today[i][0] > m) return { open: false, text: 'Chiuso ora, apriamo stasera alle ' + hhmm(today[i][0]) };
    }
    for (var k = 1; k <= 7; k++) {
      var nd = (now.day + k) % 7;
      if (HOURS[nd].length) {
        return { open: false, text: 'Chiuso ora, riapriamo ' + (k === 1 ? 'domani' : DAYS[nd]) + ' alle ' + hhmm(HOURS[nd][0][0]) };
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

  /* ---------- Menu a schede ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tabs] [role="tab"]'));
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t, false); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') n = tabs[0];
      else if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
  });

  // liste lunghe: su telefono mostriamo le prime dieci, il resto con un tocco
  var narrow = window.matchMedia('(max-width: 699px)');
  document.querySelectorAll('[data-tabs] [role="tabpanel"]').forEach(function (panel) {
    var n = panel.querySelectorAll('.voce').length;
    if (n <= 12) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'altre';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Mostra tutte e ' + n;
    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('is-short') === false;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Mostra meno' : 'Mostra tutte e ' + n;
      if (!open) panel.scrollIntoView({ block: 'nearest' });
    });
    panel.appendChild(btn);
    function sync() {
      panel.classList.toggle('is-short', narrow.matches);
      btn.hidden = !narrow.matches;
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Mostra tutte e ' + n;
    }
    sync();
    if (narrow.addEventListener) narrow.addEventListener('change', sync);
  });

  /* ---------- La linea della S: si disegna scorrendo ---------- */
  var body = document.querySelector('[data-storia-body]');
  if (!body) return;
  var svg = body.querySelector('svg');
  var line = body.querySelector('[data-line]');
  var track = body.querySelector('[data-track]');
  var fish = body.querySelector('[data-fish]');
  var grad = body.querySelector('[data-grad]');
  var tappe = Array.prototype.slice.call(body.querySelectorAll('[data-tappa]'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var total = 0, samples = [], dotLens = [], lastL = -1;

  function lengthAtY(y) {
    if (!samples.length) return 0;
    if (y <= samples[0].y) return 0;
    for (var i = 1; i < samples.length; i++) {
      if (samples[i].y >= y) {
        var a = samples[i - 1], b = samples[i];
        var t = (y - a.y) / Math.max(0.001, b.y - a.y);
        return a.l + (b.l - a.l) * t;
      }
    }
    return total;
  }

  function build() {
    var bRect = body.getBoundingClientRect();
    var pts = tappe.map(function (t) {
      var r = t.querySelector('.tappa__dot').getBoundingClientRect();
      return { x: r.left + r.width / 2 - bRect.left, y: r.top + r.height / 2 - bRect.top };
    });
    if (!pts.length) return;
    var wide = window.innerWidth >= 900;
    var amp = wide ? 230 : 52;
    var prev = { x: pts[0].x, y: -60 };
    var d = 'M' + prev.x.toFixed(1) + ' ' + prev.y.toFixed(1);
    pts.forEach(function (p, i) {
      var dy = p.y - prev.y, s = i % 2 ? -1 : 1;
      var a = Math.min(amp, Math.abs(dy) * (wide ? 0.75 : 0.3)); // curve morbide anche nei tratti corti
      d += ' C' + (prev.x + s * a).toFixed(1) + ' ' + (prev.y + dy * 0.33).toFixed(1) +
           ' ' + (p.x - s * a).toFixed(1) + ' ' + (prev.y + dy * 0.66).toFixed(1) +
           ' ' + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      prev = p;
    });
    var endY = bRect.height + 10;
    var aEnd = Math.min(amp * 0.5, (endY - prev.y) * 0.3);
    d += ' C' + (prev.x + aEnd).toFixed(1) + ' ' + (prev.y + (endY - prev.y) * 0.4).toFixed(1) +
         ' ' + prev.x.toFixed(1) + ' ' + (endY - 20).toFixed(1) + ' ' + prev.x.toFixed(1) + ' ' + endY.toFixed(1);
    line.setAttribute('d', d);
    track.setAttribute('d', d);
    grad.setAttribute('y2', String(Math.round(bRect.height)));
    total = line.getTotalLength();
    samples = [];
    var N = 240;
    for (var i = 0; i <= N; i++) {
      var l = total * i / N, pt = line.getPointAtLength(l);
      samples.push({ l: l, y: pt.y });
    }
    dotLens = pts.map(function (p) { return lengthAtY(p.y); });
    line.style.strokeDasharray = total.toFixed(1) + ' ' + (total + 10).toFixed(1);
    lastL = -1;
    update();
  }

  function place(L) {
    line.style.strokeDashoffset = (total - L).toFixed(1);
    var a = line.getPointAtLength(Math.max(0, L - 2));
    var b = line.getPointAtLength(Math.min(total, L + 2));
    var p = line.getPointAtLength(L);
    var ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    fish.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    fish.style.opacity = L > 4 ? '1' : '0';
    tappe.forEach(function (t, i) { t.classList.toggle('is-reached', L >= dotLens[i] - 2); });
  }

  function update() {
    if (!total) return;
    var L;
    if (reduce.matches) {
      L = total;
    } else {
      var top = body.getBoundingClientRect().top;
      var tipY = window.innerHeight * 0.62 - top;
      L = lengthAtY(tipY);
    }
    if (Math.abs(L - lastL) < 0.5) return;
    lastL = L;
    place(L);
  }

  // aggiornamento diretto dallo scroll: leggero e non dipende da requestAnimationFrame
  window.addEventListener('scroll', update, { passive: true });
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 120); });
  if (reduce.addEventListener) reduce.addEventListener('change', build);
  build();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  window.addEventListener('load', build);
})();
