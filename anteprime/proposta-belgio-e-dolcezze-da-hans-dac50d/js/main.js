(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- Orari ----------
     Gli orari del locale non sono pubblicati da nessuna parte (Google, Facebook, Instagram).
     Appena Hans ce li dà, basta compilarli qui: il sito calcola da solo "aperto ora / chiuso".
     Formato: 0 = domenica ... 6 = sabato, fasce in minuti [apertura, chiusura].
     Esempio: 1: [[H(7), H(14)], [H(17), H(24)]]  */
  var H = function (h, m) { return h * 60 + (m || 0); };
  var HOURS = null;
  void H;

  var dayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  var fmt = function (min) { min = min % (24 * 60); return Math.floor(min / 60) + ":" + ("0" + (min % 60)).slice(-2); };

  function romeNow() {
    var parts = {};
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[parts.weekday], min: (+parts.hour) * 60 + (+parts.minute) };
    } catch (e) {
      var n = new Date();
      return { day: n.getDay(), min: n.getHours() * 60 + n.getMinutes() };
    }
  }

  function status(now) {
    if (!HOURS) return { open: null, text: "Orari in aggiornamento: chiamaci prima di passare", short: "Orari da confermare" };
    var today = HOURS[now.day] || [];
    for (var i = 0; i < today.length; i++) {
      if (now.min >= today[i][0] && now.min < today[i][1]) return { open: true, text: "Aperto ora, fino alle " + fmt(today[i][1]) };
      if (now.min < today[i][0]) return { open: false, text: "Chiuso ora, apriamo alle " + fmt(today[i][0]) };
    }
    for (var k = 1; k <= 7; k++) {
      var d = (now.day + k) % 7;
      if (HOURS[d] && HOURS[d].length) return { open: false, text: "Chiuso ora, riapriamo " + (k === 1 ? "domani" : dayNames[d].toLowerCase()) + " alle " + fmt(HOURS[d][0][0]) };
    }
    return { open: false, text: "Chiuso ora" };
  }

  function paintStatus() {
    var now = romeNow();
    var st = status(now);
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.classList.toggle("is-open", st.open === true);
      el.classList.toggle("is-closed", st.open === false);
      var t = el.querySelector("[data-status-text]");
      if (t) t.textContent = (el.hasAttribute("data-short") && st.short) ? st.short : st.text;
    });
    var box = document.querySelector("[data-hours-table]");
    if (box && HOURS) {
      var order = [1, 2, 3, 4, 5, 6, 0];
      var rows = order.map(function (d) {
        var f = HOURS[d] || [];
        var txt = f.length ? f.map(function (s) { return fmt(s[0]) + "–" + fmt(s[1]); }).join(", ") : "Chiuso";
        return '<tr' + (d === now.day ? ' class="is-today"' : "") + '><th scope="row">' + dayNames[d] + "</th><td>" + txt + "</td></tr>";
      });
      box.innerHTML = '<table class="hours"><caption class="sr-only">Orari di apertura</caption><tbody>' + rows.join("") + "</tbody></table>";
      var note = document.querySelector("[data-hours-note]");
      if (note) note.textContent = "Nei giorni di festa gli orari possono cambiare: li scriviamo su Instagram.";
    }
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Il disco: Lato A / Lato B ---------- */
  var disco = document.querySelector("[data-disco]");
  if (disco && !reduceMotion) {
    disco.classList.add("is-live");
    var record = disco.querySelector("[data-record]");
    var arm = disco.querySelector("[data-arm]");
    var tracks = disco.querySelectorAll("[data-track]");
    var bands = disco.querySelectorAll(".record__band");
    var meter = disco.querySelector("[data-meter]");
    var current = -1;

    var updateDisco = function () {
      var r = disco.getBoundingClientRect();
      var total = disco.offsetHeight - window.innerHeight;
      var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      record.style.transform = "rotate(" + (p * 900).toFixed(2) + "deg)";
      var idx = Math.min(5, Math.floor(p * 6));
      var local = p * 6 - idx;                    // avanzamento dentro la traccia
      var inSide = (idx % 3 + local) / 3;          // avanzamento dentro il lato
      // braccio: fuori dal disco all'inizio, poi dal bordo verso l'etichetta
      var enter = clamp(p / 0.04, 0, 1);
      var angle = -14 + enter * (14 + 2 + inSide * 19);
      arm.style.setProperty("--arm", angle.toFixed(2) + "deg");
      if (meter) meter.style.setProperty("--p", p.toFixed(4));
      if (idx !== current) {
        current = idx;
        tracks.forEach(function (t, i) { t.classList.toggle("is-on", i === idx); });
        bands.forEach(function (b, i) { b.classList.toggle("is-on", i === idx % 3); });
        disco.setAttribute("data-side", idx < 3 ? "a" : "b");
      }
    };
    window.addEventListener("scroll", updateDisco, { passive: true });
    window.addEventListener("resize", updateDisco);
    updateDisco();
  }

  /* ---------- Galleria orizzontale guidata dallo scroll ---------- */
  var nastro = document.querySelector("[data-nastro]");
  if (nastro && !reduceMotion) {
    nastro.classList.add("is-live");
    var track = nastro.querySelector("[data-nastro-track]");
    var bar = nastro.querySelector("[data-nastro-bar]");
    var viewport = nastro.querySelector(".nastro__viewport");
    track.querySelectorAll("img").forEach(function (img) {
      var w = +img.getAttribute("width"), h = +img.getAttribute("height");
      if (w && h) img.style.aspectRatio = w + " / " + h;
    });
    var dist = 0;
    var measure = function () {
      dist = Math.max(0, track.scrollWidth - viewport.clientWidth);
      nastro.style.height = (dist + window.innerHeight) + "px";
      updateNastro();
    };
    var updateNastro = function () {
      var r = nastro.getBoundingClientRect();
      var p = dist > 0 ? clamp(-r.top / dist, 0, 1) : 0;
      track.style.transform = "translate3d(" + (-p * dist).toFixed(1) + "px,0,0)";
      if (bar) bar.style.setProperty("--p", p.toFixed(4));
    };
    window.addEventListener("scroll", updateNastro, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    measure();
  }
})();
