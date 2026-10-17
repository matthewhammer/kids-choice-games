"use strict";
// (ticket 178) Part 8 of 26 of the game's script, run in order by index.html.

// ===================== THE BODY =====================
// Body units: the collar's top at y = -20, centered on x = 0. Every part
// is placed by an anchor of the part before it: the neck on the collar,
// the head's chin on the neck, hands at the ends of the arms, the pants'
// hips under the shirt's, and shoes on the pants' feet.

const SHOES = {
  sneaker: [[-2,0],[12,0],[14,12],[40,16],[44,26],[-12,26],[-14,10]],
  boot:    [[-12,-34],[12,-34],[13,8],[38,12],[42,26],[-13,26]],
  clown:   [[-10,0],[10,0],[14,8],[62,4],[74,16],[64,30],[-14,30],[-18,14]],
  // a witch's: an ankle boot whose pointed toe curls up (with a strap and
  // a buckle: shoeSvg)
  witchboot: [[-12,-30],[12,-30],[13,6],[32,12],[48,4],[54,-2],[50,12],[40,26],[-13,26]],
};
// BARE FEET WITH TOES, as the hands have fingers: in the foot's frame
// (x outward from the ankle, y down, in shoe units), a sole and toes,
// each toe a rounded stroke from (x1, y1) to (x2, y2), `w` its half-width,
// an optional round pad `tip`, and for talons a hooked claw at the end.
// Outline layer first, then fill, so toes and sole merge into one shape.
const TOED = {
  // a foot from the side, five toes along its front, the big toe first
  toes5: { sole: [14, 16, 20, 10], toes: [
    [28, 9, 42, 6.5, 3.2], [29, 13, 43, 12.5, 2.8], [29, 16.5, 41.5, 18, 2.5],
    [28, 20, 39, 23, 2.3], [26, 23, 35, 27, 2.1]] },
  // a small sole and four long, thin toes fanned forward, round pads
  alien4: { sole: [6, 14, 14, 10], tip: 4.2, toes: [
    [8, 12, 40, -2, 2.4], [8, 13, 46, 10, 2.4], [8, 14, 44, 21, 2.4], [8, 15, 36, 27, 2.4]] },
  // three very long toes with big round pads, like a tree frog's
  alien3: { sole: [6, 14, 14, 10], tip: 6, toes: [
    [8, 12, 46, 0, 2.6], [8, 14, 54, 14, 2.6], [8, 16, 44, 24, 2.6]] },
  // a bird's (or a raptor's) foot: three toes forward, one back, talons
  talons: { sole: [4, 16, 10, 8], talon: true, toes: [
    [6, 15, 34, 6, 3.6], [6, 17, 40, 18, 3.6], [6, 19, 32, 26, 3.4], [2, 18, -14, 24, 3.2]] },
};
// How far each kind of foot reaches out from the ankle, in shoe units,
// so the picture's frame can hold big feet (and big shoes).
const FOOT_REACH = { sneaker: 46, boot: 44, clown: 76, bare: 36, paw: 40, hoof: 34, witchboot: 58,
  "fairy-slipper": 60, "fairy-petal": 52, "fairy-leaf": 60, "fairy-sparkle": 48, "fairy-bare": 36,
                     toes5: 44, alien4: 52, alien3: 62, talons: 56 };
// A human foot with n toes (1 to 100), as the hands have n fingers: the
// toes along the front of the foot, the big toe first and longest; past
// five they fan further round it, thinner, to a fringe at 100. Five toes
// are the foot drawn above.
function humanToes(n) {
  n = Math.max(1, Math.min(100, Math.round(n)));
  if (n === 5) return TOED.toes5;
  const lo = n <= 5 ? -45 : -45 - Math.min(110, (n - 5) * 3), hi = n <= 5 ? 50 : 50 + Math.min(110, (n - 5) * 3);
  const toes = [];
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0.25, th = (lo + (hi - lo) * t) * Math.PI / 180, d = th * (n <= 5 ? 0.45 : 0.7);
    const bx = 14 + 16 * Math.cos(th), by = 16 + 8 * Math.sin(th), len = 14 - 4 * t;
    const w = Math.max(0.45, (3.2 - 1.1 * t) * Math.pow(Math.min(1, 5 / n), 0.8));
    toes.push([f1(bx), f1(by), f1(bx + len * Math.cos(d)), f1(by + len * Math.sin(d)), +w.toFixed(2)]);
  }
  return { sole: [14, 16, 20, 10], toes };
}
// An alien foot with n long thin toes (1 to 100), round pads at their
// ends, fanned forward from a small sole, wider as there are more; three
// and four are the feet drawn above.
function alienToes(n) {
  n = Math.max(1, Math.min(100, Math.round(n)));
  if (n === 3) return TOED.alien3;
  if (n === 4) return TOED.alien4;
  const half = n <= 1 ? 0 : Math.min(170, 20 + (n - 3) * 6), step = n > 1 ? 2 * half / (n - 1) : 0;
  const chord = Math.sin(Math.max(step, 8) * Math.PI / 360) * 40;
  const w = Math.max(0.5, Math.min(2.6, chord * 0.35)), tip = Math.max(1, Math.min(6, chord * 0.6)), toes = [];
  for (let i = 0; i < n; i++) {
    const a = (n > 1 ? -half + i * step : 0) * Math.PI / 180, len = 44 - 8 * Math.abs(n > 1 ? (i / (n - 1)) * 2 - 1 : 0);
    toes.push([8, 14, f1(8 + len * Math.cos(a)), f1(14 + len * Math.sin(a)), +w.toFixed(2)]);
  }
  return { sole: [6, 14, 14, 10], tip, toes };
}
// A bird's foot with n talons (1 to 100): one toe back and the rest
// forward, fanned wider and thinner as there are more, each with its hooked
// claw; four are the foot drawn above (three forward, one back).
function talonToes(n) {
  n = Math.max(1, Math.min(100, Math.round(n)));
  if (n === 4) return TOED.talons;
  const k = n >= 2 ? n - 1 : 1, half = k <= 1 ? 0 : Math.min(150, 17 + Math.max(0, k - 3) * 5), step = k > 1 ? 2 * half / (k - 1) : 0;
  const w = Math.max(0.6, Math.min(3.6, Math.sin(Math.max(step, 6) * Math.PI / 360) * 32 * 0.75)), toes = [];
  for (let i = 0; i < k; i++) {
    const u = k > 1 ? i / (k - 1) : 0.5, a = (-half + 2 * half * u) * Math.PI / 180, len = 34 - 7 * Math.abs(2 * u - 1);
    toes.push([6, 17, +(6 + len * Math.cos(a)).toFixed(1), +(17 + len * Math.sin(a)).toFixed(1), +w.toFixed(2)]);   // (numbers: a talon's claw is reckoned from them)
  }
  if (n >= 2) toes.push([2, 18, -14, 24, Math.min(3.2, w + 0.4)]);
  return { sole: [4, 16, 10, 8], talon: true, toes };
}
// what a foot's toes are, if it has toes
const toesOf = sh => sh.style === "human" ? humanToes(sh.toes ?? 5) : sh.style === "alien" ? alienToes(sh.alienToes ?? 3)
                   : sh.style === "talons" ? talonToes(sh.talonCount ?? 4) : TOED[sh.style];
// the feet whose toes are counted (their reach follows the count)
const COUNTED_FEET = { human: 1, alien: 1, talons: 1 };
// how far a foot reaches out from the ankle (toes counted, and a talon's
// claw past its toe), in shoe units
const footReach = sh => {
  const T = COUNTED_FEET[sh.style] && toesOf(sh);
  return T ? Math.max(...T.toes.map(([, , x2, , w]) => +x2 + w + (T.tip || 0) + (T.talon ? 13 : 0))) : FOOT_REACH[sh.style] ?? 76;
};
// and how far its toes reach down below the ankle (many toes fan round
// the foot, past its sole), in shoe units
const footDown = sh => {
  const T = COUNTED_FEET[sh.style] && toesOf(sh);
  return T ? Math.max(...T.toes.map(([, , , y2, w]) => +y2 + w + (T.tip || 0) + (T.talon ? 13 : 0))) : 0;
};
function toedFoot(x, y, side, sc, skin, T) {
  const st = darker(skin), lw = 2.5 / sc;
  const [sx, sy, srx, sry] = T.sole;
  const layer = (fill, grow) =>
    `<ellipse cx="${sx}" cy="${sy}" rx="${f1(srx + grow)}" ry="${f1(sry + grow)}" fill="${fill}"/>` +
    T.toes.map(([x1, y1, x2, y2, w]) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fill}" stroke-width="${f1(2 * (w + grow))}" stroke-linecap="round"/>` +
      (T.tip ? `<circle cx="${x2}" cy="${y2}" r="${f1(T.tip + grow)}" fill="${fill}"/>` : "")).join("");
  // a talon: a curved point leaving the toe's end, hooking downward
  const talon = ([x1, y1, x2, y2, w]) => {
    const L = Math.hypot(x2 - x1, y2 - y1), dx = (x2 - x1) / L, dy = (y2 - y1) / L, nx = -dy, ny = dx;
    const P = (a, c) => `${f1(x2 + dx * a + nx * c)} ${f1(y2 + dy * a + ny * c)}`;
    const k = Math.sign(dx) || 1;                        // hook toward the ground
    return `<path d="M${P(0, -w)} Q${P(9, -w)} ${P(13, k * 6)} Q${P(5, w * 0.8)} ${P(0, w)} Z" ` +
           `fill="#f4ecd6" stroke="#5c4a2e" stroke-width="${f1(1.8 / sc)}" stroke-linejoin="round"/>`;
  };
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${(side * sc).toFixed(3)} ${sc.toFixed(3)})">` +
    (T.talon ? T.toes.map(talon).join("") : "") + layer(st, lw) + layer(skin, 0) + `</g>`;
}
// A fairy's wings, behind her: for each side, from her back (just inside
// the shoulder) out and up; in their style and color, fluttering (a slow
// beat, both together) unless that is off
// how far into its cycle (of `dur` seconds, begun `begin` seconds in) a CSS
// animation is now, as the negative delay that starts it there
const fairyPhase = (dur, begin = 0) => (-(((performance.now() / 1000 - begin) % dur + dur) % dur)).toFixed(3);
// A flap with an LFO: the wing swings out as the LFO's wave rises, farther
// the deeper it is (8 degrees at no depth, 15 at the mixer's usual depth,
// 36 at full depth: more than the usual flap's 9, to beat with the music),
// once per LFO cycle, in time with the music. Its keyframes, made for the wave
// and depth (one set per side), go in the picture with it.
const wingLfoAngle = (lf, sd, u) => -sd * (8 + 28 * lf.amp) * (1 + lfoWave(lf.shape, u)) / 2;
function wingLfoFlap(lf, sd, shift = 0) {
  const name = `fairy-lfo-${sd < 0 ? "l" : "r"}-${lf.shape}-${Math.round(lf.amp * 100)}`, N = 16, stops = [];
  for (let i = 0; i <= N; i++) stops.push(`${(i / N * 100).toFixed(2)}% { transform: rotate(${wingLfoAngle(lf, sd, i / N).toFixed(2)}deg); }`);
  return { css: `@keyframes ${name} { ${stops.join(" ")} }`,
           style: `transform-origin: 0 0; animation: ${name} ${lf.dur.toFixed(4)}s linear ${(-(lf.phase + shift) * lf.dur).toFixed(4)}s infinite` };
}
// An LFO going round faster than the screen can show (a cycle in under
// about four frames) is drawn as the eye sees fast wings: a blur of K see-
// through copies of the wing, each flapping at the LFO's own speed, each an
// eighth of a cycle behind the last. Whenever the screen draws a frame it
// catches the K of them spread evenly round the cycle, so the blur covers
// the whole sweep, thickest where the wave lingers (a sine's ends) and
// nearly solid at the shoulder, where every copy overlaps; and as where it
// catches them shifts from frame to frame, the blur shimmers and moves. A
// fade that fast holds at its average instead (see fairyHouseFade and veil).
const LFO_BLUR = 1 / 15;
function wingLfoBlur(lf, sd, ax, ay, t) {
  const K = 8, op = (1 - Math.pow(0.1, 1 / K)).toFixed(3);
  return { css: wingLfoFlap(lf, sd).css, svg: `<g transform="translate(${ax} ${ay})">` + [...Array(K)].map((_, i) =>
    `<g style="${wingLfoFlap(lf, sd, i / K).style}" opacity="${op}"><g transform="translate(${-ax} ${-ay})">${t}</g></g>`).join("") + `</g>` };
}
// a wing's markings (veins, spots, a shine), kept inside the wing's outline d:
// drawn a little long and clipped, every vein ends exactly at the wing's edge
let wingClips = 0;
const insideWing = (d, inner) => { const id = "fw-clip-" + wingClips++;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`; };
function fairyWingsSvg(style, color, w, L, flutter = true, lfo = null) {
  wingClips = 0;   // (the same wings, the same clip ids, every draw)
  const dk = darker(color), lt = mix(color, "#ffffff", 0.45), out = [];
  const lf = flutter ? lfoNow(lfo) : null, css = [];
  for (const sd of [-1, 1]) {
    const ax = sd * 16, ay = 24, X = v => f1(sd * v);
    let t = "";
    if (style === "butterfly") {
      const up = `M${X(16)} 20 C${X(w + 40)} -160 ${X(w + 200)} -150 ${X(w + 175)} -20 C${X(w + 150)} 34 ${X(60)} 44 ${X(16)} 30 Z`;
      const lo = `M${X(16)} 36 C${X(w + 120)} 40 ${X(w + 160)} 150 ${X(w + 70)} 176 C${X(30)} 178 ${X(12)} 100 ${X(16)} 36 Z`;
      t += `<path d="${lo}" fill="${color}" stroke="#1f1f22" stroke-width="7" stroke-linejoin="round"/>` +
           `<path d="${up}" fill="${color}" stroke="#1f1f22" stroke-width="7" stroke-linejoin="round"/>` +
           // (its veins and spots, each inside its own wing, the veins carried on to the wing's edge)
           insideWing(up, [[w + 150, -110], [w + 170, -40], [w + 90, -120], [w + 40, 30]].map(([x, y]) => `<path d="M${X(20)} 26 Q${X(x * 0.55)} ${f1(y * 0.6)} ${X(20 + (x - 20) * 1.5)} ${f1(26 + (y - 26) * 1.5)}" fill="none" stroke="#1f1f22" stroke-width="3"/>`).join("") +
             [[w + 170, -70], [w + 160, -10], [w + 130, -125]].map(([x, y]) => `<circle cx="${X(x)}" cy="${f1(y)}" r="6" fill="#ffffff"/>`).join("")) +
           insideWing(lo, [[w + 110, 130], [w + 40, 90]].map(([x, y]) => `<path d="M${X(20)} 40 Q${X(x * 0.6)} ${f1(y * 0.7)} ${X(20 + (x - 20) * 1.6)} ${f1(40 + (y - 40) * 1.6)}" fill="none" stroke="#1f1f22" stroke-width="3"/>`).join("") +
             [[w + 100, 150], [w + 60, 165], [w + 140, 110]].map(([x, y]) => `<circle cx="${X(x)}" cy="${f1(y)}" r="6" fill="#ffffff"/>`).join(""));
    } else if (style === "dragonfly") {
      const wing = (tx, ty, wd) => { const mx = tx * 0.55, my = ty * 0.55 + 18, d = `M${X(16)} ${ay} Q${X(mx)} ${f1(my - wd)} ${X(tx)} ${f1(ty)} Q${X(mx)} ${f1(my + wd)} ${X(16)} ${ay} Z`;
        return `<path d="${d}" fill="${color}" fill-opacity="0.5" stroke="${dk}" stroke-width="2.5"/>` +
          `<path d="M${X(16)} ${ay} Q${X(mx)} ${f1(my)} ${X(tx)} ${f1(ty)}" fill="none" stroke="${dk}" stroke-width="1.5"/>` +
          // (its cross-veins, edge to edge: drawn long, kept inside the wing)
          insideWing(d, [...Array(9)].map((_, j) => { const u = (j + 1) / 10, cx = 16 + (tx - 16) * u, cy = ay + (ty - ay) * u + 18 * Math.sin(Math.PI * u) * 0.5;
            return `<line x1="${X(cx - 5)}" y1="${f1(cy - wd * 1.2)}" x2="${X(cx + 5)}" y2="${f1(cy + wd * 1.2)}" stroke="${dk}" stroke-width="1" opacity="0.7"/>`; }).join("")); };
      t += wing(w + 210, 70, 26) + wing(w + 240, -60, 30) +
           `<path d="M${X(w + 120)} -40 l${X(14)} -6" stroke="#ffffff" stroke-width="3" opacity="0.6"/>`;
    } else if (style === "leaf") {
      const leaf = (tx, ty, wd) => { const mx = tx * 0.5, my = ty * 0.5 + ay * 0.5, d = `M${X(16)} ${ay} Q${X(mx - 10)} ${f1(my - wd)} ${X(tx)} ${f1(ty)} Q${X(mx + 10)} ${f1(my + wd)} ${X(16)} ${ay} Z`;
        let v = `<path d="${d}" fill="${color}" stroke="${dk}" stroke-width="3"/>`, veins = "";
        v +=
                `<path d="M${X(16)} ${ay} Q${X(mx)} ${f1(my)} ${X(tx)} ${f1(ty)}" fill="none" stroke="${dk}" stroke-width="2.5"/>`;
        // (its side veins, from the midrib out to the leaf's edge, and its shine: kept inside the leaf)
        for (let j = 1; j < 6; j++) { const u = j / 6, cx = 16 + (tx - 16) * u, cy = ay + (ty - ay) * u;
          for (const e of [-1, 1]) veins += `<path d="M${X(cx)} ${f1(cy)} q${X((tx - 16) * 0.08)} ${f1(e * wd * 0.9)} ${X((tx - 16) * 0.14)} ${f1(e * wd * 1.4)}" fill="none" stroke="${dk}" stroke-width="1.5" opacity="0.8"/>`; }
        return v + insideWing(d, veins + `<path d="M${X(mx * 0.7)} ${f1(my - wd * 0.4)} q${X(30)} -14 ${X(60)} -12" fill="none" stroke="${lt}" stroke-width="4" opacity="0.6"/>`); };
      t += leaf(w + 140, 120, 46) + leaf(w + 175, -110, 62);
    } else if (style === "petal") {
      const petal = (tx, ty, wd) => { const ang = Math.atan2(ty - ay, sd * (tx - 16)), len = Math.hypot(tx - 16, ty - ay);
        return `<g transform="translate(${X(16)} ${ay}) rotate(${f1(ang * 180 / Math.PI)})"><path d="M0 0 C${f1(len * 0.3)} ${f1(-wd)} ${f1(len * 1.05)} ${f1(-wd * 1.1)} ${f1(len)} 0 C${f1(len * 1.05)} ${f1(wd * 1.1)} ${f1(len * 0.3)} ${f1(wd)} 0 0 Z" fill="url(#fairy-petal)" stroke="${dk}" stroke-width="2.5"/>` +
          `<path d="M${f1(len * 0.15)} 0 L${f1(len * 0.8)} 0" stroke="${dk}" stroke-width="1.5" opacity="0.5"/></g>`; };
      t += petal(w + 120, 140, 44) + petal(w + 170, 20, 52) + petal(w + 130, -130, 56);
    } else {   // sparkle: a big round wing above, a smaller below, see-through, a shine, stars
      t += `<path d="M${X(16)} 22 C${X(w + 30)} -190 ${X(w + 220)} -150 ${X(w + 160)} -30 C${X(w + 120)} 30 ${X(50)} 36 ${X(16)} 28 Z" fill="${color}" fill-opacity="0.55" stroke="${lt}" stroke-width="4"/>` +
           `<path d="M${X(16)} 36 C${X(w + 110)} 40 ${X(w + 130)} 140 ${X(w + 50)} 150 C${X(24)} 150 ${X(12)} 90 ${X(16)} 36 Z" fill="${color}" fill-opacity="0.5" stroke="${lt}" stroke-width="4"/>` +
           `<path d="M${X(w + 40)} -110 Q${X(w + 110)} -140 ${X(w + 150)} -90" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.7"/>` +
           [[w + 120, -100, 0], [w + 170, -40, 0.4], [w + 70, 100, 0.8], [w + 200, -130, 1.2]].map(([x, y, d]) =>
             `<path d="M${X(x)} ${f1(y - 10)} L${X(x + 3)} ${f1(y - 3)} L${X(x + 10)} ${f1(y)} L${X(x + 3)} ${f1(y + 3)} L${X(x)} ${f1(y + 10)} L${X(x - 3)} ${f1(y + 3)} L${X(x - 10)} ${f1(y)} L${X(x - 3)} ${f1(y - 3)} Z" fill="#fff7c2" style="animation: fairy-twinkle 1.6s ${fairyPhase(1.6, d)}s infinite ease-in-out"/>`).join("");
    }
    // (turning about the shoulder, (ax, ay): the CSS turn is about the
    // group's own origin, moved there)
    if (lf && lf.dur < LFO_BLUR) { const b = wingLfoBlur(lf, sd, ax, ay, t); css.push(b.css); out.push(b.svg); continue; }
    const flap = lf ? wingLfoFlap(lf, sd) : null;
    if (flap) css.push(flap.css);
    out.push(flutter ? `<g transform="translate(${ax} ${ay})"><g style="${flap ? flap.style : `transform-origin: 0 0; animation: fairy-flap-${sd < 0 ? "l" : "r"} 0.9s ${fairyPhase(0.9)}s infinite ease-in-out`}">` +
                       `<g transform="translate(${-ax} ${-ay})">${t}</g></g></g>` : `<g>${t}</g>`);
  }
  const defs = style === "petal" ? `<defs><radialGradient id="fairy-petal" cx="0.2" cy="0.5" r="0.9"><stop offset="0" stop-color="${lt}"/><stop offset="1" stop-color="${color}"/></radialGradient></defs>` : "";
  return (css.length ? `<style>${css.join(" ")}</style>` : "") + defs + out.join("");
}
// a fairy's hem along the bottom of her tunic: from x0 to x1 at y, its style's shape
const fairyHem = (style, x0, x1, y) => {
  const m = (x0 + x1) / 2, q = (x1 - x0);
  return style === "leaf" ? ` Q${f1(x0 + q * 0.1)} ${f1(y + 20)} ${f1(m)} ${f1(y + 34)} Q${f1(x1 - q * 0.1)} ${f1(y + 20)} ${f1(x1)} ${f1(y)}`
    : style === "bluebell" ? ` Q${f1(m)} ${f1(y + 32)} ${f1(x1)} ${f1(y)}`
    : style === "sparkle" ? ` L${f1(m)} ${f1(y + 22)} L${f1(x1)} ${f1(y)}`
    : style === "toadstool" ? ` Q${f1(m)} ${f1(y + 14)} ${f1(x1)} ${f1(y)}`
    : ` C${f1(x0 - q * 0.05)} ${f1(y + 26)} ${f1(m - q * 0.25)} ${f1(y + 34)} ${f1(m)} ${f1(y + 32)} C${f1(m + q * 0.25)} ${f1(y + 34)} ${f1(x1 + q * 0.05)} ${f1(y + 26)} ${f1(x1)} ${f1(y)}`;
};
function shoeSvg(x, y, side, sh, skin) {
  const sc = sh.size / 100;
  if (sh.style === "hoof") {
    // a deer's: a dark hoof, split down the front
    const cx = x + side * 8 * sc, cy = y + 13 * sc;
    return `<path d="M${f1(cx - side * 18 * sc)} ${f1(cy + 12 * sc)} L${f1(cx - side * 14 * sc)} ${f1(cy - 10 * sc)} ` +
           `Q${f1(cx + side * 6 * sc)} ${f1(cy - 16 * sc)} ${f1(cx + side * 20 * sc)} ${f1(cy + 12 * sc)} Z" ` +
           `fill="#3a2a1e" stroke="#1d140d" stroke-width="2.5" stroke-linejoin="round"/>` +
           `<line x1="${f1(cx + side * 4 * sc)}" y1="${f1(cy - 8 * sc)}" x2="${f1(cx + side * 6 * sc)}" y2="${f1(cy + 12 * sc)}" ` +
           `stroke="#1d140d" stroke-width="2"/>`;
  }
  if (sh.style === "paw") {
    const cx = x + side * 10 * sc, cy = y + 12 * sc;
    return `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(28 * sc)}" ry="${f1(14 * sc)}" fill="${sh.color}" ` +
           `stroke="${darker(sh.color)}" stroke-width="2.5"/>` +
           [14, 21, 26].map((dx, i) => `<circle cx="${f1(cx + side * dx * sc)}" cy="${f1(cy + (i - 1) * 6 * sc)}" ` +
             `r="${f1(3.6 * sc)}" fill="${sh.pad}"/>`).join("");
  }
  if (sh.style === "bare")
    return `<ellipse cx="${f1(x + side * 12 * sc)}" cy="${f1(y + 8 * sc)}" rx="${f1(22 * sc)}" ry="${f1(10 * sc)}" ` +
           `fill="${skin}" stroke="${darker(skin)}" stroke-width="2.5"/>`;
  // a fairy's shoes, in their color: curly slippers with a pompom, petals
  // wrapped round, a leaf wrapped round, ankle boots with stars, or bare
  // feet with a ring of flowers at the ankle
  if (sh.style && sh.style.startsWith("fairy-")) {
    const c = sh.color || "#f472b6", dk = darker(c), lt = mix(c, "#ffffff", 0.4), X = v => f1(x + side * v * sc), Y = v => f1(y + v * sc);
    const kind = sh.style.slice(6);
    if (kind === "bare")
      return `<ellipse cx="${X(12)}" cy="${Y(8)}" rx="${f1(22 * sc)}" ry="${f1(10 * sc)}" fill="${skin}" stroke="${darker(skin)}" stroke-width="2.5"/>` +
        [-12, -4, 4, 12].map((dx, i) => [0, 72, 144, 216, 288].map(a => `<circle cx="${f1(x + dx * sc + 3 * sc * Math.cos(a * Math.PI / 180))}" cy="${f1(y - 6 * sc + 3 * sc * Math.sin(a * Math.PI / 180))}" r="${f1(2.6 * sc)}" fill="${["#f472b6", "#fde047", "#ffffff", "#a78bfa"][i]}"/>`).join("") +
          `<circle cx="${f1(x + dx * sc)}" cy="${f1(y - 6 * sc)}" r="${f1(1.6 * sc)}" fill="#f59e0b"/>`).join("");
    if (kind === "slipper")
      return `<path d="M${X(-14)} ${Y(-8)} Q${X(-16)} ${Y(20)} ${X(4)} ${Y(22)} Q${X(36)} ${Y(24)} ${X(48)} ${Y(8)} Q${X(58)} ${Y(-6)} ${X(50)} ${Y(-16)} Q${X(44)} ${Y(-2)} ${X(30)} ${Y(0)} Q${X(10)} ${Y(-4)} ${X(-14)} ${Y(-8)} Z" fill="${c}" stroke="${dk}" stroke-width="2.5" stroke-linejoin="round"/>` +
        `<circle cx="${X(50)}" cy="${Y(-18)}" r="${f1(6 * sc)}" fill="${lt}" stroke="${dk}" stroke-width="1.5"/>` +
        `<path d="M${X(-10)} ${Y(-4)} Q${X(10)} ${Y(4)} ${X(28)} ${Y(2)}" fill="none" stroke="${lt}" stroke-width="2.5"/>`;
    if (kind === "petal")
      return `<ellipse cx="${X(12)}" cy="${Y(12)}" rx="${f1(26 * sc)}" ry="${f1(12 * sc)}" fill="${dk}"/>` +
        [[-6, -10, -30], [12, -14, 0], [30, -8, 30], [40, 6, 60]].map(([px, py, r]) =>
          `<ellipse cx="${X(px)}" cy="${Y(py + 12)}" rx="${f1(11 * sc)}" ry="${f1(17 * sc)}" transform="rotate(${f1(side * r)} ${X(px)} ${Y(py + 12)})" fill="${c}" stroke="${dk}" stroke-width="2"/>`).join("") +
        `<circle cx="${X(12)}" cy="${Y(0)}" r="${f1(4 * sc)}" fill="#fde047"/>`;
    if (kind === "leaf")
      return `<path d="M${X(-14)} ${Y(-6)} Q${X(-14)} ${Y(22)} ${X(10)} ${Y(22)} Q${X(40)} ${Y(22)} ${X(58)} ${Y(4)} Q${X(36)} ${Y(-8)} ${X(-14)} ${Y(-6)} Z" fill="${c}" stroke="${dk}" stroke-width="2.5"/>` +
        `<path d="M${X(-8)} ${Y(8)} Q${X(24)} ${Y(10)} ${X(54)} ${Y(4)}" fill="none" stroke="${dk}" stroke-width="2"/>` +
        [6, 20, 34].map(v => `<path d="M${X(v)} ${Y(9)} l${f1(side * 8 * sc)} ${f1(-7 * sc)} M${X(v)} ${Y(9)} l${f1(side * 8 * sc)} ${f1(7 * sc)}" stroke="${dk}" stroke-width="1.5"/>`).join("") +
        `<path d="M${X(-10)} ${Y(-10)} q${f1(side * 12 * sc)} ${f1(-14 * sc)} ${f1(side * 20 * sc)} ${f1(-2 * sc)}" fill="none" stroke="#15803d" stroke-width="2.5"/>`;
    // sparkle boots
    return `<path d="M${X(-13)} ${Y(-30)} L${X(13)} ${Y(-30)} L${X(14)} ${Y(4)} Q${X(36)} ${Y(4)} ${X(46)} ${Y(12)} Q${X(48)} ${Y(24)} ${X(36)} ${Y(26)} L${X(-14)} ${Y(26)} Z" fill="${c}" stroke="${dk}" stroke-width="2.5" stroke-linejoin="round"/>` +
      `<rect x="${f1(x - 15 * sc)}" y="${f1(y - 34 * sc)}" width="${f1(30 * sc)}" height="${f1(7 * sc)}" rx="${f1(3 * sc)}" fill="${lt}"/>` +
      [[0, -18], [24, 14], [6, 6]].map(([px, py]) => `<path d="M${X(px)} ${Y(py - 5)} L${X(px + 1.5)} ${Y(py - 1.5)} L${X(px + 5)} ${Y(py)} L${X(px + 1.5)} ${Y(py + 1.5)} L${X(px)} ${Y(py + 5)} L${X(px - 1.5)} ${Y(py + 1.5)} L${X(px - 5)} ${Y(py)} L${X(px - 1.5)} ${Y(py - 1.5)} Z" fill="#fff7c2"/>`).join("");
  }
  const T = toesOf(sh);
  if (T) return toedFoot(x, y, side, sc, skin, T);
  const ps = SHOES[sh.style].map(([dx, dy]) => [x + side * dx * sc, y + dy * sc]);
  let s = poly(ps, sh.color, darker(sh.color));
  if (sh.style === "sneaker")
    s += line(x + side * -10 * sc, y + 22 * sc, x + side * 40 * sc, y + 22 * sc, 3 * sc, "#ffffff");
  if (sh.style === "clown")
    s += `<circle cx="${f1(x + side * 40 * sc)}" cy="${f1(y + 4 * sc)}" r="${f1(6 * sc)}" fill="#ffffff" stroke="${darker(sh.color)}" stroke-width="2"/>`;
  if (sh.style === "witchboot") {
    // a strap round the ankle, darker, and a gold buckle on its outside
    const st = mix(sh.color, "#000000", 0.35), bx = x + side * 6 * sc;
    s += `<rect x="${f1(x - 13 * sc)}" y="${f1(y - 16 * sc)}" width="${f1(26 * sc)}" height="${f1(8 * sc)}" fill="${st}"/>` +
         `<rect x="${f1(bx - 5 * sc)}" y="${f1(y - 18 * sc)}" width="${f1(10 * sc)}" height="${f1(12 * sc)}" rx="${f1(1.5 * sc)}" ` +
         `fill="none" stroke="#f2c230" stroke-width="${f1(2.6 * sc)}"/>`;
  }
  return s;
}
// (ticket 140) A foot seen front on (walking toward us) or from behind
// (walking away), at the ankle (x, y), in the friend's units: a sneaker's
// toe box with its laces and white rubber toe, or its heel; bare, the top of
// the foot with its toes along the front, the big toe on the inside, or the
// heel. As the foot lifts (0 to 1), its sole comes into view: under the
// toe, from the front; from behind, tipped up toward us as it pushes off.
// For the default friend: sneakers, bare feet, and toes ("human").
const FRONT_FEET = { sneaker: true, bare: true, human: true };
function footFront(x, y, side, sh, skin, away, lift) {
  // (front on, a foot is about as wide as the leg above it: 1.45 times the side view's units)
  const sc = 1.45 * (sh.size ?? 100) / 100, X = v => f1(x + v * sc), Y = v => f1(y + v * sc), inner = x > 0 ? -1 : 1;
  if (sh.style === "sneaker") {
    const c = sh.color, dk = darker(c);
    const upper = `M${X(-11)} ${Y(-2)} L${X(11)} ${Y(-2)} Q${X(17)} ${Y(6)} ${X(16)} ${Y(16)} Q${X(15)} ${Y(24)} ${X(0)} ${Y(24)} Q${X(-15)} ${Y(24)} ${X(-16)} ${Y(16)} Q${X(-17)} ${Y(6)} ${X(-11)} ${Y(-2)} Z`;
    if (!away)
      return `<ellipse cx="${X(0)}" cy="${Y(23)}" rx="${f1(16 * sc)}" ry="${f1((2 + 6 * lift) * sc)}" fill="#ffffff" stroke="#9ca3af" stroke-width="2"/>` +
             `<path d="${upper}" fill="${c}" stroke="${dk}" stroke-width="2.5" stroke-linejoin="round"/>` +
             `<ellipse cx="${X(0)}" cy="${Y(-1)}" rx="${f1(8 * sc)}" ry="${f1(2.6 * sc)}" fill="${mix(c, "#000000", 0.45)}"/>` +
             [5, 10].map(v => `<line x1="${X(-6)}" y1="${Y(v)}" x2="${X(6)}" y2="${Y(v)}" stroke="#ffffff" stroke-width="${f1(2.2 * sc)}" stroke-linecap="round"/>`).join("") +
             `<path d="M${X(-15)} ${Y(17)} Q${X(0)} ${Y(27)} ${X(15)} ${Y(17)}" fill="none" stroke="#ffffff" stroke-width="${f1(3 * sc)}"/>`;
    // (from behind: the heel, its tab and the white sole's edge; lifting, the sole itself, treads and all)
    const ry = (3 + 14 * lift) * sc, cy = y + (24 - 6 * lift) * sc;
    return `<path d="${upper}" fill="${c}" stroke="${dk}" stroke-width="2.5" stroke-linejoin="round"/>` +
           `<rect x="${X(-3.5)}" y="${Y(-4)}" width="${f1(7 * sc)}" height="${f1(11 * sc)}" rx="${f1(2 * sc)}" fill="${dk}"/>` +
           `<path d="M${X(-15)} ${Y(19)} Q${X(0)} ${Y(27)} ${X(15)} ${Y(19)}" fill="none" stroke="#ffffff" stroke-width="${f1(3 * sc)}"/>` +
           (lift > 0.05 ? `<ellipse cx="${X(0)}" cy="${f1(cy)}" rx="${f1(15 * sc)}" ry="${f1(ry)}" fill="#f3f4f6" stroke="#9ca3af" stroke-width="2"/>` +
             [-0.5, 0, 0.5].map(u => `<line x1="${X(-9)}" y1="${f1(cy + u * ry)}" x2="${X(9)}" y2="${f1(cy + u * ry)}" stroke="#c7cbd1" stroke-width="${f1(2 * sc)}"/>`).join("") : "");
  }
  // bare: the foot, and its sole a little paler
  const dk = darker(skin), sole = mix(skin, "#ffffff", 0.3);
  if (!away) {
    const n = sh.style === "human" ? Math.max(1, Math.min(10, Math.round(sh.toes ?? 5))) : 0;
    const toes = [...Array(n)].map((_, i) => { const u = n === 1 ? 0.5 : i / (n - 1);
      return [x + inner * (12 - 24 * u) * sc, y + (21 + 2 * Math.sin(Math.PI * u)) * sc, ((i === 0 && n > 1 ? 5 : 3.8 - 1.1 * u)) * sc]; });
    return `<ellipse cx="${X(0)}" cy="${Y(22)}" rx="${f1(14 * sc)}" ry="${f1((2 + 5 * lift) * sc)}" fill="${sole}" stroke="${dk}" stroke-width="2"/>` +
           toes.map(([tx, ty, r]) => `<circle cx="${f1(tx)}" cy="${f1(ty)}" r="${f1(r + 2)}" fill="${dk}"/>`).join("") +
           `<ellipse cx="${X(0)}" cy="${Y(11)}" rx="${f1(14 * sc)}" ry="${f1(12 * sc)}" fill="${skin}" stroke="${dk}" stroke-width="2.5"/>` +
           toes.map(([tx, ty, r]) => `<circle cx="${f1(tx)}" cy="${f1(ty)}" r="${f1(r)}" fill="${skin}"/>`).join("");
  }
  const ry = (3 + 12 * lift) * sc, cy = y + (20 - 5 * lift) * sc;
  return `<ellipse cx="${X(0)}" cy="${Y(13)}" rx="${f1(13 * sc)}" ry="${f1(12 * sc)}" fill="${skin}" stroke="${dk}" stroke-width="2.5"/>` +
         `<path d="M${X(-7)} ${Y(21)} Q${X(0)} ${Y(25)} ${X(7)} ${Y(21)}" fill="none" stroke="${dk}" stroke-width="2"/>` +
         (lift > 0.05 ? `<ellipse cx="${X(0)}" cy="${f1(cy)}" rx="${f1(13 * sc)}" ry="${f1(ry)}" fill="${sole}" stroke="${dk}" stroke-width="2"/>` +
           (sh.style === "human" && lift > 0.3 ? [-8, -3, 2, 6, 9].map((v, i) => `<circle cx="${X(-inner * v)}" cy="${f1(cy - ry + 2 * sc)}" r="${f1((i ? 2.6 : 3.4) * sc)}" fill="${sole}" stroke="${dk}" stroke-width="1.5"/>`).join("") : "") : "");
}
// A hand with fingers, in the hand's frame (the arm points along +x): a
// palm and, for each finger, a rounded stroke fanned out at angle `a`
// (degrees, 0 = straight on), `len` and `w` in units of the hand size, and
// an optional round pad of radius `tip` at its end. The whole outline is
// drawn first, then the fill over it, so fingers and palm merge into one
// shape with one outline.
function fingered(r, c, st, fingers, palm = 0.75) {
  const lw = 2.5, P = r * palm;
  const parts = fingers.map(({ a, len, w, tip = 0, base = 0.6 }) => {
    const t = a * Math.PI / 180, dx = Math.cos(t), dy = Math.sin(t);
    const b = r * base, e = b + r * len;
    return { x1: dx * b, y1: dy * b, x2: dx * e, y2: dy * e, w: r * w, tip: r * tip };
  });
  const layer = (fill, grow) =>
    `<ellipse rx="${f1(P * 1.05 + grow)}" ry="${f1(P + grow)}" fill="${fill}"/>` +
    parts.map(p => {
      // a very thin finger gets a thinner outline, or it would be all outline
      const g = Math.min(grow, p.w * 0.9);
      return `<line x1="${f1(p.x1)}" y1="${f1(p.y1)}" x2="${f1(p.x2)}" y2="${f1(p.y2)}" ` +
             `stroke="${fill}" stroke-width="${f1(p.w * 2 + 2 * g)}" stroke-linecap="round"/>` +
             (p.tip ? `<circle cx="${f1(p.x2)}" cy="${f1(p.y2)}" r="${f1(p.tip + g)}" fill="${fill}"/>` : "");
    }).join("");
  return layer(st, lw) + layer(c, 0);
}
// n hooked talons (4 unless the claws slider says otherwise) fanned out
// from a paw of radius R, in the hand's frame (the arm along +x): each a
// curved, tapering point, wide where it leaves the paw and sharp at the
// tip. `clawLen` is a percent of the usual length (the hand size sets the
// paw; this sets only the claws). Up to 4 they keep the usual spacing;
// more fan out wider, to nearly all the way round at 100, and get thinner
// so each still shows.
function talons(r, R, clawLen = 100, n = 4) {
  const k = (clawLen ?? 100) / 100;
  n = Math.max(1, Math.min(100, Math.round(n ?? 4)));
  const span = n <= 4 ? 118 * (n - 1) / 3 : Math.min(330, 118 + (n - 4) * 20);
  const step = n > 1 ? span / (n - 1) : 0;
  const degs = n === 4 ? [-62, -22, 18, 56] : Array.from({ length: n }, (_, i) => -3 - span / 2 + i * step);
  // half a gap between neighbours, where they leave the paw
  const room = n > 4 ? R * 0.8 * Math.sin(step * Math.PI / 360) : Infinity;
  const sw = n > 4 ? Math.max(0.6, Math.min(2, room * 0.5)) : 2;
  return degs.map(deg => {
    const t = deg * Math.PI / 180, dx = Math.cos(t), dy = Math.sin(t);
    const nx = -dy, ny = dx;                              // across the talon
    const len = r * 1.4 * k, hook = r * 0.55 * Math.max(0.5, Math.min(k, 2));
    const w = Math.max(r * 0.03, Math.min(r * 0.25 * Math.min(1, 0.6 + 0.4 * k), room * 1.1));
    const P = (along, across) => `${f1(dx * along + nx * across)} ${f1(dy * along + ny * across)}`;
    return `<path d="M${P(R * 0.8, -w)} Q${P(R + len * 0.75, -w * 0.9)} ${P(R + len, hook)} ` +
           `Q${P(R + len * 0.45, w * 0.6)} ${P(R * 0.8, w)} Z" fill="#f4ecd6" stroke="#5c4a2e" stroke-width="${f1(sw)}" stroke-linejoin="round"/>`;
  }).join("");
}
// The cat costumes (lion too) have claws on their paws.
const CLAWED = { cat: 1, tiger: 1, lion: 1, bobcat: 1, leopard: 1, cheetah: 1, jaguar: 1, wolf: 1 };
// A suit's hands: paws in the fur color, with claws on a cat.
const suitHands = (C, kind) => ({ style: kind === "deer" ? "hoof" : "paw", size: Math.max(state.hands.size, 12), color: C.fur, pad: C.accent,
                                  claws: !!CLAWED[kind], clawLen: state.hands.clawLen ?? 100,
                                  clawCount: state.hands.clawCount ?? 4 });
// How far a hand reaches from where it joins the arm, in any direction,
// in units of its size (fingers and claws stick out; a round hand doesn't).
const HAND_REACH = { round: 1, mitten: 1.65, star: 1.4, paw: 1.2, hoof: 1.2, claw: 2.4,
                     human: 2.3, alien: 3.2, alien4: 2.7, alien3: 3.2 };
const handReach = h => {
  const k = (h.clawLen ?? 100) / 100;
  const per = h.style === "claw" ? 1.3 + 1.4 * k
            : h.style === "paw" && h.claws ? 1.6 + 1.4 * k
            : HAND_REACH[h.style] ?? 2;
  return per * h.size + 4;
};
// An alien hand with n long, thin fingers, each with a round pad at its
// tip, fanned out: 3 is the tree-frog hand (big pads), more spread wider
// with smaller pads, 100 is nearly a full circle of them.
function alienFingers(n) {
  n = Math.max(1, Math.min(100, Math.round(n)));
  const span = n <= 1 ? 0 : Math.min(330, 90 + (n - 3) * 14);
  const step = n > 1 ? span / (n - 1) : 90, half = Math.sin(step * Math.PI / 360);
  const w = Math.max(0.018, Math.min(0.2, 0.55 * half)), tip = Math.max(0.03, Math.min(0.36, 0.95 * half));
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = n > 1 ? -span / 2 + i * step : 0, t = span ? Math.abs(a) / (span / 2) : 0;
    out.push({ a, len: 2.15 - 0.3 * t, w, tip });
  }
  return out;
}
// A human hand with n fingers, thumb included (1 is a thumb alone, a
// thumbs-up): the n - 1 fingers fan out
// wider as there are more of them (and thinner, so each still shows),
// the middle ones longest, and the thumb just past the first. At 100, a
// fringe almost all the way round the palm.
function manyFingers(n) {
  n = Math.max(1, Math.min(100, Math.round(n)));
  const k = n - 1, out = [];
  const span = k <= 1 ? 0 : Math.min(300, 24 * Math.min(k - 1, 3) + Math.max(0, k - 4) * 9);
  const step = k > 1 ? span / (k - 1) : 0;
  const w = k > 1 ? Math.max(0.05, Math.min(0.26, 0.75 * Math.sin(step * Math.PI / 360))) : 0.26;
  for (let i = 0; i < k; i++) {
    const a = k > 1 ? -span / 2 + i * step : 0, t = span ? Math.abs(a) / (span / 2) : 0;
    out.push({ a, len: 1.3 - 0.4 * t, w });
  }
  out.push({ a: -Math.min(span / 2 + 40, 175), len: 0.85, w: Math.max(w, 0.12), base: 0.5 });
  return out;
}
const starPoints = h => Math.max(1, Math.min(100, Math.round(h.starPoints ?? 5)));
// Each hand style's own angle slider, in radians, turning the hand about
// the wrist (0, as it always was, unless the slider says otherwise): a
// star's turns only as far as its next point, where it looks as it began;
// the others have no such symmetry, so they turn all the way round. (A
// round hand looks the same however it turns, so it has none.)
const HAND_TURN = { mitten: "mittenAngle", claw: "clawAngle", human: "humanAngle", alien: "alienAngle",
                    alien4: "alienAngle", alien3: "alienAngle" };
const handPeriod = h => h.style === "star" ? 2 * Math.PI / starPoints(h) : 2 * Math.PI;
function handSvg(x, y, angle, side, h, skin) {
  const c = h.color === "skin" ? skin : h.color, st = darker(c), r = h.size;
  // (the star turns its own points; the others turn whole, in the mirror
  // the left hand gets, so the two hands turn alike)
  const turn = HAND_TURN[h.style] ? (h[HAND_TURN[h.style]] ?? 0) * 180 / Math.PI : 0;
  const turned = inner => turn ? `<g transform="rotate(${f1(turn)})">${inner}</g>` : inner;
  const g = inner => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(angle)}) scale(1 ${side})">${turned(inner)}</g>`;
  switch (h.style) {
    case "round":
      return g(`<circle r="${r}" fill="${c}" stroke="${st}" stroke-width="2.5"/>`);
    case "mitten":
      return g(`<ellipse cx="${r * 0.4}" rx="${r * 1.2}" ry="${r * 0.85}" fill="${c}" stroke="${st}" stroke-width="2.5"/>` +
               `<ellipse cx="${r * 0.1}" cy="${-r * 0.9}" rx="${r * 0.35}" ry="${r * 0.5}" fill="${c}" stroke="${st}" stroke-width="2.5"/>`);
    case "star": {
      // n points (5 unless the slider says otherwise), the first straight
      // up, then turned by the angle slider (radians, up to the turn to
      // the next point), with a dip between each two; a wide gap (1 or 2
      // points) dips in a rounded curve, so 1 is a teardrop and 2 a lens.
      // Many points get a thinner outline, so each still shows.
      const n = starPoints(h);
      const gap = 2 * Math.PI / n, dips = n >= 3 ? 1 : n === 2 ? 2 : 5;
      const ps = [];
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (h.starAngle ?? 0) + i * gap;
        ps.push([r * 1.4 * Math.cos(a), r * 1.4 * Math.sin(a)]);
        for (let j = 1; j <= dips; j++) {
          const b = a + gap * j / (dips + 1);
          ps.push([r * 0.55 * Math.cos(b), r * 0.55 * Math.sin(b)]);
        }
      }
      const sw = n > 5 ? Math.max(0.6, Math.min(2.5, Math.PI * r * 0.55 / n)) : 2.5;
      return g(poly(ps, c, st, sw));
    }
    case "paw": {
      // a costume's paw: fur, with a pad and three toe pads (and on a cat
      // costume, the claw hand's talons sticking out of it)
      const pad = h.pad;
      return g((h.claws ? talons(r, r * 1.0, h.clawLen, h.clawCount) : "") +
               `<circle r="${r * 1.15}" fill="${c}" stroke="${st}" stroke-width="2.5"/>` +
               `<ellipse cx="${-r * 0.15}" rx="${r * 0.42}" ry="${r * 0.5}" fill="${pad}"/>` +
               [[0.62, -0.6], [0.86, 0], [0.62, 0.6]].map(([px, py]) =>
                 `<circle cx="${r * px}" cy="${r * py}" r="${r * 0.22}" fill="${pad}"/>`).join(""));
    }
    case "hoof": {
      // a deer suit's hand: a dark split hoof at the end of the furry arm
      return g(`<circle r="${r * 1.05}" fill="${c}" stroke="${st}" stroke-width="2.5"/>` +
               `<path d="M${r * 0.35} ${-r * 0.95} Q${r * 1.45} 0 ${r * 0.35} ${r * 0.95} Z" fill="#3a2a1e" stroke="#1d140d" stroke-width="2"/>` +
               `<line x1="${r * 0.4}" y1="0" x2="${r * 1.2}" y2="0" stroke="#1d140d" stroke-width="2"/>`);
    }
    case "claw": {
      // a furry paw with four hooked talons
      return g(talons(r, r * 0.7, h.clawLen, h.clawCount) +
               `<ellipse cx="${r * 0.1}" rx="${r * 0.85}" ry="${r * 0.8}" fill="${c}" stroke="${st}" stroke-width="2.5"/>` +
               `<ellipse cx="${-r * 0.1}" cy="${r * 0.05}" rx="${r * 0.32}" ry="${r * 0.36}" fill="${st}" opacity="0.35"/>`);
    }
    case "human":
      if ((h.fingers ?? 5) !== 5) return g(fingered(r, c, st, manyFingers(h.fingers)));
      // a palm, four fingers (the middle one longest) and a thumb
      return g(fingered(r, c, st, [
        { a: -36, len: 1.15, w: 0.25 }, { a: -12, len: 1.35, w: 0.26 }, { a: 12, len: 1.25, w: 0.25 },
        { a: 35, len: 1.0, w: 0.23 }, { a: -95, len: 0.85, w: 0.28, base: 0.5 }]));
    case "alien":
      return g(fingered(r, c, st, alienFingers(h.alienFingers ?? 3), 0.55));
    // the 4- and 3-finger styles before the slider, so saved friends still draw
    case "alien4": return g(fingered(r, c, st, alienFingers(4), 0.6));
    case "alien3": return g(fingered(r, c, st, alienFingers(3), 0.55));
  }
  return "";
}

// A WITCH'S THINGS. The hat, in the round head's units: a wide brim just
// below the crown, a tall cone leaning over, bent at the tip, a band in
// the trim color and a gold buckle.
// (ticket 124) in profile (dir, the way she faces) its tip bends back,
// away from her face, and the band's buckle is seen edge on at its front
function witchHat(WC, rx = 128, dir = 0) {
  const c = WC.witchColor, ln = darker(c);
  const cone = `<path d="M46 42 Q72 -24 98 -84 Q112 -116 154 -126 Q128 -104 122 -80 Q134 -20 154 42 Q100 54 46 42 Z" ` +
    `fill="${c}" stroke="${ln}" stroke-width="3" stroke-linejoin="round"/>`;
  return `<ellipse cx="100" cy="44" rx="${f1(rx)}" ry="${f1(18 * Math.max(1, rx / 128) ** 0.5)}" fill="${c}" stroke="${ln}" stroke-width="3"/>` +
    (dir > 0 ? `<g transform="translate(200 0) scale(-1 1)">${cone}</g>` : cone) +
    `<path d="M52 24 Q100 34 149 24 L152 38 Q100 48 49 38 Z" fill="${WC.trimColor}"/>` +
    (dir ? `<rect x="${dir > 0 ? 141 : 51}" y="${dir > 0 ? 23 : 23}" width="8" height="16" rx="2" fill="none" stroke="#f2c230" stroke-width="3"/>`
         : `<rect x="89" y="25" width="22" height="16" rx="2" fill="none" stroke="#f2c230" stroke-width="3.5"/>`);
}
// A cat sitting on the left shoulder (the picture's left), in body units,
// a tuxedo cat: its fur, with a white blaze down its nose, a white chest
// and white boots on its front paws ("off" leaves it all fur). Its tail
// hangs down behind; its eyes and nose in their own colors.
// (wag: its tail swings slowly about its root, as the healer's cat's does
// on its shelf)
// (wag: true for the healer's cat's own slow wag, or a cat's wag from catWag,
// with an LFO or at its own pace, begun its own offset into the cycle; curl:
// sitting on the floor, its tail curled round its front paws, the tip
// twitching with the wag, instead of hanging down over a shelf's edge)
function shoulderCat(w, WC, wag = false, curl = false) {
  const x = -(w - 4), y = -9, fur = WC.catFur, ln = darker(fur), wh = WC.catWhite;
  const tux = wh && wh !== "off", stroke = `fill="none" stroke="${fur}" stroke-width="6" stroke-linecap="round"`;
  const hang = `<path d="M${x + 8} ${y - 6} Q${x + 34} ${y + 6} ${x + 24} ${y + 42}" ${stroke}/>`;
  const curlD = v => `M${x + 11} ${y - 8} Q${x + 26} ${y + 2} ${x + 8} ${y + 3} Q${x - 6} ${y + 4} ${f1(x - 16 + v)} ${f1(y - 1 - 6 * v)}`;
  const tail = curl ? (wag && wag !== true ? wagged(wag, sh => `<path d="${curlD(0)}" ${stroke}>${wagAnim(wag, "d", v => curlD((1 + v) / 2), sh)}</path>`) : `<path d="${curlD(0)}" ${stroke}/>`)
    : wag === true ? `<g>${hang}<animateTransform attributeName="transform" type="rotate" values="-14 ${x + 8} ${y - 6};16 ${x + 8} ${y - 6};-14 ${x + 8} ${y - 6}" dur="3.4s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/></g>`
    : wag ? wagged(wag, sh => `<g>${hang}${wagAnim(wag, "transform", (v, amp) => `${f1(-(8 + 20 * amp) * v)} ${x + 8} ${y - 6}`, sh)}</g>`) : hang;
  return (curl ? "" : tail) +
    `<ellipse cx="${x}" cy="${y - 17}" rx="15" ry="18" fill="${fur}" stroke="${ln}" stroke-width="1.5"/>` +
    (tux ? `<path d="M${x - 9} ${y - 32} Q${x - 3} ${y - 26} ${x + 3} ${y - 32} Q${x + 6} ${y - 14} ${x - 3} ${y - 2} Q${x - 12} ${y - 14} ${x - 9} ${y - 32} Z" fill="${wh}"/>` : "") +
    (curl ? tail : "") +
    // the front paws, side by side at the front of its body
    [x - 8, x + 2].map(px => `<ellipse cx="${px}" cy="${y - 2}" rx="5" ry="4" fill="${tux ? wh : fur}" stroke="${ln}" stroke-width="1.2"/>`).join("") +
    poly([[x - 15, y - 44], [x - 13, y - 64], [x - 4, y - 52]], fur, ln, 1.5) +
    poly([[x + 1, y - 52], [x + 8, y - 64], [x + 9, y - 44]], fur, ln, 1.5) +
    `<circle cx="${x - 3}" cy="${y - 42}" r="13" fill="${fur}" stroke="${ln}" stroke-width="1.5"/>` +
    (tux ? `<path d="M${x - 4.5} ${y - 50} L${x - 1.5} ${y - 50} L${x + 1} ${y - 36} Q${x - 3} ${y - 31} ${x - 7} ${y - 36} Z" fill="${wh}"/>` : "") +
    [x - 8, x + 2].map(ex => `<ellipse cx="${ex}" cy="${y - 43}" rx="3.2" ry="3.8" fill="${WC.catEyes}"/>` +
                             `<ellipse cx="${ex}" cy="${y - 43}" rx="1" ry="3.2" fill="#111"/>`).join("") +
    `<path d="M${x - 5} ${y - 37} L${x - 1} ${y - 37} L${x - 3} ${y - 35} Z" fill="${WC.catNose}"/>`;
}
// A cat's wag: its tail swinging (or its tip twitching) once a cycle, with an
// LFO in time with the music, or else at its own pace (each cat its own,
// i its place in the castle's list); either way begun its own offset into the
// cycle, so no two cats wag together. The key says what its drawing depends on.
function catWag(C, i) {
  const lf = lfoNow(C.lfo), off = (C.offset ?? 0) / 100;
  if (lf) return { lf, off, key: [lf.dur.toFixed(4), lf.shape, lf.amp.toFixed(2), lfoBegin(lf, off)].join() };
  return { lf: null, off, dur: 2.6 + 0.37 * ((i * 5) % 8), key: "own" };
}
// The music's clock, in seconds (lfoNow's): where the tune is while it
// plays, else the page's own time. An LFO's wave is where this clock is,
// round its cycle.
const musicSeconds = () => playing && typeof audio !== "undefined" && audio
  ? playing.s0 * playing.sd + audio.currentTime - playing.t0 : performance.now() / 1000;
// How far the picture's own clock (its animations') is ahead of the music's.
// The two run at the same speed, so the gap stays put; but the picture's
// clock moves on only once a frame, and the music's all the time, so a gap
// read afresh at every draw wobbled by a frame, and a slow frame wobbled it
// past lfoBegin's rounding: the scene's text changed from draw to draw, and
// the whole scene was built again on every move of a drag, slowing every
// frame further, until dragging the friend ground to a halt and the music
// stuttered (ticket 117). So the gap is measured once and kept, and measured
// again only when it truly moves (by more than PIC_GAP_SLACK seconds): the
// music starting, stopping or jumping. During a drag the gap is kept as it
// was, and measured again once it ends (ticket 133): a press on the picture
// can start the music, and measuring it then built the whole scene again in
// the middle of the drag.
const PIC_GAP_SLACK = 0.25;
let picGap = null, picDragging = false;
function picGapNow() {
  const pic = document.getElementById("pic"), now = pic && pic.getCurrentTime ? pic.getCurrentTime() : 0, g = now - musicSeconds();
  if (picGap === null || (Math.abs(g - picGap) > PIC_GAP_SLACK && !picDragging)) picGap = g;
  return picGap;
}
// when, in the picture's own time, an animation must have begun for its wave
// to be where the LFO's is now, `shift` of a cycle on (rounded, to a 20th of a
// second or a 16th of a cycle, so the scene's text stays the same from draw to
// draw while the music keeps time); an LFO too fast to show is a blur, in time
// with nothing, its copies just spread round the cycle
function lfoBegin(lf, shift) {
  if (lf.dur < LFO_BLUR) return -(((shift % 1) + 1) % 1) * lf.dur;
  const step = Math.min(0.05, lf.dur / 16);
  return Math.round(((picGapNow() - shift * lf.dur) % lf.dur + lf.dur) % lf.dur / step) * step;
}
// a wag's animation of `attr` (a rotation for "transform"): val(w, depth) its
// value at the wave's height w (-1 to 1); sh: a further shift, for a blur's copies
function wagAnim(W, attr, val, sh = 0, type = "rotate") {
  const N = 16, vals = [], kt = [], shape = W.lf ? W.lf.shape : "sine", amp = W.lf ? W.lf.amp : 0.4, dur = W.lf ? W.lf.dur : W.dur;
  for (let j = 0; j <= N; j++) { vals.push(val(lfoWave(shape, j / N), amp)); kt.push((j / N).toFixed(4)); }
  const begin = W.lf ? lfoBegin(W.lf, W.off + sh) : -(((W.off + sh) % 1) * dur);
  return `<${attr === "transform" ? `animateTransform attributeName="transform" type="${type}"` : `animate attributeName="${attr}"`} values="${vals.join(";")}" ` +
         `keyTimes="${kt.join(";")}" dur="${dur.toFixed(4)}s" begin="${begin.toFixed(4)}s" repeatCount="indefinite"/>`;
}
// a tail drawn wagging, by tailAt(shift): once, or with an LFO too fast to
// show, as the wings are (wingLfoBlur), a blur of 8 see-through copies, each
// an eighth of a cycle behind the last
const wagged = (W, tailAt) => W.lf && W.lf.dur < LFO_BLUR
  ? [...Array(8)].map((_, j) => `<g opacity="0.25">${tailAt(j / 8)}</g>`).join("") : tailAt(0);
// A scene's thing moving with the music: an animation of `attr` whose values
// follow the wave (val(w, depth)) of the LFO the scene's quick or slow things
// follow (pace "fast": o.lfoFast, D to start with; "slow": o.lfoSlow, E), begun
// `off` of a cycle on, so things side by side each go their own way; or, with
// no LFO, its own steady animation (own). It reads the LFO through the
// scene's options (sceneOpts), so the mixing board's changes to it draw the
// scene again; a part holding it takes sceneLfoKey(o, pace) among its inputs.
// (a third pace, "wings": o.lfoWings, F to start with, for butterflies' wings)
const sceneLfoName = (o, pace) => { const L = pace === "fast" ? o.lfoFast ?? "D" : pace === "wings" ? o.lfoWings ?? "F" : o.lfoSlow ?? "E"; return LFO_NAMES.includes(L) ? L : null; };
const sceneLfoKey = (o, pace) => { const L = sceneLfoName(o, pace); return L ? L + o["lfo:" + L] : "own"; };
function sceneLfo(o, pace, off, attr, val, own = "", type = "rotate") {
  const L = sceneLfoName(o, pace), lf = L && (void o["lfo:" + L], lfoNow(L));
  return lf ? wagAnim({ lf, off }, attr, val, 0, type) : own;
}
// An animation as it is written (its values, its keyTimes), but in time with
// the scene's quick or slow LFO: its round as long as the LFO's, begun where
// the LFO's wave is now, `off` of a round on (the wave's shape and depth are
// the animation's own); with no LFO, as written. For things that already move
// in their own way: flames, vines, glows, pennants. Each animation in `own`
// is retimed.
function lfoTimed(o, pace, off, own) {
  const L = sceneLfoName(o, pace), lf = L && (void o["lfo:" + L], lfoNow(L));
  if (!lf) return own;
  const begin = lfoBegin(lf, off).toFixed(4), dur = lf.dur.toFixed(4);
  return own.replace(/<(animate\w*) ([^>]*?)(\/?)>/g, (m, tag, attrs, close) =>
    `<${tag} begin="${begin}s" ${attrs.replace(/ ?begin="[^"]*"/, "").replace(/dur="[^"]*"/, `dur="${dur}s"`)}${close}>`);
}
// A thing swaying about its foot or its hook (x, y), by up to `deg` either
// way, with the scene's slow LFO, each its own way in (`off`), or at its own
// slow pace: palm fronds, seaweed, cages, lanterns
const swaying = (o, inner, x, y, deg, off, own = 5) => `<g>${sceneLfo(o, "slow", off, "transform", (v, amp) => `${f1(deg * (0.5 + 1.5 * amp) * v)} ${f1(x)} ${f1(y)}`,
  `<animateTransform attributeName="transform" type="rotate" values="${-deg} ${f1(x)} ${f1(y)};${deg} ${f1(x)} ${f1(y)};${-deg} ${f1(x)} ${f1(y)}" dur="${own}s" repeatCount="indefinite"/>`)}${inner}</g>`;
// Butterflies, each fluttering round its own little loop through the air
// about a spot [x, y, size]: their wings beating with the scene's wings LFO
// (F, a wingbeat that looks like one, to start with; one too fast to see is
// a blur, as the fairy's wings are), bobbing with its quick one, each a
// different way into both (or at their own pace)
function butterfliesSvg(c, spots, cols = ["#f59e0b", "#60a5fa", "#f472b6", "#a78bfa", "#fde047"]) {
  const { k, o } = c, L = sceneLfoName(o, "wings"), lf = L && (void o["lfo:" + L], lfoNow(L));
  return spots.map(([x, y, sz], i) => {
    const col = cols[i % cols.length], rx = (30 + 10 * (i % 3)) * k, ry = (12 + 6 * (i % 2)) * k, d = (7 + 2 * (i % 3)).toFixed(1), off = (i * 0.31) % 1;
    const wings = [-1, 1].map(sd => `<path d="M0 0 Q${sd * 9} -14 ${sd * 15} -8 Q${sd * 14} 0 0 0 Z" fill="${col}" stroke="#3a2a1a" stroke-width="0.7"/>` +
      `<path d="M0 0 Q${sd * 11} 4 ${sd * 9} 11 Q${sd * 3} 9 0 0 Z" fill="${mix(col, "#ffffff", 0.3)}" stroke="#3a2a1a" stroke-width="0.7"/>`).join("");
    const W = { lf, off }, beat = lf ? wagged(W, sh => `<g>${wagAnim(W, "transform", v => `${(0.2 + 0.8 * (1 + v) / 2).toFixed(2)} 1`, sh, "scale")}${wings}</g>`)
      : `<g><animateTransform attributeName="transform" type="scale" values="1 1;0.2 1;1 1" dur="${(0.35 + 0.05 * (i % 3)).toFixed(2)}s" repeatCount="indefinite"/>${wings}</g>`;
    const bob = sceneLfo(o, "fast", off, "transform", (v, amp) => `0 ${f1((3 + 9 * amp) * k * v)}`, "", "translate");
    return `<g><animateMotion path="M${f1(x - rx)} ${f1(y)} a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(2 * rx)} 0 a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-2 * rx)} 0" dur="${d}s" begin="-${(i * 1.7).toFixed(1)}s" repeatCount="indefinite"/>` +
      `<g>${bob}<g transform="scale(${(sz * k).toFixed(3)})">${beat}<ellipse rx="1.6" ry="6" fill="#3a2a1a"/></g></g></g>`;
  }).join("");
}
// A cat asleep, curled up nose to tail, (0, 0) under its middle: it breathes
// slowly, the tip of its tail twitching with its wag, and now and then a "z"
// rises from it
function sleepingCat(WC, W, i) {
  const fur = WC.catFur, ln = darker(fur), wh = WC.catWhite, tux = wh && wh !== "off";
  const stroke = `fill="none" stroke="${fur}" stroke-width="6" stroke-linecap="round"`;
  const tailD = v => `M24 -9 Q32 1 12 2 Q-4 3 ${f1(-12 + 2 * v)} ${f1(-2 - 5 * v)}`;
  const breathe = (3.4 + 0.45 * (i % 4)).toFixed(2), zb = `-${(1.3 * i % 4).toFixed(1)}s`;
  return `<ellipse cx="2" cy="1" rx="31" ry="4" fill="#000000" opacity="0.18"/>` +
    `<g><animateTransform attributeName="transform" type="scale" values="1 1;1.02 1.06;1 1" dur="${breathe}s" begin="-${(0.9 * i).toFixed(1)}s" repeatCount="indefinite"/>` +
    `<ellipse cx="2" cy="-12" rx="28" ry="13" fill="${fur}" stroke="${ln}" stroke-width="1.5"/>` +
    `<path d="M8 -20 Q22 -22 25 -9" fill="none" stroke="${ln}" stroke-width="1.2" opacity="0.6"/></g>` +
    (tux ? `<ellipse cx="-12" cy="-3" rx="7" ry="3.5" fill="${wh}" stroke="${ln}" stroke-width="1"/>` : "") +
    wagged(W, sh => `<path d="${tailD(0)}" ${stroke}>${wagAnim(W, "d", v => tailD((1 + v) / 2), sh)}</path>`) +
    poly([[-29, -17], [-31, -30], [-22, -23]], fur, ln, 1.5) + poly([[-16, -24], [-10, -33], [-8, -19]], fur, ln, 1.5) +
    `<circle cx="-18" cy="-14" r="11" fill="${fur}" stroke="${ln}" stroke-width="1.5"/>` +
    (tux ? `<ellipse cx="-18" cy="-8.5" rx="5.5" ry="3.5" fill="${wh}"/>` : "") +
    `<path d="M-25 -15 q2.5 2 5 0 M-16 -15 q2.5 2 5 0" fill="none" stroke="${fur === "#1f1f22" ? "#8a8a96" : "#2a2420"}" stroke-width="1.3" stroke-linecap="round"/>` +
    `<path d="M-20 -10.5 L-16 -10.5 L-18 -8.5 Z" fill="${WC.catNose}"/>` +
    `<text x="-26" y="-30" font-size="10" font-weight="bold" font-family="sans-serif" fill="#ffffff" stroke="#5a4a8a" stroke-width="0.7" opacity="0">z` +
    `<animate attributeName="y" values="-28;-50" dur="4s" begin="${zb}" repeatCount="indefinite"/>` +
    `<animate attributeName="opacity" values="0;0.9;0" dur="4s" begin="${zb}" repeatCount="indefinite"/></text>`;
}
// A cat walking, seen from the side, facing right, (0, 0) on the ground
// under its middle: its legs swinging by pairs, its tail up, swaying with its wag
function walkingCat(WC, W, i) {
  const fur = WC.catFur, ln = darker(fur), wh = WC.catWhite, tux = wh && wh !== "off", step = (0.8 + 0.06 * (i % 3)).toFixed(2);
  const leg = (hx, ph, near) => `<g><line x1="${hx}" y1="-21" x2="${hx}" y2="-1" stroke="${near ? fur : mix(fur, "#000000", 0.3)}" stroke-width="5" stroke-linecap="round"/>` +
    (near && tux ? `<circle cx="${hx}" cy="-2" r="2.6" fill="${wh}"/>` : "") +
    `<animateTransform attributeName="transform" type="rotate" values="-22 ${hx} -21;22 ${hx} -21;-22 ${hx} -21" dur="${step}s" begin="-${(ph * step).toFixed(2)}s" repeatCount="indefinite"/></g>`;
  return `<ellipse cx="0" cy="0" rx="24" ry="3.5" fill="#000000" opacity="0.18"/>` + leg(-13, 0, false) + leg(13, 0.5, false) +
    wagged(W, sh => `<g><path d="M-17 -27 Q-34 -32 -29 -52" fill="none" stroke="${fur}" stroke-width="6" stroke-linecap="round"/>` +
      wagAnim(W, "transform", (v, amp) => `${f1((6 + 16 * amp) * v)} -17 -27`, sh) + `</g>`) +
    `<ellipse cx="0" cy="-25" rx="21" ry="10" fill="${fur}" stroke="${ln}" stroke-width="1.5"/>` +
    (tux ? `<ellipse cx="14" cy="-21" rx="6" ry="6.5" fill="${wh}"/>` : "") +
    leg(-11, 0.5, true) + leg(15, 0, true) +
    poly([[16, -38], [17, -50], [23, -41]], fur, ln, 1.5) + poly([[24, -42], [29, -51], [31, -37]], fur, ln, 1.5) +
    `<circle cx="23" cy="-33" r="10" fill="${fur}" stroke="${ln}" stroke-width="1.5"/>` +
    (tux ? `<ellipse cx="28" cy="-28.5" rx="5" ry="3.2" fill="${wh}"/>` : "") +
    `<ellipse cx="27" cy="-35" rx="2.3" ry="2.9" fill="${WC.catEyes}"/><ellipse cx="27.6" cy="-35" rx="0.8" ry="2.4" fill="#111"/>` +
    `<path d="M32 -31 L34 -31 L33 -29.5 Z" fill="${WC.catNose}"/>` +
    `<path d="M30 -29 L40 -31 M30 -28 L40 -27" stroke="${tux || fur === "#1f1f22" ? "#d8d8de" : "#3a3a3a"}" stroke-width="0.6"/>`;
}

// A broom through the hand at H, in body units: the stick, leaning a
// little, 120 above the hand and 52 below it, then the bristles flaring
// out under a band in the trim color.
function broomSvg([hx, hy], trim) {
  const top = [hx + 16, hy - 120], b = [hx - 8, hy + 52];
  const dx = b[0] - top[0], dy = b[1] - top[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
  const at = (along, across) => [b[0] + ux * along + nx * across, b[1] + uy * along + ny * across];
  return line(top[0], top[1], b[0], b[1], 7, "#8b5a2b", "#4a2f16") +
    poly([at(0, 8), at(58, 25), at(66, 0), at(58, -25), at(0, -8)], "#d9a441", "#8a6420", 2.5) +
    [-2, -1, 0, 1, 2].map(k => { const [x1, y1] = at(4, k * 3), [x2, y2] = at(58, k * 9);
      return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#a87a2a" stroke-width="1.5"/>`; }).join("") +
    line(at(5, 9)[0], at(5, 9)[1], at(5, -9)[0], at(5, -9)[1], 6, trim);
}
