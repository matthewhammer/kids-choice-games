"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 178) Part 2 of 26 of the game's script, run in order by index.html.

// ===================== HELPERS =====================

const idiv = (a, b) => Math.trunc(a / b);           // Hazel's Int division
const mod = (a, n) => a - idiv(a, n) * n;
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const f1 = x => (Math.round(x * 10) / 10).toString();
const pts = ps => ps.map(([x, y]) => f1(x) + "," + f1(y)).join(" ");
// (ticket 151) a polygon grown outward by d, its corners mitred (a mitre
// held to 4 d, where a sharp corner would spike): what a stroke 2 d wide
// adds round a filled polygon, for a clip, which has no strokes
const growPoly = (ps, d) => {
  const n = ps.length;
  let a = 0;
  for (let i = 0; i < n; i++) { const [x1, y1] = ps[i], [x2, y2] = ps[(i + 1) % n]; a += x1 * y2 - x2 * y1; }
  const s = a > 0 ? 1 : -1, nrm = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [s * dy / l, -s * dx / l]; };
  return ps.map((p, i) => {
    const n1 = nrm(ps[(i - 1 + n) % n], p), n2 = nrm(p, ps[(i + 1) % n]), c = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    let ox = d * (n1[0] + n2[0]) / Math.max(c, 1e-6), oy = d * (n1[1] + n2[1]) / Math.max(c, 1e-6);
    const m = Math.hypot(ox, oy);
    if (m > 4 * d) { ox *= 4 * d / m; oy *= 4 * d / m; }
    return [p[0] + ox, p[1] + oy];
  });
};
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgbToHex([r, g, b]) { return "#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join(""); }
// (ticket 258) a drawing marked with the procedure that drew it, for ♿ 🧩 what it's made of (madeOfHud): a group, its
// data-proc that name; nothing else changes
const drawnBy = (name, svg) => `<g data-proc="${name}">${svg}</g>`;
// (ticket 274's rule: an id named by what it holds, not by chance, so the drawing is the same every time and two friends'
// ids never meet) shapeId(pre, text): `pre` and a hash of the text (FNV-1a, in base 36); shapeClip(pre, d): a clip path of
// the one path d, named so, { id, def }. (ticket 564: one namer for every such id; the ninja's clips, ninjaClip, and
// drawNow's fig-clip each had a copy of the hash, so a crown's gem, or anything new with a clip, would have made a third)
const shapeId = (pre, text) => { let h = 2166136261; for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return pre + (h >>> 0).toString(36); };
const shapeClip = (pre, d) => { const id = shapeId(pre, d); return { id, def: `<clipPath id="${id}"><path d="${d}"/></clipPath>` }; };
const mix = (h, to, t) => { const a = hexToRgb(h), b = hexToRgb(to); return rgbToHex(a.map((v, i) => v + (b[i] - v) * t)); };
const darker = h => mix(h, "#000000", 0.45);
const lighter = h => mix(h, "#ffffff", 0.45);

function line(x1, y1, x2, y2, w, color, outline) {
  const l = (ww, c) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" ` +
                       `stroke="${c}" stroke-width="${f1(ww)}" stroke-linecap="round"/>`;
  return (outline ? l(w + 5, outline) : "") + l(w, color);
}
// a limb through its joints (an arm: shoulder, elbow, hand): a straight
// one (two points) is a line, as ever; a bent one, a path round its joints
// (Matthew, 2026-10-24, of the zine's coloring pages: "why is the friend have stick arms? Seems like a bug?") A limb is a thick
// stroke, and 🖍️ lines only draws every line 1.1 wide, so it came out a stick. Now its two strokes are marked (lw-out, its
// outline, and lw-in, the limb) with their widths (--lw, and --lwl, the outline's in lines only), and lines only draws the limb
// white at its own width over a black outline a little wider (style.css). A limb with no outline of its own gets one, drawn only
// in lines only (stroke none otherwise); outline false: none at all (a sleeve's inner layer, over its outer one).
function limbThrough(P, w, color, outline) {
  const d = "M" + P.map(([x, y]) => f1(x) + " " + f1(y)).join(" L");
  const l = (ww, c, cls, lw) => `<path class="${cls}" style="--lw:${f1(ww)}px;--lwl:${f1(lw)}px" d="${d}" fill="none" stroke="${c}" stroke-width="${f1(ww)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return (outline === false ? "" : l(outline ? w + 5 : w + 2.4, outline || "none", "lw-out", w + 2.4)) + l(w, color, "lw-in", w);
}
const poly = (ps, fill, stroke, sw = 2.5) =>
  `<polygon points="${pts(ps)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;

// A fill for a part: its color, or a pattern of it.
// A pattern's tile is 14 units drawn at `size`, its marks in `markColor`
// ("auto": a lighter shade of the cloth's own color).
function webTile(c) {
  // eight threads out from the middle to the outer ring, and four rings
  // across them, each sagging a little toward the middle between threads;
  // the webs stop short of each other
  const ends = [[0, 0], [7, 0], [14, 0], [14, 7], [14, 14], [7, 14], [0, 14], [0, 7]];
  const at = ([x, y], k) => [7 + (x - 7) * k, 7 + (y - 7) * k];
  let d = ends.map(e => `M7 7 L${at(e, 0.95).map(f1).join(" ")}`).join(" ");
  for (const f of [0.3, 0.55, 0.78, 0.95]) {
    d += " M" + at(ends[0], f).map(f1).join(" ");
    for (let i = 1; i <= 8; i++) {
      const a = ends[i - 1], b = ends[i % 8], m = at([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], f * 0.9);
      d += ` Q${f1(m[0])} ${f1(m[1])} ${at(b, f).map(f1).join(" ")}`;
    }
  }
  return `<path d="${d}" fill="none" stroke="${c}" stroke-width="0.25"/>`;
}
// One spider web, as the Hazel slide draws it: eight straight threads out
// from (cx, cy), r long, and three rings across them, straight between
// threads, at 35%, 65% and 95% of the way out.
function spiderWeb(cx, cy, r, c) {
  const at = (f, i) => [cx + f * r * Math.cos(i * Math.PI / 4), cy + f * r * Math.sin(i * Math.PI / 4)];
  let d = [0, 1, 2, 3, 4, 5, 6, 7].map(i => `M${f1(cx)} ${f1(cy)} L${at(1, i).map(f1).join(" ")}`).join(" ");
  for (const f of [0.35, 0.65, 0.95])
    d += " M" + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => at(f, i).map(f1).join(" ")).join(" L");
  return `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/>`;
}
function patternDef(id, color, kind, size = 14, markColor = "auto") {
  const lt = markColor === "auto" ? lighter(color) : markColor;
  const inner = {
    stripes: `<rect width="14" height="6" fill="${lt}"/>`,
    dots:    `<circle cx="7" cy="7" r="3" fill="${lt}"/>`,
    hearts:  `<text x="7" y="11" font-size="11" text-anchor="middle" fill="${lt}">♥</text>`,
    stars:   `<text x="7" y="11" font-size="11" text-anchor="middle" fill="${lt}">★</text>`,
    // a spider web: eight threads out from the middle, and three rings
    // across them, each sagging a little toward the middle between threads
    web:     webTile(lt),
    // (tickets 436, 437) ermine, a royal mantle's fur: white, with small black tails
    ermine: `<path d="M7 3.5 L7 9.5 M4.6 8.4 L7 10.8 L9.4 8.4" fill="none" stroke="${lt}" stroke-width="1.6" stroke-linecap="round"/>`,
    // (ticket 433) a dryad's cloak: a small leaf, its vein, sloping
    leaves: `<path d="M3 11 Q4 4 11 3 Q10 10 3 11 Z" fill="${lt}"/><path d="M3.6 10.4 L9.5 4.5" stroke="${color}" stroke-width="0.6"/>`,
    // (ticket 431) a gnome woman's skirt: five upright stripes, the first in its color, then the cover's green, yellow,
    // purple and blue
    gnomeskirt: GNOME_STRIPES.slice(1).map((c, i) => `<rect x="${f1(2.8 * (i + 1))}" width="2.8" height="14" fill="${c}"/>`).join(""),
    // (ticket 522) the prairie dress's gingham: two bands half way to the mark colour, the mark colour where they cross
    gingham: (h => `<rect x="7" width="7" height="14" fill="${h}"/><rect y="7" width="14" height="7" fill="${h}"/><rect x="7" y="7" width="7" height="7" fill="${lt}"/>`)(mix(color, lt, 0.5)),
  }[kind];
  if (!inner) return "";
  return `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse" ` +
         `patternTransform="scale(${(size / 14).toFixed(3)})">` +
         `<rect width="14" height="14" fill="${color}"/>${inner}</pattern>`;
}
const fillOf = (id, color, kind) => (kind === "plain" ? color : `url(#${id})`);

// ===================== GEMS =====================
// (ticket 564, Matthew: "maybe we want to draw gems in the kings crown in the future --- are the routines we have for ninja
// gems going to be ready to re-mix with other code down the line?"; "Gems for treasure chests, etc."; "Gems to decorate very
// fancy swords and sheilds, and the kinds thrown and thrown room, etc.") THE GEM, any drawing's: a cut stone (GEMSTONES, in
// js/01-state.js: its colour, its light facet, its outline) in one of GEMSTONE_SHAPES, about (cx, cy), r its size (a round
// one's radius), facing us (gemSvg) or from the side (gemSideSvg), set in gold (GOLD) or in nothing, its lights as asked
// (fx: { glimmer, stars, shine }, gemLights), every animation on the picture's clock. Made for the ninja's head band
// (ticket 557; its cut, its white cuts and its lights ticket 560) and named for it until ticket 564 (ninjaGemSvg,
// ninjaGemSide, NINJA_GEM_CUTS ...): the drawing is unchanged, byte for byte, and the ninja's settings keep their names.
// Every width and offset is in proportion to r (the setting's outline, the side view's; ticket 564), so it is the same gem
// small on a forehead or big on a chest's lid. `look`: how the caller names it and sets it: `mark`, the attribute on the gem's group (the ninja's `data-ninja="gem"`);
// `ids`, the start of its clip's id (the ninja's "ninja-"); `set`, the metal it sits in ({ c, line }; null for a loose
// stone, as in a chest).
const GEM_LOOK = { mark: `data-gem="stone"`, ids: "gem-", set: GOLD };
// a gem's outline, about (cx, cy), r its size (a round gem's radius), one of GEMSTONE_SHAPES; and how far each reaches above
// and below its middle, in r (for its side view)
const GEMSTONE_REACH = { round: [1, 1], oval: [1.08, 1.08], rhombus: [1.22, 1.22], teardrop: [1.3, 0.85], star: [1.2, 1], heart: [1.05, 1.05] };
function gemstonePath(shape, cx, cy, r) {
  const P = (x, y) => f1(cx + x * r) + " " + f1(cy + y * r);
  switch (shape) {
    case "oval": return `M${P(-0.74, 0)} A${f1(0.74 * r)} ${f1(1.08 * r)} 0 1 0 ${P(0.74, 0)} A${f1(0.74 * r)} ${f1(1.08 * r)} 0 1 0 ${P(-0.74, 0)} Z`;
    case "rhombus": return `M${P(0, -1.22)} L${P(0.82, 0)} L${P(0, 1.22)} L${P(-0.82, 0)} Z`;
    case "teardrop": return `M${P(0, -1.3)} C${P(0.3, -0.85)} ${P(0.85, -0.45)} ${P(0.85, 0)} A${f1(0.85 * r)} ${f1(0.85 * r)} 0 0 1 ${P(-0.85, 0)} C${P(-0.85, -0.45)} ${P(-0.3, -0.85)} ${P(0, -1.3)} Z`;
    case "star": return "M" + Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 0.52 : 1.2; return P(q * Math.cos(a), q * Math.sin(a)); }).join(" L") + " Z";
    case "heart": return `M${P(0, 1.05)} C${P(-0.35, 0.72)} ${P(-1.1, 0.2)} ${P(-1.05, -0.35)} C${P(-1, -0.95)} ${P(-0.25, -1.05)} ${P(0, -0.5)} C${P(0.25, -1.05)} ${P(1, -0.95)} ${P(1.05, -0.35)} C${P(1.1, 0.2)} ${P(0.35, 0.72)} ${P(0, 1.05)} Z`;
    default: return `M${P(-1, 0)} A${f1(r)} ${f1(r)} 0 1 0 ${P(1, 0)} A${f1(r)} ${f1(r)} 0 1 0 ${P(-1, 0)} Z`;
  }
}
const gemstoneOf = kind => GEMSTONES[kind] || GEMSTONES.ruby;
const gemstoneShapeOf = shape => GEMSTONE_REACH[shape] ? shape : "round";
// (ticket 560, Matthew, with a picture of a cut oval ruby: "For the gems -- we also want the default (ruby) to have apparent
// cut marks, as a gemstone ... Please do the same for the others (beleved edge lines)") THE GEM'S CUT, each shape's own, in r
// about the stone's middle: `rim`, points on its girdle round from the top, clockwise, a corner (where a crown facet's far
// point is) then the point between it and the next corner, and so on; `c` the table's middle and `t` how far out it reaches
// toward each corner (the table is the corners drawn in toward c, so it follows the shape); `split` (the star) cuts each
// point's facet in two down its middle, a lit half and a shaded one. A handful of facets: 6 corners (4 on the diamond shape,
// 5 on the star, one a point; `glint`, how far out toward the light the glint is, if not 0.62), each a kite from the table out to its corner and a triangle from each table edge out to the
// rim, which tile the crown between the table and the girdle. The rim's points are on the outline itself, and its arcs
// between them bulge outward (the heart's cleft is a point of its own), so no facet reaches past the stone.
const gemRing = (rx, ry, n = 12) => Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [rx * Math.cos(a), ry * Math.sin(a)]; });
const GEMSTONE_CUTS = {
  round: { rim: gemRing(1, 1), c: [0, 0], t: 0.5 },
  oval: { rim: gemRing(0.74, 1.08), c: [0, 0], t: 0.5 },
  rhombus: { rim: [[0, -1.22], [0.41, -0.61], [0.82, 0], [0.41, 0.61], [0, 1.22], [-0.41, 0.61], [-0.82, 0], [-0.41, -0.61]], c: [0, 0], t: 0.46, glint: 0.45 },
  // (on gemstonePath's curves: a third and two thirds along each, and every 30 degrees round the bottom's arc)
  teardrop: { rim: [[0, -1.3], [0.354, -0.863], [0.696, -0.437], [0.85, 0], [0.736, 0.425], [0.425, 0.736], [0, 0.85], [-0.425, 0.736], [-0.736, 0.425], [-0.85, 0], [-0.696, -0.437], [-0.354, -0.863]], c: [0, 0.04], t: 0.5 },
  star: { rim: Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 0.52 : 1.2; return [q * Math.cos(a), q * Math.sin(a)]; }), c: [0, 0], t: 0.3, split: true, glint: 0.4 },
  // (a corner toward each lobe's top and down each side, the cleft and the bottom tip between corners)
  heart: { rim: [[0.372, -0.839], [0.811, -0.778], [1.05, -0.35], [0.878, 0.184], [0.439, 0.663], [0, 1.05], [-0.439, 0.663], [-0.878, 0.184], [-1.05, -0.35], [-0.811, -0.778], [-0.372, -0.839], [0, -0.5]], c: [0, 0.08], t: 0.48 },
};
// the gem's tones, from its colour, its light and its outline: the table a little deeper than the stone, the shaded facets
// deeper still, the lit ones halfway to its light, the flashes its light (not near white: the white is the cuts', below)
const gemstoneTones = g => ({ table: mix(g.c, g.line, 0.18), dark: mix(g.c, g.line, 0.5), light: mix(g.c, g.light, 0.45), flash: g.light });
// (ticket 560, Matthew: "gems don't appear faceted yet -- at all", then "we need to add sharp, bright white lines to
// indicate the 'cuts', perhaps with an animation that makes them 'glimmer' -- and other animations optional too for
// stars/shine on them, all over") THE CUTS IN WHITE, AND THE GEM'S LIGHTS. At its true size the gem is a few pixels across,
// and its cuts were a pale line a quarter of a pixel wide: unseen. Each cut is now drawn twice in white, `w` wide in the
// stone's own units and never thinner than GEM_CUT_PX on the screen (non-scaling-stroke), so it is sharp small and in
// proportion big. `fx`, the lights (the ninja's rows, ninjaGemFx in js/06-costumes.js): `glimmer` (✨, off at first), a wider, brighter copy of each group of cuts
// flashing in turn clockwise round the stone, a light running round its cuts; `stars` (⭐, off at first), four-pointed stars that
// swell and vanish at `spots` all over the stone ([x, y, size in r]), each at its own pace; `shine` (🌟, off at first), a
// pale band sweeping across the stone from the light, clipped to it. Every animation keeps time with the picture's clock
// (begun before 0, as the tails' wags), so redrawing the friend never restarts one. All three are off at first (a costly
// effect is off at the start, his rule, 10-16; ninja557.mjs, as every costume's check, holds the friend to no SMIL and the
// knight's 92 shapes): the glimmer on at first was SMIL in every drawing of the gem, and 12 more shapes facing us, 99 in all.
const GEM_CUT_PX = 0.8, GEM_GLIMMER_S = 2.4, GEM_SHINE_S = 3.6;
const gemCut = (d, w, px) => `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="${f1(w)}" stroke-linejoin="round" stroke-linecap="round"/>` +
  `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="${px}" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
const gemStarPath = s => { const P = (x, y) => f1(x) + " " + f1(y); return `M${P(0, -s)} Q0 0 ${P(s, 0)} Q0 0 ${P(0, s)} Q0 0 ${P(-s, 0)} Q0 0 ${P(0, -s)} Z`; };
function gemLights(fx, { groups, stone, c: [cx, cy], r, w, spots, ids = GEM_LOOK.ids }) {
  let s = "";
  if (fx.glimmer) s += groups.map((d, j) => `<g opacity="0">${gemCut(d, 2 * w, 2 * GEM_CUT_PX)}<animate attributeName="opacity" values="0;1;0;0" ` +
    `keyTimes="0;0.07;0.18;1" dur="${GEM_GLIMMER_S}s" begin="${f1((j / groups.length - 1) * GEM_GLIMMER_S)}s" repeatCount="indefinite"/></g>`).join("");
  if (fx.shine) {   // (a band across the light's way, from beyond the stone's upper left to beyond its lower right, then waiting there)
    const c = shapeClip(ids + "shine-", stone), u = 0.7071, L = 2 * r, b = 0.22 * r, far = f1(1.9 * r * u);
    const P = (a, q) => f1(cx + a * u + q * u) + " " + f1(cy + a * u - q * u);
    s += c.def + `<g clip-path="url(#${c.id})"><path d="M${P(-b, -L)} L${P(b, -L)} L${P(b, L)} L${P(-b, L)} Z" fill="#ffffff" opacity="0.65" transform="translate(-${far} -${far})">` +
      `<animateTransform attributeName="transform" type="translate" values="-${far} -${far};${far} ${far};${far} ${far}" keyTimes="0;0.3;1" dur="${GEM_SHINE_S}s" ` +
      `begin="-0.5s" repeatCount="indefinite"/></path></g>`;
  }
  if (fx.stars) s += spots.map(([x, y, k], i) => `<g transform="translate(${f1(x)} ${f1(y)})"><path d="${gemStarPath(k * r)}" fill="#ffffff" transform="scale(0)">` +
    `<animateTransform attributeName="transform" type="scale" values="0;1;0;0" keyTimes="0;0.12;0.26;1" dur="${(1.9 + 0.43 * i).toFixed(2)}s" ` +
    `begin="${(-0.71 * i).toFixed(2)}s" repeatCount="indefinite"/></path></g>`).join("");
  return s;
}
// the gem facing us: a gold setting a size bigger (the look's `set`, GOLD at first; none with `set: null`), the stone, its crown's facets in three tones over it (one path each: lit
// from up and to our left, the kites there flash and the next ones are lit, the rest the stone's own colour, the triangles
// between them shaded but those nearest the light), the table, the cuts in white (a group to each corner: the two cuts out
// from it to the rim and the table's edge on to the next), the girdle's outline, a glint on the crown toward the light, and
// over it all the lights (`fx`: gemLights)
function gemSvg(kind, shape, cx, cy, r, fx = {}, look = GEM_LOOK) {
  const { mark, ids, set } = { ...GEM_LOOK, ...look }, g = gemstoneOf(kind), sh = gemstoneShapeOf(shape), T = gemstoneTones(g), cut = GEMSTONE_CUTS[sh], R = cut.rim, k = R.length / 2;
  const at = ([x, y]) => [cx + x * r, cy + y * r], P = ([x, y]) => f1(x) + " " + f1(y), poly = pts => "M" + pts.map(P).join(" L") + " Z";
  const C = at(cut.c), corner = j => at(R[(2 * j) % R.length]), mid = j => at(R[(2 * ((j + k) % k) + 1) % R.length]);
  const tab = Array.from({ length: k }, (_, j) => { const q = corner(j); return [C[0] + (q[0] - C[0]) * cut.t, C[1] + (q[1] - C[1]) * cut.t]; });
  const lit = pts => { const m = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]), dx = m[0] - C[0], dy = m[1] - C[1], l = Math.hypot(dx, dy) || 1;
    return (-0.6 * dx - 0.8 * dy) / l; };
  const tone = { flash: [], light: [], dark: [] }, put = (t, pts) => { if (t) tone[t].push(poly(pts)); };
  for (let j = 0; j < k; j++) {
    const Tj = tab[j], Tn = tab[(j + 1) % k], Rj = corner(j), Qj = mid(j), Qp = mid(j - 1);
    if (cut.split) { const a = [Tj, Qp, Rj], b = [Tj, Rj, Qj];   // (the star's points: the half nearer the light lit, the other shaded)
      const [hi, lo] = lit(a) >= lit(b) ? [a, b] : [b, a]; put(lit(hi) > 0.3 ? "flash" : "light", hi); put("dark", lo); }
    else { const s = [Tj, Qj, Rj, Qp], v = lit(s); put(v > 0.55 ? "flash" : v > 0 ? "light" : null, s); }
    const tri = [Tj, Tn, Qj], v = lit(tri); put(v > 0.5 ? null : "dark", tri);
  }
  const groups = tab.map((Tj, j) => `M${P(mid(j - 1))} L${P(Tj)} L${P(mid(j))}` + (cut.split ? ` M${P(Tj)} L${P(corner(j))}` : "") + ` M${P(Tj)} L${P(tab[(j + 1) % k])}`);
  const lw = v => f1(v * r), stone = gemstonePath(sh, cx, cy, r), glint = [C[0] - 0.6 * (cut.glint ?? 0.62) * r, C[1] - 0.8 * (cut.glint ?? 0.62) * r];
  // (the stars: a big one at the glint, and smaller ones at every other corner of the rim, round the stone)
  const spots = [[...glint, 0.8], ...Array.from({ length: k }, (_, j) => j).filter(j => j % 2).map(j => [...corner(j), 0.5])];
  return `<g ${mark}>` + (set ? `<path d="${gemstonePath(sh, cx, cy, r * 1.32)}" fill="${set.c}" stroke="${set.line}" stroke-width="${f1(0.2 * r)}" stroke-linejoin="round"/>` : "") +
    `<path d="${stone}" fill="${g.c}"/>` +
    ["dark", "light", "flash"].map(t => tone[t].length ? `<path d="${tone[t].join(" ")}" fill="${T[t]}"/>` : "").join("") +
    `<path d="${poly(tab)}" fill="${T.table}"/>` +
    gemCut(groups.join(" "), 0.05 * r, GEM_CUT_PX) +
    `<path d="${stone}" fill="none" stroke="${g.line}" stroke-width="${lw(0.14)}" stroke-linejoin="round"/>` +
    `<circle cx="${f1(glint[0])}" cy="${f1(glint[1])}" r="${lw(0.09)}" fill="#ffffff"/>` +
    gemLights(fx, { groups, stone, c: [cx, cy], r, w: 0.05 * r, spots, ids }) + `</g>`;
}
// the gem from the side, standing out of what it is set in at (x, cy), toward `dir` (the ninja's: at the forehead's edge): its setting's rim, and the stone standing out of it, as
// tall as the shape is facing us, cut (ticket 560): a flat table at its front edge between two sloping crown facets, the upper
// one lit, the lower shaded, their cuts in white (pointed, the diamond shape and the star: two facets meeting at the point),
// and the lights over it (`fx`: gemLights, each cut its own group, the stars at the front, on the lit facet and low)
function gemSideSvg(kind, shape, x, cy, r, dir, fx = {}, look = GEM_LOOK) {
  const { mark, ids, set } = { ...GEM_LOOK, ...look }, g = gemstoneOf(kind), T = gemstoneTones(g), sh = gemstoneShapeOf(shape), [up, down] = GEMSTONE_REACH[sh], y0 = cy - up * r, y1 = cy + down * r, P = (a, b) => f1(a) + " " + f1(b);
  // (ticket 564: its small widths and offsets were drawn for the ninja's 11; `u` keeps them in proportion at any size, 1 there)
  const u = r / 11, out = 0.8 * r, xs = x + dir * 3 * u, pointed = sh === "rhombus" || sh === "star", h = y1 - y0, xf = xs + dir * out * 0.75;
  const ta = pointed ? [xs + dir * out, cy] : [xf, y0 + h * 0.3], tb = pointed ? ta : [xf, y1 - h * 0.3], ym = pointed ? cy : (ta[1] + tb[1]) / 2;
  const stone = `M${P(xs, y0)} L${P(...ta)} L${P(...tb)} L${P(xs, y1)} Z`;
  const groups = pointed ? [`M${P(xs, ym)} L${P(...ta)}`] : [`M${P(xs, ym)} L${P(...ta)}`, `M${P(...ta)} L${P(...tb)}`, `M${P(...tb)} L${P(xs, ym)}`];
  const spots = [[...ta, 0.7], [(2 * xs + ta[0]) / 3, (y0 + ta[1] + ym) / 3, 0.5], [xs + dir * out * 0.3, y1 - h * 0.2, 0.45]];
  return `<g ${mark}>` + (set ? `<path d="M${P(x - dir * 2 * u, y0 - 1.5 * u)} L${P(xs, y0 - 1.5 * u)} L${P(xs, y1 + 1.5 * u)} L${P(x - dir * 2 * u, y1 + 1.5 * u)} Z" fill="${set.c}" stroke="${set.line}" stroke-width="${f1(1.8 * u)}" stroke-linejoin="round"/>` : "") +
    `<path d="${stone}" fill="${pointed ? g.c : T.table}"/>` +
    `<path d="M${P(xs, y0)} L${P(...ta)} L${P(xs, ym)} Z" fill="${T.light}"/><path d="M${P(xs, ym)} L${P(...tb)} L${P(xs, y1)} Z" fill="${T.dark}"/>` +
    gemCut(groups.join(" "), 0.55 * u, GEM_CUT_PX) +
    `<path d="${stone}" fill="none" stroke="${g.line}" stroke-width="${f1(1.6 * u)}" stroke-linejoin="round"/>` +
    gemLights(fx, { groups, stone, c: [(xs + ta[0]) / 2, cy], r, w: 0.55 * u, spots, ids }) + `</g>`;
}
