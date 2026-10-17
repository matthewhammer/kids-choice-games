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
// A forest crossing's own settings, as a square keeps them and as the
// Background tab edits them (state.background), so the square opened is
// the square changed.
const CELL_KEYS = ["crossN", "crossNE", "crossE", "crossSE", "crossS", "crossSW", "crossW", "crossNW", "crossFloor", "crossThings"];
// go to a square: the friend into its place, with its own settings
function worldEnter(key) {
  const W = state.world, cell = W.cells[key];
  if (!cell) return;
  W.at = key;
  const B = state.background;
  B.kind = cell.kind;
  if (cell.kind === "crossing") for (const k of CELL_KEYS) if (k in cell) B[k] = structuredClone(cell[k]);
  [B.figX, B.figY] = ARRIVE[cell.kind] || [0, 0];
  changed();
}
// and back: a forest crossing edited where the friend is, kept in its square
// (from settle(), after every change: cheap, and only for the square in use)
function worldKeep() {
  const W = state.world, B = state.background, cell = W && W.at && W.cells[W.at];
  if (!cell || cell.kind !== B.kind || B.kind !== "crossing") return;
  for (const k of CELL_KEYS) if (JSON.stringify(cell[k]) !== JSON.stringify(B[k])) cell[k] = structuredClone(B[k]);
}
