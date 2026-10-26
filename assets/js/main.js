/* Iron-lungs — interactions légères, le site fonctionne sans JS. */
(function () {
  'use strict';

  /* ── Bascule de thème (mémorisée) ───────────────────────── */
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* ── Bouton e-mail : adresse réassemblée ici, absente du HTML ─ */
  var flip = function (str) { return str.split('').reverse().join(''); };
  document.querySelectorAll('.js-mail').forEach(function (a) {
    a.href = 'mailto:' + flip(a.dataset.u) + '@' + flip(a.dataset.d);
    a.hidden = false;
  });

  /* ── Apparition des blocs au défilement ─────────────────── */
  var blocks = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    blocks.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    blocks.forEach(function (el) { io.observe(el); });
  }

  /* ── Onglets de la page Éditeurs : suit la section visible ─ */
  var tabs = document.querySelectorAll('.vendor-tabs a[data-tab]');
  if (tabs.length && 'IntersectionObserver' in window) {
    var setActive = function (slug) {
      tabs.forEach(function (a) {
        var on = a.dataset.tab === slug;
        a.classList.toggle('is-active', on);
        if (on) {
          a.setAttribute('aria-current', 'true');
          var bar = a.closest('ul');
          bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
        } else {
          a.removeAttribute('aria-current');
        }
      });
    };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    tabs.forEach(function (a) {
      var sec = document.getElementById(a.dataset.tab);
      if (sec) spy.observe(sec);
    });
    setActive(tabs[0].dataset.tab);
  }

  /* ── Simulation « gaz parfait 2D » de la page d'accueil ─────
     Atomes sans interaction, vitesses tirées selon Maxwell-Boltzmann
     (chaque composante suit une loi normale), réflexions spéculaires
     sur les parois. En bas : histogramme des vitesses en direct. */
  var canvas = document.querySelector('.sim-canvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var outN = document.querySelector('[data-sim="n"]');
    var outHits = document.querySelector('[data-sim="hits"]');
    var N = 120, BINS = 28, VMAX = 3.6;
    var atoms = [], hits = 0, w = 0, h = 0, boxH = 0, dpr = 1, colors = {};
    var running = false, visible = true, last = 0;

    var gauss = function () { // Box-Muller
      var u = 1 - Math.random(), v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    var readColors = function () {
      var cs = getComputedStyle(root);
      colors = {
        text: cs.getPropertyValue('--text').trim(),
        dim: cs.getPropertyValue('--text-dim').trim(),
        accent: cs.getPropertyValue('--accent').trim(),
        border: cs.getPropertyValue('--border').trim()
      };
    };

    var resize = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      boxH = h * 0.72;
      if (!atoms.length) {
        for (var i = 0; i < N; i++) {
          atoms.push({ x: Math.random() * w, y: Math.random() * boxH, vx: gauss(), vy: gauss() });
        }
      }
      atoms.forEach(function (a) { a.x = Math.min(a.x, w - 3); a.y = Math.min(a.y, boxH - 3); });
    };

    var step = function (dt) {
      var k = dt * w / 9000; // vitesse thermique ≈ 1/9 de la boîte par seconde
      atoms.forEach(function (a) {
        a.x += a.vx * k; a.y += a.vy * k;
        if (a.x < 2)        { a.x = 4 - a.x;              a.vx = -a.vx; hits++; }
        if (a.x > w - 2)    { a.x = 2 * (w - 2) - a.x;    a.vx = -a.vx; hits++; }
        if (a.y < 2)        { a.y = 4 - a.y;              a.vy = -a.vy; hits++; }
        if (a.y > boxH - 2) { a.y = 2 * (boxH - 2) - a.y; a.vy = -a.vy; hits++; }
      });
    };

    var draw = function () {
      ctx.clearRect(0, 0, w, h);

      // Atomes : traînée + point, les plus rapides en couleur d'accent
      atoms.forEach(function (a) {
        var v = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
        var fast = v > 1.6;
        ctx.strokeStyle = fast ? colors.accent : colors.dim;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x - a.vx * 7, a.y - a.vy * 7);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = fast ? colors.accent : colors.text;
        ctx.beginPath();
        ctx.arc(a.x, a.y, fast ? 2.4 : 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Séparation + histogramme des vitesses
      ctx.strokeStyle = colors.border;
      ctx.beginPath(); ctx.moveTo(0, boxH + 0.5); ctx.lineTo(w, boxH + 0.5); ctx.stroke();

      var counts = new Array(BINS).fill(0), max = 1;
      atoms.forEach(function (a) {
        var b = Math.floor(Math.sqrt(a.vx * a.vx + a.vy * a.vy) / VMAX * BINS);
        if (b < BINS) { counts[b]++; if (counts[b] > max) max = counts[b]; }
      });
      var pad = 16, top = boxH + 26, bh = h - top - 10, bw = (w - pad * 2) / BINS;
      counts.forEach(function (c, i) {
        var hh = c / max * bh;
        ctx.fillStyle = i / BINS * VMAX > 1.6 ? colors.accent : colors.dim;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(pad + i * bw + 1, top + bh - hh, bw - 2, hh);
      });
      ctx.globalAlpha = 1;

      // Courbe théorique de Maxwell-Boltzmann 2D : f(v) ∝ v·exp(−v²/2)
      ctx.strokeStyle = colors.text;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var x = 0; x <= w - pad * 2; x += 3) {
        var v = x / (w - pad * 2) * VMAX;
        var f = v * Math.exp(-v * v / 2) / Math.exp(-0.5); // max = 1 en v = 1
        var y = top + bh - f * bh;
        if (x === 0) ctx.moveTo(pad + x, y); else ctx.lineTo(pad + x, y);
      }
      ctx.stroke();

      ctx.fillStyle = colors.dim;
      ctx.font = '10px "Geist Mono", ui-monospace, monospace';
      ctx.fillText(canvas.dataset.hist || '', pad, boxH + 16);

      if (outHits) outHits.textContent = hits.toLocaleString(document.documentElement.lang);
    };

    var loop = function (now) {
      if (!running) return;
      var dt = Math.min(now - last, 50); last = now;
      step(dt); draw();
      requestAnimationFrame(loop);
    };
    var start = function () {
      if (running || still || !visible || document.hidden) return;
      running = true; last = performance.now(); requestAnimationFrame(loop);
    };
    var stop = function () { running = false; };

    readColors(); resize();
    if (outN) outN.textContent = N;
    // Mode réduit : une image fixe déjà « mélangée »
    if (still) { for (var i = 0; i < 200; i++) step(16); }
    draw(); start();

    window.addEventListener('resize', function () { resize(); draw(); });
    if (toggle) toggle.addEventListener('click', function () { readColors(); draw(); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting; visible ? start() : stop();
      }).observe(canvas);
    }
  }
})();
