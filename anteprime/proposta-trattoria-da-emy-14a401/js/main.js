(function () {
  'use strict';

  var LUNCH = [720, 870];      // 12:00-14:30
  var DINNER = [1140, 1350];   // 19:00-22:30
  // 0 = domenica ... 6 = sabato (orari Google)
  var HOURS = {
    0: [LUNCH], 1: [LUNCH],
    2: [LUNCH, DINNER], 3: [LUNCH, DINNER], 4: [LUNCH, DINNER], 5: [LUNCH, DINNER], 6: [LUNCH, DINNER]
  };
  var DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  var MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

  function romeNow() {
    try {
      return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
    } catch (e) { return new Date(); }
  }
  function hhmm(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    return h + ':' + (mm < 10 ? '0' : '') + mm;
  }

  function status(now) {
    var d = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
    var today = HOURS[d], i, r;
    for (i = 0; i < today.length; i++) {
      r = today[i];
      if (m >= r[0] && m < r[1]) {
        return { open: true, text: (r[1] - m <= 30 ? 'Aperto ora, chiude tra poco (' : 'Aperto ora, chiude alle ') + hhmm(r[1]) + (r[1] - m <= 30 ? ')' : '') };
      }
    }
    for (i = 0; i < today.length; i++) {
      if (today[i][0] > m) return { open: false, text: 'Chiuso ora, riapre alle ' + hhmm(today[i][0]) };
    }
    for (var k = 1; k <= 7; k++) {
      var nd = (d + k) % 7;
      if (HOURS[nd].length) {
        return { open: false, text: 'Chiuso ora, riapre ' + (k === 1 ? 'domani' : DAYS[nd]) + ' alle ' + hhmm(HOURS[nd][0][0]) };
      }
    }
    return { open: false, text: 'Chiuso ora' };
  }

  var SPECIALS = {
    0: 'Oggi pranzo dalle 12 alle 14:30, la sera siamo chiusi. Le sere della trattoria ripartono martedì.',
    1: 'Oggi pranzo dalle 12 alle 14:30, la sera siamo chiusi. Domani sera torna il galletto con patatine.',
    2: 'Stasera <strong>galletto con patatine</strong> e una bibita o una birra, 20 €. Pranzo dalle 12 alle 14:30, cena dalle 19 alle 22:30.',
    3: 'A pranzo <strong>spaghetti alle vongole</strong>, stasera <strong>soutè del pescatore</strong> con ¼ di vino o bibita, 25 €.',
    4: 'Stasera <strong>fiorentina da un chilo</strong> con contorno e ¼ di vino o bibita, 70 €.',
    5: 'Stasera <strong>paella di pesce</strong> con sangria, solo su prenotazione: chiamaci allo 045 468 6197.',
    6: 'Pranzo dalle 12 alle 14:30 e cena dalle 19 alle 22:30, con la nostra proposta dello chef.'
  };

  function renderStatus() {
    var now = romeNow();
    var s = status(now);
    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      var t = el.querySelector('[data-status-text]');
      if (t) t.textContent = s.text;
    });

    var d = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
    var showDay = d, label = 'Oggi';
    if (m >= 1350) { showDay = (d + 1) % 7; label = 'Domani'; }
    var date = new Date(now.getTime());
    if (label === 'Domani') date.setDate(date.getDate() + 1);
    var box = document.querySelector('[data-today]');
    if (box) {
      box.querySelector('[data-today-day]').textContent = label + ', ' + DAYS[showDay] + ' ' + date.getDate() + ' ' + MONTHS[date.getMonth()];
      var txt = SPECIALS[showDay];
      if (label === 'Domani') txt = txt.replace(/^Stasera/, 'Domani sera').replace(/^Oggi/, 'Domani').replace(/^A pranzo/, 'Domani a pranzo').replace(', stasera', ', la sera');
      box.querySelector('[data-today-what]').innerHTML = txt;
      box.hidden = false;
    }

    document.querySelectorAll('[data-hours] tr').forEach(function (tr) {
      tr.classList.toggle('is-today', Number(tr.getAttribute('data-dow')) === d);
    });

    document.querySelectorAll('[data-night]').forEach(function (li) {
      li.classList.toggle('is-today', Number(li.getAttribute('data-night')) === d);
    });
    document.querySelectorAll('.days a').forEach(function (a) {
      a.classList.toggle('is-today', Number(a.getAttribute('data-day')) === d);
    });
    return d;
  }

  var todayDow = renderStatus();
  setInterval(renderStatus, 60000);

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Galleria: la sezione resta ferma e le foto scorrono di lato mentre scendi ---------- */
  function hscroll(section) {
    var pin = section.querySelector('[data-pin]');
    var track = section.querySelector('[data-htrack]');
    if (!pin || !track) return;
    var dist = 0, span = 1, on = false;
    function measure() {
      on = !reduceMQ.matches && window.innerHeight >= 480;
      section.classList.toggle('is-pinned', on);
      if (!on) { section.style.height = ''; track.style.removeProperty('--x'); return; }
      dist = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      section.style.height = (pin.offsetHeight + dist) + 'px';
      span = Math.max(1, section.offsetHeight - pin.offsetHeight);
      update();
    }
    function update() {
      if (!on) return;
      var p = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / span));
      track.style.setProperty('--x', (-p * dist).toFixed(1) + 'px');
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', measure);
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', measure);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }
  document.querySelectorAll('[data-hscroll]').forEach(hscroll);

  /* ---------- Decori: si muovono appena, guidati dallo scroll ---------- */
  var decos = Array.prototype.slice.call(document.querySelectorAll('[data-drift]'));
  function drift() {
    if (reduceMQ.matches) {
      decos.forEach(function (el) { el.style.removeProperty('--dy'); el.style.removeProperty('--dr'); });
      return;
    }
    var vh = window.innerHeight;
    decos.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect(); // il contenitore non si muove: niente effetto a catena
      if (r.bottom < -200 || r.top > vh + 200) return;
      var c = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 circa
      var k = parseFloat(el.getAttribute('data-drift')) || 1;
      el.style.setProperty('--dy', (c * -28 * k).toFixed(1) + 'px');
      el.style.setProperty('--dr', (c * 7 * k).toFixed(2) + 'deg');
    });
  }
  if (decos.length) {
    window.addEventListener('scroll', drift, { passive: true });
    window.addEventListener('resize', drift);
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', drift);
    drift();
  }

  /* ---------- Le sere: settimana orizzontale guidata dallo scroll ---------- */
  var sere = document.querySelector('[data-sere]');
  if (!sere) return;
  var pin = sere.querySelector('.sere__pin');
  var viewport = sere.querySelector('.sere__viewport');
  var track = sere.querySelector('[data-track]');
  var cards = Array.prototype.slice.call(track.children);
  var plates = cards.map(function (c) { return c.querySelector('.night__plate'); });
  var links = Array.prototype.slice.call(sere.querySelectorAll('.days a'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var dist = 0, range = 1, pinned = false;

  function setActive(idx) {
    links.forEach(function (a, i) {
      a.classList.toggle('is-active', i === idx);
      if (i === idx) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  function measure() {
    pinned = !reduce.matches;
    sere.classList.toggle('is-pinned', pinned);
    if (!pinned) {
      sere.style.height = '';
      track.style.removeProperty('--x');
      return;
    }
    dist = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    sere.style.height = (pin.offsetHeight + dist) + 'px';
    range = Math.max(1, sere.offsetHeight - pin.offsetHeight);
    update();
  }

  function progress() {
    var top = sere.getBoundingClientRect().top;
    return Math.min(1, Math.max(0, -top / range));
  }

  function update() {

    if (!pinned) return;
    var p = progress();
    track.style.setProperty('--x', (-p * dist).toFixed(1) + 'px');
    plates.forEach(function (pl, i) {
      if (pl) pl.style.setProperty('--spin', ((p * (cards.length - 1) - i) * 50).toFixed(1) + 'deg');
    });
    setActive(Math.round(p * (cards.length - 1)));
  }

  // aggiornamento diretto: è leggero e non dipende da requestAnimationFrame
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', measure);
  if (reduce.addEventListener) reduce.addEventListener('change', measure);

  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (pinned) {
        var y = window.scrollY + sere.getBoundingClientRect().top + (i / (cards.length - 1)) * range + 1;
        window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
      } else {
        viewport.scrollTo({ left: cards[i].offsetLeft - 20, behavior: 'auto' });
        setActive(i);
      }
    });
  });

  // senza animazioni: la striscia si apre sulla sera di oggi
  viewport.addEventListener('scroll', function () {
    if (pinned) return;
    var best = 0, bestD = Infinity, c = viewport.scrollLeft + viewport.clientWidth / 2;
    cards.forEach(function (card, i) {
      var dd = Math.abs(card.offsetLeft + card.offsetWidth / 2 - c);
      if (dd < bestD) { bestD = dd; best = i; }
    });
    setActive(best);
  }, { passive: true });

  measure();
  if (!pinned) {
    var ti = cards.findIndex(function (c) { return Number(c.getAttribute('data-night')) === todayDow; });
    if (ti > 0) viewport.scrollLeft = cards[ti].offsetLeft - 20;
    setActive(Math.max(0, ti));
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('load', measure);
})();
