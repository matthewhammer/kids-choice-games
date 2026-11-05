// (ticket 691, Matthew 2026-11-04: "flight in an air balloon, or on bubbles, or another craft. we see the current world from
// above; each background is a square in a quilt and we see them woven together at some scale dep on our 'height', not one at
// a time") Flying: 🎈 the hot-air balloon and 🫧 a big bubble are items, on 🎒 your items each with 🛫 fly. Taken off from a
// square of the world, the picture is the world from above, each square a tile of the quilt, the scene and the standing friend
// gone, the friend riding, seen from above (topDownSvg), the flight's buttons and the place's name shown; low, about one square
// across, high, the whole world, the things left out; no SMIL; each place's look with all eight paths at most 56 shapes, its
// finer things (seen only low down) at most 60 more: the castle's moat and towers, the tree house's houses. The
// arrow keys fly them, a tap flies toward the spot, Page Up climbs; F breathes no fire up there. Landing over a place enters it,
// the scene back; over an empty square they stay up, told why; inside, off the grid, they cannot take off. Exits 1 on a failure.
//   node flight691.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 900)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    // (the frames driven by hand, so the run is the same every time)
    const run = k => { let t = performance.now(); for (let i = 0; i < k && flight; i++) { t += 16.7; cancelAnimationFrame(flyLoop); flyLoop = 0; flyTick(t); } cancelAnimationFrame(flyLoop); flyLoop = 0; };
    const key = (k, type = "keydown") => document.body.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true }));
    const count = t => (t.match(/<(path|circle|ellipse|rect|polygon|polyline|line|use|image|text)[\\s>\\/]/g) || []).length;
    const pic = () => document.getElementById("pic"), W = state.world;
    state.music.mute = true; worldEnter(W.start); await w(100);
    // (🎒 your items: the two crafts, each with 🛫 fly)
    itemsShow(true); await w(60);
    const tile = id => document.querySelector('.items-tile[data-item="' + id + '"]');
    out.screen = ["balloon", "bubbleride"].map(id => !!tile(id) && !!tile(id).querySelector(".items-fly"));
    tile("balloon").querySelector(".items-fly").click(); await w(60);
    out.up = { flying: !!flight, shut: !itemsOpen, quilt: !!pic().querySelector("#fly"), tiles: Object.keys(W.cells).every(k => !!pic().querySelector('#fly [data-tile="' + k + '"]:not([data-wild])')),
               scene: !!pic().querySelector("#figure"), rider: (pic().querySelector('#fly-craft g[transform*="scale(0.62)"]') || { childElementCount: 0 }).childElementCount > 3, hud: !document.getElementById("fly-hud").hidden,
               where: document.querySelector(".fly-where").textContent, from: W.at };
    run(120);
    out.low = { span: flySpan(0), h: flight.h };
    // (high: the whole world; the things left out; no SMIL)
    flight.h = 1; flyPlace(); const things = pic().querySelector("#fly .fly-things");
    out.high = { span: flySpan(1), rows: W.rows, cols: W.cols, high: pic().querySelector("#fly").classList.contains("fly-high"), hidden: !things || getComputedStyle(things).display === "none", smil: /<animate|<set\\b/.test(pic().innerHTML) };
    flight.h = 0.3; flyPlace();
    // (each place's look, with all eight paths)
    // (its finer things, .fly-near, apart: seen only low down; the castle and the tree at their biggest settings too)
    const split = t => { const d = document.createElementNS("http://www.w3.org/2000/svg", "g"); d.innerHTML = t; const near = [...d.querySelectorAll(".fly-near")].reduce((a, x) => a + count(x.innerHTML), 0); return [count(t) - near, near]; };
    out.looks = {}; const big = { ...state.background, castle: "D", houses: 6, bridges: 6, ladders: 6, ducks: 12, cattails: 30, toys: 16, mushrooms: 30, vines: 16, parrots: 4, gardenBeds: 6, hutRooms: 6, hutCenter: true, tents: 3, pastureHorses: 3, pastureFlowers: 24 };
    for (const [k] of PLACES) if (k !== "none") for (const o of [state.background, big]) { const [base, near] = split(flyLookOf(k, "1,1", o) + flyPathsSvg(k, Object.keys(WORLD_DIRS))); if (base > 56 || near > 60) out.looks[k] = [base, near]; }
    // (the keys: → flies east, Page Up climbs, F does nothing up here)
    const x0 = flight.x, h0 = flight.h; key("ArrowRight"); run(40); key("ArrowRight", "keyup"); key("PageUp"); run(20); key("PageUp", "keyup");
    key("f"); out.keys = { east: flight.x - x0, climbed: flight.h - h0, fire: !!fireSim.raf || fireKey }; key("f", "keyup");
    // (a tap to the west of the craft: flies that way)
    const p = pic().getBoundingClientRect(), x1 = flight.x;
    pic().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: p.left + p.width * 0.2, clientY: p.top + p.height * 0.62 }));
    run(120); out.tap = flight.x - x1;
    // (over an empty square: no landing)
    let empty = null; for (let rr = 0; rr < W.rows && !empty; rr++) for (let cc = 0; cc < W.cols; cc++) if (!W.cells[cc + "," + rr]) { empty = [cc, rr]; break; }
    if (empty) { flight.x = empty[0] + 0.5; flight.y = empty[1] + 0.5; flyPlace(); flightLand(); run(240); out.empty = { flying: !!flight, said: document.querySelector(".fly-where").textContent }; }
    // (over a place, D4's neighbour to the west: landed there, its scene back)
    const [c0, r0] = W.start.split(",").map(Number), there = (c0 - 1) + "," + r0;
    flight.x = c0 - 0.5; flight.y = r0 + 0.5; flyPlace(); flightLand(); run(300); await w(100);
    out.land = { landed: !flight, at: W.at, there, kind: state.background.kind, want: W.cells[there] && W.cells[there].kind, scene: !!pic().querySelector("#figure"), quilt: !!pic().querySelector("#fly"), hud: document.getElementById("fly-hud").hidden };
    // (inside, off the grid: no take-off)
    const at = W.at; W.at = null; out.inside = flightStart("balloon"); W.at = at; changed();
    // (the bubble, from its slot's key)
    const keep = { ...state.pack }; state.pack = { ...keep, a: "bubbleride" }; changed(); key("z"); key("z", "keyup"); await w(40);
    out.bubble = { craft: flight && flight.craft, drawn: !!pic().querySelector("#fly-craft circle[stroke='#bfe6ff']") };
    key("z"); key("z", "keyup"); run(300); out.bubble.landed = !flight; state.pack = keep; changed();
    return JSON.stringify(out); })()`));
  ok("🎒 your items: 🎈 the hot-air balloon and 🫧 a big bubble, each with 🛫 fly", r.screen.every(Boolean), r.screen);
  ok("taken off: the world from above, every square a tile, the scene gone, the friend riding, the flight's buttons and the place's name", r.up.flying && r.up.shut && r.up.quilt && r.up.tiles && !r.up.scene && r.up.rider && r.up.hud && r.up.where.length > 3, r.up);
  ok("low, about one square across; high, the whole world, its things left out; no SMIL", r.low.span < 1.2 && r.high.span >= r.high.rows && r.high.high && r.high.hidden && !r.high.smil, [r.low, r.high]);
  ok("each place from above, with all eight paths: at most 56 shapes, and at most 60 finer ones seen only low down", !Object.keys(r.looks).length, r.looks);
  ok("→ flies east, Page Up climbs, F breathes no fire up there", r.keys.east > 0.2 && r.keys.climbed > 0.05 && !r.keys.fire, r.keys);
  ok("a tap to the west flies that way", r.tap < -0.1, r.tap);
  ok("over an empty square: still up, told there is nowhere to land", !r.empty || (r.empty.flying && /Nowhere/.test(r.empty.said)), r.empty);
  ok("down over a place: landed there, its scene back, the quilt and buttons gone", r.land.landed && r.land.at === r.land.there && r.land.kind === r.land.want && r.land.scene && !r.land.quilt && r.land.hud, r.land);
  ok("inside, off the grid: no take-off", r.inside === false, r.inside);
  ok("🫧 a big bubble, from its slot's key: ridden, and its key again lands", r.bubble.craft === "bubbleride" && r.bubble.drawn && r.bubble.landed, r.bubble);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
