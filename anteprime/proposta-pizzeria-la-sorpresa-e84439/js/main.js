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

  /* ---------- strisce orizzontali che scorrono con la pagina ---------- */
  function hscroll(sec) {
    var pin = sec.querySelector('.hs-pin');
    var track = sec.querySelector('[data-track]');
    if (!pin || !track) return;
    var dist = 0;
    function measure() {
      sec.classList.remove('is-pinned');
      sec.style.height = '';
      track.style.transform = '';
      dist = 0;
      if (reduce.matches) return;
      sec.classList.add('is-pinned');
      dist = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      if (dist < 40 || pin.scrollHeight > window.innerHeight + 2) {
        sec.classList.remove('is-pinned');
        dist = 0;
        return;
      }
      sec.style.height = (pin.offsetHeight + dist) + 'px';
      update();
    }
    function update() {
      if (!dist) return;
      var top = sec.getBoundingClientRect().top;
      var p = Math.min(1, Math.max(0, -top / dist));
      track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (reduce.addEventListener) reduce.addEventListener('change', measure);
    measure();
  }
  document.querySelectorAll('[data-hscroll]').forEach(hscroll);

  if (!window.Pizza) return;

  /* ---------- il menu da tavolo ---------- */
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

  /* ---------- la Estate che si compone mentre scorri ---------- */
  var buildBox = document.querySelector('[data-build]');
  var buildEl = document.querySelector('[data-pizza="build"]');
  var builder = null;
  if (buildEl) {
    builder = new window.Pizza(buildEl);
    var estate = MENU.filter(function (p) { return p.name === 'Estate'; })[0];
    builder.prepareBuild(estate, 0.22, 0.98);
  }
  function updateBuild() {
    if (!builder) return;
    if (reduce.matches) { builder.build(1); return; }
    var r = buildEl.getBoundingClientRect(), vh = window.innerHeight;
    var start = vh * 0.98, end = vh * 0.38 - r.height / 2;
    var p = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
    builder.build(p);
  }
  window.addEventListener('scroll', updateBuild, { passive: true });
  window.addEventListener('resize', updateBuild);
  updateBuild();

  /* ---------- scegli la tua pizza ---------- */
  var pickEl = document.querySelector('[data-pizza="pick"]');
  var nameEl = document.querySelector('[data-pick-name]');
  var ingrEl = document.querySelector('[data-pick-ingr]');
  var picker = pickEl ? new window.Pizza(pickEl) : null;
  var buttons = [];

  function choose(i, animate) {
    var p = MENU[i];
    buttons.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    nameEl.textContent = p.name;
    ingrEl.textContent = p.text;
    pickEl.setAttribute('aria-label', p.base === 'mistero' ? p.name + ': gli ingredienti sono una sorpresa' : 'Pizza ' + p.name + ': ' + p.text);
    picker.show(p, animate && !reduce.matches);
  }

  if (picker) {
    ['classiche', 'speciali'].forEach(function (g) {
      var list = document.querySelector('[data-list="' + g + '"]');
      MENU.forEach(function (p, i) {
        if (p.group !== g) return;
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'row' + (p.base === 'mistero' ? ' row--mistero' : '');
        b.setAttribute('aria-pressed', 'false');
        var n = document.createElement('span'); n.className = 'row__name'; n.textContent = p.name;
        var t = document.createElement('span'); t.className = 'row__ingr'; t.textContent = p.text;
        b.appendChild(n); b.appendChild(t);
        b.addEventListener('click', function () { choose(i, true); });
        li.appendChild(b);
        list.appendChild(li);
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
      pickEl.classList.add('is-spin');
      setTimeout(function () { choose(i, true); }, 260);
      setTimeout(function () { pickEl.classList.remove('is-spin'); spinning = false; }, 640);
    });
  }
})();
