/* Deltaplano Toelettatura: orari, il cane che passa dal bagno al fiocco, galleria che scorre di lato */
(function () {
  "use strict";

  var reduceMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var SVGNS = "http://www.w3.org/2000/svg";

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ss(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function backOut(t) { var c = 1.9; t = t - 1; return t <= -1 ? 0 : 1 + (c + 1) * t * t * t + c * t * t; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(c1, c2, t) {
    return "rgb(" + Math.round(lerp(c1[0], c2[0], t)) + "," + Math.round(lerp(c1[1], c2[1], t)) + "," + Math.round(lerp(c1[2], c2[2], t)) + ")";
  }

  /* ------------------------------------------------------------------
     Orari: aperto ora / chiuso, sull'ora italiana.
     Per provarlo: ?ora=10:30&giorno=2 (0 = domenica)
     ------------------------------------------------------------------ */
  var HOURS = {
    0: [],
    1: [[540, 1005]],
    2: [[540, 1005]],
    3: [[540, 1005]],
    4: [[540, 1005]],
    5: [[540, 1005]],
    6: [[540, 780]]
  };
  var DAY_NAMES = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

  function romeNow() {
    var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var now;
    try {
      var parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Rome", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      now = { day: map[o.weekday], min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      now = { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
    // simulazione dall'indirizzo: ?ora=HH:MM&giorno=N
    try {
      var q = new URLSearchParams(window.location.search);
      var ora = q.get("ora"), giorno = q.get("giorno");
      if (ora && /^\d{1,2}:\d{2}$/.test(ora)) {
        var hm = ora.split(":");
        now.min = clamp(parseInt(hm[0], 10), 0, 23) * 60 + clamp(parseInt(hm[1], 10), 0, 59);
      }
      if (giorno !== null && /^[0-6]$/.test(giorno)) now.day = parseInt(giorno, 10);
    } catch (e2) { /* niente parametri */ }
    return now;
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
      text = "Aperto ora, chiudiamo alle " + fmt(open[1]) + ".";
    } else {
      text = "Chiuso ora.";
      for (var d = 0; d < 8; d++) {
        var day = (now.day + d) % 7;
        var slots = HOURS[day];
        var next = null;
        for (var j = 0; j < slots.length; j++) {
          if (d > 0 || slots[j][0] > now.min) { next = slots[j]; break; }
        }
        if (next) {
          var when = d === 0 ? "oggi" : d === 1 ? "domani" : DAY_NAMES[day];
          text = "Chiuso, riapriamo " + when + " alle " + fmt(next[0]) + ".";
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
     Dal bagno al fiocco: il cane disegnato cambia mentre scorri.
     Ogni ciuffo di pelo è un cerchio: arruffato, bagnato, gonfio
     dopo il phon, poi rifinito dalle forbici dall'alto in basso.
     ------------------------------------------------------------------ */
  var story = document.querySelector("[data-story]");
  var svg = document.getElementById("cane");
  var dogLayer = document.getElementById("dog");
  if (story && svg && dogLayer) {
    var INK = "#2F2E2C";
    var COL = {
      main: [hex("#D3C2A6"), hex("#D8E1E8"), hex("#FFFFFF")],
      ears: [hex("#A88560"), hex("#BFA88E"), hex("#E7BF93")]
    };
    var BOW = { rosa: "#E5398D", giallo: "#F7C600" };

    function el(name, attrs, parent) {
      var n = document.createElementNS(SVGNS, name);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }

    // numeri pseudo-casuali sempre uguali, così il cane arruffato è sempre lo stesso
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 * 2 - 1; }

    var puffs = [];
    function group(name, color, data, opts) {
      var g = el("g", { "data-part": name }, dogLayer);
      var out = el("g", { fill: INK }, g);
      var fill = el("g", { fill: "#fff" }, g);
      data.forEach(function (d) {
        var o = el("circle", { cx: 0, cy: 0, r: d[2] + 3.2 }, out);
        var f = el("circle", { cx: 0, cy: 0, r: d[2] }, fill);
        puffs.push({
          x: d[0], y: d[1], o: o, f: f,
          ox: rnd() * 7, oy: rnd() * 7,
          s0: (opts && opts.s0) || (1.18 + Math.abs(rnd()) * 0.14),
          sEnd: (opts && opts.sEnd !== undefined) ? opts.sEnd : 1,
          tc: clamp((d[1] - 60) / 240, 0, 1)
        });
      });
      return { g: g, fill: fill, color: color };
    }

    var groups = [];
    groups.push(group("coda", "main", [[282, 238, 13], [294, 224, 12]]));
    groups.push(group("orecchie", "ears", [[150, 116, 17], [143, 140, 18], [146, 164, 15], [250, 116, 17], [257, 140, 18], [254, 164, 15]]));
    groups.push(group("corpo", "main", [
      [200, 120, 40], [178, 84, 19], [200, 76, 21], [222, 84, 19], [166, 102, 18], [234, 102, 18], [172, 140, 21], [228, 140, 21], [200, 156, 23],
      [200, 214, 44], [170, 198, 25], [230, 198, 25], [162, 234, 26], [238, 234, 26], [200, 250, 33], [152, 264, 26], [248, 264, 26]
    ]));
    // nodi e ciuffi in più: ci sono solo prima del taglio
    groups.push(group("nodi", "main", [[126, 204, 15], [274, 204, 15], [136, 280, 13], [264, 280, 13], [160, 62, 13], [240, 62, 13], [124, 150, 12], [276, 150, 12]], { sEnd: 0 }));

    var spots = el("g", { fill: "#9C8262" }, dogLayer);
    [[172, 222, 9, 6], [226, 246, 7, 5], [196, 92, 6, 4], [240, 206, 6, 4], [160, 262, 7, 5], [212, 150, 5, 3]].forEach(function (s) {
      el("ellipse", { cx: s[0], cy: s[1], rx: s[2], ry: s[3] }, spots);
    });

    groups.push(group("zampe", "main", [[184, 268, 13], [184, 283, 12], [216, 268, 13], [216, 283, 12]]));

    // il muso
    var face = el("g", {}, dogLayer);
    el("circle", { cx: 184, cy: 128, r: 6.5, fill: INK }, face);
    el("circle", { cx: 216, cy: 128, r: 6.5, fill: INK }, face);
    el("circle", { cx: 186.5, cy: 125.5, r: 2, fill: "#fff" }, face);
    el("circle", { cx: 218.5, cy: 125.5, r: 2, fill: "#fff" }, face);
    var tongue = el("g", {}, face);
    el("path", { d: "M193 157 Q193 172 200 172 Q207 172 207 157 Z", fill: "#F08BB0", stroke: INK, "stroke-width": 2, "stroke-linejoin": "round" }, tongue);
    el("path", { d: "M191 142 Q200 137 209 142 Q206 151 200 152 Q194 151 191 142 Z", fill: INK }, face);
    el("path", { d: "M200 152 V157 M200 157 Q195 162 189 158 M200 157 Q205 162 211 158", fill: "none", stroke: INK, "stroke-width": 2.5, "stroke-linecap": "round" }, face);

    // la frangia che copre gli occhi: sparisce con le forbici
    groups.push(group("frangia", "main", [[184, 113, 13], [200, 109, 14], [216, 113, 13], [191, 124, 10], [209, 124, 10]], { sEnd: 0, s0: 1.15 }));

    // il fiocco
    var bow = el("g", { opacity: 0 }, dogLayer);
    var bowFill = el("g", { fill: BOW.rosa, stroke: INK, "stroke-width": 2.5, "stroke-linejoin": "round" }, bow);
    el("path", { d: "M-3 3 L-16 28 L-7 25 L0 9 Z" }, bowFill);
    el("path", { d: "M3 3 L16 28 L7 25 L0 9 Z" }, bowFill);
    el("path", { d: "M0 0 C-8 -16 -34 -20 -36 -4 C-37 10 -14 12 0 0 Z" }, bowFill);
    el("path", { d: "M0 0 C8 -16 34 -20 36 -4 C37 10 14 12 0 0 Z" }, bowFill);
    el("rect", { x: -7, y: -7, width: 14, height: 14, rx: 5 }, bowFill);
    el("path", { d: "M-8 -3 C-15 -9 -24 -11 -29 -6 M8 -3 C15 -9 24 -11 29 -6", fill: "none", stroke: INK, "stroke-width": 1.5, opacity: 0.45 }, bow);

    // le bolle del bagno
    var bubbleLayer = document.getElementById("bolle");
    var bubbles = [[128, 236, 11], [276, 176, 8], [146, 96, 7], [262, 262, 12], [114, 282, 7], [292, 118, 9], [232, 54, 8], [168, 50, 6], [302, 250, 6]].map(function (b, i) {
      var g = el("g", { opacity: 0 }, bubbleLayer);
      el("circle", { cx: 0, cy: 0, r: b[2], fill: "rgba(255,255,255,.75)", stroke: "#7FA9C4", "stroke-width": 2 }, g);
      el("circle", { cx: -b[2] * 0.35, cy: -b[2] * 0.35, r: Math.max(1.5, b[2] * 0.22), fill: "#fff" }, g);
      return { g: g, x: b[0], y: b[1], k: i };
    });

    // i ciuffi tagliati che cadono sul tavolo
    var clipLayer = document.getElementById("ciuffi-tavolo");
    var clips = [];
    for (var ci = 0; ci < 12; ci++) {
      var left = ci % 2 === 0;
      var sy = 76 + ci * 18;
      var sx = left ? 132 - (ci % 3) * 6 : 268 + (ci % 3) * 6;
      var lx = left ? 88 + (ci * 13) % 50 : 266 + (ci * 11) % 50;
      var ly = 292 + (ci % 3) * 4;
      var g2 = el("g", { opacity: 0 }, clipLayer);
      el("path", { d: "M-7 0 q3 -6 7 -1 q4 -6 7 1 q-3 5 -7 2 q-4 4 -7 -2 z", fill: "#fff", stroke: INK, "stroke-width": 1.4, "stroke-linejoin": "round" }, g2);
      clips.push({ g: g2, sx: sx, sy: sy, lx: lx, ly: ly, t: clamp((sy - 60) / 240, 0, 1), rot: (ci % 2 ? 1 : -1) * (60 + ci * 9) });
    }

    var phon = document.getElementById("phon");
    var aria = document.getElementById("aria");
    var scissors = document.getElementById("forbici");
    var bladeA = document.getElementById("lama-a");
    var bladeB = document.getElementById("lama-b");
    var sparkles = document.getElementById("scintille");

    var phases = Array.prototype.slice.call(document.querySelectorAll("#fasi .fase"));
    var steps = Array.prototype.slice.call(story.querySelectorAll(".passi li"));
    var RANGES = [[0, 0.27], [0.27, 0.5], [0.5, 0.78], [0.78, 0.95]];
    var current = -1;

    function render(p) {
      var a = ss(0.03, 0.22, p);           // bagno
      var b = ss(0.30, 0.47, p);           // phon
      var c = clamp((p - 0.53) / 0.22, 0, 1); // forbici
      var d = clamp((p - 0.80) / 0.12, 0, 1); // fiocco

      // colore del pelo: fangoso, bagnato, pulito
      groups.forEach(function (g) {
        var cols = COL[g.color];
        var col = b > 0 ? mix(cols[1], cols[2], b) : mix(cols[0], cols[1], a);
        g.fill.setAttribute("fill", col);
      });
      spots.setAttribute("opacity", (1 - ss(0.05, 0.2, p)).toFixed(3));

      // ogni ciuffo
      for (var i = 0; i < puffs.length; i++) {
        var q = puffs[i];
        var s1 = lerp(q.s0, 0.88, a), ox = lerp(q.ox, q.ox * 0.25, a), oy = lerp(q.oy, q.oy * 0.25, a);
        var s2 = lerp(s1, 1.2, b);
        ox = lerp(ox, 0, b); oy = lerp(oy, 0, b);
        var trim = ss(q.tc - 0.1, q.tc + 0.02, c);
        var s = lerp(s2, q.sEnd, trim);
        var t = "translate(" + (q.x + ox).toFixed(2) + " " + (q.y + oy).toFixed(2) + ") scale(" + Math.max(0.001, s).toFixed(3) + ")";
        q.o.setAttribute("transform", t);
        q.f.setAttribute("transform", t);
      }

      // bolle
      var bv = ss(0.02, 0.07, p) * (1 - ss(0.22, 0.28, p));
      bubbles.forEach(function (bb) {
        var appear = clamp(a * 2.2 - bb.k * 0.09, 0, 1);
        var sc = 0.4 + 0.6 * appear;
        bb.g.setAttribute("opacity", (bv * appear).toFixed(3));
        bb.g.setAttribute("transform", "translate(" + bb.x + " " + (bb.y - 26 * a).toFixed(2) + ") scale(" + sc.toFixed(3) + ")");
      });

      // phon
      var pin = ss(0.26, 0.31, p), pout = ss(0.48, 0.53, p);
      phon.setAttribute("opacity", (pin * (1 - pout)).toFixed(3));
      phon.setAttribute("transform", "translate(" + ((1 - pin) * 60 + pout * 60).toFixed(2) + " 0)");
      aria.setAttribute("stroke-dashoffset", (p * 1400).toFixed(1));

      // forbici: scendono lungo il fianco e si aprono e chiudono mentre scorri
      var fin = ss(0.50, 0.54, p), fout = ss(0.75, 0.79, p);
      scissors.setAttribute("opacity", (fin * (1 - fout)).toFixed(3));
      var fy = 64 + 226 * c;
      scissors.setAttribute("transform", "translate(" + (110 - (1 - fin) * 30).toFixed(2) + " " + fy.toFixed(2) + ")");
      var ang = 16 * (0.5 + 0.5 * Math.cos(c * Math.PI * 16));
      bladeA.setAttribute("transform", "rotate(" + (-ang).toFixed(2) + ")");
      bladeB.setAttribute("transform", "rotate(" + ang.toFixed(2) + ")");

      // ciuffi che cadono
      clips.forEach(function (k) {
        var f = clamp((c - k.t) / 0.16, 0, 1);
        var e = f * f;
        k.g.setAttribute("opacity", f > 0 ? "1" : "0");
        k.g.setAttribute("transform", "translate(" + lerp(k.sx, k.lx, f).toFixed(2) + " " + lerp(k.sy, k.ly, e).toFixed(2) + ") rotate(" + (k.rot * f).toFixed(1) + ")");
      });

      // fiocco, lingua e scintille
      var sb = backOut(d);
      bow.setAttribute("opacity", d > 0 ? "1" : "0");
      bow.setAttribute("transform", "translate(200 186) scale(" + Math.max(0.001, sb).toFixed(3) + ")");
      var tg = ss(0.84, 0.92, p);
      tongue.setAttribute("transform", "translate(200 157) scale(1 " + Math.max(0.001, tg).toFixed(3) + ") translate(-200 -157)");
      tongue.setAttribute("opacity", tg > 0.01 ? "1" : "0");
      sparkles.setAttribute("opacity", ss(0.88, 0.95, p).toFixed(3));

      // testi e barra dei passaggi
      var idx = p < RANGES[1][0] ? 0 : p < RANGES[2][0] ? 1 : p < RANGES[3][0] ? 2 : 3;
      if (idx !== current && story.classList.contains("is-live")) {
        current = idx;
        phases.forEach(function (ph, n) { ph.classList.toggle("is-on", n === idx); });
      }
      steps.forEach(function (st, n) {
        var r = RANGES[n];
        var f = clamp((p - r[0]) / (r[1] - r[0]), 0, 1);
        st.querySelector("i").style.setProperty("--f", f.toFixed(3));
        st.classList.toggle("is-on", n === idx);
      });
    }

    var pinEl = story.querySelector("[data-story-pin]");
    var live = false, ticking = false;

    function progress() {
      var rect = story.getBoundingClientRect();
      var range = Math.max(1, story.offsetHeight - pinEl.offsetHeight);
      return clamp(-rect.top / range, 0, 1);
    }
    function onScroll() {
      if (!live || ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        render(progress());
      });
    }
    function setMode() {
      live = !reduceMQ.matches;
      story.classList.toggle("is-live", live);
      if (live) {
        current = -1;
        render(progress());
      } else {
        phases.forEach(function (ph) { ph.classList.add("is-on"); });
        render(1);
      }
    }

    // scelta del colore del fiocco
    var bowBtns = Array.prototype.slice.call(story.querySelectorAll("[data-fiocco]"));
    bowBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var c = btn.getAttribute("data-fiocco");
        bowFill.setAttribute("fill", BOW[c]);
        bowBtns.forEach(function (o) {
          var on = o === btn;
          o.classList.toggle("is-on", on);
          o.setAttribute("aria-pressed", on ? "true" : "false");
        });
      });
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (reduceMQ.addEventListener) reduceMQ.addEventListener("change", setMode);
    setMode();
  }

  /* ------------------------------------------------------------------
     Galleria: la sezione resta ferma e le foto scorrono di lato
     mentre scendi con la pagina
     ------------------------------------------------------------------ */
  function hscroll(section) {
    var pin = section.querySelector("[data-pin]");
    var track = section.querySelector("[data-htrack]");
    if (!pin || !track) return;
    var dist = 0, range = 1, pinned = false, ticking = false;

    function measure() {
      pinned = !reduceMQ.matches && window.innerHeight >= 460;
      section.classList.toggle("is-pinned", pinned);
      if (!pinned) {
        section.style.height = "";
        track.style.removeProperty("--x");
        return;
      }
      // altezza delle foto: quello che resta dello schermo dopo titolo, didascalia e link
      var head = section.querySelector(".galleria__head");
      var foot = section.querySelector(".galleria__foot");
      var cap = section.querySelector(".medaglia");
      var avail = pin.clientHeight - (head ? head.offsetHeight : 0) - (foot ? foot.offsetHeight : 0) -
        (cap ? cap.offsetHeight + 10 : 40) - 22 - 20 - 36;
      track.style.setProperty("--card-h", Math.round(clamp(avail, 150, 460)) + "px");
      dist = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      section.style.height = (pin.offsetHeight + dist) + "px";
      range = Math.max(1, section.offsetHeight - pin.offsetHeight);
      update();
    }

    function update() {
      if (!pinned) return;
      var top = section.getBoundingClientRect().top;
      var p = clamp(-top / range, 0, 1);
      track.style.setProperty("--x", (-p * dist).toFixed(1) + "px");
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    if (reduceMQ.addEventListener) reduceMQ.addEventListener("change", measure);
    window.addEventListener("load", measure);
    track.addEventListener("load", measure, true);
    measure();
  }
  var hs = document.querySelectorAll("[data-hscroll]");
  for (var k = 0; k < hs.length; k++) hscroll(hs[k]);
})();
