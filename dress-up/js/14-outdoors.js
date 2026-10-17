"use strict";
// (ticket 178) Part 14 of 26 of the game's script, run in order by index.html.

function mountainsScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, grad, all, land, o, side } = c;
  const peaks = (o.peakHeight ?? 100) / 100, birds = o.birds ?? 3, clouds = o.mtClouds ?? 5, lake = o.farLake ?? true;
  const valley = g - 150 * k;
  let s = SEP + part("mt-sky", c.F, () => `<defs>${grad("bg-sky", "#4f9fe0", "#e2f2ff", y0, valley)}${cloudDef("bg-cloud", 1)}</defs>` + all("url(#bg-sky)") +
    `<circle cx="${f1(x1 - W * 0.12)}" cy="${f1(y0 + H * 0.12)}" r="${f1(30 * k)}" fill="#fff6c8"/>`);
  // the high clouds, behind the peaks
  s += SEP + part("mt-clouds-high", [c.F, clouds, sceneLfoKey(o, "slow")], () => [...Array(Math.ceil(clouds / 2))].map((_, i) =>
    driftingCloud(x0 + W * (0.1 + 0.8 * R(i, 320)), y0 + H * (0.06 + 0.12 * R(i, 321)), k * (0.6 + 0.4 * R(i, 322)), i, o)).join(""));
  // the peaks, three ranges, far to near, snow on the far ones
  s += OPEN(`<g transform="translate(0 ${f1(valley)}) scale(1 ${peaks.toFixed(3)}) translate(0 ${f1(-valley)})">`) + part("mt-peaks", c.F, () => {
    let t = "";
    [[0, "#b6c6dc", 330, 9, true], [1, "#8ea3c0", 250, 7, true], [2, "#6d8296", 170, 6, false]].forEach(([r, fill, hgt, n, snow]) => {
      const base = valley + r * 12 * k, pts = [[x0 - pad, base]];
      for (let i = 0; i <= n; i++) {
        const x = x0 - 60 * k + (W + 120 * k) * i / n + 30 * k * (R(i + r * 10, 323) - 0.5);
        pts.push([x - (W / n) * 0.45, base - hgt * k * (0.35 + 0.3 * R(i + r * 10, 324))], [x, base - hgt * k * (0.75 + 0.25 * R(i + r * 10, 325))]);
      }
      pts.push([x1 + pad, base], [x1 + pad, base + 60 * k], [x0 - pad, base + 60 * k]);
      t += `<polygon points="${pts.map(([x, y]) => P2(x, y)).join(" ")}" fill="${fill}"/>`;
      if (snow) for (let i = 2; i < pts.length - 3; i += 2) {
        const [px, py] = pts[i], [lx, ly] = pts[i - 1], [rx, ry] = pts[i + 1];
        t += snowCap(px, py, lx, ly, rx, ry, 0.24 * (base - py), i + r * 20);
      }
    });
    return t;
  }) + CLOSE;
  // far below: a lake and a village by it (or not)
  if (lake) s += SEP + part("mt-lake", c.F, () => `<ellipse cx="${f1(W * 0.18)}" cy="${f1(valley + 22 * k)}" rx="${f1(120 * k)}" ry="${f1(14 * k)}" fill="#5aa9e0"/>` +
    `<ellipse cx="${f1(W * 0.18)}" cy="${f1(valley + 20 * k)}" rx="${f1(90 * k)}" ry="${f1(6 * k)}" fill="#bfe3f5" opacity="0.6"/>` +
    [...Array(7)].map((_, i) => { const x = W * 0.18 - 150 * k + i * 16 * k, y = valley + 18 * k + 6 * k * R(i, 326);
      return `<rect x="${f1(x)}" y="${f1(y - 7 * k)}" width="${f1(10 * k)}" height="${f1(7 * k)}" fill="#f4efe6"/><polygon points="${P2(x - 1 * k, y - 7 * k)} ${P2(x + 5 * k, y - 12 * k)} ${P2(x + 11 * k, y - 7 * k)}" fill="${["#c0392b", "#8a5a32", "#3b5ea8"][i % 3]}"/>`; }).join(""));
  // the low clouds, in front of the peaks
  s += SEP + part("mt-clouds-low", [c.F, clouds, sceneLfoKey(o, "slow")], () => [...Array(Math.floor(clouds / 2))].map((_, i) =>
    driftingCloud(x0 + W * (0.05 + 0.9 * R(i, 327)), valley - (40 + 90 * R(i, 328)) * k, k * (0.8 + 0.5 * R(i, 329)), i + 2, o)).join(""));
  // the near slope: grass, rocks, the trail winding off uphill
  s += SEP + part("mt-slope", c.F, () => {
    let t = `<defs>${PINE_DEF}</defs>` + land(valley + 40 * k, 14, "#8fb35a", 0.8) + land(g - 30 * k, 6, "#7aa34e", 1.6);
    const L = [], Rr = [];
    for (let i = 0; i <= 20; i++) {
      const u = i / 20, y = y1 + 10 * k - (y1 - valley - 50 * k) * u, x = W * 0.05 * Math.sin(u * 5) - W * 0.25 * u * u, w = (90 - 80 * u) * k;
      L.push(P2(x - w / 2, y)); Rr.push(P2(x + w / 2, y));
    }
    t += `<polygon points="${[...L, ...Rr.reverse()].join(" ")}" fill="#c9a774"/>`;
    // (each rock an object, with the tuft of grass at its foot; each pine one)
    const sideName = i => `${side(i) < 0 ? "left" : "right"} ${Math.floor(i / 2) + 1}`;
    for (let i = 0; i < 9; i++) {
      const x = side(i) * (W * 0.18 + W * 0.28 * R(i, 330)), y = g - 10 * k + 70 * k * R(i, 331), r = (12 + 20 * R(i, 332)) * k;
      t += obj(`rock, ${sideName(i)}`, y, rockSvg(x, y, r, 330 + i, ["#8a8a8a", "#9c9c9c", "#7a7a7a"][i % 3]) + grassTuft(x + r * 1.3, y + 2 * k, 14 * k, 340 + i, "#6f9a48", 1.8 * k));
    }
    for (let i = 0; i < 8; i++) t += obj(`pine, ${sideName(i)}`, g + 30 * k * R(i, 334), use("bg-pine", side(i) * (W * 0.36 + W * 0.14 * R(i, 333)), g + 30 * k * R(i, 334), k * (0.9 + 0.5 * R(i, 335)), k * (0.9 + 0.5 * R(i, 335)),
      ` color="${["#2f6e3a", "#3a7d44", "#285e33"][i % 3]}"`));
    return t;
  });
  // the signpost by the trail: to the falls, and to the camp (an object, at its post's foot)
  s += SEP + obj("signpost", g + 10 * k, part("mt-sign", c.F, () => signpost(-W * 0.2, g + 10 * k, k, [["💦 falls", "waterfall", -1], ["🏕️ camp", "campsite", 1], ["🌲 woods", "woodpath", 1]])));
  // birds, circling high up (an object at the depth of the ground under
  // them, the valley far off: behind anywhere one stands on the slope)
  if (birds > 0) s += SEP + obj("birds", valley, part("mt-birds", [c.F, birds, sceneLfoKey(o, "fast")], () => [...Array(birds)].map((_, i) => {
    const cx = x0 + W * (0.2 + 0.6 * R(i, 336)), cy = y0 + H * (0.15 + 0.15 * R(i, 337)), rx = (50 + 40 * R(i, 338)) * k, ry = rx * 0.35;
    // (their wings beating with the quick LFO, each its own way in)
    const wingD = v => `M${f1(-12 * k)} ${f1(-5 * k * v)} Q${f1(-6 * k)} ${f1(-7 * k)} 0 0 Q${f1(6 * k)} ${f1(-7 * k)} ${f1(12 * k)} ${f1(-5 * k * v)}`;
    return `<path d="${wingD(0)}" fill="none" stroke="#333" stroke-width="${f1(2.5 * k)}">` +
           sceneLfo(o, "fast", R(i, 339), "d", v => wingD(v), `<animate attributeName="d" values="${wingD(-1)};${wingD(1)};${wingD(-1)}" dur="${(0.5 + 0.2 * R(i, 338)).toFixed(2)}s" repeatCount="indefinite"/>`) +
           `<animateMotion path="M${P(cx - rx, cy)} A${f1(rx)} ${f1(ry)} 0 1 1 ${P(cx + rx, cy)} A${f1(rx)} ${f1(ry)} 0 1 1 ${P(cx - rx, cy)}" dur="${(9 + 5 * R(i, 339)).toFixed(1)}s" repeatCount="indefinite"/></path>`;
  }).join("")));
  return s;
}

// The jungle waterfall: a mossy cliff, the water falling (streaks running
// down it), a pool below with ripples, mist rising, big-leaved trees,
// vines swaying, parrots, flowers.
// The jungle waterfall's time of day (its own, so the cave behind it sees
// the same): day, or a tint over everything at sunset and at night, the
// moon out at night; and how fast its water falls (100 = the usual)
const FALL_TINT = { day: ["#ffffff", 0], sunset: ["#9a3412", 0.25], night: ["#0b1030", 0.55] };
const fallTimeOf = o => FALL_TINT[o.fallTime] ? o.fallTime : "day", fallRateOf = o => Math.max(0.1, (o.fallRate ?? 100) / 100);
// the falls' pool: the line where the falls meet it, its water (an ellipse
// about (0, cy)), and the near bank's edge over its near side (for its
// drawing, and for a friend wading in it: WATER, ticket 122)
const poolOf = ({ g, k, W }) => { const pool = g - 70 * k; return { pool, cy: pool + 30 * k, rx: W * 0.42, ry: 55 * k, near: g + 20 * k }; };
function waterfallScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, grad, all, land, o, side } = c;
  const fw = (o.fallWidth ?? 100) / 100, vines = o.vines ?? 8, mist = (o.mist ?? 60) / 100, parrots = o.parrots ?? 2, rate = fallRateOf(o), time = fallTimeOf(o);
  const top = y0 + H * 0.12, pl = poolOf(c), pool = pl.pool;
  let s = SEP + part("wf-back", c.F, () => {
    let t = `<defs>${grad("bg-sky", "#9fd8c8", "#e8fff4", y0, g)}</defs>` + all("url(#bg-sky)");
    // the far jungle: layers of leaf pads, a crown here and there standing up
    // out of them (the shared leafy tree)
    t += `<defs>${leafyTreeDef("bg-jungle-tree", 81, { wide: 1.3 })}</defs>`;
    for (const [row, fill, yb, n] of [[0, "#5f9a6a", y0 + H * 0.3, 16], [1, "#3f8050", y0 + H * 0.42, 14]])
      for (let i = 0; i < n; i++) {
        const x = x0 - 20 * k + (W + 40 * k) * i / (n - 1), r = (40 + 25 * R(i + row * 20, 340)) * k, y = yb + 10 * k * R(i, 341);
        t += `<rect x="${f1(x - r)}" y="${f1(y)}" width="${f1(2 * r)}" height="${f1(H)}" fill="${fill}"/>` +
             padSvg(Math.floor(R(i + row * 30, 342) * 8), x, y + r * 0.3, (r / 95) * (R(i, 343) < 0.5 ? -1 : 1), r / 70, fill) +
             padSvg(Math.floor(R(i + row * 30, 344) * 8), x + r * 0.3, y - r * 0.2, (r / 130), r / 90, mix(fill, "#ffffff", 0.08));
        if (R(i + row * 40, 345) < 0.25) t += use("bg-jungle-tree", x, y + r * 0.6, r * 3 / 330, r * 3 / 330, ` color="${fill}"`);
      }
    // the cliff, mossy, the falls' lip at its top
    t += `<path d="M${P(-W * 0.34, pool)} L${P(-W * 0.3, top + 40 * k)} Q${P(-W * 0.2, top - 10 * k)} ${P(-W * 0.06, top)} L${P(W * 0.08, top)} Q${P(W * 0.22, top - 12 * k)} ${P(W * 0.3, top + 30 * k)} L${P(W * 0.36, pool)} Z" fill="#6e6a62"/>`;
    for (let i = 0; i < 14; i++) {
      const x = -W * 0.3 + W * 0.62 * R(i, 342), y = top + 20 * k + (pool - top - 40 * k) * R(i, 343);
      t += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1((14 + 14 * R(i, 344)) * k)}" ry="${f1(7 * k)}" fill="${i % 2 ? "#4f8a3a" : "#5c5850"}" opacity="0.85"/>`;
    }
    return t;
  });
  // the falls: a sheet of water, streaks running down it, foam at the lip
  // (a doorway: behind them is a cave, unseen from here)
  s += SEP + `<g class="portal" data-to="cave">` + part("wf-falls", [c.F, fw, rate], () => {
    const half = 60 * fw * k;
    let t = `<defs><linearGradient id="bg-falls" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9ad7f0"/><stop offset="0.5" stop-color="#e6f8ff"/><stop offset="1" stop-color="#9ad7f0"/></linearGradient></defs>` +
            `<path d="M${P(-half, top)} L${P(half, top)} L${P(half * 1.25, pool)} L${P(-half * 1.25, pool)} Z" fill="url(#bg-falls)" opacity="0.95"/>`;
    const n = Math.max(4, Math.round(10 * fw));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, xa = -half + 2 * half * u, xb = -half * 1.25 + 2.5 * half * u, dash = (30 + 30 * R(i, 345)) * k, gap = (20 + 20 * R(i, 346)) * k;
      t += `<line x1="${f1(xa)}" y1="${f1(top)}" x2="${f1(xb)}" y2="${f1(pool)}" stroke="#ffffff" stroke-width="${f1((2 + 3 * R(i, 347)) * k)}" stroke-dasharray="${f1(dash)} ${f1(gap)}" opacity="0.8">` +
           `<animate attributeName="stroke-dashoffset" values="0;${f1(-(dash + gap) * 2)}" dur="${((0.6 + 0.4 * R(i, 348)) / rate).toFixed(2)}s" repeatCount="indefinite"/></line>`;
    }
    return t + `<ellipse cx="0" cy="${f1(top)}" rx="${f1(half * 1.1)}" ry="${f1(6 * k)}" fill="#ffffff" opacity="0.9"/>`;
  }) + `</g>`;
  // the pool, ripples spreading (the near bank's wave, 4 and 1.1, is WATER's too)
  s += SEP + part("wf-pool", c.F, () => land(pool + 30 * k, 6, "#5f8a3a", 0.3) +
    `<ellipse cx="0" cy="${f1(pl.cy)}" rx="${f1(pl.rx)}" ry="${f1(pl.ry)}" fill="#3f9ad0"/>` +
    `<ellipse cx="0" cy="${f1(pool + 24 * k)}" rx="${f1(W * 0.34)}" ry="${f1(36 * k)}" fill="#62b6e4"/>` +
    [0, 1, 2].map(i => `<ellipse cx="0" cy="${f1(pool + 6 * k)}" rx="${f1(60 * k)}" ry="${f1(10 * k)}" fill="none" stroke="#ffffff" stroke-width="${f1(2 * k)}">` +
      `<animate attributeName="rx" values="${f1(40 * k)};${f1(200 * k)}" dur="2.4s" begin="${(i * 0.8).toFixed(1)}s" repeatCount="indefinite"/>` +
      `<animate attributeName="ry" values="${f1(6 * k)};${f1(30 * k)}" dur="2.4s" begin="${(i * 0.8).toFixed(1)}s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="0.8;0" dur="2.4s" begin="${(i * 0.8).toFixed(1)}s" repeatCount="indefinite"/></ellipse>`).join("") +
    land(pl.near, 4, "#4f8a3a", 1.1));
  // the mist at the falls' foot, billowing (as much as the slider says; an
  // object at the depth of the pool's far edge, under it)
  // (ticket 155: with blurs off, each puff a radial gradient fading to
  // nothing at its edge, soft without a filter)
  if (mist > 0) s += SEP + obj("mist", pool, part("wf-mist", [c.F, mist, PERF.blur], () => (PERF.blur ? `<defs><filter id="bg-mist" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f1(14 * k)}"/></filter></defs><g filter="url(#bg-mist)" pointer-events="none">`
                    : `<defs><radialGradient id="bg-mist-soft"><stop offset="0.35" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><g pointer-events="none">`) +
    [...Array(Math.round(3 + 6 * mist))].map((_, i) => {
      const x = (R(i, 349) - 0.5) * 220 * k, y = pool - (10 + 60 * R(i, 350)) * k, r = (40 + 40 * R(i, 351)) * k;
      return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.55)}" fill="${PERF.blur ? "#ffffff" : "url(#bg-mist-soft)"}" opacity="${(0.25 + 0.35 * mist).toFixed(2)}">` +
             `<animate attributeName="cy" values="${f1(y)};${f1(y - 30 * k)};${f1(y)}" dur="${(4 + 3 * R(i, 352)).toFixed(1)}s" repeatCount="indefinite"/>` +
             `<animate attributeName="opacity" values="${(0.15 + 0.3 * mist).toFixed(2)};${(0.35 + 0.4 * mist).toFixed(2)};${(0.15 + 0.3 * mist).toFixed(2)}" dur="${(3 + 2 * R(i, 353)).toFixed(1)}s" repeatCount="indefinite"/></ellipse>`;
    }).join("") + `</g>`));
  // big-leaved jungle trees either side, flowers at their feet (each tree
  // an object, at its trunk's foot; the flowers flat on the ground)
  s += SEP + part("wf-trees", c.F, () => {
    let t = "";
    for (const sd of [-1, 1]) {
      const tx = sd * W * 0.43, tb = g + 60 * k, tt = y0 + H * 0.18;
      let tree = `<path d="M${P(tx - 22 * k, tb)} Q${P(tx - 10 * k, (tb + tt) / 2)} ${P(tx - sd * 20 * k, tt)} L${P(tx - sd * 4 * k, tt)} Q${P(tx + 14 * k, (tb + tt) / 2)} ${P(tx + 22 * k, tb)} Z" fill="#6b4a2b"/>`;
      for (let j = 0; j < 9; j++) {
        const a = (-160 + j * 40) * Math.PI / 180, l = (110 + 50 * R(j, 354)) * k, ex = tx - sd * 20 * k + Math.cos(a) * l, ey = tt + Math.sin(a) * l * 0.7 + 30 * k;
        tree += `<path d="M${P(tx - sd * 14 * k, tt)} Q${P((tx - sd * 14 * k + ex) / 2 + 10 * k, (tt + ey) / 2 - 40 * k)} ${P(ex, ey)} Q${P((tx - sd * 14 * k + ex) / 2 - 10 * k, (tt + ey) / 2 + 10 * k)} ${P(tx - sd * 14 * k, tt)} Z" ` +
             `fill="${["#2e8b3a", "#3fa34a", "#24753a"][j % 3]}" stroke="#1d5a2a" stroke-width="${f1(1.5 * k)}"/>`;
      }
      t += obj(`jungle tree, ${sd < 0 ? "left" : "right"}`, tb, tree);
      for (let j = 0; j < 4; j++) {   // flowers by the trunk
        const fx = tx - sd * (30 + 40 * j) * k, fy = g + (30 + 10 * j) * k;
        t += [0, 72, 144, 216, 288].map(a => `<ellipse cx="${f1(fx)}" cy="${f1(fy - 8 * k)}" rx="${f1(4 * k)}" ry="${f1(9 * k)}" fill="${["#ff4f6d", "#ff8c1a", "#f2c12e", "#e85dbe"][j]}" transform="rotate(${a} ${f1(fx)} ${f1(fy)})"/>`).join("") +
             `<circle cx="${f1(fx)}" cy="${f1(fy)}" r="${f1(3.5 * k)}" fill="#ffd23f"/>`;
      }
    }
    return t;
  });
  // vines hanging from the top, swaying (an object: hanging over the pool,
  // at the depth of its far edge, under them)
  if (vines > 0) s += SEP + obj("vines", pool, part("wf-vines", [c.F, vines, sceneLfoKey(o, "slow")], () => [...Array(vines)].map((_, i) => {
    const x = x0 + W * (0.04 + 0.92 * R(i, 355)), len = (120 + 220 * R(i, 356)) * k;
    let d = `M${P(x, y0 - 10 * k)}`, leaves = "";
    for (let j = 1; j <= 8; j++) {
      const y = y0 - 10 * k + len * j / 8, xx = x + 10 * k * Math.sin(j * 1.1 + i);
      d += ` L${P(xx, y)}`;
      leaves += `<ellipse cx="${f1(xx + (j % 2 ? 7 : -7) * k)}" cy="${f1(y)}" rx="${f1(7 * k)}" ry="${f1(3.5 * k)}" fill="#3fa34a" transform="rotate(${j % 2 ? 30 : -30} ${f1(xx)} ${f1(y)})"/>`;
    }
    return `<g>${lfoTimed(o, "slow", R(i, 357), `<animateTransform attributeName="transform" type="rotate" values="-3 ${f1(x)} ${f1(y0)};3 ${f1(x)} ${f1(y0)};-3 ${f1(x)} ${f1(y0)}" dur="${(4 + 2 * R(i, 357)).toFixed(1)}s" repeatCount="indefinite"/>`)}` +
           `<path d="${d}" fill="none" stroke="#3f7a2a" stroke-width="${f1(3 * k)}"/>${leaves}</g>`;
  }).join("")));
  // parrots on the branches (each an object, at the foot of the tree it sits in)
  s += SEP + part("wf-parrots", [c.F, parrots, sceneLfoKey(o, "fast")], () => [...Array(parrots)].map((_, i) => {
    const sd = i % 2 ? 1 : -1, x = sd * (W * 0.32 - 30 * k * Math.floor(i / 2)), y = y0 + H * (0.3 + 0.08 * Math.floor(i / 2)), f = sd < 0 ? 1 : -1;
    return obj(`parrot ${i + 1}`, g + 60 * k, `<g ${tf(x, y, k * f, k)}><path d="M-6 0 Q-14 22 -4 40 L4 40 Q10 20 6 0 Z" fill="${["#e53935", "#2e86de", "#27ae60"][i % 3]}"/>` +
           `<path d="M-4 38 L-8 66 L0 50 L6 68 L4 38 Z" fill="${["#2e86de", "#f2c12e", "#e53935"][i % 3]}"/>` +
           `<circle cx="2" cy="-4" r="9" fill="${["#e53935", "#2e86de", "#27ae60"][i % 3]}"/><circle cx="5" cy="-6" r="2.5" fill="#ffffff"/><circle cx="5.5" cy="-6" r="1.2" fill="#111"/>` +
           `<path d="M9 -6 Q18 -4 12 4 Q10 0 9 -2 Z" fill="#f2c12e"/><g>${sceneLfo(o, "fast", (i * 0.37) % 1, "transform", (v, amp) => `${f1((10 + 30 * amp) * (1 + v) / 2)} -6 8`,
             `<animateTransform attributeName="transform" type="rotate" values="0 -6 8;24 -6 8;0 -6 8" dur="${(0.6 + 0.1 * i).toFixed(1)}s" repeatCount="indefinite"/>`)}<path d="M-6 8 Q-18 20 -10 34" fill="none" stroke="#f2c12e" stroke-width="4"/></g></g>`);
  }).join(""));
  // the light at sunset or at night, over everything (an object in front of
  // everything, the friend too: where they stand among the objects, it is
  // over them all the same)
  if (time !== "day") s += SEP + obj(time === "night" ? "dark" : "sunset light", Infinity, part("wf-tint", [c.F, time], () => all(FALL_TINT[time][0]).replace("<rect ", `<rect pointer-events="none" opacity="${FALL_TINT[time][1]}" `) +
    (time === "night" ? `<circle cx="${f1(-W * 0.32)}" cy="${f1(y0 + H * 0.12)}" r="${f1(26 * k)}" fill="#fff6d6" opacity="0.95"/><circle cx="${f1(-W * 0.32 + 10 * k)}" cy="${f1(y0 + H * 0.12 - 6 * k)}" r="${f1(22 * k)}" fill="#0b1030" opacity="0.35"/>` : "")));
  // a sign back to the trail (an object, at its post's foot; painted after
  // the light at sunset or at night, which leaves it bright, so then in
  // front of everything)
  s += SEP + obj("signpost", time !== "day" ? Infinity : g + 40 * k, part("wf-sign", c.F, () => signpost(W * 0.3, g + 40 * k, k, [["⛰️ trail", "mountains", 1]])));
  return s;
}

// The camp site: day, sunset or night; tents round a campfire (on or out,
// its flames as big as the slider says, in a group that grows them),
// sparks, and on the fire nothing, veggie sausages on sticks, or a pot of
// soup hanging over it, steaming.
// the tents, in the order they are put up: where each stands (a share of
// the width), its color (the same inside, see tentScene) and its door's side
const CAMP_TENTS = [{ u: -0.32, color: "#e8762c", sd: 1, name: "🟧 orange" }, { u: 0.33, color: "#3b7dd8", sd: -1, name: "🟦 blue" },
                    { u: -0.12, color: "#27ae60", sd: 1, name: "🟩 green" }];
const CAMP_SKY = { day: ["#5aa9e6", "#dff2ff"], sunset: ["#3a2a6a", "#f2a65a"], night: ["#0b1030", "#24305a"] };
// Stars in a night sky, as the place's settings say: their shape (dots, or
// stars of four, five, six or eight points, or a mix of them), their size
// on average (many small, a few big; 100 = the usual, up to huge), their
// brightness on average (the brightest with a soft glow), and how much the
// big bright ones twinkle: turning a little, growing and shrinking,
// glimmering (and the small ones blink, more with more twinkle).
const STAR_SHAPES = [["dot", "• dots"], ["four", "✦ four points"], ["five", "★ five points"], ["six", "✶ six points"],
                     ["eight", "✴ eight points"], ["mix", "🎲 a mix"]];
const STAR_TINTS = ["#ffffff", "#fff4d6", "#e2ebff", "#fffbe8"];
// a star's outline about (0, 0), its points r out
function starPath(shape, r) {
  if (shape === "four") {   // a sparkle: four points, its sides curving in
    const c = 0.14 * r;
    return `M0 ${f1(-r)} Q${f1(c)} ${f1(-c)} ${f1(r)} 0 Q${f1(c)} ${f1(c)} 0 ${f1(r)} Q${f1(-c)} ${f1(c)} ${f1(-r)} 0 Q${f1(-c)} ${f1(-c)} 0 ${f1(-r)} Z`;
  }
  // five or six points; eight, the four between them shorter
  const n = { five: 5, six: 6, eight: 8 }[shape], inner = { five: 0.42, six: 0.48, eight: 0.26 }[shape], pts = [];
  for (let i = 0; i < 2 * n; i++) {
    const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * inner : shape === "eight" && i % 4 === 2 ? r * 0.58 : r;
    pts.push(`${f1(rr * Math.cos(a))} ${f1(rr * Math.sin(a))}`);
  }
  return "M" + pts.join(" L") + " Z";
}
// n stars over the box (xa..xb, ya..yb), at the scene's scale k; R and the
// seed place them (each its own size, brightness, tint and shape)
function starsSvg(o, n, xa, xb, ya, yb, k, R, seed) {
  const pick = STAR_SHAPES.some(([v]) => v === o.starShape) ? o.starShape : "mix";
  const size = (o.starSize ?? 100) / 100, bright = (o.starBright ?? 85) / 100, tw = (o.starTwinkle ?? 40) / 100;
  let t = `<defs><radialGradient id="bg-star-glow"><stop offset="0" stop-color="#fffbe8" stop-opacity="0.6"/><stop offset="1" stop-color="#fffbe8" stop-opacity="0"/></radialGradient></defs>`;
  for (let i = 0; i < n; i++) {
    const x = xa + (xb - xa) * R(i, seed), y = ya + (yb - ya) * R(i, seed + 1), u = R(i, seed + 2);
    const f = 0.4 + 2.4 * u * u * u, op = Math.max(0.08, Math.min(1, bright * (0.55 + 0.9 * R(i, seed + 3))));
    const shape = pick !== "mix" ? pick : f < 0.6 ? "dot" : ["four", "five", "six", "eight", "four"][Math.floor(R(i, seed + 4) * 5)];
    // (a point star's ink is thin: it is drawn wider than a dot, to look as big)
    const r = 1.5 * k * size * f * (shape === "dot" ? 1 : 2.2), tint = STAR_TINTS[Math.floor(R(i, seed + 5) * STAR_TINTS.length)];
    const body = shape === "dot" ? `<circle r="${f1(r)}" fill="${tint}"/>` : `<path d="${starPath(shape, r)}" fill="${tint}"/>`;
    // (the glow hugs a big star closer, or big stars would fog the sky)
    const glow = op * f > 1.1 ? `<circle r="${f1(r * (1 + 1.6 / Math.max(1, Math.sqrt(size))))}" fill="url(#bg-star-glow)" opacity="${(Math.min(1, op * f / 2)).toFixed(2)}"/>` : "";
    // the big bright ones twinkle: turn, grow and shrink, glimmer, each at
    // its own pace; the small ones blink (a quarter of them)
    const big = tw > 0 && op * f > 0.9, d = (s0, s1) => (s0 + s1 * R(i, seed + 6)).toFixed(2);
    // (with the scene's quick LFO, each its own way in: sceneLfo)
    const glimmer = big || (tw > 0 && i % 4 === 0)
      ? sceneLfo(o, "fast", R(i, seed + 7), "opacity", v => (op * (1 - 0.75 * tw * (1 + v) / 2)).toFixed(2),
          `<animate attributeName="opacity" values="${op.toFixed(2)};${(op * (1 - 0.75 * tw)).toFixed(2)};${op.toFixed(2)}" dur="${d(1.4, 2.2)}s" repeatCount="indefinite"/>`) : "";
    let star = `<g opacity="${op.toFixed(2)}">${glimmer}${glow}${body}</g>`;
    if (big) star = `<g><animateTransform attributeName="transform" type="scale" values="1;${(1 + 0.45 * tw).toFixed(2)};1" dur="${d(1.1, 1.6)}s" repeatCount="indefinite"/>${star}</g>`;
    if (big && shape !== "dot")
      star = `<g><animateTransform attributeName="transform" type="rotate" values="0;${f1(18 * tw)};0;${f1(-18 * tw)};0" dur="${d(4, 4)}s" repeatCount="indefinite"/>${star}</g>`;
    t += `<g transform="translate(${f1(x)} ${f1(y)})">${star}</g>`;
  }
  return t;
}
// (ticket 50) the logs by the fire: each one's top, 100 long and 28 thick
// about its middle (dx, dy from the fire), as campsiteScene's "camp-logs"
// draws them; one sits on the left log facing the fire (right), on the
// right one facing it (left). Not the near log: there one would face the
// fire, away from us, and the friend has no back view.
SEATS.campsite = (c, B) => { const { g, k } = c, fx = 0, fy = g + 40 * k;
  return [[-150, 30, "left", "right"], [150, 30, "right", "left"]].map(([dx, dy, where, face]) =>
    ({ name: `log, ${where}`, x0: fx + (dx - 50) * k, x1: fx + (dx + 50) * k, y: fy + (dy - 14) * k, z: fy + (dy + 14) * k + 1, facing: [face] })); };
// (ticket 185, v3: lifted out of the camp site, unchanged, for the object library) a log to sit on,
// lying across, its middle at (x, y), its cut end to the right
const logSvg = (x, y, k) => `<rect x="${f1(x - 50 * k)}" y="${f1(y - 14 * k)}" width="${f1(100 * k)}" height="${f1(28 * k)}" rx="${f1(14 * k)}" fill="#7a5232" stroke="#4a2e1a" stroke-width="${f1(2 * k)}"/>` +
    `<ellipse cx="${f1(x + 50 * k)}" cy="${f1(y)}" rx="${f1(7 * k)}" ry="${f1(14 * k)}" fill="#c9a66b"/>`;
// (lifted out of the camp site, unchanged) the campfire's ring of stones and its crossed wood, round (fx, fy)
function campfireHearthSvg(fx, fy, k) {
  const P = (x, y) => `${f1(x)} ${f1(y)}`;   // (as backgroundSvg's)
  return [...Array(10)].map((_, i) => {
    const a = i / 10 * 2 * Math.PI;
    return `<ellipse cx="${f1(fx + 50 * k * Math.cos(a))}" cy="${f1(fy + 14 * k * Math.sin(a))}" rx="${f1(13 * k)}" ry="${f1(9 * k)}" fill="${["#8a8a8a", "#9c9c9c", "#7a7a7a"][i % 3]}" stroke="#555" stroke-width="${f1(k)}"/>`;
  }).join("") + `<path d="M${P(fx - 34 * k, fy + 4 * k)} L${P(fx + 30 * k, fy - 10 * k)} M${P(fx + 34 * k, fy + 4 * k)} L${P(fx - 30 * k, fy - 10 * k)}" stroke="#5a3a1c" stroke-width="${f1(10 * k)}" stroke-linecap="round"/>`;
}
// (lifted out of the camp site, unchanged) its flames and sparks, at (0, 0), drawn up from there;
// a warm glow round them at sunset and at night
function campfireFlamesSvg(o, night, time) {
      const flame = (x, top, w) => `M${x - w} 0 Q${x - w * 0.6} ${-top * 0.55} ${x} ${-top} Q${x + w * 0.6} ${-top * 0.55} ${x + w} 0 Z`;
      // (its warm glow, at sunset and at night, breathing with the slow LFO)
      return (night || time === "sunset" ? `<ellipse cx="0" cy="-30" rx="220" ry="140" fill="#ff9a3c" opacity="${night ? 0.18 : 0.1}">` +
          sceneLfo(o, "slow", 0.2, "opacity", (v, amp) => ((night ? 0.18 : 0.1) * (1 + (0.25 + 0.6 * amp) * v)).toFixed(3)) + `</ellipse>` : "") +
        [[-18, 80, 18, "#ff6a1a", 0.7], [16, 90, 18, "#ff6a1a", 0.85], [0, 120, 24, "#ff8c1a", 0.6], [-6, 70, 12, "#ffd23f", 0.5], [8, 76, 11, "#ffd23f", 0.65]].map(([x, top, w, col, d]) =>
          `<path d="${flame(x, top, w)}" fill="${col}">${lfoTimed(o, "fast", (x + 20) / 40, `<animate attributeName="d" values="${flame(x, top, w)};${flame(x + 3, top * 0.75, w)};${flame(x - 2, top * 1.1, w)};${flame(x, top, w)}" dur="${d}s" repeatCount="indefinite"/>`)}</path>`).join("") +
        [...Array(8)].map((_, i) => { const x = -20 + 40 * ((i * 37) % 10) / 10;
          return `<circle cx="${x}" cy="-60" r="2.5" fill="#ffd23f"><animate attributeName="cy" values="-60;-220" dur="${(1.2 + (i % 4) * 0.35).toFixed(2)}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite"/>` +
                 `<animate attributeName="opacity" values="1;0" dur="${(1.2 + (i % 4) * 0.35).toFixed(2)}s" begin="${(i * 0.3).toFixed(1)}s" repeatCount="indefinite"/></circle>`; }).join("");
}
function campsiteScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, grad, all, land, o, side } = c;
  const time = CAMP_SKY[o.campTime] ? o.campTime : "day", fire = o.fireOn ?? true, fz = (o.flameSize ?? 100) / 100;
  const food = o.campFood ?? "none", tents = o.tents ?? 2, night = time === "night";
  const fx = 0, fy = g + 40 * k;
  const starKeys = night ? [o.starShape, o.starSize, o.starBright, o.starTwinkle] : [];
  let s = SEP + part("camp-sky", [c.F, time, ...starKeys, sceneLfoKey(o, "fast"), sceneLfoKey(o, "slow")], () => {
    const [a, b] = CAMP_SKY[time];
    let t = `<defs>${grad("bg-sky", a, b, y0, g - 100 * k)}${cloudDef("bg-cloud", 1)}</defs>` + all("url(#bg-sky)");
    if (time === "day") t += `<circle cx="${f1(x1 - W * 0.15)}" cy="${f1(y0 + H * 0.13)}" r="${f1(34 * k)}" fill="#ffd23f"/>` +
      [0, 1, 2].map(i => driftingCloud(x0 + W * (0.15 + 0.3 * i), y0 + H * (0.1 + 0.05 * (i % 2)), k * 0.7, i, o)).join("");
    if (time === "sunset") t += `<circle cx="${f1(-W * 0.2)}" cy="${f1(g - 110 * k)}" r="${f1(46 * k)}" fill="#ff8c42" opacity="0.95"/>`;
    if (night) {
      // the stars, then the moon over them (its dark side hides those behind it)
      t += starsSvg(o, 70, x0, x1, y0, g - 160 * k, k, R, 360) +
           `<circle cx="${f1(x1 - W * 0.16)}" cy="${f1(y0 + H * 0.14)}" r="${f1(28 * k)}" fill="#f4eebc"/><circle cx="${f1(x1 - W * 0.16 + 12 * k)}" cy="${f1(y0 + H * 0.14 - 8 * k)}" r="${f1(24 * k)}" fill="#0b1030"/>`;
    }
    return t;
  });
  // the ground, the woods round the camp (darker at night)
  s += SEP + part("camp-ground", [c.F, time], () => {
    const tree = { day: ["#2f6e3a", "#3a7d44"], sunset: ["#2a4a3a", "#33553f"], night: ["#0f2018", "#13281d"] }[time];
    let t = `<defs>${PINE_DEF}</defs>` + land(g - 110 * k, 8, night ? "#1d3a24" : time === "sunset" ? "#4a6a3a" : "#7cc25a", 0.5), row = "";
    // (the row of pines an object, at their middle depth)
    for (let i = 0; i < 26; i++) row += use("bg-pine", x0 - 20 * k + (W + 40 * k) * i / 25, g - 100 * k + 10 * k * R(i, 364), k * (0.45 + 0.25 * R(i, 365)), k * (0.45 + 0.25 * R(i, 365)), ` color="${tree[i % 2]}"`);
    t += obj("woods", g - 95 * k, row) + land(g - 40 * k, 4, night ? "#24452c" : time === "sunset" ? "#5a7a40" : "#8bc56a", 1.3) +
         `<ellipse cx="${f1(fx)}" cy="${f1(fy + 6 * k)}" rx="${f1(170 * k)}" ry="${f1(45 * k)}" fill="${night ? "#3a2e22" : "#a8875a"}"/>`;
    return t;
  });
  // tents, each a doorway into its inside (each an object, standing where
  // its sides meet the ground; named by its color)
  s += SEP + part("camp-tents", [c.F, tents, time], () => CAMP_TENTS.slice(0, tents).map(({ u, color: col, sd, name }, i) => {
    const tx = W * u, tb = g - 40 * k + i * 6 * k, w = 130 * k, h = 110 * k, dark = night ? 0.45 : 0;
    return obj(`${name.split(" ").pop()} tent`, tb, `<g class="portal" data-to="tent" data-tent="${i + 1}"><polygon points="${P2(tx - w / 2, tb)} ${P2(tx, tb - h)} ${P2(tx + w / 2, tb)}" fill="${col}" stroke="#00000055" stroke-width="${f1(2 * k)}"/>` +
           `<polygon points="${P2(tx - 12 * k * sd, tb)} ${P2(tx, tb - h * 0.75)} ${P2(tx + 22 * k * sd, tb)}" fill="#2a1a12" opacity="0.75"/>` +
           `<line x1="${f1(tx)}" y1="${f1(tb - h)}" x2="${f1(tx)}" y2="${f1(tb - h - 14 * k)}" stroke="#555" stroke-width="${f1(2.5 * k)}"/>` +
           (dark ? `<polygon points="${P2(tx - w / 2, tb)} ${P2(tx, tb - h)} ${P2(tx + w / 2, tb)}" fill="#000814" opacity="${dark}"/>` : "") + `</g>`);
  }).join(""));
  // logs to sit on, round the fire (each an object, at its underside)
  s += SEP + part("camp-logs", c.F, () => [[-150, 30, "left"], [150, 30, "right"], [0, 100, "near"]].map(([dx, dy, where]) =>
    obj(`log, ${where}`, fy + (dy + 14) * k, logSvg(fx + dx * k, fy + dy * k, k))).join(""));
  // at night, the dark: in front of everything, the friend too, wherever
  // they stand; but the fire makes a pool of light round itself, clear at
  // the fire and dark far from it, so the fire stays bright and what stands
  // near it (the friend too) is lit by it
  if (night) s += SEP + obj("dark", Infinity, part("camp-night", c.F, () =>
    `<defs><radialGradient id="bg-camp-dark" gradientUnits="userSpaceOnUse" cx="${f1(fx)}" cy="${f1(fy - 50 * k)}" r="${f1(300 * k)}">` +
    `<stop offset="0.3" stop-color="#000814" stop-opacity="0"/><stop offset="1" stop-color="#000814" stop-opacity="0.28"/></radialGradient></defs>` +
    all("url(#bg-camp-dark)").replace("<rect ", `<rect pointer-events="none" `)));
  // the fire: stones and wood; its flames, sparks and glow in a group that
  // grows with the slider (out: smoke); all one object, at the fire's foot
  let campfire = SEP + part("camp-hearth", c.F, () => campfireHearthSvg(fx, fy, k));
  if (fire) {
    campfire += OPEN(`<g pointer-events="none" ${tf(fx, fy - 4 * k, fz * k)}>`) + part("camp-flames", [night, time, sceneLfoKey(o, "fast"), sceneLfoKey(o, "slow")], () => campfireFlamesSvg(o, night, time)) + CLOSE;
  } else {
    campfire += SEP + part("camp-smoke", c.F, () => [0, 1, 2].map(i => `<circle cx="${f1(fx + (i - 1) * 8 * k)}" cy="${f1(fy - 20 * k)}" r="${f1(10 * k)}" fill="#9a9aa2" opacity="0.5">` +
      `<animate attributeName="cy" values="${f1(fy - 20 * k)};${f1(fy - 170 * k)}" dur="3s" begin="${i}s" repeatCount="indefinite"/>` +
      `<animate attributeName="r" values="${f1(8 * k)};${f1(26 * k)}" dur="3s" begin="${i}s" repeatCount="indefinite"/>` +
      `<animate attributeName="opacity" values="0.5;0" dur="3s" begin="${i}s" repeatCount="indefinite"/></circle>`).join(""));
  }
  s += obj("campfire", fy, campfire);
  // what is cooking (an object over the fire, at its foot: sausages on
  // sticks, or a pot on a tripod standing round it)
  if (food === "sausages") s += SEP + obj("sausages", fy, part("camp-sausages", c.F, () => [[-1, -40], [1, -55], [-1, -70]].map(([sd, dy], i) => {
    const ex = fx + sd * 14 * k, ey = fy + dy * k, hx = fx + sd * 170 * k, hy = fy + (dy + 70) * k;
    return `<line x1="${f1(hx)}" y1="${f1(hy)}" x2="${f1(ex)}" y2="${f1(ey)}" stroke="#8b5e34" stroke-width="${f1(3.5 * k)}" stroke-linecap="round"/>` +
           `<rect x="${f1(ex - 26 * k)}" y="${f1(ey - 7 * k)}" width="${f1(36 * k)}" height="${f1(14 * k)}" rx="${f1(7 * k)}" fill="${["#b5674d", "#a0523a", "#c27a5a"][i]}" ` +
           `stroke="#5a2a1a" stroke-width="${f1(1.5 * k)}" transform="rotate(${f1(Math.atan2(ey - hy, ex - hx) * 180 / Math.PI)} ${f1(ex)} ${f1(ey)})"/>`;
  }).join("")));
  if (food === "soup") s += SEP + obj("soup", fy + 10 * k, part("camp-soup", c.F, () => {
    const top = fy - 200 * k, px = fx, py = fy - 95 * k;
    return [-1, 1].map(sd => `<line x1="${f1(fx + sd * 90 * k)}" y1="${f1(fy + 10 * k)}" x2="${f1(fx)}" y2="${f1(top)}" stroke="#6e4a2c" stroke-width="${f1(6 * k)}" stroke-linecap="round"/>`).join("") +
      `<line x1="${f1(fx)}" y1="${f1(top + 4 * k)}" x2="${f1(fx + 10 * k)}" y2="${f1(fy + 14 * k)}" stroke="#6e4a2c" stroke-width="${f1(6 * k)}" stroke-linecap="round"/>` +
      `<line x1="${f1(px)}" y1="${f1(top)}" x2="${f1(px)}" y2="${f1(py - 34 * k)}" stroke="#555" stroke-width="${f1(2.5 * k)}" stroke-dasharray="${f1(4 * k)} ${f1(2 * k)}"/>` +
      `<path d="M${P(px - 34 * k, py - 30 * k)} Q${P(px, py - 52 * k)} ${P(px + 34 * k, py - 30 * k)}" fill="none" stroke="#555" stroke-width="${f1(2.5 * k)}"/>` +
      `<path d="M${P(px - 38 * k, py - 30 * k)} Q${P(px - 40 * k, py + 20 * k)} ${P(px, py + 22 * k)} Q${P(px + 40 * k, py + 20 * k)} ${P(px + 38 * k, py - 30 * k)} Z" fill="#2b2b30" stroke="#111" stroke-width="${f1(2 * k)}"/>` +
      `<ellipse cx="${f1(px)}" cy="${f1(py - 30 * k)}" rx="${f1(36 * k)}" ry="${f1(7 * k)}" fill="#e8a33a"/>` +
      [0, 1, 2].map(i => `<path d="M${P(px + (i - 1) * 14 * k, py - 40 * k)} q${f1(-8 * k)} ${f1(-14 * k)} 0 ${f1(-28 * k)} q${f1(8 * k)} ${f1(-14 * k)} 0 ${f1(-28 * k)}" fill="none" stroke="#ffffff" stroke-width="${f1(3 * k)}" stroke-linecap="round" opacity="0">` +
        `<animate attributeName="opacity" values="0;0.75;0" dur="2.4s" begin="${(i * 0.8).toFixed(1)}s" repeatCount="indefinite"/>` +
        `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${f1(-40 * k)}" dur="2.4s" begin="${(i * 0.8).toFixed(1)}s" repeatCount="indefinite"/></path>`).join("");
  }));
  // a sign back to the trail (an object, at its post's foot)
  s += SEP + obj("signpost", g + 30 * k, part("camp-sign", c.F, () => signpost(W * 0.42, g + 30 * k, k, [["⛰️ trail", "mountains", -1]])));
  return s;
}
// Inside a tent at the camp site: its canvas all round, the same color as
// outside, its seams running to the far end, where the door stands open
// onto the camp (at the camp's own time of day, its fire lit or out: the
// camp's settings), a doorway back out. Each tent has things of its own:
// the orange one sleeping bags and a flashlight, the blue one books, a
// teddy bear and a lantern, the green one an explorer's map, binoculars,
// a backpack and a jar of fireflies.
function tentScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, grad, all, o } = c;
  const n = Math.max(1, Math.min(CAMP_TENTS.length, Math.round(o.tent ?? 1))), T = CAMP_TENTS[n - 1];
  const time = CAMP_SKY[o.campTime] ? o.campTime : "day", night = time === "night", fire = o.fireOn ?? true;
  // the far wall (its peak, and its corners on the floor), the door in it,
  // and the point the seams run to (at the eye's height)
  const back = g - 70 * k, apex = y0 + H * 0.08, half = W * 0.3, top = y0 + H * 0.3, dh = W * 0.12, vy = y0 + H * 0.42;
  // a point on the far wall, carried out toward us along its seam
  const out = (x, y, to) => { const t = (to - y) / (y - vy); return [x + x * t, to]; };
  const seam = mix(T.color, "#000000", 0.55);
  let s = SEP + part("tent-shell", [c.F, n], () => {
    const dark = mix(T.color, "#000000", 0.4), lit = mix(T.color, "#000000", 0.2), far = mix(T.color, "#ffffff", 0.1);
    let t = all(dark) + `<rect x="0" y="${f1(y0 - pad)}" width="${f1(x1 + pad)}" height="${f1(H + 2 * pad)}" fill="${lit}"/>`;
    // the seams along the walls, from the far wall's edges out past us
    for (const sd of [-1, 1]) for (let j = 1; j <= 3; j++) {
      const u = j / 4, ex = sd * half * u, ey = apex + (back - apex) * u, [ox, oy] = [ex + (ex - 0) * 12, ey + (ey - vy) * 12];
      t += `<line x1="${f1(ex)}" y1="${f1(ey)}" x2="${f1(ox)}" y2="${f1(oy)}" stroke="${seam}" stroke-width="${f1(2 * k)}" opacity="0.5"/>`;
    }
    // the far wall, the ridge above it, the groundsheet
    const [nx, ny] = out(half, back, y1 + pad);
    t += `<polygon points="${P2(0, apex)} ${P2(-half, back)} ${P2(half, back)}" fill="${far}" stroke="${seam}" stroke-width="${f1(2.5 * k)}"/>` +
         `<line x1="0" y1="${f1(apex)}" x2="0" y2="${f1(y0 - pad)}" stroke="${seam}" stroke-width="${f1(5 * k)}"/>` +
         `<polygon points="${P2(-half, back)} ${P2(half, back)} ${P2(nx, ny)} ${P2(-nx, ny)}" fill="#55606e" stroke="${seam}" stroke-width="${f1(2.5 * k)}"/>`;
    for (const u of [-0.5, 0, 0.5]) {
      const [lx, ly] = out(half * u, back, y1 + pad);
      t += `<line x1="${f1(half * u)}" y1="${f1(back)}" x2="${f1(lx)}" y2="${f1(ly)}" stroke="#4a5360" stroke-width="${f1(2 * k)}"/>`;
    }
    // a mesh window high on each wall, the sky behind it, drawn on the wall
    // in perspective: a point on a wall is u of the way down the far wall's
    // edge, carried out along its seam to sc times as far from where the
    // seams meet; equal steps in 1/sc are equal steps along the wall
    const onWall = (sd, u, sc) => [sd * half * u * sc, vy + (apex + (back - apex) * u - vy) * sc];
    const segment = (a, b) => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="#333" stroke-width="${f1(0.8 * k)}" opacity="0.5"/>`;
    for (const sd of [-1, 1]) {
      const u0 = 0.385, u1 = 0.42, s0 = 2.67, s1 = 3.29;
      t += `<polygon points="${[[u0, s0], [u0, s1], [u1, s1], [u1, s0]].map(([u, sc]) => P2(...onWall(sd, u, sc))).join(" ")}" ` +
           `fill="${CAMP_SKY[time][1]}" stroke="${seam}" stroke-width="${f1(3 * k)}" stroke-linejoin="round"/>`;
      // (the mesh: threads along the wall, toward where the seams meet, and across it, along the far wall's edge)
      for (let j = 1; j < 4; j++) { const u = u0 + (u1 - u0) * j / 4; t += segment(onWall(sd, u, s0), onWall(sd, u, s1)); }
      for (let j = 1; j < 6; j++) { const sc = 1 / (1 / s0 + (1 / s1 - 1 / s0) * j / 6); t += segment(onWall(sd, u0, sc), onWall(sd, u1, sc)); }
    }
    return t;
  });
  // the door, open onto the camp: its sky, the far trees, the fire
  s += SEP + part("tent-door", [c.F, n, time, fire, ...(night ? [o.starShape, o.starSize, o.starBright, o.starTwinkle] : []), sceneLfoKey(o, "fast")], () => {
    const [a, b] = CAMP_SKY[time], hor = back - 34 * k;
    const ground = night ? "#24452c" : time === "sunset" ? "#5a7a40" : "#8bc56a", tree = { day: "#2f6e3a", sunset: "#2a4a3a", night: "#0f2018" }[time];
    let v = `<defs><clipPath id="bg-tent-door"><polygon points="${P2(0, top)} ${P2(-dh, back)} ${P2(dh, back)}"/></clipPath>${grad("bg-tent-sky", a, b, top, hor)}${PINE_DEF}</defs>` +
            `<g class="portal" data-to="campsite"><g clip-path="url(#bg-tent-door)">` +
            `<rect x="${f1(-dh)}" y="${f1(top)}" width="${f1(2 * dh)}" height="${f1(back - top)}" fill="url(#bg-tent-sky)"/>`;
    // (the same night sky as outside the tent, its stars as they are there)
    if (night) v += starsSvg(o, 14, -dh, dh, top, top + (hor - top) * 0.8, k, R, 371);
    for (let i = 0; i < 7; i++) v += use("bg-pine", -dh + 2 * dh * (i + 0.5) / 7, hor + 6 * k * R(i, 374), k * (0.22 + 0.1 * R(i, 375)), k * (0.22 + 0.1 * R(i, 375)), ` color="${tree}"`);
    v += `<rect x="${f1(-dh)}" y="${f1(hor)}" width="${f1(2 * dh)}" height="${f1(back - hor + 2 * k)}" fill="${ground}"/>`;
    // the fire, small and far off (or its smoke)
    const fx = 0, fy = back - 6 * k;
    if (fire) v += [[-5, 22, 6, "#ff6a1a", 0.7], [5, 26, 6, "#ff8c1a", 0.6], [0, 16, 4, "#ffd23f", 0.5]].map(([x, h, w, col, d]) => {
      const fl = (hh) => `M${f1(fx + (x - w) * k)} ${f1(fy)} Q${f1(fx + x * k)} ${f1(fy - hh * k * 1.2)} ${f1(fx + (x + w) * k)} ${f1(fy)} Z`;
      return `<path d="${fl(h)}" fill="${col}"><animate attributeName="d" values="${fl(h)};${fl(h * 0.75)};${fl(h * 1.1)};${fl(h)}" dur="${d}s" repeatCount="indefinite"/></path>`;
    }).join("") + (night ? `<ellipse cx="${f1(fx)}" cy="${f1(fy - 8 * k)}" rx="${f1(40 * k)}" ry="${f1(22 * k)}" fill="#ff9a3c" opacity="0.25"/>` : "");
    else v += `<circle cx="${f1(fx)}" cy="${f1(fy - 10 * k)}" r="${f1(5 * k)}" fill="#9a9aa2" opacity="0.5"><animate attributeName="cy" values="${f1(fy - 10 * k)};${f1(top + 20 * k)}" dur="3s" repeatCount="indefinite"/>` +
              `<animate attributeName="opacity" values="0.5;0" dur="3s" repeatCount="indefinite"/></circle>`;
    v += `</g><polyline points="${P2(-dh, back)} ${P2(0, top)} ${P2(dh, back)}" fill="none" stroke="#2a2a2a" stroke-width="${f1(3 * k)}" stroke-dasharray="${f1(4 * k)} ${f1(3 * k)}"/></g>`;
    // the flaps, rolled back either side and tied
    for (const sd of [-1, 1]) {
      const fx2 = sd * (dh * 0.55 + 34 * k), fy2 = top + (back - top) * 0.5;
      v += `<polygon points="${P2(0, top)} ${P2(sd * dh, back)} ${P2(sd * (dh + 30 * k), back)} ${P2(fx2, fy2)}" fill="${mix(T.color, "#ffffff", 0.05)}" stroke="${seam}" stroke-width="${f1(1.5 * k)}"/>` +
           `<line x1="${f1(fx2 - sd * 12 * k)}" y1="${f1(fy2 - 6 * k)}" x2="${f1(fx2 + sd * 6 * k)}" y2="${f1(fy2 + 8 * k)}" stroke="#d9c08a" stroke-width="${f1(3 * k)}" stroke-linecap="round"/>`;
    }
    return v;
  });
  // the tent's own things on the groundsheet, either side of the middle
  // (not objects here: each tent's are drawn together, the flat with the
  // standing, by TENT_THINGS)
  s += SEP + part("tent-things", [c.F, n], () => TENT_THINGS[n - 1]({ k, P, R, back, half, out, y0, y1, g, W, H }));
  // night or sunset over the inside, then what glows (each in front of
  // everything, the friend too; what glows, painted after the night or the
  // sunset, then in front of it, else where it stands: the flashlight, on
  // the floor by the far wall; the lantern, hanging over about where the
  // friend stands; the jar, on the floor near us)
  if (night) s += SEP + obj("dark", Infinity, part("tent-night", c.F, () => all("#000814").replace("<rect ", `<rect pointer-events="none" opacity="0.4" `)));
  if (time === "sunset") s += SEP + obj("sunset light", Infinity, part("tent-sunset", c.F, () => all("#ff8c42").replace("<rect ", `<rect pointer-events="none" opacity="0.1" `)));
  const glow = [["flashlight beam", g - 20 * k], ["lantern", g], ["jar of fireflies", g + 40 * k]][n - 1];
  // (its light breathing with the slow LFO)
  s += SEP + obj(glow[0], time !== "day" ? Infinity : glow[1], part("tent-glow", [c.F, n, night, sceneLfoKey(o, "slow")], () => `<g>${sceneLfo(o, "slow", 0.3, "opacity", (v, amp) => (1 - (0.12 + 0.35 * amp) * (1 + v) / 2).toFixed(3))}` +
    TENT_GLOW[n - 1]({ k, P, R, back, half, out, y0, y1, g, W, H, night }) + `</g>`));
  return s;
}
// a sleeping bag along the tent, from by the far wall out toward us: its
// far end's two corners, and its color
function sleepingBag({ k, back, out, y1 }, xa, xb, color) {
  const fy = back + 8 * k, ny = y1 - 6 * k, [na] = out(xa, fy, ny), [nb] = out(xb, fy, ny);
  const flap = (u) => [xa + (na - xa) * u, xb + (nb - xb) * u, fy + (ny - fy) * u];
  const [fa, fb, fyy] = flap(0.3);
  return `<path d="M${f1(xa)} ${f1(fy)} Q${f1((xa + xb) / 2)} ${f1(fy - 10 * k)} ${f1(xb)} ${f1(fy)} L${f1(nb)} ${f1(ny)} Q${f1((na + nb) / 2)} ${f1(ny + 14 * k)} ${f1(na)} ${f1(ny)} Z" ` +
         `fill="${color}" stroke="${darker(color)}" stroke-width="${f1(2.5 * k)}" stroke-linejoin="round"/>` +
         // the top folded back, lighter, and the zip down its side
         `<path d="M${f1(xa)} ${f1(fy)} Q${f1((xa + xb) / 2)} ${f1(fy - 10 * k)} ${f1(xb)} ${f1(fy)} L${f1(fb)} ${f1(fyy)} Q${f1((fa + fb) / 2)} ${f1(fyy + 8 * k)} ${f1(fa)} ${f1(fyy)} Z" fill="${mix(color, "#ffffff", 0.35)}"/>` +
         `<line x1="${f1(fb)}" y1="${f1(fyy)}" x2="${f1(nb)}" y2="${f1(ny)}" stroke="#d8d8d8" stroke-width="${f1(1.5 * k)}" stroke-dasharray="${f1(3 * k)} ${f1(2 * k)}"/>` +
         // a pillow at its far end
         `<ellipse cx="${f1((xa + xb) / 2)}" cy="${f1(fy + 2 * k)}" rx="${f1(Math.abs(xb - xa) * 0.38)}" ry="${f1(11 * k)}" fill="#f4f1ea" stroke="#c9c4b8" stroke-width="${f1(1.5 * k)}"/>`;
}
const TENT_THINGS = [
  // orange: two sleeping bags, a flashlight on one
  G => sleepingBag(G, -G.half * 0.88, -G.half * 0.42, "#c0392b") + sleepingBag(G, G.half * 0.42, G.half * 0.88, "#7d3c98") +
    `<g transform="translate(${f1(G.W * 0.27)} ${f1(G.g - 20 * G.k)}) rotate(-25) scale(${G.k.toFixed(3)})"><rect x="-24" y="-7" width="40" height="14" rx="4" fill="#3a3a3a"/>` +
    `<rect x="14" y="-10" width="12" height="20" rx="3" fill="#f2c12e"/><rect x="-14" y="-3" width="8" height="6" rx="1" fill="#e53935"/></g>`,
  // blue: a teddy bear on a blanket, a pile of books
  G => {
    const { k, W, g } = G, bx = -W * 0.31, by = g - 8 * k, rx = W * 0.3, ry = g + 6 * k;
    let t = `<polygon points="${P2(bx - 70 * k, by + 20 * k)} ${P2(bx + 60 * k, by + 20 * k)} ${P2(bx + 80 * k, by + 70 * k)} ${P2(bx - 90 * k, by + 70 * k)}" fill="#e6b450"/>` +
            [0, 1, 2].map(j => `<line x1="${f1(bx - 76 * k + j * 3 * k)}" y1="${f1(by + 34 * k + j * 14 * k)}" x2="${f1(bx + 66 * k + j * 5 * k)}" y2="${f1(by + 34 * k + j * 14 * k)}" stroke="#c0392b" stroke-width="${f1(4 * k)}"/>`).join("");
    t += `<g transform="translate(${f1(bx)} ${f1(by)}) scale(${k.toFixed(3)})">` +
         `<ellipse cx="-22" cy="34" rx="12" ry="9" fill="#8b5a2b"/><ellipse cx="22" cy="34" rx="12" ry="9" fill="#8b5a2b"/>` +
         `<ellipse cx="0" cy="12" rx="30" ry="28" fill="#a0693a"/><ellipse cx="0" cy="18" rx="16" ry="16" fill="#d9a066"/>` +
         `<ellipse cx="-30" cy="4" rx="9" ry="14" fill="#8b5a2b" transform="rotate(25 -30 4)"/><ellipse cx="30" cy="4" rx="9" ry="14" fill="#8b5a2b" transform="rotate(-25 30 4)"/>` +
         `<circle cx="-18" cy="-40" r="10" fill="#8b5a2b"/><circle cx="18" cy="-40" r="10" fill="#8b5a2b"/><circle cx="-18" cy="-40" r="5" fill="#d9a066"/><circle cx="18" cy="-40" r="5" fill="#d9a066"/>` +
         `<circle cx="0" cy="-24" r="24" fill="#a0693a"/><ellipse cx="0" cy="-16" rx="10" ry="8" fill="#d9a066"/><circle cx="0" cy="-19" r="3.5" fill="#2a1a10"/>` +
         `<circle cx="-9" cy="-29" r="3" fill="#2a1a10"/><circle cx="9" cy="-29" r="3" fill="#2a1a10"/><path d="M-4 -12 Q0 -9 4 -12" fill="none" stroke="#2a1a10" stroke-width="1.5"/></g>`;
    [["#2e86de", 0], ["#e53935", -4], ["#27ae60", 3], ["#f2c12e", -2]].forEach(([col, dx], j) =>
      t += `<rect x="${f1(rx - 34 * k + dx * k)}" y="${f1(ry - j * 13 * k)}" width="${f1(68 * k)}" height="${f1(12 * k)}" rx="${f1(2 * k)}" fill="${col}" stroke="${darker(col)}" stroke-width="${f1(1.2 * k)}"/>` +
           `<line x1="${f1(rx - 30 * k + dx * k)}" y1="${f1(ry - j * 13 * k + 3 * k)}" x2="${f1(rx + 30 * k + dx * k)}" y2="${f1(ry - j * 13 * k + 3 * k)}" stroke="#fff8e7" stroke-width="${f1(1.2 * k)}"/>`);
    return t + `<rect x="${f1(rx - 28 * k)}" y="${f1(ry - 64 * k)}" width="${f1(52 * k)}" height="${f1(12 * k)}" rx="${f1(2 * k)}" fill="#9b59b6" transform="rotate(-8 ${f1(rx)} ${f1(ry - 58 * k)})"/>`;
  },
  // green: a map with a route to an X, binoculars on it, a backpack
  G => {
    const { k, W, g, P } = G, mx = -W * 0.3, my = g + 10 * k, px = W * 0.31, py = g - 30 * k;
    return `<polygon points="${P2(mx - 60 * k, my - 30 * k)} ${P2(mx + 56 * k, my - 30 * k)} ${P2(mx + 78 * k, my + 36 * k)} ${P2(mx - 82 * k, my + 36 * k)}" fill="#f1e2b6" stroke="#b89a5a" stroke-width="${f1(2 * k)}"/>` +
      `<path d="M${P(mx - 60 * k, my + 24 * k)} Q${P(mx - 20 * k, my - 30 * k)} ${P(mx + 8 * k, my + 4 * k)} T${P(mx + 50 * k, my - 14 * k)}" fill="none" stroke="#c0392b" stroke-width="${f1(2.5 * k)}" stroke-dasharray="${f1(5 * k)} ${f1(4 * k)}"/>` +
      `<path d="M${P(mx + 44 * k, my - 22 * k)} L${P(mx + 58 * k, my - 8 * k)} M${P(mx + 58 * k, my - 22 * k)} L${P(mx + 44 * k, my - 8 * k)}" stroke="#c0392b" stroke-width="${f1(3.5 * k)}" stroke-linecap="round"/>` +
      `<path d="M${P(mx - 40 * k, my - 18 * k)} q${f1(8 * k)} ${f1(-8 * k)} ${f1(16 * k)} 0 M${P(mx - 10 * k, my + 22 * k)} q${f1(8 * k)} ${f1(-8 * k)} ${f1(16 * k)} 0" fill="none" stroke="#7a8a5a" stroke-width="${f1(2 * k)}"/>` +
      `<g transform="translate(${f1(mx - 4 * k)} ${f1(my + 8 * k)}) scale(${k.toFixed(3)})"><circle cx="-12" cy="0" r="11" fill="#2a2a2a"/><circle cx="12" cy="0" r="11" fill="#2a2a2a"/>` +
      `<circle cx="-12" cy="0" r="6" fill="#6fa8dc"/><circle cx="12" cy="0" r="6" fill="#6fa8dc"/><rect x="-4" y="-5" width="8" height="10" fill="#444"/></g>` +
      `<g transform="translate(${f1(px)} ${f1(py)}) scale(${k.toFixed(3)})"><rect x="-38" y="-50" width="76" height="96" rx="20" fill="#8e5a2b" stroke="#5e3a1a" stroke-width="3"/>` +
      `<path d="M-38 -14 Q0 -40 38 -14 L38 -40 Q0 -64 -38 -40 Z" fill="#a8703a" stroke="#5e3a1a" stroke-width="3"/><rect x="-24" y="4" width="48" height="32" rx="8" fill="#a8703a" stroke="#5e3a1a" stroke-width="2.5"/>` +
      `<rect x="-6" y="-22" width="12" height="16" rx="3" fill="#f2c12e"/><path d="M-30 -48 Q-44 -70 -20 -66 M30 -48 Q44 -70 20 -66" fill="none" stroke="#5e3a1a" stroke-width="5"/></g>`;
  },
];
// what glows in each tent, over the night: the flashlight's beam, the
// lantern, the jar of fireflies
const TENT_GLOW = [
  G => `<polygon points="${P2(G.W * 0.27 - 26 * G.k, G.g - 34 * G.k)} ${P2(G.W * 0.27 - 18 * G.k, G.g - 10 * G.k)} ${P2(G.W * 0.06, G.back - 40 * G.k)} ${P2(G.W * 0.12, G.back - 110 * G.k)}" ` +
       `fill="#fff3a8" opacity="${G.night ? 0.35 : 0.15}" pointer-events="none"/>`,
  G => {
    const { k, W, y0, H } = G, lx = -W * 0.17, ly = y0 + H * 0.17;
    return `<line x1="${f1(lx)}" y1="${f1(y0 - 10 * k)}" x2="${f1(lx)}" y2="${f1(ly - 22 * k)}" stroke="#333" stroke-width="${f1(2 * k)}"/>` +
      `<defs><radialGradient id="bg-tent-glow"><stop offset="0" stop-color="#ffd27a" stop-opacity="0.7"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>` +
      `<circle cx="${f1(lx)}" cy="${f1(ly)}" r="${f1((G.night ? 170 : 90) * k)}" fill="url(#bg-tent-glow)" opacity="${G.night ? 0.8 : 0.45}" pointer-events="none"/>` +
      `<g transform="translate(${f1(lx)} ${f1(ly)}) scale(${k.toFixed(3)})"><path d="M-14 -22 L14 -22 L10 -30 L-10 -30 Z" fill="#2a2a2a"/>` +
      `<rect x="-14" y="-22" width="28" height="38" rx="5" fill="#ffd27a" stroke="#2a2a2a" stroke-width="3"/><rect x="-16" y="16" width="32" height="7" rx="2" fill="#2a2a2a"/>` +
      `<path d="M0 -12 Q6 -2 0 8 Q-6 -2 0 -12 Z" fill="#ff8c1a"><animate attributeName="opacity" values="1;0.7;1" dur="0.8s" repeatCount="indefinite"/></path></g>`;
  },
  G => {
    const { k, W, g, R } = G, jx = W * 0.2, jy = g + 40 * k;
    let t = `<defs><radialGradient id="bg-jar-glow"><stop offset="0" stop-color="#fff36a" stop-opacity="0.7"/><stop offset="1" stop-color="#fff36a" stop-opacity="0"/></radialGradient></defs>` +
            `<ellipse cx="${f1(jx)}" cy="${f1(jy - 26 * k)}" rx="${f1((G.night ? 110 : 50) * k)}" ry="${f1((G.night ? 90 : 42) * k)}" fill="url(#bg-jar-glow)" opacity="${G.night ? 0.85 : 0.4}" pointer-events="none"/>` +
            `<rect x="${f1(jx - 22 * k)}" y="${f1(jy - 60 * k)}" width="${f1(44 * k)}" height="${f1(60 * k)}" rx="${f1(10 * k)}" fill="#cfe9f7" opacity="0.55" stroke="#9cc3d8" stroke-width="${f1(2 * k)}"/>` +
            `<rect x="${f1(jx - 24 * k)}" y="${f1(jy - 68 * k)}" width="${f1(48 * k)}" height="${f1(10 * k)}" rx="${f1(3 * k)}" fill="#8a8a8a"/>`;
    for (let i = 0; i < 7; i++) {
      const fx = jx + (R(i, 376) - 0.5) * 30 * k, fy = jy - (8 + 44 * R(i, 377)) * k;
      t += `<circle cx="${f1(fx)}" cy="${f1(fy)}" r="${f1(2.6 * k)}" fill="#fff36a"><animate attributeName="opacity" values="1;0.15;1" dur="${(1 + R(i, 378)).toFixed(2)}s" repeatCount="indefinite"/>` +
           `<animate attributeName="cy" values="${f1(fy)};${f1(fy - 6 * k)};${f1(fy)}" dur="${(2 + R(i, 379)).toFixed(2)}s" repeatCount="indefinite"/></circle>`;
    }
    return t;
  },
];

// The cave behind the waterfall: rock all round, stalactites dripping,
// crystals glowing on the walls, glowworms twinkling on the roof, bats
// asleep upside down and an old chest; and at its mouth the falls seen
// from behind, as wide and as misty as the waterfall's own sliders make
// them, the light coming through: a doorway back out.
function caveScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, grad, all, o } = c;
  const fw = (o.fallWidth ?? 100) / 100, mist = (o.mist ?? 60) / 100, rate = fallRateOf(o), time = fallTimeOf(o);
  const floor = g - 50 * k, mt = y0 + H * 0.1, mh = W * 0.24, cw = Math.min(mh, 70 * fw * k);
  const mouth = `M${P(-mh, floor)} L${P(-mh * 0.96, mt + 90 * k)} Q${P(-mh * 0.75, mt)} ${P(0, mt - 8 * k)} Q${P(mh * 0.75, mt)} ${P(mh * 0.96, mt + 90 * k)} L${P(mh, floor)} Z`;
  let s = SEP + part("cave-rock", c.F, () => {
    let t = all("#2a2630");
    for (let i = 0; i < 60; i++) {
      const x = x0 + W * R(i, 380), y = y0 + H * R(i, 381), r = (20 + 50 * R(i, 382)) * k;
      t += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.6)}" fill="${R(i, 383) < 0.5 ? "#35303c" : "#221e27"}" opacity="0.8"/>`;
    }
    return t;
  });
  // the mouth: the light outside, the jungle blurred beyond, the curtain
  // of water falling across it, mist at its foot
  s += SEP + part("cave-mouth", [c.F, fw, mist, rate, time, PERF.blur], () => {
    // (the light outside, by the falls' time of day)
    const sky = { day: ["#effcff", "#a9dcc6"], sunset: ["#ffe0b0", "#e8946a"], night: ["#4a5c88", "#1c2742"] }[time];
    let t = `<defs><clipPath id="bg-cave-mouth"><path d="${mouth}"/></clipPath>${grad("bg-cave-light", sky[0], sky[1], mt, floor)}` +
            `<linearGradient id="bg-cave-water" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9ad7f0"/><stop offset="0.5" stop-color="#e6f8ff"/><stop offset="1" stop-color="#9ad7f0"/></linearGradient>` +
            (PERF.blur ? `<filter id="bg-cave-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f1(10 * k)}"/></filter>` : "") + `</defs>` +
            `<g class="portal" data-to="waterfall"><g clip-path="url(#bg-cave-mouth)">` +
            `<rect x="${f1(-mh)}" y="${f1(mt - 20 * k)}" width="${f1(2 * mh)}" height="${f1(floor - mt + 20 * k)}" fill="url(#bg-cave-light)"/>` +
            // (ticket 155: with blurs off, the leaves outside are fainter, and sharp)
            (PERF.blur ? `<g filter="url(#bg-cave-blur)" opacity="0.6">` : `<g opacity="0.35">`) + [...Array(8)].map((_, i) => `<circle cx="${f1((R(i, 384) - 0.5) * 2 * mh)}" cy="${f1(mt + (floor - mt) * (0.2 + 0.6 * R(i, 385)))}" r="${f1((30 + 30 * R(i, 386)) * k)}" fill="${i % 2 ? "#3f8050" : "#5f9a6a"}"/>`).join("") + `</g>` +
            `<rect x="${f1(-mh)}" y="${f1(floor - 30 * k)}" width="${f1(2 * mh)}" height="${f1(30 * k)}" fill="#62b6e4" opacity="0.7"/>` +
            `<path d="M${P(-cw, mt - 20 * k)} L${P(cw, mt - 20 * k)} L${P(cw * 1.15, floor)} L${P(-cw * 1.15, floor)} Z" fill="url(#bg-cave-water)" opacity="0.85"/>`;
    const n = Math.max(4, Math.round(10 * fw));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, xa = -cw + 2 * cw * u, xb = -cw * 1.15 + 2.3 * cw * u, dash = (30 + 30 * R(i, 387)) * k, gap = (20 + 20 * R(i, 388)) * k;
      t += `<line x1="${f1(xa)}" y1="${f1(mt - 20 * k)}" x2="${f1(xb)}" y2="${f1(floor)}" stroke="#ffffff" stroke-width="${f1((2 + 3 * R(i, 389)) * k)}" stroke-dasharray="${f1(dash)} ${f1(gap)}" opacity="0.75">` +
           `<animate attributeName="stroke-dashoffset" values="0;${f1(-(dash + gap) * 2)}" dur="${((0.6 + 0.4 * R(i, 390)) / rate).toFixed(2)}s" repeatCount="indefinite"/></line>`;
    }
    // (ticket 155: with blurs off, each puff a radial gradient, as the waterfall's mist)
    if (mist > 0) t += (PERF.blur ? `<g filter="url(#bg-cave-blur)">` : `<defs><radialGradient id="bg-cave-mist-soft"><stop offset="0.35" stop-color="#ffffff"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><g>`) + [...Array(Math.round(2 + 5 * mist))].map((_, i) => {
      const x = (R(i, 391) - 0.5) * 2 * mh, y = floor - (10 + 30 * R(i, 392)) * k, r = (30 + 30 * R(i, 393)) * k;
      return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.5)}" fill="${PERF.blur ? "#ffffff" : "url(#bg-cave-mist-soft)"}" opacity="${(0.25 + 0.4 * mist).toFixed(2)}">` +
             `<animate attributeName="cy" values="${f1(y)};${f1(y - 20 * k)};${f1(y)}" dur="${(4 + 3 * R(i, 394)).toFixed(1)}s" repeatCount="indefinite"/></ellipse>`;
    }).join("") + `</g>`;
    // (outside, the falls' time of day: its tint over all of it, the moon behind the water at night)
    if (time !== "day") t += (time === "night" ? `<circle cx="${f1(-mh * 0.45)}" cy="${f1(mt + 50 * k)}" r="${f1(18 * k)}" fill="#fff6d6"/>` : "") +
      `<rect x="${f1(-mh)}" y="${f1(mt - 20 * k)}" width="${f1(2 * mh)}" height="${f1(floor - mt + 20 * k)}" fill="${FALL_TINT[time][0]}" opacity="${FALL_TINT[time][1]}" pointer-events="none"/>`;
    return t + `</g><path d="${mouth}" fill="none" stroke="#1a171f" stroke-width="${f1(8 * k)}" stroke-linejoin="round"/></g>`;
  });
  // (the walls' gems and crystals are drawn before the floor and what
  // stands on it, as the back wall they are on: ticket 99)
  // gems all over the walls (not across the mouth, or on the floor), each
  // with its sparkle, drawn as the night sky's stars are and set the same
  // way (gemShape, gemSize, gemBright, gemTwinkle); and sparkles on the crystals
  const so = { starShape: o.gemShape, starSize: o.gemSize, starBright: o.gemBright, starTwinkle: o.gemTwinkle, lfoFast: o.lfoFast }, gems = Math.max(0, Math.round(o.caveGems ?? 16));
  s += SEP + part("cave-gems", [c.F, gems, o.gemShape, o.gemSize, o.gemBright, o.gemTwinkle, sceneLfoKey(o, "fast")], () => {
    let t = "", i = 0;
    for (let j = 0; i < gems && j < gems * 12; j++) {
      const x = x0 + W * (0.03 + 0.94 * R(j, 1210)), y = y0 + H * 0.05 + (floor - y0 - H * 0.12) * R(j, 1211);
      if (Math.abs(x) < mh * 1.08 && y > mt - 30 * k) continue;
      const col = ["#b388ff", "#5ee6ff", "#7dfcd2", "#ffd36e", "#ff8fb1"][j % 5], z = (0.5 + 0.6 * R(j, 1212)) * k, a = f1((R(j, 1213) - 0.5) * 70);
      t += `<polygon points="-5,0 -5,-12 0,-18 5,-12 5,0" fill="${col}" stroke="${mix(col, "#ffffff", 0.5)}" stroke-width="1.2" transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${z.toFixed(3)})"/>` +
           starsSvg(so, 1, x, x, y - 12 * z, y - 12 * z, k, (n, seed) => R(j, seed), 1220);
      i++;
    }
    return t + [[-0.4, 0.5], [0.37, 0.42], [-0.3, 0.2]].map(([u, v], j) => starsSvg(so, 4, W * u - 30 * k, W * u + 30 * k, y0 + H * v - 10 * k, y0 + H * v + 30 * k, k, (n, seed) => R(n + 10 * j, seed), 1240)).join("");
  });
  // crystals glowing on the walls, either side
  s += SEP + part("cave-crystals", [c.F, sceneLfoKey(o, "slow")], () => [[-0.4, 0.5, "#b388ff"], [0.37, 0.42, "#5ee6ff"], [-0.3, 0.2, "#5ee6ff"]].map(([u, v, col], j) => {
    const cx = W * u, cy = y0 + H * v;
    return `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(50 * k)}" ry="${f1(40 * k)}" fill="${col}" opacity="0.25">${lfoTimed(o, "slow", j / 3, `<animate attributeName="opacity" values="0.15;0.4;0.15" dur="${3 + j}s" repeatCount="indefinite"/>`)}</ellipse>` +
      [[-16, 0, 40, -20], [0, 4, 56, 0], [16, 2, 36, 22], [-6, 8, 28, -40], [10, 8, 26, 40]].map(([dx, dy, h, a]) =>
        `<polygon points="-6,0 -6,${-h + 8} 0,${-h} 6,${-h + 8} 6,0" fill="${col}" stroke="${mix(col, "#ffffff", 0.5)}" stroke-width="1.5" ` +
        `transform="translate(${f1(cx + dx * k)} ${f1(cy + 30 * k + dy * k)}) rotate(${a}) scale(${k.toFixed(3)})"/>`).join("");
  }).join(""));
  // the light falling in through the water, the floor, wet by the mouth
  s += SEP + part("cave-floor", c.F, () => {
    let t = `<path d="M${P(x0 - pad, floor + 10 * k)} Q${P(-W * 0.3, floor - 6 * k)} ${P(-mh, floor)} L${P(mh, floor)} Q${P(W * 0.3, floor - 6 * k)} ${P(x1 + pad, floor + 10 * k)} L${P(x1 + pad, y1 + pad)} L${P(x0 - pad, y1 + pad)} Z" fill="#3b3542"/>` +
            `<ellipse cx="0" cy="${f1(floor + 26 * k)}" rx="${f1(mh * 1.3)}" ry="${f1(22 * k)}" fill="#7fa3bd" opacity="0.25"/>`;
    for (let i = 0; i < 3; i++)
      t += `<polygon points="${P2(-cw * (0.8 - 0.6 * i), mt + 120 * k)} ${P2(-cw * (0.5 - 0.6 * i), mt + 120 * k)} ${P2(-W * (0.18 - 0.2 * i), y1 + pad)} ${P2(-W * (0.3 - 0.2 * i), y1 + pad)}" fill="#d8f4ff" opacity="0.08" pointer-events="none"/>`;
    for (let i = 0; i < 24; i++) {
      const x = x0 + W * R(i, 395), y = floor + 20 * k + (y1 - floor) * R(i, 396), r = (4 + 10 * R(i, 397)) * k;
      t += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.55)}" fill="${["#4a4452", "#2e2934", "#57505f"][i % 3]}"/>`;
    }
    // stalagmites at the sides, each an object standing at its foot
    for (const [u, h, w, name] of [[-0.44, 90, 30, "big stalagmite, left"], [-0.36, 50, 20, "small stalagmite, left"], [0.4, 110, 34, "big stalagmite, right"], [0.47, 60, 22, "small stalagmite, right"]]) {
      const x = W * u, b = floor + 30 * k;
      t += obj(name, b, `<path d="M${P(x - w * k, b)} Q${P(x - w * 0.3 * k, b - h * 0.6 * k)} ${P(x, b - h * k)} Q${P(x + w * 0.3 * k, b - h * 0.6 * k)} ${P(x + w * k, b)} Z" fill="#4a4352" stroke="#2a2630" stroke-width="${f1(2 * k)}"/>`);
    }
    return t;
  });
  // the roof: stalactites, a drop falling now and then, glowworms (one
  // object, "stalactites", the glowworms' light in it: they hang over the
  // stalagmites, which grow where their drops land, so they take the
  // stalagmites' depth)
  s += SEP + part("cave-roof", c.F, () => {
    let st = "";
    for (let i = 0; i < 16; i++) {
      const x = x0 + W * (i + 0.2 + 0.6 * R(i, 398)) / 16, len = (30 + 90 * R(i, 399)) * k, w = (10 + 16 * R(i, 400)) * k;
      if (Math.abs(x) < mh * 0.8) continue;
      st += `<path d="M${P(x - w, y0 - 20 * k)} L${P(x + w, y0 - 20 * k)} Q${P(x + w * 0.3, y0 + len * 0.6)} ${P(x, y0 + len)} Q${P(x - w * 0.3, y0 + len * 0.6)} ${P(x - w, y0 - 20 * k)} Z" fill="#4a4352"/>` +
           `<path d="M${P(x - w * 0.5, y0)} Q${P(x - w * 0.2, y0 + len * 0.6)} ${P(x, y0 + len)}" fill="none" stroke="#6a6274" stroke-width="${f1(2 * k)}"/>`;
      if (i % 5 === 1) st += `<circle cx="${f1(x)}" cy="${f1(y0 + len)}" r="${f1(2.5 * k)}" fill="#9ad7f0"><animate attributeName="cy" values="${f1(y0 + len)};${f1(floor + 20 * k)}" dur="1.2s" begin="${(i * 0.7).toFixed(1)}s" repeatCount="indefinite"/>` +
                            `<animate attributeName="opacity" values="1;1;0" dur="1.2s" begin="${(i * 0.7).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
    }
    for (let i = 0; i < 40; i++) {
      const x = x0 + W * R(i, 401), y = y0 + H * 0.28 * R(i, 402);
      if (Math.abs(x) < mh && y > mt) continue;
      st += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.6 * k)}" fill="#7dfcd2"${i % 3 ? "" : `><animate attributeName="opacity" values="1;0.2;1" dur="${(1.5 + 2 * R(i, 403)).toFixed(1)}s" repeatCount="indefinite"/></circle`}${i % 3 ? "/>" : ">"}`;
    }
    return obj("stalactites", floor + 30 * k, st);
  });
  // bats asleep, hanging from the roof; an old chest by the wall (two
  // objects: the bats among the stalactites, at their depth; the chest
  // standing on the floor)
  s += SEP + part("cave-bats-chest", c.F, () => obj("bats", floor + 30 * k, [[-0.3, 26], [-0.22, 12], [0.32, 18]].map(([u, dy], i) => {
    const bx = W * u, by = y0 + dy * k;
    return `<g transform="translate(${f1(bx)} ${f1(by)}) scale(${k.toFixed(3)})"><g><animateTransform attributeName="transform" type="rotate" values="-6;6;-6" dur="${4 + i}s" repeatCount="indefinite"/>` +
      `<line x1="0" y1="0" x2="0" y2="8" stroke="#111" stroke-width="2"/><path d="M0 6 Q-14 12 -10 34 Q0 44 10 34 Q14 12 0 6 Z" fill="#1a1620"/>` +
      `<path d="M-6 40 L-9 50 L-2 43 Z M6 40 L9 50 L2 43 Z" fill="#1a1620"/><circle cx="-3" cy="38" r="1.5" fill="#ffffff"/><circle cx="3" cy="38" r="1.5" fill="#ffffff"/></g></g>`;
  }).join("")) + obj("chest", floor + 50 * k, `<g transform="translate(${f1(W * 0.3)} ${f1(floor + 50 * k)}) scale(${k.toFixed(3)})"><rect x="-46" y="-40" width="92" height="50" rx="4" fill="#8b5a2b" stroke="#4a2e1a" stroke-width="3"/>` +
    `<path d="M-46 -40 Q0 -76 46 -40 Z" fill="#a0693a" stroke="#4a2e1a" stroke-width="3"/><rect x="-50" y="-20" width="100" height="8" fill="#f2c12e"/><rect x="-8" y="-28" width="16" height="20" rx="3" fill="#f2c12e" stroke="#a07a10" stroke-width="2"/>` +
    [[-60, 12], [-50, 18], [54, 14], [62, 8]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="#f2c12e" stroke="#a07a10" stroke-width="1.5"/>`).join("") + `</g>`));
  return s;
}

// The path through the woods, from the clearing to the mountain trail:
// tall trunks either side, ferns and mushrooms at their feet, sunbeams,
// the path winding off ahead; a signpost back to the clearing and on to
// the trail.
// (ticket 50) the two big mushrooms, the outer ones (the inner two are too
// small to sit on): each one's cap, its crown 34 of its units up (its
// curve, bowed toward 48, peaks there), within 12 each side of the crown,
// as woodpathScene's "wp-near" draws them
SEATS.woodpath = (c, B) => { const { W, g, k } = c;
  return [[-0.38, 70, 1.1, "mushroom, left outer"], [0.4, 60, 1, "mushroom, right outer"]].map(([u, dy, z, name]) => { const mx = W * u, my = g + dy * k, kk = k * z;
    return { name, x0: mx - 12 * kk, x1: mx + 12 * kk, y: my - 34 * kk, z: my + 1, facing: ["front", "left", "right"] }; }); };
function woodpathScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, grad, all, land, o, side } = c;
  const far = g - 170 * k;
  let s = SEP + part("wp-back", c.F, () => {
    let t = `<defs>${grad("bg-sky", "#d6efc2", "#f4f8dc", y0, far)}</defs>` + all("url(#bg-sky)"), trees = "";
    // far trunks, thin and pale, their crowns a green roof (one object,
    // "far trees", trunks and roof: standing at the top of the far ground's
    // wave, so the ground drawn after them never covers a friend behind them)
    for (let i = 0; i < 26; i++) {
      const x = x0 + W * (i + R(i, 404)) / 26, w = (6 + 6 * R(i, 405)) * k;
      trees += `<rect x="${f1(x - w / 2)}" y="${f1(y0 - pad)}" width="${f1(w)}" height="${f1(far + 10 * k - y0 + pad)}" fill="#8a7a62" opacity="0.7"/>`;
    }
    // (a roof of leaf pads, overlapping, a band of green behind them)
    trees += `<rect x="${f1(x0 - pad)}" y="${f1(y0 - pad)}" width="${f1(W + 2 * pad)}" height="${f1(pad + H * 0.06)}" fill="#4f8f5a"/>`;
    for (let i = 0; i < 30; i++) {
      const x = x0 - 30 * k + (W + 60 * k) * i / 29, y = y0 + H * (0.04 + 0.1 * R(i, 406)), z = (50 + 40 * R(i, 407)) * k / 80;
      trees += padSvg(Math.floor(R(i, 408) * 8), x, y, z * (R(i, 409) < 0.5 ? -1 : 1), z * 1.2, ["#5c9c63", "#4f8f5a", "#6aa86a"][i % 3]);
    }
    return t + obj("far trees", far - 6 * k, trees) + land(far, 6, "#86a95a", 0.7) + land(g - 80 * k, 8, "#6f9a48", 1.9);
  });
  // the sunbeams, slanting down through the leaves (an object, at the far
  // trees' depth, whose roof they come down through: behind the near trees
  // and a friend in front of the far ones, over a friend behind those)
  s += SEP + part("wp-beams", [c.F, sceneLfoKey(o, "slow")], () => obj("sunbeams", far - 6 * k, sunbeamsSvg("bg-wp-shaft", x0, W, k, y0 - 20 * k, g + 40 * k, 5, 88, -0.3, o)));
  // the path, winding off ahead, narrowing as it goes
  s += SEP + part("wp-path", c.F, () => {
    const L = [], Rr = [];
    for (let i = 0; i <= 20; i++) {
      const u = i / 20, y = y1 + 20 * k - (y1 + 20 * k - far) * u, x = W * 0.08 * Math.sin(u * 4.2) * u + W * 0.06 * u, w = (170 - 156 * u) * k;
      L.push(P2(x - w / 2, y)); Rr.push(P2(x + w / 2, y));
    }
    let t = `<polygon points="${[...L, ...Rr.reverse()].join(" ")}" fill="#c9a774" stroke="#a88a5a" stroke-width="${f1(2 * k)}"/>`;
    for (let i = 0; i < 18; i++) {
      const u = R(i, 408), y = y1 - (y1 - far) * u, x = W * 0.08 * Math.sin(u * 4.2) * u + W * 0.06 * u + (R(i, 409) - 0.5) * (150 - 140 * u) * k;
      t += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1((5 - 3 * u) * k)}" ry="${f1((3 - 2 * u) * k)}" fill="#a88a5a"/>`;
    }
    return t;
  });
  // near trunks either side, ferns and mushrooms at their feet (each tree,
  // its ferns with it, an object at its foot; each mushroom one too)
  s += SEP + part("wp-near", c.F, () => {
    let t = "";
    for (const [u, w, b, name] of [[-0.46, 64, 70, "tree, left outer"], [-0.3, 40, 20, "tree, left inner"], [0.33, 44, 30, "tree, right inner"], [0.47, 70, 80, "tree, right outer"]]) {
      const x = W * u, base = g + b * k;
      let tr = `<path d="M${P(x - w * k / 2, y0 - pad)} L${P(x + w * k / 2, y0 - pad)} L${P(x + w * k / 2, base - 20 * k)} Q${P(x + w * k, base)} ${P(x + w * k * 0.9, base + 6 * k)} L${P(x - w * k * 0.9, base + 6 * k)} Q${P(x - w * k, base)} ${P(x - w * k / 2, base - 20 * k)} Z" fill="#5e4430" stroke="#3e2c1e" stroke-width="${f1(2 * k)}"/>`;
      for (let j = 0; j < 5; j++) {
        const bx = x + (R(j + u * 10, 410) - 0.5) * w * k * 0.7;
        tr += `<path d="M${P(bx, y0 + H * 0.1 * j)} q${f1(4 * k)} ${f1(40 * k)} 0 ${f1(90 * k)}" fill="none" stroke="#3e2c1e" stroke-width="${f1(2 * k)}" opacity="0.6"/>`;
      }
      // ferns, a fan of fronds
      for (const sd of [-1, 1]) for (let j = 0; j < 4; j++) {
        const a = (sd < 0 ? 200 : -20) + sd * j * 22, l = (40 + 16 * j) * k, fx = x + sd * w * k * 0.7, fy = base + 4 * k;
        const ex = fx + Math.cos(a * Math.PI / 180) * l * sd * -1 * -1, ey = fy - Math.abs(Math.sin(a * Math.PI / 180)) * l - 10 * k;
        tr += `<path d="M${P(fx, fy)} Q${P((fx + ex) / 2, ey - 10 * k)} ${P(ex, ey)}" fill="none" stroke="#3f8a3a" stroke-width="${f1(5 * k)}" stroke-linecap="round"/>`;
      }
      t += obj(name, base, tr);
    }
    // mushrooms, red with white spots
    for (const [u, dy, z, name] of [[-0.38, 70, 1.1, "mushroom, left outer"], [-0.25, 40, 0.8, "mushroom, left inner"], [0.4, 60, 1, "mushroom, right outer"], [0.27, 36, 0.7, "mushroom, right inner"]]) {
      const mx = W * u, my = g + dy * k, kk = k * z;
      t += obj(name, my, `<rect x="${f1(mx - 5 * kk)}" y="${f1(my - 22 * kk)}" width="${f1(10 * kk)}" height="${f1(22 * kk)}" rx="${f1(3 * kk)}" fill="#f4efe6"/>` +
           `<path d="M${P(mx - 22 * kk, my - 20 * kk)} Q${P(mx, my - 48 * kk)} ${P(mx + 22 * kk, my - 20 * kk)} Z" fill="#e53935"/>` +
           [[-9, -28], [4, -34], [12, -25]].map(([dx, dyy]) => `<circle cx="${f1(mx + dx * kk)}" cy="${f1(my + dyy * kk)}" r="${f1(3 * kk)}" fill="#ffffff"/>`).join(""));
    }
    return t;
  });
  // the signpost: back to the clearing, on to the trail (an object, its
  // arrows' doorways in it)
  s += SEP + part("wp-sign", c.F, () => obj("signpost", g + 50 * k, signpost(W * 0.2, g + 50 * k, k, [["🌲 clearing", "clearing", 1], ["⛰️ trail", "mountains", 1]])));
  // butterflies, fluttering with the quick LFO (an object at the depth of
  // the ground under the nearer one)
  s += SEP + part("woodpath-butterflies", [c.F, sceneLfoKey(o, "fast"), sceneLfoKey(o, "wings")], () => obj("butterflies", g - 50 * k, butterfliesSvg(c, [[x0 + W * 0.18, g - 50 * k, 1], [x0 + W * 0.8, g - 90 * k, 1.1]])));
  return s;
}
// Our imagination: a room of endless white, the empty white of a film's
// training world, the floor only a soft grey toward us; and on its far
// wall a big map of every place there is, each a framed picture of it to
// go through, a column to each kind of place (PLACE_GROUPS) with its name,
// the places down it joined like stations on a line by a dotted path. A
// picture of this room holds no pictures (they would go on forever).
// (ticket 99) The map and its pictures are on the wall, the rest is floor
// and glow. (ticket 145) Its only objects are the ladders, one at each
// column's right, floating a little off the floor at the wall's foot and
// bobbing slowly, to climb to the pictures up the column; its back wall is
// solid (SCENE_BACK), so the ladders are the way up.
const imaginationWall = (g, k) => g - 60 * k;
// (ticket 153, Matthew) The empty room: the imagination's room with nothing
// in it, its back wall only a line where it meets the floor, so the
// controls and the actions can be tried on an old, slow computer (the
// black laptop) with nothing in the picture moving but the friend. No
// objects, no animation, no music of its own; its back wall is solid, as
// the imagination's is.
function emptyroomScene(c) {
  const { x0, y1, g, W, k, pad, all } = c, wall = imaginationWall(g, k);
  return SEP + part("emptyroom", c.F, () => all("#ffffff") +
    `<rect x="${f1(x0 - pad)}" y="${f1(wall)}" width="${f1(W + 2 * pad)}" height="${f1(y1 - wall + pad)}" fill="#f1f3f7"/>` +
    `<line x1="${f1(x0 - pad)}" y1="${f1(wall)}" x2="${f1(x0 + W + pad)}" y2="${f1(wall)}" stroke="#c3c9d4" stroke-width="${f1(2 * k)}"/>`);
}
function imaginationScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, all, o } = c;
  let s = SEP + part("imagination-room", c.F, () => {
    let t = `<defs><linearGradient id="bg-imag-floor" x1="0" y1="${f1(g - 60 * k)}" x2="0" y2="${f1(y1)}" gradientUnits="userSpaceOnUse">` +
            `<stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e4e7ee"/></linearGradient>` +
            `<radialGradient id="bg-imag-glow"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f3f5f9"/></radialGradient></defs>` + all("url(#bg-imag-glow)");
    t += `<rect x="${f1(x0 - pad)}" y="${f1(g - 60 * k)}" width="${f1(W + 2 * pad)}" height="${f1(y1 - g + 60 * k + pad)}" fill="url(#bg-imag-floor)"/>` +
         `<ellipse cx="0" cy="${f1(g + 8 * k)}" rx="${f1(W * 0.16)}" ry="${f1(14 * k)}" fill="#c9ced8" opacity="0.5"/>`;
    return t;
  });
  const groups = PLACE_GROUPS.filter(([gid]) => gid !== "imagination"), cols = groups.length, rows = Math.max(...groups.map(([, , kinds]) => kinds.length));
  const mx = W * 0.03, top = y0 + H * 0.05, bottom = g - 70 * k, cw = (W - 2 * mx) / cols, rh = (bottom - top - 26 * k) / rows;
  const fw = Math.min(cw * 0.78, rh * 0.86 / 0.74 * 0.8), depth = (o.depth ?? 0) + 1;
  // a warm glow behind the map, breathing with the slow LFO
  s += SEP + part("imagination-glow", [c.F, sceneLfoKey(o, "slow")], () => `<ellipse cx="0" cy="${f1((top + bottom) / 2)}" rx="${f1(W * 0.62)}" ry="${f1((bottom - top) * 0.75)}" fill="#fff3c4" opacity="0.25">` +
    sceneLfo(o, "slow", 0, "opacity", (v, amp) => (0.25 * (1 + (0.3 + 0.6 * amp) * v)).toFixed(3)) + `</ellipse>`);
  s += SEP + part("imagination-map", [c.F, cols, rows, sceneLfoKey(o, "fast")], () =>
    `<rect x="${f1(x0 + mx * 0.5)}" y="${f1(top - 6 * k)}" width="${f1(W - mx)}" height="${f1(bottom - top + 12 * k)}" rx="${f1(10 * k)}" fill="#ffffff" stroke="#d5dae3" stroke-width="${f1(2 * k)}"/>` +
    groups.map(([, name, kinds], i) => {
      const cx = x0 + mx + cw * (i + 0.5), ys = kinds.map((_, j) => top + 26 * k + rh * (j + 0.5));
      return `<text x="${f1(cx)}" y="${f1(top + 14 * k)}" text-anchor="middle" font-size="${f1(13 * k)}" font-weight="bold" fill="#5a6270" font-family="sans-serif">${name}</text>` +
        (ys.length > 1 ? `<line x1="${f1(cx)}" y1="${f1(ys[0])}" x2="${f1(cx)}" y2="${f1(ys[ys.length - 1])}" stroke="#b9c0cc" stroke-width="${f1(3 * k)}" stroke-dasharray="${f1(2 * k)} ${f1(6 * k)}" stroke-linecap="round">` +
          sceneLfo(o, "fast", i / cols, "stroke-dashoffset", (v, amp) => f1((2 + 5 * amp) * k * v)) + `</line>` : "");
    }).join(""));
  // the pictures, each a way there (in a picture of this room, only their frames)
  s += SEP + groups.map(([, , kinds], i) => kinds.map((kd, j) => {
    const cx = x0 + mx + cw * (i + 0.5), cy = top + 26 * k + rh * (j + 0.5), name = (PLACES.find(([v]) => v === kd) || [kd, kd])[1];
    return (depth > 2 ? `<g class="portal" data-to="${kd}"><rect x="${f1(cx - fw / 2)}" y="${f1(cy - fw * 0.37)}" width="${f1(fw)}" height="${f1(fw * 0.74)}" fill="#e8ebf0" stroke="#b8862f" stroke-width="${f1(3 * k)}"/></g>`
                      : framedSvg(kd, 45, o, depth, cx, cy - 6 * k, fw, !PERF.livePictures)) +
      `<text x="${f1(cx)}" y="${f1(cy + fw * 0.37 + 4 * k)}" text-anchor="middle" font-size="${f1(9 * k)}" fill="#5a6270" font-family="sans-serif">${name}</text>`;
  }).join("")).join(SEP);
  // (ticket 145) the ladders: from just off the floor at the wall's foot up
  // to just under the column's name, in the gap at each column's right,
  // climbed till the hands are at its top (data-top), so the top row is in
  // reach; each bobs a
  // few units, slowly, at a pace and a phase of its own; its shadow on the
  // floor under it stays put
  const wall = imaginationWall(g, k), ltop = top + 22 * k, lw = Math.min((cw - fw) * 0.36, 13 * k), foot = wall - 5 * k;
  s += SEP + part("imagination-ladders", [c.F, cols, rows], () => groups.map((_, i) => {
    const lx = x0 + mx + cw * (i + 1);
    let t = "";
    for (let y = foot - 14 * k; y > ltop + 4 * k; y -= 20 * k)
      t += `<line x1="${f1(lx - lw)}" y1="${f1(y)}" x2="${f1(lx + lw)}" y2="${f1(y)}" stroke="#e3c37f" stroke-width="${f1(2.8 * k)}" stroke-linecap="round"/>`;
    t += [-1, 1].map(e => `<line x1="${f1(lx + e * lw)}" y1="${f1(ltop)}" x2="${f1(lx + e * lw)}" y2="${f1(foot)}" stroke="#c9a15a" stroke-width="${f1(3.4 * k)}" stroke-linecap="round"/>`).join("");
    return obj(`ladder ${i + 1}`, wall, `<ellipse cx="${f1(lx)}" cy="${f1(wall)}" rx="${f1(lw * 1.7)}" ry="${f1(3 * k)}" fill="#c9ced8" opacity="0.45"/>` +
      `<g data-ladder="1" data-top="hands"><animateTransform attributeName="transform" type="translate" values="0 0;0 ${f1(-3.5 * k)};0 0" dur="${(5.5 + 0.7 * (i % 3)).toFixed(1)}s" begin="${(-1.7 * i).toFixed(1)}s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>${t}</g>`);
  }).join(""));
  return s;
}
// (ticket 185, Matthew, 2026-10-17) The forest crossing: a blank place for
// the world designer, a forest floor (olive green unless chosen) where up to
// eight brown paths meet: N (ahead, into the far woods), NE and NW (ahead
// and to the side), E and W (off the sides), S (toward us), SE and SW
// (toward us and to the side). Each crossing says which it has (crossN ...
// crossNW); a grid cell will say it for each crossing laid in it. Its things
// (things, which every place has since 0.0.100: rocks, bushes, trees and pines) stand where they were put,
// each sized for its depth as the friend is, and drag as one piece. Each
// thing is its own instance, { kind, x, z, seed, size, mirror }: what it is,
// where its feet are, and its own parameters, which its drawing takes (so
// two of a kind look different), all of them options the nature drawings
// already took (Matthew, 2026-10-17: expose them, change no drawing): for
// every kind, mirror (left for right, about its feet) and 🎲 another shape
// (a new seed: a tree's branches grow another way); a rock's colour (tone);
// a tree's height (h) and leaves (greens); a pine's tiers; a bush's
// flowers. THING_PARAMS lists them per kind ("all" for every kind), for the
// controls: a toggle, colours, a few choices, or an action.
const CROSS_DIRS = [["N", "⬆️ ahead"], ["NE", "↗️ ahead, right"], ["E", "➡️ right"], ["SE", "↘️ toward us, right"],
                    ["S", "⬇️ toward us"], ["SW", "↙️ toward us, left"], ["W", "⬅️ left"], ["NW", "↖️ ahead, left"]];
const CROSS_PATH = "#8a5528", CROSS_PATH_EDGE = "#5f3a1a";
const CROSS_FLOORS = ["#76843a", "#5f7a3a", "#8a9a4a", "#6b6b3a", "#4f6b3a", "#9a8a5a"];
const PINE_GREEN = "#2f6e3a";   // (the lake's and the crossing's pines)
const TOADSTOOL_CAPS = ["#d62828", "#f59e0b", "#7c3aed", "#2563eb", "#16a34a"];
const xmlEsc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const xmlText = s => xmlEsc(String(s).slice(0, 12));
// (Matthew, 2026-10-17: slowly away from the places' own signs, toward the
// arrows; but M likes signs) A post with a board for each way chosen, each
// with the name of the square it leads to. A board can't turn to face its
// way, so where it is nailed says it: ways away from us (NW, NE) high up,
// across (W, E) in the middle, toward us (SW, SE) low down, each on its
// side of the post and pointing out, the diagonals tipped up (away) or down
// (toward us); N on top of the post, S across its foot; and each says its
// arrow. Eight fit without crowding: three a side, one above, one below,
// and a long name is squeezed onto its board rather than widening it.
const SIGN_AT = { N: [0, -268], NW: [-1, -218], NE: [1, -218], W: [-1, -174], E: [1, -174], SW: [-1, -130], SE: [1, -130], S: [0, -76] };
const SIGN_TILT = { NE: -9, NW: 9, SE: 9, SW: -9, E: 0, W: 0 };
function signpostSvg(boards) {
  let s = `<ellipse cx="0" cy="2" rx="34" ry="7" fill="#000000" opacity="0.18"/><rect x="-7" y="-256" width="14" height="256" rx="2" fill="#6e4a2c" stroke="#4a2e1a" stroke-width="1.5"/>`;
  for (const [d, label] of boards) {
    const [side, y] = SIGN_AT[d], words = `${WORLD_ARROWS[d]} ${label}`, n = [...words].length, want = n * 7.6 + 20, w = Math.min(156, Math.max(64, want)), h = 28;
    const text = (x, anchor) => `<text x="${f1(x)}" y="${f1(y + 5)}" text-anchor="${anchor}" font-size="14" font-weight="bold" fill="#fff8e7" font-family="sans-serif"` +
      (want > w ? ` textLength="${f1(w - 20)}" lengthAdjust="spacingAndGlyphs"` : "") + `>${xmlEsc(words)}</text>`;
    if (!side) { s += `<rect x="${f1(-w / 2)}" y="${f1(y - h / 2)}" width="${f1(w)}" height="${h}" rx="5" fill="#a0703f" stroke="#5e3d22" stroke-width="2.5"/>` + text(0, "middle") +
                      `<circle cx="0" cy="${f1(y)}" r="2" fill="#3a2a1a" opacity="0.6"/>`; continue; }
    const x0 = side * 5, x1 = side * (5 + w), tip = side * (5 + w + 14);
    s += `<g transform="rotate(${SIGN_TILT[d]} 0 ${y})"><polygon points="${f1(x0)},${f1(y - h / 2)} ${f1(x1)},${f1(y - h / 2)} ${f1(tip)},${y} ${f1(x1)},${f1(y + h / 2)} ${f1(x0)},${f1(y + h / 2)}" fill="#a0703f" stroke="#5e3d22" stroke-width="2.5" stroke-linejoin="round"/>` +
         text((x0 + x1) / 2, "middle") + `<circle cx="${f1(side * 11)}" cy="${y}" r="2" fill="#3a2a1a" opacity="0.6"/></g>`;
  }
  return s;
}
// the ways a sign in this place may point: its square's ways out that meet a way back (none off the grid)
function signWays(o) {
  const W = state.world;
  if (!W || !W.at || !W.cells[W.at] || W.cells[W.at].kind !== o.kind) return [];
  return worldLiveWays(W, W.at).filter(d => worldMeets(W, W.at, d));
}
// its boards: [way, the name of the square it leads to], for the ways chosen (all, until some are)
function signpostBoards(o, t) {
  const W = state.world, ok = signWays(o), names = ok.length ? worldNames(W) : {};
  return Object.keys(WORLD_DIRS).filter(d => ok.includes(d) && (t.dirs ? t.dirs.includes(d) : true)).map(d => [d, names[worldMeets(W, W.at, d)]]);
}
const ROCK_TONES = ["#8f8a80", "#b4afa4", "#6f8a94", "#c2a67a", "#a8634a", "#7f8a6a", "#4f4b48"];
const LEAF_SETS = { summer: null, spring: ["#5f9e3a", "#74b04a", "#8cc45a", "#a3d46e", "#b8e080"], autumn: ["#9a3412", "#c2410c", "#d97706", "#eab308", "#b45309"],
                    blossom: ["#f9a8d4", "#f472b6", "#fbcfe8", "#ec4899", "#fce7f3"] };
const THING_PARAMS = {
  // (Matthew, 2026-10-17: each object rescaled, from a good size: 100% is each kind's own, set in thingSvg)
  all: [["size", "🔎 size", "range", [25, 300, 5]], ["mirror", "↔️ mirror", "toggle"], ["seed", "🎲 another shape", "action", t => Math.floor(1000 + Math.random() * 90000)]],
  rock: [["tone", "🎨", "color", ROCK_TONES]],
  tree: [["h", "📏", "choice", [[280, "short"], [380, "tall"], [480, "taller"]]], ["leaves", "🍂", "choice", [["summer", "summer"], ["spring", "spring"], ["autumn", "autumn"], ["blossom", "🌸 blossom"]]]],
  pine: [["tiers", "🌲 tiers", "choice", [[4, "4"], [5, "5"], [6, "6"], [7, "7"], [8, "8"]]]],
  bush: [["flowers", "🌸", "color", ["none", "#f472b6", "#fde047", "#ffffff", "#a78bfa", "#ef4444"]]],
  toadstool: [["cap", "🍄", "color", TOADSTOOL_CAPS], ["glow", "✨ glowing", "toggle"]],
  potion: [["shape", "🧪", "choice", [["flask", "flask"], ["tall", "tall"], ["jar", "jar"], ["vial", "vial"]]], ["color", "🎨", "color", POTION_COLORS]],
  sign: [["text", "✏️ its words", "text", 12]],
  signpost: [["dirs", "🧭 boards", "dirs"]],
  campfire: [["burning", "🔥 burning", "toggle"]],
  // (ticket 204, Matthew: "let the world designer choose fancy or simple"; ticket 206: simple unless upgraded, one by one)
  cauldron: [["fumes", "💨 fumes", "choice", [["simple", "simple"], ["fancy", "✨ fancy"]]]],
};
const THING_DEFAULTS = { rock: { tone: ROCK_TONES[0] }, tree: { h: 380, leaves: "summer" }, pine: { tiers: 6 }, bush: { flowers: "none" },
                         toadstool: { cap: TOADSTOOL_CAPS[0], glow: false }, potion: { shape: "flask", color: POTION_COLORS[5] }, sign: { text: "hello!" },
                         campfire: { burning: true }, cauldron: { fumes: "simple" } };
const thingParams = kind => [...THING_PARAMS.all, ...(THING_PARAMS[kind] || [])];
// (ticket 185, v3: the object library) The things, in groups, each drawn by
// a drawing the places already have (the fairy forest's toadstools, the
// witch's potions, the deep dungeon's skeleton, the clearing's plank sign
// on a post), none of them changed: a thing is that drawing standing on
// the floor at its own depth, sized as the friend is there. (0.0.113) And
// drawings lifted out of the places for it, each place's markup the same
// as before, which the safety net checks: the camp site's log and campfire,
// the picnic's bench, the castle kitchen's barrel, the witch's cauldron.
const THING_GROUPS = [["nature", "🌲 nature"], ["camp", "🏕️ camp"], ["magic", "🧪 magic"], ["spooky", "💀 spooky"], ["signs", "🪧 signs"]];
const THING_KINDS = { rock: { label: "🪨 rock", size: 1, group: "nature" }, bush: { label: "🌿 bush", size: 1, group: "nature" }, tree: { label: "🌳 tree", size: 1, group: "nature" },
                      pine: { label: "🌲 pine", size: 1, group: "nature" }, toadstool: { label: "🍄 toadstool", size: 1, group: "nature" },
                      log: { label: "🪵 log", size: 1, group: "camp" }, campfire: { label: "🔥 campfire", size: 1, group: "camp", moving: true }, bench: { label: "🪑 bench", size: 1, group: "camp" },
                      barrel: { label: "🛢️ barrel", size: 1, group: "camp" }, cauldron: { label: "🫕 cauldron", size: 1, group: "magic", moving: true },
                      potion: { label: "🧪 potion", size: 1, group: "magic" }, skeleton: { label: "💀 skeleton", size: 1, group: "spooky" }, sign: { label: "🪧 sign", size: 1, group: "signs" },
                      signpost: { label: "🧭 sign with directions", size: 1, group: "signs" } };
// (a thing's drawing, standing at x, its feet at depth z, sized as the friend is there)
// (ticket 206, Matthew, after the Ubuntu laptop: every cauldron's fumes simple, unless its own 💨 fumes
// are upgraded to ✨ fancy, one by one; 0.0.129's "auto" is simple now. Ticket 202's rule, cheap when
// two or more or the computer slow, is gone: a fancy one too many is marked by the guard instead)
const fumesCheap = t => t.fumes !== "fancy";
function thingSvg(o, t, i) {
  const s = depthSize(o, t.z - SCENE.ground) * (t.size ?? 100) / 100, seed = t.seed ?? 900 + i;
  const at = inner => `<g transform="translate(${f1(t.x)} ${f1(t.z)}) scale(${(t.mirror ? -s : s).toFixed(3)} ${s.toFixed(3)})">${inner}</g>`;
  const shadow = r => `<ellipse cx="0" cy="2" rx="${f1(r)}" ry="${f1(r * 0.22)}" fill="#000000" opacity="0.18"/>`;
  const body = t.kind === "rock" ? at(rockSvg(0, 0, 38, seed, t.tone || ROCK_TONES[0])) :
               t.kind === "bush" ? at(bushSvg(0, 0, 70, seed, t.flowers && t.flowers !== "none" ? { flowers: [t.flowers] } : {})) :
               // (a pine's needles are currentColor: the places give theirs a green; with none, it took the page's text colour, white in dark mode: Matthew's laptop)
               t.kind === "pine" ? at(shadow(70) + `<g color="${PINE_GREEN}">${pineTree(seed, { tiers: t.tiers ?? 6 })}</g>`) :
               t.kind === "log" ? at(logSvg(0, -14, 1)) :
               t.kind === "campfire" ? at(campfireHearthSvg(0, 0, 1) + (t.burning ?? true ? `<g pointer-events="none" transform="translate(0 -4)">${campfireFlamesSvg(o, false, "day")}</g>` : "")) :
               t.kind === "bench" ? at(shadow(110) + benchSvg(0, 0, 1)) :
               t.kind === "barrel" ? at(shadow(40) + barrelSvg(0, 0, 2, 0, 0, 1, "#5e3d22")) :
               t.kind === "cauldron" ? at(witchCauldronSvg(0, 0, 1, o, -420, fumesCheap(t))) :
               t.kind === "toadstool" ? at(toadstool(0, 0, 1.3, t.cap || TOADSTOOL_CAPS[0], !!t.glow)) :   // (Matthew: 2.4 was too big)
               t.kind === "potion" ? at(shadow(22) + potionSvg(t.shape || "flask", 0, 0, 2.2, t.color || POTION_COLORS[5])) :
               t.kind === "skeleton" ? at(shadow(60) + skeletonSvg(0, -80 * 2.6, 2.6, "sit")) :
               t.kind === "signpost" ? at(`<g transform="scale(0.85)">${signpostSvg(signpostBoards(o, t))}</g>`) :
               t.kind === "sign" ? at(shadow(30) + `<rect x="-5" y="-150" width="10" height="150" fill="#6e4a2c"/>` + plankSign(0, -120, 1.3, xmlText(t.text ?? "hello!"))) :
               at(shadow(90) + leafyTree(seed, { h: t.h ?? 380, ...(LEAF_SETS[t.leaves] ? { greens: LEAF_SETS[t.leaves] } : {}) }));
  return `<g class="thing" data-drag="thing:${i}" style="cursor: grab">${body}</g>`;
}
// (ticket 185) The things put in a place, any place: each an object at its
// own depth, so the friend goes behind or in front of it; each its own
// piece, cached on what it holds, so dragging one draws only that one
// again. From draw(), after the place's own (cached) drawing.
function thingsLayer(c) {
  // (a sign with directions also on the names of the squares it points to, which change elsewhere)
  return (Array.isArray(c.o.things) ? c.o.things : []).map((t, i) => SEP + part("thing-" + i, [c.F, c.o.kind, JSON.stringify(t), t.kind === "signpost" ? JSON.stringify(signpostBoards(c.o, t)) : ""], () => obj(`${t.kind} ${i + 1}`, t.z, thingSvg(c.o, t, i)))).join("");
}
// (Matthew, 2026-10-17) The crossing's geometry, shared with its ways out in
// the world (worldWaysSvg): its floor reaches far up the picture (far), the
// paths meet a little below its middle (cy), and each path ends where it
// leaves (ends), N and its two neighbours at the far line.
// (ticket 218, Matthew: "align the nav arrow for SW with the trail being draw, favoring the placement of the nav
// arrow and moving the trail SW (and mirrored in the SE direction)") The SW and SE trails go from the meeting place
// through their arrows' spots (worldWaysSvg's AT: the picture's bottom corners), on past its bottom edge, so each
// ends under its arrow; they used to aim at the sides, and on a wide picture left them well above the arrows.
function crossGeom({ x0, x1, y1, g, W, k, pad }) {
  const far = g - 300 * k, cy = g - 190 * k, by = y1 + 60 * k;
  const through = (ax, ay) => { const t = (by - cy) / Math.max(1, ay - cy); return [ax * t, by]; };
  return { far, cy, ends: { N: [0, far + 2 * k], NE: [W * 0.3, far + 2 * k], NW: [-W * 0.3, far + 2 * k], E: [x1 + pad, cy + 14 * k], W: [x0 - pad, cy + 14 * k],
                            SE: through(x1 - 60 * k, y1 - 50 * k), SW: through(x0 + 60 * k, y1 - 50 * k), S: [0, by]} };
}
const CROSS_BACKS = [["woods", "🌲 tall trees and shafts of light"], ["sky", "☁️ sky, sun and clouds over the trees"], ["mountains", "⛰️ mountains far off"]];
function crossingScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, grad, all, land, o } = c;
  const { far, cy, ends } = crossGeom(c), floor = o.crossFloor || CROSS_FLOORS[0], back = CROSS_BACKS.some(([v]) => v === o.crossBack) ? o.crossBack : "woods";
  const wAt = y => (14 + 190 * Math.max(0, Math.min(1.2, (y - far) / (y1 + 20 * k - far)))) * k;
  // off in the distance (crossBack), all of it above the floor's far line:
  let s = "";
  if (back === "woods") {
    // tall trees, pale trunks under a roof of leaves, the light coming down through them
    s += SEP + part("cross-back", [c.F, back], () => {
      let t = `<defs>${grad("bg-cross-sky", "#cfe9bd", "#f1f6d6", y0, far)}</defs>` + all("url(#bg-cross-sky)"), trees = "";
      for (let i = 0; i < 30; i++) {
        const x = x0 + W * (i + R(i, 501)) / 30, w = (5 + 6 * R(i, 502)) * k;
        trees += `<rect x="${f1(x - w / 2)}" y="${f1(y0 - pad)}" width="${f1(w)}" height="${f1(far + 8 * k - y0 + pad)}" fill="#857560" opacity="0.65"/>`;
      }
      trees += `<rect x="${f1(x0 - pad)}" y="${f1(y0 - pad)}" width="${f1(W + 2 * pad)}" height="${f1(pad + H * 0.05)}" fill="#4a8650"/>`;
      for (let i = 0; i < 32; i++) {
        const x = x0 - 30 * k + (W + 60 * k) * i / 31, y = y0 + H * (0.03 + 0.07 * R(i, 503)), z = (40 + 30 * R(i, 504)) * k / 80;
        trees += padSvg(Math.floor(R(i, 505) * 8), x, y, z * (R(i, 506) < 0.5 ? -1 : 1), z * 1.2, ["#5c9c63", "#4a8650", "#68a468"][i % 3]);
      }
      return t + obj("far trees", far - 6 * k, trees);
    });
    s += SEP + part("cross-beams", [c.F, sceneLfoKey(o, "slow")], () => obj("sunbeams", far - 6 * k, sunbeamsSvg("bg-cross-shaft", x0, W, k, y0 - 20 * k, far + 20 * k, 4, 91, -0.3, o)));
  } else if (back === "sky") {
    // as at the forest clearing: the sky, the sun, drifting clouds, and the trees far off, each its own
    s += SEP + part("cross-back", [c.F, back], () => `<defs>${grad("bg-cross-sky", "#6ec2f2", "#e8f6ff", y0, far)}</defs>` + all("url(#bg-cross-sky)") +
      sunSvg(x1 - W * 0.16, y0 + H * 0.12, 26 * k) + land(far - 18 * k, 5, "#9ccf86", 0.4));
    s += SEP + cloudsSvg(c, 3, 0.7, 520);
    s += SEP + part("cross-far-trees", [c.F, back], () => {
      let t = "";
      for (let i = 0; i < 18; i++) {
        const x = x0 + W * (i + 0.2 + 0.6 * R(i, 521)) / 18, y = far + 4 * k * R(i, 522), sc = k * (0.2 + 0.08 * R(i, 523));
        t += i % 3 === 1 ? use("bg-cross-oak", x, y, sc) : use("bg-cross-pine", x, y, sc, sc, ` color="${["#2f6e3a", "#3a7d44", "#285e33"][i % 3]}"`);
      }
      return `<defs>${oakDef("bg-cross-oak", 1)}${pineDef("bg-cross-pine", 7)}</defs>` + obj("far woods", far, t);
    });
  } else {
    // as at the camp site and on the mountain trail: the sky, the sun, clouds high up, mountains far off, snow on the far ones, and far pines
    s += SEP + part("cross-back", [c.F, back], () => `<defs>${grad("bg-cross-sky", "#4f9fe0", "#e2f2ff", y0, far)}${cloudDef("bg-cloud", 1)}</defs>` + all("url(#bg-cross-sky)") +
      `<circle cx="${f1(x1 - W * 0.14)}" cy="${f1(y0 + H * 0.1)}" r="${f1(24 * k)}" fill="#fff6c8"/>`);
    s += SEP + part("cross-clouds", [c.F, back, sceneLfoKey(o, "slow")], () => [0, 1, 2].map(i => driftingCloud(x0 + W * (0.15 + 0.32 * i), y0 + H * (0.05 + 0.04 * (i % 2)), k * 0.5, i, o)).join(""));
    s += SEP + part("cross-peaks", [c.F, back], () => {
      let t = "";
      [[0, "#b6c6dc", 190, 9, true], [1, "#8ea3c0", 140, 7, true], [2, "#6d8296", 95, 6, false]].forEach(([r, fill, hgt, n, snow]) => {
        const base = far + r * 6 * k, pts = [[x0 - pad, base]];
        for (let i = 0; i <= n; i++) {
          const x = x0 - 60 * k + (W + 120 * k) * i / n + 30 * k * (R(i + r * 10, 523) - 0.5);
          pts.push([x - (W / n) * 0.45, base - hgt * k * (0.35 + 0.3 * R(i + r * 10, 524))], [x, base - hgt * k * (0.75 + 0.25 * R(i + r * 10, 525))]);
        }
        pts.push([x1 + pad, base], [x1 + pad, base + 30 * k], [x0 - pad, base + 30 * k]);
        t += `<polygon points="${pts.map(([x, y]) => P2(x, y)).join(" ")}" fill="${fill}"/>`;
        if (snow) for (let i = 2; i < pts.length - 3; i += 2) {
          const [px, py] = pts[i], [lx, ly] = pts[i - 1], [rx, ry] = pts[i + 1];
          t += snowCap(px, py, lx, ly, rx, ry, 0.24 * (base - py), i + r * 20);
        }
      });
      let row = "";
      for (let i = 0; i < 26; i++) row += use("bg-pine", x0 - 20 * k + (W + 40 * k) * i / 25, far + 14 * k + 4 * k * R(i, 526), k * (0.22 + 0.1 * R(i, 527)), k * (0.22 + 0.1 * R(i, 527)), ` color="${["#2f6e3a", "#3a7d44"][i % 2]}"`);
      return t + `<defs>${PINE_DEF}</defs>` + obj("far pines", far + 14 * k, row);
    });
  }
  // the forest floor, lighter far off, and its leaf litter
  s += SEP + part("cross-floor", [c.F, floor, far], () => {
    let t = `<defs>${grad("bg-cross-floor", mix(floor, "#ffffff", 0.18), floor, far, y1)}</defs>` + land(far, 5, "url(#bg-cross-floor)", 0.4);
    for (let i = 0; i < 60; i++) {
      const u = R(i, 507), y = far + (y1 - far) * u * u, x = x0 + W * R(i, 508), r = (2 + 4 * u) * k;
      t += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 1.6)}" ry="${f1(r * 0.6)}" fill="${mix(floor, i % 2 ? "#3a2a10" : "#c8b060", 0.35)}" opacity="0.7"/>`;
    }
    return t;
  });
  // the paths: each from the meeting place to where it leaves, as wide as
  // its depth makes it; the meeting place itself, a worn patch
  // (in a world square, only the paths that lead somewhere: crossLive, set by worldKeep; else the ones switched on)
  const on = typeof o.crossLive === "string" ? o.crossLive.split(",").filter(Boolean) : CROSS_DIRS.map(([d]) => d).filter(d => o["cross" + d]);
  s += SEP + part("cross-paths", [c.F, on.join(",")], () => {
    let t = "";
    for (const d of on) {
      const [ex, ey] = ends[d], dx = ex, dy = ey - cy, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      const a = wAt(cy) * 0.5, b = wAt(Math.min(ey, y1 + 20 * k)) * 0.5;
      // (no outline: the paths overlap where they meet, and outlines drew seams there; Matthew, 2026-10-17)
      t += `<path d="M${f1(nx * a)} ${f1(cy + ny * a)} L${f1(ex + nx * b)} ${f1(ey + ny * b)} L${f1(ex - nx * b)} ${f1(ey - ny * b)} L${f1(-nx * a)} ${f1(cy - ny * a)} Z" fill="${CROSS_PATH}"/>`;
      for (let i = 0; i < 9; i++) {
        const u = (i + 0.5) / 9, px = ex * u + (R(i, 509 + d.length) - 0.5) * 0.6 * (a + (b - a) * u) * nx, py = cy + dy * u + (R(i, 510) - 0.5) * 0.3 * (a + (b - a) * u);
        t += `<ellipse cx="${f1(px)}" cy="${f1(py)}" rx="${f1((3 + 3 * u) * k)}" ry="${f1((1.6 + 1.4 * u) * k)}" fill="${CROSS_PATH_EDGE}" opacity="0.55"/>`;
      }
    }
    if (on.length) t += `<ellipse cx="0" cy="${f1(cy)}" rx="${f1(wAt(cy) * 0.95)}" ry="${f1(wAt(cy) * 0.36)}" fill="${CROSS_PATH}"/>`;
    return t;
  });
  // butterflies, as on the path through the woods
  s += SEP + part("cross-butterflies", [c.F, sceneLfoKey(o, "fast"), sceneLfoKey(o, "wings")], () =>
    obj("butterflies", g - 50 * k, butterfliesSvg(c, [[x0 + W * 0.22, g - 60 * k, 1], [x0 + W * 0.74, g - 100 * k, 0.8]])));
  return s;
}
const SCENES = { lake: lakeScene, house: houseScene, treehouse: treehouseScene, livingroom: livingroomScene, treeroom: treeroomScene,
                 witchroom: witchroomScene, healerroom: healerroomScene, fairyforest: fairyforestScene, clearing: clearingScene, mountains: mountainsScene, waterfall: waterfallScene, campsite: campsiteScene,
                 tent: tentScene, cave: caveScene, woodpath: woodpathScene, crossing: crossingScene, castle: castleScene, castleroom: castleroomScene, imagination: imaginationScene, emptyroom: emptyroomScene };
// the beach's sea, from the horizon (sea) to the shore, where the foam and
// then the sand begin; and the cemetery's brook, at t from 0 (on the hills)
// to 1 (past the frame's foot): its middle, its height and half its width
// (for their drawings, and for a friend wading in them: WATER, ticket 122)
const beachLines = ({ g, k }) => ({ sea: g - 170 * k, shore: g - 55 * k });
// (ticket 186) open water's horizon: higher than the beach's, all the rest sea
const seaHorizon = ({ g, k }) => g - 230 * k;
const brookAt = ({ W, g, k, y1 }) => t => { const y = g - 62 * k + t * (y1 + 40 * k - (g - 62 * k));
  return [W * (0.2 + 0.2 * t) + W * 0.05 * Math.sin(t * Math.PI * 1.6), y, (8 + 70 * t * t) * k]; };
// (ticket 50) seats in the places backgroundSvg draws itself, as it draws
// them. Under the sea, the picnic bench: its plank's top (34 above the
// table's foot), between the sharks at its ends (their bodies come in to
// 98 of its 120 each side); one sits with their back to the table, facing us.
SEATS.underwater = (c, B) => { const { x1, W, g, k } = c, x = Math.max(x1 - W * 0.22, 230 * k), y = g + 30 * k;
  return [{ name: "picnic bench", x0: x - 98 * k, x1: x + 98 * k, y: y - 34 * k, z: y + 1, facing: ["front"] }]; };
// At the beach, the beach chairs (low): each one's seat, 68 across at its
// front edge, the hips 28 above the chair's feet, between the seat's back
// edge (34 up) and its front edge (18 up).
SEATS.beach = (c, B) => { const { W, g, k } = c;
  return [-1, 1].map(sd => { const x = sd * Math.max(W / 2 - 210 * k, 150 * k), b = g + 20 * k, cx = x + sd * 30 * k, cy = b - 10 * k;
    return { name: `beach chair, ${sd < 0 ? "left" : "right"}`, x0: cx - 34 * k, x1: cx + 34 * k, y: cy - 28 * k, z: cy + 1, facing: ["front"] }; }); };
// In the witch's woods, the giant tree's thickest root (the first of its
// humped roots, [30, 230, 30, 15]), where it humps up out of the ground
// beside the trunk on its way toward the middle: the top of its stroke
// over the highest stretch of its curve (sampled; within 3 of the top).
SEATS.witch = (c, B) => { const { x0, W, g, k } = c, x = x0 + W * 0.1, b = g + 40 * k;
  const [dx, reach, dy, rw] = [30, 230, 30, 15], sx = x + dx * k, ex = x + reach * k, ey = b + dy * k, hump = (18 + 14 * sceneR(0, 80)) * k;
  const m1 = sx + (ex - sx) * 0.35, m2 = sx + (ex - sx) * 0.7;
  const at = (t, p0, p1, p2, p3) => (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3;
  const pts = [...Array(41)].map((_, i) => [at(i / 40, sx, m1, m2, ex), at(i / 40, b - 14 * k, b - 14 * k - hump, ey - hump * 0.6, ey)]);
  const top = Math.min(...pts.map(p => p[1])), high = pts.filter(p => p[1] <= top + 3 * k);
  return [{ name: "big root", x0: high[0][0], x1: high[high.length - 1][0], y: top - (rw + 3) * k / 2, z: b + 1, facing: ["front", "left", "right"] }]; };
