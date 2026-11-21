(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = "393516469168";

  /* Prova orari: ?ora=12:30&giorno=3 (0 = domenica) */
  var demo = (function () {
    var q = new URLSearchParams(location.search), o = q.get("ora"), g = q.get("giorno");
    if (!o && !g) return null;
    var hm = (o || "").split(":");
    return { min: o ? (+hm[0]) * 60 + (+hm[1] || 0) : null, day: g !== null ? +g : null };
  })();

  /* ---------- Ora di Dossobuono ---------- */
  function romeNow() {
    var r = realNow();
    if (demo) { if (demo.min !== null) r.min = demo.min; if (demo.day !== null) r.day = demo.day; }
    return r;
  }
  function realNow() {
    try {
      var parts = {};
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

  var H = function (h, m) { return h * 60 + (m || 0); };
  var full = [[H(7), H(20)]];
  var hours = { 0: [], 1: full, 2: full, 3: [[H(7), H(15)], [H(18), H(24)]], 4: full, 5: full, 6: [] };
  var dayNames = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  function fmt(min) { return min >= 1440 ? "mezzanotte" : Math.floor(min / 60) + ":" + ("0" + (min % 60)).slice(-2); }
  function until(min) { return min >= 1440 ? "fino a mezzanotte" : "fino alle " + fmt(min); }

  function status(now) {
    var today = hours[now.day] || [];
    for (var i = 0; i < today.length; i++) {
      var s = today[i];
      if (now.min >= s[0] && now.min < s[1]) {
        var left = s[1] - now.min;
        return { open: true, close: s[1], text: left <= 30 ? "Aperto ancora per " + left + " minuti" : "Aperto ora, " + until(s[1]) };
      }
      if (now.min < s[0]) return { open: false, text: "Chiuso ora, riapriamo alle " + fmt(s[0]) };
    }
    for (var k = 1; k <= 7; k++) {
      var d = (now.day + k) % 7;
      if (hours[d].length) {
        return { open: false, text: "Chiuso ora, riapriamo " + (k === 1 ? "domani" : dayNames[d]) + " alle " + fmt(hours[d][0][0]) };
      }
    }
    return { open: false, text: "Chiuso ora" };
  }

  function moment(now, st) {
    if (!st.open) return null;
    if (now.min < H(11, 30)) return "colazione";
    if (now.min < H(15)) return "pranzo";
    return "aperitivo";
  }

  function paint() {
    var now = romeNow();
    var st = status(now);
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.classList.toggle("is-open", st.open);
      el.classList.toggle("is-closed", !st.open);
      var t = el.querySelector("[data-status-text]");
      if (t) t.textContent = st.text;
    });
    var m = moment(now, st);
    document.querySelectorAll("[data-moment]").forEach(function (el) {
      var on = el.getAttribute("data-moment") === m;
      el.classList.toggle("is-now", on);
      if (on) el.setAttribute("aria-current", "time"); else el.removeAttribute("aria-current");
    });
    var aw = document.querySelector("[data-aperitivo-when]");
    if (aw) aw.textContent = now.day === 3 ? "mercoledì fino a mezzanotte" : "fino alle 20:00";
    document.querySelectorAll(".hours tr[data-days]").forEach(function (tr) {
      tr.classList.toggle("is-today", tr.getAttribute("data-days").split(",").map(Number).indexOf(now.day) !== -1);
    });
  }
  paint();
  setInterval(paint, 60000);

  /* ---------- Tabs del bar ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var j = null;
      if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") j = 0;
      if (e.key === "End") j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectTab(tabs[j], true); }
    });
  });

  /* ---------- Componi il tuo panino ---------- */
  var builder = document.querySelector("[data-builder]");
  if (!builder) return;

  // Ingredienti e regole dal menu di Borgo Bello (scheda "Componi il tuo panino")
  var DATA = {
    pane: [
      ["focaccia", "Pan focaccia", "#e4b46c"], ["puccia", "Puccia salentina", "#eed3a1"],
      ["toast", "Pane da toast", "#f2deb0"], ["piadina", "Piadina classica", "#f1ddaa"],
      ["integrale", "Piadina integrale", "#c9a074"], ["lungo", "Pane lungo grigliato", "#d9a05c"],
      ["tasca", "Tasca (pan pizza)", "#ecd09c"], ["bun", "Pane da hamburger", "#c97a30"]
    ],
    base: [
      ["cotto", "Prosciutto cotto", "#f3aea5"], ["crudo", "Prosciutto crudo", "#d4596a"],
      ["salame", "Salame", "#b3313c"], ["speck", "Speck", "#8e3b2e"], ["pancetta", "Pancetta", "#e98d8d"],
      ["mortadella", "Mortadella", "#f2a8b6"], ["bresaola", "Bresaola", "#7a1f2b"],
      ["tacchino", "Tacchino", "#efd2be"], ["tonno", "Tonno", "#c9a27e"],
      ["hamburger", "Hamburger", "#6b3a22"], ["vegetale", "Hamburger vegetale", "#7e7a3c"]
    ],
    formaggio: [
      ["mozzarella", "Mozzarella", "#fbfaf2"], ["fontina", "Fontina", "#f5d27a"],
      ["scamorza", "Scamorza", "#e9c27b"], ["parmigiano", "Parmigiano", "#f1df9f"],
      ["philadelphia", "Philadelphia", "#ffffff"]
    ],
    verdura: [
      ["insalata", "Insalata verde", "#74b843", 0.5], ["pomodori", "Pomodori", "#e2402b", 0.5],
      ["zucchine", "Zucchine grigliate", "#8dbf57", 1], ["melanzane", "Melanzane grigliate", "#6b3f57", 1],
      ["rucola", "Rucola", "#3f7f2a", 0.5], ["cipolla", "Cipolla", "#c47bbd", 0.5]
    ],
    salsa: [
      ["maionese", "Maionese", "#f4e3a0"], ["ketchup", "Ketchup", "#c8281e"],
      ["boscaiola", "Salsa boscaiola", "#9a6b3f"], ["tonnata", "Salsa tonnata", "#e6d6ac"],
      ["harissa", "Salsa harissa", "#d2462b"], ["senape", "Senape", "#d9a520"]
    ]
  };
  var MULTI = { pane: false, base: true, formaggio: true, verdura: true, salsa: true };
  var LABEL = {};
  var COLOR = {};
  var VCOST = {};

  Object.keys(DATA).forEach(function (g) {
    var box = builder.querySelector('[data-group="' + g + '"]');
    DATA[g].forEach(function (it) {
      LABEL[it[0]] = it[1]; COLOR[it[0]] = it[2];
      if (g === "verdura") VCOST[it[0]] = it[3];
      var lab = document.createElement("label");
      lab.className = "chip";
      var extra = g === "salsa" ? " <small>+0,50</small>" : "";
      lab.innerHTML = '<input type="' + (MULTI[g] ? "checkbox" : "radio") + '" name="' + g + '" value="' + it[0] + '">' +
        '<span><i style="background:' + it[2] + '"></i>' + it[1] + extra + "</span>";
      box.appendChild(lab);
    });
  });

  var form = builder.querySelector("[data-form]");
  var asporto = builder.querySelector("[data-asporto]");
  var layersG = builder.querySelector("[data-layers]");
  var priceEl = builder.querySelector("[data-price]");
  var recipeEl = builder.querySelector("[data-recipe]");
  var waEl = builder.querySelector("[data-wa]");
  var NS = "http://www.w3.org/2000/svg";

  // ordine di selezione per le scelte multiple (la prima è compresa)
  var order = { base: [], formaggio: [], verdura: [], salsa: [] };

  function state() {
    var s = { pane: null, base: [], formaggio: [], verdura: [], salsa: [] };
    var p = form.querySelector('input[name="pane"]:checked');
    s.pane = p ? p.value : null;
    ["base", "formaggio", "verdura", "salsa"].forEach(function (g) {
      var checked = Array.prototype.map.call(form.querySelectorAll('input[name="' + g + '"]:checked'), function (i) { return i.value; });
      order[g] = order[g].filter(function (v) { return checked.indexOf(v) !== -1; });
      checked.forEach(function (v) { if (order[g].indexOf(v) === -1) order[g].push(v); });
      s[g] = order[g].slice();
    });
    return s;
  }

  function priceOf(s) {
    var p = 6;
    p += Math.max(0, s.base.length - 1) * 1;
    p += Math.max(0, s.formaggio.length - 1) * 1;
    if (s.verdura.length > 1) {
      var costs = s.verdura.map(function (v) { return VCOST[v]; }).sort(function (a, b) { return b - a; });
      costs.slice(1).forEach(function (c) { p += c; });
    }
    p += s.salsa.length * 0.5;
    if (asporto.checked) p += 0.5;
    return p;
  }
  function euro(n) { return n.toFixed(2).replace(".", ",") + " €"; }

  /* ----- disegno degli strati (coordinate locali: x 0-320, y 0-h) ----- */
  function wavy(x0, x1, h, amp, n, fill, stroke) {
    var s = (x1 - x0) / n, d = "M" + x0 + " " + amp;
    for (var i = 0; i < n; i++) { var xa = x0 + s * i; d += " Q" + (xa + s / 2) + " " + (i % 2 ? amp * 2 : 0) + " " + (xa + s) + " " + amp; }
    d += " Q" + (x1 + 5) + " " + h / 2 + " " + x1 + " " + (h - 1);
    for (var j = n - 1; j >= 0; j--) { var xb = x0 + s * j; d += " Q" + (xb + s / 2) + " " + (j % 2 ? h + 1.5 : h - 2) + " " + xb + " " + (h - 1); }
    d += " Q" + (x0 - 5) + " " + h / 2 + " " + x0 + " " + amp + "Z";
    return '<path d="' + d + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.5"' : "") + "/>";
  }
  function dots(x0, x1, y0, y1, n, r, fill, seed) {
    var out = "", a = seed || 7;
    for (var i = 0; i < n; i++) {
      a = (a * 9301 + 49297) % 233280;
      var x = x0 + (a / 233280) * (x1 - x0);
      a = (a * 9301 + 49297) % 233280;
      var y = y0 + (a / 233280) * (y1 - y0);
      out += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + r + '" ry="' + (r * 0.7).toFixed(1) + '" fill="' + fill + '"/>';
    }
    return out;
  }
  function stripes(x0, x1, h, gap, color, w) {
    var out = "";
    for (var x = x0 + gap / 2; x < x1; x += gap) out += '<path d="M' + x + " " + (h * 0.15) + " l" + (-h * 0.45) + " " + (h * 0.7) + '" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round"/>';
    return out;
  }

  var BREAD = {
    focaccia: {
      bot: [17, '<rect x="28" y="0" width="264" height="17" rx="8.5" fill="#d9a55e"/><rect x="34" y="1.5" width="252" height="5" rx="2.5" fill="#eec88b"/>'],
      top: [36, '<path d="M26 36 Q26 6 90 3 L230 3 Q294 6 294 36 Z" fill="#e6b46f"/><path d="M26 36 Q26 30 40 30 L280 30 Q294 30 294 36 Z" fill="#c98f4a"/>' +
        dots(60, 260, 10, 24, 9, 3.2, "#cf9550", 3) + '<path d="M70 9 Q150 3 240 9" stroke="#f3d29a" stroke-width="3" fill="none" stroke-linecap="round"/>']
    },
    puccia: {
      bot: [18, '<rect x="32" y="0" width="256" height="18" rx="9" fill="#e5c690"/><rect x="38" y="1.5" width="244" height="5" rx="2.5" fill="#f3dfb6"/>'],
      top: [44, '<path d="M30 44 Q28 4 160 2 Q292 4 290 44 Z" fill="#edd19e"/><path d="M30 44 Q30 37 44 37 L276 37 Q290 37 290 44Z" fill="#d6b47a"/>' +
        dots(70, 250, 8, 28, 16, 1.6, "#fffaf0", 11)]
    },
    toast: {
      bot: [14, '<rect x="36" y="0" width="248" height="14" rx="3" fill="#f2deb0" stroke="#c98b4a" stroke-width="3"/>'],
      top: [16, '<rect x="36" y="0" width="248" height="16" rx="3" fill="#f4e2b8" stroke="#c98b4a" stroke-width="3"/>' + dots(60, 260, 4, 12, 10, 1.2, "#e2c58f", 5)]
    },
    piadina: {
      bot: [8, '<rect x="22" y="0" width="276" height="8" rx="4" fill="#efd9a4"/>' + dots(40, 280, 2, 6, 7, 2.4, "#c9934e", 2)],
      top: [12, '<path d="M20 12 Q24 0 160 0 Q296 0 300 12 Z" fill="#f2dfae"/>' + dots(40, 280, 3, 9, 9, 2.8, "#c58c47", 9)]
    },
    integrale: {
      bot: [8, '<rect x="22" y="0" width="276" height="8" rx="4" fill="#c39a6c"/>' + dots(40, 280, 2, 6, 7, 2.4, "#8a5a35", 2)],
      top: [12, '<path d="M20 12 Q24 0 160 0 Q296 0 300 12 Z" fill="#c9a074"/>' + dots(40, 280, 3, 9, 12, 2.4, "#8a5a35", 9)]
    },
    lungo: {
      bot: [14, '<rect x="14" y="0" width="292" height="14" rx="7" fill="#cf9452"/>'],
      top: [30, '<path d="M12 30 Q12 3 60 2 L260 2 Q308 3 308 30 Z" fill="#dca560"/>' + stripes(40, 290, 30, 26, "#7a4a22", 3.4) +
        '<path d="M12 30 Q12 25 24 25 L296 25 Q308 25 308 30Z" fill="#b97b3c"/>']
    },
    tasca: {
      bot: [12, '<rect x="26" y="0" width="268" height="12" rx="6" fill="#e6c48e"/>' + dots(40, 280, 3, 9, 6, 2.6, "#8a5a2e", 4)],
      top: [26, '<path d="M24 26 Q22 4 60 3 L260 3 Q298 4 296 26 Z" fill="#efd4a3"/>' + dots(44, 276, 6, 20, 10, 3.4, "#7a4a22", 8)]
    },
    bun: {
      bot: [18, '<rect x="44" y="0" width="232" height="18" rx="9" fill="#cf8238"/><rect x="50" y="1.5" width="220" height="5" rx="2.5" fill="#e9b170"/>'],
      top: [56, '<path d="M40 56 Q36 2 160 2 Q284 2 280 56 Z" fill="#c4742c"/><path d="M70 16 Q160 0 250 16" stroke="#dd9a52" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>' +
        dots(70, 250, 10, 40, 16, 2.8, "#f6e7c1", 21) + '<path d="M40 56 Q40 50 54 50 L266 50 Q280 50 280 56Z" fill="#a95f22"/>']
    }
  };

  var FILL = {
    cotto: [14, function () { return wavy(30, 290, 14, 3, 10, "#f3aea5", "#e08b82"); }],
    crudo: [12, function () { return wavy(30, 290, 12, 3, 12, "#d4596a") + '<path d="M40 4 Q100 1 160 5 T280 4" stroke="#f7dede" stroke-width="2.5" fill="none"/>'; }],
    salame: [13, function () { return wavy(34, 286, 13, 2, 6, "#b3313c") + dots(44, 276, 3, 10, 18, 1.4, "#f4d6d0", 6); }],
    speck: [11, function () { return wavy(30, 290, 11, 3, 10, "#8e3b2e") + '<path d="M34 2 L286 2" stroke="#5e2219" stroke-width="3" stroke-linecap="round"/>'; }],
    pancetta: [12, function () { return wavy(30, 290, 12, 3, 10, "#e98d8d") + '<path d="M38 5 Q160 2 282 5 M38 8.5 Q160 6 282 8.5" stroke="#fbe8e3" stroke-width="2" fill="none"/>'; }],
    mortadella: [12, function () { return wavy(28, 292, 12, 2, 8, "#f2a8b6") + dots(40, 280, 3, 9, 14, 1.6, "#fff4f4", 13); }],
    bresaola: [9, function () { return wavy(32, 288, 9, 2, 12, "#7a1f2b"); }],
    tacchino: [12, function () { return wavy(30, 290, 12, 3, 10, "#efd2be", "#d8b49c"); }],
    tonno: [14, function () { return wavy(34, 286, 14, 4, 14, "#c9a27e") + '<path d="M60 5 l10 5 M110 4 l8 6 M170 5 l9 5 M220 4 l8 6" stroke="#a88360" stroke-width="2" stroke-linecap="round"/>'; }],
    hamburger: [22, function () { return '<rect x="34" y="1" width="252" height="21" rx="10" fill="#6b3a22"/>' + wavy(34, 286, 6, 2, 20, "#4a2615") + dots(50, 270, 8, 18, 14, 2, "#8a5232", 17); }],
    vegetale: [20, function () { return '<rect x="36" y="1" width="248" height="19" rx="9.5" fill="#7e7a3c"/>' + dots(50, 270, 5, 16, 18, 2.2, "#a9b85a", 19) + dots(50, 270, 5, 16, 8, 1.8, "#5a5226", 23); }],
    mozzarella: [12, function () { var o = ""; for (var x = 50; x <= 270; x += 44) o += '<ellipse cx="' + x + '" cy="6" rx="26" ry="6" fill="#fbfaf2" stroke="#e5e1d2" stroke-width="1.2"/>'; return o; }],
    fontina: [10, function () { return '<path d="M30 0 H290 V5 L282 5 L276 13 L268 5 L200 5 L192 11 L186 5 L100 5 L92 14 L84 5 L30 5 Z" fill="#f5d27a"/>'; }],
    scamorza: [10, function () { return '<rect x="32" y="1" width="256" height="8" rx="3" fill="#ecc985"/><rect x="32" y="0" width="256" height="3" rx="1.5" fill="#a7742f"/>'; }],
    parmigiano: [8, function () { return '<path d="M40 8 L58 0 L74 8 Z M88 8 L110 1 L124 8 Z M140 8 L160 0 L178 8 Z M194 8 L214 1 L230 8 Z M244 8 L262 0 L280 8 Z" fill="#f1df9f" stroke="#d9c37a" stroke-width="1"/>'; }],
    philadelphia: [7, function () { return wavy(36, 284, 7, 2, 14, "#ffffff", "#e8e6df"); }],
    insalata: [14, function () { return wavy(18, 302, 14, 5, 16, "#74b843") + wavy(26, 294, 7, 3, 14, "#9ed465"); }],
    pomodori: [10, function () { var o = ""; for (var x = 36; x < 284; x += 62) o += '<rect x="' + x + '" y="1" width="58" height="9" rx="4.5" fill="#e2402b"/><rect x="' + (x + 6) + '" y="3.5" width="46" height="3.5" rx="1.75" fill="#f6886f"/>'; return o; }],
    zucchine: [9, function () { return '<rect x="30" y="1" width="260" height="8" rx="4" fill="#cfe0a0"/><rect x="30" y="0" width="260" height="3" rx="1.5" fill="#3d6b23"/>' + stripes(40, 286, 9, 22, "#4a5a22", 2.4); }],
    melanzane: [9, function () { return '<rect x="30" y="1" width="260" height="8" rx="4" fill="#d9c08a"/><rect x="30" y="0" width="260" height="3" rx="1.5" fill="#4a2a3e"/>' + stripes(40, 286, 9, 22, "#5a3a22", 2.4); }],
    rucola: [10, function () { var d = "M24 10"; for (var x = 24; x < 296; x += 12) d += " L" + (x + 6) + " " + (x % 24 ? 0 : 3) + " L" + (x + 12) + " 8"; return '<path d="' + d + ' L296 10 Z" fill="#3f7f2a"/>'; }],
    cipolla: [8, function () { var o = ""; for (var x = 50; x <= 270; x += 36) o += '<ellipse cx="' + x + '" cy="4" rx="17" ry="3.4" fill="none" stroke="#c47bbd" stroke-width="2.4"/>'; return o; }]
  };
  function sauce(color, i) {
    var d = "M" + (44 + i * 6) + " 4";
    for (var x = 44 + i * 6; x < 270; x += 24) d += " q6 -5 12 0 t12 0";
    return [7, '<path d="' + d + '" stroke="' + color + '" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'];
  }

  function buildLayers(s) {
    var L = [];
    if (!s.pane) return L;
    var b = BREAD[s.pane];
    L.push({ key: "pb-" + s.pane, h: b.bot[0], svg: b.bot[1], ov: 0 });
    s.base.concat(s.formaggio, s.verdura).forEach(function (k) {
      var f = FILL[k];
      L.push({ key: k, h: f[0], svg: f[1](), ov: 4 });
    });
    s.salsa.forEach(function (k, i) { var sc = sauce(COLOR[k], i); L.push({ key: "s-" + k, h: sc[0], svg: sc[1], ov: 3 }); });
    L.push({ key: "pt-" + s.pane, h: b.top[0], svg: b.top[1], ov: 4, top: true });
    return L;
  }

  var nodes = {};
  var firstPaint = true;
  function render(s) {
    var animate = !reduceMotion && !firstPaint;
    firstPaint = false;
    var L = buildLayers(s);
    var y = 186, keep = {};
    L.forEach(function (l) {
      y = y - l.h + l.ov;
      l.y = y;
      keep[l.key] = true;
    });
    var total = 186 - (L.length ? L[L.length - 1].y : 186);
    var scale = total > 178 ? 178 / total : 1;
    layersG.style.transform = "scale(" + scale.toFixed(3) + ")";

    // rimuovi
    Object.keys(nodes).forEach(function (k) {
      if (!keep[k]) {
        var n = nodes[k];
        delete nodes[k];
        if (!animate) { n.remove(); return; }
        n.style.opacity = "0";
        setTimeout(function () { n.remove(); }, 260);
      }
    });
    // aggiungi / sposta (in ordine, così la pila si disegna dal basso)
    L.forEach(function (l) {
      var n = nodes[l.key];
      if (!n) {
        n = document.createElementNS(NS, "g");
        n.setAttribute("class", "layer");
        n.innerHTML = l.svg;
        nodes[l.key] = n;
        if (animate) {
          n.style.transition = "none";
          n.style.opacity = "0";
          n.style.transform = "translate(0px," + (l.y - 70) + "px)";
        }
      }
      layersG.appendChild(n); // riordina
      if (n.style.transition === "none") {
        n.getBoundingClientRect();
        n.style.transition = "";
      }
      n.style.opacity = "1";
      n.style.transform = "translate(0px," + l.y + "px)";
    });
  }

  function summary(s) {
    var rows = [];
    if (s.pane) rows.push(["Pane", LABEL[s.pane]]);
    if (s.base.length) rows.push(["Base", s.base.map(function (k) { return LABEL[k]; }).join(", ")]);
    if (s.formaggio.length) rows.push(["Formaggio", s.formaggio.map(function (k) { return LABEL[k]; }).join(", ")]);
    if (s.verdura.length) rows.push(["Verdura", s.verdura.map(function (k) { return LABEL[k]; }).join(", ")]);
    if (s.salsa.length) rows.push(["Salsa", s.salsa.map(function (k) { return LABEL[k]; }).join(", ")]);
    if (asporto.checked) rows.push(["", "Da portare via"]);
    return rows;
  }

  function update() {
    var s = state();
    render(s);
    var p = priceOf(s);
    priceEl.textContent = euro(p);
    var rows = summary(s);
    if (!s.pane) {
      recipeEl.textContent = "Scegli il pane per cominciare.";
    } else {
      var parts = [LABEL[s.pane]].concat(s.base, s.formaggio, s.verdura, s.salsa.map(function (k) { return k; })).map(function (k, i) {
        return i === 0 ? k : (LABEL[k] || k).toLowerCase();
      });
      recipeEl.textContent = parts.join(", ") + (asporto.checked ? ", da portare via" : "") + ".";
    }
    var msg = "Ciao Borgo Bello! Per la pausa pranzo vorrei questo panino:\n" +
      rows.map(function (r) { return "- " + (r[0] ? r[0] + ": " : "") + r[1]; }).join("\n") +
      "\nTotale indicativo: " + euro(p);
    waEl.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
    builder._rows = rows; builder._price = p;
  }

  form.addEventListener("change", update);

  builder.querySelector("[data-reset]").addEventListener("click", function () {
    form.querySelectorAll("input").forEach(function (i) { i.checked = false; });
    Object.keys(order).forEach(function (g) { order[g] = []; });
    var first = form.querySelector('input[name="pane"][value="focaccia"]');
    if (first) first.checked = true;
    update();
  });

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  builder.querySelector("[data-random]").addEventListener("click", function () {
    form.querySelectorAll("input").forEach(function (i) { i.checked = false; });
    Object.keys(order).forEach(function (g) { order[g] = []; });
    var choose = function (g, n) {
      var pool = DATA[g].map(function (x) { return x[0]; });
      for (var i = 0; i < n && pool.length; i++) {
        var v = pick(pool); pool.splice(pool.indexOf(v), 1);
        form.querySelector('input[name="' + g + '"][value="' + v + '"]').checked = true;
        if (order[g]) order[g].push(v);
      }
    };
    choose("pane", 1); choose("base", 1); choose("formaggio", 1);
    choose("verdura", 1 + Math.floor(Math.random() * 2)); choose("salsa", Math.floor(Math.random() * 2));
    update();
  });

  var dlg = document.querySelector("[data-dialog]");
  builder.querySelector("[data-show]").addEventListener("click", function () {
    var list = dlg.querySelector("[data-scheda-list]");
    list.innerHTML = "";
    var rows = builder._rows || [];
    if (!rows.length) rows = [["", "Scegli prima il pane"]];
    rows.forEach(function (r) {
      var li = document.createElement("li");
      if (r[0]) { var sm = document.createElement("small"); sm.textContent = r[0]; li.appendChild(sm); }
      li.appendChild(document.createTextNode(r[1]));
      list.appendChild(li);
    });
    dlg.querySelector("[data-scheda-price]").textContent = euro(builder._price || 6);
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  });

  // Si parte dal pan focaccia
  var start = form.querySelector('input[name="pane"][value="focaccia"]');
  if (start) start.checked = true;
  update();
})();
