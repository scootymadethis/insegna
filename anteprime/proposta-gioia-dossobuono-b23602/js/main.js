(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktopMQ = window.matchMedia("(min-width: 800px)");
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

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
    var parts = {};
    try {
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit",
        hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit"
      }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return {
        day: days[parts.weekday], min: (+parts.hour) * 60 + (+parts.minute),
        y: +parts.year, m: +parts.month, d: +parts.day
      };
    } catch (e) {
      var n = new Date();
      return { day: n.getDay(), min: n.getHours() * 60 + n.getMinutes(), y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
    }
  }

  /* ---------- Orari: 0 = domenica ---------- */
  var H = function (h, m) { return h * 60 + (m || 0); };
  var hours = {
    0: [[H(7), H(12, 30)]],
    1: [[H(6, 30), H(19, 30)]], 2: [[H(6, 30), H(19, 30)]], 3: [[H(6, 30), H(19, 30)]],
    4: [[H(6, 30), H(19, 30)]], 5: [[H(6, 30), H(19, 30)]],
    6: [[H(6, 30), H(12, 30)], [H(15, 30), H(19)]]
  };
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
      if (now.min < s[0]) return { open: false, text: "Chiuso ora, riapriamo alle " + fmt(s[0]) };
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
    // Conto alla rovescia per Natale
    var cd = document.querySelector("[data-countdown]");
    if (cd) {
      var num = cd.querySelector("[data-cd-num]"), txt = cd.querySelector("[data-cd-text]");
      var today = Date.UTC(now.y, now.m - 1, now.d);
      var xmas = Date.UTC(now.y, 11, 25);
      var diff = Math.round((xmas - today) / 86400000);
      if (diff > 1 && diff <= 60) { num.textContent = diff; txt.textContent = "giorni a Natale"; cd.hidden = false; }
      else if (diff === 1) { num.textContent = ""; txt.textContent = "Domani è Natale"; cd.hidden = false; }
      else cd.hidden = true;
    }
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Scorrimento: un solo ciclo per tutte le scene ---------- */
  var scenes = [];
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    for (var i = 0; i < scenes.length; i++) scenes[i](vh);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  /* Foto del titolo: le due colonne scorrono a velocità diverse */
  var gallery = document.querySelector("[data-hero-gallery]");
  if (gallery && !reduceMotion) {
    var cols = gallery.querySelectorAll(".hg-col");
    scenes.push(function () {
      var y = window.scrollY;
      var on = desktopMQ.matches && y < window.innerHeight * 1.5;
      cols.forEach(function (c) {
        var sp = parseFloat(c.getAttribute("data-speed")) || 0;
        c.style.setProperty("--py", on ? (-y * sp).toFixed(1) + "px" : "0px");
      });
    });
  }

  /* Il panettone che lievita: tre stadi guidati dallo scorrimento */
  var sec = document.querySelector(".lievita");
  if (sec) {
    var steps = sec.querySelectorAll(".step");
    var stageImgs = sec.querySelectorAll(".stage-img");
    var dots = sec.querySelectorAll(".dial-dot");
    var current = -1;
    // quanto è visibile ogni stadio, in funzione dell'avanzamento p (0..1)
    var fade = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
    var smooth = function (t) { return t * t * (3 - 2 * t); };
    var setStep = function (s) {
      if (s === current) return;
      current = s;
      steps.forEach(function (el, i) { el.classList.toggle("is-on", i === s); });
    };
    if (!reduceMotion) {
      scenes.push(function (vh) {
        var r = sec.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        var total = sec.offsetHeight - vh;
        var p = total > 0 ? clamp(-r.top / total, 0, 1) : 1;
        var a = smooth(fade(p, .26, .41));   // da impasto a lievitato
        var b = smooth(fade(p, .59, .74));   // da lievitato a cotto
        var o = [1 - a, a * (1 - b), b];
        stageImgs.forEach(function (img, i) { img.style.setProperty("--o", o[i].toFixed(3)); });
        sec.style.setProperty("--p", p.toFixed(4));
        dots.forEach(function (d, i) { d.classList.toggle("is-on", p >= [0, .335, .665][i]); });
        setStep(p < .335 ? 0 : p < .665 ? 1 : 2);
      });
    } else {
      sec.style.setProperty("--p", "1");
      dots.forEach(function (d) { d.classList.add("is-on"); });
    }
  }

  /* Una giornata al Gioia: il binario scorre in orizzontale mentre la pagina scende */
  var gio = document.querySelector("[data-hscroll]");
  if (gio && !reduceMotion) {
    var track = gio.querySelector("[data-htrack]");
    var fill = gio.querySelector("[data-hfill]");
    var dist = 0;
    gio.classList.add("is-h");
    var measure = function () {
      dist = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      gio.style.height = (window.innerHeight + dist) + "px";
    };
    measure();
    window.addEventListener("load", function () { measure(); onScroll(); });
    window.addEventListener("resize", function () { measure(); onScroll(); });
    scenes.push(function (vh) {
      var r = gio.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      var total = gio.offsetHeight - vh;
      var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      track.style.setProperty("--hx", (-p * dist).toFixed(1) + "px");
      if (fill) fill.style.setProperty("--hp", p.toFixed(4));
    });
  }

  /* Recensioni: i biglietti si muovono appena, ognuno al suo ritmo */
  var revs = document.querySelectorAll(".rev[data-drift]");
  if (revs.length && !reduceMotion) {
    scenes.push(function (vh) {
      revs.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var k = parseFloat(el.getAttribute("data-drift")) || 0;
        var d = (r.top + r.height / 2 - vh / 2);
        el.style.setProperty("--dy", (d * k).toFixed(1) + "px");
      });
    });
  }

  if (scenes.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    frame();
  }

  /* ---------- I lievitati ---------- */
  var LV = {
    "natalino": { name: "Natalino", tag: "Classico veronese", w: "kg 0,650", price: "28,00 €", img: "lv-natalino.webp", wh: [640, 586],
      alt: "Il Natalino, panettone a stella della tradizione veronese",
      desc: "La coccola del Natale veronese: un grande classico, morbidissimo e dal gusto equilibrato." },
    "uvetta": { name: "Uvetta", tag: "Classico", w: "kg 0,500", price: "30,00 €", img: "lv-uvetta.webp", wh: [576, 640],
      alt: "Panettone all'uvetta nel suo pirottino",
      desc: "Una cupola dorata, un impasto soffice e digeribile, e solo il gusto dolce e succoso dell'uvetta." },
    "agrumato": { name: "Agrumato", tag: "Mandarino e fondente", w: "kg 0,850", price: "37,00 €", img: "lv-agrumato.webp", wh: [640, 584],
      alt: "Panettone Agrumato con glassa e mandorle",
      desc: "Burro della Lessinia, mandarini di Sicilia e cioccolato fondente. Sopra, una glassa al cacao con mandorle e birra artigianale." },
    "rocher": { name: "Rocher", tag: "Nocciole e cioccolato", w: "kg 0,800", price: "45,00 €", img: "lv-rocher.webp", wh: [640, 569],
      alt: "Panettone Rocher ricoperto di cioccolato e nocciole",
      desc: "Pasta di panettone senza canditi, cioccolato al latte fuso e nocciola tostata. Per i più golosi." },
    "pandoro": { name: "Pandoro", tag: "Burro e vaniglia", w: "kg 1", price: "40,00 €", img: "lv-pandoro.webp", wh: [593, 640],
      alt: "Pandoro con zucchero a velo",
      desc: "Lenta lievitazione naturale, una sofficità che si sente e il profumo di burro fresco e vaniglia." },
    "gran-fondente": { name: "Pandoro Gran Fondente", tag: "Novità 2026", w: "kg 1", price: "43,00 €", img: "lv-gran-fondente.webp", wh: [567, 640],
      alt: "Fetta di Pandoro Gran Fondente con gocce di cioccolato",
      desc: "Il nostro pandoro, profumato di panna, burro fresco e bacche di vaniglia, con goccioloni di cioccolato fondente." },
    "vegano": { name: "Vegano", tag: "Ricetta vegana", w: "kg 0,750", price: "33,00 €", img: "lv-vegano.webp", wh: [626, 640],
      alt: "Panettone vegano con gocce di cioccolato",
      desc: "Senza latte e senza uova, con tanto cioccolato fondente e zucchero grezzo." },
    "lampone": { name: "Cioccolato e Lampone", tag: "Fruttato", w: "kg 0,750", price: "38,00 €", img: "lv-lampone.webp", wh: [640, 573],
      alt: "Panettone Cioccolato e Lampone con glassa rosa",
      desc: "Lamponi semicanditi, gocce di cioccolato fondente e al latte, e una glassa ai lamponi che lo ricopre tutto." },
    "zucca": { name: "Note di Zucca", tag: "Novità 2026", w: "kg 0,800", price: "37,00 €", img: "lv-zucca.webp", wh: [640, 427],
      alt: "Panettone tagliato con pezzi di zucca candita",
      desc: "Zucca candita, cioccolato fondente e mandorla tostata: l'autunno dentro un panettone." }
  };

  var stage = document.querySelector("[data-lv-stage]");
  if (stage) {
    var q = function (k) { return stage.querySelector('[data-lv="' + k + '"]'); };
    var chips = document.querySelectorAll(".lv-chips .chip");
    var swapTimer = null;
    var show = function (id) {
      var d = LV[id];
      if (!d) return;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-id") === id)); });
      q("name").textContent = d.name;
      q("tag").textContent = d.tag;
      q("weight").textContent = d.w;
      q("price").textContent = d.price;
      q("desc").textContent = d.desc;
      q("live").textContent = d.name + ", " + d.price;
      q("wa").href = "https://wa.me/393248067232?text=" + encodeURIComponent("Ciao Gioia, vorrei prenotare: " + d.name + ".");
      var img = q("img");
      var apply = function () {
        img.src = "img/" + d.img;
        img.width = d.wh[0]; img.height = d.wh[1];
        img.alt = d.alt;
        img.classList.remove("is-swapping");
      };
      clearTimeout(swapTimer);
      if (reduceMotion) { apply(); return; }
      img.classList.add("is-swapping");
      swapTimer = setTimeout(apply, 180);
    };
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        show(c.getAttribute("data-id"));
        var row = c.parentElement;
        if (row.scrollWidth > row.clientWidth) {
          var left = c.offsetLeft - (row.clientWidth - c.offsetWidth) / 2;
          row.scrollTo({ left: left, behavior: reduceMotion ? "auto" : "smooth" });
        }
      });
    });
    // precarica le foto dopo il caricamento
    window.addEventListener("load", function () {
      Object.keys(LV).forEach(function (k) { var i = new Image(); i.src = "img/" + LV[k].img; });
    });
  }
})();
