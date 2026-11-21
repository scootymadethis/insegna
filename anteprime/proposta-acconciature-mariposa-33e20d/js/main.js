/* Acconciature Mariposa: la farfalla che accompagna lo scroll, prima e dopo, orari */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  /* ---------- the butterfly ---------- */
  function bfly(uid) {
    var wing =
      '<path d="M-2.5-5C-13-35-43-43-46-19c-1.6 13 14 22 43.5 17.5z" fill="url(#wu' + uid + ')" stroke="#431728" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M-2.5 1.5c-19-.5-35 11-31 26 3.6 12 22 6 31-20z" fill="url(#wd' + uid + ')" stroke="#431728" stroke-width="1.3" stroke-linejoin="round"/>' +
      '<path d="M-8-6C-18-20-30-28-38-24" stroke="#431728" stroke-opacity=".35" stroke-width="1" fill="none"/>' +
      '<circle cx="-33" cy="-25" r="3.4" fill="#fff" fill-opacity=".85"/><circle cx="-24" cy="-31" r="1.8" fill="#fff" fill-opacity=".8"/>' +
      '<circle cx="-20" cy="18" r="2.4" fill="#fff" fill-opacity=".75"/>';
    return '<svg class="bfly" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="wu' + uid + '" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F7C2AE"/><stop offset=".5" stop-color="#EE8A7F"/><stop offset="1" stop-color="#A8326B"/></linearGradient>' +
      '<linearGradient id="wd' + uid + '" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3B39F"/><stop offset="1" stop-color="#C24D72"/></linearGradient></defs>' +
      '<g class="wl">' + wing + '</g>' +
      '<g class="wr"><g transform="scale(-1 1)">' + wing + '</g></g>' +
      '<path d="M0-14c3.4 4.5 3.6 34 0 41-3.6-7-3.4-36.5 0-41z" fill="#431728"/><circle cy="-16.5" r="3.6" fill="#431728"/>' +
      '<path d="M-1.2-19C-4-27-8-31-12-33M1.2-19C4-27 8-31 12-33" stroke="#431728" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="-12" cy="-33" r="1.6" fill="#431728"/><circle cx="12" cy="-33" r="1.6" fill="#431728"/></svg>';
  }

  /* ---------- prima e dopo ---------- */
  var PAIRS = [
    { prima: 'img/borgogna-prima.webp', dopo: 'img/borgogna-dopo.webp', w: 900, h: 1200,
      altP: 'Prima: capelli lunghi con un colore spento e ciocche rosa sbiadite',
      altD: 'Dopo: capelli lunghi color borgogna con riflessi magenta',
      cap: 'Da un colore spento e disomogeneo a un borgogna profondo con riflessi magenta. Abbiamo uniformato e nutrito: ora il colore illumina il viso e i capelli sembrano più sani.',
      url: 'https://www.instagram.com/p/DfX1zVekddM/' },
    { prima: 'img/mossi-prima.webp', dopo: 'img/mossi-dopo.webp', w: 720, h: 960,
      altP: 'Prima: capelli lunghi e lisci, castano chiaro',
      altD: 'Dopo: caschetto mosso sopra le spalle',
      cap: 'Solo taglio, solo forma: dai lunghi lisci a un caschetto mosso, leggero e pieno di movimento, senza toccare il colore.',
      url: 'https://www.instagram.com/reel/DfvKHIRBRNf/' }
  ];

  var ba = document.getElementById('ba');
  var range = document.getElementById('ba-range');
  var handle = document.getElementById('ba-handle');
  var imgP = document.getElementById('ba-prima');
  var imgD = document.getElementById('ba-dopo');
  var caption = document.getElementById('ba-caption');
  var link = document.getElementById('ba-link');
  var touched = false;

  if (ba && range) {
    handle.innerHTML = bfly('h');
    var pos = 50, dragging = false;
    var setPos = function (p) {
      pos = Math.max(0, Math.min(100, p));
      ba.style.setProperty('--pos', pos.toFixed(2) + '%');
      range.value = String(Math.round(pos));
      range.setAttribute('aria-valuetext', 'Dopo visibile al ' + Math.round(100 - pos) + ' per cento');
    };
    var fromEvent = function (e) {
      var r = ba.getBoundingClientRect();
      setPos((e.clientX - r.left) / r.width * 100);
    };
    ba.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; touched = true;
      try { ba.setPointerCapture(e.pointerId); } catch (err) {}
      ba.classList.add('is-dragging', 'is-flying');
      fromEvent(e);
    });
    ba.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    var stop = function () { dragging = false; ba.classList.remove('is-dragging', 'is-flying'); };
    ba.addEventListener('pointerup', stop);
    ba.addEventListener('pointercancel', stop);
    range.addEventListener('input', function () { touched = true; setPos(+range.value); });
    setPos(50);

    /* switch between the two transformations */
    var pairBtns = document.querySelectorAll('.pair');
    pairBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = +btn.getAttribute('data-pair');
        pairBtns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var p = PAIRS[i];
        ba.classList.add('is-swapping');
        window.setTimeout(function () {
          var loaded = 0;
          var done = function () { if (++loaded === 2) { ba.classList.remove('is-swapping'); if (!touched) hint(); } };
          imgP.onload = done; imgD.onload = done;
          imgP.width = p.w; imgP.height = p.h; imgD.width = p.w; imgD.height = p.h;
          imgP.src = p.prima; imgP.alt = p.altP;
          imgD.src = p.dopo; imgD.alt = p.altD;
          if (imgP.complete && imgD.complete) { loaded = 1; done(); }
          caption.textContent = p.cap;
          link.href = p.url;
          setPos(50);
        }, reduce ? 0 : 180);
      });
    });

    /* one gentle demonstration when the slider first appears */
    var hinting = false;
    var hint = function () {
      if (reduce || hinting) return;
      hinting = true;
      var seq = [[50, 26, 650], [26, 74, 950], [74, 50, 650]];
      var k = 0, t0 = null;
      ba.classList.add('is-flying');
      var step = function (t) {
        if (touched) { hinting = false; ba.classList.remove('is-flying'); return; }
        if (t0 === null) t0 = t;
        var s = seq[k], f = Math.min(1, (t - t0) / s[2]);
        var e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        setPos(s[0] + (s[1] - s[0]) * e);
        if (f >= 1) { k++; t0 = t; }
        if (k < seq.length) requestAnimationFrame(step);
        else { hinting = false; ba.classList.remove('is-flying'); }
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { io.disconnect(); window.setTimeout(function () { if (!touched) hint(); }, 350); }
      }, { threshold: 0.65 });
      io.observe(ba);
    }
  }

  /* ---------- the flight that follows the scroll ---------- */
  var main = document.getElementById('contenuto');
  var trail = document.getElementById('trail');
  var rev = document.getElementById('reveal-path');
  var flyer = document.getElementById('flyer');
  var perch = document.getElementById('perch');
  var canFly = !reduce && main && trail && trail.getTotalLength && flyer && perch;

  if (!canFly) {
    body.classList.add('no-flight');
    var arch = document.querySelector('.arch');
    if (arch) { var s = document.createElement('span'); s.className = 'bfly-static'; s.innerHTML = bfly('s'); arch.appendChild(s); }
  } else {
    flyer.innerHTML = bfly('f');
    var total = 0, L = 0, Lt = 0, rot = 0, dir = 1, mainTop = 0, first = 0, last = 0, anchor = 0;
    var hideFrom = -1, hideTo = -1, lastY = window.scrollY, lastMove = 0, raf = 0;

    var build = function () {
      var mr = main.getBoundingClientRect();
      mainTop = mr.top + window.scrollY;
      var W = main.clientWidth;
      var content = Math.min(1160, W);
      var m = W < 600 ? 15 : Math.max(24, Math.min(60, (W - content) / 4 + 16));
      var pts = [];
      var pr = perch.getBoundingClientRect();
      pts.push({ x: pr.left - mr.left, y: pr.top - mr.top - 8 });
      document.querySelectorAll('[data-way]').forEach(function (el) {
        var r = el.getBoundingClientRect();
        var t = r.top - mr.top, b = r.bottom - mr.top;
        el.getAttribute('data-way').split(' ').forEach(function (tok) {
          if (tok === 'r-top') pts.push({ x: W - m, y: t + 44 });
          else if (tok === 'l-top') pts.push({ x: m, y: t + 44 });
          else if (tok === 'r-bottom') pts.push({ x: W - m, y: b - 44 });
          else if (tok === 'l-bottom') pts.push({ x: m, y: b - 44 });
          else if (tok === 'ba') {
            pts.push({ x: r.left - mr.left + r.width / 2, y: t + r.height * 0.56 });
            hideFrom = t + 4; hideTo = b - 4;
          } else if (tok === 'end') {
            var f = document.querySelector('#finale .btn').getBoundingClientRect();
            pts.push({ x: f.right - mr.left - 16, y: f.top - mr.top + 2 });
          }
        });
      });
      for (var i = 1; i < pts.length; i++) if (pts[i].y <= pts[i - 1].y + 1) pts[i].y = pts[i - 1].y + 1;
      var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
      for (var j = 1; j < pts.length; j++) {
        var a = pts[j - 1], c = pts[j], dy = (c.y - a.y) * 0.5;
        d += 'C' + a.x.toFixed(1) + ' ' + (a.y + dy).toFixed(1) + ' ' + c.x.toFixed(1) + ' ' + (c.y - dy).toFixed(1) + ' ' + c.x.toFixed(1) + ' ' + c.y.toFixed(1);
      }
      trail.setAttribute('d', d);
      rev.setAttribute('d', d);
      total = trail.getTotalLength();
      rev.style.strokeDasharray = total + ' ' + total;
      first = pts[0].y; last = pts[pts.length - 1].y;
      var vh = window.innerHeight;
      anchor = Math.max(vh * 0.2, Math.min(vh * 0.58, mainTop + first));
      Lt = lengthAtY(targetY());
      L = Lt;
      render();
    };

    var targetY = function () { return window.scrollY + anchor - mainTop; };
    var lengthAtY = function (y) {
      if (y <= first) return 0;
      if (y >= last) return total;
      var lo = 0, hi = total;
      for (var k = 0; k < 20; k++) {
        var mid = (lo + hi) / 2;
        if (trail.getPointAtLength(mid).y < y) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    };

    var render = function () {
      var p = trail.getPointAtLength(L);
      var a = trail.getPointAtLength(Math.max(0, L - 4));
      var b = trail.getPointAtLength(Math.min(total, L + 4));
      var ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      var moving = Math.abs(Lt - L) > 1.5 || performance.now() - lastMove < 220;
      var want = 0;
      if (moving && L > 0 && L < total) want = dir > 0 ? ang - 90 + 180 : ang + 90 - 180;
      if (want - rot > 180) want -= 360;
      if (rot - want > 180) want += 360;
      rot += (want - rot) * 0.18;
      flyer.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg)';
      flyer.classList.toggle('is-flying', moving);
      flyer.classList.toggle('is-hidden', p.y > hideFrom && p.y < hideTo);
      rev.style.strokeDashoffset = String(total - L);
      return moving || Math.abs(want - rot) > 0.5;
    };

    var tick = function () {
      raf = 0;
      L += (Lt - L) * 0.12;
      if (Math.abs(Lt - L) < 0.4) L = Lt;
      if (render()) raf = requestAnimationFrame(tick);
    };

    var onScroll = function () {
      var y = window.scrollY;
      if (y !== lastY) dir = y > lastY ? 1 : -1;
      lastY = y;
      lastMove = performance.now();
      Lt = lengthAtY(targetY());
      if (!raf) raf = requestAnimationFrame(tick);
    };

    var timer = 0;
    var rebuild = function () { window.clearTimeout(timer); timer = window.setTimeout(build, 120); };
    build();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', rebuild);
    window.addEventListener('load', rebuild);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(main);
  }

  /* ---------- aperto ora / chiuso (ora di Roma) ---------- */
  var SCHED = { 0: [], 1: [], 2: [[540, 1050]], 3: [[720, 1200]], 4: [[540, 1050]], 5: [[540, 1050]], 6: [[540, 1050]] };
  var DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  var status = document.getElementById('status');
  function romeNow() {
    try {
      var o = {};
      new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
        .formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
      return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function hhmm(m) { return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
  function updateStatus() {
    if (!status) return;
    var now = romeNow(), today = SCHED[now.day] || [], open = null;
    today.forEach(function (r) { if (now.min >= r[0] && now.min < r[1]) open = r; });
    document.querySelectorAll('.hours tr').forEach(function (tr) { tr.classList.toggle('is-today', tr.getAttribute('data-day') === String(now.day)); });
    if (open) { status.dataset.state = 'open'; status.textContent = 'Aperto ora, chiude alle ' + hhmm(open[1]); return; }
    status.dataset.state = 'closed';
    var later = today.filter(function (r) { return r[0] > now.min; })[0];
    if (later) { status.textContent = 'Chiuso ora, apre oggi alle ' + hhmm(later[0]); return; }
    for (var k = 1; k <= 7; k++) {
      var d = (now.day + k) % 7;
      if (SCHED[d].length) { status.textContent = 'Chiuso ora, riapre ' + (k === 1 ? 'domani' : DAYS[d]) + ' alle ' + hhmm(SCHED[d][0][0]); return; }
    }
  }
  updateStatus();
  window.setInterval(updateStatus, 60000);
})();
