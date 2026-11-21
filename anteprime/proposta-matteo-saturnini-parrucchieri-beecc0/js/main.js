/* Matteo Saturnini Parrucchieri: cartella colori + orari */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IG = 'https://www.instagram.com/';

  /* ---------- La cartella colori ---------- */
  var SWATCHES = [
    { name: 'Rosso Caterina', lock: 'rosso', img: 'colore-rosso-caterina', date: 'Gennaio 2026', url: IG + 'reel/DT-QAQZCGeC/',
      stops: ['#5c0610', '#9a1222', '#c41e30', '#e0404d', '#f07a7f'],
      alt: 'Capelli lunghi a onde, rosso acceso, visti di spalle',
      text: 'Un rosso acceso e pieno, per chi non ha paura di farsi notare. Quando è tornato in salone l’abbiamo annunciato così: allerta colore.' },
    { name: 'Rosa', lock: 'rosa', img: 'colore-rosa', date: 'Gennaio 2026', url: IG + 'reel/DTZ0EFviEcO/',
      stops: ['#7a3226', '#b2553f', '#dc7a64', '#f19a85', '#f9c0ae'],
      alt: 'Boccoli lunghi color rosa corallo visti di spalle',
      text: 'Un rosa caldo sui boccoli, per chi ha voglia di osare ed essere sé stessa senza compromessi.' },
    { name: 'Ricci da cerimonia', lock: 'ricci', img: 'colore-ricci-cerimonia', date: 'Maggio 2026', url: IG + 'reel/DX_cJ9eorkf/',
      stops: ['#2a1915', '#5a3426', '#8a5236', '#b97a52', '#d9a77c'],
      alt: 'Ricci lunghi castani con riflessi ramati, semi-raccolto con fiorellini bianchi',
      text: 'Boccoli dai riflessi ramati e un semi-raccolto con i fiorellini: anche i capelli ricci meritano la loro acconciatura da cerimonia.' },
    { name: 'Castano', lock: 'castano', img: 'colore-castano', date: 'Marzo 2026', url: IG + 'reel/DVjdcFNCIyA/',
      stops: ['#0e0a09', '#1f1512', '#35231d', '#4f3428', '#71503d'],
      alt: 'Capelli castano scuro mossi, all’altezza delle spalle, visti di spalle',
      text: 'Il castano non è mai un colore banale. Lo sfumiamo con cura per dargli calore, eleganza e profondità.' },
    { name: 'Biondo sfumato', lock: 'sfumato', img: 'colore-biondo-sfumato', date: 'Luglio 2026', url: IG + 'p/DaceNtdiNps/',
      stops: ['#4a3426', '#7d5a45', '#b68a6a', '#dcb592', '#efd3b4'],
      alt: 'Capelli lunghi e lisci, radice scura che sfuma in un biondo caldo',
      text: 'Dalla radice più scura al biondo sulle lunghezze, senza stacchi: un colore morbido che illumina.' },
    { name: 'Riflessi', lock: 'riflessi', img: 'colore-riflessi', date: 'Aprile 2026', url: IG + 'p/DXbr1ZniIrh/',
      stops: ['#5a4632', '#8c7355', '#b89c78', '#d8c3a0', '#ece0c6'],
      alt: 'Capelli lisci alle spalle con riflessi biondi su base castano chiaro',
      text: 'Ogni riflesso è studiato per armonizzare luce, movimento e brillantezza, con prodotti professionali scelti per la salute del capello.' },
    { name: 'Biondo chiaro', lock: 'chiaro', img: 'colore-biondo-chiaro', date: 'Febbraio 2026', url: IG + 'reel/DUkxv6lCPtZ/',
      stops: ['#8a7f6c', '#b9ad94', '#d6ccb4', '#e9e1cf', '#f6f1e5'],
      alt: 'Capelli biondo chiaro freddo con frangia, visti di spalle',
      text: 'Un biondo freddo e luminoso, con la frangia leggera. Mani esperte e buonumore: il nostro segreto.' }
  ];

  var section = document.getElementById('colori');
  var locksEl = document.getElementById('locks');
  var photos = document.getElementById('stage-photos');
  if (section && locksEl && photos) {
    /* each lock is a photo of a real-looking hair lock, coloured like the salon's work,
       hanging from a copper clip */
    var LOCKS = { rosso: [125, 560], rosa: [122, 560], ricci: [153, 560], castano: [124, 560], sfumato: [122, 560], riflessi: [122, 560], chiaro: [122, 560] };
    function lockHTML(sw) {
      var d = LOCKS[sw.lock];
      return '<img class="lock__hair" src="img/ciocca-' + sw.lock + '.webp" width="' + d[0] + '" height="' + d[1] + '" alt="" decoding="async">' +
        '<span class="lock__clip" aria-hidden="true"></span>';
    }

    var buttons = [];
    var imgs = [];
    SWATCHES.forEach(function (sw, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lock';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.setAttribute('aria-label', sw.name);
      b.innerHTML = lockHTML(sw);
      if (sw.lock === 'ricci') b.classList.add('lock--ricci');
      b.addEventListener('click', function () { select(i, false); });
      locksEl.appendChild(b);
      buttons.push(b);

      var im = document.createElement('img');
      im.src = 'img/' + sw.img + '.webp';
      im.width = 800; im.height = 1000;
      im.alt = sw.alt;
      im.decoding = 'async';
      if (i > 0) im.loading = 'lazy';
      photos.appendChild(im);
      imgs.push(im);
    });

    var nameEl = document.getElementById('stage-name');
    var textEl = document.getElementById('stage-text');
    var linkEl = document.getElementById('stage-link');
    var dateEl = document.getElementById('stage-date');
    var current = 0;

    function select(i, focus) {
      current = (i + SWATCHES.length) % SWATCHES.length;
      var sw = SWATCHES[current];
      buttons.forEach(function (b, j) {
        var on = j === current;
        b.setAttribute('aria-checked', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        b.style.setProperty('--d', String(Math.max(-4, Math.min(4, current - j))));
      });
      imgs.forEach(function (im, j) {
        im.classList.toggle('is-on', j === current);
        if (j !== current) im.setAttribute('aria-hidden', 'true'); else im.removeAttribute('aria-hidden');
      });
      section.style.setProperty('--tint', sw.stops[2]);
      ['a', 'b', 'c', 'd', 'e'].forEach(function (k, n) { section.style.setProperty('--sw-' + k, sw.stops[n]); });
      nameEl.textContent = sw.name;
      textEl.textContent = sw.text;
      linkEl.href = sw.url;
      dateEl.textContent = sw.date;
      if (focus) buttons[current].focus();
    }

    locksEl.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = current + 1;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') n = current - 1;
      else if (k === 'Home') n = 0;
      else if (k === 'End') n = SWATCHES.length - 1;
      if (n !== null) { e.preventDefault(); select(n, true); }
    });

    /* swipe on the photo to change colour */
    var sx = null, sy = null;
    photos.style.touchAction = 'pan-y';
    photos.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
    photos.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) select(current + (dx < 0 ? 1 : -1), false);
    });
    photos.addEventListener('pointercancel', function () { sx = null; });

    select(0, false);

    /* one gentle sway when the ring first comes into view */
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.disconnect();
          buttons.forEach(function (b, j) {
            if (j === current) return;
            b.style.animationDelay = (j * 70) + 'ms';
            b.classList.add('sway');
            b.addEventListener('animationend', function done() {
              b.classList.remove('sway');
              b.style.animationDelay = '';
              b.removeEventListener('animationend', done);
            });
          });
        });
      }, { threshold: 0.5 });
      io.observe(locksEl);
    }
  }

  /* ---------- Aperto ora / chiuso (ora di Roma) ---------- */
  var SCHED = { 0: [], 1: [], 2: [[540, 1080]], 3: [[540, 1080]], 4: [[540, 1080]], 5: [[540, 1080]], 6: [[510, 990]] };
  var DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  var status = document.getElementById('status');

  function romeNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
      return { day: day, min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function hhmm(m) { return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }

  function updateStatus() {
    if (!status) return;
    var now = romeNow();
    var today = SCHED[now.day] || [];
    var open = null;
    today.forEach(function (r) { if (now.min >= r[0] && now.min < r[1]) open = r; });
    var rows = document.querySelectorAll('.hours tr');
    rows.forEach(function (tr) { tr.classList.toggle('is-today', tr.getAttribute('data-day') === String(now.day)); });
    if (open) {
      status.dataset.state = 'open';
      status.textContent = 'Aperto ora, chiude alle ' + hhmm(open[1]);
      return;
    }
    status.dataset.state = 'closed';
    var later = today.filter(function (r) { return r[0] > now.min; })[0];
    if (later) { status.textContent = 'Chiuso ora, apre oggi alle ' + hhmm(later[0]); return; }
    for (var k = 1; k <= 7; k++) {
      var d = (now.day + k) % 7;
      if (SCHED[d].length) {
        status.textContent = 'Chiuso ora, riapre ' + (k === 1 ? 'domani' : DAYS[d]) + ' alle ' + hhmm(SCHED[d][0][0]);
        return;
      }
    }
  }
  updateStatus();
  setInterval(updateStatus, 60000);
})();
