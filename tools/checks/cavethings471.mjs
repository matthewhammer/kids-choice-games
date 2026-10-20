// (ticket 471, Matthew: "Gems are extra things to add, including 6 styles"; "puddle on ground, with/without drip from
// ceiling"; "Little waterfall ... into a puddle on the floor; all connected into one placeable object, for now --- 6 styles")
// The 🦇 cave things: in their own group; each gem kind and each little waterfall kind drawn, sparkling or running (things
// moving); a little waterfall's rock in the way, its pool not; a gem and a puddle walked over; a puddle with a drip has a
// drop falling, one without has none; the friend stands in a puddle (in front of its back edge). Exits 1 on a failure.
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
    const group = ["gem", "puddle", "cascade"].map(k => THING_KINDS[k] && THING_KINDS[k].group);
    const T = [];
    GEM_STYLES.forEach(([st], i) => T.push({ kind: "gem", x: -330 + i * 60, z: 380, seed: 100 + i, size: 100, mirror: false, ...structuredClone(THING_DEFAULTS.gem), style: st }));
    CASCADE_STYLES.forEach(([st], i) => T.push({ kind: "cascade", x: -330 + i * 130, z: 250, seed: 200 + i, size: 100, mirror: false, style: st }));
    T.push({ kind: "puddle", x: 120, z: 330, seed: 300, size: 100, mirror: false, drip: true }, { kind: "puddle", x: 280, z: 360, seed: 301, size: 100, mirror: false, drip: false });
    Object.assign(B, { kind: "caveroom", figX: -60, figY: 40, seat: null, things: T }); state.body.sit = false; changed(); await w(800);
    const els = [...bgShown.node.querySelectorAll(".thing")].map(el => { const t = B.things[+el.dataset.drag.split(":")[1]], b = el.getBBox();
      return { kind: t.kind, style: t.style || (t.drip ? "drip" : "still"), w: Math.round(b.width), h: Math.round(b.height), anims: el.querySelectorAll("animate").length }; });
    const solids = solidsHere().map(o => o.name);
    return JSON.stringify({ group, els, solids, depth: [thingDepth(B, T[12]) < T[12].z, thingDepth(B, T[0]) === T[0].z] }); })()`));
  const E = r.els, by = (k, st) => E.find(e => e.kind === k && e.style === st);
  ok("the gem, the puddle and the little waterfall are 🦇 cave things", r.group.every(g => g === "cave"), r.group);
  ok("every gem kind drawn, sparkling", ["cut", "cluster", "geode", "point", "rough", "heart"].every(st => { const e = by("gem", st); return e && e.w > 20 && e.h > 20 && e.anims >= 2; }), E.filter(e => e.kind === "gem"));
  ok("every little waterfall kind drawn, its water running", ["trickle", "sheet", "steps", "spout", "mossy", "glowing"].every(st => { const e = by("cascade", st); return e && e.w > 50 && e.h > 60 && e.anims >= 3; }), E.filter(e => e.kind === "cascade"));
  ok("a puddle with a drip has a drop falling and rings; one without has none", by("puddle", "drip").anims >= 5 && by("puddle", "still").anims === 0, E.filter(e => e.kind === "puddle"));
  ok("a little waterfall's rock is in the way; gems and puddles are not", r.solids.filter(s => s.startsWith("cascade")).length === 6 && !r.solids.some(s => /^(gem|puddle)\\b/.test(s)), r.solids);
  ok("one stands in a puddle (its depth is its back edge); a gem stands at its foot", r.depth[0] && r.depth[1], r.depth);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
