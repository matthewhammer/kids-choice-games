// (ticket 270) Up the spiral staircase (N's room 2 made one), the friend high on the steps at the back is the size they
// would be on the floor straight below that step, not shrunk with their height on the picture; on the floor, as before.
// Exits 1 on a failure.
//   node spiral270.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 2, castleRoom2N: "spiral", figX: 0, figY: 40, things: [] }); changed(); await w(600);
    const G = spiralGeom(stageC()), rm = (G.r0 + G.R) / 2, g = SCENE.ground, at = th => { const [x, y] = G.pt(rm, th, G.lvl(th)); B.figX = Math.round(x); B.figY = Math.round(y - g); changed(); return +figureT.k.toFixed(4); };
    // (the size at the floor's depth straight below that step: depthSize there, as anywhere on the floor)
    const high = at(1.85 * Math.PI), floorBelow = +((B.figSize ?? 100) / 100 * sceneFig("castleroom") * depthSize(B, G.pt(rm, 1.85 * Math.PI, G.Yf)[1] - g)).toFixed(4);
    B.figX = 0; B.figY = 40; changed(); const floor = +figureT.k.toFixed(4), plain = +((B.figSize ?? 100) / 100 * sceneFig("castleroom") * depthSize(B, 40)).toFixed(4);
    return JSON.stringify({ high, floorBelow, floor, plain }); })()`));
  console.log(`  the friend's size: high on the steps ${r.high}, on the floor below it ${r.floorBelow}; on the floor ${r.floor} (as before ${r.plain})`);
  ok("high on the steps at the back: the size on the floor straight below", Math.abs(r.high - r.floorBelow) < 0.02 * r.floorBelow, r);
  ok("on the floor: as before", Math.abs(r.floor - r.plain) < 1e-3, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
