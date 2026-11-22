/* N1 BarberShop Dossobuono: proposta Insegna
   1. Orari: "Aperto ora / Chiuso, riapriamo ..." (prova: ?ora=HH:MM&giorno=N, 0 = domenica)
   2. Apertura: l'insegna traforata; scorrendo si entra dalla "1". */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* ---------- 1. Orari ---------- */
  var ORARI = {
    0: [],
    1: [],
    2: [[540, 750], [900, 1170]],
    3: [[540, 750], [900, 1170]],
    4: [[540, 750], [900, 1170]],
    5: [[540, 750], [840, 1110]],
    6: [[480, 930]]
  };
  var GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

  function hhmm(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + ':' + (m < 10 ? '0' : '') + m;
  }

  function adesso() {
    var d = new Date();
    var giorno = d.getDay();
    var minuti = d.getHours() * 60 + d.getMinutes();
    var q = new URLSearchParams(location.search);
    var ora = q.get('ora'), g = q.get('giorno');
    if (ora && /^\d{1,2}:\d{2}$/.test(ora)) {
      var p = ora.split(':');
      minuti = Math.min(1439, parseInt(p[0], 10) * 60 + parseInt(p[1], 10));
    }
    if (g !== null && /^[0-6]$/.test(g)) giorno = parseInt(g, 10);
    return { giorno: giorno, minuti: minuti };
  }

  function stato() {
    var t = adesso();
    var oggi = ORARI[t.giorno];
    for (var i = 0; i < oggi.length; i++) {
      if (t.minuti >= oggi[i][0] && t.minuti < oggi[i][1]) {
        return { aperto: true, giorno: t.giorno, testo: 'Aperto ora, chiudiamo alle ' + hhmm(oggi[i][1]) + '.' };
      }
    }
    for (var j = 0; j < oggi.length; j++) {
      if (t.minuti < oggi[j][0]) {
        return { aperto: false, giorno: t.giorno, testo: 'Chiuso, riapriamo oggi alle ' + hhmm(oggi[j][0]) + '.' };
      }
    }
    for (var k = 1; k <= 7; k++) {
      var gg = (t.giorno + k) % 7;
      if (ORARI[gg].length) {
        var quando = k === 1 ? 'domani' : GIORNI[gg];
        return { aperto: false, giorno: t.giorno, testo: 'Chiuso, riapriamo ' + quando + ' alle ' + hhmm(ORARI[gg][0][0]) + '.' };
      }
    }
    return { aperto: false, giorno: t.giorno, testo: 'Chiuso.' };
  }

  function aggiornaOrari() {
    var s = stato();
    var lungo = doc.querySelector('[data-stato]');
    if (lungo) {
      lungo.textContent = s.testo;
      lungo.classList.toggle('is-aperto', s.aperto);
      lungo.classList.toggle('is-chiuso', !s.aperto);
    }
    var breve = doc.querySelector('[data-stato-breve]');
    if (breve) {
      breve.textContent = s.aperto ? 'Aperto ora' : 'Chiuso ora';
      breve.setAttribute('aria-label', s.testo + ' Vai agli orari.');
      breve.classList.toggle('is-aperto', s.aperto);
      breve.classList.toggle('is-chiuso', !s.aperto);
    }
    var righe = doc.querySelectorAll('.orari tr[data-giorno]');
    for (var r = 0; r < righe.length; r++) {
      righe[r].classList.toggle('is-oggi', parseInt(righe[r].getAttribute('data-giorno'), 10) === s.giorno);
    }
  }
  aggiornaOrari();
  setInterval(aggiornaOrari, 60000);

  /* ---------- 2. Apertura: l'insegna ---------- */
  var stage = doc.querySelector('.stage');
  var scene = doc.querySelector('.stage__scene');
  var sign = doc.querySelector('.stage__sign');
  var hero = doc.querySelector('.stage__hero');
  var top = doc.querySelector('.stage__top');
  var veil = doc.querySelector('.stage__veil');
  var photo = doc.querySelector('.stage__photo');
  var shadow = doc.querySelector('.sign__shadow');
  var fine = doc.querySelector('.stage__end');
  var fineTesto = doc.querySelector('.stage__end-testo');
  var barra = doc.querySelector('.barra');
  if (!stage || !sign || !hero) return;

  // Coordinate dell'insegna (stesse del disegno SVG)
  var INSEGNA = { cx: 777.5, cy: 796, w: 855, h: 1288 };
  // Centro dell'asta della "1": da qui si entra
  var META = { x: 987.5, y: 868 };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var anima = !reduce.matches;
  root.classList.toggle('anima', anima);

  var L = null;
  var inCoda = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

  function misura() {
    var vw = scene.clientWidth, vh = scene.clientHeight;
    if (!vw || !vh) return;
    var largo = vw >= 900;
    var s0, sx, sy;
    if (largo) {
      var destraTesto = hero.offsetLeft + hero.offsetWidth;
      var area = { x: destraTesto + 40, w: vw - destraTesto - 40 - Math.max(48, vw * .05) };
      var altoTop = top.offsetHeight;
      // margine sotto: all'apertura la fascia "Proposta di Insegna" spinge giù la scena
      var areaH = vh - altoTop - 104;
      s0 = Math.min(areaH / INSEGNA.h, area.w / INSEGNA.w, 0.62);
      sx = area.x + area.w / 2;
      sy = altoTop + areaH / 2;
    } else {
      var sopra = top.offsetHeight + 10;
      var sotto = hero.offsetTop - 26;
      var disp = Math.max(150, sotto - sopra);
      s0 = Math.min(disp / INSEGNA.h, (vw * .7) / INSEGNA.w);
      sx = vw / 2;
      sy = sopra + disp / 2;
    }
    // A: quando il testo se ne va, l'insegna va al centro e cresce un poco
    var sA = Math.min(s0 * 1.22, (vh * .78) / INSEGNA.h, (vw * .8) / INSEGNA.w);
    if (sA < s0) sA = s0;
    // B: larghezza finale della vista tutta dentro l'asta della "1" (x 935-1040, y 640-1100)
    var W1 = Math.min(90, 440 * vw / vh);
    L = {
      vw: vw, vh: vh,
      s0: s0, sA: sA, s1: vw / W1,
      t0x: sx + (META.x - INSEGNA.cx) * s0,
      t0y: sy + (META.y - INSEGNA.cy) * s0,
      tAx: vw / 2 + (META.x - INSEGNA.cx) * sA,
      tAy: vh / 2 + (META.y - INSEGNA.cy) * sA
    };
  }

  // a: avanzamento della fase A (0-1), b: della fase B (0-1)
  function vista(a, b) {
    var s, tx, ty;
    if (b <= 0) {
      s = L.s0 * Math.pow(L.sA / L.s0, a);
      tx = L.t0x + (L.tAx - L.t0x) * a;
      ty = L.t0y + (L.tAy - L.t0y) * a;
    } else {
      s = L.sA * Math.pow(L.s1 / L.sA, b);
      tx = L.tAx + (L.vw / 2 - L.tAx) * b;
      ty = L.tAy + (L.vh / 2 - L.tAy) * b;
    }
    var W = L.vw / s, H = L.vh / s;
    var x = META.x - tx / s, y = META.y - ty / s;
    sign.setAttribute('viewBox', x.toFixed(2) + ' ' + y.toFixed(2) + ' ' + W.toFixed(2) + ' ' + H.toFixed(2));
  }

  function disegna() {
    inCoda = false;
    if (!L) return;
    if (!anima) {
      vista(0, 0);
      return;
    }
    var r = stage.getBoundingClientRect();
    var corsa = stage.offsetHeight - L.vh;
    var p = corsa > 0 ? clamp(-r.top / corsa, 0, 1) : 0;

    // testo d'apertura: se ne va per primo
    var a = 1 - easeOut(clamp(p / .09, 0, 1));
    var su = ((1 - a) * -28).toFixed(1);
    hero.style.opacity = a.toFixed(3);
    hero.style.transform = 'translate3d(0,' + su + 'px,0)';
    hero.style.visibility = a <= 0.001 ? 'hidden' : '';
    top.style.opacity = a.toFixed(3);
    top.style.visibility = a <= 0.001 ? 'hidden' : '';

    // A: l'insegna va al centro; B: ci si avvicina e si passa dentro la "1"
    var fa = easeInOut(clamp((p - .02) / .16, 0, 1));
    var t = clamp((p - .18) / .6, 0, 1);
    var e = easeInOutSine(t);
    vista(fa, e);
    sign.style.visibility = e >= 0.9995 ? 'hidden' : '';
    shadow.style.opacity = (1 - clamp(t / .4, 0, 1)).toFixed(3);
    veil.style.opacity = (1 - easeInOut(clamp((t - .3) / .4, 0, 1))).toFixed(3);
    photo.style.transform = 'scale(' + (1.15 - .15 * e).toFixed(4) + ')';

    // dentro il negozio
    var f = easeOut(clamp((p - .8) / .1, 0, 1));
    fine.style.opacity = f.toFixed(3);
    fine.style.visibility = f <= 0.001 ? 'hidden' : 'visible';
    if (fineTesto) fineTesto.style.transform = 'translate3d(0,' + ((1 - f) * 18).toFixed(1) + 'px,0)';

    if (barra) barra.classList.toggle('is-on', p > .1 || r.bottom < L.vh);
  }

  function chiedi() {
    if (!inCoda) {
      inCoda = true;
      requestAnimationFrame(disegna);
    }
  }

  function rimisura() {
    misura();
    disegna();
  }

  function barraSenzaAnima() {
    if (!barra) return;
    var r = stage.getBoundingClientRect();
    barra.classList.toggle('is-on', r.bottom < window.innerHeight * .55);
  }

  rimisura();
  root.classList.add('pronto');

  if ('ResizeObserver' in window) {
    var ultimo = '';
    new ResizeObserver(function () {
      var k = scene.clientWidth + 'x' + scene.clientHeight + 'x' + hero.offsetHeight;
      if (k !== ultimo) { ultimo = k; rimisura(); }
    }).observe(scene);
  } else {
    window.addEventListener('resize', rimisura);
  }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(rimisura);

  window.addEventListener('scroll', function () {
    if (anima) chiedi(); else barraSenzaAnima();
  }, { passive: true });
  if (!anima) barraSenzaAnima();

  function cambiaMovimento() {
    anima = !reduce.matches;
    root.classList.toggle('anima', anima);
    [hero, top, sign, veil, photo, shadow, fine].forEach(function (el) {
      if (el) { el.removeAttribute('style'); }
    });
    if (fineTesto) fineTesto.removeAttribute('style');
    rimisura();
    if (!anima) barraSenzaAnima();
  }
  if (reduce.addEventListener) reduce.addEventListener('change', cambiaMovimento);
})();
