"use strict";
// (ticket 178) Part 25 of 26 of the game's script, run in order by index.html.

// ===================== THE WORLD =====================
// (ticket 185, Matthew, 2026-10-17) The world designer's model. The world
// (state.world, WORLD_DEFAULT) is places laid on a grid: cells keyed
// "column,row", each a place and its ways out by direction (a forest
// crossing's are its paths). Two neighbours are joined through the ways on
// their shared side, never by wiring a door to a door: the way E of one
// meets the way W of the square to its east, NE meets SW, and so on. A way
// that leads off the map, into an empty square, or to a place with no way
// back is a mistake, listed, as the castle's map lists its own. The insides
// (a house's living room, the castle's rooms, the witch's hut...) are
// reached through their outside's door, so they are off the grid, each with
// an id of its own; so are the places reached their own way (our
// imagination, the empty room). world.at is the square the friend is in.
const WORLD_DIRS = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1] };
const WORLD_OPP = { N: "S", NE: "SW", E: "W", SE: "NW", S: "N", SW: "NE", W: "E", NW: "SE" };
const WORLD_ARROWS = { N: "⬆️", NE: "↗️", E: "➡️", SE: "↘️", S: "⬇️", SW: "↙️", W: "⬅️", NW: "↖️" };
const INSIDES = { house: ["livingroom"], treehouse: ["treeroom"], witch: ["witchroom"], clearing: ["healerroom"], campsite: ["tent"],
                  waterfall: ["cave"], castle: ["castleroom"], lake: ["underwater"], hut: ["hutroom", "hutbed", "hutpotion"] };
const INSIDE_KINDS = new Set(Object.values(INSIDES).flat());
const ELSEWHERE = ["imagination", "emptyroom", "bubblespace"];
// (ticket 195, M) The waterfall's north is the waterfall itself, into the
// cave behind it: "having both and having them mean different things is
// too strange", so no way north on the grid there (WORLD_NO_WAY: never a
// way, as off the map's edge; one kept from before is ignored). And the
// ways a place's own scene has no room for, which 🔗 all passageways
// leaves out (WORLD_UNNATURAL): the beach's sea, the castle and the house
// at their backs, the wood path's diagonals (thick woods either side of its
// one path). A forest crossing has all eight; the insides are off the grid.
const WORLD_NO_WAY = { waterfall: ["N"] };
const WORLD_UNNATURAL = { beach: ["N", "NE", "NW"], castle: ["N"], house: ["N"], woodpath: ["NE", "NW", "SE", "SW"] };
const worldNoWay = (kind, d) => (WORLD_NO_WAY[kind] || []).includes(d);
const worldNatural = (kind, d) => !worldNoWay(kind, d) && !(WORLD_UNNATURAL[kind] || []).includes(d);
// (ticket 186) open water meets open water, and the beach's sea side (its N and corners), nothing else
const SEA_SIDE = ["N", "NE", "NW"], DEEP_WATER = new Set(["sea", "deepsea"]);
function worldNaturalPair(a, d, b) {
  if (worldNoWay(a, d) || worldNoWay(b, WORLD_OPP[d])) return false;
  // (ticket 219: the deep sea is deep water too: it meets open water and other deep sea any way, and nothing on land)
  if (DEEP_WATER.has(a) || DEEP_WATER.has(b)) return (DEEP_WATER.has(a) && DEEP_WATER.has(b)) || (a === "beach" && b === "sea" && SEA_SIDE.includes(d)) || (b === "beach" && a === "sea" && SEA_SIDE.includes(WORLD_OPP[d]));
  return worldNatural(a, d) && worldNatural(b, WORLD_OPP[d]);
}
const worldWays = cell => !cell ? [] : (cell.kind === "crossing" ? CROSS_DIRS.map(([d]) => d).filter(d => cell["cross" + d]) : (cell.ways || [])).filter(d => !worldNoWay(cell.kind, d));
// (Matthew, 2026-10-17: a crossing missing a passageway has no trail and no
// arrow that way) A forest crossing in the world shows only the paths that
// lead somewhere: switched on, and met by a way back from the square beside
// it. Its others are not drawn, and are no mistake. Any other place shows
// all its ways, a way to nowhere grey with 🚧, a mistake to put right.
function worldLiveWays(W, key) {
  const cell = W.cells[key], ways = worldWays(cell);
  if (!cell || cell.kind !== "crossing") return ways;
  return ways.filter(d => { const nb = worldNeighbour(W, key, d), other = W.cells[nb.key]; return !nb.off && other && worldWays(other).includes(WORLD_OPP[d]); });
}
const placeName = kind => (PLACES.find(p => p[0] === kind) || [kind, kind])[1];
// a square's name, as on a map: a letter for the column, a number for the row
const squareName = key => { const [c, r] = key.split(",").map(Number); return String.fromCharCode(65 + c) + (r + 1); };
// (Matthew, 2026-10-17) Every square has a name of its own, for the signs and
// arrows that point to it: the designer's (cell.name), else its place's,
// with where it is (A5) when another square holds that place too. Two
// squares with one name is a warning (worldProblems).
const WORLD_NAME_MAX = 24;
function worldNames(W, theirs = true) {   // (theirs false: the names the places give, as the box's hint)
  const keys = worldKeys(W), count = {};
  for (const k of keys) { const kd = W.cells[k].kind; count[kd] = (count[kd] || 0) + 1; }
  return Object.fromEntries(keys.map(k => { const c = W.cells[k], own = theirs ? String(c.name || "").trim().slice(0, WORLD_NAME_MAX) : "";
    return [k, own || (count[c.kind] > 1 ? `${placeName(c.kind)} ${squareName(k)}` : placeName(c.kind))]; }));
}
const worldName = (W, key) => worldNames(W)[key] || "";
// (M, 2026-10-17: so there's no way to make that mistake) a way out of a square off the map's edge can't be turned on
const worldOffMap = (W, key, d) => worldNeighbour(W, key, d).off;
// (M, 2026-10-17; ticket 191, Matthew: and "when taking away a passage
// fixes the error -- especially when passages are placed that lead to empty
// grid squares") The ways out of a square whose toggle would put a warning
// right: off ones that, on, would leave fewer warnings (one meeting a way
// that waits for it, or joining a square no one could reach), and on ones
// that, taken away, would (one into an empty square, off the map, or to a
// square with no way back). Never one that only trades one warning for
// another.
function worldWaysToToggle(W, key, now = worldProblems(W).length) {
  const cell = W.cells[key], out = { on: [], off: [] };
  if (!cell) return out;
  const ways = worldWays(cell);
  for (const d of Object.keys(WORLD_DIRS)) {
    const isOn = ways.includes(d);
    if (!isOn && (worldOffMap(W, key, d) || worldNoWay(cell.kind, d))) continue;
    const c2 = cell.kind === "crossing" ? { ...cell, ["cross" + d]: !isOn } : { ...cell, ways: isOn ? ways.filter(x => x !== d) : [...ways, d] };
    if (worldProblems({ ...W, cells: { ...W.cells, [key]: c2 } }).length < now) out[isOn ? "off" : "on"].push(d);
  }
  return out;
}
const worldWaysToTurnOn = (W, key) => worldWaysToToggle(W, key).on;
// (ticket 195, M: "place matching passage ways on all adjacent grid squares, but only if both sides
// the scene naturally have those passage ways there") every pair of neighbouring squares whose places
// both have that way by nature, joined both ways; how many ways were added
function worldJoinAll(W) {
  let added = 0;
  const order = Object.keys(WORLD_DIRS);
  for (const key of worldKeys(W)) {
    const a = W.cells[key];
    if (INSIDE_KINDS.has(a.kind)) continue;
    for (const d of order) {
      const nb = worldNeighbour(W, key, d), b = W.cells[nb.key];
      if (nb.off || !b || INSIDE_KINDS.has(b.kind) || !worldNaturalPair(a.kind, d, b.kind) || worldWays(a).includes(d)) continue;
      if (a.kind === "crossing") a["cross" + d] = true;
      else a.ways = order.filter(x => x === d || worldWays(a).includes(x));
      added++;
    }
  }
  // (the square the friend is in, a crossing: its paths are the place's settings too)
  const at = W.at && W.cells[W.at], B = state.background;
  if (at && at.kind === "crossing" && B.kind === "crossing") for (const d of order) B["cross" + d] = !!at["cross" + d];
  return added;
}
// (ticket 191: "the red square on the grid should correspond to the placement of the dotted red
// suggestion", not its neighbour) the squares whose ways could put a warning right; and for a warning
// no way can (a name twice, an inside on the grid, no start), its own square
function worldFixSquares(W, P = worldProblems(W)) {
  const now = P.length, red = new Set();
  for (const key of worldKeys(W)) { const t = worldWaysToToggle(W, key, now); if (t.on.length || t.off.length) red.add(key); }
  for (const p of P) if (!p.dir && !/can't be reached/.test(p.text) && p.key) red.add(p.key);
  return red;
}
// the square the way d out of key leads to, if it meets a way back there; else null
function worldMeets(W, key, d) {
  const nb = worldNeighbour(W, key, d), other = W.cells[nb.key];
  return !nb.off && other && worldWays(other).includes(WORLD_OPP[d]) ? nb.key : null;
}
const worldKeys = W => Object.keys(W.cells).sort((a, b) => { const [ac, ar] = a.split(",").map(Number), [bc, br] = b.split(",").map(Number); return ar - br || ac - bc; });
function worldNeighbour(W, key, d) {
  const [c, r] = key.split(",").map(Number), [dx, dy] = WORLD_DIRS[d], nc = c + dx, nr = r + dy;
  return { key: nc + "," + nr, off: nc < 0 || nr < 0 || nc >= W.cols || nr >= W.rows };
}
// the places off the grid, each with its id: the insides, by their outside's square, then the rest
function worldOffGrid(W) {
  const out = []; let n = 0;
  for (const key of worldKeys(W)) for (const kind of INSIDES[W.cells[key].kind] || []) out.push({ id: "inside " + (++n), kind, from: key });
  ELSEWHERE.forEach((kind, i) => out.push({ id: "elsewhere " + (i + 1), kind, from: null }));
  return out;
}
function worldProblems(W) {
  const P = [], name = key => `${placeName(W.cells[key].kind)} (${squareName(key)})`;
  for (const key of worldKeys(W)) {
    const cell = W.cells[key];
    if (INSIDE_KINDS.has(cell.kind)) P.push({ key, text: `${name(key)} is an inside: put its outside on the grid instead, and it comes with it.` });
    for (const d of cell.kind === "crossing" ? worldLiveWays(W, key) : worldWays(cell)) {   // (a crossing's dead ends are no mistake: not drawn)
      const nb = worldNeighbour(W, key, d), other = W.cells[nb.key];
      if (nb.off) P.push({ key, dir: d, text: `The way ${WORLD_ARROWS[d]} out of ${name(key)} leads off the map.` });
      else if (!other) P.push({ key, dir: d, to: nb.key, text: `The way ${WORLD_ARROWS[d]} out of ${name(key)} leads to an empty square, ${squareName(nb.key)}.` });
      else if (!worldWays(other).includes(WORLD_OPP[d])) P.push({ key, dir: d, to: nb.key, text: `The way ${WORLD_ARROWS[d]} out of ${name(key)} meets ${name(nb.key)}, which has no way back ${WORLD_ARROWS[WORLD_OPP[d]]}.` });
    }
  }
  // every square reached from the friend's start, through ways that meet
  const seen = new Set(), q = W.cells[W.start] ? [W.start] : [];
  if (!q.length) P.push({ key: null, text: W.start ? `The friend starts at ${squareName(W.start)}, an empty square.` : "The world has no start." });
  q.forEach(k => seen.add(k));
  while (q.length) {
    const key = q.shift();
    for (const d of worldWays(W.cells[key])) {
      const nb = worldNeighbour(W, key, d), other = W.cells[nb.key];
      if (!nb.off && other && worldWays(other).includes(WORLD_OPP[d]) && !seen.has(nb.key)) { seen.add(nb.key); q.push(nb.key); }
    }
  }
  if (seen.size) for (const key of worldKeys(W)) if (!seen.has(key) && !INSIDE_KINDS.has(W.cells[key].kind))
    P.push({ key, text: `${name(key)} can't be reached from where the friend starts (${squareName(W.start)}).` });
  // two squares with one name: a sign could not say which it means
  const names = worldNames(W), by = {};
  for (const [k, nm] of Object.entries(names)) (by[nm.toLowerCase()] = by[nm.toLowerCase()] || []).push(k);
  for (const ks of Object.values(by)) if (ks.length > 1)
    P.push({ key: ks[0], to: ks[1], text: `${ks.length === 2 ? "Two" : ks.length} squares are named "${names[ks[0]]}": ${ks.map(squareName).join(", ")}. Give one a name of its own.` });
  return P;
}
// What a square keeps of its place, as the Background tab edits it
// (state.background), so the square opened is the square changed: its
// things, any place's; and a forest crossing's paths and floor.
const CROSS_KEYS = ["crossN", "crossNE", "crossE", "crossSE", "crossS", "crossSW", "crossW", "crossNW", "crossFloor", "crossBack"];
const cellKeys = kind => kind === "crossing" ? ["things", ...CROSS_KEYS] : ["things"];
// where the friend comes in, walking into a square from a side: just
// inside that side, as if they had come through it (the stage's units, as
// figX and figY: across, and nearer or farther than the ground line)
const WORLD_IN = { N: [0, -70], S: [0, 75], E: [270, 30], W: [-270, 30], NE: [210, -55], NW: [-210, -55], SE: [230, 70], SW: [-230, 70] };
// go to a square: the friend into its place, with its own settings; from a
// side when walking in through it, else where the place puts them
function worldEnter(key, side = null, draw = true) {
  const W = state.world, cell = W.cells[key];
  if (!cell) return;
  W.at = key;
  const B = state.background;
  B.kind = cell.kind;
  for (const k of cellKeys(cell.kind)) B[k] = structuredClone(cell[k] ?? (k === "things" ? [] : DEFAULTS.background[k]));
  [B.figX, B.figY] = side ? WORLD_IN[side] : ARRIVE[cell.kind] || [0, 0]; arriveSettle = true;
  if (draw) changed();
}
// The ways out of the square the friend is in (Matthew, 2026-10-17: "how do
// I access those passageways in the game?"; then: only when near them, and
// on top of the picture's buttons; and their words on short lines, kept on
// the screen). In the picture, each way is an invisible doorway (data-way)
// at the edge it leads off: N at the far end of the ground, S at the
// bottom, E and W at the sides, the four between at the corners. It is what
// the friend walks to, what glows when they are near, what X goes through.
// Over the picture and its buttons, in #ways, each way's arrow, a bobbing
// triangle pointing out, shown only while the friend's feet are within
// reach of it (WAY_NEAR): then it is on top, and a tap on it walks through;
// hidden, it takes no taps. Its words, where it leads, on two short lines,
// on its side toward the middle of the picture. A way that is a mistake,
// leading nowhere, is grey, 🚧, and goes nowhere. A forest crossing shows
// only its live ways (worldLiveWays).
// (Matthew, 2026-10-17: M finds the warnings distracting) The World design
// tab's warnings are hidden unless asked for: a chip near its top shows how
// many there are, and "show warnings" lists them and marks their squares in
// red. Whether they show is the browser's own (localStorage
// "dress-up-world-warnings"), not the friend's, so not in saves.
const WORLD_WARN_KEY = "dress-up-world-warnings";
let worldWarnShown = false;
try { worldWarnShown = localStorage.getItem(WORLD_WARN_KEY) === "1"; } catch (_) { /* (hidden) */ }
function worldWarnShow(on) {
  worldWarnShown = on;
  try { if (on) localStorage.setItem(WORLD_WARN_KEY, "1"); else localStorage.removeItem(WORLD_WARN_KEY); } catch (_) { /* (for this visit only) */ }
}
// (Matthew, 2026-10-17: by the feet, not the whole body, and on the floor,
// with depth and perspective) A way is a spot on the ground: N at the far
// line, S at the near edge, E and W at the sides. How near the friend is to
// it is measured on the floor: the feet and the spot each taken where they
// are on the ground, the perspective undone (floorAt: across by the size
// a thing has there, away as the eye's distance at the arrival over it),
// so a step toward the horizon covers more ground than one near us.
// Near is within WAY_NEAR, or half the way's distance from the middle of
// the floor if that is less (the near edge is only a step in front of
// where the friend arrives: S would show from the middle). Feet gone past
// a way, toward its edge, count as at it (wayNearness: below 1, near).
const WAY_NEAR = 170, WAY_DEPTH = 500;   // (the floor's units: the stage's, at the place's arrival size)
const WAY_OUT = { N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0], NE: [1, 1], NW: [-1, 1], SE: [1, -1], SW: [-1, -1] };   // (outward, on the floor: across, away)
let worldWaysAt = [];   // (each way's [direction, x, y, angle, leads to], as last drawn)
function floorAt(B, x, y) { const s = Math.max(0.05, depthSize(B, y - SCENE.ground)); return [x / s, WAY_DEPTH / s]; }
// (ticket 187) how near the feet are to a spot on the floor, as a share of
// how near counts (below 1: within reach): within WAY_NEAR, or half the
// spot's distance from the floor's middle if that is less (never under
// PASS_MIN); o, a way's outward direction, counts feet gone past the spot,
// toward its edge, as at it. The nav arrows' measure, and every passage's
// that stands on the floor (doors, signs, ladders, pits: passesNear).
const PASS_MIN = 60;
function floorNearness(x, y, o = null) {
  // (0.0.159: a spot past the back limit, where the friend cannot go (the clearing's castle sign, its tree house's
  // doorway), is measured at the limit: since 0.0.153's 🔭 shrinks a place's far edge so much, the depth between the
  // limit and a spot beyond it, in the floor's own measure, had put such passages out of anyone's reach; passages187)
  const yb = SCENE.ground + figYMin(sceneFrame);
  if (y < yb) y = yb;
  const B = state.background, a = floorAt(B, x, y), f = floorAt(B, B.figX ?? 0, SCENE.ground + (B.figY ?? 0));
  const c = floorAt(B, 0, SCENE.ground + (ARRIVE[B.kind] || [0, 0])[1]);
  const at = i => o && o[i] && (f[i] - a[i]) * o[i] > 0 ? a[i] : f[i];
  return Math.hypot(at(0) - a[0], at(1) - a[1]) / Math.max(PASS_MIN, Math.min(WAY_NEAR, Math.hypot(a[0] - c[0], a[1] - c[1]) / 2));
}
function wayNearness(d) {
  const w = worldWaysAt.find(e => e[0] === d);
  return w && WAY_OUT[d] ? floorNearness(w[1], w[2], WAY_OUT[d]) : Infinity;
}
// (the way X goes through, aimed at: its arrow glows, as a door's frame does)
function worldWaysAim(d) {
  for (const el of document.querySelectorAll("#ways .way-arrow")) { const on = el.dataset.way === d; if (el.classList.contains("aimed") !== on) el.classList.toggle("aimed", on); }
}
// (ticket 233, Matthew: "the implicit exit on the S of some rooms was missing an indicator to the game player -- but
// the nav arrows are the UX way we've chosen"; "rather than render a sign to indicate it and offer a click, we use the
// nav arrow UX now") A place off the grid has ways toward us too: the living room's door out (livingOut), a tree room's
// (treeBackN), a castle room's (castleSouthWays). Each that leads somewhere is a way as a world square's is, an
// invisible doorway at the bottom edge (data-way, and its own data-to: enterScene goes there, not to a square beside)
// and an arrow over the picture when the friend is near; one leading nowhere is not there at all.
function insideWays(B) {
  const to = kd => { const P = kd && kd !== "none" && PLACES.find(p => p[0] === kd); return P ? [{ d: "S", to: kd, attrs: `data-to="${kd}"`, label: P[1] }] : []; };
  if (B.kind === "livingroom") return to(B.livingOut);
  if (B.kind === "hutroom") return to("hut");   // (ticket 278: toward us, out of the grass hut)
  if (B.kind === "treeroom") return to(B["treeBack" + Math.max(1, Math.min(6, B.houses ?? 4, Math.round(B.inside ?? 1)))]);
  if (B.kind === "castleroom") { const K = castleOf(B); return castleSouthWays(K, Math.max(1, Math.min(K.rooms.length, Math.round(B.castleRoom ?? 1)))); }
  return [];
}
// (a way's doorway: invisible, and not tapped, the arrow over the picture is; its shape, the triangle, is what the glow frames)
const wayTri = (x, y, a, k) => { const r = 28 * k;
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a})"><path d="M${f1(-0.6 * r)} ${f1(-0.8 * r)} L${f1(0.9 * r)} 0 L${f1(-0.6 * r)} ${f1(0.8 * r)} Z" fill="#000000" opacity="0"/></g>`; };
function insideWaysSvg(B, x0, y0, x1, y1) {
  const IW = insideWays(B), k = (y1 - y0) / 700;
  // (where the world's ways toward us are: worldWaysSvg's AT)
  const AT = { S: [0, y1 - 30 * k, 90], SE: [x1 - 60 * k, y1 - 50 * k, 40], SW: [x0 + 60 * k, y1 - 50 * k, 140] };
  worldWaysAt = IW.map(w => [w.d, ...AT[w.d], { kind: w.to }, w.label, w.attrs]);
  worldWaysHud();
  if (!IW.length) return "";
  return SEP + part("inside-ways", [B.kind, IW.map(w => w.d + w.attrs).join(), x0, y0, x1, y1], () => worldWaysAt.map(([d, x, y, a, , , attrs]) =>
    obj(`way ${d}`, Infinity, `<g class="portal way-out" data-door="1" data-way="${d}" ${attrs} pointer-events="none">${wayTri(x, y, a, k)}</g>`)).join(""));
}
function worldWaysSvg(B, x0, y0, x1, y1, g) {
  const W = state.world, cell = W && W.at && W.cells[W.at];
  if (!cell || cell.kind !== B.kind) return insideWaysSvg(B, x0, y0, x1, y1);
  const ways = worldLiveWays(W, W.at);
  const meets = d => { const key = worldMeets(W, W.at, d); return key ? W.cells[key] : null; }, names = worldNames(W);
  const k = (y1 - y0) / 700;
  // (a forest crossing's at its own paths' ends: crossGeom; any other place's at its far ground and sides)
  const G = B.kind === "crossing" ? crossGeom({ x0, x1, y1, g, W: x1 - x0, k, pad: 0 }) : null;
  // (0.0.151: 0.0.149 put the far ways (N, NE, NW) at the place's back limit where that was nearer; on a shallow floor,
  // the witch's woods, or in a small window, they crowded the E and W arrows (arrows208), so they are at the far line
  // again: a tap walks as far as the back limit, and walking on into the edge takes the way, wherever its arrow is)
  const far = G ? G.far + 10 * k : g - 150 * k, mid = G ? G.cy + 14 * k : g + 40 * k, side = G ? 0.6 : 0.55;
  const AT = { N: [0, far - 6 * k, -90], S: [0, y1 - 30 * k, 90], E: [x1 - 45 * k, mid, 0], W: [x0 + 45 * k, mid, 180],
               NE: [x1 * side, far, -40], NW: [x0 * side, far, -140], SE: [x1 - 60 * k, y1 - 50 * k, 40], SW: [x0 + 60 * k, y1 - 50 * k, 140] };
  worldWaysAt = ways.map(d => [d, ...AT[d], meets(d), meets(d) ? names[worldMeets(W, W.at, d)] : null]);
  worldWaysHud();
  if (!ways.length) return "";
  const sig = worldWaysAt.map(([d, , , , to, nm]) => d + (to ? to.kind + ":" + nm : "-")).join();
  return SEP + part("world-ways", [W.at, B.kind, sig, x0, y0, x1, y1, g], () => worldWaysAt.map(([d, x, y, a, to]) => {
    const tri = wayTri(x, y, a, k);
    return obj(`way ${d}`, Infinity, to ? `<g class="portal way-out" data-door="1" data-way="${d}" pointer-events="none">${tri}</g>` : `<g class="way-out nowhere" pointer-events="none">${tri}</g>`);
  }).join(""));
}
// The arrows over the picture: made again when the ways change, placed and
// shown or hidden on every drawing (cheap: a few at most)
let waysShown = null;
function worldWaysHud() {
  const layer = document.getElementById("ways");
  if (!layer) return;
  const sig = worldWaysAt.map(([d, , , , to, nm]) => d + (to ? to.kind + ":" + nm : "-")).join();
  if (sig !== waysShown) {
    waysShown = sig;
    layer.replaceChildren(...worldWaysAt.map(([d, , , a, to, nm]) => {
      const b = document.createElement("button");
      b.className = "way-arrow" + (to ? "" : " nowhere"); b.dataset.way = d; b.type = "button";
      b.style.setProperty("--a", a + "deg");
      b.setAttribute("aria-label", to ? `Go ${d}, to ${nm}` : `The way ${d} leads nowhere yet`);
      const tri = document.createElement("span"); tri.className = "way-tri";
      const words = document.createElement("span"); words.className = "way-words";
      words.append(to ? WORLD_ARROWS[d] : "🚧 " + WORLD_ARROWS[d], document.createElement("br"), to ? nm : "nowhere yet");
      b.append(tri, words);
      b.addEventListener("click", () => { const p = to && bgShown.node && bgShown.node.querySelector(`.portal[data-way="${d}"]`); if (p && !entering) enterScene(p); });
      return b;
    }));
  }
  if (!worldWaysAt.length) return;
  const M = pic.getScreenCTM(), box = layer.getBoundingClientRect(), B = state.background;
  if (!M || !box.width) return;
  // (ticket 217) ♿: every arrow shown (the far ones dimmer, in their own colour), their size, their words' size
  const A = state.access || DEFAULTS.access, sc = (A.arrowSize ?? 100) / 100, all = !!A.allArrows, edge = 22 * sc;
  const vars = [["--arrow-scale", String(sc)], ["--arrow-dim", String((A.arrowDim ?? 45) / 100)], ["--arrow-color", A.arrowColor || "#38bdf8"]];
  for (const [k, v] of vars) if (layer.style.getPropertyValue(k) !== v) layer.style.setProperty(k, v);
  const at = [];
  worldWaysAt.forEach(([d, x, y, a], i) => {
    const el = layer.children[i];
    if (!el) return;
    const p = new DOMPoint(x, y).matrixTransform(M), near = wayNearness(d) < 1;
    // (kept inside the picture, by its size)
    const left = Math.max(edge, Math.min(box.width - edge, p.x - box.left)), top = Math.max(edge, Math.min(box.height - edge, p.y - box.top));
    // (its words toward the middle: left of an arrow on the right, below one at the top...)
    const side = /E/.test(d) && !/W/.test(d) ? "left" : /W/.test(d) ? "right" : d === "N" ? "below" : "above";
    if (el.dataset.side !== side) el.dataset.side = side;
    if (el.classList.contains("near") !== near) el.classList.toggle("near", near);
    if (el.classList.contains("always") !== all) el.classList.toggle("always", all);
    at.push({ d, el, x: left, y: top, a, side, shown: all || near || el.classList.contains("aimed"), far: all && !near && !el.classList.contains("aimed") });
  });
  waysApart(at.filter(w => w.shown), box, sc);
  for (const w of at) { const l = w.x.toFixed(0) + "px", t = w.y.toFixed(0) + "px"; if (w.el.style.left !== l) w.el.style.left = l; if (w.el.style.top !== t) w.el.style.top = t;
    if (w.el.classList.contains("terse") !== !!w.terse) w.el.classList.toggle("terse", !!w.terse); }
}
// (ticket 217, Matthew: "toggle to show the planned path each time it's created
// and being executed in game") ♿ the planned path (walkPath, ticket 215) drawn
// over the picture while the walk to a passage lasts: dotted, its corners
// marked, the part walked faded; gone when they arrive
// (ticket 217) ♿ the words' size: a variable on the page, and the class that scales the place's words, only off 100
let gameFontShown = null;
function accessApply() {
  const A = state.access || DEFAULTS.access, al = document.getElementById("access-layer");
  if (al) for (const [k, v] of [["--path-color", A.pathColor || "#fde047"], ["--box-color", A.boxColor || "#ef4444"],
                                 ["--path-width", (A.pathWidth ?? 4) + "px"], ["--box-width", (A.boxWidth ?? 2) + "px"], ["--box-font", (A.boxFont ?? 11) + "px"],   // (ticket 230)
                                 ["--path-alt", A.pathAltColor || "#c084fc"], ["--made-color", A.madeColor || "#ffffff"], ["--made-width", (A.madeWidth ?? 2) + "px"], ["--made-font", (A.madeFont ?? 10) + "px"]])   // (ticket 258)
    if (al.style.getPropertyValue(k) !== v) al.style.setProperty(k, v);
  const gf = (A.gameFont ?? 100) / 100;
  if (gf === gameFontShown) return;
  gameFontShown = gf;
  document.documentElement.style.setProperty("--game-font", String(gf));
  document.body.classList.toggle("game-font", gf !== 1);
}
// (ticket 217, Matthew: "show the collision boxes you are using for collision tests, if you can") ♿ what the
// friend's feet are kept out of, as solidAt tests it: each solid's box on the floor (grown by the margin the feet
// keep, SOLID_MARGIN), named; a castle room's side walls (castleWalls: the half width at each depth); and the back
// limit the feet stop at (figYMin: a back wall's foot, else the frame's). Drawn over the picture, in the picture's
// own units through the screen; only when shown, and the page changed only when they move.
// (0.0.139, Matthew: "some bug with scaling the font or arrow size misplaces them in the scene"; "collision boxes
// should not disappear until we untoggle them") The overlays have a layer of their own (#access-layer): put in the
// arrows' (#ways), whose children are its arrows by index, the boxes put first shifted every arrow onto another's
// place, and each new square's arrows replaced the layer, boxes and all.
let solidsShown = "";
function solidsHud() {
  const layer = document.getElementById("access-layer");
  if (!layer) return;
  const on = !!(state.access || DEFAULTS.access).showSolids && state.background.kind !== "none";
  let ov = layer.querySelector("svg.solid-boxes");
  if (!on) { if (ov) ov.remove(); solidsShown = ""; return; }
  const M = pic.getScreenCTM(), box = layer.getBoundingClientRect();
  if (!M || !box.width) return;
  const F = sceneFrame, g = SCENE.ground, W = castleWalls(state.background), m = 0;   // (the soles have their own size now: a box as it is, no margin)
  const sc = (x, z) => { const q = new DOMPoint(x, z).matrixTransform(M); return [q.x - box.left, q.y - box.top]; };
  const pts = a => a.map(q => q.map(v => v.toFixed(1)).join(",")).join(" ");
  const back = g + figYMin(F), zs = Array.from({ length: 9 }, (_, i) => back + (F.bottom - back) * i / 8);
  // (each its footprint on the floor, and its front face up as tall as the thing, o.h, so it stands over what it is)
  const solids = solidsHere().map(o => ({ name: o.name, q: [[o.x0 - m, o.back], [o.x1 + m, o.back], [o.x1 + m, o.front], [o.x0 - m, o.front]].map(([x, z]) => sc(x, z)),
    // (0.0.153: a trunk's faces, its bands up from the ground, leaning as a palm's trunk leans)
    faces: solidBands(o).map(b => { const hi = Number.isFinite(b.hi) ? b.hi : 0; return [[b.x0 - m, o.front - b.lo], [b.x1 + m, o.front - b.lo], [b.x1 + m, o.front - hi], [b.x0 - m, o.front - hi]].map(([x, z]) => sc(x, z)); }) }));
  const walls = W ? [-1, 1].map(sd => zs.map(z => sc(sd * (W.half(z) - m), z))) : [];
  const line = [sc(F.left, back), sc(F.right, back)];
  // (0.0.157) a trap room's pits: the hole one falls into (PIT_EDGE of it), which a planned walk goes round
  const pitsShown = pitsHere().map(q => { const c0 = sc(q.cx, q.cy), cx = sc(q.cx + PIT_EDGE * q.rx, q.cy), cz = sc(q.cx, q.cy + PIT_EDGE * q.ry);
    return [...[c0[0], c0[1], Math.abs(cx[0] - c0[0]), Math.abs(cz[1] - c0[1])].map(v => +v.toFixed(1)), q.name, q.shape || "circle"]; });   // (ticket 252: by its opening's shape)
  // (ticket 245) the tree house's rope bridges: the way along each, the only way to go on one (no box: no way across it)
  const walks = treeWalks().map(W => ({ name: `bridge ${W.a + 1}–${W.b + 1}`, at: Array.from({ length: 25 }, (_, i) => sc(...walkAt(W, i / 24))) }));
  const sig = JSON.stringify([solids.map(o => pts(o.q) + o.faces.map(pts).join("|")), walls.map(pts), pts(line), pitsShown, walks.map(w => pts(w.at))]);
  if (sig !== solidsShown || !ov) {
    solidsShown = sig;
    if (!ov) { ov = document.createElementNS("http://www.w3.org/2000/svg", "svg"); ov.setAttribute("class", "solid-boxes"); layer.prepend(ov); }
    ov.innerHTML = `<polyline class="back" points="${pts(line)}"/>` + walls.map(w => `<polyline class="wall" points="${pts(w)}"/>`).join("") +
      walks.map(w => `<g data-walk="${xmlEsc(w.name)}"><polyline class="walk" points="${pts(w.at)}"/><polyline class="walk-mid" points="${pts(w.at)}"/></g>` +
        `<text x="${(w.at[12][0] - 30).toFixed(1)}" y="${(w.at[12][1] + 22).toFixed(1)}">${xmlEsc(w.name)}: along it</text>`).join("") +
      pitsShown.map(([x, y, rx, ry, name, sh]) => `<g data-solid="${xmlEsc(name)}"><path class="pit" d="${openingD(sh, x, y, rx, ry)}"/></g><text x="${(x - rx + 4).toFixed(1)}" y="${(y + ry + 13).toFixed(1)}">${xmlEsc(name)}: falls in</text>`).join("") +
      solids.map(o => `<g data-solid="${xmlEsc(String(o.name))}">${o.faces.map(f => `<polygon class="face" points="${pts(f)}"/>`).join("")}<polygon points="${pts(o.q)}"/></g><text x="${o.q[3][0].toFixed(1)}" y="${(o.q[3][1] + 13).toFixed(1)}">${xmlEsc(String(o.name))}</text>`).join("") +
      `<g class="you"><polygon/><polygon/><polygon class="torso"/><polygon class="face torso"/><text>you</text></g>`;
    solidsHitShown = -1;
  }
  // (ticket 229, Matthew: "let's also show the collision box of the player, and let's animate ... the event of a
  // collision, by the two boxes glowing and then fading back to normal colors. Add fade rate") the friend's own box: to
  // the game they are a point at their feet, kept out of each box by the margin, so a box that wide about their feet,
  // as deep as a step; and on a collision (solidHit) it and the box it met (or the walls) glow and fade back, a CSS
  // animation as long as ♿'s glow fade, begun again while they keep pushing
  const Bg = state.background, fx = Bg.figX ?? 0, fz = g + (Bg.figY ?? 0), you = ov.querySelector(".you");
  if (you) { const soles = feetSoles(fx, fz), polys = you.querySelectorAll("polygon"), foot = s => [[s[0], s[2]], [s[1], s[2]], [s[1], s[3]], [s[0], s[3]]].map(([x, z]) => sc(x, z));
    // (Matthew: one under each foot, the size of its sole; and the torso's, as wide as the gap between them, its face
    // standing from the crotch, the hips' joints, up through the head, the crown, as drawn: figureT, faceFrame)
    for (let i = 0; i < 2; i++) polys[i].setAttribute("points", soles[i] ? pts(foot(soles[i])) : "");
    const t = torsoBox(fx, soles), T = figureT, J = poseJoints, up = y => T.dy + T.sg + T.k * (y - T.g);
    const crotch = J && J.legs && J.legs.length ? up(Math.max(...J.legs.map(l => l.H[1]))) : fz, crown = up(faceFrame.ty + headCrown(state.face) * faceFrame.s);
    polys[2].setAttribute("points", t ? pts(foot(t)) : "");
    polys[3].setAttribute("points", t ? pts([[t[0], crotch], [t[1], crotch], [t[1], crown], [t[0], crown]].map(([x, y]) => sc(x, y))) : "");
    const q0 = sc(Math.min(...soles.map(s => s[0])), Math.max(...soles.map(s => s[3]))); you.lastChild.setAttribute("x", (q0[0] + 2).toFixed(1)); you.lastChild.setAttribute("y", (q0[1] + 12).toFixed(1)); }
  if (!swingHudOn && Bg.kind === "treehouse") { swingHudOn = true; requestAnimationFrame(swingHud); }   // (ticket 240)
  const A = state.access || DEFAULTS.access, fade = Math.max(100, A.glowFade ?? 800) + "ms";
  if (ov.style.getPropertyValue("--glow-fade") !== fade) ov.style.setProperty("--glow-fade", fade);
  if (solidHit.n !== solidsHitShown && solidHit.name && performance.now() - solidHit.t < 1000) {
    solidsHitShown = solidHit.n;
    const els = [you, ...(solidHit.name === "wall" ? ov.querySelectorAll(".wall") : ov.querySelectorAll(`[data-solid="${CSS.escape(xmlEsc(String(solidHit.name)))}"]`))];
    for (const el of els) if (el) { el.classList.remove("hit"); void el.getBoundingClientRect(); el.classList.add("hit"); }
  }
}
let solidsHitShown = -1;
// (ticket 258, Matthew: "under accessibility (using that word as a pun now, and using that panel because it also has
// collision box controls) ... showing all of the 'objects' that are baked into the background options, with their
// bounding box and label. OBJECTS.md content should appear, right? I'm very curious to see how the decomposition into
// re-usable procedures visually represented, even if those objects are not positionable, and are fixed in the scene.
// Let's start with all plants, in all scenes"; "maybe this toggle should really be a toggle that reveals a sub-panel of
// toggles, per category of object") ♿ 🧩 what a place is made of: its objects (its objects list, OBJECTS.md's: each
// obj() and its name), each boxed and named; and its plants, each boxed and named by the procedure that drew it (its
// drawing's [data-proc], drawnBy; a <use> by the drawing it uses), nested as they are drawn (a tree's leaf pads inside
// the tree); each kind a toggle of its own (MADE_CATS, access.madeCats), with how many are here (madeCounts); a legend.
const MADE_CATS = [["objects", "🧩 objects (each place's list)", true], ["trees", "🌳 leafy trees", true], ["pines", "🌲 pines", true],
                   ["palms", "🌴 palms", true], ["bushes", "🌿 bushes", true], ["flowers", "🌷 flowers", true], ["leafy", "🍀 ferns, vines and leaves", true],
                   ["pads", "🍃 leaf pads", false], ["grass", "🌾 grass", false]];
// (each procedure's kind)
const PROC_CAT = { leafyTree: "trees", pineTree: "pines", palm: "palms", palmTrunkSvg: "palms", beachPalm: "palms", bushSvg: "bushes", hibiscus: "bushes",
                   tulip: "flowers", daisy: "flowers", paradise: "flowers", fern: "leafy", monstera: "leafy", vine: "leafy", ivy: "leafy", kelp: "leafy",
                   lilyPads: "leafy", padSvg: "pads", padDef: "pads", grassTuft: "grass" };
const madeCatOn = cat => { const m = (state.access || DEFAULTS.access).madeCats || {}; return cat in m ? !!m[cat] : !!(MADE_CATS.find(c => c[0] === cat) || [])[2]; };
let madeShown = "", madeCounts = {};
const procHue = name => [...name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 360, 17);
// (a <use>'s procedure: the one its drawing is, or holds)
const useProc = el => { const id = (el.getAttribute("href") || el.getAttribute("xlink:href") || "").slice(1), d = id && document.getElementById(id);
  if (!d) return null; if (d.dataset.proc) return d.dataset.proc; const q = d.querySelector("[data-proc]"); return q ? q.dataset.proc : null; };
function madeOfHud() {
  const layer = document.getElementById("access-layer");
  if (!layer) return;
  const A = state.access || DEFAULTS.access, node = bgShown.node, on = !!A.showMadeOf && !!node && state.background.kind !== "none";
  let ov = layer.querySelector("svg.made-of"), leg = layer.querySelector(".made-legend");
  if (!on) { if (ov) ov.remove(); if (leg) leg.remove(); madeShown = ""; return; }
  const box = layer.getBoundingClientRect();
  if (!box.width) return;
  const cats = MADE_CATS.map(c => c[0]).filter(madeCatOn), sig = [box.width, box.height, cats.join()].join("|");   // (its colour, line and names' size: CSS, accessApply)
  if (ov && madeShown === sig && ov.dataset.text === String(bgShown.text.length) && madeOfHud.text === bgShown.text) return;
  madeShown = sig; madeOfHud.text = bgShown.text;
  // (a box on the screen, in the layer's own units, cut to it; none when it is not seen)
  const cut = el => { const r = el.getBoundingClientRect(); const x0 = Math.max(0, r.left - box.left), y0 = Math.max(0, r.top - box.top), x1 = Math.min(box.width, r.right - box.left), y1 = Math.min(box.height, r.bottom - box.top);
    return x1 - x0 > 1 && y1 - y0 > 1 ? [x0, y0, x1, y1] : null; };
  const rect = (q, cls, style = "") => `<rect class="${cls}"${style} x="${q[0].toFixed(1)}" y="${q[1].toFixed(1)}" width="${(q[2] - q[0]).toFixed(1)}" height="${(q[3] - q[1]).toFixed(1)}"/>`;
  const label = (q, text, style = "") => q[2] - q[0] >= 36 && q[3] - q[1] >= 14 ? `<text${style} x="${(q[0] + 3).toFixed(1)}" y="${(q[1] + 11).toFixed(1)}">${xmlEsc(text)}</text>` : "";
  let t = "";
  const counts = {}, procs = {};
  // the plants, each by its procedure
  for (const el of node.querySelectorAll("[data-proc], use")) {
    if (el.closest(PROC_HIDDEN)) continue;
    const name = el.tagName.toLowerCase() === "use" ? useProc(el) : el.dataset.proc, cat = name && PROC_CAT[name];
    if (!cat) continue;
    const q = cut(el);
    if (!q) continue;
    counts[cat] = (counts[cat] || 0) + 1; procs[name] = (procs[name] || 0) + 1;
    if (!cats.includes(cat)) continue;
    const st = ` style="--c:hsl(${procHue(name)} 85% 62%)"`;
    t += `<g class="proc">` + rect(q, "", st) + label(q, name, st) + `</g>`;
  }
  // the objects, OBJECTS.md's
  counts.objects = 0;
  for (const o of bgShown.objs) { const q = cut(o.node); if (!q) continue; counts.objects++;
    if (cats.includes("objects")) t += `<g class="obj">` + rect(q, "under") + rect(q, "") + label(q, o.name) + `</g>`; }
  madeCounts = counts;
  if (!ov) { ov = document.createElementNS("http://www.w3.org/2000/svg", "svg"); ov.setAttribute("class", "made-of"); layer.prepend(ov); }
  ov.dataset.text = String(bgShown.text.length);
  ov.innerHTML = t;
  if (!leg) { leg = document.createElement("div"); leg.className = "made-legend"; layer.append(leg); }
  const shown = Object.entries(procs).filter(([nm]) => cats.includes(PROC_CAT[nm])).sort((a, b) => b[1] - a[1]);
  leg.innerHTML = `🧩 ${counts.objects} objects` + (shown.length ? " · drawn by: " + shown.map(([nm, n]) => `<b style="--c:hsl(${procHue(nm)} 85% 62%)">${xmlEsc(nm)}</b> ×${n}`).join(" · ") : "");
  for (const f of madeSyncs) f(); for (const f of hudMadeSyncs) f();   // (the 🔬 chips' counts, and nothing else: ticket 236)
}
const PROC_HIDDEN = "defs, clipPath, mask, pattern, symbol";
// (ticket 240) ♿'s collision boxes at the tree house: every frame while they show, the swing's box turned about its
// hook as the seat hangs now, and the friend's boxes with it while they sit on it (the drawing's swing is a SMIL
// animation, running between drawings: so its own loop, stopping when the boxes, the swing or the place go)
let swingHudOn = false;
function swingHud() {
  const ov = document.querySelector("#access-layer svg.solid-boxes"), S = ov ? swingNow() : null;
  if (!S) { swingHudOn = false; return; }
  const box = document.getElementById("access-layer").getBoundingClientRect(), tf = `rotate(${S.deg.toFixed(2)} ${(S.hook.x - box.left).toFixed(1)} ${(S.hook.y - box.top).toFixed(1)})`;
  const g = ov.querySelector('[data-solid="swing"]'), you = ov.querySelector(".you"), B = state.background, on = !!(state.body.sit && B.seat === "swing");
  if (g && g.getAttribute("transform") !== tf) g.setAttribute("transform", tf);
  if (you) { if (on) { if (you.getAttribute("transform") !== tf) you.setAttribute("transform", tf); } else if (you.hasAttribute("transform")) you.removeAttribute("transform"); }
  requestAnimationFrame(swingHud);
}
// (ticket 221, Matthew: "a new 'create bubbles' action for the player, where
// they can blow bubbles out of their mouth of any style (up to three at once)
// in any scene, or either hand. They can choose which of the three places they
// come from.") While 🫧 is held (the controller's, or B on the keyboard), a
// bubble every BLOW_EVERY ms from the friend's mouth or chosen hand (the
// mouth in the face's units, faceFrame; a hand, poseJoints; both through
// figureT into the picture's units), the themes switched on taking turns
// (bubble space's themes, bubbleSvg); each floats up and drifts, wobbling,
// and is gone at the picture's top or after BLOW_LIFE. Drawn over the
// picture in #access-layer, by blowTick, which runs while any are up.
const BLOW_EVERY = 140, BLOW_LIFE = 7000;
let blowPad = false, blowKey = false;
const blowSim = { list: [], raf: 0, last: 0, next: 0, turn: 0, shown: "" };
function blowGo() { if (!blowSim.raf) { blowSim.last = performance.now(); blowSim.raf = requestAnimationFrame(blowTick); } }
function blowFrom() {
  const B = state.body, T = figureT, J = poseJoints, at = (x, y) => [T.dx + T.k * x, T.dy + T.sg + T.k * (y - T.g)];
  if (!J || !faceFrame) return null;
  const dir = facingOf ? facingOf(B) : 0;
  if (B.blowFrom === "left" || B.blowFrom === "right") {
    const hs = J.arms.map(a => at(a.H[0], a.H[1])).sort((p, q) => p[0] - q[0]);
    return hs.length ? (B.blowFrom === "left" ? hs[0] : hs[hs.length - 1]) : null;
  }
  const f = faceFrame; return at(f.tx + (100 + 38 * dir) * f.s, f.ty + 150 * f.s);
}
function blowTick(t) {
  blowSim.raf = 0;
  const layer = document.getElementById("access-layer"), Bg = state.background, F = sceneFrame, k = (F.bottom - F.top) / 700;
  const dt = Math.min(0.05, Math.max(0, (t - blowSim.last) / 1000)); blowSim.last = t;
  const holding = (blowPad || blowKey) && Bg.kind !== "none";
  if (holding && t >= blowSim.next) {
    const p = blowFrom(), themes = ["A", "B", "C"].filter(L => state.body["blow" + L]).map(L => ({ color: Bg["bubble" + L + "Color"], size: Bg["bubble" + L + "Size"] ?? 18,
      shine: (Bg["bubble" + L + "Shine"] ?? 70) / 100, sparkle: Bg["bubble" + L + "Sparkle"] || "none", sparkleColor: Bg["bubble" + L + "SparkleColor"] || "#ffffff" }));
    if (p && themes.length) {
      const th = themes[blowSim.turn++ % themes.length], dir = facingOf ? facingOf(state.body) : 0, fromMouth = state.body.blowFrom !== "left" && state.body.blowFrom !== "right";
      blowSim.list.push({ x: p[0], y: p[1], vx: ((fromMouth ? dir * 60 : 0) + (Math.random() - 0.5) * 50) * k, vy: (-40 - 40 * Math.random()) * k, r: th.size * k * (0.7 + 0.5 * Math.random()), th, born: t, ph: Math.random() * 6 });
      if (blowSim.list.length > 90) blowSim.list.shift();
    }
    blowSim.next = t + BLOW_EVERY;
  }
  // up and drifting, wobbling; gone above the picture or when old
  blowSim.list = blowSim.list.filter(b => {
    b.vy += -8 * k * dt; b.vx *= Math.pow(0.6, dt);
    b.x += (b.vx + Math.sin(t / 400 + b.ph) * 14 * k) * dt; b.y += b.vy * dt;
    return b.y + b.r > F.top && t - b.born < BLOW_LIFE;
  });
  let ov = layer && layer.querySelector("svg.blown");
  if (layer && blowSim.list.length) {
    const M = pic.getScreenCTM(), box = layer.getBoundingClientRect();
    if (M && box.width) {
      if (!ov) { ov = document.createElementNS("http://www.w3.org/2000/svg", "svg"); ov.setAttribute("class", "blown"); layer.append(ov); }
      ov.innerHTML = blowSim.list.map(b => { const q = new DOMPoint(b.x, b.y).matrixTransform(M), age = (t - b.born) / BLOW_LIFE, fade = age > 0.8 ? (1 - age) / 0.2 : 1;
        return `<g opacity="${fade.toFixed(2)}">${bubbleSvg(q.x - box.left, q.y - box.top, b.r * M.a, b.th)}</g>`; }).join("");
    }
  } else if (ov) ov.remove();
  if (holding || blowSim.list.length) blowSim.raf = requestAnimationFrame(blowTick);
}
// (0.0.145, Matthew: "into FS mode, need to reposition the accessibility help, not make it wrong, or make it
// disappear") Over the picture, everything placed through the screen (the nav arrows, the collision boxes, the planned
// path) is placed again whenever the picture changes size (full screen, the divider, a turned phone), once its new
// size is laid out: the arrows had kept the smaller picture's places, all in its top left, till something was drawn.
let pathShown = "";
if (window.ResizeObserver && document.getElementById("pic"))   // (the element: the name pic is declared in a later part)
  // (a resize as the page loads comes before the later parts have run: pitsHere, in 26, was not defined yet, and with ♿'s
  // collision boxes on from a save it threw; nothing to place again till they have)
  new ResizeObserver(() => { if (typeof pitsHere !== "function") return; solidsShown = ""; pathShown = ""; madeShown = ""; worldWaysHud(); solidsHud(); pathHud(); madeOfHud(); }).observe(document.getElementById("pic"));
function pathHud() {
  const layer = document.getElementById("access-layer");
  if (!layer) return;
  const A = state.access || DEFAULTS.access, P = walkPath, live = !!(A.showPath && P && entering && P.pts && P.pts.length > 1);
  let ov = layer.querySelector("svg.walk-path");
  if (!live) { if (ov) ov.remove(); pathShown = ""; return; }
  const M = pic.getScreenCTM(), box = layer.getBoundingClientRect();
  if (!M || !box.width) return;
  const g = SCENE.ground, pts = P.pts.map(([x, y]) => { const q = new DOMPoint(x, g + y).matrixTransform(M); return [q.x - box.left, q.y - box.top]; });
  const sig = pts.map(q => q.map(v => v.toFixed(0)).join(",")).join(" ") + "|" + P.leg;
  if (sig === pathShown && ov) return;
  pathShown = sig;
  if (!ov) { ov = document.createElementNS("http://www.w3.org/2000/svg", "svg"); ov.setAttribute("class", "walk-path"); layer.append(ov); }
  const line = (a, cls) => a.length > 1 ? `<polyline class="${cls}" points="${a.map(q => q.map(v => v.toFixed(1)).join(",")).join(" ")}"/>` : "";
  const leg = Math.min(P.leg ?? 0, pts.length - 1);
  // (ticket 266: a queue of clicks, each click's walk by turns in the path's colour and its alt colour)
  const alt = i => P.segs && P.segs[i] % 2 ? " alt" : "";
  ov.innerHTML = pts.slice(1).map((q, i) => line([pts[i], q], (i < leg ? "walked" : "ahead") + alt(i + 1))).join("") +
    pts.slice(1).map((q, i) => `<circle class="${(i < leg ? "walked" : "ahead") + alt(i + 1)}" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${i === pts.length - 2 || (P.segs && P.segs[i + 2] !== P.segs[i + 1]) ? 7 : 5}"/>`).join("");
}
// (ticket 208, Matthew: the arrows shown at once "often overlap each other in
// the corners": E's and SE's, near the bottom right of a wide picture, where
// the floor seen is short) Arrows shown together kept apart: where two would
// overlap (the triangle and its words), one slides along its edge, away from
// the other: an arrow on a side (E, W) up or down, one at the top or bottom
// (N, S) or a corner's (along the floor's front or far edge) across; kept in
// the picture. Measured by arithmetic, each one's words measured once (their
// size is their text's): nothing read back from the page on a drawing. The
// triangle's box is its 44px square turned to its angle (SE's: about 62px
// across), and reaches 5px further along the angle at the top of its bob
// (way-bob); taken as a plain 44px, E still sat over SE by a few px.
const WAY_GAP = 6;
function waysApart(ws, box, sc = 1) {
  if (ws.length < 2) return;
  // (ticket 217: the words measured again when the game's word size changes; the arrows' size, sc, scales all of it)
  const fk = String((state.access || DEFAULTS.access).gameFont ?? 100);
  for (const w of ws) { if (!w.el.__words || w.el.__words[2] !== fk) { const t = w.el.querySelector(".way-words"); w.el.__words = t ? [t.offsetWidth, t.offsetHeight, fk] : [0, 0, fk]; } }
  const rect = w => { const ww = w.terse ? 0 : w.el.__words[0] * sc, wh = w.terse ? 0 : w.el.__words[1] * sc, gap = 26 * sc, c = Math.cos(w.a * Math.PI / 180), s = Math.sin(w.a * Math.PI / 180), h = 22 * sc * (Math.abs(c) + Math.abs(s)), b = 5 * sc;
    const r = [w.x - h + Math.min(0, b * c), w.y - h + Math.min(0, b * s), w.x + h + Math.max(0, b * c), w.y + h + Math.max(0, b * s)];
    const t = w.side === "left" ? [w.x - gap - ww, w.y - wh / 2, w.x - gap, w.y + wh / 2] : w.side === "right" ? [w.x + gap, w.y - wh / 2, w.x + gap + ww, w.y + wh / 2] :
              w.side === "below" ? [w.x - ww / 2, w.y + gap, w.x + ww / 2, w.y + gap + wh] : [w.x - ww / 2, w.y - gap - wh, w.x + ww / 2, w.y - gap];
    return [Math.min(r[0], t[0]), Math.min(r[1], t[1]), Math.max(r[2], t[2]), Math.max(r[3], t[3])]; };
  const across = w => !(w.d === "E" || w.d === "W");   // (E and W slide up or down; the rest across)
  const edge = w => w.d.length === 1;                  // (a side's or the top's or bottom's: free to slide; a corner's stays where it points)
  const overlap = (a, b) => Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > -WAY_GAP && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > -WAY_GAP;
  // (ticket 227: eight arrows, big, in a small picture do not all fit along its edges, however many passes; still over
  // another after the passes, a far arrow, shown only because ♿ shows every one, drops its words, just its triangle
  // (its words back when the friend comes near), and the passes run again)
  for (const w of ws) w.terse = false;
  // (0.0.159: up to four rounds, not two: still over another after its partner dropped its words, a far arrow drops its own; at twice the size N kept three lines of words over S)
  for (let round = 0; round < 4; round++) {
    if (round) {
      let dropped = false;
      for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) if (overlap(rect(ws[i]), rect(ws[j]))) {
        const f = [ws[j], ws[i]].find(w => w.far && !w.terse);
        if (f) { f.terse = true; dropped = true; }
      }
      if (!dropped) break;
    }
  for (let pass = 0; pass < 16; pass++) {   // (ticket 217: eight arrows at twice the size need more than four)
    let moved = false;
    for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) {
      const a = rect(ws[i]), b = rect(ws[j]), ox = Math.min(a[2], b[2]) - Math.max(a[0], b[0]), oy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
      if (ox <= -WAY_GAP || oy <= -WAY_GAP) continue;
      // (which slides: a side's before a corner's; of two alike, the second; it goes away from the other, or toward the middle)
      for (const [m, o, rm, ro] of edge(ws[j]) || !edge(ws[i]) ? [[ws[j], ws[i], b, a], [ws[i], ws[j], a, b]] : [[ws[i], ws[j], a, b], [ws[j], ws[i], b, a]]) {
        const h = across(m), lo = 22 * sc, hi = (h ? box.width : box.height) - 22 * sc, k = h ? "x" : "y";
        const cm = h ? (rm[0] + rm[2]) / 2 : (rm[1] + rm[3]) / 2, co = h ? (ro[0] + ro[2]) / 2 : (ro[1] + ro[3]) / 2;
        const dir = cm !== co ? Math.sign(cm - co) : Math.sign((h ? box.width : box.height) / 2 - m[k]) || 1;
        const need = (h ? ox : oy) + WAY_GAP, to = Math.max(lo, Math.min(hi, m[k] + dir * need));
        if (Math.abs(to - m[k]) >= 1) { m[k] = to; moved = true; break; }
      }
    }
    if (!moved) break;
  }
  }
  // (ticket 214, the twice-size check's overlaps: W between NW and SW, or N over E at a picture's corner, each pass
  // pushing a side's arrow off one neighbour onto the other, ended over one of them) Last, a side's arrow still over
  // another goes to the nearest place along its edge clear of every other (or, along its edge none, inward from it),
  // seeing all of them at once; a corner's stays where it points.
  const clear = w => ws.every(x => x === w || !overlap(rect(w), rect(x)));
  for (const w of ws) {
    if (!edge(w) || clear(w)) continue;
    for (const k of across(w) ? ["x", "y"] : ["y", "x"]) {
      const at = w[k], size = k === "x" ? box.width : box.height, lo = 22 * sc, hi = size - 22 * sc;
      // (its box's reach along k from where it is: the places just before and just after each other arrow's box)
      const rw = rect(w), i0 = k === "x" ? 0 : 1, before = at - rw[i0], after = rw[i0 + 2] - at;
      const tries = [at, ...ws.filter(x => x !== w).flatMap(x => { const r = rect(x); return [r[i0] - WAY_GAP - after - 1, r[i0 + 2] + WAY_GAP + before + 1]; })]
        .filter(v => v >= lo && v <= hi).sort((a, b) => Math.abs(a - at) - Math.abs(b - at));
      const v = tries.find(v => { w[k] = v; const ok = clear(w); w[k] = at; return ok; });
      if (v !== undefined) { w[k] = v; break; }
    }
  }
}
// a way out taken: the friend walks to it, then is in the square beside
// it, come in from the side it leads to; the back chip can bring them back
// (stepping through it its own way, facing it: east, to the right; here: from an edge, where they stand)
function worldWalk(door, here = false) {
  const W = state.world, d = door.dataset.way, nb = worldNeighbour(W, W.at, d), other = W.cells[nb.key], B = state.background;
  if (nb.off || !other) return;
  const from = { kind: B.kind, figX: B.figX ?? 0, figY: B.figY ?? 0, to: other.kind, worldAt: W.at };
  tripStart(door, "walk");
  walkInto(door, () => { trips.push(from); worldEnter(nb.key, WORLD_OPP[d], false); }, true, "step", null, { out: WORLD_DIRS[d], here });
}
// and back: the place edited where the friend is, kept in its square
// (from changed() and settle(): cheap, and only for the place in use).
// (0.0.114, Matthew: a potion put in one square was in every square) A
// place's own doorway (a sign, a door, a picture), the back chip and
// Surprise me change the place without the world knowing, and the things
// went along. So here, on every change, the place shown is given its home:
// its square (the friend's; or, come by a place's own doorway, the square
// of that place beside it, else the first), or, off the grid (an inside,
// our imagination), its own list in W.off, by placeKey (a castle room, a
// tree room or a tent by which one too). Come to a home, the things shown
// are its own; staying, they are kept in it. With no square yet (a first
// visit, after starting over, an older save), the place's things as they
// are go into the square found for it.
let worldHome = null;
const placeKey = B => B.kind + (B.kind === "castleroom" ? ":" + castleOf(B).id + ":" + (B.castleRoom ?? 1) : B.kind === "treeroom" ? ":" + (B.inside ?? 1) : B.kind === "tent" ? ":" + (B.tent ?? 1) : "");
function worldSquareFor(W, kind) {
  const nb = W.at && W.cells[W.at] ? Object.keys(WORLD_DIRS).map(d => worldNeighbour(W, W.at, d)).find(n => !n.off && W.cells[n.key] && W.cells[n.key].kind === kind) : null;
  return nb ? nb.key : worldKeys(W).find(k => W.cells[k].kind === kind) || null;
}
function worldKeep() {
  const W = state.world, B = state.background;
  if (!W || !W.cells) return;
  let cell = W.at && W.cells[W.at];
  const adopting = !W.at;
  if (B.kind !== "none" && (!cell || cell.kind !== B.kind)) { const key = worldSquareFor(W, B.kind); if (key) { W.at = key; cell = W.cells[key]; } }
  const sq = !!cell && cell.kind === B.kind, home = B.kind === "none" ? null : sq ? "sq:" + W.at : "off:" + placeKey(B);
  if (adopting) worldHome = home;
  if (home !== worldHome) {   // (just come: the place's own things, never those of the place left)
    worldHome = home;
    if (sq) for (const k of cellKeys(cell.kind)) { const v = structuredClone(cell[k] ?? (k === "things" ? [] : DEFAULTS.background[k])); if (JSON.stringify(v) !== JSON.stringify(B[k])) B[k] = v; }
    else if (home) { const v = structuredClone((W.off || {})[placeKey(B)] || []); if (JSON.stringify(v) !== JSON.stringify(B.things)) B.things = v; }
  } else if (sq) {
    for (const k of cellKeys(cell.kind)) if (JSON.stringify(cell[k]) !== JSON.stringify(B[k])) cell[k] = structuredClone(B[k]);
  } else if (home) {
    const pk = placeKey(B), T = Array.isArray(B.things) ? B.things : [], kept = (W.off || {})[pk] || [];
    if (JSON.stringify(kept) !== JSON.stringify(T)) { W.off = W.off || {}; if (T.length) W.off[pk] = structuredClone(T); else delete W.off[pk]; }
  }
  // (a crossing in its square draws the paths that lead somewhere: worldLiveWays,
  // as a setting of its own, so its cached drawing knows when they change)
  if (sq && cell.kind === "crossing") { const live = worldLiveWays(W, W.at).join(","); if (B.crossLive !== live) B.crossLive = live; }
  else if (B.crossLive !== undefined) delete B.crossLive;
}
// A place chosen in the Background tab is that place's square: the first
// square holding it (its things come with it); a place the world doesn't
// have keeps its own things off the grid (worldKeep).
function worldChoose(kind) {
  const W = state.world, key = worldKeys(W).find(k => W.cells[k].kind === kind), B = state.background;
  if (key) { W.at = key; for (const k of cellKeys(kind)) B[k] = structuredClone(W.cells[key][k] ?? (k === "things" ? [] : DEFAULTS.background[k])); }
  // (a place off the grid: worldKeep gives it its own things, W.off's; the square the friend was in stays W.at)
}
// ---- the world designer's hands (v2): putting places in squares, moving
// and taking them away, the grid's size, and a drag that works the same
// with a mouse and a finger
// the places a square can hold: every place but the insides and those reached their own way
const worldPalette = () => PLACES.map(([k]) => k).filter(k => k !== "none" && !INSIDE_KINDS.has(k) && !ELSEWHERE.includes(k));
// a place's usual ways out, put in a square: as in the first world, else east and west
const worldUsualWays = kind => { const c = Object.values(WORLD_DEFAULT.cells).find(c => c.kind === kind); return c && c.ways ? [...c.ways] : ["E", "W"]; };
// (ticket 232, Matthew: "'all passageways' does not respect the edge of the grid ... and it introduces issues that can
// be avoided") a square's ways off the map's edge taken away: where a place is put, a square moved or the grid made
// smaller, and by 🔗 all passageways; how many went. (A crossing's paths that way are dead ends, not drawn and no
// mistake, part of its own look: they stay.)
function worldTrimEdges(W, keys = worldKeys(W)) {
  let gone = 0;
  for (const key of keys) {
    const c = W.cells[key];
    if (!c || c.kind === "crossing" || !Array.isArray(c.ways)) continue;
    const keep = c.ways.filter(d => !worldOffMap(W, key, d));
    gone += c.ways.length - keep.length; c.ways = keep;
  }
  return gone;
}
function worldPut(key, kind) {
  const W = state.world;
  W.cells[key] = kind === "crossing" ? { kind, ...Object.fromEntries(CROSS_DIRS.map(([d]) => ["cross" + d, ["N", "E", "S", "W"].includes(d)])), crossFloor: CROSS_FLOORS[0], crossBack: "woods", things: [] }
                                     : { kind, ways: worldUsualWays(kind), things: [] };
  worldTrimEdges(W, [key]);   // (ticket 232: its usual ways, but none off the edge where it is put)
  if (!W.start || !W.cells[W.start]) W.start = key;
  if (W.at === key) W.at = null;   // (the square the friend was in holds another place now)
  changed();
}
// a square moved onto another: they swap, or it moves into the empty one; the start and the friend's square go with them
function worldMove(from, to) {
  const W = state.world;
  if (from === to || !W.cells[from]) return;
  const a = W.cells[from], b = W.cells[to], swap = k => k === from ? to : k === to && b ? from : k;
  W.cells[to] = a; if (b) W.cells[from] = b; else delete W.cells[from];
  worldTrimEdges(W, [to, from]);   // (ticket 232: moved to an edge, no way off it)
  W.start = swap(W.start); W.at = swap(W.at);
  changed();
}
function worldRemove(key) {
  const W = state.world;
  delete W.cells[key];
  if (W.at === key) W.at = null;
  if (W.start === key) W.start = worldKeys(W)[0] || null;
  changed();
}
// the grid one column or row bigger or smaller (up to 12 by 12; smaller only while that column or row is empty)
function worldResize(dc, dr) {
  const W = state.world, cols = W.cols + dc, rows = W.rows + dr;
  if (cols < 1 || rows < 1 || cols > 12 || rows > 12) return;
  if (worldKeys(W).some(k => { const [c, r] = k.split(",").map(Number); return c >= cols || r >= rows; })) return;
  W.cols = cols; W.rows = rows;
  worldTrimEdges(W);   // (ticket 232: a smaller grid, the squares along its new edge given no way off it)
  changed();
}
// A press that becomes a drag after a few pixels: a ghost of it follows the
// finger or the mouse, and on letting go, onDrop(the element under it, the
// event); a press that never moved is a tap (onTap, or the element's own
// click). The click after a drag is swallowed.
function pressDrag(el, ghost, { onDrop, onTap = null }) {
  el.style.touchAction = "none";
  el.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    const x0 = e.clientX, y0 = e.clientY;
    let g = null;
    const move = ev => {
      if (!g && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8) { g = document.createElement("div"); g.className = "drag-ghost"; g.textContent = ghost(); document.body.append(g); }
      if (g) { g.style.left = ev.clientX + "px"; g.style.top = ev.clientY + "px"; ev.preventDefault(); }
    };
    const up = ev => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      if (g) {
        g.remove();
        const stop = c => { c.stopPropagation(); c.preventDefault(); };
        el.addEventListener("click", stop, { capture: true, once: true }); setTimeout(() => el.removeEventListener("click", stop, { capture: true }), 0);
        if (ev.type === "pointerup") onDrop(document.elementFromPoint(ev.clientX, ev.clientY), ev);
      } else if (onTap && ev.type === "pointerup") onTap(ev);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  });
}
