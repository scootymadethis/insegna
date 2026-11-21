/* Whisker Barber: sfumatura interattiva + orari con il palo che gira */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    var pole = document.getElementById("pole");
    if (pole) {
      pole.classList.toggle("is-open", isOpen);
      pole.classList.toggle("is-closed", !isOpen);
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
     La sfumatura: testa di profilo a tratteggio, come un'incisione
     ------------------------------------------------------------------ */
  var canvas = document.querySelector(".fade__canvas");
  var range = document.getElementById("fade-range");
  if (!canvas || !range || !canvas.getContext || typeof Path2D === "undefined") return;

  var ctx = canvas.getContext("2d");
  var W = 400, H = 460;

  var HEAD = new Path2D("M150 460 C150 420 146 394 140 374 C116 356 94 320 88 272 C80 212 92 150 128 112 C162 76 214 62 258 74 C302 88 328 124 332 166 C334 184 332 196 336 208 C344 224 354 242 361 260 C365 270 359 277 348 279 C344 285 350 292 347 298 C352 304 347 310 344 314 C350 321 346 331 340 335 C341 350 335 362 321 368 C301 375 279 373 262 371 C257 393 255 421 257 460 Z");
  var HAIR = new Path2D("M320 134 C316 96 272 56 214 52 C158 50 110 78 88 128 C70 176 72 242 88 292 C99 328 120 354 142 370 L152 374 C158 352 168 322 186 302 C185 282 185 252 190 222 C197 199 222 190 234 205 L238 272 L252 272 C254 236 259 196 271 172 C287 152 305 140 320 134 Z");
  var EAR = new Path2D("M222 206 C214 195 196 196 192 214 C188 232 193 252 198 265 C203 279 215 283 219 271 C223 259 216 247 222 233 C226 222 228 212 222 206 Z");
  var EAR_IN = new Path2D("M214 214 C204 212 200 226 204 240 C206 248 212 251 215 245");
  var BROW = new Path2D("M302 184 C312 179 323 180 331 185");
  var EYE = new Path2D("M310 199 C316 195 322 196 326 200");
  var NOSTRIL = new Path2D("M339 270 C343 267 347 268 348 271");
  var MOUTH = new Path2D("M333 309 C337 310 341 309 344 308");
  var JAW = new Path2D("M232 296 C246 326 276 350 312 362");

  var CREMA = "241,232,214";
  var ROSSO = "#c4413a";

  // Campionamento dei capelli dentro la sagoma (sempre gli stessi, generatore deterministico)
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  var probe = document.createElement("canvas");
  probe.width = W; probe.height = H;
  var pctx = probe.getContext("2d");
  // i capelli cadono dalla corona: in avanti sul davanti, giù sui lati, indietro sulla nuca
  var CROWN = { x: 150, y: 104 };
  var strands = [];
  var stubble = [];
  var tries = 0;
  var GAP = 5.2;
  for (var gy = 40; gy < 384; gy += GAP) {
    for (var gx = 64; gx < 336; gx += GAP) {
      var x = gx + (rnd() - 0.5) * GAP * 0.9, y = gy + (rnd() - 0.5) * GAP * 0.9;
      if (!pctx.isPointInPath(HAIR, x, y)) continue;
      var dx = x - CROWN.x, dy = y - CROWN.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var pull = Math.min(1, len / 70) * 0.62;
      var fx = dx / len * pull + 0.22, fy = dy / len * pull + 0.5;
      var ang = Math.atan2(fy, fx) + (rnd() - 0.5) * 0.16;
      var topness = Math.max(0, Math.min(1, (190 - y) / 90));
      strands.push({
        x: x, y: y,
        ux: Math.cos(ang), uy: Math.sin(ang),
        curl: 0.25 + (rnd() - 0.5) * 0.3,
        r: rnd(),
        w: 0.9 + rnd() * 0.5,
        a: 0.62 + rnd() * 0.35,
        top: 9 + 8 * topness + rnd() * 2.5
      });
    }
  }
  while (stubble.length < 900 && tries < 30000) {
    tries++;
    var sx = 70 + rnd() * 260, sy = 150 + rnd() * 230;
    if (pctx.isPointInPath(HAIR, sx, sy)) stubble.push({ x: sx, y: sy, r: 0.5 + rnd() * 0.6 });
  }

  var STYLES = [
    { max: 22, name: "Taper", skin: "Skin taper",
      desc: "Si accorcia solo ai bordi, su basette e nuca. Il resto resta pieno: pulito ma discreto." },
    { max: 46, name: "Low fade", skin: "Low skin fade",
      desc: "La sfumatura parte bassa e gira appena sopra l'orecchio. Si nota poco e sta bene con tutto." },
    { max: 72, name: "Mid fade", skin: "Mid skin fade",
      desc: "Sale fino a metà della testa. Il contrasto con il sopra si vede bene." },
    { max: 101, name: "High fade", skin: "High skin fade",
      desc: "Parte alta, vicino alle tempie. Netta e decisa: va rinfrescata più spesso." }
  ];

  var nameEl = document.getElementById("fade-name");
  var descEl = document.getElementById("fade-desc");
  var ctaName = document.getElementById("fade-cta-name");
  var ctaEl = document.getElementById("fade-cta");
  var baseInputs = document.querySelectorAll('input[name="base"]');

  var state = { v: parseFloat(range.value), skin: true };
  var lastStyle = "";

  function styleFor(v) {
    for (var i = 0; i < STYLES.length; i++) if (v < STYLES[i].max) return STYLES[i];
    return STYLES[STYLES.length - 1];
  }

  function updateText() {
    var s = styleFor(state.v);
    var label = state.skin ? s.skin : s.name;
    if (label !== lastStyle) {
      lastStyle = label;
      nameEl.textContent = label;
      descEl.textContent = s.desc + (state.skin ? " In basso si arriva a pelle." : " In basso resta un velo di capelli.");
      ctaName.textContent = label;
      ctaEl.setAttribute("aria-label", "Chiama il 347 595 8858 per prenotare un " + label);
      range.setAttribute("aria-valuetext", label);
    }
  }

  function setupCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var rect = canvas.getBoundingClientRect();
    var cssW = rect.width || 400;
    var px = Math.round(cssW * dpr);
    if (canvas.width !== px) {
      canvas.width = px;
      canvas.height = Math.round(px * H / W);
    }
  }

  function draw() {
    var s = canvas.width / W;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    var v = state.v;
    var yTop = 322 - v * 1.62;          // dove finisce la sfumatura
    var band = 42 + v * 0.38;           // quanto è lunga la transizione
    var yBot = yTop + band;

    // sagoma
    ctx.fillStyle = "#24503f";
    ctx.fill(HEAD);

    // zona rasata: un velo di puntini, oppure pelle
    if (!state.skin) {
      ctx.fillStyle = "rgba(" + CREMA + ",0.42)";
      for (var k = 0; k < stubble.length; k++) {
        var d = stubble[k];
        if (d.y > yBot - 6) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, 6.283);
          ctx.fill();
        }
      }
    }

    // capelli a tratteggio, tenuti dentro la sagoma della capigliatura
    ctx.save();
    ctx.clip(HAIR);
    for (var i = 0; i < strands.length; i++) {
      var st = strands[i];
      var f;
      if (st.y <= yTop) f = 1;
      else if (st.y >= yBot) f = 0;
      else f = Math.pow(1 - (st.y - yTop) / band, 1.35);
      if (f <= 0.02 || (f < 1 && f < st.r * 0.8)) continue;
      var L = st.top * (st.y <= yTop ? 1 : (0.12 + 0.88 * f));
      var ex = st.x + st.ux * L, ey = st.y + st.uy * L;
      var cx = st.x + st.ux * L * 0.5 - st.uy * st.curl * L * 0.35;
      var cy = st.y + st.uy * L * 0.5 + st.ux * st.curl * L * 0.35;
      ctx.strokeStyle = "rgba(" + CREMA + "," + (st.a * (0.35 + 0.65 * f)).toFixed(3) + ")";
      ctx.lineWidth = st.w * (0.6 + 0.4 * f);
      ctx.beginPath();
      ctx.moveTo(st.x, st.y);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.stroke();
    }
    ctx.restore();

    // contorno, orecchio e tratti del viso
    ctx.strokeStyle = "rgba(" + CREMA + ",0.95)";
    ctx.lineWidth = 2.2;
    ctx.stroke(HEAD);
    ctx.fillStyle = "#24503f";
    ctx.fill(EAR);
    ctx.lineWidth = 2;
    ctx.stroke(EAR);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "rgba(" + CREMA + ",0.8)";
    ctx.stroke(EAR_IN);
    ctx.stroke(BROW);
    ctx.stroke(EYE);
    ctx.stroke(NOSTRIL);
    ctx.stroke(MOUTH);
    ctx.strokeStyle = "rgba(" + CREMA + ",0.28)";
    ctx.stroke(JAW);

    // guida: fin dove arriva la sfumatura
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "rgba(" + CREMA + ",0.75)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(40, yTop);
    ctx.lineTo(262, yTop);
    ctx.stroke();
    ctx.restore();

    // staffa laterale: la zona sfumata
    ctx.strokeStyle = ROSSO;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(48, yTop);
    ctx.lineTo(40, yTop);
    ctx.lineTo(40, Math.min(yBot, 400));
    ctx.lineTo(48, Math.min(yBot, 400));
    ctx.stroke();
  }

  var raf = 0;
  function render() {
    updateText();
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      draw();
    });
  }

  function onResize() { setupCanvas(); render(); }

  range.addEventListener("input", function () {
    userTook = true;
    state.v = parseFloat(range.value);
    render();
  });
  for (var b = 0; b < baseInputs.length; b++) {
    baseInputs[b].addEventListener("change", function (e) {
      state.skin = e.target.value === "skin";
      lastStyle = "";
      render();
    });
  }

  /* Scorrendo, la sfumatura sale da sola finché non tocchi il cursore */
  var section = document.getElementById("sfumatura");
  var userTook = false;
  var scrolly = !reduceMotion && window.innerHeight >= 560;
  if (scrolly) {
    document.documentElement.classList.add("is-scrolly");
    state.v = 6;
    range.value = 6;
  }

  function onScroll() {
    if (!scrolly || userTook) return;
    var r = section.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    if (total <= 0) return;
    var p = Math.max(0, Math.min(1, -r.top / total));
    // 0..0.85 della sezione: la sfumatura sale; l'ultimo tratto resta ferma per giocarci
    var v = Math.round(Math.min(1, p / 0.85) * 92 + 4);
    if (v !== state.v) {
      state.v = v;
      range.value = v;
      render();
    }
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lastStyle = ""; render(); });

  setupCanvas();
  onScroll();
  render();
})();
