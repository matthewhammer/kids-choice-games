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
                  waterfall: ["cave"], castle: ["castleroom"], lake: ["underwater"] };
const INSIDE_KINDS = new Set(Object.values(INSIDES).flat());
const ELSEWHERE = ["imagination", "emptyroom"];
const worldWays = cell => !cell ? [] : cell.kind === "crossing" ? CROSS_DIRS.map(([d]) => d).filter(d => cell["cross" + d]) : (cell.ways || []);
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
  [B.figX, B.figY] = side ? WORLD_IN[side] : ARRIVE[cell.kind] || [0, 0];
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
function wayNearness(d) {
  const w = worldWaysAt.find(e => e[0] === d), B = state.background, o = WAY_OUT[d];
  if (!w || !o) return Infinity;
  const a = floorAt(B, w[1], w[2]), f = floorAt(B, B.figX ?? 0, SCENE.ground + (B.figY ?? 0));
  const c = floorAt(B, 0, SCENE.ground + (ARRIVE[B.kind] || [0, 0])[1]);
  const at = i => o[i] && (f[i] - a[i]) * o[i] > 0 ? a[i] : f[i];
  return Math.hypot(at(0) - a[0], at(1) - a[1]) / Math.max(1, Math.min(WAY_NEAR, Math.hypot(a[0] - c[0], a[1] - c[1]) / 2));
}
// (the way X goes through, aimed at: its arrow glows, as a door's frame does)
function worldWaysAim(d) {
  for (const el of document.querySelectorAll("#ways .way-arrow")) { const on = el.dataset.way === d; if (el.classList.contains("aimed") !== on) el.classList.toggle("aimed", on); }
}
function worldWaysSvg(B, x0, y0, x1, y1, g) {
  const W = state.world, cell = W && W.at && W.cells[W.at];
  if (!cell || cell.kind !== B.kind) { worldWaysAt = []; worldWaysHud(); return ""; }
  const ways = worldLiveWays(W, W.at);
  const meets = d => { const nb = worldNeighbour(W, W.at, d), other = W.cells[nb.key]; return !nb.off && other && worldWays(other).includes(WORLD_OPP[d]) ? other : null; };
  const k = (y1 - y0) / 700;
  // (a forest crossing's at its own paths' ends: crossGeom; any other place's at its far ground and sides)
  const G = B.kind === "crossing" ? crossGeom({ x0, x1, y1, g, W: x1 - x0, k, pad: 0 }) : null;
  const far = G ? G.far + 10 * k : g - 150 * k, mid = G ? G.cy + 14 * k : g + 40 * k, side = G ? 0.6 : 0.55;
  const AT = { N: [0, far - 6 * k, -90], S: [0, y1 - 30 * k, 90], E: [x1 - 45 * k, mid, 0], W: [x0 + 45 * k, mid, 180],
               NE: [x1 * side, far, -40], NW: [x0 * side, far, -140], SE: [x1 - 60 * k, y1 - 50 * k, 40], SW: [x0 + 60 * k, y1 - 50 * k, 140] };
  worldWaysAt = ways.map(d => [d, ...AT[d], meets(d)]);
  worldWaysHud();
  if (!ways.length) return "";
  const sig = worldWaysAt.map(([d, , , , to]) => d + (to ? to.kind : "-")).join();
  return SEP + part("world-ways", [W.at, B.kind, sig, x0, y0, x1, y1, g], () => worldWaysAt.map(([d, x, y, a, to]) => {
    const r = 28 * k;
    // (invisible, and not tapped: the arrow over the picture is; its shape, the triangle, is what the glow frames)
    const tri = `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a})"><path d="M${f1(-0.6 * r)} ${f1(-0.8 * r)} L${f1(0.9 * r)} 0 L${f1(-0.6 * r)} ${f1(0.8 * r)} Z" fill="#000000" opacity="0"/></g>`;
    return obj(`way ${d}`, Infinity, to ? `<g class="portal way-out" data-door="1" data-way="${d}" pointer-events="none">${tri}</g>` : `<g class="way-out nowhere" pointer-events="none">${tri}</g>`);
  }).join(""));
}
// The arrows over the picture: made again when the ways change, placed and
// shown or hidden on every drawing (cheap: a few at most)
let waysShown = null;
function worldWaysHud() {
  const layer = document.getElementById("ways");
  if (!layer) return;
  const sig = worldWaysAt.map(([d, , , , to]) => d + (to ? to.kind : "-")).join();
  if (sig !== waysShown) {
    waysShown = sig;
    layer.replaceChildren(...worldWaysAt.map(([d, , , a, to]) => {
      const b = document.createElement("button");
      b.className = "way-arrow" + (to ? "" : " nowhere"); b.dataset.way = d; b.type = "button";
      b.style.setProperty("--a", a + "deg");
      b.setAttribute("aria-label", to ? `Go ${d}, to ${placeName(to.kind)}` : `The way ${d} leads nowhere yet`);
      const tri = document.createElement("span"); tri.className = "way-tri";
      const words = document.createElement("span"); words.className = "way-words";
      words.append(to ? WORLD_ARROWS[d] : "🚧 " + WORLD_ARROWS[d], document.createElement("br"), to ? placeName(to.kind) : "nowhere yet");
      b.append(tri, words);
      b.addEventListener("click", () => { const p = to && bgShown.node && bgShown.node.querySelector(`.portal[data-way="${d}"]`); if (p && !entering) enterScene(p); });
      return b;
    }));
  }
  if (!worldWaysAt.length) return;
  const M = pic.getScreenCTM(), box = layer.getBoundingClientRect(), B = state.background;
  if (!M || !box.width) return;
  worldWaysAt.forEach(([d, x, y, a], i) => {
    const el = layer.children[i];
    if (!el) return;
    const p = new DOMPoint(x, y).matrixTransform(M), near = wayNearness(d) < 1;
    // (kept inside the picture, by its size)
    const left = Math.max(22, Math.min(box.width - 22, p.x - box.left)), top = Math.max(22, Math.min(box.height - 22, p.y - box.top));
    el.style.left = left.toFixed(0) + "px"; el.style.top = top.toFixed(0) + "px";
    // (its words toward the middle: left of an arrow on the right, below one at the top...)
    el.dataset.side = /E/.test(d) && !/W/.test(d) ? "left" : /W/.test(d) ? "right" : d === "N" ? "below" : "above";
    if (el.classList.contains("near") !== near) el.classList.toggle("near", near);
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
  if (!cell || cell.kind !== B.kind) { if (B.crossLive !== undefined) delete B.crossLive; return; }
  for (const k of cellKeys(cell.kind)) if (JSON.stringify(cell[k]) !== JSON.stringify(B[k])) cell[k] = structuredClone(B[k]);
  // (a crossing in its square draws the paths that lead somewhere: worldLiveWays,
  // as a setting of its own, so its cached drawing knows when they change)
  if (cell.kind === "crossing") { const live = worldLiveWays(W, W.at).join(","); if (B.crossLive !== live) B.crossLive = live; }
  else if (B.crossLive !== undefined) delete B.crossLive;
}
// A place chosen in the Background tab is that place's square: the first
// square holding it (its things come with it); a place the world doesn't
// have is no square, and has no things of its own.
function worldChoose(kind) {
  const W = state.world, key = worldKeys(W).find(k => W.cells[k].kind === kind), B = state.background;
  if (key) { W.at = key; for (const k of cellKeys(kind)) B[k] = structuredClone(W.cells[key][k] ?? (k === "things" ? [] : DEFAULTS.background[k])); }
  else { W.at = null; B.things = []; }
}
// ---- the world designer's hands (v2): putting places in squares, moving
// and taking them away, the grid's size, and a drag that works the same
// with a mouse and a finger
// the places a square can hold: every place but the insides and those reached their own way
const worldPalette = () => PLACES.map(([k]) => k).filter(k => k !== "none" && !INSIDE_KINDS.has(k) && !ELSEWHERE.includes(k));
// a place's usual ways out, put in a square: as in the first world, else east and west
const worldUsualWays = kind => { const c = Object.values(WORLD_DEFAULT.cells).find(c => c.kind === kind); return c && c.ways ? [...c.ways] : ["E", "W"]; };
function worldPut(key, kind) {
  const W = state.world;
  W.cells[key] = kind === "crossing" ? { kind, ...Object.fromEntries(CROSS_DIRS.map(([d]) => ["cross" + d, ["N", "E", "S", "W"].includes(d)])), crossFloor: CROSS_FLOORS[0], crossBack: "woods", things: [] }
                                     : { kind, ways: worldUsualWays(kind), things: [] };
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
