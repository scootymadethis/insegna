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
    if (aw) aw.textContent = now.day === 3 ? "fino a mezzanotte" : "fino alle 20:00";
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

  /* ---------- Strisce orizzontali che scorrono con la pagina ---------- */
  function hscroll(sec) {
    var pin = sec.querySelector(".hs-pin");
    var track = sec.querySelector("[data-track]");
    if (!pin || !track) return;
    var dist = 0;
    function measure() {
      sec.classList.remove("is-pinned");
      sec.style.height = "";
      track.style.transform = "";
      if (reduceMotion) return;
      sec.classList.add("is-pinned");
      var vw = document.documentElement.clientWidth;
      dist = Math.max(0, track.scrollWidth - vw);
      // niente aggancio se la striscia entra tutta, o se il blocco non sta nello schermo
      if (dist < 40 || pin.scrollHeight > window.innerHeight + 2) {
        sec.classList.remove("is-pinned");
        dist = 0;
        return;
      }
      sec.style.height = (pin.offsetHeight + dist) + "px";
      update();
    }
    function update() {
      if (!dist) return;
      var top = sec.getBoundingClientRect().top;
      var p = Math.min(1, Math.max(0, -top / dist));
      track.style.transform = "translate3d(" + (-p * dist).toFixed(1) + "px,0,0)";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    measure();
  }
  document.querySelectorAll("[data-hscroll]").forEach(hscroll);

  /* ---------- Componi il tuo panino ---------- */
  var builder = document.querySelector("[data-builder]");
  if (!builder) return;

  var IMG = "img/panino/";
  // Ingredienti e regole dal menu di Borgo Bello (scheda "Componi il tuo panino")
  var DATA = {
    pane: [
      ["focaccia", "Pan focaccia"], ["puccia", "Puccia salentina"],
      ["toast", "Pane da toast"], ["piadina", "Piadina classica"],
      ["integrale", "Piadina integrale"], ["lungo", "Pane lungo grigliato"],
      ["tasca", "Tasca (pan pizza)"], ["bun", "Pane da hamburger"]
    ],
    base: [
      ["cotto", "Prosciutto cotto"], ["crudo", "Prosciutto crudo"],
      ["salame", "Salame"], ["speck", "Speck"], ["pancetta", "Pancetta"],
      ["mortadella", "Mortadella"], ["bresaola", "Bresaola"],
      ["tacchino", "Tacchino"], ["tonno", "Tonno"],
      ["hamburger", "Hamburger"], ["vegetale", "Hamburger vegetale"]
    ],
    formaggio: [
      ["mozzarella", "Mozzarella"], ["fontina", "Fontina"],
      ["scamorza", "Scamorza"], ["parmigiano", "Parmigiano"],
      ["philadelphia", "Philadelphia"]
    ],
    verdura: [
      ["insalata", "Insalata verde", 0.5], ["pomodori", "Pomodori", 0.5],
      ["zucchine", "Zucchine grigliate", 1], ["melanzane", "Melanzane grigliate", 1],
      ["rucola", "Rucola", 0.5], ["cipolla", "Cipolla", 0.5]
    ],
    salsa: [
      ["maionese", "Maionese"], ["ketchup", "Ketchup"],
      ["boscaiola", "Salsa boscaiola"], ["tonnata", "Salsa tonnata"],
      ["harissa", "Salsa harissa"], ["senape", "Senape"]
    ]
  };

  /* Proporzioni (altezza/larghezza) delle immagini in img/panino/, e come si appoggiano:
     w = larghezza rispetto al pane, sink = quota dello strato che affonda in quello sotto */
  var SHAPE = {"focaccia-sopra":0.3448,"focaccia-sotto":0.2543,"puccia-sopra":0.3988,"puccia-sotto":0.2426,"lungo-sopra":0.2629,"lungo-sotto":0.2174,"bun-sopra":0.4568,"bun-sotto":0.2866,"toast-sopra":0.2489,"toast-sotto":0.1903,"tasca-sopra":0.307,"tasca-sotto":0.1978,"cotto":0.2324,"crudo":0.2376,"salame":0.2037,"speck":0.2376,"pancetta":0.2178,"mortadella":0.2398,"bresaola":0.2386,"tacchino":0.236,"tonno":0.2152,"hamburger":0.2099,"vegetale":0.2167,"mozzarella":0.3503,"fontina":0.2996,"scamorza":0.2854,"parmigiano":0.3,"philadelphia":0.3004,"insalata":0.3508,"pomodori":0.2755,"zucchine":0.2663,"melanzane":0.3058,"rucola":0.265,"cipolla":0.2333,"maionese":0.1383,"ketchup":0.1417,"boscaiola":0.1567,"tonnata":0.1433,"harissa":0.1333,"senape":0.1283,"piadina-sopra":0.2259,"piadina-sotto":0.0636,"integrale-sopra":0.2428,"integrale-sotto":0.0596,"_":0.25};
  var LOOK = {
    pane: { w: 1, sink: 0 },
    top: { w: 1, sink: 0.3 },
    base: { w: 1.05, sink: 0.42 },
    formaggio: { w: 1.02, sink: 0.42 },
    verdura: { w: 1.07, sink: 0.45 },
    salsa: { w: 0.95, sink: 0.5 }
  };
  var TUNE = {};

  var MULTI = { pane: false, base: true, formaggio: true, verdura: true, salsa: true };
  var LABEL = {}, GROUP = {}, VCOST = {};

  Object.keys(DATA).forEach(function (g) {
    var box = builder.querySelector('[data-group="' + g + '"]');
    DATA[g].forEach(function (it) {
      LABEL[it[0]] = it[1]; GROUP[it[0]] = g;
      if (g === "verdura") VCOST[it[0]] = it[2];
      var lab = document.createElement("label");
      lab.className = "chip";
      var extra = g === "salsa" ? " <small>+0,50</small>" : "";
      var thumb = g === "pane" ? it[0] + "-sopra" : it[0];
      lab.innerHTML = '<input type="' + (MULTI[g] ? "checkbox" : "radio") + '" name="' + g + '" value="' + it[0] + '">' +
        '<span><span class="chip-img"><img src="' + IMG + thumb + '.webp" alt="" loading="lazy" decoding="async"></span>' + it[1] + extra + "</span>";
      box.appendChild(lab);
    });
  });

  var form = builder.querySelector("[data-form]");
  var asporto = builder.querySelector("[data-asporto]");
  var stack = builder.querySelector("[data-stack]");
  var priceEls = builder.querySelectorAll("[data-price]");
  var tagEl = builder.querySelector(".tag");
  var recipeEl = builder.querySelector("[data-recipe]");
  var receiptEls = builder.querySelectorAll("[data-receipt]");
  var waEl = builder.querySelector("[data-wa]");

  var stackIn = document.createElement("div");
  stackIn.className = "stack-in";
  stack.appendChild(stackIn);

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

  /* costo di ogni voce, con le regole del menu */
  function costs(s) {
    var rows = [];
    if (s.pane) rows.push({ k: s.pane, g: "pane", c: 0 });
    s.base.forEach(function (k, i) { rows.push({ k: k, g: "base", c: i ? 1 : 0 }); });
    s.formaggio.forEach(function (k, i) { rows.push({ k: k, g: "formaggio", c: i ? 1 : 0 }); });
    if (s.verdura.length) {
      var incl = s.verdura[0];
      s.verdura.forEach(function (k) { if (VCOST[k] > VCOST[incl]) incl = k; });
      s.verdura.forEach(function (k) { rows.push({ k: k, g: "verdura", c: k === incl ? 0 : VCOST[k] }); });
    }
    s.salsa.forEach(function (k) { rows.push({ k: k, g: "salsa", c: 0.5 }); });
    return rows;
  }
  function priceOf(s) {
    var p = 6;
    costs(s).forEach(function (r) { p += r.c; });
    if (asporto.checked) p += 0.5;
    return p;
  }
  function euro(n) { return n.toFixed(2).replace(".", ",") + " €"; }

  /* ----- la pila: immagini viste di lato, dal pane sotto al pane sopra ----- */
  function buildLayers(s) {
    var L = [];
    if (!s.pane) return L;
    L.push({ key: "pb-" + s.pane, src: s.pane + "-sotto", look: LOOK.pane });
    s.base.concat(s.formaggio, s.verdura, s.salsa).forEach(function (k) {
      L.push({ key: k, src: k, look: TUNE[k] || LOOK[GROUP[k]] });
    });
    L.push({ key: "pt-" + s.pane, src: s.pane + "-sopra", look: TUNE[s.pane + "-sopra"] || LOOK.top, top: true });
    return L;
  }

  var nodes = {};
  var firstPaint = true;
  var lastS = null;
  function render(s) {
    lastS = s;
    var animate = !reduceMotion && !firstPaint;
    firstPaint = false;
    var L = buildLayers(s);
    var box = stack.getBoundingClientRect();
    var W = Math.min(box.width * 0.8, 400);
    var y = 0, keep = {};
    L.forEach(function (l, i) {
      var ar = SHAPE[l.src] || SHAPE._;
      l.w = W * l.look.w;
      l.h = l.w * ar;
      l.y = i === 0 ? 0 : Math.max(0, y - l.h * l.look.sink);
      y = Math.max(y, l.y + l.h);
      keep[l.key] = true;
    });
    var total = y || 1;
    var scale = Math.min(1, box.height / total);
    stackIn.style.width = W + "px";
    stackIn.style.transform = "translateX(-50%) scale(" + scale.toFixed(3) + ")";

    Object.keys(nodes).forEach(function (k) {
      if (!keep[k]) {
        var n = nodes[k];
        delete nodes[k];
        if (!animate) { n.remove(); return; }
        n.style.opacity = "0";
        setTimeout(function () { n.remove(); }, 240);
      }
    });
    L.forEach(function (l) {
      var n = nodes[l.key];
      if (!n) {
        n = document.createElement("img");
        n.className = "layer";
        n.alt = "";
        n.decoding = "async";
        n.src = IMG + l.src + ".webp";
        nodes[l.key] = n;
        if (animate) {
          n.style.transition = "none";
          n.style.opacity = "0";
          n.style.transform = "translate(-50%," + (-(l.y + 90)).toFixed(1) + "px)";
        }
      }
      n.style.width = l.w.toFixed(1) + "px";
      stackIn.appendChild(n); // riordina: la pila si disegna dal basso
      if (n.style.transition === "none") {
        n.getBoundingClientRect();
        n.style.transition = "";
      }
      n.style.opacity = "1";
      n.style.transform = "translate(-50%," + (-l.y).toFixed(1) + "px)";
    });

    var empty = stack.querySelector(".stack-empty");
    if (!L.length && !empty) {
      empty = document.createElement("p");
      empty.className = "stack-empty";
      empty.textContent = "Scegli il pane per cominciare.";
      stack.appendChild(empty);
    } else if (L.length && empty) empty.remove();
    stack.setAttribute("aria-label", L.length ? "Il tuo panino: " + describe(s) : "Il tuo panino: scegli il pane per cominciare");
  }

  function describe(s) {
    return [LABEL[s.pane]].concat(s.base, s.formaggio, s.verdura, s.salsa).map(function (k, i) {
      return i === 0 ? k : (LABEL[k] || k).toLowerCase();
    }).join(", ") + (asporto.checked ? ", da portare via" : "");
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

  function li(name, cost, incl) {
    var el = document.createElement("li");
    var a = document.createElement("span"); a.className = "r-name"; a.textContent = name;
    var b = document.createElement("span"); b.className = "r-cost" + (incl ? " r-incl" : ""); b.textContent = cost;
    el.appendChild(a); el.appendChild(b);
    return el;
  }
  function paintReceipt(s) {
    receiptEls.forEach(function (ul) {
      ul.innerHTML = "";
      ul.appendChild(li("Panino base", "6,00 €"));
      costs(s).forEach(function (r) {
        ul.appendChild(li(LABEL[r.k], r.c ? "+" + euro(r.c) : "compreso", !r.c));
      });
      if (asporto.checked) ul.appendChild(li("Da portare via", "+0,50 €"));
    });
  }

  var lastPrice = null;
  function update() {
    var s = state();
    render(s);
    var p = priceOf(s);
    priceEls.forEach(function (el) { el.textContent = euro(p); });
    if (lastPrice !== null && p !== lastPrice && tagEl && !reduceMotion) {
      tagEl.classList.remove("is-bump"); void tagEl.offsetWidth; tagEl.classList.add("is-bump");
    }
    lastPrice = p;
    recipeEl.textContent = s.pane ? describe(s) + "." : "Scegli il pane per cominciare.";
    paintReceipt(s);
    var rows = summary(s);
    var msg = "Ciao Borgo Bello! Per la pausa pranzo vorrei questo panino:\n" +
      rows.map(function (r) { return "- " + (r[0] ? r[0] + ": " : "") + r[1]; }).join("\n") +
      "\nTotale indicativo: " + euro(p);
    waEl.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
    builder._rows = rows; builder._price = p;
  }

  form.addEventListener("change", update);
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (lastS) { firstPaint = true; render(lastS); } }, 120);
  });

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
      var el = document.createElement("li");
      if (r[0]) { var sm = document.createElement("small"); sm.textContent = r[0]; el.appendChild(sm); }
      el.appendChild(document.createTextNode(r[1]));
      list.appendChild(el);
    });
    dlg.querySelector("[data-scheda-price]").textContent = euro(builder._price || 6);
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  });

  // Si parte da un panino già pronto: pan focaccia, crudo, mozzarella, insalata
  [["pane", "focaccia"], ["base", "crudo"], ["formaggio", "mozzarella"], ["verdura", "insalata"]].forEach(function (p) {
    var i = form.querySelector('input[name="' + p[0] + '"][value="' + p[1] + '"]');
    if (i) { i.checked = true; if (order[p[0]]) order[p[0]].push(p[1]); }
  });
  update();
})();
