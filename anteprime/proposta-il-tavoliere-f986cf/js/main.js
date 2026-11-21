(function () {
  'use strict';

  /* ---------- aperto / chiuso, ora di Roma ---------- */
  // minuti dalla mezzanotte; 0 = domenica (orari dalla scheda Google)
  var LUNCH_DINNER = [[675, 795], [1035, 1260]];
  var WEEK = { 0: [[1020, 1260]], 1: [], 2: [], 3: LUNCH_DINNER, 4: LUNCH_DINNER, 5: LUNCH_DINNER, 6: LUNCH_DINNER };
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

  /* ---------- la storia: il viaggio si disegna mentre scorri ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var story = document.querySelector('[data-story]');
  if (!story) return;
  var sticky = story.querySelector('.story__sticky');
  var steps = Array.prototype.slice.call(story.querySelectorAll('.step'));
  var dots = Array.prototype.slice.call(story.querySelectorAll('.story__dots li'));
  var reveal = story.querySelector('[data-reveal]');
  var N = steps.length, range = 1, pinned = false, current = -1;

  function clamp(v) { return Math.min(1, Math.max(0, v)); }
  function setStep(i) {
    if (i === current) return;
    current = i;
    steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    dots.forEach(function (d, k) { d.classList.toggle('on', k <= i); });
  }
  function measure() {
    pinned = !reduce.matches;
    story.classList.toggle('is-pinned', pinned);
    if (!pinned) {
      story.style.height = '';
      reveal.style.strokeDashoffset = '0';
      story.classList.add('is-arrived');
      return;
    }
    var vh = sticky.offsetHeight;
    story.style.height = Math.round(vh * (1 + N * 0.7)) + 'px';
    range = Math.max(1, story.offsetHeight - vh);
    current = -1;
    update();
  }
  function update() {
    if (!pinned) return;
    var p = clamp(-story.getBoundingClientRect().top / range);
    // la linea parte da San Severo durante il 1996 e arriva a Villafranca
    var r = clamp((p - 0.17) / 0.2);
    reveal.style.strokeDashoffset = (1 - r).toFixed(4);
    story.classList.toggle('is-arrived', r > 0.97);
    setStep(Math.min(N - 1, Math.floor(p * N * 0.9999)));
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (reduce.addEventListener) reduce.addEventListener('change', measure);
  measure();
})();
