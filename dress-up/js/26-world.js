"use strict";
// (ticket 178) Part 26 of 26 of the game's script, run in order by index.html.

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
                  waterfall: ["cave"], castle: ["castleroom"], lake: ["underwater"] };
const INSIDE_KINDS = new Set(Object.values(INSIDES).flat());
const ELSEWHERE = ["imagination", "emptyroom"];
const worldWays = cell => !cell ? [] : cell.kind === "crossing" ? CROSS_DIRS.map(([d]) => d).filter(d => cell["cross" + d]) : (cell.ways || []);
const placeName = kind => (PLACES.find(p => p[0] === kind) || [kind, kind])[1];
// a square's name, as on a map: a letter for the column, a number for the row
const squareName = key => { const [c, r] = key.split(",").map(Number); return String.fromCharCode(65 + c) + (r + 1); };
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
    for (const d of worldWays(cell)) {
      const nb = worldNeighbour(W, key, d), other = W.cells[nb.key];
      if (nb.off) P.push({ key, dir: d, text: `The way ${WORLD_ARROWS[d]} out of ${name(key)} leads off the map.` });
      else if (!other) P.push({ key, dir: d, text: `The way ${WORLD_ARROWS[d]} out of ${name(key)} leads to an empty square, ${squareName(nb.key)}.` });
      else if (!worldWays(other).includes(WORLD_OPP[d])) P.push({ key, dir: d, text: `The way ${WORLD_ARROWS[d]} out of ${name(key)} meets ${name(nb.key)}, which has no way back ${WORLD_ARROWS[WORLD_OPP[d]]}.` });
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
  return P;
}
// What a square keeps of its place, as the Background tab edits it
// (state.background), so the square opened is the square changed: its
// things, any place's; and a forest crossing's paths and floor.
const CROSS_KEYS = ["crossN", "crossNE", "crossE", "crossSE", "crossS", "crossSW", "crossW", "crossNW", "crossFloor"];
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
  [B.figX, B.figY] = side ? WORLD_IN[side] : ARRIVE[cell.kind] || [0, 0];
  if (draw) changed();
}
// The ways out of the square the friend is in, in the picture (Matthew,
// 2026-10-17: "how do I access those passageways in the game?"): a small
// bobbing triangle at each, pointing out, as the ▼ toward us is: N at the
// far end of the ground, S at the bottom, E and W at the sides, the four
// between at the corners. Each a doorway (data-way: it glows when pointed
// at or near the friend, X goes through, a click walks there) to the square
// beside it; a way that is a mistake, leading nowhere, is dimmed, 🚧, and
// goes nowhere. Drawn after the place, in front of everything; kept as a
// piece of its own, as the place's own drawing does not know the world.
function worldWaysSvg(B, x0, y0, x1, y1, g) {
  const W = state.world, cell = W && W.at && W.cells[W.at];
  if (!cell || cell.kind !== B.kind) return "";
  const ways = worldWays(cell);
  if (!ways.length) return "";
  const meets = d => { const nb = worldNeighbour(W, W.at, d), other = W.cells[nb.key]; return !nb.off && other && worldWays(other).includes(WORLD_OPP[d]) ? other : null; };
  const sig = ways.map(d => d + (meets(d) ? meets(d).kind : "-")).join();
  return SEP + part("world-ways", [W.at, sig, x0, y0, x1, y1, g], () => {
    const k = (y1 - y0) / 700, far = g - 150 * k, mid = g + 40 * k, esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const AT = { N: [0, far - 6 * k, -90], S: [0, y1 - 30 * k, 90], E: [x1 - 45 * k, mid, 0], W: [x0 + 45 * k, mid, 180],
                 NE: [x1 * 0.55, far, -40], NW: [x0 * 0.55, far, -140], SE: [x1 - 60 * k, y1 - 50 * k, 40], SW: [x0 + 60 * k, y1 - 50 * k, 140] };
    return ways.map(d => {
      const [x, y, a] = AT[d], to = meets(d), r = 28 * k, rad = a * Math.PI / 180, bx = 5 * k * Math.cos(rad), by = 5 * k * Math.sin(rad);
      const label = to ? `${WORLD_ARROWS[d]} ${placeName(to.kind)}` : `🚧 ${WORLD_ARROWS[d]} leads nowhere yet`;
      const tri = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a})"><path d="M${f1(-0.6 * r)} ${f1(-0.8 * r)} L${f1(0.9 * r)} 0 L${f1(-0.6 * r)} ${f1(0.8 * r)} Z" ` +
                  `fill="${to ? "#fff4cf" : "#d6d3d1"}" fill-opacity="0.85" stroke="${to ? "#6b4a24" : "#78716c"}" stroke-width="${f1(2.2 * k)}" stroke-linejoin="round"/></g>`;
      const inner = `<title>${esc(label)}</title><g>${to ? `<animateTransform attributeName="transform" type="translate" values="0 0;${f1(bx)} ${f1(by)};0 0" dur="1.8s" repeatCount="indefinite"/>` : ""}${tri}</g>` +
                    `<rect x="${f1(x - 2 * r)}" y="${f1(y - 2 * r)}" width="${f1(4 * r)}" height="${f1(4 * r)}" fill="#000000" opacity="0"/>` +
                    `<text class="south-label" x="${f1(x)}" y="${f1(y - 1.7 * r)}" text-anchor="middle" font-size="${f1(24 * k)}" font-family="sans-serif" font-weight="600" fill="#ffffff" stroke="#3b2a14" stroke-width="${f1(5 * k)}" paint-order="stroke">${esc(label)}</text>`;
      return obj(`way ${d}`, Infinity, to ? `<g class="portal south-way way-out" data-door="1" data-way="${d}">${inner}</g>` : `<g class="south-way way-out nowhere" opacity="0.6">${inner}</g>`);
    }).join("");
  });
}
// a way out taken: the friend walks to it, then is in the square beside
// it, come in from the side it leads to; the back chip can bring them back
function worldWalk(door) {
  const W = state.world, d = door.dataset.way, nb = worldNeighbour(W, W.at, d), other = W.cells[nb.key], B = state.background;
  if (nb.off || !other) return;
  const from = { kind: B.kind, figX: B.figX ?? 0, figY: B.figY ?? 0, to: other.kind, worldAt: W.at };
  tripStart(door, "walk");
  walkInto(door, () => { trips.push(from); worldEnter(nb.key, WORLD_OPP[d], false); });
}
// and back: the place edited where the friend is, kept in its square
// (from changed() and settle(): cheap, and only for the square in use)
function worldKeep() {
  const W = state.world, B = state.background;
  // (no square yet, as on a first visit, after starting over or loading an
  // older save: the first holding the place shown, which the place's things
  // and paths, as they are, are then kept in)
  if (W && !W.at && B.kind !== "none") { const key = worldKeys(W).find(k => W.cells[k].kind === B.kind); if (key) W.at = key; }
  const cell = W && W.at && W.cells[W.at];
  if (!cell || cell.kind !== B.kind) return;
  for (const k of cellKeys(cell.kind)) if (JSON.stringify(cell[k]) !== JSON.stringify(B[k])) cell[k] = structuredClone(B[k]);
}
// A place chosen in the Background tab is that place's square: the first
// square holding it (its things come with it); a place the world doesn't
// have is no square, and has no things of its own.
function worldChoose(kind) {
  const W = state.world, key = worldKeys(W).find(k => W.cells[k].kind === kind), B = state.background;
  if (key) { W.at = key; for (const k of cellKeys(kind)) B[k] = structuredClone(W.cells[key][k] ?? (k === "things" ? [] : DEFAULTS.background[k])); }
  else { W.at = null; B.things = []; }
}
