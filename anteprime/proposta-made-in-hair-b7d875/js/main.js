/* Made in Hair: orari, listino a schede, la ciocca che si sfuma, la storia che scorre di lato */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function onMQ(mq, fn) {
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn);
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function syncMotionClass() { root.classList.toggle("motion", !reduceMQ.matches); }
  syncMotionClass();

  /* ------------------------------------------------------------------
     Orari: aperto ora / chiuso, sull'ora italiana.
     Per provare: ?ora=12:40&giorno=3  (0 = domenica)
     ------------------------------------------------------------------ */
  var WEEK = {
    0: [],
    1: [],
    2: [[600, 1020]],
    3: [[750, 1230]],
    4: [[540, 1080]],
    5: [[540, 1080]],
    6: [[510, 1050]]
  };
  // orari delle feste pubblicati sul nostro Instagram (novembre 2026)
  var SPECIAL = {
    "2026-12-21": [[600, 1080]],
    "2026-12-25": [], "2026-12-26": [], "2026-12-27": [], "2026-12-28": [],
    "2026-12-31": [[540, 990]],
    "2027-01-01": [], "2027-01-02": [], "2027-01-03": [], "2027-01-04": [], "2027-01-05": [], "2027-01-06": []
  };
  var DAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  var MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

  function romeNow() {
    var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Rome", year: "numeric", month: "numeric", day: "numeric",
        weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return {
        day: map[o.weekday],
        min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10),
        y: parseInt(o.year, 10), m: parseInt(o.month, 10), d: parseInt(o.day, 10)
      };
    } catch (e) {
      var n = new Date();
      return { day: n.getDay(), min: n.getHours() * 60 + n.getMinutes(), y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
    }
  }

  function getNow() {
    var now = romeNow();
    now.simulated = false;
    var q = new URLSearchParams(window.location.search);
    var ora = q.get("ora"), giorno = q.get("giorno");
    if (ora && /^\d{1,2}:\d{2}$/.test(ora)) {
      var hm = ora.split(":");
      now.min = clamp(parseInt(hm[0], 10), 0, 23) * 60 + clamp(parseInt(hm[1], 10), 0, 59);
      now.simulated = true;
    }
    if (giorno !== null && /^[0-6]$/.test(giorno)) {
      now.day = parseInt(giorno, 10);
      now.simulated = true;
    }
    return now;
  }

  function fmt(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + ":" + (m < 10 ? "0" : "") + m;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // giorno "offset" giorni dopo oggi: orari e nome
  function dayInfo(now, offset) {
    var wd = (now.day + offset) % 7;
    if (now.simulated) return { wd: wd, slots: WEEK[wd], date: null };
    var dt = new Date(Date.UTC(now.y, now.m - 1, now.d + offset));
    var key = dt.getUTCFullYear() + "-" + pad(dt.getUTCMonth() + 1) + "-" + pad(dt.getUTCDate());
    var slots = Object.prototype.hasOwnProperty.call(SPECIAL, key) ? SPECIAL[key] : WEEK[wd];
    return { wd: wd, slots: slots, date: dt };
  }

  function updateStatus() {
    var now = getNow();
    var today = dayInfo(now, 0);
    var open = null, i;
    for (i = 0; i < today.slots.length; i++) {
      if (now.min >= today.slots[i][0] && now.min < today.slots[i][1]) open = today.slots[i];
    }
    var text;
    if (open) {
      text = "Aperto ora, fino alle " + fmt(open[1]) + ".";
    } else {
      text = "Chiuso ora.";
      for (var d = 0; d < 21; d++) {
        var info = dayInfo(now, d), next = null;
        for (i = 0; i < info.slots.length; i++) {
          if (d > 0 || info.slots[i][0] > now.min) { next = info.slots[i]; break; }
        }
        if (next) {
          var when;
          if (d === 0) when = "oggi";
          else if (d === 1) when = "domani";
          else {
            when = DAYS[info.wd];
            if (info.date) when += " " + info.date.getUTCDate() + " " + MONTHS[info.date.getUTCMonth()];
          }
          text = "Chiuso ora. Riapriamo " + when + " alle " + fmt(next[0]) + ".";
          break;
        }
      }
    }
    var status = document.getElementById("status");
    if (status) {
      status.textContent = text;
      status.classList.toggle("is-open", !!open);
      status.classList.toggle("is-closed", !open);
    }
    var rows = document.querySelectorAll(".week tr");
    for (i = 0; i < rows.length; i++) {
      rows[i].classList.toggle("is-today", parseInt(rows[i].getAttribute("data-day"), 10) === now.day);
    }
    // il riquadro delle feste sparisce dopo il 6 gennaio 2027
    var feste = document.getElementById("feste");
    if (feste && !now.simulated) {
      var stamp = now.y * 10000 + now.m * 100 + now.d;
      feste.hidden = stamp > 20270106;
    }
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ------------------------------------------------------------------
     Listino a schede
     ------------------------------------------------------------------ */
  var tabsBox = document.querySelector("[data-tabs]");
  if (tabsBox) {
    var tabs = Array.prototype.slice.call(tabsBox.querySelectorAll('[role="tab"]'));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, idx) {
      t.addEventListener("click", function () { select(t, false); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, n = null;
        if (k === "ArrowRight" || k === "ArrowDown") n = tabs[(idx + 1) % tabs.length];
        else if (k === "ArrowLeft" || k === "ArrowUp") n = tabs[(idx - 1 + tabs.length) % tabs.length];
        else if (k === "Home") n = tabs[0];
        else if (k === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    select(tabs[0], false);
  }

  /* ------------------------------------------------------------------
     La ciocca: da meches "strisce pedonali" a biondo sfumato.
     Ogni capello è una curva con il suo gradiente: lo stato a strisce
     e quello sfumato si mescolano capello per capello, dalle punte
     verso la radice, seguendo lo scorrimento della pagina.
     ------------------------------------------------------------------ */
  (function lock() {
    var canvas = document.getElementById("lock");
    var section = document.getElementById("biondo");
    if (!canvas || !section || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var track = section.querySelector(".ciocca__track");
    var stage = section.querySelector(".ciocca__stage");
    var steps = section.querySelectorAll(".formula li");

    var ROOT = [68, 45, 32], BASE = [118, 82, 56], CARA = [170, 122, 76], HONEY = [218, 182, 128], BLOND = [236, 216, 174], PLAT = [250, 243, 227];
    var STOPS = [0, 0.05, 0.12, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.88, 0.95, 1];

    var W = 0, H = 0, DPR = 1, locks = [], split = false;
    var target = 0, cur = 0, raf = 0, inView = true, built = false;

    function rng(seed) {
      return function () {
        seed = (seed + 0x6D2B79F5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    function sstep(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }

    function build(ox, lw, lh, top, n, seed) {
      var r = rng(seed);
      var lockW = Math.min(lw * 0.84, lh * 0.56);
      var tagW = clamp(lockW * 0.5, 96, 150);
      var neck = (tagW * 0.82) / lockW;
      var cx = ox + lw / 2;
      var strands = [];
      for (var i = 0; i < n; i++) {
        var u = (i + r()) / n, s = u - 0.5;
        var len = 0.83 + 0.15 * (1 - Math.pow(Math.abs(s) * 2, 1.7)) + (r() - 0.5) * 0.06;
        var y0 = top, y1 = top + lh * Math.min(1, len);
        var ph = (r() - 0.5) * 0.7, jit = (r() - 0.5) * 2.4;
        var pts = [];
        for (var k = 0; k <= 18; k++) {
          var t = k / 18, y = y0 + (y1 - y0) * t;
          var spread = neck + (1 - neck) * sstep(0, 0.32, t);
          var taper = 1 - 0.16 * sstep(0.62, 1, t);
          var wave = lockW * 0.075 * sstep(0.1, 0.45, t) * Math.sin(t * 5.4 + 0.5 + ph);
          pts.push([cx + s * lockW * spread * taper + wave + jit * sstep(0.2, 1, t), y]);
        }
        var path = new Path2D();
        path.moveTo(pts[0][0], pts[0][1]);
        for (k = 1; k < pts.length - 1; k++) {
          path.quadraticCurveTo(pts[k][0], pts[k][1], (pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2);
        }
        path.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);

        var band = Math.floor(u * 7);
        var q = r();
        var air = q < 0.15 ? 0.25 + r() * 0.2 : q > 0.8 ? 0.95 + r() * 0.05 : 0.5 + r() * 0.42;
        strands.push({
          path: path, x0: pts[0][0], y0: y0, x1: pts[18][0], y1: y1,
          light: band % 2 === 1, air: air, d: r(), tone: r(),
          w: 0.55 + r() * 0.95, a: 0.62 + r() * 0.38, s: s, order: r()
        });
      }
      strands.sort(function (a, b) { return a.order - b.order; });
      return { strands: strands, cx: cx, top: top, tagW: tagW };
    }

    function stripeCol(st, t) {
      if (st.light && t > 0.03) return mix(BLOND, PLAT, 0.5 + 0.5 * st.tone);
      return mix(ROOT, BASE, Math.min(1, t * 1.15));
    }
    function airCol(st, t) {
      var nat = mix(ROOT, BASE, Math.min(1, t * 1.15));
      var tip = mix(HONEY, PLAT, st.air);
      var tgt = mix(CARA, tip, sstep(0.32, 0.92, t));
      return mix(nat, tgt, sstep(0.12, 0.58, t) * (0.55 + 0.45 * st.air));
    }
    function shade(st, t) {
      var g = Math.exp(-Math.pow((t - 0.34 - st.s * 0.05) / 0.06, 2)) * 0.17 +
              Math.exp(-Math.pow((t - 0.69 + st.s * 0.04) / 0.05, 2)) * 0.1;
      var edge = 0.8 + 0.2 * (1 - Math.pow(Math.abs(st.s) * 2, 3));
      return (1 + g) * edge;
    }
    function rgba(c, k, a) {
      return "rgba(" + Math.min(255, Math.round(c[0] * k)) + "," + Math.min(255, Math.round(c[1] * k)) + "," + Math.min(255, Math.round(c[2] * k)) + "," + a + ")";
    }

    function drawLock(c2, L, p) {
      var list = L.strands;
      c2.lineCap = "round";
      c2.lineJoin = "round";
      for (var i = 0; i < list.length; i++) {
        var st = list[i];
        var g = c2.createLinearGradient(st.x0, st.y0, st.x1, st.y1);
        for (var k = 0; k < STOPS.length; k++) {
          var t = STOPS[k];
          var e = p <= 0 ? 0 : p >= 1 ? 1 : sstep(0, 1, (p - 0.25 * st.d - 0.2 * (1 - t)) / 0.55);
          var c = e === 0 ? stripeCol(st, t) : e === 1 ? airCol(st, t) : mix(stripeCol(st, t), airCol(st, t), e);
          var alpha = t > 0.95 ? 0 : t > 0.86 ? 0.75 : 1;
          g.addColorStop(t, rgba(c, shade(st, t), alpha));
        }
        c2.strokeStyle = g;
        c2.globalAlpha = 0.5;
        c2.lineWidth = 2.6;
        c2.stroke(st.path);
        c2.globalAlpha = st.a;
        c2.lineWidth = st.w;
        c2.stroke(st.path);
      }
      c2.globalAlpha = 1;
    }

    /* Disegnare 200 capelli a ogni fotogramma è troppo pesante per un telefono:
       prepariamo sei fotogrammi chiave una volta sola e mentre scorri
       ne mescoliamo due vicini (due drawImage per fotogramma). */
    var KEYS = [0, 0.2, 0.4, 0.6, 0.8, 1];
    var keys = [], keyToken = 0;
    var later = window.requestIdleCallback
      ? function (fn) { window.requestIdleCallback(fn, { timeout: 250 }); }
      : function (fn) { window.setTimeout(fn, 30); };

    function makeKey(p) {
      var c = document.createElement("canvas");
      c.width = canvas.width;
      c.height = canvas.height;
      var k = c.getContext("2d");
      k.setTransform(DPR, 0, 0, DPR, 0, 0);
      drawLock(k, locks[0], p);
      return c;
    }

    function buildKeys() {
      var token = ++keyToken, i = 0;
      keys = [];
      function next() {
        if (token !== keyToken) return;
        keys[i] = makeKey(KEYS[i]);
        i++;
        render();
        if (i < KEYS.length) later(next);
      }
      later(next);
    }

    function nearestKey(idx) {
      for (var d = 0; d < KEYS.length; d++) {
        if (keys[idx - d]) return keys[idx - d];
        if (keys[idx + d]) return keys[idx + d];
      }
      return null;
    }

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // l'etichetta cucita in cima alla ciocca: "Made in Hair"
    function drawTag(L) {
      var w = L.tagW, h = 30, x = L.cx - w / 2, y = L.top - h / 2;
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      roundRect(x + 1, y + 3, w, h, 3); ctx.fill();
      ctx.fillStyle = "#F0E0BD";
      roundRect(x, y, w, h, 3); ctx.fill();
      ctx.save();
      ctx.setLineDash([3, 2.5]);
      ctx.strokeStyle = "rgba(42,27,20,0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
      ctx.restore();
      var fs = 16, serif = '"EB Garamond", Garamond, Georgia, serif';
      var fUp = "500 " + fs + "px " + serif, fIt = "italic 500 " + fs + "px " + serif;
      ctx.font = fUp; var a = ctx.measureText("Made ").width, c = ctx.measureText(" Hair").width;
      ctx.font = fIt; var b = ctx.measureText("in").width;
      var total = a + b + c, scale = Math.min(1, (w - 22) / total);
      if (scale < 1) {
        fs = Math.floor(fs * scale);
        fUp = "500 " + fs + "px " + serif; fIt = "italic 500 " + fs + "px " + serif;
        ctx.font = fUp; a = ctx.measureText("Made ").width; c = ctx.measureText(" Hair").width;
        ctx.font = fIt; b = ctx.measureText("in").width; total = a + b + c;
      }
      var tx = L.cx - total / 2, ty = y + h / 2 + 1;
      ctx.fillStyle = "#2A1B14";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.font = fUp; ctx.fillText("Made ", tx, ty);
      ctx.font = fIt; ctx.fillText("in", tx + a, ty);
      ctx.font = fUp; ctx.fillText(" Hair", tx + a + b, ty);
    }

    function setup(force) {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      if (!force && built && Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1) return true;
      W = r.width; H = r.height;
      DPR = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      var top = 20, lh = H - top - 6;
      if (split) {
        var n2 = W < 420 ? 110 : 150;
        locks = [build(0, W / 2, lh, top, n2, 11), build(W / 2, W / 2, lh, top, n2, 11)];
      } else {
        locks = [build(0, W, lh, top, W < 400 ? 170 : 220, 11)];
      }
      built = true;
      if (split) { keyToken++; keys = []; }
      else buildKeys();
      return true;
    }

    function render() {
      if (!built) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (split) {
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        drawLock(ctx, locks[0], 0); drawTag(locks[0]);
        drawLock(ctx, locks[1], 1); drawTag(locks[1]);
        return;
      }
      var pos = clamp((cur - 0.2) / 0.58, 0, 1) * (KEYS.length - 1);
      var i = Math.min(KEYS.length - 2, Math.floor(pos)), f = pos - i;
      var a = keys[i], b = keys[i + 1];
      if (a && b && f > 0.002) {
        // somma esatta dei due fotogrammi: hanno la stessa forma, cambia solo il colore
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1 - f;
        ctx.drawImage(a, 0, 0);
        ctx.globalAlpha = f;
        ctx.drawImage(b, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      } else {
        var only = f > 0.5 ? nearestKey(i + 1) : nearestKey(i);
        if (only) ctx.drawImage(only, 0, 0);
      }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      drawTag(locks[0]);
    }

    function scrollProgress() {
      var range = track.offsetHeight - stage.offsetHeight;
      if (range <= 0) return 0;
      return clamp(-track.getBoundingClientRect().top / range, 0, 1);
    }

    function setSteps(v) {
      var on = split ? -1 : v < 0.36 ? 0 : v < 0.68 ? 1 : 2;
      for (var i = 0; i < steps.length; i++) steps[i].classList.toggle("is-on", split || i === on);
    }

    function tick() {
      raf = 0;
      var d = target - cur;
      cur = Math.abs(d) < 0.0006 ? target : cur + d * 0.2;
      section.style.setProperty("--p", cur.toFixed(4));
      render();
      if (cur !== target) raf = requestAnimationFrame(tick);
    }

    function onScroll() {
      if (split || !built) return;
      var v = scrollProgress();
      setSteps(v);
      if (v === target) return;
      target = v;
      if (inView && !raf) raf = requestAnimationFrame(tick);
    }

    var hint = section.querySelector("[data-hint]");

    function applyMode() {
      split = reduceMQ.matches;
      section.classList.toggle("is-split", split);
      if (hint) hint.textContent = split ? "Qui sotto, le due ciocche a confronto." : "Scorri e guarda come cambia la ciocca.";
      if (!setup(true)) return;
      if (split) {
        section.style.setProperty("--p", "1");
        setSteps(0);
      } else {
        target = cur = scrollProgress();
        section.style.setProperty("--p", cur.toFixed(4));
        setSteps(cur);
      }
      render();
    }

    function onResize() {
      var wasBuilt = built;
      if (!setup(false)) return;
      if (!split) { target = cur = scrollProgress(); setSteps(cur); }
      if (wasBuilt) render();
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) onScroll();
      }, { rootMargin: "200px 0px" }).observe(track);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onMQ(reduceMQ, function () { syncMotionClass(); applyMode(); });

    applyMode();
    if (document.fonts && document.fonts.load) {
      document.fonts.load('italic 500 16px "EB Garamond"').then(function () {
        return document.fonts.load('500 16px "EB Garamond"');
      }).then(render, render);
    }
  })();

  /* ------------------------------------------------------------------
     La storia del salone: la sezione resta ferma e le foto scorrono
     di lato mentre scendi con la pagina.
     ------------------------------------------------------------------ */
  function hscroll(section) {
    var pin = section.querySelector("[data-pin]");
    var strip = section.querySelector("[data-htrack]");
    if (!pin || !strip) return;
    var dist = 0, range = 1, pinned = false, ticking = false;

    function measure() {
      pinned = !reduceMQ.matches && window.innerHeight >= 600;
      section.classList.toggle("is-pinned", pinned);
      if (!pinned) {
        section.style.height = "";
        strip.style.removeProperty("--x");
        return;
      }
      var view = strip.parentNode;
      dist = Math.max(0, strip.scrollWidth - view.clientWidth);
      section.style.height = (pin.offsetHeight + dist) + "px";
      range = Math.max(1, section.offsetHeight - pin.offsetHeight);
      update();
    }

    function update() {
      ticking = false;
      if (!pinned) return;
      var p = clamp(-section.getBoundingClientRect().top / range, 0, 1);
      strip.style.setProperty("--x", (-p * dist).toFixed(1) + "px");
    }

    window.addEventListener("scroll", function () {
      if (!pinned || ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    var lastW = window.innerWidth, lastH = window.innerHeight;
    window.addEventListener("resize", function () {
      // la barra degli indirizzi del telefono cambia solo l'altezza di poco: non serve rimisurare
      if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 120 && pinned) { update(); return; }
      lastW = window.innerWidth; lastH = window.innerHeight;
      measure();
    });
    onMQ(reduceMQ, measure);
    window.addEventListener("load", measure);
    strip.addEventListener("load", measure, true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }
  var hs = document.querySelectorAll("[data-hscroll]");
  for (var h = 0; h < hs.length; h++) hscroll(hs[h]);
})();
