// (ticket 502, for M; Matthew: "farm yard -- placeable ojects are barn buildings (6 types) and fence parts (posts with lateral
// connections, 3 types) -- let's start to plan fence creation as an in-game experience. Harvest mood let people pick up pieces
// of fence and move them tile by tile We don't have tiles yet. We havent' moved objects -- let's start experimenting.")
// The 🚜 farm yard: a place in the home group, its objects there (the barn and farmhouse, the back fence, the windpump and the
// trough, the tractor, the haystack, the hens), things moving, the friend arriving clear of what stands in the way. The 🚜 farm
// things: every barn kind drawn (the red barn's weather vane and the coop's hens moving) and standing in the way; every fence
// kind drawn. The tiles: fence pieces snap to a tile's row and column; one beside another of its kind on its row reaches it
// with its rails (fenceLinks: wider than a lone post's stubs), one of another kind or row does not; tileNext finds the tile
// beside the last, and once its row is full a tile on another row, as the last; a piece dragged with the pointer goes tile by
// tile and lands on a tile of its row further right, and its old neighbour is left with a stub; two joined at the back stay
// joined when 🔭 changes. Exits 1 on a failure.
//   node farm502.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1200)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground;
    state.music.mute = true; state.world.at = null; slowFlag = false; PERF.slowMoving = true;   // (GitHub's computer is slow: its scenery would be held still)
    const objsNow = () => [...bgShown.node.querySelectorAll("[data-obj]")].map(o => o.dataset.obj);
    const place = { inPlaces: PLACES.some(p => p[0] === "farmyard"), group: PLACE_GROUPS.filter(x => x[2].includes("farmyard")).map(x => x[0]), phrase: PLACE_PHRASE.farmyard,
      lfo: SCENE_LFO_THINGS.farmyard || null, scene: typeof SCENES.farmyard === "function", things: ["barn", "fencepiece"].map(k => THING_KINDS[k] && THING_KINDS[k].group) };
    Object.assign(B, { kind: "farmyard", figX: ARRIVE.farmyard[0], figY: ARRIVE.farmyard[1], seat: null, things: [] }); state.body.sit = false; changed(); await w(800);
    const yard = { objs: objsNow(), anims: bgShown.node.querySelectorAll("animate, animateTransform, animateMotion").length, solids: solidsHere().map(o => o.name),
      arriveClear: !solidAt(ARRIVE.farmyard[0], g + ARRIVE.farmyard[1]) };
    // every barn kind, in a row at the back, and a fence piece of each kind, apart
    const T = [];
    BARN_STYLES.forEach(([st], i) => T.push({ kind: "barn", x: -330 + i * 130, z: 262, seed: 100 + i, size: 60, mirror: false, style: st, color: "none" }));
    FENCE_STYLES.forEach(([st], i) => T.push({ kind: "fencepiece", x: -250 + i * 250, z: 380, seed: 200 + i, size: 100, mirror: false, style: st }));
    B.things = T; changed(); await w(800);
    const els = [...bgShown.node.querySelectorAll(".thing")].map(el => { const t = B.things[+el.dataset.drag.split(":")[1]], b = el.getBBox();
      return { kind: t.kind, style: t.style, w: Math.round(b.width), h: Math.round(b.height), anims: el.querySelectorAll("animate, animateTransform").length }; });
    const thingSolids = solidsHere().map(o => o.name).filter(s => /^(barn|fencepiece)\\b/.test(s));
    // the tiles: three wooden pieces put near the tiles of one row, side by side, left of the middle (clear of the friend and the
    // haystack); a lone one in another row; a picket piece beside the run, put last
    const snap = (x, z, style = "wood") => { const t = { kind: "fencepiece", x, z, seed: 300 + B.things.length, size: 100, mirror: false, style }; tileSnap(B, t); B.things.push(t); return t; };
    B.things = []; const zr = tileRowZ(B, 0) + 3, w0 = tileSpan(B, tileRowZ(B, 0));
    const a = snap(-3 * w0 - 6, zr), b = snap(-2 * w0 + 9, zr - 5), c = snap(-w0 - 12, zr + 4), e = snap(2 * w0, tileRowZ(B, -4) + 2), d = snap(4, zr, "picket");
    changed(); await w(800);
    const onTile = t => { const r = tileRowOf(B, t.z), wt = tileSpan(B, t.z); return Math.abs(r - Math.round(r)) < 0.02 && Math.abs(t.x / wt - Math.round(t.x / wt)) < 0.02; };
    const width = i => Math.round(bgShown.node.querySelector('[data-drag="thing:' + i + '"]').getBBox().width);
    const tiles = { onTile: [a, b, c, e, d].map(onTile), row: [a, b, c].map(t => t.z), cols: [a, b, c, d].map(t => Math.round(t.x / tileSpan(B, t.z))),
      links: [0, 1, 2, 3, 4].map(i => fenceLinks(B, i)), widths: [0, 1, 2, 3, 4].map(width), span: Math.round(w0), next: tileNext(B, "fencepiece") };
    // dragged with the pointer, held by its post: the right end of the wooden run, 1.6 tiles further right and a little down
    // (ticket 502, its first run on GitHub, 0.0.392: "FAIL a piece dragged with the pointer lands on a tile, further right:
    // {"x":130.5,"z":378,"from":130.5,...}". The game had moved it, from x -110 on row 0 (z 350) to 130.5 on row 1 (z 378), two
    // tiles right; but from was read after the drag, from c, which is the piece the drag moves (B.things[2]), so it was always
    // its new x. Where it was put is kept before the drag now. And "a little down" was 16 screen pixels: past half a row (12.8
    // of the picture's units at row 0) wherever the picture is drawn 1.25 times or less, as on GitHub, so it landed a row
    // nearer there and not on a bigger screen; now a quarter of a row's depth, in the picture's units, on its row on any screen)
    const el = bgShown.node.querySelector('[data-drag="thing:2"]'), M = el.getScreenCTM(), px = 1.6 * w0 * M.a, py = 0.25 * (tileRowZ(B, 1) - c.z) * M.d;
    const p0 = new DOMPoint(c.x, c.z - 45 * depthSize(B, c.z - g)).matrixTransform(M), from = { x: c.x, z: c.z }, path = [];
    let x = p0.x, y = p0.y;
    const fire = (type, x, y) => (document.elementFromPoint(x, y) || el).dispatchEvent(new PointerEvent(type, { bubbles: true, isPrimary: true, pointerId: 9, clientX: x, clientY: y, button: 0, buttons: type === "pointerup" ? 0 : 1 }));
    fire("pointerdown", x, y); for (let i = 1; i <= 8; i++) { fire("pointermove", x + px * i / 8, y + py * i / 8); path.push(Math.round(c.x / tileSpan(B, c.z))); await w(30); }
    fire("pointerup", x + px, y + py); await w(800);
    // (where it went at each move, by column, each column once: tile by tile, as Matthew asked, "move them tile by tile")
    const moved = B.things[2], drag = { x: moved.x, z: moved.z, from, tiles: Math.round((moved.x - from.x) / tileSpan(B, moved.z)), path: path.filter((k, i) => k !== path[i - 1]),
      onTile: onTile(moved), links: [fenceLinks(B, 1), fenceLinks(B, 2)], width1: width(1) };
    // (from a review) two wooden pieces side by side at the back (row -4), then 🔭 changed: still joined
    B.things = []; const zb = tileRowZ(B, -4), wb = tileSpan(B, zb), nk = "north_" + B.kind, keep = B[nk];
    snap(-wb, zb); snap(0, zb);
    const north = [0, 20, 60].map(v => { B[nk] = v; return fenceLinks(B, 0)[1] > 0 && fenceLinks(B, 1)[0]; }); B[nk] = keep;
    // (from a review) tapped in again and again, as add does: its row full, the next piece goes on a tile of another row, as the last
    B.things = []; snap(0, tileRowZ(B, 0), "picket").size = 80;
    let after = null;
    for (let k = 0; k < 40; k++) { const nx = tileNext(B, "fencepiece"); if (!nx || Math.abs(nx.z - B.things[0].z) > 0.6) { after = nx; break; }
      B.things.push({ kind: "fencepiece", x: nx.x, z: nx.z, seed: 400 + k, size: nx.size, mirror: !!nx.mirror, style: nx.style }); }
    const full = { n: B.things.length, next: after, onTile: !!after && onTile(after) };
    B.things = []; changed();
    return JSON.stringify({ place, yard, els, thingSolids, tiles, drag, north, full }); })()`));
  const { place: P, yard: Y, els: E, thingSolids: S, tiles: Tl, drag: D, north: N, full: Fu } = r;
  ok("the farm yard is a place: in the list, in the home group once, its words, its LFO things (quick and slow), its scene", P.inPlaces && P.group.length === 1 && P.group[0] === "home" && /farm yard/.test(P.phrase || "") && P.lfo && P.lfo.fast && P.lfo.slow && P.scene, P);
  ok("its objects: the barn and the farmhouse, the back fence, the windpump and the trough, the tractor, the haystack, three hens",
     ["red barn", "farmhouse", "fence, back", "windpump", "water trough", "tractor", "haystack", "hen, brown", "hen, white", "hen, black"].every(o => Y.objs.includes(o)), Y.objs);
  ok("things moving in it (the hens, the vane, the straw, the windpump, the clouds, the smoke)", Y.anims >= 12, Y.anims);
  ok("the windpump, the trough, the tractor and the haystack stand in the way", ["windpump", "water trough", "tractor", "haystack"].every(o => Y.solids.includes(o)), Y.solids);
  ok("the friend arrives clear of everything", Y.arriveClear, Y);
  ok("the barn and the fence are 🚜 farm things", P.things.every(x => x === "farm"), P.things);
  const by = (k, st) => E.find(e => e.kind === k && e.style === st);
  // (from a review: at 60% at the back the little coop is about 40 across and tall, the others over 55)
  ok("every barn kind drawn", ["gambrel", "round", "stone", "pole", "coop", "silo"].every(st => { const e = by("barn", st), m = st === "coop" ? 30 : 50; return e && e.w > m && e.h > m; }), E.filter(e => e.kind === "barn"));
  ok("the red barn's weather vane turns, the coop's hens peck", by("barn", "gambrel").anims >= 1 && by("barn", "coop").anims >= 2, E.filter(e => e.kind === "barn"));
  ok("every fence kind drawn", ["wood", "picket", "stone"].every(st => { const e = by("fencepiece", st); return e && e.w > 20 && e.h > 40; }), E.filter(e => e.kind === "fencepiece"));
  ok("the barns and the fence pieces stand in the way", S.filter(s => s.startsWith("barn")).length === 6 && S.filter(s => s.startsWith("fencepiece")).length === 3, S);
  ok("fence pieces put near tiles land on them: a row, a column", Tl.onTile.every(Boolean) && new Set(Tl.row).size === 1 && Tl.cols.join() === "-3,-2,-1,0", Tl);
  ok("side by side on a row, each reaches the next of its kind: the first and the middle have a right neighbour, the last a left one only", JSON.stringify(Tl.links.slice(0, 3).map(([l, rt]) => [l, rt > 0])) === JSON.stringify([[false, true], [true, true], [true, false]]), Tl.links);
  ok("a piece of another kind beside them, and one in another row, join nothing", JSON.stringify(Tl.links.slice(3).map(([l, rt]) => [l, rt > 0])) === JSON.stringify([[false, false], [false, false]]), Tl.links);
  ok("a piece reaching its neighbour is drawn about a tile wide; a lone one, its stubs, much narrower", Tl.widths[0] > 0.85 * Tl.span && Tl.widths[1] > 0.85 * Tl.span && Tl.widths[3] < 0.6 * Tl.span, { widths: Tl.widths, span: Tl.span });
  ok("tileNext: the tile beside the last piece, on its row, as it is", Tl.next && Math.abs(Tl.next.z - Tl.row[0]) < 0.6 && Tl.next.style === "picket", Tl.next);
  ok("a piece dragged with the pointer goes tile by tile and lands on a tile of its row, further right (1.6 tiles dragged: two tiles)",
     D.onTile && D.x > D.from.x && Math.abs(D.z - D.from.z) < 0.6 && D.tiles === 2 && D.path.join() === "-1,0,1", D);
  ok("and its old neighbour is left with a stub (no piece to its right now), narrower", !D.links[0][1] && D.width1 < 0.6 * Tl.span, D);
  ok("🔭 changed afterwards: two pieces joined at the back stay joined", N.every(Boolean), N);
  ok("tapped in on a full row: the next piece goes on a tile of another row, a picket of its size", Fu.n >= 5 && Fu.next && Fu.onTile && Fu.next.style === "picket" && Fu.next.size === 80, Fu);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
