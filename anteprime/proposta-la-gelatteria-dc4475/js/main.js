(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Prova degli orari: ?ora=21:30&giorno=3 (0 = domenica) */
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
  var sera = [H(15), H(23)];
  var mattina = [H(9, 30), H(12, 30)];
  var hours = {
    0: [mattina, sera], 1: [sera], 2: [sera], 3: [mattina, sera],
    4: [sera], 5: [sera], 6: [mattina, sera]
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
    document.querySelectorAll(".hours tr[data-day]").forEach(function (tr) {
      tr.classList.toggle("is-today", +tr.getAttribute("data-day") === now.day);
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Un anno di feste: la fila scorre in orizzontale mentre scendi ---------- */
  var outer = document.querySelector("[data-track]");
  var list = document.querySelector("[data-track-list]");
  var bar = document.querySelector("[data-track-bar]");
  if (outer && list && !reduceMotion && "IntersectionObserver" in window) {
    var distance = 0;
    var measure = function () {
      outer.classList.add("is-pinned");
      distance = Math.max(0, list.scrollWidth - document.documentElement.clientWidth);
      outer.style.height = (distance + window.innerHeight) + "px";
    };
    var update = function () {
      var top = outer.getBoundingClientRect().top;
      var p = distance > 0 ? Math.min(1, Math.max(0, -top / distance)) : 0;
      list.style.transform = "translate3d(" + (-p * distance).toFixed(1) + "px,0,0)";
      if (bar) bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    };
    measure();
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", function () { measure(); update(); });
    window.addEventListener("load", function () { measure(); update(); });

    /* Con la tastiera: se un link nella fila prende il focus, porta la pagina al punto giusto */
    list.addEventListener("focusin", function (e) {
      var card = e.target.closest(".festa");
      if (!card || distance <= 0) return;
      var x = card.offsetLeft - (document.documentElement.clientWidth - card.offsetWidth) / 2;
      var p = Math.min(1, Math.max(0, x / distance));
      var y = window.scrollY + outer.getBoundingClientRect().top + p * distance;
      window.scrollTo(0, y);
    });
  }
})();
