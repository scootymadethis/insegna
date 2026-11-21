/* Pizza disegnata in SVG: impasto, pomodoro, mozzarella e ingredienti del menu. */
(function () {
  'use strict';

  var C = 200;
  var uid = 0;

  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function f(n) { return Math.round(n * 10) / 10; }

  function blob(r, R, n, jit, aj) {
    n = n || 9; jit = jit || 0.2; aj = aj === undefined ? 0.3 : aj;
    var pts = [], i, d = '';
    for (i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2 + R() * aj;
      var rr = r * (1 - jit + R() * jit * 2);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    for (i = 0; i < n; i++) {
      var p0 = pts[i], p1 = pts[(i + 1) % n];
      if (i === 0) {
        var pl = pts[n - 1];
        d += 'M' + f((pl[0] + p0[0]) / 2) + ' ' + f((pl[1] + p0[1]) / 2);
      }
      d += 'Q' + f(p0[0]) + ' ' + f(p0[1]) + ' ' + f((p0[0] + p1[0]) / 2) + ' ' + f((p0[1] + p1[1]) / 2);
    }
    return d + 'Z';
  }
  function dots(R, n, spread, r0, r1, fill) {
    var s = '';
    for (var i = 0; i < n; i++) {
      s += '<circle cx="' + f((R() - 0.5) * spread) + '" cy="' + f((R() - 0.5) * spread) + '" r="' + f(r0 + R() * (r1 - r0)) + '" fill="' + fill + '"/>';
    }
    return s;
  }
  var MUSH = 'M-11 0C-11-9 11-9 11 0C11 3 6 3 4 2L4 9C4 11-4 11-4 9L-4 2C-6 3-11 3-11 0Z';
  var LEAF = 'M0-14C9-8 9 6 0 14C-9 6-9-8 0-14Z';
  var RIBBON = 'M-19-3C-11-11-3 5 5-3S17-7 20 0L18 6C10 12 2-2-6 6S-16 7-20 3Z';

  /* ogni ingrediente: disegno, quantità, raggio massimo */
  var G = {
    mozzarella: { n: 16, s: 1.1, draw: function (R) { return '<path d="' + blob(14 + R() * 6, R, 9, 0.25) + '" fill="#fffdf2" stroke="#e8d9b4" stroke-width="1.2"/><path d="' + blob(5, R, 7, 0.3) + '" fill="#fff" transform="translate(-3 -4)"/>'; } },
    bufala: { n: 6, s: 1.15, draw: function () { return '<circle r="17" fill="#fffef9" stroke="#ded5bc" stroke-width="1.6"/><ellipse cx="-5" cy="-6" rx="6" ry="4" fill="#fff"/>'; } },
    ricotta: { n: 9, draw: function (R) { return '<path d="' + blob(11, R, 11, 0.32) + '" fill="#fffefa" stroke="#e9e3d6" stroke-width="1"/>' + dots(R, 3, 10, 0.8, 1.4, '#efe8da'); } },
    formaggi: { n: 12, s: 1.15, draw: function (R) { var c = ['#f6dc8c', '#fff6dc', '#f0cf73'][Math.floor(R() * 3)]; return '<path d="' + blob(11 + R() * 4, R, 8, 0.25) + '" fill="' + c + '" stroke="#dcb860" stroke-width="1"/>'; } },
    gorgonzola: { n: 8, draw: function (R) { return '<path d="' + blob(11, R, 8, 0.28) + '" fill="#f4efd9" stroke="#d9d0b2" stroke-width="1"/>' + dots(R, 5, 13, 1, 1.8, '#5f8a80'); } },
    philadelphia: { n: 8, draw: function () { return '<circle r="9" fill="#fffefb" stroke="#e7e0cc" stroke-width="1.2"/><path d="M-4 0a4 4 0 1 1 4 4" fill="none" stroke="#e7e0cc" stroke-width="1.2"/>'; } },
    grana: { n: 9, draw: function (R) { return '<path d="M-' + f(6 + R() * 4) + '-4L' + f(5 + R() * 5) + '-' + f(5 + R() * 3) + 'L' + f(8 + R() * 3) + ' 3L-' + f(3 + R() * 3) + ' ' + f(5 + R() * 2) + 'Z" fill="#f4e4a8" stroke="#d6b965" stroke-width="1"/>'; } },
    cotto: { n: 7, s: 1.2, draw: function (R) { return '<path d="' + blob(17 + R() * 3, R, 8, 0.22) + '" fill="#f0a39b" stroke="#f8d4ca" stroke-width="3"/>'; } },
    crudo: { n: 6, draw: function () { return '<path d="' + RIBBON + '" fill="#c84049" stroke="#f6d6cf" stroke-width="2"/>'; } },
    speck: { n: 6, draw: function () { return '<path d="' + RIBBON + '" fill="#922c33" stroke="#e8c2b6" stroke-width="2"/>'; } },
    pancetta: { n: 7, draw: function () { return '<rect x="-14" y="-5" width="28" height="10" rx="3" fill="#e5968b"/><rect x="-14" y="-1.6" width="28" height="3.2" fill="#fbe7de"/>'; } },
    lardo: { n: 6, draw: function () { return '<rect x="-15" y="-5" width="30" height="10" rx="4" fill="#fbf4e8" stroke="#eadac0" stroke-width="1"/><rect x="-12" y="-2" width="24" height="1.6" rx=".8" fill="#f2d9cc"/>'; } },
    salamino: { n: 8, draw: function (R) { return '<circle r="12" fill="#b42c24" stroke="#8c1e19" stroke-width="1.6"/>' + dots(R, 6, 15, 0.9, 1.8, '#f0c2ac'); } },
    wurstel: { n: 9, draw: function () { return '<circle r="9" fill="#e19f7b" stroke="#b56d4c" stroke-width="2.2"/><circle r="4" fill="#eab396"/>'; } },
    salsiccia: { n: 14, draw: function (R) { return '<path d="' + blob(6 + R() * 2, R, 7, 0.35) + '" fill="#985838" stroke="#744028" stroke-width="1"/>'; } },
    funghi: { n: 9, draw: function () { return '<path d="' + MUSH + '" fill="#e3d0ab" stroke="#a8875c" stroke-width="1.3"/>'; } },
    porcini: { n: 7, draw: function () { return '<path d="' + MUSH + '" transform="scale(1.25)" fill="#c69561" stroke="#7b5331" stroke-width="1.2"/>'; } },
    chiodini: { n: 12, draw: function () { return '<rect x="-1.6" y="-1" width="3.2" height="8" rx="1.6" fill="#e5d0a8"/><path d="M-6.5 1C-6.5-7 6.5-7 6.5 1Z" fill="#8a5a33"/>'; } },
    carciofi: { n: 6, draw: function () { return '<path d="M0-13C8-9 11 4 0 13C-11 4-8-9 0-13Z" fill="#b6c27b" stroke="#7c8b45" stroke-width="1.6"/><path d="M0-9V9M-4-3L0 0L4-3M-5 4L0 6L5 4" stroke="#7c8b45" stroke-width="1.1" fill="none"/>'; } },
    olive: { n: 8, draw: function () { return '<circle r="6.5" fill="none" stroke="#2b2521" stroke-width="4.6"/>'; } },
    capperi: { n: 14, draw: function () { return '<circle r="3.4" fill="#6c783a"/><circle r="1.2" cx="-1" cy="-1" fill="#9ca75c"/>'; } },
    origano: { n: 10, draw: function (R) { return dots(R, 6, 16, 0.8, 1.4, '#5b682d'); } },
    aglio: { n: 9, draw: function () { return '<ellipse rx="3.4" ry="2.3" fill="#f4ecd5" stroke="#d6c69e" stroke-width=".8"/>'; } },
    acciughe: { n: 6, draw: function () { return '<path d="M-17 0C-8-4.5 8-4.5 17 0C8 3.5-8 3.5-17 0Z" fill="#6a4a36"/><path d="M-14 0H14" stroke="#c2bbae" stroke-width=".9"/>'; } },
    peperoni: { n: 8, draw: function (R) { return '<path d="M-14 4C-8-8 8-8 14 4" fill="none" stroke="' + (R() < 0.5 ? '#d8341e' : '#f0b52e') + '" stroke-width="5.6" stroke-linecap="round"/>'; } },
    peperoncino: { n: 7, draw: function () { return '<path d="M-7 1C-3-3 4-3 8 1" stroke="#c8231a" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M-7 1l-2-1" stroke="#4f7d2c" stroke-width="2" stroke-linecap="round"/>'; } },
    tonno: { n: 10, draw: function (R) { return '<path d="' + blob(7 + R() * 2, R, 8, 0.35) + '" fill="#d9b49b" stroke="#b68e72" stroke-width="1"/>'; } },
    cipolla: { n: 9, draw: function () { return '<path d="M-11 0A11 11 0 0 1 11 0" fill="none" stroke="#a4659a" stroke-width="2.6"/><path d="M-6.5 0A6.5 6.5 0 0 1 6.5 0" fill="none" stroke="#d8b2cf" stroke-width="2"/>'; } },
    melanzane: { n: 6, draw: function (R) { return '<circle r="12" fill="#eedfbb" stroke="#4d2345" stroke-width="3.6"/>' + dots(R, 5, 12, 0.7, 1.1, '#c9b48a'); } },
    zucchine: { n: 7, draw: function (R) { return '<circle r="10" fill="#e6e7af" stroke="#3e7a2b" stroke-width="3"/>' + dots(R, 4, 9, 0.6, 1, '#c6c884'); } },
    patate: { n: 9, draw: function () { return '<circle r="12" fill="#f5da92" stroke="#ddb35b" stroke-width="2"/><ellipse cx="-3" cy="-4" rx="4" ry="2.4" fill="#fbe9b8"/>'; } },
    pomodoro: { n: 6, s: 1.5, draw: function () { return '<circle r="16" fill="#e2412a" stroke="#c42f1b" stroke-width="2"/><path d="M0 0L0-11A11 11 0 0 1 9.5 5.5ZM0 0L-9.5 5.5A11 11 0 0 1 0-11Z" fill="#f2765c" opacity=".7"/><circle cx="3" cy="-4" r="1.3" fill="#ffd690"/><circle cx="-3" cy="-4" r="1.3" fill="#ffd690"/><circle cy="4" r="1.3" fill="#ffd690"/>'; } },
    basilico: { n: 6, s: 1.6, draw: function () { return '<path d="' + LEAF + '" fill="#2f8a3a"/><path d="M0-12V12" stroke="#5ab463" stroke-width="1.1"/>'; } },
    rucola: { n: 12, draw: function () { return '<path d="M0-16L4-11L8-12L6-6L10-4L5 0L8 5L3 6L2 12L0 16L-2 12L-3 6L-8 5L-5 0L-10-4L-6-6L-8-12L-4-11Z" fill="#4e8f2f"/>'; } },
    radicchio: { n: 8, draw: function () { return '<path d="M0-14C11-10 12 8 0 14C-12 8-11-10 0-14Z" fill="#8c1f3d"/><path d="M0-12V12M0-4L6-8M0 3L-6-1" stroke="#f2d9df" stroke-width="1.4" fill="none"/>'; } },
    spinaci: { n: 10, draw: function () { return '<path d="' + LEAF + '" transform="scale(1.15)" fill="#2d5a29"/><path d="M0-13V13" stroke="#4e7d44" stroke-width="1"/>'; } },
    rosmarino: { n: 9, draw: function () { return '<path d="M-6-3L6 3M-5 2L5-2M-2-6L2 6" stroke="#5c7f44" stroke-width="1.8" stroke-linecap="round"/>'; } },
    tartufo: { n: 9, draw: function (R) { return '<path d="' + blob(8, R, 8, 0.35) + '" fill="#5a4636" stroke="#3a2b21" stroke-width="1"/><path d="M-4-2L4 2M-3 3L2 0" stroke="#c7b398" stroke-width=".7"/>'; } },
    finocchio: { n: 7, draw: function () { return '<path d="M-12 3C-8-7 8-7 12 3C8 0-8 0-12 3Z" fill="#e3ebc1" stroke="#b5c583" stroke-width="1.2"/>'; } },
    fagioli: { n: 12, draw: function () { return '<ellipse rx="5" ry="3.2" fill="#7b3f2c"/><ellipse rx="2" ry="1" cx="-1.5" cy="-1" fill="#a3624b"/>'; } },
    noci: { n: 9, draw: function (R) { return '<path d="' + blob(6.5, R, 9, 0.35) + '" fill="#8d5f3a" stroke="#64401f" stroke-width="1"/><path d="M-3 0H3M0-3V3" stroke="#b78a62" stroke-width=".8"/>'; } }
  };
  var MIX = {
    verdure: ['zucchine', 'melanzane', 'peperoni'],
    bosco: ['chiodini', 'porcini', 'funghi']
  };

  function el(tag, attrs, parent) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function Pizza(svg) {
    this.svg = svg;
    var id = 'pz' + (++uid);
    var R = rng(7);
    svg.innerHTML =
      '<defs>' +
      '<radialGradient id="' + id + 'd"><stop offset=".8" stop-color="#f1dcae"/><stop offset=".94" stop-color="#e8c88c"/><stop offset="1" stop-color="#d8ae6a"/></radialGradient>' +
      '<radialGradient id="' + id + 'b"><stop offset=".76" stop-color="#e0a054" stop-opacity="0"/><stop offset=".86" stop-color="#d18a3b" stop-opacity=".9"/><stop offset="1" stop-color="#a35a1f"/></radialGradient>' +
      '<radialGradient id="' + id + 's"><stop offset=".72" stop-color="#d73c21"/><stop offset="1" stop-color="#b02812"/></radialGradient>' +
      '</defs>';
    var all = el('g', { 'class': 'pz__all' }, svg);
    el('ellipse', { cx: C, cy: C + 10, rx: 188, ry: 186, fill: 'rgba(8,20,60,.28)', 'class': 'pz__shadow' }, all);
    var doughD = blob(186, R, 40, 0.018, 0.04);
    el('path', { d: doughD, transform: 'translate(200 200)', fill: 'url(#' + id + 'd)', 'class': 'pz__dough' }, all);
    this.bake = el('path', { d: doughD, transform: 'translate(200 200)', fill: 'url(#' + id + 'b)', 'class': 'pz__bake' }, all);
    this.char = el('g', { 'class': 'pz__char' }, all);
    var ch = '';
    for (var i = 0; i < 26; i++) {
      var a = R() * Math.PI * 2, rr = 166 + R() * 16;
      ch += '<ellipse cx="' + f(C + Math.cos(a) * rr) + '" cy="' + f(C + Math.sin(a) * rr) + '" rx="' + f(2 + R() * 4) + '" ry="' + f(1.5 + R() * 2.5) + '" transform="rotate(' + f(a * 57.3) + ' ' + f(C + Math.cos(a) * rr) + ' ' + f(C + Math.sin(a) * rr) + ')" fill="#3d2414" opacity="' + f(0.35 + R() * 0.45) + '"/>';
    }
    this.char.innerHTML = ch;
    this.sauceWrap = el('g', { transform: 'translate(200 200)' }, all);
    this.sauce = el('path', { d: blob(158, R, 34, 0.03, 0.06), fill: 'url(#' + id + 's)', 'class': 'pz__sauce' }, this.sauceWrap);
    this.cheese = el('g', { 'class': 'pz__cheese' }, all);
    this.top = el('g', { 'class': 'pz__top' }, all);
    this.cover = el('g', { 'class': 'pz__cover' }, all);
  }

  function scatter(seedStr, n, rmax, offset) {
    var R = rng(hash(seedStr));
    var pts = [], ga = 2.39996323;
    for (var i = 0; i < n; i++) {
      var r = rmax * Math.sqrt((i + 0.5) / n) * (0.9 + R() * 0.15);
      var t = i * ga + offset + (R() - 0.5) * 0.5;
      pts.push({ x: C + Math.cos(t) * Math.min(r, rmax), y: C + Math.sin(t) * Math.min(r, rmax), rot: Math.floor(R() * 360), R: R });
    }
    return pts;
  }

  function placeMarkup(key, seed, count, rmax, offset, cls, startDelay, stepDelay) {
    var g = G[key];
    if (!g) return '';
    var pts = scatter(seed + key, count, rmax, offset), s = '';
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      s += '<g transform="translate(' + f(p.x) + ' ' + f(p.y) + ') rotate(' + p.rot + ') scale(' + (g.s || 1.35) + ')"><g class="' + cls + '" style="--d:' + Math.round(startDelay + i * stepDelay) + 'ms">' + g.draw(p.R) + '</g></g>';
    }
    return s;
  }

  /* pizza del menu: { name, base: 'rossa'|'bianca'|'calzone'|'mistero', cheese: [..], top: [..] } */
  Pizza.prototype.show = function (p, animate) {
    var svg = this.svg;
    svg.classList.toggle('is-anim', !!animate);
    svg.classList.remove('is-calzone', 'is-mistero', 'is-bianca');
    this.bake.style.opacity = 1;
    this.char.style.opacity = 1;
    this.sauce.style.transform = '';
    this.cover.innerHTML = '';
    if (p.base === 'calzone') { svg.classList.add('is-calzone'); this.cheese.innerHTML = ''; this.top.innerHTML = ''; this.cover.innerHTML = calzone(p.name); return; }
    if (p.base === 'mistero') { svg.classList.add('is-mistero'); this.cheese.innerHTML = ''; this.top.innerHTML = ''; this.cover.innerHTML = box(); return; }
    if (p.base === 'bianca') svg.classList.add('is-bianca');

    var cheese = '', top = '', seed = p.name, delay = 0;
    var cheeseKeys = p.cheese || [];
    var keys = [];
    (p.top || []).forEach(function (k) { if (MIX[k]) keys = keys.concat(MIX[k]); else keys.push(k); });
    var total = 0;
    keys.forEach(function (k) { total += G[k] ? G[k].n : 0; });
    var factor = total > 60 ? 60 / total : 1;
    var counts = keys.map(function (k) {
      return G[k] ? Math.max(3, Math.round(G[k].n * factor * (MIX.verdure.indexOf(k) > -1 && p.top.indexOf('verdure') > -1 ? 0.7 : 1))) : 0;
    });
    var cheeseCounts = cheeseKeys.map(function (k) { return cheeseKeys.length > 1 ? Math.round(G[k].n * 0.6) : G[k].n; });
    var all = counts.concat(cheeseCounts).reduce(function (a, b) { return a + b; }, 0);
    var step = Math.min(26, 950 / Math.max(1, all)); // tutta la pizza si compone in circa un secondo
    cheeseKeys.forEach(function (k, ci) {
      cheese += placeMarkup(k, seed, cheeseCounts[ci], 140, ci * 1.3, 't', delay, step);
      delay += cheeseCounts[ci] * step;
    });
    keys.forEach(function (k, ki) {
      if (!counts[ki]) return;
      top += placeMarkup(k, seed, counts[ki], k === 'basilico' || k === 'rucola' ? 130 : 138, 0.7 + ki * 2.1, 't', delay + 80, step);
      delay += counts[ki] * step;
    });
    this.cheese.innerHTML = cheese;
    this.top.innerHTML = top;
  };

  /* modalità "costruzione": la Estate, che si compone con lo scroll */
  Pizza.prototype.prepareBuild = function () {
    this.svg.classList.add('is-build');
    var s = '';
    var cheese = scatter('estate-moz', 16, 140, 0);
    cheese.forEach(function (p, i) {
      s += '<g transform="translate(' + f(p.x) + ' ' + f(p.y) + ') rotate(' + p.rot + ') scale(1.1)"><g class="b" data-at="' + (0.3 + i * 0.008).toFixed(3) + '">' + G.mozzarella.draw(p.R) + '</g></g>';
    });
    this.cheese.innerHTML = s;
    s = '';
    scatter('estate-pom', 6, 120, 0.9).forEach(function (p, i) {
      s += '<g transform="translate(' + f(p.x) + ' ' + f(p.y) + ') rotate(' + p.rot + ') scale(1.5)"><g class="b" data-at="' + (0.47 + i * 0.022).toFixed(3) + '">' + G.pomodoro.draw(p.R) + '</g></g>';
    });
    scatter('estate-bas', 7, 125, 2.2).forEach(function (p, i) {
      s += '<g transform="translate(' + f(p.x) + ' ' + f(p.y) + ') rotate(' + p.rot + ') scale(1.6)"><g class="b" data-at="' + (0.82 + i * 0.022).toFixed(3) + '">' + G.basilico.draw(p.R) + '</g></g>';
    });
    this.top.innerHTML = s;
    this.items = Array.prototype.slice.call(this.svg.querySelectorAll('.b'));
    this.items.forEach(function (it) { it._at = parseFloat(it.getAttribute('data-at')); });
  };
  Pizza.prototype.build = function (p) {
    var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
    var sauce = clamp((p - 0.13) / 0.13);
    this.sauce.style.transform = 'scale(' + (0.04 + sauce * 0.96).toFixed(3) + ') rotate(' + ((1 - sauce) * -90).toFixed(1) + 'deg)';
    this.sauce.style.opacity = sauce > 0 ? 1 : 0;
    var bake = clamp((p - 0.64) / 0.12);
    this.bake.style.opacity = bake.toFixed(3);
    this.char.style.opacity = bake.toFixed(3);
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      var on = p >= it._at;
      if (on !== it._on) { it._on = on; it.classList.toggle('on', on); }
    }
  };

  function calzone(name) {
    var R = rng(hash(name));
    var spots = '';
    for (var i = 0; i < 14; i++) {
      var a = Math.PI + 0.15 + R() * (Math.PI - 0.3), rr = 60 + R() * 110;
      spots += '<ellipse cx="' + f(C + Math.cos(a) * rr) + '" cy="' + f(C + 30 + Math.sin(a) * rr * 0.62) + '" rx="' + f(3 + R() * 5) + '" ry="' + f(2 + R() * 3) + '" fill="#4a2a14" opacity="' + f(0.25 + R() * 0.4) + '"/>';
    }
    return '<g class="t" style="--d:0ms">' +
      '<path d="M18 238C26 120 120 64 200 64S374 120 382 238C330 262 270 270 200 270S70 262 18 238Z" fill="#e5b471" stroke="#b97a35" stroke-width="3"/>' +
      '<path d="M18 238C70 262 130 270 200 270S330 262 382 238" fill="none" stroke="#c98d47" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 13"/>' +
      '<path d="M70 150C120 110 280 110 330 150" fill="none" stroke="#f3d39b" stroke-width="6" stroke-linecap="round" opacity=".7"/>' + spots + '</g>';
  }
  function box() {
    return '<g class="t" style="--d:0ms"><g transform="rotate(-7 200 200)">' +
      '<rect x="34" y="34" width="332" height="332" rx="14" fill="#c99a62" stroke="#a87a45" stroke-width="3"/>' +
      '<rect x="52" y="52" width="296" height="296" rx="8" fill="none" stroke="#b5864f" stroke-width="2" stroke-dasharray="6 6"/>' +
      '<text x="200" y="262" text-anchor="middle" font-family="Rubik, sans-serif" font-style="italic" font-weight="900" font-size="190" fill="#1d3e9e">?</text>' +
      '</g></g>';
  }

  window.Pizza = Pizza;
})();
