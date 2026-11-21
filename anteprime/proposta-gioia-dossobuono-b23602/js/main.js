(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      var today = Date.UTC(now.y, now.m - 1, now.d);
      var xmas = Date.UTC(now.y, 11, 25);
      var diff = Math.round((xmas - today) / 86400000);
      if (diff > 1 && diff <= 60) { cd.textContent = "Mancano " + diff + " giorni a Natale"; cd.hidden = false; }
      else if (diff === 1) { cd.textContent = "Domani è Natale"; cd.hidden = false; }
      else cd.hidden = true;
    }
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Hero: "qualcosa di ..." ---------- */
  var pill = document.querySelector(".pill");
  if (pill && !reduceMotion) {
    var imgs = pill.querySelectorAll("img");
    var idx = 0;
    setInterval(function () {
      if (document.hidden) return;
      var cur = imgs[idx];
      idx = (idx + 1) % imgs.length;
      var nxt = imgs[idx];
      cur.classList.remove("is-on");
      cur.classList.add("is-off");
      nxt.classList.remove("is-off");
      nxt.classList.add("is-on");
      setTimeout(function () { cur.classList.remove("is-off"); }, 650);
    }, 2000);
  }

  /* ---------- Il panettone che lievita ---------- */
  var sec = document.querySelector(".lievita");
  if (sec && !reduceMotion) {
    var steps = sec.querySelectorAll(".step");
    var ticking = false;
    var current = -1;
    var ease = function (t) { return 1 - Math.pow(1 - t, 2.2); };
    var update = function () {
      ticking = false;
      var r = sec.getBoundingClientRect();
      var total = sec.offsetHeight - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
      var rise = ease(Math.min(1, p / 0.82));
      sec.style.setProperty("--rise", rise.toFixed(4));
      var s = p < 0.34 ? 0 : p < 0.68 ? 1 : 2;
      if (s !== current) {
        current = s;
        steps.forEach(function (el, i) { el.classList.toggle("is-on", i === s); });
      }
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  } else if (sec) {
    sec.style.setProperty("--rise", "1");
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
      q("bigname").textContent = d.name;
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
      c.addEventListener("click", function () { show(c.getAttribute("data-id")); });
    });
    // precarica le foto dopo il caricamento
    window.addEventListener("load", function () {
      Object.keys(LV).forEach(function (k) { var i = new Image(); i.src = "img/" + LV[k].img; });
    });
  }
})();
