(function () {
  'use strict';

  /* ---------- aperto / chiuso (tutti i giorni 11-14:30, 18-23) ---------- */
  var RANGES = [[660, 870], [1080, 1380]];
  function romeNow() {
    try { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' })); } catch (e) { return new Date(); }
  }
  function hhmm(m) { var h = Math.floor(m / 60), mm = m % 60; return h + ':' + (mm < 10 ? '0' : '') + mm; }
  function status() {
    var now = romeNow(), m = now.getHours() * 60 + now.getMinutes();
    for (var i = 0; i < RANGES.length; i++) {
      var r = RANGES[i];
      if (m >= r[0] && m < r[1]) {
        return { open: true, text: r[1] - m <= 30 ? 'Aperto, chiude tra poco (' + hhmm(r[1]) + ')' : 'Aperto ora, fino alle ' + hhmm(r[1]) };
      }
      if (m < r[0]) return { open: false, text: 'Chiuso ora, riapre alle ' + hhmm(r[0]) };
    }
    return { open: false, text: 'Chiuso ora, riapre domani alle 11:00' };
  }
  function renderStatus() {
    var s = status();
    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      var t = el.querySelector('[data-status-text]');
      if (t) t.textContent = s.text;
    });
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!window.Pizza) return;

  /* ---------- hero: la Estate nasce mentre scorri ---------- */
  var STEPS = [
    ['L\'impasto', 'Acqua, sale, olio, lievito di birra, farina 00-0, grano e zucchero: gli ingredienti base della nostra pasta, scritti anche sul menu.'],
    ['Il pomodoro', 'Si parte dal pomodoro, steso su tutto il disco.'],
    ['La mozzarella', 'Poi la mozzarella, a pezzi, fino al bordo.'],
    ['Il pomodoro a fette', 'Questa è la Estate, una delle nostre speciali: sopra va il pomodoro a fette.'],
    ['Il forno a legna', 'Dentro il forno a legna, finché il cornicione non prende colore.'],
    ['Il basilico', 'Ecco la Estate: pomodoro, mozzarella, pomodoro a fette e basilico. Più giù le trovi tutte.']
  ];
  var hero = document.querySelector('[data-hero]');
  var heroPin = hero && hero.querySelector('.hero__pin');
  var buildSvg = document.querySelector('[data-pizza="build"]');
  var stepTitle = document.querySelector('[data-step-title]');
  var stepText = document.querySelector('[data-step-text]');
  var stepDots = Array.prototype.slice.call(document.querySelectorAll('.steps__dots li'));
  var introTitle = stepTitle ? stepTitle.textContent : '';
  var introText = stepText ? stepText.textContent : '';
  var builder = null, currentStep = -2, range = 1;

  if (buildSvg) {
    builder = new window.Pizza(buildSvg);
    builder.prepareBuild();
  }

  function setStep(i) {
    if (i === currentStep) return;
    currentStep = i;
    if (i < 0) { stepTitle.textContent = introTitle; stepText.textContent = introText; }
    else { stepTitle.textContent = STEPS[i][0]; stepText.textContent = STEPS[i][1]; }
    stepDots.forEach(function (d, k) { d.classList.toggle('on', k <= i); });
  }

  function measureHero() {
    if (!hero) return;
    var pinned = !reduce.matches;
    hero.classList.toggle('is-pinned', pinned);
    range = Math.max(1, hero.offsetHeight - heroPin.offsetHeight);
    updateHero();
  }
  function updateHero() {

    if (!builder) return;
    if (reduce.matches) { builder.build(1); setStep(-1); return; }
    var top = hero.getBoundingClientRect().top;
    var p = Math.min(1, Math.max(0, -top / range));
    builder.build(p);
    setStep(p < 0.04 ? -1 : Math.min(STEPS.length - 1, Math.floor((p - 0.04) / 0.96 * STEPS.length)));
  }
  // aggiornamento diretto: è leggero e non dipende da requestAnimationFrame
  window.addEventListener('scroll', updateHero, { passive: true });
  window.addEventListener('resize', measureHero);
  window.addEventListener('load', measureHero);
  if (reduce.addEventListener) reduce.addEventListener('change', measureHero);
  measureHero();

  /* ---------- scegli la tua pizza (menu da tavolo) ---------- */
  var MENU = [
    ['classiche', 'Marinara', 'rossa', [], ['aglio', 'origano'], 'Pomodoro, aglio, origano'],
    ['classiche', 'Margherita', 'rossa', ['mozzarella'], [], 'Pomodoro, mozzarella'],
    ['classiche', 'Romana', 'rossa', ['mozzarella'], ['acciughe', 'origano'], 'Pomodoro, mozzarella, acciughe, origano'],
    ['classiche', 'Napoletana', 'rossa', ['mozzarella'], ['acciughe', 'capperi', 'origano'], 'Pomodoro, mozzarella, acciughe, capperi, origano'],
    ['classiche', 'Prosciutto', 'rossa', ['mozzarella'], ['cotto'], 'Pomodoro, mozzarella, prosciutto cotto'],
    ['classiche', 'Funghi', 'rossa', ['mozzarella'], ['funghi'], 'Pomodoro, mozzarella, funghi'],
    ['classiche', 'Prosciutto funghi', 'rossa', ['mozzarella'], ['cotto', 'funghi'], 'Pomodoro, mozzarella, prosciutto cotto, funghi'],
    ['classiche', 'Capricciosa', 'rossa', ['mozzarella'], ['cotto', 'funghi', 'carciofi', 'olive'], 'Pomodoro, mozzarella, prosciutto cotto, funghi, carciofi, olive'],
    ['classiche', '4 Stagioni', 'rossa', ['mozzarella'], ['cotto', 'funghi', 'carciofi', 'peperoni'], 'Pomodoro, mozzarella, prosciutto cotto, funghi, carciofi, peperoni'],
    ['classiche', '4 Formaggi', 'rossa', ['mozzarella'], ['formaggi'], 'Pomodoro, mozzarella, formaggi misti'],
    ['classiche', 'Siciliana', 'rossa', ['mozzarella'], ['acciughe', 'capperi', 'salamino', 'olive', 'origano'], 'Pomodoro, mozzarella, acciughe, capperi, salamino piccante, olive, origano'],
    ['classiche', 'Tonno', 'rossa', ['mozzarella'], ['tonno'], 'Pomodoro, mozzarella, tonno'],
    ['classiche', 'Tonno cipolla', 'rossa', ['mozzarella'], ['tonno', 'cipolla'], 'Pomodoro, mozzarella, tonno, cipolla'],
    ['classiche', 'Vegetariana', 'rossa', ['mozzarella'], ['verdure'], 'Pomodoro, mozzarella, verdure miste'],
    ['classiche', 'Parmigiana', 'rossa', ['mozzarella'], ['melanzane', 'peperoni', 'grana'], 'Pomodoro, mozzarella, melanzane, peperoni, grana'],
    ['classiche', 'Calzone', 'calzone', [], [], 'Pomodoro, mozzarella, prosciutto cotto, funghi'],
    ['classiche', 'Calzone spinaci', 'calzone', [], [], 'Spinaci, ricotta, mozzarella'],
    ['classiche', 'Calzone Terri', 'calzone', [], [], 'Mozzarella, ricotta, chiodini'],
    ['classiche', 'Calzone Gianni', 'calzone', [], [], 'Mozzarella, patate, ricotta, radicchio, più lardo all\'uscita'],
    ['classiche', 'Porcini', 'rossa', ['mozzarella'], ['porcini', 'grana'], 'Pomodoro, mozzarella, porcini, grana'],
    ['classiche', 'Würstel', 'rossa', ['mozzarella'], ['wurstel'], 'Pomodoro, mozzarella, würstel'],
    ['classiche', 'Salamino piccante', 'rossa', ['mozzarella'], ['salamino'], 'Pomodoro, mozzarella, salamino piccante'],
    ['classiche', 'Verde crudo', 'rossa', ['mozzarella'], ['gorgonzola', 'crudo'], 'Pomodoro, mozzarella, gorgonzola, prosciutto crudo'],
    ['classiche', 'Verde speck', 'rossa', ['mozzarella'], ['speck', 'gorgonzola'], 'Pomodoro, mozzarella, speck, gorgonzola'],

    ['speciali', 'La Sorpresa', 'mistero', [], [], 'Per una, due o tre persone. Gli ingredienti sul menu non ci sono: chiedeteli a noi, o fidatevi.'],
    ['speciali', 'Estasi', 'rossa', ['mozzarella'], ['funghi', 'pancetta', 'aglio', 'origano'], 'Pomodoro, mozzarella, funghi, pancetta, aglio, origano'],
    ['speciali', 'Rucola', 'rossa', ['mozzarella', 'philadelphia'], ['rucola', 'grana'], 'Pomodoro, mozzarella, formaggio philadelphia, rucola, grana'],
    ['speciali', 'Radicchio', 'rossa', ['mozzarella'], ['radicchio'], 'Pomodoro, mozzarella, radicchio'],
    ['speciali', 'Saporita', 'rossa', ['mozzarella'], ['cotto', 'porcini', 'grana', 'salamino'], 'Pomodoro, mozzarella, prosciutto cotto, porcini, grana, salamino'],
    ['speciali', 'Golosa', 'rossa', ['mozzarella', 'gorgonzola'], ['finocchio', 'grana'], 'Pomodoro, mozzarella, formaggio verde, finocchio, grana'],
    ['speciali', 'Estate', 'rossa', ['mozzarella'], ['pomodoro', 'basilico'], 'Pomodoro, mozzarella, pomodoro a fette, basilico'],
    ['speciali', 'Estate con bufala', 'rossa', ['mozzarella', 'bufala'], ['pomodoro', 'basilico'], 'Pomodoro, mozzarella, pomodoro a fette, basilico, bufala'],
    ['speciali', 'Gustosa', 'rossa', [], ['aglio', 'peperoncino', 'grana', 'crudo', 'basilico'], 'Pomodoro, aglio, peperoncino, grana, prosciutto crudo, basilico'],
    ['speciali', 'Veneta', 'rossa', ['mozzarella'], ['salsiccia', 'cipolla'], 'Pomodoro, mozzarella, salsiccia, cipolla'],
    ['speciali', 'Zucchini', 'rossa', ['mozzarella'], ['cotto', 'zucchine', 'grana'], 'Pomodoro, mozzarella, prosciutto cotto, zucchini, grana'],
    ['speciali', 'Lardo', 'rossa', ['mozzarella'], ['lardo', 'radicchio'], 'Pomodoro, mozzarella, lardo, radicchio'],
    ['speciali', 'Philadelphia', 'rossa', ['mozzarella', 'philadelphia'], ['pancetta'], 'Pomodoro, mozzarella, pancetta, philadelphia'],
    ['speciali', 'Boscaiola', 'rossa', ['mozzarella'], ['bosco'], 'Pomodoro, mozzarella, funghi misti di bosco'],
    ['speciali', 'Solita', 'rossa', ['mozzarella'], ['radicchio', 'lardo', 'rucola', 'grana'], 'Pomodoro, mozzarella, radicchio, lardo, rucola, grana'],
    ['speciali', 'Delicata', 'rossa', ['mozzarella', 'gorgonzola'], ['noci'], 'Pomodoro, mozzarella, formaggio verde, noci'],
    ['speciali', 'Paesana', 'rossa', ['mozzarella'], ['tonno', 'cipolla', 'fagioli', 'origano'], 'Pomodoro, mozzarella, tonno, cipolla, fagioli, origano'],
    ['speciali', 'Alle patate', 'bianca', ['mozzarella'], ['patate', 'rosmarino'], 'Mozzarella, patate, rosmarino'],
    ['speciali', 'La Bufala', 'rossa', ['bufala'], [], 'Pomodoro, mozzarella di bufala'],
    ['speciali', 'Pizza Tartufo', 'bianca', ['mozzarella'], ['tartufo', 'zucchine', 'radicchio', 'chiodini'], 'Mozzarella, tartufo, zucchine, radicchio, chiodini'],
    ['speciali', 'Pizza OK', 'rossa', [], ['tartufo', 'zucchine', 'radicchio', 'chiodini'], 'Pomodoro, tartufo, zucchine, radicchio, chiodini'],
    ['speciali', 'Patti', 'rossa', ['mozzarella'], ['melanzane', 'zucchine', 'cotto', 'grana'], 'Pomodoro, mozzarella, melanzane, zucchine, prosciutto cotto, grana a scaglie'],
    ['speciali', 'Idea del pizzaiolo', 'mistero', [], [], 'Il nome dice tutto: la sceglie il pizzaiolo.']
  ].map(function (r) { return { group: r[0], name: r[1], base: r[2], cheese: r[3], top: r[4], text: r[5] }; });

  var pickSvg = document.querySelector('[data-pizza="pick"]');
  var nameEl = document.querySelector('[data-pick-name]');
  var ingrEl = document.querySelector('[data-pick-ingr]');
  var picker = pickSvg ? new window.Pizza(pickSvg) : null;
  var buttons = [];

  function choose(i, animate) {
    var p = MENU[i];
    buttons.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    nameEl.textContent = p.name;
    ingrEl.textContent = p.text;
    var label = p.base === 'mistero' ? p.name + ': gli ingredienti sono una sorpresa' : 'Pizza ' + p.name + ': ' + p.text;
    pickSvg.setAttribute('aria-label', label);
    picker.show(p, animate && !reduce.matches);
  }

  if (picker) {
    ['classiche', 'speciali'].forEach(function (g) {
      var box = document.querySelector('[data-chips="' + g + '"]');
      MENU.forEach(function (p, i) {
        if (p.group !== g) return;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip' + (p.base === 'mistero' ? ' chip--mistero' : '');
        b.textContent = p.name;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { choose(i, true); });
        box.appendChild(b);
        buttons[i] = b;
      });
    });
    choose(1, false);

    var rnd = document.querySelector('[data-random]');
    var last = 1, spinning = false;
    rnd.addEventListener('click', function () {
      if (spinning) return;
      var i;
      do { i = Math.floor(Math.random() * MENU.length); } while (i === last);
      last = i;
      if (reduce.matches) { choose(i, false); return; }
      spinning = true;
      pickSvg.classList.add('is-spin');
      setTimeout(function () { choose(i, true); }, 260);
      setTimeout(function () { pickSvg.classList.remove('is-spin'); spinning = false; }, 640);
    });
  }
})();
