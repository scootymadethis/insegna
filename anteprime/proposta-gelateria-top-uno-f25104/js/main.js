(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* Prova degli orari: ?ora=11:30&giorno=0 (0 = domenica) */
  var demo = (function () {
    var q = new URLSearchParams(location.search), o = q.get("ora"), g = q.get("giorno");
    if (!o && !g) return null;
    var hm = (o || "").split(":");
    return { min: o ? (+hm[0]) * 60 + (+hm[1] || 0) : null, day: g !== null ? +g : null };
  })();

  /* ---------- Ora di Villafranca ---------- */
  function realNow() {
    var parts = {};
    try {
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[parts.weekday], min: (+parts.hour) * 60 + (+parts.minute) };
    } catch (e) {
      var n = new Date();
      return { day: n.getDay(), min: n.getHours() * 60 + n.getMinutes() };
    }
  }
  function romeNow() {
    var r = realNow();
    if (demo) { if (demo.min !== null) r.min = demo.min; if (demo.day !== null) r.day = demo.day; }
    return r;
  }

  /* ---------- Orari (Google), 0 = domenica ---------- */
  var H = function (h, m) { return h * 60 + (m || 0); };
  var pom = [H(15), H(22, 30)];
  var hours = { 0: [[H(10), H(12)], pom], 1: [pom], 2: [pom], 3: [pom], 4: [pom], 5: [pom], 6: [pom] };
  var dayNames = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  function fmt(min) { return Math.floor(min / 60) + ":" + ("0" + (min % 60)).slice(-2); }

  function status(now) {
    var today = hours[now.day] || [];
    for (var i = 0; i < today.length; i++) {
      var s = today[i];
      if (now.min >= s[0] && now.min < s[1]) {
        var left = s[1] - now.min;
        return { open: true, text: left <= 30 ? "Aperto ancora per " + left + " minuti" : "Aperto ora, fino alle " + fmt(s[1]) };
      }
      if (now.min < s[0]) return { open: false, text: "Chiuso ora, apriamo alle " + fmt(s[0]) };
    }
    for (var k = 1; k <= 7; k++) {
      var d = (now.day + k) % 7;
      if (hours[d] && hours[d].length) {
        var when = k === 1 ? "domani" : dayNames[d];
        return { open: false, text: "Chiuso ora, riapriamo " + when + " alle " + fmt(hours[d][0][0]) };
      }
    }
    return { open: false, text: "Chiuso ora" };
  }

  function paintStatus() {
    var now = romeNow();
    var st = status(now);
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.classList.toggle("is-open", st.open);
      el.classList.toggle("is-closed", !st.open);
      var t = el.querySelector("[data-status-text]");
      if (t) t.textContent = st.text;
    });
    document.querySelectorAll(".hours tr[data-days]").forEach(function (tr) {
      var days = tr.getAttribute("data-days").split(",").map(Number);
      tr.classList.toggle("is-today", days.indexOf(now.day) !== -1);
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Riempi la vaschetta ---------- */
  /* Misure, gusti e prezzi dal menu Deliveroo di Gelateria TOP UNO. I colori sono solo illustrativi. */
  var SIZES = {
    "500": { label: "500 g", max: 3, price: 14.5 },
    "750": { label: "750 g", max: 4, price: 21 },
    "900": { label: "900 g", max: 5, price: 26 },
    "1000": { label: "1 kg", max: 6, price: 28.5 }
  };
  var GROUPS = {
    "creme": [
      ["fiordilatte", "Fiordilatte", "#fbf4e2"],
      ["cioccolato", "Cioccolato", "#5a3222"],
      ["bacio", "Bacio", "#7b4a2f"],
      ["nocciola", "Nocciola", "#c39a6b"],
      ["pistacchio", "Pistacchio", "#a9b65a"],
      ["verdone", "Verdone", "#79ad6a"],
      ["stracciatella", "Stracciatella", "#f6efe1", "stracciatella"],
      ["cremino", "Cremino", "#d6b07f"],
      ["cioccomenta", "Cioccomenta", "#a6dcc0", "cioccomenta"],
      ["puffo", "Puffo", "#4fb0e6"],
      ["liquirizia", "Liquirizia", "#3d3537"],
      ["oma-rita", "Oma Rita creme", "#f0d7a3"],
      ["amarena", "Amarena", "#f1dde0", "variegato"],
      ["variegato-amarena", "Variegato all'amarena", "#f6e8d6", "variegato"],
      ["yogurt", "Yogurt", "#fbf8f3"]
    ],
    "senza-lattosio": [
      ["fondente", "Cioccolato extra fondente", "#3a1e16"],
      ["cocco", "Cocco", "#f8f3ea"],
      ["cremino-cocco", "Cremino al cocco", "#e6d4b8"],
      ["mango", "Mango", "#f6ae3a"],
      ["limone", "Limone", "#f2e891"],
      ["fragola", "Fragola", "#f08aa0"]
    ],
    "giorno": [
      ["biscotto", "Biscotto", "#d8b07a"],
      ["arachide", "Arachide o caramello salato", "#c48a4c"],
      ["yogurt-variegato", "Yogurt variegato", "#f1d2dd", "variegato", "frutti di bosco, pescarancia o mango"]
    ]
  };
  var BY_ID = {};
  Object.keys(GROUPS).forEach(function (g) {
    GROUPS[g].forEach(function (f) {
      BY_ID[f[0]] = { id: f[0], name: f[1], color: f[2], pattern: f[3] || null, note: f[4] || null, group: g };
    });
  });

  var builder = document.querySelector("[data-builder]");
  if (!builder) return;

  var state = { size: "500", picks: [] };
  var lanesG = builder.querySelector("[data-lanes]");
  var emptyT = builder.querySelector("[data-tub-empty]");
  var priceEl = builder.querySelector("[data-price]");
  var sizeEl = builder.querySelector("[data-size-label]");
  var countEl = builder.querySelector("[data-count]");
  var legend = builder.querySelector("[data-legend]");
  var fullNote = builder.querySelector("[data-full]");
  var live = builder.querySelector("[data-live]");
  var sizeBtns = Array.prototype.slice.call(builder.querySelectorAll("[data-size]"));

  function euro(n) { return n.toFixed(2).replace(".", ",") + " €"; }
  function nameOf(f) { return f.group === "giorno" ? f.name + " del giorno" : f.name; }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  function el(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  /* Chip dei gusti */
  Object.keys(GROUPS).forEach(function (g) {
    var box = builder.querySelector('[data-group="' + g + '"]');
    if (!box) return;
    GROUPS[g].forEach(function (f) {
      var info = BY_ID[f[0]];
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.setAttribute("aria-pressed", "false");
      b.setAttribute("data-flavour", info.id);
      var dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = info.color;
      dot.setAttribute("aria-hidden", "true");
      b.appendChild(dot);
      var label = document.createElement("span");
      label.textContent = info.name;
      if (info.note) {
        var sm = document.createElement("small");
        sm.textContent = " (" + info.note + ")";
        label.appendChild(sm);
      }
      b.appendChild(label);
      box.appendChild(b);
    });
  });
  var chips = Array.prototype.slice.call(builder.querySelectorAll(".chip"));

  function drawTub(newId) {
    while (lanesG.firstChild) lanesG.removeChild(lanesG.firstChild);
    var n = state.picks.length;
    emptyT.style.display = n ? "none" : "";
    if (!n) return;
    var x0 = 24, y0 = 24, W = 292, Hh = 166, w = W / n;
    state.picks.forEach(function (id, i) {
      var f = BY_ID[id];
      var x = x0 + i * w;
      var g = el("g", { "class": "lane" + (id === newId && !reduceMotion ? " is-new" : "") });
      g.appendChild(el("rect", { x: x.toFixed(2), y: y0, width: (w + .6).toFixed(2), height: Hh, fill: f.color }));
      if (f.pattern) {
        g.appendChild(el("rect", { x: x.toFixed(2), y: y0, width: (w + .6).toFixed(2), height: Hh, fill: "url(#pt-" + f.pattern + ")" }));
      }
      /* le onde della spatola */
      var dark = parseInt(f.color.slice(1, 3), 16) < 110;
      var stroke = dark ? shade(f.color, 38) : shade(f.color, -34);
      for (var k = 0; k < 4; k++) {
        var yy = y0 + 26 + k * 38 + (i % 2 ? 12 : 0);
        var xa = x + 8, xb = x + w - 8, mid = (xa + xb) / 2;
        g.appendChild(el("path", {
          d: "M" + xa.toFixed(1) + " " + yy + " Q" + ((xa + mid) / 2).toFixed(1) + " " + (yy - 9) + " " + mid.toFixed(1) + " " + yy +
             " T" + xb.toFixed(1) + " " + yy,
          fill: "none", stroke: stroke, "stroke-width": 3, "stroke-linecap": "round", opacity: .55
        }));
      }
      lanesG.appendChild(g);
      if (i > 0) lanesG.appendChild(el("line", { x1: x.toFixed(2), y1: y0, x2: x.toFixed(2), y2: y0 + Hh, stroke: "#fff", "stroke-width": 2.5, opacity: .85 }));
    });
    var fresh = lanesG.querySelector(".is-new");
    if (fresh) {
      fresh.getBoundingClientRect();
      requestAnimationFrame(function () { requestAnimationFrame(function () { fresh.classList.remove("is-new"); }); });
    }
  }

  function render(newId) {
    var s = SIZES[state.size];
    var n = state.picks.length;
    sizeEl.textContent = "Vaschetta da " + s.label;
    priceEl.textContent = euro(s.price);
    countEl.textContent = n + (n === 1 ? " gusto" : " gusti") + " su " + s.max;
    sizeBtns.forEach(function (b) {
      var on = b.getAttribute("data-size") === state.size;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    var full = n >= s.max;
    chips.forEach(function (c) {
      var id = c.getAttribute("data-flavour");
      var picked = state.picks.indexOf(id) !== -1;
      c.setAttribute("aria-pressed", String(picked));
      if (full && !picked) c.setAttribute("aria-disabled", "true");
      else c.removeAttribute("aria-disabled");
    });
    fullNote.hidden = !full;
    legend.textContent = "";
    state.picks.forEach(function (id) {
      var f = BY_ID[id];
      var li = document.createElement("li");
      var d = document.createElement("span");
      d.className = "dot"; d.style.background = f.color; d.setAttribute("aria-hidden", "true");
      li.appendChild(d);
      li.appendChild(document.createTextNode(nameOf(f)));
      legend.appendChild(li);
    });
    drawTub(newId);
  }

  function say(t) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 30); }

  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var id = c.getAttribute("data-flavour");
      var s = SIZES[state.size];
      var i = state.picks.indexOf(id);
      if (i !== -1) {
        state.picks.splice(i, 1);
        render();
        say("Tolto " + nameOf(BY_ID[id]) + ". " + state.picks.length + " gusti su " + s.max + ".");
        return;
      }
      if (state.picks.length >= s.max) {
        say("La vaschetta da " + s.label + " è piena: togli un gusto o scegli una misura più grande.");
        return;
      }
      state.picks.push(id);
      render(id);
      say("Aggiunto " + nameOf(BY_ID[id]) + ". " + state.picks.length + " gusti su " + s.max + ".");
    });
  });

  function setSize(key, focus) {
    state.size = key;
    var s = SIZES[key];
    var removed = [];
    while (state.picks.length > s.max) removed.push(nameOf(BY_ID[state.picks.pop()]));
    render();
    if (focus) builder.querySelector('[data-size="' + key + '"]').focus();
    say("Vaschetta da " + s.label + ", " + euro(s.price) + ", fino a " + s.max + " gusti." +
        (removed.length ? " Tolti: " + removed.join(", ") + "." : ""));
  }
  sizeBtns.forEach(function (b, idx) {
    b.addEventListener("click", function () { setSize(b.getAttribute("data-size")); });
    b.addEventListener("keydown", function (e) {
      var d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = sizeBtns[(idx + d + sizeBtns.length) % sizeBtns.length];
      setSize(next.getAttribute("data-size"), true);
    });
  });

  builder.querySelector("[data-reset]").addEventListener("click", function () {
    state.picks = [];
    render();
    say("Vaschetta svuotata.");
  });

  render();
})();
