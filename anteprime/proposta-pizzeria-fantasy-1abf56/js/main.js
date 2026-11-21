(function () {
  'use strict';

  /* ---------- aperto / chiuso, ora di Roma ---------- */
  // minuti dalla mezzanotte; 0 = domenica (orari dalla scheda Google)
  var WEEK = {
    0: [[720, 840], [1080, 1320]],
    1: [[720, 840], [1080, 1320]],
    2: [],
    3: [[720, 840], [1080, 1320]],
    4: [[720, 840], [1080, 1320]],
    5: [[720, 840], [1080, 1380]],
    6: [[720, 840], [1080, 1380]]
  };
  var DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  var WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function romeNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return { day: WD[o.weekday], min: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function hhmm(m) { var h = Math.floor(m / 60), mm = m % 60; return h + ':' + (mm < 10 ? '0' : '') + mm; }
  function status() {
    var now = romeNow(), today = WEEK[now.day], i, r;
    for (i = 0; i < today.length; i++) {
      r = today[i];
      if (now.min >= r[0] && now.min < r[1]) {
        return { open: true, text: (r[1] - now.min <= 30 ? 'Aperto, chiude alle ' : 'Aperto ora, fino alle ') + hhmm(r[1]) };
      }
      if (now.min < r[0]) return { open: false, text: 'Chiuso ora, riapre alle ' + hhmm(r[0]) };
    }
    for (i = 1; i <= 7; i++) {
      var d = (now.day + i) % 7;
      if (WEEK[d].length) {
        return { open: false, text: 'Chiuso ora, riapre ' + (i === 1 ? 'domani' : DAYS[d]) + ' alle ' + hhmm(WEEK[d][0][0]) };
      }
    }
    return { open: false, text: 'Chiuso' };
  }
  function renderStatus() {
    var s = status();
    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      var t = el.querySelector('[data-status-text]');
      if (t) t.textContent = s.text;
    });
    var day = romeNow().day;
    document.querySelectorAll('[data-hours] tr').forEach(function (tr) {
      tr.classList.toggle('is-today', String(day) === tr.getAttribute('data-day'));
    });
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* ---------- menu a schede ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t, false); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
      else if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (k === 'Home') n = tabs[0];
      else if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
  });

  /* liste lunghe: su telefono mostriamo le prime 12 */
  document.querySelectorAll('.dishes').forEach(function (ul) {
    var n = ul.children.length;
    if (n <= 12) return;
    ul.classList.add('is-collapsed');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--line more';
    btn.textContent = 'Mostra tutte le ' + n;
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = ul.classList.toggle('is-collapsed') === false;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Mostra meno' : 'Mostra tutte le ' + n;
      if (!open) ul.parentNode.scrollIntoView({ block: 'start' });
    });
    ul.parentNode.appendChild(btn);
  });

  /* ---------- il forno: le pizze rotolano mentre scorri ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var roll = document.querySelector('[data-roll]');
  if (!roll) return;
  var sticky = roll.querySelector('.roll__sticky');
  var track = roll.querySelector('[data-track]');
  var discs = Array.prototype.slice.call(roll.querySelectorAll('.pz__disc'));
  var maxX = 0, radius = 1, range = 1, pinned = false;

  function measure() {
    pinned = !reduce.matches;
    roll.classList.toggle('is-pinned', pinned);
    if (!pinned) {
      roll.style.height = '';
      track.style.transform = '';
      discs.forEach(function (d) { d.style.transform = ''; });
      return;
    }
    var vh = sticky.offsetHeight;
    maxX = Math.max(0, track.scrollWidth - sticky.clientWidth);
    roll.style.height = Math.round(maxX + vh) + 'px';
    range = Math.max(1, roll.offsetHeight - vh);
    radius = Math.max(1, (discs[0] ? discs[0].offsetWidth : 200) / 2);
    update();
  }
  function update() {
    if (!pinned) return;
    var top = roll.getBoundingClientRect().top;
    var p = Math.min(1, Math.max(0, -top / range));
    var x = -p * maxX;
    track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    // rotolamento: l'angolo è lo spazio percorso diviso il raggio
    var deg = (x / radius) * 57.2958;
    var rot = 'rotate(' + deg.toFixed(2) + 'deg)';
    for (var i = 0; i < discs.length; i++) discs[i].style.transform = rot;
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (reduce.addEventListener) reduce.addEventListener('change', measure);
  measure();
})();
