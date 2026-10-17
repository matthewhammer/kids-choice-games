"use strict";
// (ticket 178) Part 16 of 26 of the game's script, run in order by index.html.

// each group's objects put in order by depth, in the places they held (a
// picture of a place, or the view out of a window, is in the same order)
function sortObjects(root) {
  const objs = [...root.querySelectorAll("[data-obj]")];
  for (const parent of new Set(objs.map(n => n.parentNode))) {
    const here = objs.filter(n => n.parentNode === parent), sorted = here.slice().sort((a, b) => (objDepth(a) - objDepth(b)) || 0);   // (two in front tie, in their text order)
    if (sorted.every((n, i) => n === here[i])) continue;
    const slots = here.map(n => { const m = n.ownerDocument.createComment(""); n.before(m); return m; });
    sorted.forEach((n, i) => slots[i].replaceWith(n));
  }
}
function sceneObjects(root) {
  sortObjects(root);
  return [...root.querySelectorAll("[data-obj]")].filter(n => {
    for (let q = n.parentNode; q && q !== root; q = q.parentNode)
      if (q.hasAttribute("transform") || q.hasAttribute("data-obj") || q.hasAttribute("data-drag") || q.classList.contains("portal")) return false;
    return true;
  }).map(n => ({ name: n.dataset.obj, z: objDepth(n), node: n }));
}
const objectAhead = feet => (bgShown.objs.find(o => o.z > feet) || {}).node || null;
// which list of hidden objects a place keeps: a castle room's by its style,
// a room in the tree house by its number, any other by its kind
function objPlace(B) {
  if (B.kind === "castleroom") return "castleroom:" + (castleOf(B).rooms[Math.round(B.castleRoom ?? 1) - 1] ?? "king");
  if (B.kind === "treeroom") return "treeroom:" + Math.round(B.inside ?? 1);
  return B.kind;
}
const objectsOff = B => new Set(((B.objectsOff || {})[objPlace(B)]) || []);
function showObjects() {
  const off = objectsOff(state.background);
  // (ticket 163: written only when it changes; every drawing, each write
  // made the browser restyle that object, every frame of a walk)
  for (const o of bgShown.objs) { const d = off.has(o.name) ? "none" : ""; if (o.node.style.display !== d) o.node.style.display = d; }
}
// the scene's element, its pieces those of the last scene where their text
// is the same (see SEP), the rest parsed
function mountScene(text) {
  const tMount = performance.now();   // (⏱️ a trip being timed)
  const NS = "http://www.w3.org/2000/svg", root = document.createElementNS(NS, "g"), stack = [root], kept = new Map();
  root.id = "bg";
  bgShown.parsed = 0;
  for (const piece of text.split(SEP)) {
    if (!piece) continue;
    if (piece === "</g>") { stack.pop(); continue; }
    let node;
    if (/^<g [^>]*>$/.test(piece)) {   // a group's own tag, made new (it is small)
      const holder = document.createElementNS(NS, "g");
      holder.innerHTML = piece + "</g>";
      node = holder.firstChild;
      stack[stack.length - 1].append(node);
      stack.push(node);
      continue;
    }
    node = bgShown.kept.get(piece);
    if (!node || kept.has(piece)) {
      node = document.createElementNS(NS, "g");
      node.innerHTML = piece;
      bgShown.parsed += piece.length;
    }
    kept.set(piece, node);
    stack[stack.length - 1].append(node);
  }
  bgShown.kept = kept;
  if (tripTimer) tripWork("building the place", tMount);
  return root;
}
// the figure's size and place in its scene (k about its feet, at y = g),
// and the scene's frame: for dragging the figure, and the face in it
// A background's stage: the frame the usual figure got in a scene, its
// ground at 320 (the usual figure's), in picture units.
const SCENE = { left: -405.9, top: -195, bottom: 406.2, ground: 320 };
// the frame the figure itself needs (before a stage replaces it), for
// fitting it to the stage
let naturalFrame = { left: -200, top: -200, ground: 0 };
let figureT = { k: 1, dx: 0, dy: 0, g: 0, sg: 0 }, sceneFrame = { left: -200, top: -200, right: 200, bottom: 200, ground: 0, back: -Infinity };   // where the face is, for dragging it
// (ticket 145) A solid back wall: the deepest the friend's feet go in a
// place whose back wall can't be walked through (the imagination's: its
// ladders are the way up), a little in front of the wall's foot, in the
// stage's units; else the frame's own limit. The controller, a drag and the
// place control all keep to it (figYMin, a figY).
const SCENE_BACK = { imagination: () => imaginationWall(SCENE.ground, (SCENE.bottom - SCENE.top) / 700) + 3, emptyroom: () => imaginationWall(SCENE.ground, (SCENE.bottom - SCENE.top) / 700) + 3 };
const figYMin = F => Math.max((F.top - F.ground) * 0.6, (F.back ?? -Infinity) - F.ground);
// (ticket 149) What the friend can't walk through. A castle room's walls,
// from its perspective (roomFrame, as the room is drawn): the back wall's
// foot is SCENE_BACK's, and the side walls close in toward it, so how far
// across the friend's feet can go depends on how deep they are (walls: the
// half width at a depth). And the things one sits on (SEATS: a barrel, a
// bench, a chair, a throne), as boxes on the ground: across their top's
// span (x0 to x1) and from the floor in front of them (z, where a sitter's
// feet go) back by half their height, at most SOLID_DEPTH of their width;
// their height is their top's above that floor. Low ones can be jumped: while jumping, lower than half
// the friend's legs by the short jump, lower than their legs by the high
// one. The controller and a drag move the friend through solidMove, which
// slides along what they meet; already inside one (put there by a setting,
// or arriving), they can walk out. Closed ticket 50's "collision shape for
// the places it makes no sense to stand", begun with what we know the
// shape of.
const SOLID_DEPTH = 0.4, SOLID_MARGIN = 6;
let wallsMemo = { text: undefined, kind: null, W: null };
function castleWalls(B) {
  if (B.kind !== "castleroom") return null;
  if (wallsMemo.text === bgShown.text && wallsMemo.kind === B.kind && bgShown.text) return wallsMemo.W;
  wallsMemo = { text: bgShown.text, kind: B.kind, W: castleWallsOf(B) };
  return wallsMemo.W;
}
function castleWallsOf(B) {
  const style = castleOf(B).rooms[Math.round(B.castleRoom ?? 1) - 1], deep = style === "hallway" || style === "dining";
  const c = deep ? { ...stageC(), eye: 0.3 } : stageC(), { floor, bw, vy } = roomFrame(c);
  const back = vy + (floor - vy) / (1 + (deep ? HALL_STRETCHES * 0.8 : 0));
  return { back, stairs: style === "spiral", half: y => Math.max(0, bw * (y - vy) / (floor - vy)) };
}
// (read once a drawing, before the drawing mounts the place's scene: worked out afresh, not memoized on the scene's text)
// (not the spiral stair's room: walking up it is going up the stairs, to its doors higher up)
SCENE_BACK.castleroom = () => { const W = castleWallsOf(state.background); return W && !W.stairs ? W.back + 3 : -Infinity; };
// (ticket 176) The flat rooms' back walls: where each one's floor meets its
// wall as the room is drawn (livingroomScene, treeroomScene, witchroomScene,
// healerroomScene; the tent's far wall, tentScene), in front of which the
// friend stops, as in the imagination
for (const [kind, up] of [["livingroom", 120], ["treeroom", 110], ["witchroom", 100], ["healerroom", 100], ["tent", 70]])
  SCENE_BACK[kind] = () => SCENE.ground - up * (SCENE.bottom - SCENE.top) / 700 + 3;
// (ticket 176) The things that stand in a place and can't be walked
// through, by their name in the scene (the words before any comma or
// number: "rock, left" and "toadstool 3" are a rock and a toadstool), each a
// box under its drawing: across its drawing's width (a tree, a lamp or a
// sign only its trunk or post: TRUNK of that width, at least 16 units,
// under its middle), and from where it stands back as a seat's, by half
// its height, at most SOLID_DEPTH of its width; its height is its drawing's
// top above where it stands, so a low one (a rock, a log, a bush) is jumped
// as a low seat is. Not solid: what one goes into or up (houses, huts,
// doors, ladders, stairs), what is alive (people, animals), what hangs or
// flies, what lies flat, any object hidden (objectsOff), a seat (already
// one), and anything where one swims.
const STANDING = new Set(["anvil", "armor", "barrels", "basket", "bookcase", "box", "bucket", "buckets", "bunk beds", "bush", "cage", "campfire",
  "cat tree", "cauldron", "chest", "chest of gold", "coal heap", "column", "counter", "crate", "drum kit", "easel", "firewood", "flour sack", "forge",
  "fountain", "green bush", "hay cart", "hay heap", "keyboard", "log", "oven", "paint table", "picnic table", "pink bush", "plant", "potion shelves",
  "rock", "sand castle", "snake tank", "soup pot", "stone", "stove", "table", "tea table", "telescope", "toadstool", "toy chest", "tree trunk",
  "water barrel", "water trough", "well", "white bush", "worktable", "yellow bush"]);
const TRUNKED = new Set(["tree", "great tree", "jungle tree", "palm tree", "palm", "pine", "willow", "lamp", "umbrella", "sign", "signpost"]);
const TRUNK = 0.14, SWIM_PLACES = new Set(["lake", "underwater"]);
const objBase = name => name.split(",")[0].replace(/\s+\d+$/, "").trim();
function standingHere(B, seats) {
  if (SWIM_PLACES.has(B.kind) || !bgShown.node) return [];
  const off = objectsOff(B), k = (SCENE.bottom - SCENE.top) / 700, out = [];
  // (its box in the friend's units, through the screen, as ladderAt does: the scene may sit in a nested svg of its own)
  const picEl = document.getElementById("pic"), P = picEl && picEl.getScreenCTM(), Pinv = P ? P.inverse() : null;
  for (const o of bgShown.objs) {
    const base = objBase(o.name), trunk = TRUNKED.has(base);
    if (!(trunk || STANDING.has(base)) || !Number.isFinite(o.z) || off.has(o.name) || seats.has(o.name)) continue;
    let b = null;
    try {   // (Firefox throws for a drawing not shown)
      const r = o.node.getBBox(), E = o.node.getScreenCTM(), m = Pinv && E ? Pinv.multiply(E) : null;
      if (m && r.width > 0 && r.height > 0) {
        const pts = [[r.x, r.y], [r.x + r.width, r.y], [r.x, r.y + r.height], [r.x + r.width, r.y + r.height]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
        const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
        b = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
      }
    } catch (e) { continue; }
    if (!b || !(b.width > 0) || !(b.height > 0)) continue;
    const mid = b.x + b.width / 2, w = trunk ? Math.min(b.width, Math.max(16 * k, TRUNK * b.width)) : b.width, h = Math.max(0, o.z - b.y);
    out.push({ name: o.name, x0: mid - w / 2, x1: mid + w / 2, back: o.z - clamp(0.5 * h, 8, Math.max(8, SOLID_DEPTH * w)), front: o.z, h, standing: true });
  }
  return out;
}
// (the solids here, made again only when the place, its seats or its hidden objects change)
let solidMemo = { text: undefined, kind: null, off: "", list: [] };
function solidsHere() {
  const B = state.background;
  if (B.kind === "none") return [];
  const offKey = [...objectsOff(B)].join("|");
  if (solidMemo.text !== bgShown.text || solidMemo.kind !== B.kind || solidMemo.off !== offKey || !bgShown.text) {
    const seats = seatsHere(B);
    solidMemo = { text: bgShown.text, kind: B.kind, off: offKey, list: seats.map(t => { const w = t.x1 - t.x0, d = clamp(0.5 * (t.z - t.y), 8, Math.max(8, SOLID_DEPTH * w));   // (as deep as half its height, at most SOLID_DEPTH of its width: a couch is not as deep as it is wide)
      return { name: t.name, x0: t.x0, x1: t.x1, back: t.z - d, front: t.z, h: t.z - t.y }; }).concat(standingHere(B, new Set(seats.map(t => t.name)))) };
  }
  return solidMemo.list;
}
// the friend's legs, hip to foot, in the stage's units (for what a jump clears)
const legReach = () => poseJoints && poseJoints.legs && poseJoints.legs.length
  ? figureT.k * Math.max(...poseJoints.legs.map(l => Math.hypot(l.F[0] - l.H[0], l.F[1] - l.H[1]))) : 100 * figureT.k;
// what stops the friend's feet at (x, z): a wall, a solid, or null
function solidAt(x, z) {
  const B = state.background, W = castleWalls(B);
  if (W && Math.abs(x) > W.half(z) - SOLID_MARGIN) return { wall: true };
  const sitting = state.body.sit && B.seat, a = state.body.anim, jumping = isJump(a);
  const clears = jumping ? (a === "jumphigh" ? 1 : 0.5) * legReach() : 0;
  for (const o of solidsHere()) {
    if (sitting && o.name === B.seat) continue;
    if (o.h < clears) continue;
    if (x > o.x0 - SOLID_MARGIN && x < o.x1 + SOLID_MARGIN && z > o.back && z < o.front) return o;
  }
  return null;
}
// a move of the friend's feet from (x0, y0) to (x, y) (figX, figY): where
// they end up, sliding along a wall or a solid they meet; inside one
// already, any move that does not go deeper into it
function solidMove(x0, y0, x, y) {
  const g = SCENE.ground;
  if (!solidAt(x, g + y)) return [x, y];
  const here = solidAt(x0, g + y0);
  if (here && !here.wall) return [x, y];   // (inside a solid already: let them out)
  if (!solidAt(x, g + y0)) return [x, y0];
  if (!solidAt(x0, g + y)) return [x0, y];
  // (a wall alone: the farthest across it lets them, at the new depth)
  const W = castleWalls(state.background);
  if (W && !here) { const h = W.half(g + y) - SOLID_MARGIN - 0.5, cx = clamp(x, -h, h); if (!solidAt(cx, g + y)) return [cx, y]; }
  return [x0, y0];
}
// (after a jump: landed inside a solid, out by its nearer side)
function solidUnstick() {
  const B = state.background, x = B.figX ?? 0, z = SCENE.ground + (B.figY ?? 0), o = solidAt(x, z);
  if (!o || o.wall) return;
  B.figX = Math.round(x - o.x0 < o.x1 - x ? o.x0 - SOLID_MARGIN - 1 : o.x1 + SOLID_MARGIN + 1);
}

// The parts of the body each with its own visibility: a slider each
// (0 invisible to 100 all there), and the shirt and pants stand for the
// body and the legs under them.
const VISIBLE_PARTS = ["head", "eyes", "hair", "shirt", "pants", "feet", "hands"];
const visibility = () => Object.fromEntries(VISIBLE_PARTS.map(k =>
  [k, Math.max(0, Math.min(100, Number(state.visible?.[k] ?? 100))) / 100]));
// The masks the see-through layers need: each layer of a part but its last
// is hidden where the part's later layers are drawn (their shapes, inked
// black over white); the last one needs none.
function unveil(svg, layers) {
  // (ticket 161: without exact see-through, each layer its own see-through, no masks)
  if (!PERF.exactSeeThrough) return svg.replace(/ data-veil="(\w+) (\d+)"/g, "");
  let masks = "";
  for (const [g, N] of Object.entries(layers))
    for (let n = 1; n < N; n++) {
      masks += `<mask id="veil-m-${g}-${n}" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">` +
               `<rect x="-5000" y="-5000" width="10000" height="10000" fill="white"/>`;
      for (let m = n + 1; m <= N; m++) masks += `<use href="#veil-${g}-${m}" filter="url(#veil-ink)"/>`;
      masks += `</mask>`;
    }
  svg = svg.replace(/ data-veil="(\w+) (\d+)"/g, (_, g, n) => Number(n) < layers[g] ? ` mask="url(#veil-m-${g}-${n})"` : "");
  if (!masks) return svg;
  return `<defs><filter id="veil-ink" x="-0.5" y="-0.5" width="2" height="2" color-interpolation-filters="sRGB">` +
         `<feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>${masks}</defs>` + svg;
}

// WATER (ticket 122): where in a place the friend stands in water. Each
// place with water to stand in has a test of whether a point on the stage
// (in its units, the ground line at 320) is in it, made from the same lines
// the place's drawing uses: lakeLines and lakeBeach, beachLines, poolOf,
// castleAt and moatOf, streamAt and brookAt. Under the sea is not here: the
// friend is all under water there already.
// (the stage as a scene function sees it, in the picture: backgroundSvg's c)
const stageC = () => { const x0 = SCENE.left, y0 = SCENE.top, x1 = -SCENE.left, y1 = SCENE.bottom, W = x1 - x0, H = y1 - y0;
  return { x0, y0, x1, y1, g: SCENE.ground, W, H, k: H / 700, pad: Math.max(W, H) }; };
// (a curve from a to b, bowed by q halfway across: its height at x, or null past its ends)
const bowY = (a, q, b, x) => { const t = (x - a[0]) / (b[0] - a[0]);
  return t < 0 || t > 1 ? null : (1 - t) * (1 - t) * a[1] + 2 * t * (1 - t) * q[1] + t * t * b[1]; };
// (the height at x of the wavy edge backgroundSvg's land(at, amp, fill, phase)
// draws: a bow to each twelfth of its width; keep the two alike)
const landY = ({ x0, W, k, pad }, at, amp, phase, x) => {
  const span = W + 2 * pad, i = Math.max(1, Math.min(12, Math.ceil((x - x0 + pad) / span * 12)));
  const xa = x0 - pad + span * (i - 1) / 12, xb = x0 - pad + span * i / 12;
  return bowY([xa, at], [xb - span / 24, at + amp * k * Math.sin(i * 1.7 + phase)], [xb, at], x) ?? at;
};
// (a winding ribbon of water, drawn through its points [middle, y, half its
// width] going down the picture, as a stream is (sampled): is (x, y) in it?)
const inRibbon = (pts, x, y) => {
  // (the first piece whose lower end is at or below y, found by halving)
  if (pts.length < 2 || y < pts[0][1] || y > pts[pts.length - 1][1]) return false;
  let lo = 1, hi = pts.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (pts[mid][1] < y) lo = mid + 1; else hi = mid; }
  const [xa, ya, ha] = pts[lo - 1], [xb, yb, hb] = pts[lo];
  const t = yb > ya ? (y - ya) / (yb - ya) : 0;
  return Math.abs(x - (xa + (xb - xa) * t)) < ha + (hb - ha) * t;
};
const WATER = {
  // the lake, from its far shore to its near one, but for the little beach
  lake: c => { const { horizon, shore } = lakeLines(c), [a, q, b] = lakeBeach(c, shore);
    return (x, y) => y > horizon && y < landY(c, shore, 5, 1.1, x) && y < (bowY(a, q, b, x) ?? Infinity); },
  // (ticket 186) open water: all of it, from the horizon down
  sea: c => { const hz = seaHorizon(c); return (x, y) => y > hz; },
  // the sea, from the horizon to the sand (the foam at its edge is sea too)
  beach: c => { const { sea, shore } = beachLines(c); return (x, y) => y > sea && y < landY(c, shore + 4 * c.k, 6, 1.4, x); },
  // the falls' pool, but where the near bank covers it
  waterfall: c => { const p = poolOf(c);
    return (x, y) => (x / p.rx) * (x / p.rx) + ((y - p.cy) / p.ry) * ((y - p.cy) / p.ry) < 1 && y < landY(c, p.near, 4, 1.1, x); },
  // the moat's near half, but for the drawbridge (its far half is behind the
  // walls, and a friend standing there is behind the whole castle); none
  // when the castle has no moat
  castle: (c, B) => { const K = castleOf(B); if (K.moat <= 0) return null;
    const { foot, z } = castleAt(c, K), M = moatOf(K.moat);
    return (x, y) => { const u = x / z, v = (y - foot) / z;
      return v > 0 && (u / M.rx) * (u / M.rx) + ((v - M.cy) / M.ry) * ((v - M.cy) / M.ry) < 1 && !(v < M.len && Math.abs(u) < bridgeHalf(v)); }; },
  // the tree house's stream and the cemetery's brook, as their outlines are drawn
  treehouse: c => { const pts = sampled(streamAt(c), 30); return (x, y) => inRibbon(pts, x, y); },
  cemetery: c => { const pts = sampled(brookAt(c), 20); return (x, y) => inRibbon(pts, x, y); },
};
// a place's test, or null where there is no water to stand in
const waterHere = B => WATER[B.kind]?.(stageC(), B) ?? null;
const inWater = (B, x, y) => { const at = waterHere(B); return !!at && at(x, y); };
// (a stream and a brook are shallow: in them the friend is in to the knees,
// not the waist)
const SHALLOW_WATER = { treehouse: true, cemetery: true };
// (how far the water reaches across from (x, y), to the nearer bank, up to
// `most`: a wake keeps to the water, in a narrow stream as in a lake)
const waterAcross = (B, x, y, most) => { const at = waterHere(B); let d = 0;
  while (d < most && at && at(x - d - 4, y) && at(x + d + 4, y)) d += 4;
  return d; };
// (the water's own shape round a spot on the stage: rows `step` apart, each
// the runs across it of points in the place's water, as [x, y, width])
// (ticket 163) Each row is worked out once for a place, across the whole
// stage and past it, and kept until the place's drawing changes; a drawing
// takes the rows round the friend and cuts them to its window. Before, the
// runs round the friend were worked out again whenever they moved, hundreds
// of tests of the place's water every drawing, and a swim in the duck pond
// drew 12 times a second on a computer 6 times slower than Matthew's.
const WATER_X0 = -1000, WATER_X1 = 1000;
let waterRows = { key: null, bg: null, rows: new Map() };
