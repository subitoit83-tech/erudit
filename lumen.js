// Lumen — the fallen star of the «Эрудит» Shorts series.
//
// One vector character, reused in every episode so he never drifts off-model. He is the app's
// four-point star motif with a face: a glowing core, four rays that work as his "limbs"
// (the top ray is his most expressive part — it droops and perks like an ear), and a warm halo
// whose strength is his mood. When he understands something he flashes; when he is lost he dims.
//
// Usage inside a HyperFrames composition (all motion goes through the one paused timeline):
//   const lm = Lumen.mount(document.getElementById("lumen"), { id: "lm" });
//   lm.mood(tl, 1.2, "worried");  lm.blink(tl, 2.0);  lm.flash(tl, 4.5);  lm.bob(tl, 0, 6);
// Everything is deterministic: no timers, no randomness, only tweens placed on `tl`.
(function () {
    const INK = "#15253A";
  const DIM = "#8F9BB5";
  const BLUSH = "#FF9E8A";

  // A ray: a wide base hidden in the core whose edges leave the core near the diagonal, so four
  // rays together draw one concave star silhouette (the brand star, plumped up), and a soft tip.
  // The base stays inside the core radius, so a ray can rotate (droop, wave) without a seam.
  const RAY = "M-60 0 C-60 -40 -40 -70 -24 -96 C-14 -116 -7 -160 0 -170 C7 -160 14 -116 24 -96 C40 -70 60 -40 60 0 Z";
  const CORE_R = 72;
  // [name, angle, length]: long top ray, slightly shorter bottom, short side "arms".
  const RAYS = [["t", 0, 1], ["r", 90, 0.8], ["b", 180, 0.9], ["l", 270, 0.8]];

  const MOUTHS = {
    smile: `<path d="M-14 26 Q0 38 14 26" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
    grin: `<path d="M-19 21 Q0 48 19 21 Z" fill="${INK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
    open: `<ellipse cx="0" cy="31" rx="8" ry="10.5" fill="${INK}"/>`,
    flat: `<path d="M-10 30 L10 30" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
    frown: `<path d="M-13 34 Q0 24 13 34" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
    wobble: `<path d="M-15 31 Q-7.5 25 0 31 Q7.5 37 15 31" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>`,
  };

  // Each mood = mouth + eye shape + brows (visibility, tilt, lift) + blush + eye squint.
  const MOODS = {
    neutral:    { mouth: "smile",  eyes: "open",  brows: 0, bl: 0,   br: 0,   by: 0,  blush: 0.45, squint: 1 },
    happy:      { mouth: "grin",   eyes: "happy", brows: 0, bl: 0,   br: 0,   by: 0,  blush: 0.8,  squint: 1 },
    wow:        { mouth: "open",   eyes: "open",  brows: 1, bl: 0,   br: 0,   by: -8, blush: 0.5,  squint: 1.12 },
    worried:    { mouth: "wobble", eyes: "open",  brows: 1, bl: -16, br: 16,  by: 0,  blush: 0.45, squint: 1 },
    sad:        { mouth: "frown",  eyes: "open",  brows: 1, bl: -20, br: 20,  by: 2,  blush: 0.2,  squint: 0.86 },
    determined: { mouth: "flat",   eyes: "open",  brows: 1, bl: 18,  br: -18, by: 4,  blush: 0.35, squint: 0.8 },
    embarrassed:{ mouth: "wobble", eyes: "happy", brows: 1, bl: -12, br: 12,  by: -2, blush: 1,    squint: 1 },
  };

  function markup(p) {
    const rays = RAYS.map(([k, deg, s]) =>
      `<g transform="rotate(${deg}) scale(${s})"><g class="lm-ray lm-ray-${k}">` +
      `<path d="${RAY}" fill="url(#${p}-body)"/><path class="lm-dim" d="${RAY}" fill="${DIM}" style="opacity:0"/></g></g>`).join("");
    const mouths = Object.entries(MOUTHS).map(([k, d]) =>
      `<g class="lm-mouth lm-mouth-${k}" style="opacity:${k === "smile" ? 1 : 0}">${d}</g>`).join("");
    const eye = (side, x) =>
      `<g transform="translate(${x} -8)"><g class="lm-eye lm-eye-${side}">` +
      `<ellipse rx="12.5" ry="18" fill="${INK}"/><circle cx="-4" cy="-7" r="4.6" fill="#fff"/><circle cx="4" cy="6" r="2" fill="#fff" style="opacity:.7"/></g></g>`;
    const brow = (side, x) =>
      `<g transform="translate(${x} -40)"><g class="lm-brow lm-brow-${side}" style="opacity:0">` +
      `<path d="M-12 0 L12 0" stroke="${INK}" stroke-width="6.5" stroke-linecap="round"/></g></g>`;
    return `<svg class="lm-svg" viewBox="-230 -230 460 460" width="100%" height="100%" overflow="visible" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="${p}-halo">
      <stop offset="0" stop-color="#FFEBB0" stop-opacity="0.85"/>
      <stop offset="0.38" stop-color="#FFD56B" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#FFD56B" stop-opacity="0"/>
    </radialGradient>
    <!-- One light source in the centre for the whole body: rays and core blend into one shape. -->
    <radialGradient id="${p}-body" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="175">
      <stop offset="0" stop-color="#FFF8E0"/>
      <stop offset="0.42" stop-color="#FFE48F"/>
      <stop offset="1" stop-color="#FFBA3C"/>
    </radialGradient>
    <!-- A soft contact shadow so the gold still separates from a pale dawn or evening sky. -->
    <!-- The face's rim light: a thin bright edge just inside the core, so the face reads as the
         lit centre of the star, not a sticker on it. -->
    <radialGradient id="${p}-rim" r="0.5">
      <stop offset="0.8" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="0.95" stop-color="#FFFBEA" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#FFF6D6" stop-opacity="0"/>
    </radialGradient>
    <!-- A warm shadow under the core lifts the face off the rays. -->
    <radialGradient id="${p}-lift" r="0.5">
      <stop offset="0.84" stop-color="#B86A10" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#B86A10" stop-opacity="0"/>
    </radialGradient>
    <filter id="${p}-sep" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#15253A" flood-opacity="0.2"/>
    </filter>
  </defs>
  <g class="lm-halo"><circle r="225" fill="url(#${p}-halo)"/></g>
  <g filter="url(#${p}-sep)"><g class="lm-body">
    ${rays}
    <circle cy="6" r="${CORE_R + 14}" fill="url(#${p}-lift)"/>
    <circle r="${CORE_R}" fill="url(#${p}-body)"/>
    <circle r="${CORE_R + 4}" fill="url(#${p}-rim)"/>
    <circle class="lm-dim" r="${CORE_R}" fill="${DIM}" style="opacity:0"/>
    <g class="lm-face">
      <ellipse class="lm-blush" cx="-44" cy="20" rx="13" ry="8.5" fill="${BLUSH}" style="opacity:.45"/>
      <ellipse class="lm-blush" cx="44" cy="20" rx="13" ry="8.5" fill="${BLUSH}" style="opacity:.45"/>
      <g class="lm-eyes">${eye("l", -27)}${eye("r", 27)}</g>
      <g class="lm-happy" style="opacity:0"><path d="M-40 -6 Q-27 -22 -14 -6 M14 -6 Q27 -22 40 -6" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/></g>
      ${brow("l", -27)}${brow("r", 27)}
      ${mouths}
    </g>
  </g></g>
</svg>`;
  }

  function mount(el, opts = {}) {
    const p = opts.id || "lm";
    el.innerHTML = markup(p);
    const $ = (s) => Array.from(el.querySelectorAll(s));
    const one = (s) => el.querySelector(s);
    const parts = {
      body: one(".lm-body"), halo: one(".lm-halo"), face: one(".lm-face"),
      eyes: one(".lm-eyes"), eye: $(".lm-eye"), happy: one(".lm-happy"),
      browL: one(".lm-brow-l"), browR: one(".lm-brow-r"), blush: $(".lm-blush"),
      dims: $(".lm-dim"), mouths: Object.fromEntries(Object.keys(MOUTHS).map((k) => [k, one(".lm-mouth-" + k)])),
      ray: { t: one(".lm-ray-t"), r: one(".lm-ray-r"), b: one(".lm-ray-b"), l: one(".lm-ray-l") },
    };
    // Pivots: rays bend from their base, eyes blink about their centre, the body squashes on its feet.
    gsap.set(Object.values(parts.ray), { transformOrigin: "50% 100%" });
    gsap.set(parts.eye, { transformOrigin: "50% 50%" });
    gsap.set([parts.browL, parts.browR], { transformOrigin: "50% 50%" });
    gsap.set(parts.body, { transformOrigin: "50% 80%" });
    gsap.set(parts.halo, { transformOrigin: "50% 50%" });

    const api = {
      el, parts,

      // Switch expression. ~0.15 s crossfade so it reads as a change, not a cut.
      mood(tl, t, name, d = 0.15) {
        const m = MOODS[name] || MOODS.neutral;
        Object.entries(parts.mouths).forEach(([k, node]) => tl.to(node, { opacity: k === m.mouth ? 1 : 0, duration: d, ease: "none" }, t));
        tl.to(parts.eye, { opacity: m.eyes === "open" ? 1 : 0, scaleY: m.squint, scaleX: m.squint > 1 ? m.squint : 1, duration: d, ease: "sine.out" }, t);
        tl.to(parts.happy, { opacity: m.eyes === "happy" ? 1 : 0, duration: d, ease: "none" }, t);
        tl.to(parts.browL, { opacity: m.brows, rotation: m.bl, y: m.by, duration: d + 0.05, ease: "sine.out" }, t);
        tl.to(parts.browR, { opacity: m.brows, rotation: m.br, y: m.by, duration: d + 0.05, ease: "sine.out" }, t);
        tl.to(parts.blush, { opacity: m.blush, duration: d + 0.1, ease: "none" }, t);
        return api;
      },

      blink(tl, t) {
        tl.to(parts.eye, { scaleY: 0.08, duration: 0.06, ease: "power1.in", yoyo: true, repeat: 1 }, t);
        return api;
      },

      // Eyes (and a little of the face) glance toward a direction, in SVG units.
      look(tl, t, dx = 0, dy = 0, d = 0.25) {
        tl.to(parts.eyes, { x: dx, y: dy, duration: d, ease: "power2.out" }, t);
        tl.to(parts.face, { x: dx * 0.45, y: dy * 0.45, duration: d, ease: "power2.out" }, t);
        return api;
      },

      // Idle float: finite yoyo between t0 and t1.
      bob(tl, t0, t1, amp = 12, period = 1.6) {
        const reps = Math.max(1, Math.floor((t1 - t0) / (period / 2)) - 1);
        tl.to(parts.body, { y: -amp, duration: period / 2, ease: "sine.inOut", yoyo: true, repeat: reps }, t0);
        return api;
      },

      // Squash on landing / anticipation, then spring back.
      squash(tl, t, amount = 0.22) {
        tl.to(parts.body, { scaleX: 1 + amount, scaleY: 1 - amount, duration: 0.09, ease: "power2.out" }, t);
        tl.to(parts.body, { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1.1, 0.4)" }, t + 0.09);
        return api;
      },

      // The top ray is his ear: droop when sad or tired, perk when curious.
      droop(tl, t, deg = 38, d = 0.4) {
        tl.to(parts.ray.t, { rotation: deg, scaleY: 0.9, duration: d, ease: "power2.out" }, t);
        return api;
      },
      perk(tl, t, d = 0.35) {
        tl.to(parts.ray.t, { rotation: 0, scaleY: 1.12, duration: d * 0.5, ease: "back.out(3)" }, t);
        tl.to(parts.ray.t, { scaleY: 1, duration: d, ease: "sine.out" }, t + d * 0.5);
        return api;
      },

      // Wave with a side ray.
      wave(tl, t, side = "r", times = 2) {
        const ray = parts.ray[side];
        const dir = side === "r" ? -1 : 1;
        tl.to(ray, { rotation: 30 * dir, duration: 0.16, ease: "sine.inOut", yoyo: true, repeat: times * 2 - 1 }, t);
        return api;
      },

      // Lose light (0 = full glow, 1 = grey, stone-cold).
      dim(tl, t, level = 0.8, d = 0.6) {
        tl.to(parts.dims, { opacity: level * 0.85, duration: d, ease: "sine.inOut" }, t);
        tl.to(parts.halo, { opacity: 1 - level * 0.95, duration: d, ease: "sine.inOut" }, t);
        return api;
      },

      // The signature move: understanding. Rays stretch, halo blooms, light returns.
      flash(tl, t) {
        tl.to(parts.dims, { opacity: 0, duration: 0.2, ease: "power2.out" }, t);
        tl.to(parts.halo, { opacity: 1, scale: 1.9, duration: 0.22, ease: "power3.out" }, t);
        tl.to(parts.halo, { scale: 1.15, duration: 0.9, ease: "sine.out" }, t + 0.22);
        Object.values(parts.ray).forEach((r) => {
          tl.to(r, { scaleY: 1.32, duration: 0.14, ease: "power3.out" }, t);
          tl.to(r, { scaleY: 1, duration: 0.6, ease: "elastic.out(1, 0.35)" }, t + 0.14);
        });
        tl.to(parts.body, { scale: 1.12, duration: 0.12, ease: "power2.out" }, t);
        tl.to(parts.body, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" }, t + 0.12);
        return api;
      },
    };
    return api;
  }

  window.Lumen = { mount, MOODS: Object.keys(MOODS) };
})();
