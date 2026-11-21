(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* Prova: ?ora=6:10 per vedere lo stato a un'altra ora */
  var demoMin = (function () {
    var o = new URLSearchParams(location.search).get("ora");
    if (!o) return null;
    var hm = o.split(":");
    return (+hm[0]) * 60 + (+hm[1] || 0);
  })();

  /* ---------- Orari (Google, novembre 2026): tutti i giorni 5:30–20:30 ---------- */
  var OPEN = 5 * 60 + 30, CLOSE = 20 * 60 + 30;
  var fmt = function (min) { return Math.floor(min / 60) + ":" + ("0" + Math.round(min % 60)).slice(-2); };

  function romeMinutes() {
    if (demoMin !== null) return demoMin;
    try {
      var parts = {};
      new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      return (+parts.hour) * 60 + (+parts.minute);
    } catch (e) {
      var n = new Date();
      return n.getHours() * 60 + n.getMinutes();
    }
  }

  function status(min) {
    if (min >= OPEN && min < CLOSE) {
      var left = CLOSE - min;
      if (left <= 30) return { open: true, text: "Aperto ancora per " + left + " minuti", short: "Chiudiamo tra " + left + " min" };
      return { open: true, text: "Aperto ora, fino alle 20:30", short: "Aperto fino alle 20:30" };
    }
    if (min < OPEN) return { open: false, text: "Chiuso ora, apriamo alle 5:30", short: "Apriamo alle 5:30" };
    return { open: false, text: "Chiuso ora, riapriamo domani alle 5:30", short: "Riapriamo alle 5:30" };
  }

  var nowMin = romeMinutes();
  function paintStatus() {
    nowMin = romeMinutes();
    var st = status(nowMin);
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.classList.toggle("is-open", st.open);
      el.classList.toggle("is-closed", !st.open);
      var t = el.querySelector("[data-status-text]");
      if (t) t.textContent = el.hasAttribute("data-short") ? st.short : st.text;
    });
    var now = document.querySelector("[data-rail-now]");
    if (now) {
      var inDay = nowMin >= OPEN && nowMin < CLOSE;
      now.hidden = !inDay;
      var x = (nowMin - OPEN) / (CLOSE - OPEN);
      if (inDay) now.parentNode.style.setProperty("--now", x.toFixed(4));
      document.querySelectorAll("[data-ticks] span").forEach(function (t) {
        var tx = (+t.getAttribute("data-at") - OPEN) / (CLOSE - OPEN);
        t.style.setProperty("--x", (tx * 100).toFixed(2) + "%");
        t.classList.toggle("is-near", inDay && Math.abs(tx - x) < 0.09);
      });
    }
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- La giornata: il cielo cambia con lo scroll ---------- */
  var SKY = [
    [330, [29, 33, 66], [90, 70, 117]],      // 5:30 ancora buio
    [420, [231, 160, 141], [246, 210, 176]], // 7:00 alba
    [660, [185, 214, 230], [238, 243, 239]], // 11:00 mattina piena
    [900, [241, 216, 189], [249, 235, 220]], // 15:00 pomeriggio
    [1080, [224, 139, 114], [242, 195, 152]],// 18:00 tramonto
    [1230, [29, 33, 66], [62, 53, 102]]      // 20:30 sera
  ];
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var mix = function (c1, c2, t) { return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]; };
  var rgb = function (c) { return "rgb(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ")"; };
  var lum = function (c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };
  function skyAt(min) {
    for (var i = 0; i < SKY.length - 1; i++) {
      var a = SKY[i], b = SKY[i + 1];
      if (min <= b[0]) {
        var t = clamp((min - a[0]) / (b[0] - a[0]), 0, 1);
        t = t * t * (3 - 2 * t);
        return [mix(a[1], b[1], t), mix(a[2], b[2], t)];
      }
    }
    var last = SKY[SKY.length - 1];
    return [last[1], last[2]];
  }

  var sec = document.querySelector("[data-giornata]");
  if (sec && !reduceMotion) {
    sec.classList.add("is-live");
    var track = sec.querySelector("[data-giornata-track]");
    var viewport = sec.querySelector(".giornata__viewport");
    var fill = sec.querySelector("[data-rail-fill]");
    var sun = sec.querySelector("[data-rail-sun]");
    var clock = sec.querySelector("[data-rail-clock]");
    var line = sec.querySelector(".rail__line");
    var dist = 0, lastInk = "";

    var update = function () {
      var r = sec.getBoundingClientRect();
      var p = dist > 0 ? clamp(-r.top / dist, 0, 1) : 0;
      track.style.transform = "translate3d(" + (-p * dist).toFixed(1) + "px,0,0)";
      var min = OPEN + p * (CLOSE - OPEN);
      var sky = skyAt(min);
      sec.style.setProperty("--sky1", rgb(sky[0]));
      sec.style.setProperty("--sky2", rgb(sky[1]));
      var ink = lum(mix(sky[0], sky[1], 0.35)) < 0.5 ? "#fffaf6" : "#33292a";
      if (ink !== lastInk) { sec.style.setProperty("--ink", ink); lastInk = ink; }
      line.style.setProperty("--p", p.toFixed(4));
      if (clock) clock.textContent = fmt(Math.round(min / 5) * 5);
    };
    var measure = function () {
      dist = Math.max(0, track.scrollWidth - viewport.clientWidth);
      sec.style.height = (dist + window.innerHeight) + "px";
      update();
    };
    void fill; void sun;
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    measure();
  }
})();
