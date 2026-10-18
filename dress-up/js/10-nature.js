"use strict";
// (ticket 178) Part 10 of 26 of the game's script, run in order by index.html.

// ---- the organic things every scene grows from: trees, pines, bushes,
// grass and rocks, all in the tree house's style (limbs and leaf pads, no
// lollipops), each from its own seed, so no two are alike ----
const seeded = seed => i => { const v = Math.sin(seed * 71.3 + i * 13.7) * 43758.5453; return v - Math.floor(v); };
// a curved, tapering limb: from p0 by way of p1 to p2, w0 wide to w1
// (ticket 261: its polygon, in its own units, onto `into` when given, for an outline)
const taperSvg = (p0, p1, p2, w0, w1, fill, into) => {
  const L = [], Rr = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8, x = (1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * p1[0] + u * u * p2[0], y = (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * p1[1] + u * u * p2[1];
    const dx = 2 * (1 - u) * (p1[0] - p0[0]) + 2 * u * (p2[0] - p1[0]), dy = 2 * (1 - u) * (p1[1] - p0[1]) + 2 * u * (p2[1] - p1[1]), d = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * u) / 2;
    L.push(`${f1(x - dy / d * w)},${f1(y + dx / d * w)}`); Rr.push(`${f1(x + dy / d * w)},${f1(y - dx / d * w)}`);
  }
  const pts = [...L, ...Rr.reverse()];
  if (into) into.push(pts.map(q => q.split(",").map(Number)));
  return `<polygon points="${pts.join(" ")}" fill="${fill}"/>`;
};
// (ticket 261) the outline of the last tree, pine or bush drawn (leafyTree, pineTree, bushSvg), for its def's <use>s
let lastOutline = [];
// A broadleaf tree, in the old oak's units (its foot at 0, 0, about 330
// tall): a trunk flaring at the roots, limbs forking up and out, and leaf
// pads clustered at their tips, darker behind and lighter in front
function leafyTree(seed, o = {}) {
  const r = seeded(seed), H = o.h ?? 320, wide = o.wide ?? 1, bark = o.bark ?? "#6b4a2b", dk = mix(bark, "#000000", 0.35);
  const greens = o.greens ?? ["#285e2a", "#2f7d32", "#3a8a3c", "#47a047", "#58b050"];
  const limbs = [], tips = [];
  const outline = [];
  const grow = (x, y, a, len, w, lvl, id) => {
    const bend = (r(id * 7 + 1) - 0.5) * 0.6, mx = x + Math.cos(a) * len * 0.5, my = y + Math.sin(a) * len * 0.5;
    const ex = mx + Math.cos(a + bend) * len * 0.5, ey = my + Math.sin(a + bend) * len * 0.5;
    limbs.push(taperSvg([x, y], [mx, my], [ex, ey], w, w * 0.6, bark, outline));
    if (lvl === 0) { tips.push([ex, ey, len]); return; }
    const n = 2 + (r(id * 7 + 2) > 0.45 ? 1 : 0);
    for (let c = 0; c < n; c++) grow(ex, ey, a + bend + (c - (n - 1) / 2) * (0.55 + 0.3 * r(id * 7 + 3 + c)) * wide, len * (0.6 + 0.18 * r(id * 11 + c)), w * 0.6, lvl - 1, id * 3 + c + 1);
  };
  const lean = (r(1) - 0.5) * 0.18, top = [Math.sin(lean) * H * 0.45, -H * 0.44];
  let t = `<ellipse cx="0" cy="2" rx="${f1(70 * wide)}" ry="11" fill="#000000" opacity="0.15"/>`;
  // roots, flaring into the ground
  for (const e of [-1, 1]) t += `<path d="M${f1(e * 10)} -24 Q${f1(e * 16)} -4 ${f1(e * (30 + 8 * r(2 + e)))} 2 L${f1(e * 6)} 2 Z" fill="${bark}"/>`;
  t += taperSvg([0, 2], [top[0] * 0.4, -H * 0.24], top, 30, 19, bark, outline);
  for (let c = 0; c < 3; c++) grow(top[0], top[1], -Math.PI / 2 + (c - 1) * 0.7 * wide + (r(10 + c) - 0.5) * 0.3, H * (0.25 + 0.06 * r(20 + c)), 16, 1, c + 2);
  t += limbs.join("") + `<path d="M${f1(-4)} -20 Q${f1(top[0] * 0.3 - 6)} ${f1(-H * 0.22)} ${f1(top[0] - 4)} ${f1(top[1] + 10)}" fill="none" stroke="${dk}" stroke-width="3" opacity="0.5"/>`;
  // the leaves: a back layer over the crown, then a cluster at each tip
  const pads = [];
  for (let i = 0; i < 4; i++) pads.push([top[0] + (r(30 + i) - 0.5) * 140 * wide, top[1] - 60 - 70 * r(34 + i), 0.55 + 0.2 * r(38 + i), 0]);
  tips.forEach(([x, y, len], i) => { pads.push([x + (r(40 + i) - 0.5) * 30, y - 16, 0.42 + 0.16 * r(50 + i), 1]); pads.push([x + (r(60 + i) - 0.5) * 40, y + 8, 0.36 + 0.14 * r(70 + i), 2]); });
  pads.sort((a, b) => a[3] - b[3] || a[1] - b[1]);
  // (ticket 261: a pad hidden by the pads in front of it, more than 75%, left out)
  const padItems = pads.map(([x, y, sc, layer], i) => { const j = Math.floor(r(80 + i) * 8), sx = sc * (r(90 + i) < 0.5 ? -1 : 1) * wide;
    return { svg: padSvg(j, x, y, sx, sc, greens[Math.min(greens.length - 1, layer + Math.floor(r(100 + i) * 3))]), shape: padOutline(j, x, y, sx, sc) }; });
  t += seenOnly(padItems);
  lastOutline = [...outline, ...padItems.flatMap(p => p.shape)];
  return drawnBy("leafyTree", t);
}
// a tree's drawing under an id, for <use> (one drawing, many trees)
const leafyTreeDef = (id, seed, o) => { const t = leafyTree(seed, o); OUTLINE_OF.set(id, lastOutline); return `<g id="${id}">${t}</g>`; };
// A pine, in the old pine's units (its foot at 0, 0, 200 tall, 100 wide at
// the bottom): a trunk, then tiers of drooping boughs, ragged at their
// tips, darker underneath, in the color of its <use>
function pineTree(seed, o = {}) {
  const r = seeded(seed), n = o.tiers ?? 5, outline = [[[-6, -34], [6, -34], [6, 2], [-6, 2]]];
  let t = `<rect x="-6" y="-34" width="12" height="36" fill="#5e3d22"/>`;
  for (let j = 0; j < n; j++) {
    // (broad tiers, overlapping, each drooping to three soft points a side)
    const u = j / n, y = -22 - u * 158, hw = 60 * (1 - u * 0.84), th = 62 - 22 * u, tip = y - th;
    const right = [];
    for (let q = 1; q <= 3; q++) { const v = q / 3, x = hw * v;
      right.push([x - hw / 6, y - 4 - 6 * r(j * 10 + q)], [x, y + 6 + 6 * r(j * 10 + q + 5) - 4 * v]); }
    const pts = [[0, tip], ...right, ...[...right].reverse().map(([x, yy]) => [-x * (0.94 + 0.1 * r(j + 40)), yy + 2 * (r(j + 41) - 0.5)])];
    const ps = pts.map(([x, yy]) => `${f1(x)},${f1(yy)}`).join(" ");
    outline.push(pts);
    t += `<polygon points="${ps}" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>` +
         `<polygon points="${f1(-hw * 0.85)},${f1(y + 2)} ${f1(hw * 0.85)},${f1(y + 2)} ${f1(hw * 0.5)},${f1(y - th * 0.3)} ${f1(-hw * 0.5)},${f1(y - th * 0.3)}" fill="#000000" opacity="0.16"/>` +
         `<polygon points="0,${f1(tip + 4)} ${f1(-hw * 0.6)},${f1(y - th * 0.15)} ${f1(-hw * 0.18)},${f1(y - th * 0.5)}" fill="#ffffff" opacity="0.1"/>`;
  }
  lastOutline = outline;
  return drawnBy("pineTree", t);
}
const pineDef = (id, seed = 1, o) => { const t = pineTree(seed, o); OUTLINE_OF.set(id, lastOutline); return `<g id="${id}">${t}</g>`; };
// a bush: a low mound of leaf pads, darker at its foot, flowers on some
const bushSvg = (x, y, rad, seed, o = {}) => {
  const r = seeded(seed), greens = o.greens ?? ["#285e2a", "#2f7d32", "#3a8a3c", "#4a9a46", "#5aad52"], sc = rad / 95;
  let t = `<ellipse cx="${f1(x)}" cy="${f1(y + 2 * sc)}" rx="${f1(rad * 1.1)}" ry="${f1(rad * 0.22)}" fill="#000000" opacity="0.16"/>`;
  const n = 4 + Math.floor(r(1) * 3), outline = [], items = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, px = x + (u - 0.5) * rad * 1.3 + (r(10 + i) - 0.5) * rad * 0.3, py = y - rad * (0.15 + 0.5 * Math.sin(Math.PI * u)) * (0.7 + 0.5 * r(20 + i));
    const j = Math.floor(r(30 + i) * 8), sx = sc * (0.5 + 0.25 * r(40 + i)) * (r(50 + i) < 0.5 ? -1 : 1), sy = sc * (0.6 + 0.3 * r(60 + i));
    items.push({ svg: padSvg(j, px, py, sx, sy, greens[Math.min(greens.length - 1, Math.floor(i / n * greens.length + r(70 + i)))]), shape: padOutline(j, px, py, sx, sy) });
    outline.push(...items[i].shape);
  }
  // (ticket 261: a pad more than 75% hidden by the bush's pads in front of it, left out)
  t += seenOnly(items);
  lastOutline = outline;
  if (o.flowers) for (let i = 0; i < 6; i++) { const fx = x + (r(80 + i) - 0.5) * rad * 1.4, fy = y - rad * (0.2 + 0.6 * r(90 + i));
    t += `<circle cx="${f1(fx)}" cy="${f1(fy)}" r="${f1(rad * 0.07)}" fill="${o.flowers[i % o.flowers.length]}"/><circle cx="${f1(fx)}" cy="${f1(fy)}" r="${f1(rad * 0.025)}" fill="#fde047"/>`; }
  return drawnBy("bushSvg", t);
};
// a tuft of grass: blades from one root, each leaning its own way
const grassTuft = (x, y, h, seed, col = "#4f9a3a", wd = 2) => {
  const r = seeded(seed), lit = mix(col, "#ffffff", 0.25), n = 5 + Math.floor(r(1) * 3);
  return drawnBy("grassTuft", [...Array(n)].map((_, i) => { const lean = (i / (n - 1) - 0.5) * 1.2 + (r(10 + i) - 0.5) * 0.4, hh = h * (0.6 + 0.4 * r(20 + i));
    return `<path d="M${f1(x + (i - n / 2) * wd * 0.6)} ${f1(y)} Q${f1(x + lean * hh * 0.25)} ${f1(y - hh * 0.6)} ${f1(x + lean * hh * 0.6)} ${f1(y - hh)}" fill="none" stroke="${i % 2 ? lit : col}" stroke-width="${f1(wd)}" stroke-linecap="round"/>`; }).join(""));
};
// a rock: an irregular stone, flat where it sits, its top lit, a crack
const rockSvg = (x, y, rad, seed, tone = "#9a9488") => {
  const r = seeded(seed), lit = mix(tone, "#ffffff", 0.25), dk = mix(tone, "#000000", 0.25), pts = [], n = 10;
  for (let i = 0; i < n; i++) { const a = Math.PI + i / (n - 1) * Math.PI, rr = rad * (0.8 + 0.3 * r(i));
    pts.push([x + Math.cos(a) * rr * (1.2 + 0.2 * r(20)), y + Math.min(0, Math.sin(a)) * rr * (0.75 + 0.2 * r(i + 10))]); }
  const top = pts.slice(1, 6).map(([px, py]) => [x + (px - x) * 0.7 - rad * 0.08, y + (py - y) * 0.85 - rad * 0.05]);
  const P_ = a => a.map(([px, py]) => `${f1(px)},${f1(py)}`).join(" ");
  return `<ellipse cx="${f1(x)}" cy="${f1(y + rad * 0.06)}" rx="${f1(rad * 1.35)}" ry="${f1(rad * 0.2)}" fill="#000000" opacity="0.18"/>` +
    `<polygon points="${P_(pts)}" fill="${tone}" stroke="${dk}" stroke-width="${f1(rad * 0.04)}" stroke-linejoin="round"/>` +
    `<polygon points="${P_([[x - rad * 0.9, y - rad * 0.1], ...top, [x + rad * 0.3, y - rad * 0.3]])}" fill="${lit}" opacity="0.7"/>` +
    `<path d="M${f1(x + rad * 0.2)} ${f1(y - rad * 0.55)} l${f1(rad * 0.15)} ${f1(rad * 0.25)} l${f1(-rad * 0.05)} ${f1(rad * 0.22)}" fill="none" stroke="${dk}" stroke-width="${f1(rad * 0.04)}"/>`;
};
// (ticket 50) a rock's top, to sit on: the span across of its four topmost
// points (the 4th to 7th of its outline's 10) and their mean height, as
// rockSvg places them (keep the two alike)
const rockTop = (x, y, rad, seed) => { const r = seeded(seed), w = 1.2 + 0.2 * r(20);
  const pts = [3, 4, 5, 6].map(i => { const a = Math.PI + i / 9 * Math.PI, rr = rad * (0.8 + 0.3 * r(i));
    return [x + Math.cos(a) * rr * w, y + Math.sin(a) * rr * (0.75 + 0.2 * r(i + 10))]; });
  return { x0: pts[0][0], x1: pts[3][0], y: pts.reduce((s, p) => s + p[1], 0) / 4 }; };
// where each house's ladder goes down to: the house below it (house 1's to
// house 5, 2's to 6, 3's to 1, 4's to 2), or the ground (-1) when there is
// no house below it
const LADDER_TO = [4, 5, 0, 1, -1, -1];
// a tree house's cabin (its walls the color of its <use>) and an animal's eye
// (the cabin's drawing by itself, too: the room sign's map draws it, ticket 244)
const CABIN_SVG = `<rect x="-82" y="0" width="164" height="14" fill="#8b5e34" stroke="#5e3d22" stroke-width="2"/>` +
      [-80, -66, 66, 80].map(x => `<line x1="${x}" y1="0" x2="${x}" y2="-28" stroke="#8b5e34" stroke-width="4"/>`).join("") +
      `<path d="M-82 -28 H-52 M52 -28 H82" stroke="#8b5e34" stroke-width="4"/>` +
      `<rect x="-52" y="-100" width="104" height="100" fill="currentColor"/>` +
      [-88, -76, -64, -52, -40, -28, -16].map(y => `<line x1="-52" y1="${y}" x2="52" y2="${y}" stroke="#00000030" stroke-width="1.5"/>`).join("") +
      [-1, 1].map(sd => `<rect x="${sd * 34 - 11}" y="-78" width="22" height="24" fill="#bfe3f5" stroke="#ffffff" stroke-width="3"/>`).join("") +
      `<path d="M-15 0 V-56 Q0 -72 15 -56 V0 Z" fill="#7a4b28" stroke="#4a2e1a" stroke-width="2"/><circle cx="9" cy="-28" r="2.5" fill="#f2c12e"/>`;
const CABIN_DEFS = `<g id="bg-cabin">${CABIN_SVG}</g>` +
      `<g id="bg-eye"><circle cx="0" cy="0" r="9" fill="#ffffff" stroke="#00000055" stroke-width="1.5"/><circle cx="1" cy="1" r="5" fill="#1f1a17"/><circle cx="-1.5" cy="-1.5" r="1.8" fill="#ffffff"/></g>`;
// the room inside each tree house
const HOUSE_ROOMS = ["bunks", "kitchen", "books", "lookout", "art", "music"];
const TREE_BRIDGES = [[2, 3], [0, 1], [4, 5], [0, 3], [2, 1]];   // across the tree
// The great tree, in its own units (standing at 0, 0): its crown, branches,
// braided trunk, leaves, swing, bridges, ladders and houses, all as the
// sliders and menus say. The tree house scene draws it, and so does the
// forest clearing, small and far off: the same tree.
function treeInner(c) {
  const { o, R } = c;
  const n = Math.max(1, Math.min(6, o.houses ?? 4));
  // the houses' own size, apart from the tree's: they grow about where
  // they sit, and the bridges and ladders keep to their platforms
  const hz = (o.treeHouseSize ?? 100) / 100;
  const bridges = o.bridges ?? 2, ladders = o.ladders ?? 3, leaves = o.leaves ?? 60;
  let s = "";
  // the crown, high above the frame at the tree's usual size (its top is
  // about 600 of the tree's units up): seen only when the tree is small
  s += SEP + part("tree-crown", [leaves], () => {
    let t = `<polygon points="-62,-720 -26,-1290 26,-1290 62,-720" fill="#5e3d22" stroke="#3a2414" stroke-width="2"/>` +
            [-30, -8, 14].map(x => `<path d="M${x} -730 Q${x + 10} -950 ${x / 2} -1280" fill="none" stroke="#3a2414" stroke-width="3" opacity="0.5"/>`).join("");
    const tips = [];
    for (let j = 0; j < 14; j++) {
      const sd = j % 2 ? 1 : -1, sy = -780 - 34 * j, tx = sd * (160 + 470 * R(j, 230)), ty = sy - 80 - 220 * R(j, 231);
      const fx = tx * 0.7 + sd * 60, fy = ty - 90 - 60 * R(j, 232);
      t += `<path d="M${sd * 20} ${sy} Q${f1(tx * 0.45)} ${f1(sy - 20)} ${f1(tx)} ${f1(ty)}" fill="none" stroke="#6e4a2c" stroke-width="${f1(26 - j)}" stroke-linecap="round"/>` +
           `<path d="M${f1(tx * 0.6)} ${f1((sy + ty) / 2 - 10)} L${f1(fx)} ${f1(fy)}" fill="none" stroke="#6e4a2c" stroke-width="11" stroke-linecap="round"/>`;
      tips.push([tx, ty], [fx, fy]);
    }
    tips.push([0, -1300], [-120, -1360], [120, -1350], [0, -1420]);
    // (ticket 261: a pad more than 75% hidden by the pads drawn after it, left out)
    t += seenOnly([...Array(Math.round(leaves * 0.8))].map((_, i) => {
      const [x, y] = tips[i % tips.length], more = Math.floor(i / tips.length), sc = 1 + 1.1 * R(i, 233), j = Math.floor(R(i, 234) * 8);
      const px = x + more * 70 * (R(i, 235) - 0.5) * 2, py = y + 10 - more * 50, sx = sc * (R(i, 236) < 0.5 ? -1 : 1);
      return { svg: use(`bg-pad${j}`, px, py, sx, sc, ` color="${["#2a6e2e", "#2f7d32", "#3c9a40", "#266b30", "#4fb04f"][Math.floor(R(i, 237) * 5)]}"`), shape: padOutline(j, px, py, sx, sc) };
    }));
    return t;
  });
  // more branches, up the trunk and out each side, a fork on each
  s += SEP + part("tree-branches", [], () => TREE_TIPS.map(([sx, sy, tx, ty, fx, fy]) =>
    `<path d="M${sx} ${sy} Q${f1((sx + tx) / 2)} ${f1(sy - 6)} ${tx} ${ty}" fill="none" stroke="#6e4a2c" stroke-width="13" stroke-linecap="round"/>` +
    `<path d="M${f1((sx + 2 * tx) / 3)} ${f1((sy + 2 * ty) / 3 - 4)} L${fx} ${fy}" fill="none" stroke="#6e4a2c" stroke-width="7" stroke-linecap="round"/>`).join(""));
  s += SEP + part("tree-trunk", [n], () =>
    // (ticket 241, Matthew: "there's no collision info for the outside tree house tree trunk system") the braid
    // marked, data-trunk: the tree house's box is its trunk's alone (standingHere), not its houses', bridges' or ladders'
    treeLimbs(n) + treeRoots() + `<g data-trunk="">` + treeBraid() + `</g>`);
  // leaves: bonsai pads, eight shapes drawn once, each used again and
  // again, grown, flipped and colored by its <use> (0 leaves: bare)
  s += SEP + part("tree-pad-shapes", [], () => `<defs>${[...Array(8)].map((_, j) => padDef(`bg-pad${j}`, j)).join("")}</defs>`);
  s += SEP + part("tree-pads", [leaves], () => {
    const tips = TREE_TIPS.flatMap(([, , tx, ty, fx, fy]) => [[tx, ty], [fx, fy]]);
    // (ticket 261: a pad more than 75% hidden by the pads drawn after it, left out)
    return seenOnly([...Array(Math.round(leaves * 0.56))].map((_, i) => {
      const [x, y] = tips[i % tips.length], more = Math.floor(i / tips.length), sc = 0.55 + 0.75 * R(i, 124), j = Math.floor(R(i, 125) * 8);
      const px = x + more * 34 * (R(i, 126) - 0.5) * 2, py = y + 6 - more * 26, sx = sc * (R(i, 127) < 0.5 ? -1 : 1);
      return { svg: use(`bg-pad${j}`, px, py, sx, sc, ` color="${["#2f7d32", "#3c9a40", "#4fb04f", "#2a6e2e", "#5aa84a"][Math.floor(R(i, 128) * 5)]}"`), shape: padOutline(j, px, py, sx, sc) };
    }));
  });
  s += SEP + part("tree-swing", [sceneLfoKey(o, "slow")], () =>
    `<path d="M30 -300 Q200 -330 430 -350" fill="none" stroke="#6e4a2c" stroke-width="16" stroke-linecap="round"/>` +
    `<path d="M300 -338 Q330 -380 350 -400" fill="none" stroke="#6e4a2c" stroke-width="7" stroke-linecap="round"/>` +
    `<g>${lfoTimed(o, "slow", 0.15, `<animateTransform attributeName="transform" type="rotate" values="-14 395 -346;14 395 -346;-14 395 -346" dur="2.6s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>`)}` +
    `<path d="M375 -344 L372 -70 M415 -348 L418 -70" stroke="#d8c49a" stroke-width="3.5"/>` +
    `<rect data-swing-seat="" x="358" y="-72" width="74" height="12" rx="4" fill="#a0703f" stroke="#5e3d22" stroke-width="2"/></g>`);   // (ticket 240: the seat, found as it swings: swingNow)
  s += SEP + part("tree-bridges", [n, bridges, hz], () => treeBridges(n, bridges, hz));
  s += SEP + part("tree-ladders", [n, ladders, hz], () => TREE_SLOTS.slice(0, Math.min(n, ladders)).map((_, i) => {
    // (ticket 137: one down to the ground can be climbed, up to house i + 1;
    // one between houses is out of reach from the ground)
    const t = treeLadder(n, i, hz);
    return t.ground ? `<g data-ladder="1" data-house="${i + 1}">${t.svg}</g>` : t.svg;
  }).join(""));
  // the houses: one drawing, its roof the color of its <use>
  s += SEP + part("tree-cabin", [], () => `<defs>${CABIN_DEFS}</defs>` +
    "") + treeHouses(o, n, hz).map(({ x, y, i, animal, look, sc }) =>
      part("tree-house", [i, animal, look.cols, sc], () => `<g class="portal" data-to="treeroom" data-house="${i + 1}">` +
        use("bg-cabin", x, y, sc, sc, ` color="${look.walls}"`) + `<g ${tf(x, y, sc)}>${look.head}</g></g>`)).join("");
  return s;
}
// The tree's pieces, in its own units, for treeInner and for the map on a tree room's sign (ticket 244). The limbs out to
// the first n houses' platforms:
const treeLimbs = n => TREE_SLOTS.slice(0, n).map(([x, y]) => {
  const sd = Math.sign(x), bx0 = sd * 40, by = y + 60;
  return `<path d="M${bx0} ${by + 30} Q${f1(x * 0.5)} ${f1(by + 10)} ${f1(x - sd * 40)} ${f1(y + 14)}" fill="none" stroke="#6e4a2c" stroke-width="24" stroke-linecap="round"/>` +
         `<line x1="${sd * 30}" y1="${by + 90}" x2="${f1(x - sd * 10)}" y2="${f1(y + 16)}" stroke="#6e4a2c" stroke-width="9" stroke-linecap="round"/>`;
}).join("");
// the trunk: five trunks braided, apart at the ground, one tree above; two roots out along the ground
const treeRoots = () => `<path d="M-90 -10 Q-140 -4 -175 12 M90 -10 Q140 -4 175 12" stroke="#6e4a2c" stroke-width="16" stroke-linecap="round" fill="none"/>`;
const treeBraid = () => braidSvg(0, -780, 10, 240, 1, { strands: 5, taper: 0.5, base: "#00000026" });
// the rope bridges, the first `bridges` of TREE_BRIDGES between the n houses
const treeBridges = (n, bridges, hz) => TREE_BRIDGES.filter(([a, b]) => a < n && b < n).slice(0, bridges).map(([a, b]) => {
  const { p, m, q } = treeBridgeCurve(a, b, hz);
  let t = `<path d="M${p[0]} ${p[1]} Q${f1(m[0])} ${f1(m[1])} ${q[0]} ${q[1]}" fill="none" stroke="#8b5e34" stroke-width="10" stroke-dasharray="7 3"/>` +
          `<path d="M${p[0]} ${p[1] - 30} Q${f1(m[0])} ${f1(m[1] - 30)} ${q[0]} ${q[1] - 30}" fill="none" stroke="#d8c49a" stroke-width="3"/>`;
  for (let i = 1; i < 10; i++) {
    const u = i / 10, x = (1 - u) * (1 - u) * p[0] + 2 * u * (1 - u) * m[0] + u * u * q[0], y = (1 - u) * (1 - u) * p[1] + 2 * u * (1 - u) * m[1] + u * u * q[1];
    t += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x)}" y2="${f1(y - 30)}" stroke="#d8c49a" stroke-width="2"/>`;
  }
  return t;
}).join("");
// a bridge's deck, from house a's platform's edge (p) to house b's (q), sagging between them: a quadratic through m (the
// walkways, ticket 245, follow it)
const treeBridgeCurve = (a, b, hz) => {
  const [ax, ay] = TREE_SLOTS[a], [bx, by] = TREE_SLOTS[b], sa = Math.sign(bx - ax) || 1;
  // (a smaller house's platform is narrower)
  const edge = j => 78 * (j >= 2 ? 0.85 : 1) * hz, p = [ax + sa * edge(a), ay], q = [bx - sa * edge(b), by], sag = 30 + 0.08 * Math.hypot(q[0] - p[0], q[1] - p[1]);
  return { p, q, m: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + sag] };
};
// house i's ladder (0-based): down to the house below it, if there is one, or to the ground (then .ground)
const treeLadder = (n, i, hz) => {
  const [x, y] = TREE_SLOTS[i], to = LADDER_TO[i], below = to >= 0 && to < n ? TREE_SLOTS[to][1] - 4 : 0;
  const lx = x + Math.sign(x) * 52 * hz, top = y + 14 * hz;
  let t = `<line x1="${lx - 12}" y1="${top}" x2="${lx - 12}" y2="${below}" stroke="#8b5e34" stroke-width="5"/><line x1="${lx + 12}" y1="${top}" x2="${lx + 12}" y2="${below}" stroke="#8b5e34" stroke-width="5"/>`;
  for (let y2 = top + 18; y2 < below - 4; y2 += 22) t += `<line x1="${lx - 12}" y1="${y2}" x2="${lx + 12}" y2="${y2}" stroke="#a0703f" stroke-width="4"/>`;
  return { svg: t, ground: below === 0 };
};
// the n houses, each where it sits, its animal and its look, its size; the higher houses first: a lower one is
// nearer, in front of them
const treeHouses = (o, n, hz) => TREE_SLOTS.slice(0, n).map((slot, i) => [slot, i]).sort((u, v) => u[0][1] - v[0][1]).map(([[x, y, usual], i]) => {
  const chosen = o["house" + (i + 1)], animal = HOUSE_ANIMALS.some(([v]) => v === chosen) ? chosen : usual;
  return { x, y, i, animal, look: houseLook(animal, o, i + 1), sc: (i >= 2 ? 0.85 : 1) * hz };
});
// (ticket 244) a drawing as a silhouette in one color: its every fill and stroke that color, its eyes gone
const silhouette = (svg, col) => svg.replace(/<use href="#bg-eye"[^>]*\/>/g, "").replace(/ (fill|stroke)="(?!none")[^"]*"/g, ` $1="${col}"`).replace(/ opacity="[^"]*"/g, "");
// (ticket 244, Matthew: "on that sign, let's include a graphic that serves as a map for the person in the room -- it looks
// like the treehouse, but in a few dark colors (not colorful) and maybe even reuses some of the tree house drawing logic.
// The sign indicates, with a bright white circle, which of the 6 possible houses in the map graphic is the current
// house") The tree outside, from the pieces treeInner draws it with, each piece in one dark color: the ground, the trunk
// and its limbs, the bridges and ladders, and the houses, each numbered; a white ring round house `here` (1-based). In the
// tree's units, cut to TREE_MAP_BOX: the trunk goes on up, out of it.
const TREE_MAP_BOX = [-480, -640, 960, 670];
function treeMapSvg(o, here) {
  const n = Math.max(1, Math.min(6, o.houses ?? 4)), hz = (o.treeHouseSize ?? 100) / 100;
  const bridges = o.bridges ?? 2, ladders = o.ladders ?? 3, [bx, by, bw, bh] = TREE_MAP_BOX;
  let t = `<defs><clipPath id="bg-treemap"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}"/></clipPath></defs><g clip-path="url(#bg-treemap)">` +
          `<rect x="${bx}" y="10" width="${bw}" height="${by + bh - 10}" fill="#2c3318"/>` +
          silhouette(treeLimbs(n) + treeRoots() + treeBraid(), "#3b2715") +
          silhouette(treeBridges(n, bridges, hz) + TREE_SLOTS.slice(0, Math.min(n, ladders)).map((_, i) => treeLadder(n, i, hz).svg).join(""), "#4d3520");
  const houses = treeHouses(o, n, hz);
  // (the numbers after all the houses: a lower house, nearer, covers the one above it, and would cover its number)
  t += houses.map(({ x, y, look, sc }) => silhouette(`<g ${tf(x, y, sc)}>${CABIN_SVG}${look.head}</g>`, "#1f140b")).join("") +
       houses.map(({ x, y, i, sc }) => `<text x="${f1(x)}" y="${f1(y - 14 * sc)}" text-anchor="middle" font-size="${f1(92 * sc)}" font-weight="bold" fill="#e9d3a6" font-family="sans-serif">${i + 1}</text>`).join("");
  const h = houses.find(u => u.i === here - 1);
  if (h) t += [["#1f140b", 30], ["#ffffff", 16]].map(([col, w]) => `<circle data-here="${here}" cx="${f1(h.x)}" cy="${f1(h.y - 84 * h.sc)}" r="${f1(112 * h.sc)}" fill="none" stroke="${col}" stroke-width="${w}"/>`).join("");
  return t + `</g>`;
}
// (ticket 257, Matthew: "the palm trees in the castle's green house need more segments for collision detection -- and we
// should improve the image -- it looks pretty sloppy -- let's have a palm tree segment system, with 3 or 4 variations of
// shapes, and stack them, not use ovals") A palm's trunk: n segments stacked along its curve from its foot (x, base) up
// h, leaning toward sd (lean of h across at the top, bending more as it goes up), each of one of PALM_SEGS's shapes,
// turned to the trunk's way there, narrowing as it goes up; drawn from the top down, so each segment's lip is over the
// foot of the one above it; a root flare at the ground. Its spine (data-spine: straight pieces along the curve, each
// as wide as the trunk there, unseen) is what its collision bands are measured by (standingHere), PALM_BANDS of them.
// Returns its drawing and the top of the trunk, where its crown goes. rnd(j): a seeded number in [0, 1) for segment j.
const PALM_BANDS = 8;
// (each a segment's outline: a its foot's half-width, b its top's, s its height; its foot at 0, its top at -s)
const PALM_SEGS = [
  (a, b, s) => `M${-a} 0 L${-0.92 * b} ${-0.8 * s} L${-1.14 * b} ${-s} L${1.14 * b} ${-s} L${0.92 * b} ${-0.8 * s} L${a} 0 Z`,   // a collar, its lip flared
  (a, b, s) => `M${-a} 0 Q${-1.16 * a} ${-0.5 * s} ${-b} ${-s} L${b} ${-s} Q${1.16 * a} ${-0.5 * s} ${a} 0 Z`,   // a barrel
  (a, b, s) => `M${-a} 0 L${-b} ${-s} L${-0.3 * b} ${-s} L0 ${-0.82 * s} L${0.3 * b} ${-s} L${b} ${-s} L${a} 0 Z`,   // notched, a leaf's scar
  (a, b, s) => `M${-a} 0 L${-1.06 * b} ${-0.9 * s} Q0 ${-1.14 * s} ${1.06 * b} ${-0.9 * s} L${a} 0 Z`,   // domed
].map(f => (a, b, s) => f(a, b, s).replace(/-?\d+(\.\d+)?(e-?\d+)?/g, v => f1(+v)));
function palmTrunkSvg(x, base, h, sd, k, rnd, lean = 0.18, n = 11) {
  const at = u => [x + sd * h * lean * u * u, base - h * u], turn = u => Math.atan2(sd * 2 * lean * u, 1) * 180 / Math.PI;
  const half = u => (17 - 7 * u) * k, s = h / n * 1.2;
  const flare = half(0.06);
  let t = `<path d="M${f1(x - 28 * k)} ${f1(base + 2 * k)} Q${f1(x - 15 * k)} ${f1(base - 6 * k)} ${f1(x - flare)} ${f1(base - 24 * k)} L${f1(x + flare)} ${f1(base - 24 * k)} Q${f1(x + 15 * k)} ${f1(base - 6 * k)} ${f1(x + 28 * k)} ${f1(base + 2 * k)} Z" fill="#6a4a28" stroke="#4e3519" stroke-width="${f1(1.4 * k)}"/>`;
  for (let j = n - 1; j >= 0; j--) {
    const u = j / n, [px, py] = at(u), a = half(u), b = half(Math.min(1, (j + 1.2) / n)), shape = PALM_SEGS[Math.floor(rnd(j) * PALM_SEGS.length) % PALM_SEGS.length];
    const fill = ["#8b6a3e", "#7d5d34", "#94744a"][j % 3];
    t += `<g transform="translate(${f1(px)} ${f1(py)}) rotate(${f1(turn(u + 0.5 / n))})">` +
         `<path d="${shape(a, b, s)}" fill="${fill}" stroke="#4e3519" stroke-width="${f1(1.4 * k)}" stroke-linejoin="round"/>` +
         // (its round side catching the light, and the ring where its leaf grew)
         `<path d="M${f1(-0.55 * a)} ${f1(-0.12 * s)} L${f1(-0.55 * b)} ${f1(-0.74 * s)}" stroke="#b9925e" stroke-width="${f1(2.2 * k)}" stroke-linecap="round" opacity="0.6"/>` +
         `<path d="M${f1(-0.9 * b)} ${f1(-0.78 * s)} Q0 ${f1(-0.68 * s)} ${f1(0.9 * b)} ${f1(-0.78 * s)}" fill="none" stroke="#5a3d1f" stroke-width="${f1(1.1 * k)}" opacity="0.7"/></g>`;
  }
  // (the spine: four straight pieces along the curve, unseen, each as wide as the trunk at its middle)
  t += `<g data-spine-of="palm" pointer-events="none">` + [0, 1, 2, 3].map(i => { const [ax, ay] = at(i / 4), [bx, by] = at((i + 1) / 4);
    return `<path data-spine="" data-bands="${PALM_BANDS}" d="M${f1(ax)} ${f1(ay)} L${f1(bx)} ${f1(by)}" fill="none" stroke="transparent" stroke-width="${f1(2 * half((i + 0.5) / 4))}"/>`; }).join("") + `</g>`;
  return { svg: drawnBy("palmTrunkSvg", t), top: at(1) };
}
// (ticket 50) the swing: its seat, 74 of the tree's units across (358 to
// 432), its top 72 above the ground, as treeInner's "tree-swing" hangs it
// at rest, in the tree's group (its size the tree's slider's); a sitter is
// in front of the whole tree, and swings with the seat (ticket 42). A
// big tree carries it out past the picture's right edge: only the part of
// it inside is a seat, and none once less than half of it is left.
SEATS.treehouse = (c, B) => { const ts = (B.treeSize ?? 100) / 100 * c.k, x0 = 358 * ts, x1 = Math.min(432 * ts, c.x1 - 10);
  return x1 - x0 < 37 * ts ? [] : [{ name: "swing", x0, x1, y: c.g - 72 * ts, z: c.g + 1, facing: ["front"] }]; };
