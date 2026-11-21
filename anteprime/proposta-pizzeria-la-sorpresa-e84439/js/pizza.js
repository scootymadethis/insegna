/* Pizza composta con immagini: base (rossa o bianca) e gruppetti di condimenti sparsi sopra. */
(function () {
  'use strict';

  var IMG = 'img/pizza/';

  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* condimenti disponibili: dimensione (frazione del diametro) e quanti gruppetti di solito */
  var T = {
    mozzarella: { s: 0.25, n: 9 },
    bufala: { s: 0.26, n: 6 },
    gorgonzola: { s: 0.22, n: 5 },
    grana: { s: 0.24, n: 5 },
    basilico: { s: 0.21, n: 5, late: true },
    pomodoro: { s: 0.27, n: 5 },
    cotto: { s: 0.28, n: 5 },
    salamino: { s: 0.25, n: 6 },
    funghi: { s: 0.25, n: 6 },
    olive: { s: 0.18, n: 6 },
    carciofi: { s: 0.25, n: 5 },
    wurstel: { s: 0.23, n: 6 },
    tonno: { s: 0.23, n: 6 },
    cipolla: { s: 0.25, n: 5 },
    peperoni: { s: 0.25, n: 5 },
    rucola: { s: 0.3, n: 5, late: true },
    speck: { s: 0.28, n: 5 },
    zucchine: { s: 0.25, n: 5 },
    melanzane: { s: 0.25, n: 5 },
    acciughe: { s: 0.25, n: 5 },
    capperi: { s: 0.15, n: 7 },
    salsiccia: { s: 0.22, n: 6 },
    radicchio: { s: 0.25, n: 5 },
    origano: { s: 0.11, n: 6, late: true }
  };
  /* ingredienti del menu -> immagini (alcuni resi con l'immagine più vicina; quelli senza immagine restano solo nel testo) */
  var VIS = {
    origano: ['origano'], mozzarella: ['mozzarella'], acciughe: ['acciughe'], capperi: ['capperi'],
    cotto: ['cotto'], funghi: ['funghi'], carciofi: ['carciofi'], olive: ['olive'], peperoni: ['peperoni'],
    formaggi: ['gorgonzola', 'grana'], salamino: ['salamino'], tonno: ['tonno'], cipolla: ['cipolla'],
    verdure: ['zucchine', 'melanzane', 'peperoni'], melanzane: ['melanzane'], grana: ['grana'],
    porcini: ['funghi'], chiodini: ['funghi'], bosco: ['funghi'], wurstel: ['wurstel'], gorgonzola: ['gorgonzola'],
    crudo: ['speck'], speck: ['speck'], pancetta: ['speck'], bufala: ['bufala'], pomodoro: ['pomodoro'],
    basilico: ['basilico'], salsiccia: ['salsiccia'], zucchine: ['zucchine'], radicchio: ['radicchio'],
    rucola: ['rucola']
  };

  function visual(keys) {
    var out = [];
    keys.forEach(function (k) {
      (VIS[k] || []).forEach(function (v) { if (T[v] && out.indexOf(v) === -1) out.push(v); });
    });
    return out;
  }

  /* posizioni sparse in modo uniforme (spirale aurea con un po' di caso), in coordinate unitarie */
  function spots(seed, n, offset) {
    var R = rng(hash(seed)), pts = [], ga = 2.39996323;
    for (var i = 0; i < n; i++) {
      var r = Math.min(1, Math.sqrt((i + 0.6) / n) * (0.9 + R() * 0.16));
      var t = i * ga + offset + (R() - 0.5) * 0.5;
      pts.push({ ux: Math.cos(t) * r, uy: Math.sin(t) * r, rot: Math.floor(R() * 360), sc: 0.88 + R() * 0.22 });
    }
    return pts;
  }
  function place(pt, k) {
    var rr = reach(k);
    return { x: 50 + pt.ux * rr, y: 50 + pt.uy * rr, rot: pt.rot, sc: pt.sc };
  }
  /* distribuisce i posti tra più ingredienti, alternandoli */
  function share(seed, keys, counts, offset) {
    var left = counts.slice(), seq = [], more = true;
    while (more) {
      more = false;
      keys.forEach(function (k, i) { if (left[i] > 0) { seq.push(k); left[i]--; more = true; } });
    }
    var pts = spots(seed, seq.length, offset);
    return keys.map(function (k) {
      return { key: k, pts: pts.filter(function (_, j) { return seq[j] === k; }).map(function (pt) { return place(pt, k); }) };
    });
  }

  function Pizza(el) {
    this.el = el;
    el.innerHTML =
      '<div class="pizza__spin">' +
      '<img class="pizza__base pizza__base--rossa" src="' + IMG + 'base-rossa.webp" alt="" decoding="async">' +
      '<img class="pizza__base pizza__base--bianca" src="' + IMG + 'base-bianca.webp" alt="" decoding="async">' +
      '<div class="pizza__top"></div></div>';
    this.top = el.querySelector('.pizza__top');
    this.spin = el.querySelector('.pizza__spin');
  }

  function tp(key, p, size, delay) {
    var w = (size * p.sc * 100).toFixed(2);
    return '<img class="tp" src="' + IMG + key + '.webp" alt="" decoding="async" style="left:' + p.x.toFixed(2) + '%;top:' + p.y.toFixed(2) +
      '%;width:' + w + '%;--r:' + p.rot + 'deg;--d:' + Math.round(delay) + 'ms">';
  }

  function reach(k) { return Math.max(16, 43.5 - T[k].s * 100 * 0.4); }

  /* layout dei condimenti per una pizza: [{key, pts}] dal basso verso l'alto */
  Pizza.layout = function (p) {
    var cheese = visual(p.cheese || []);
    var top = visual(p.top || []).filter(function (k) { return cheese.indexOf(k) === -1; });
    var late = top.filter(function (k) { return T[k].late; });
    top = top.filter(function (k) { return !T[k].late; });
    var nTop = top.length + late.length;
    var per = nTop <= 1 ? 1 : nTop === 2 ? 0.8 : nTop === 3 ? 0.62 : 0.5;
    var layers = [];
    if (cheese.length) {
      var cc = cheese.map(function (k) { return Math.max(3, Math.round(T[k].n * (cheese.length > 1 ? 0.62 : 1) * (nTop > 2 ? 0.8 : 1))); });
      layers = layers.concat(share(p.name + '|c', cheese, cc, 0.4));
    }
    if (top.length) {
      layers = layers.concat(share(p.name + '|t', top, top.map(function (k) { return Math.max(3, Math.round(T[k].n * per)); }), 1.9));
    }
    if (late.length) {
      layers = layers.concat(share(p.name + '|l', late, late.map(function (k) { return Math.max(3, Math.round(T[k].n * (late.length > 1 ? 0.7 : 1) * (nTop > 2 ? 0.8 : 1))); }), 3.1));
    }
    return layers;
  };

  /* p = { name, base: 'rossa'|'bianca'|'calzone'|'mistero', cheese: [..], top: [..] } */
  Pizza.prototype.show = function (p, animate) {
    var el = this.el;
    el.classList.toggle('is-anim', !!animate);
    el.classList.remove('is-calzone', 'is-mistero', 'is-bianca');
    if (p.base === 'calzone') { el.classList.add('is-calzone'); this.top.innerHTML = calzone(); return; }
    if (p.base === 'mistero') { el.classList.add('is-mistero'); this.top.innerHTML = box(); return; }
    if (p.base === 'bianca') el.classList.add('is-bianca');
    var layers = Pizza.layout(p);
    var total = 0;
    layers.forEach(function (l) { total += l.pts.length; });
    var step = Math.min(45, 900 / Math.max(1, total)), d = 0, html = '';
    layers.forEach(function (l) {
      l.pts.forEach(function (pt) { html += tp(l.key, pt, T[l.key].s, d); d += step; });
    });
    this.top.innerHTML = html;
  };

  /* costruzione legata allo scroll: ogni gruppetto ha la sua soglia */
  Pizza.prototype.prepareBuild = function (p, from, to) {
    this.el.classList.add('is-build');
    var layers = Pizza.layout(p), html = '';
    var all = [];
    layers.forEach(function (l, li) { l.pts.forEach(function (pt) { all.push({ k: l.key, pt: pt, li: li }); }); });
    var span = (to - from) / Math.max(1, layers.length);
    var counts = layers.map(function (l) { return l.pts.length; });
    var seen = layers.map(function () { return 0; });
    all.forEach(function (a) {
      var at = from + span * a.li + span * 0.8 * (seen[a.li]++ / counts[a.li]);
      html += tp(a.k, a.pt, T[a.k].s, 0).replace('class="tp"', 'class="tp" data-at="' + at.toFixed(3) + '"');
    });
    this.top.innerHTML = html;
    this.items = Array.prototype.slice.call(this.top.querySelectorAll('.tp'));
    this.items.forEach(function (it) { it._at = parseFloat(it.getAttribute('data-at')); });
    this.base = this.el.querySelector('.pizza__base--rossa');
  };
  Pizza.prototype.build = function (p) {
    var b = Math.max(0, Math.min(1, p / 0.2));
    this.base.style.opacity = (0.25 + b * 0.75).toFixed(3);
    this.base.style.transform = 'rotate(' + ((1 - b) * -50).toFixed(1) + 'deg) scale(' + (0.9 + b * 0.1).toFixed(3) + ')';
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i], on = p >= it._at;
      if (on !== it._on) { it._on = on; it.classList.toggle('on', on); }
    }
  };

  var cz = 0;
  function calzone() {
    var id = 'czc' + (++cz), g = 'czg' + cz, R = rng(cz * 7 + 3), dots = '';
    for (var i = 0; i < 9; i++) {
      var x = 0.08 + i * 0.105 + (R() - 0.5) * 0.04, y = 0.5 + 2 * x * (1 - x) * 0.17;
      dots += '<ellipse cx="' + x.toFixed(3) + '" cy="' + (y + 0.004).toFixed(3) + '" rx="' + (0.008 + R() * 0.01).toFixed(3) + '" ry="0.006" fill="#4a2a12" opacity="' + (0.25 + R() * 0.4).toFixed(2) + '"/>';
    }
    return '<div class="pizza__calzone">' +
      '<img src="' + IMG + 'base-bianca.webp" alt="" decoding="async" style="clip-path:url(#' + id + ')">' +
      '<svg class="pizza__rim" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true"><defs>' +
      '<clipPath id="' + id + '" clipPathUnits="objectBoundingBox"><path d="M0.012 0.5A0.488 0.488 0 0 1 0.988 0.5Q0.5 0.69 0.012 0.5Z"/></clipPath>' +
      '<linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e2b8"/><stop offset=".5" stop-color="#e2b273"/><stop offset="1" stop-color="#b87a3c"/></linearGradient></defs>' +
      '<path d="M0.03 0.5Q0.5 0.685 0.97 0.5" fill="none" stroke="url(#' + g + ')" stroke-width="0.042" stroke-linecap="round"/>' + dots +
      '</svg></div>';
  }
  function box() {
    return '<div class="pizza__box"><svg viewBox="0 0 400 400" aria-hidden="true">' +
      '<defs><linearGradient id="pzbox" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2bd8a"/><stop offset="1" stop-color="#c4955c"/></linearGradient></defs>' +
      '<rect x="22" y="30" width="356" height="356" rx="16" fill="rgba(12,29,82,.28)" transform="translate(6 10)"/>' +
      '<rect x="22" y="22" width="356" height="356" rx="16" fill="url(#pzbox)" stroke="#a8763f" stroke-width="3"/>' +
      '<rect x="44" y="44" width="312" height="312" rx="10" fill="none" stroke="#b5864f" stroke-width="2" stroke-dasharray="7 7"/>' +
      '<path d="M22 70H378" stroke="#b07c45" stroke-width="2" opacity=".5"/>' +
      '<circle cx="200" cy="214" r="98" fill="#fff5cc" stroke="#1d3e9e" stroke-width="6"/>' +
      '<text x="200" y="262" text-anchor="middle" font-family="Rubik, sans-serif" font-style="italic" font-weight="900" font-size="150" fill="#ffd43b" stroke="#0c1d52" stroke-width="5" paint-order="stroke">?</text>' +
      '</svg></div>';
  }

  Pizza.T = T;
  window.Pizza = Pizza;
})();
