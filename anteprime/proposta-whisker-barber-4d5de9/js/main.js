/* Whisker Barber: orari, galleria che scorre di lato, palo da barbiere che gira */
(function () {
  "use strict";

  var reduceMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  /* ------------------------------------------------------------------
     Orari: aperto ora / chiuso, calcolato sull'ora italiana
     ------------------------------------------------------------------ */
  var HOURS = {
    0: [],
    1: [],
    2: [[540, 1140]],
    3: [[540, 1140]],
    4: [[540, 1140]],
    5: [[540, 1140]],
    6: [[540, 1080]]
  };
  var DAY_NAMES = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

  function romeNow() {
    var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Rome", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return { day: map[o.weekday], min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function fmt(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + ":" + (m < 10 ? "0" : "") + m;
  }

  function updateStatus() {
    var now = romeNow();
    var today = HOURS[now.day];
    var open = null;
    for (var i = 0; i < today.length; i++) {
      if (now.min >= today[i][0] && now.min < today[i][1]) open = today[i];
    }
    var text, isOpen = !!open;
    if (open) {
      text = "Aperti ora: chiudiamo alle " + fmt(open[1]) + ".";
    } else {
      text = "Chiusi ora.";
      for (var d = 0; d < 8; d++) {
        var day = (now.day + d) % 7;
        var slots = HOURS[day];
        var next = null;
        for (var j = 0; j < slots.length; j++) {
          if (d > 0 || slots[j][0] > now.min) { next = slots[j]; break; }
        }
        if (next) {
          var when = d === 0 ? "oggi" : d === 1 ? "domani" : DAY_NAMES[day];
          text = "Chiusi ora. Riapriamo " + when + " alle " + fmt(next[0]) + ".";
          break;
        }
      }
    }

    var status = document.getElementById("status");
    if (status) {
      status.textContent = text;
      status.classList.toggle("is-open", isOpen);
      status.classList.toggle("is-closed", !isOpen);
    }
    var dock = document.getElementById("dock-status");
    if (dock) {
      dock.classList.toggle("is-open", isOpen);
      dock.classList.toggle("is-closed", !isOpen);
      var label = dock.querySelector(".dock__label");
      if (label) label.textContent = isOpen ? "Aperto" : "Chiuso";
      dock.setAttribute("aria-label", text + " Vedi gli orari");
    }
    var rows = document.querySelectorAll(".week tr");
    for (var r = 0; r < rows.length; r++) {
      rows[r].classList.toggle("is-today", parseInt(rows[r].getAttribute("data-day"), 10) === now.day);
    }
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ------------------------------------------------------------------
     Galleria: la sezione resta ferma e le foto scorrono di lato
     mentre scendi con la pagina (guidato dall'evento scroll)
     ------------------------------------------------------------------ */
  function hscroll(section) {
    var pin = section.querySelector("[data-pin]");
    var track = section.querySelector("[data-htrack]");
    if (!pin || !track) return;
    var dist = 0, range = 1, pinned = false;

    function measure() {
      pinned = !reduceMQ.matches && window.innerHeight >= 480;
      section.classList.toggle("is-pinned", pinned);
      if (!pinned) {
        section.style.height = "";
        track.style.removeProperty("--x");
        return;
      }
      dist = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      section.style.height = (pin.offsetHeight + dist) + "px";
      range = Math.max(1, section.offsetHeight - pin.offsetHeight);
      update();
    }

    function update() {
      if (!pinned) return;
      var top = section.getBoundingClientRect().top;
      var p = Math.min(1, Math.max(0, -top / range));
      track.style.setProperty("--x", (-p * dist).toFixed(1) + "px");
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    if (reduceMQ.addEventListener) reduceMQ.addEventListener("change", measure);
    window.addEventListener("load", measure);
    track.addEventListener("load", measure, true);
    measure();
  }
  var hs = document.querySelectorAll("[data-hscroll]");
  for (var k = 0; k < hs.length; k++) hscroll(hs[k]);

  /* ------------------------------------------------------------------
     Gli attrezzi del listino ruotano appena mentre scorri
     ------------------------------------------------------------------ */
  var tools = Array.prototype.slice.call(document.querySelectorAll("[data-drift]"));
  function drift() {
    if (reduceMQ.matches) {
      tools.forEach(function (el) { el.style.removeProperty("--dr"); });
      return;
    }
    var vh = window.innerHeight;
    tools.forEach(function (el) {
      var box = el.parentNode.getBoundingClientRect(); // il contenitore non ruota: niente effetto a catena
      if (box.bottom < -100 || box.top > vh + 100) return;
      var c = (box.top + box.height / 2 - vh / 2) / vh;
      var k = parseFloat(el.getAttribute("data-drift")) || 1;
      el.style.setProperty("--dr", (c * 14 * k).toFixed(2) + "deg");
    });
  }
  if (tools.length) {
    window.addEventListener("scroll", drift, { passive: true });
    window.addEventListener("resize", drift);
    if (reduceMQ.addEventListener) reduceMQ.addEventListener("change", drift);
    drift();
  }

  /* ------------------------------------------------------------------
     Il palo da barbiere: spirale rossa, bianca e blu su un cilindro.
     Ogni colonna di pixel è un punto del cilindro visto di fronte,
     così le righe si piegano ai bordi come su un palo vero.
     ------------------------------------------------------------------ */
  var canvas = document.querySelector(".pole__canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var COLORS = [[226, 18, 30], [255, 255, 255], [22, 70, 214], [255, 255, 255]];
  var W = 0, H = 0, img = null, cols = null, P = 1, slopeK = 1;

  function setup() {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(8, Math.round(r.width * dpr));
    H = Math.max(8, Math.round(r.height * dpr));
    canvas.width = W;
    canvas.height = H;
    img = ctx.createImageData(W, H);
    // periodo verticale delle 4 bande e quanto sale la spirale girando
    P = W * 1.55;
    var R = W / 2;
    var A = R * 1.05; // inclinazione al centro: poco più di 45 gradi
    cols = [];
    for (var x = 0; x < W; x++) {
      var s = Math.max(-0.999, Math.min(0.999, (x + 0.5 - R) / R));
      var th = Math.asin(s);
      var c = Math.cos(th);
      // luce da sinistra, un po' davanti
      var diff = 0.62 + 0.38 * Math.max(0, Math.cos(th + 0.45));
      var spec = Math.exp(-Math.pow((th + 0.62) / 0.16, 2)) * 0.55 + Math.exp(-Math.pow((th - 0.85) / 0.1, 2)) * 0.18;
      var edge = Math.pow(c, 0.35);
      // pendenza delle righe in questa colonna (per l'antialias)
      var dOff = A / (R * Math.max(c, 0.05));
      cols.push({ off: A * th, shade: diff * (0.55 + 0.45 * edge), spec: spec, grad: Math.sqrt(1 + dOff * dOff) / P * 4 });
    }
    slopeK = A;
    return true;
  }

  function draw(t) {
    if (!img) return;
    var d = img.data;
    for (var x = 0; x < W; x++) {
      var col = cols[x];
      var sh = col.shade, sp = col.spec * 255, g = col.grad;
      for (var y = 0; y < H; y++) {
        var u = (y + col.off + t) / P;
        u = (u - Math.floor(u)) * 4;           // 0..4: quale banda
        var i = Math.floor(u);
        var f = u - i;                          // posizione dentro la banda
        var c0 = COLORS[i], c1, w = 0;
        // antialias sul bordo tra due bande
        var distNext = (1 - f) / g, distPrev = f / g;
        if (distNext < 0.5) { c1 = COLORS[(i + 1) & 3]; w = 0.5 - distNext; }
        else if (distPrev < 0.5) { c1 = COLORS[(i + 3) & 3]; w = 0.5 - distPrev; }
        var r0 = c0[0], g0 = c0[1], b0 = c0[2];
        if (w > 0) {
          r0 += (c1[0] - r0) * w; g0 += (c1[1] - g0) * w; b0 += (c1[2] - b0) * w;
        }
        var o = (y * W + x) * 4;
        d[o] = Math.min(255, r0 * sh + sp);
        d[o + 1] = Math.min(255, g0 * sh + sp);
        d[o + 2] = Math.min(255, b0 * sh + sp);
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  var running = false, visible = false, last = 0, phase = 0, rafId = 0;
  var SPEED = 0.55; // periodi al secondo: gira con calma, come quello vero

  function frame(now) {
    rafId = 0;
    if (!running) return;
    if (last) phase += (now - last) / 1000 * SPEED * P;
    last = now;
    phase %= P;
    draw(phase);
    rafId = requestAnimationFrame(frame);
  }

  function sync() {
    var should = visible && !reduceMQ.matches;
    if (should && !running) {
      running = true;
      last = 0;
      if (!rafId) rafId = requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
    }
    if (!running) draw(phase);
  }

  function init() {
    if (!setup()) return;
    draw(phase);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        sync();
      }, { rootMargin: "100px" }).observe(canvas);
    } else {
      visible = true;
      sync();
    }
  }

  window.addEventListener("resize", function () { if (setup()) draw(phase); });
  if (reduceMQ.addEventListener) reduceMQ.addEventListener("change", sync);
  init();
})();
