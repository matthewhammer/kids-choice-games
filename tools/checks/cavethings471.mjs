// (ticket 471, Matthew: "Gems are extra things to add, including 6 styles"; "puddle on ground, with/without drip from
// ceiling"; "Little waterfall ... into a puddle on the floor; all connected into one placeable object, for now --- 6 styles")
// The 🦇 cave things: in their own group; each gem kind and each little waterfall kind drawn, sparkling or running (things
// moving); a little waterfall's rock in the way, its pool not; a gem and a puddle walked over; a puddle with a drip has a
// drop falling, one without has none; the friend stands in a puddle (in front of its back edge). And the cave passages
// ("we also want to place cave passageways (dark openings that look like natural archways, holes in the wall, and holes in
// the floor)"): each kind a doorway to the place it says, no more in the way than a door; through one, and back by ⬅️.
// And part 4 ("mushrooms ... maybe more styles, for a dark cave?"; "treasure chest"): each cave mushroom kind drawn,
// glowing, and sat on; a treasure chest open with 🪙 gold, 💎 gems or 👑 a crown, sparkling, and shut with its lock.
// Exits 1 on a failure.
//   node cavethings471.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null;
    const group = ["gem", "puddle", "cascade", "passage"].map(k => THING_KINDS[k] && THING_KINDS[k].group);
    const T = [];
    GEM_STYLES.forEach(([st], i) => T.push({ kind: "gem", x: -330 + i * 60, z: 380, seed: 100 + i, size: 100, mirror: false, ...structuredClone(THING_DEFAULTS.gem), style: st }));
    CASCADE_STYLES.forEach(([st], i) => T.push({ kind: "cascade", x: -330 + i * 130, z: 250, seed: 200 + i, size: 100, mirror: false, style: st }));
    T.push({ kind: "puddle", x: 120, z: 330, seed: 300, size: 100, mirror: false, drip: true }, { kind: "puddle", x: 280, z: 360, seed: 301, size: 100, mirror: false, drip: false });
    Object.assign(B, { kind: "caveroom", figX: -60, figY: 40, seat: null, things: T }); state.body.sit = false; changed(); await w(800);
    const els = [...bgShown.node.querySelectorAll(".thing")].map(el => { const t = B.things[+el.dataset.drag.split(":")[1]], b = el.getBBox();
      return { kind: t.kind, style: t.style || (t.drip ? "drip" : "still"), w: Math.round(b.width), h: Math.round(b.height), anims: el.querySelectorAll("animate").length }; });
    const solids = solidsHere().map(o => o.name);
    const depth = [thingDepth(B, T[12]) < T[12].z, thingDepth(B, T[0]) === T[0].z];
    // the passages: each kind leading somewhere of its own
    B.things = PASSAGE_STYLES.map(([st], i) => ({ kind: "passage", x: -250 + i * 230, z: i === 2 ? 340 : 260, seed: 400 + i, size: 100, mirror: false, style: st, to: ["cave", "forest", "beach"][i] }));
    Object.assign(B, { figX: 40, figY: 60 }); changed(); await w(800); measureMarks();
    const doors = marks.pics.filter(p => p.el.closest && p.el.closest(".thing")).map(p => ({ kind: p.kind, to: p.el.dataset.to, spot: !!p.spot }));
    const passSolids = solidsHere().filter(o => /^passage/.test(o.name)).length;
    enterScene(bgShown.node.querySelector('.thing .portal[data-to="forest"]')); await w(5000);
    const went = B.kind; if (!backBtn.hidden) backBtn.click(); await w(5000);
    // part 4: the cave mushrooms and the chest's treasure
    B.things = [...CAVE_MUSHROOMS.map(([st], i) => ({ kind: "cavemushroom", x: -320 + i * 120, z: 300, seed: 500 + i, size: 100, mirror: false, style: st, color: CAVE_MUSHROOM_COLORS[i], glow: true })),
      ...[["gold", true], ["gems", true], ["crown", true], ["gold", false]].map(([tr, op], i) => ({ kind: "chest", x: -300 + i * 180, z: 385, seed: 600 + i, size: 100, mirror: false, open: op, treasure: tr }))];
    Object.assign(B, { kind: "caveroom", figX: 330, figY: -60 }); changed(); await w(800);
    const p4 = [...bgShown.node.querySelectorAll(".thing")].map(el => { const t = B.things[+el.dataset.drag.split(":")[1]], b = el.getBBox();
      return { kind: t.kind, style: t.style || (t.open ? t.treasure : "shut"), w: Math.round(b.width), anims: el.querySelectorAll("animate").length, gems: el.querySelectorAll('path[d*="Z"]').length, lock: !!el.querySelector('circle[fill="#3a2a10"]') }; });
    const mushSeats = seatsHere(B).filter(t => /^cavemushroom/.test(t.name)).length;
    return JSON.stringify({ group, els, solids, depth, doors, passSolids, trip: [went, B.kind], places: passagePlaces().length, p4, mushSeats }); })()`));
  const E = r.els, by = (k, st) => E.find(e => e.kind === k && e.style === st);
  ok("the gem, the puddle and the little waterfall are 🦇 cave things", r.group.every(g => g === "cave"), r.group);
  ok("every gem kind drawn, sparkling", ["cut", "cluster", "geode", "point", "rough", "heart"].every(st => { const e = by("gem", st); return e && e.w > 20 && e.h > 20 && e.anims >= 2; }), E.filter(e => e.kind === "gem"));
  ok("every little waterfall kind drawn, its water running", ["trickle", "sheet", "steps", "spout", "mossy", "glowing"].every(st => { const e = by("cascade", st); return e && e.w > 50 && e.h > 60 && e.anims >= 3; }), E.filter(e => e.kind === "cascade"));
  ok("a puddle with a drip has a drop falling and rings; one without has none", by("puddle", "drip").anims >= 5 && by("puddle", "still").anims === 0, E.filter(e => e.kind === "puddle"));
  ok("a little waterfall's rock is in the way; gems and puddles are not", r.solids.filter(s => s.startsWith("cascade")).length === 6 && !r.solids.some(s => /^(gem|puddle)\\b/.test(s)), r.solids);
  ok("one stands in a puddle (its depth is its back edge); a gem stands at its foot", r.depth[0] && r.depth[1], r.depth);
  ok("each cave passage is a doorway to its own place, with a spot to walk to", r.doors.length === 3 && ["cave", "forest", "beach"].every(to => r.doors.some(d => d.to === to && d.spot)), r.doors);
  ok("a passage is no more in the way than a door", r.passSolids === 0, r.passSolids);
  ok("through a passage to the forest, and back to the cave room by ⬅️", r.trip[0] === "forest" && r.trip[1] === "caveroom", r.trip);
  ok("a passage may lead to any place but a castle's or a tree house's rooms", r.places >= 25, r.places);
  const M = r.p4.filter(e => e.kind === "cavemushroom"), C = r.p4.filter(e => e.kind === "chest");
  ok("every cave mushroom kind drawn, glowing", ["glowcap", "bells", "cluster", "shelves", "tall", "puffballs"].every(st => { const e = M.find(m => m.style === st); return e && e.w > 20 && e.anims >= 2; }), M);
  ok("the cave mushrooms can be sat on", r.mushSeats >= 4, r.mushSeats);
  ok("a chest open with gold, gems or a crown sparkles; shut, it has its lock", ["gold", "gems", "crown"].every(tr => { const e = C.find(c => c.style === tr); return e && e.anims >= 3; }) && C.find(c => c.style === "shut").lock, C);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
