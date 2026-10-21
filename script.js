/* ==========================================================
   8BITS — 3D parallax + direction-driven colour
   ========================================================== */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const reduceMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hero = $('[data-hero]');
  const scene = $('[data-scene]');
  const content = $('.hero__content');

  if (hero && scene) {
    const layers = $$('[data-depth]', hero);

    const pointer = { x: 0, y: 0 };   // target  -1 .. 1
    const eased  = { x: 0, y: 0 };   // smoothed
    let scrollY = 0;
    let easedScroll = 0;
    let idleSince = performance.now();

    function readPointer(clientX, clientY) {
      const r = hero.getBoundingClientRect();
      pointer.x = clamp(((clientX - r.left) / r.width) * 2 - 1, -1, 1);
      pointer.y = clamp(((clientY - r.top) / r.height) * 2 - 1, -1, 1);
      idleSince = performance.now();
    }

    hero.addEventListener('pointermove', (e) => readPointer(e.clientX, e.clientY), { passive: true });
    hero.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; }, { passive: true });
    hero.addEventListener('touchmove', (e) => {
      const t = e.touches && e.touches[0];
      if (t) readPointer(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener('scroll', () => {
      scrollY = Math.min(window.scrollY || 0, window.innerHeight);
    }, { passive: true });

    function frame() {
      eased.x += (pointer.x - eased.x) * 0.075;
      eased.y += (pointer.y - eased.y) * 0.075;
      easedScroll += (scrollY - easedScroll) * 0.12;

      // gentle idle drift so the hero is never static
      const now = performance.now();
      const idle = (now - idleSince) > 2600;
      const driftX = idle ? Math.sin(now / 4200) * 0.26 : 0;
      const driftY = idle ? Math.cos(now / 5400) * 0.14 : 0;

      const x = clamp(eased.x + driftX, -1, 1);
      const y = clamp(eased.y + driftY, -1, 1);

      /* ---- 3D tilt of the scene ---- */
      const rotY = x * 7;
      const rotX = -y * 5;
      scene.style.transform =
        'rotateX(' + rotX.toFixed(3) + 'deg) rotateY(' + rotY.toFixed(3) +
        'deg) translate3d(0,' + (easedScroll * 0.12).toFixed(2) + 'px,0)';

      hero.style.perspectiveOrigin =
        (50 + x * 7).toFixed(2) + '% ' + (50 + y * 7).toFixed(2) + '%';

      /* ---- per-layer depth translation (the parallax) ---- */
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const depth = parseFloat(layer.dataset.depth) || 0;
        const z     = parseFloat(layer.dataset.z) || 0;
        const dx = x * depth;
        const dy = y * depth * 0.55 - easedScroll * depth * 0.06;
        layer.style.transform =
          'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,' + z.toFixed(1) + 'px)';
      }

      /* ---- foreground sits nearer, moves faster ---- */
      if (content) {
        const d = parseFloat(content.dataset.depth) || 0;
        content.style.transform =
          'translate3d(' + (x * d).toFixed(2) + 'px,' +
          (y * d * 0.4 - easedScroll * d * 0.06).toFixed(2) + 'px,0)';
      }

      requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      layers.forEach((l) => { l.style.transform = 'translate3d(0,0,0)'; });
    } else {
      requestAnimationFrame(frame);
    }
  }
})();
