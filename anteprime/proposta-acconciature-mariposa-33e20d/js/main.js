/* Acconciature Mariposa: la farfalla che si posa sui titoli, prima e dopo, galleria, orari */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;
  var root = document.documentElement;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

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
  var imgP = document.getElementById('ba-prima');
  var imgD = document.getElementById('ba-dopo');
  var caption = document.getElementById('ba-caption');
  var link = document.getElementById('ba-link');
  var touched = false;

  if (ba && range) {
    var dragging = false;
    var setPos = function (p) {
      var pos = clamp(p, 0, 100);
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
    var hint = function () {};
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
    hint = function () {
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

  /* ---------- galleria: pinned, the photos slide sideways with the page scroll ---------- */
  var gal = document.getElementById('lavori');
  var strip = document.getElementById('strip');
  var bar = document.getElementById('strip-bar');
  var galUpdate = function () {};
  var galMeasure = function () {};
  if (gal && strip && !reduce) {
    var pin = gal.querySelector('.galleria__pin');
    var view = gal.querySelector('.galleria__view');
    var dist = 0, top0 = 0;
    gal.classList.add('is-pinned');
    galUpdate = function () {
      var p = dist ? clamp((window.scrollY - top0) / dist, 0, 1) : 0;
      strip.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    };
    galMeasure = function () {
      dist = Math.max(0, strip.offsetWidth - view.clientWidth);
      gal.style.height = (pin.offsetHeight + dist) + 'px';
      top0 = gal.getBoundingClientRect().top + window.scrollY;
      galUpdate();
    };
    galMeasure();
  }

  /* ---------- the butterfly: it rests beside a heading, and flies to the next one ---------- */
  var bf = document.getElementById('bfly');
  var perches = Array.prototype.slice.call(document.querySelectorAll('[data-perch]'));
  var bfCheck = function () {};
  if (bf && perches.length && !reduce && window.requestAnimationFrame) {
    var tiltEl = bf.querySelector('.bfly__tilt');
    var cur = 0, flight = null, pos = null, tilt = 0, raf = 0;

    var seat = function (i) {
      var p = perches[i], r = p.getBoundingClientRect(), cs = getComputedStyle(p);
      return { x: r.left + r.width / 2, y: r.top + r.height / 2,
        s: parseFloat(cs.getPropertyValue('--s')) || 1,
        rest: parseFloat(cs.getPropertyValue('--rest')) || -12 };
    };
    var pick = function () {
      var vh = window.innerHeight, i = cur;
      while (i + 1 < perches.length && perches[i + 1].getBoundingClientRect().top < vh * 0.72) i++;
      while (i > 0 && perches[i].getBoundingClientRect().top > vh * 0.86) i--;
      return i;
    };
    var land = function () {
      flight = null; pos = null;
      perches[cur].appendChild(bf);
      bf.style.transform = '';
      tiltEl.style.removeProperty('--tilt');
      bf.classList.remove('is-flying');
    };
    var frame = function (now) {
      raf = 0;
      if (!flight) return;
      var f = flight, W = root.clientWidth;
      var t = clamp((now - f.t0) / f.dur, 0, 1);
      var e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      var d = seat(cur);
      var dx = d.x - f.from.x, dy = d.y - f.from.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
      /* a soft arc towards the right side of the page, plus a little flutter */
      var A = Math.min(80, L * 0.3) * Math.sin(Math.PI * e) * f.sign;
      var bob = Math.sin(t * Math.PI * 6) * 5 * (1 - t);
      var x = f.from.x + dx * e + (-dy / L) * A;
      var y = f.from.y + dy * e + (dx / L) * A + bob;
      var half = (bf.offsetWidth || 46) * 0.75;
      x = clamp(x, half, W - half);
      var s = f.from.s + (d.s - f.from.s) * e;
      var vx = pos ? x - pos.x : 0;
      tilt += (clamp(vx * 2.4, -26, 26) - tilt) * 0.2;
      var tl = t > .75 ? tilt + (d.rest - tilt) * ((t - .75) / .25) : tilt;
      pos = { x: x, y: y, s: s, tilt: tl };
      var w = bf.offsetWidth, h = bf.offsetHeight;
      bf.style.transform = 'translate3d(' + (x - w / 2).toFixed(1) + 'px,' + (y - h / 2).toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ')';
      tiltEl.style.setProperty('--tilt', tl.toFixed(1) + 'deg');
      if (t >= 1) land(); else raf = requestAnimationFrame(frame);
    };
    var fly = function (to) {
      var vh = window.innerHeight, W = root.clientWidth;
      var from;
      if (flight && pos) from = { x: pos.x, y: pos.y, s: pos.s };
      else { var s0 = seat(cur); from = { x: s0.x, y: s0.y, s: s0.s }; tilt = s0.rest; }
      /* if the old perch is far off screen, start just outside the edge */
      from.y = clamp(from.y, -70, vh + 70);
      from.x = clamp(from.x, 40, W - 40);
      cur = to;
      if (bf.parentNode !== body) body.appendChild(bf);
      bf.classList.add('is-flying');
      var d = seat(to);
      var dx = d.x - from.x, dy = d.y - from.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
      /* bow the arc towards the roomier side */
      var wantRight = (from.x + d.x) / 2 < W * 0.62;
      var sign = (-dy / L >= 0) === wantRight ? 1 : -1;
      flight = { from: from, t0: performance.now(), dur: clamp(650 + L * 0.9, 900, 1600), sign: sign };
      if (!raf) raf = requestAnimationFrame(frame);
    };
    bfCheck = function () {
      var i = pick();
      if (i !== cur) fly(i);
    };
    bfCheck();
  }

  /* ---------- one scroll listener drives both ---------- */
  var ticking = 0;
  var onScroll = function () {
    if (ticking) return;
    ticking = requestAnimationFrame(function () { ticking = 0; galUpdate(); bfCheck(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  var rt = 0;
  var remeasure = function () { window.clearTimeout(rt); rt = window.setTimeout(function () { galMeasure(); bfCheck(); }, 100); };
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window && strip) new ResizeObserver(remeasure).observe(strip);

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
