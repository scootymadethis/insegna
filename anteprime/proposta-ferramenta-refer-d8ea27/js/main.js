/* Ferramenta Refer: cassettiera, "trova il pezzo" e orari */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = "https://wa.me/393457414666?text=";
  var TEL = "tel:+39045986666";

  var ICONS = {
    viti: '<path d="M8.5 3.5h7l-1.2 3h-4.6z"/><path d="M12 6.5V21"/><path d="M9.5 9.5l5 1.6M9.5 12.5l5 1.6M9.5 15.5l5 1.6"/>',
    fissaggi: '<path d="M8.5 3.5h7v3l-1 2v8.5L12 20l-2.5-3V8.5l-1-2z"/><path d="M10 11h4M10 14h4"/>',
    elettroutensili: '<path d="M3 7.5h11v5H3z"/><path d="M14 8.5h3.5M17.5 10h3.5"/><path d="M6.5 12.5 5.5 20h4l1-7.5"/>',
    utensili: '<path d="M4.5 7.5 9.5 4l3.5 3.5-2.2 2.2"/><path d="M10.8 9.7 20 19l-1.8 1.8-9.3-9.3"/>',
    colori: '<path d="M5 8.5h14v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5z"/><path d="M5 8.5 7 5h10l2 3.5"/><path d="M9 13.5h6"/>',
    giardino: '<path d="M12 21v-9"/><path d="M12 12C12 8 9 5.5 4.5 5.5 4.5 9.5 7.5 12 12 12z"/><path d="M12 14c0-3 2.5-5.5 7.5-5.5 0 3-2.5 5.5-7.5 5.5z"/>',
    idraulica: '<path d="M3.5 10.5h9a3.5 3.5 0 0 1 3.5 3.5v2"/><path d="M8 10.5V6.5h6.5M11.2 6.5V4"/><path d="M16 19v1.5"/>',
    elettrico: '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>',
    chiavi: '<circle cx="7.5" cy="12" r="4"/><path d="M11.5 12H21M18 12v3M15 12v2"/>',
    antinfortunistica: '<path d="M3 17.5h18"/><path d="M5 17.5a7 7 0 0 1 14 0"/><path d="M10 10.5V7h4v3.5"/>',
    edilizia: '<path d="M3 6h18v12H3z"/><path d="M3 10h18M3 14h18M8 6v4M15 6v4M11.5 10v4M6 14v4M17 14v4"/>',
    casa: '<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>'
  };

  var DRAWERS = [
    { id: "viti", label: "Viti e bulloni",
      text: "Viti, bulloni, dadi e rondelle: la minuteria per montare, fissare e riparare.",
      list: ["Viti", "Bulloni", "Dadi", "Rondelle"],
      tip: "Porta il pezzo vecchio: confrontare filetto e lunghezza è il modo più rapido per trovare quello giusto.",
      img: "img/viti.webp", alt: "Viti in acciaio ammucchiate, in primo piano",
      kw: ["vit", "bullon", "dado", "dadi", "rondell", "minuter", "chiod", "filett", "brugol"] },
    { id: "fissaggi", label: "Tasselli e fissaggi",
      text: "Tasselli e sistemi di fissaggio per appendere e ancorare su muro pieno, forato o cartongesso.",
      brands: "Fischer",
      tip: "Dicci su che muro devi fissare e quanto pesa quello che appendi: il tassello giusto dipende da questo.",
      kw: ["tassell", "fischer", "ancorant", "fissagg", "ganci", "staff", "mensol", "cartongess", "append", "muro"] },
    { id: "elettroutensili", label: "Elettroutensili",
      text: "Trapani, levigatrici e altri elettroutensili, per il fai da te e per chi ci lavora tutti i giorni.",
      brands: "HiKOKI (ex Hitachi), Bosch, Black+Decker",
      tip: "Cerchi un modello preciso? Chiedi se è disponibile o se va ordinato.",
      kw: ["trapan", "avvitat", "levigat", "smerigliat", "flex", "seghett", "elettroutens", "hikoki", "hitachi", "bosch", "black", "decker", "punte", "dischi"] },
    { id: "utensili", label: "Utensili a mano",
      text: "Gli attrezzi da avere in casa e in officina: martelli, cacciaviti, pinze, chiavi inglesi e metri.",
      tip: "Se non sai che attrezzo serve, raccontaci il lavoro da fare.",
      img: "img/pannello.webp", alt: "Martelli, pinze e guanti appesi a un pannello forato",
      kw: ["martell", "cacciavit", "pinz", "tenagli", "ingles", "metro", "livell", "cutter", "taglierin", "utensil", "attrezz", "cassetta"] },
    { id: "colori", label: "Colori e vernici",
      text: "Smalti, vernici e colori, anche preparati al momento con il tintometro.",
      brands: "Paramatti",
      tip: "Per rifare un colore porta un campione: una scaglia di vernice o un pezzetto del materiale.",
      img: "img/colori.webp", alt: "Barattoli di vernice aperti in tanti colori, visti dall'alto",
      kw: ["vernic", "smalt", "pittur", "color", "tinta", "tinte", "tintometr", "impregnant", "antiruggin", "pennell", "rull", "paramatti", "spray", "diluent"] },
    { id: "giardino", label: "Giardino",
      text: "Attrezzi da giardino, macchine e motopompe per l'orto e il verde di casa.",
      brands: "Annovi Reverberi",
      tip: "Per una pompa o una macchina da giardino, dicci per cosa ti serve: ti aiutiamo a scegliere.",
      img: "img/giardino.webp", alt: "Rastrello, pala e forcone gialli appoggiati a una parete di legno",
      kw: ["giardin", "tosaerb", "rastrell", "vanga", "pala", "potat", "cesoi", "irrigaz", "pomp", "motopomp", "irrorat", "annovi", "reverberi", "orto", "prato", "erba", "siepe"] },
    { id: "idraulica", label: "Idraulica",
      text: "Materiale idraulico per le piccole riparazioni di casa e per i lavori più impegnativi.",
      tip: "Prima di smontare, fai una foto al pezzo montato: al banco ci aiuta a capire cosa serve.",
      kw: ["rubinett", "guarnizion", "raccord", "sifon", "tubo", "tubi", "flessibil", "teflon", "canapa", "scaric", "lavandin", "doccia", "idraulic", "valvol", "perdit", "acqua"] },
    { id: "elettrico", label: "Materiale elettrico",
      text: "Materiale elettrico per la casa: dalla prolunga alla lampadina da cambiare.",
      tip: "Porta la lampadina o il pezzo da sostituire: attacco e misura si vedono subito.",
      kw: ["lampadin", "presa", "prese", "spina", "interrutt", "prolung", "ciabatt", "cavo", "cavi", "filo", "pile", "pila", "batteri", "torcia", "elettric", "led"] },
    { id: "chiavi", label: "Chiavi",
      text: "Copie delle chiavi al banco. Per le chiavi elettroniche chiedici se la tua si può duplicare.",
      tip: "Porta la chiave originale, non una copia: il duplicato viene più preciso.",
      img: "img/chiavi.webp", alt: "Un mazzo di chiavi su un tavolo di legno",
      kw: ["chiave", "chiavi", "copia", "copie", "duplic", "doppion"] },
    { id: "antinfortunistica", label: "Antinfortunistica",
      text: "Scarpe antinfortunistiche e attrezzature per lavorare in sicurezza.",
      tip: "Per le scarpe chiedi quali taglie ci sono prima di passare.",
      kw: ["scarp", "antinfortun", "guant", "occhial", "mascherin", "cuffi", "elmett", "casco", "sicurezz", "abbigliam", "lavoro"] },
    { id: "edilizia", label: "Edilizia",
      text: "Materiale edile per lavori e riparazioni in casa e in cantiere.",
      tip: "Per quantità grandi chiamaci prima di venire.",
      kw: ["cement", "malta", "stucc", "silicon", "colla", "schium", "cazzuol", "gesso", "mattoni", "edil", "intonac"] },
    { id: "casa", label: "Casa e fai da te",
      text: "Articoli per la casa e materiali per il fai da te.",
      tip: "Non trovi la voce giusta? Scrivici cosa ti serve: ti diciamo se ce l'abbiamo.",
      kw: ["casa", "pulizi", "detergent", "scopa", "secchi", "sacchi", "bricolag", "hobby", "fai da te"] }
  ];

  /* ---------- Costruzione dei cassetti ---------- */
  var drawersEl = document.getElementById("drawers");
  var tray = document.getElementById("tray");
  var buttons = {};

  DRAWERS.forEach(function (d) {
    var slot = document.createElement("div");
    slot.className = "slot";
    var b = document.createElement("button");
    b.type = "button";
    b.className = "drawer";
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-controls", "tray");
    b.dataset.id = d.id;
    b.style.setProperty("--i", DRAWERS.indexOf(d));
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[d.id] + "</svg>" +
      '<span class="drawer__label">' + d.label + "</span>" +
      '<span class="drawer__handle" aria-hidden="true"></span>';
    b.addEventListener("click", function () { openDrawer(d.id, true); });
    slot.appendChild(b);
    drawersEl.appendChild(slot);
    buttons[d.id] = b;
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var lastQuery = "";

  function openDrawer(id, fromUser) {
    var d = null;
    for (var i = 0; i < DRAWERS.length; i++) if (DRAWERS[i].id === id) d = DRAWERS[i];
    if (!d) return;
    Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute("aria-expanded", k === id ? "true" : "false"); });

    var ask = lastQuery ? "Ciao! Cerco: " + lastQuery + ". Ce l'avete?" : "Ciao! Cerco qualcosa nel reparto " + d.label.toLowerCase() + ": ";
    var html = "";
    if (d.img) html += '<figure class="tray__photo"><img src="' + d.img + '" alt="' + esc(d.alt) + '" width="1400" height="934"></figure>';
    html += '<p class="tray__kicker">Cassetto aperto</p>';
    html += "<h3>" + esc(d.label) + "</h3>";
    html += '<p class="tray__text">' + esc(d.text) + "</p>";
    if (d.list) html += '<ul class="tray__list">' + d.list.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    if (d.brands) html += '<p class="tray__brands"><strong>Marchi:</strong> ' + esc(d.brands) + "</p>";
    if (d.tip) html += '<p class="tray__tip">' + esc(d.tip) + "</p>";
    html += '<div class="tray__actions">' +
      '<a class="btn btn--green" href="' + WA + encodeURIComponent(ask) + '" rel="noopener" target="_blank">Chiedi se ce l\'abbiamo</a>' +
      '<a class="btn btn--line-dark" href="' + TEL + '">Chiama lo 045 986666</a></div>';
    tray.innerHTML = html;
    if (fromUser || lastQuery) {
      tray.classList.remove("is-fresh");
      void tray.offsetWidth;
      tray.classList.add("is-fresh");
    }

    if (fromUser) {
      var r = tray.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.72 || r.top < 0) {
        setTimeout(function () {
          tray.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        }, reduceMotion ? 0 : 260);
      }
    }
  }

  /* ---------- Trova il pezzo ---------- */
  var form = document.getElementById("finder");
  var input = document.getElementById("q");
  var result = document.getElementById("finder-result");
  var dockWa = document.querySelector(".dock__btn--wa");
  var STOP = { per: 1, del: 1, della: 1, dello: 1, delle: 1, degli: 1, dei: 1, con: 1, una: 1, uno: 1, che: 1, sono: 1, mi: 1, serve: 1, servono: 1, cerco: 1, avete: 1 };

  function norm(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9+ ]+/g, " ");
  }

  function search(q) {
    var tokens = norm(q).split(/\s+/).filter(function (t) { return t.length >= 3 && !STOP[t] && !/^\d+$/.test(t); });
    var scored = [];
    DRAWERS.forEach(function (d) {
      var score = 0;
      tokens.forEach(function (t) {
        for (var i = 0; i < d.kw.length; i++) {
          var k = d.kw[i];
          if (t.indexOf(k) === 0 || (t.length >= 4 && k.indexOf(t) === 0)) { score++; break; }
        }
      });
      if (norm(d.label).indexOf(norm(q).trim()) === 0 && q.trim().length >= 3) score += 1;
      if (score) scored.push({ d: d, s: score });
    });
    scored.sort(function (a, b) { return b.s - a.s; });
    return { tokens: tokens, hits: scored };
  }

  function waAsk(q) { return WA + encodeURIComponent("Ciao! Cerco: " + q + ". Ce l'avete?"); }

  function run(q, show) {
    q = q.trim();
    lastQuery = q;
    if (dockWa) dockWa.href = q ? waAsk(q) : WA + encodeURIComponent("Ciao! Cerco: ");
    Object.keys(buttons).forEach(function (k) { buttons[k].classList.remove("is-match"); });
    if (!q) {
      drawersEl.classList.remove("is-searching");
      result.hidden = true;
      return;
    }
    var r = search(q);
    drawersEl.classList.toggle("is-searching", r.hits.length > 0);
    r.hits.forEach(function (h) { buttons[h.d.id].classList.add("is-match"); });
    if (!show && q.length < 3) { result.hidden = true; return; }

    var html;
    if (r.hits.length) {
      var top = r.hits[0].d;
      var others = r.hits.slice(1, 3).map(function (h) { return h.d.label; });
      html = '<p>Guarda nel cassetto <strong>' + esc(top.label) + "</strong>" +
        (others.length ? ", oppure in " + esc(others.join(" e ")) : "") + ".</p>" +
        '<div class="finder__actions">' +
        '<button type="button" class="btn btn--ink" data-open="' + top.id + '">Apri il cassetto</button>' +
        '<a class="btn btn--green" href="' + waAsk(q) + '" rel="noopener" target="_blank">Chiedi se ce l\'abbiamo</a>' +
        "</div>";
      result.classList.remove("is-miss");
    } else {
      html = "<p>Non abbiamo un cassetto per <strong>«" + esc(q) + "»</strong>, ma chiedi lo stesso: ti rispondiamo noi.</p>" +
        '<div class="finder__actions">' +
        '<a class="btn btn--green" href="' + waAsk(q) + '" rel="noopener" target="_blank">Chiedi se ce l\'abbiamo</a>' +
        '<a class="btn btn--line-dark" href="' + TEL + '">Chiama</a>' +
        "</div>";
      result.classList.add("is-miss");
    }
    result.innerHTML = html;
    result.hidden = false;
    var openBtn = result.querySelector("[data-open]");
    if (openBtn) {
      openBtn.addEventListener("click", function () {
        var id = openBtn.getAttribute("data-open");
        openDrawer(id, false);
        var target = document.getElementById("cassettiera");
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        setTimeout(function () { buttons[id].focus({ preventScroll: true }); }, reduceMotion ? 0 : 500);
      });
    }
  }

  var t = 0;
  input.addEventListener("input", function () {
    clearTimeout(t);
    t = setTimeout(function () { run(input.value, false); }, 140);
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    run(input.value, true);
  });
  var chips = document.querySelectorAll(".finder__chips button");
  for (var c = 0; c < chips.length; c++) {
    chips[c].addEventListener("click", function (e) {
      input.value = e.currentTarget.getAttribute("data-q");
      run(input.value, true);
    });
  }

  openDrawer("viti", false);

  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          drawersEl.classList.add("is-intro");
          setTimeout(function () { drawersEl.classList.remove("is-intro"); }, 1400);
          io.disconnect();
        }
      });
    }, { threshold: 0.45 });
    io.observe(drawersEl);
  }

  /* ---------- Orari: aperto ora / chiuso, sull'ora italiana ---------- */
  var HOURS = {
    0: [],
    1: [[480, 750], [870, 1140]],
    2: [[480, 750], [870, 1140]],
    3: [[480, 750], [870, 1140]],
    4: [[480, 750], [870, 1140]],
    5: [[480, 750], [870, 1140]],
    6: [[480, 780]]
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
  function fmt(min) { var h = Math.floor(min / 60), m = min % 60; return h + ":" + (m < 10 ? "0" : "") + m; }

  function updateStatus() {
    var now = romeNow();
    var today = HOURS[now.day];
    var open = null, i;
    for (i = 0; i < today.length; i++) if (now.min >= today[i][0] && now.min < today[i][1]) open = today[i];
    var text;
    if (open) {
      text = "Aperti ora: chiudiamo alle " + fmt(open[1]) + ".";
    } else {
      text = "Chiusi ora.";
      var lunch = today.length > 1 && now.min >= today[0][1] && now.min < today[1][0];
      if (lunch) {
        text = "Chiusi per pranzo: riapriamo alle " + fmt(today[1][0]) + ".";
      } else {
        for (var d = 0; d < 8; d++) {
          var day = (now.day + d) % 7, slots = HOURS[day], next = null;
          for (var j = 0; j < slots.length; j++) if (d > 0 || slots[j][0] > now.min) { next = slots[j]; break; }
          if (next) {
            var when = d === 0 ? "oggi" : d === 1 ? "domani" : DAY_NAMES[day];
            text = "Chiusi ora. Riapriamo " + when + " alle " + fmt(next[0]) + ".";
            break;
          }
        }
      }
    }
    var status = document.getElementById("status");
    status.textContent = text;
    status.classList.toggle("is-open", !!open);
    status.classList.toggle("is-closed", !open);
    var dock = document.getElementById("dock-status");
    if (dock) {
      dock.classList.toggle("is-open", !!open);
      dock.classList.toggle("is-closed", !open);
      dock.setAttribute("aria-label", text + " Vedi gli orari");
      dock.title = open ? "Aperto" : "Chiuso";
    }
    var rows = document.querySelectorAll(".week tr");
    for (i = 0; i < rows.length; i++) rows[i].classList.toggle("is-today", parseInt(rows[i].getAttribute("data-day"), 10) === now.day);
  }
  updateStatus();
  setInterval(updateStatus, 60000);
})();
