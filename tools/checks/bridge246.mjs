// (ticket 246, Matthew: "we want a transition on bridges where a door passageway that leads to a bridge transitions
// outside of the treehouse, and lets the game player walk along that curved route, to the other side") In a tree house
// room, six houses and five bridges: house 1's door to house 2 taken, the friend is outside on that rope bridge at house
// 1's end; walking with the controller toward house 2 they go along its curve, and pushing on at its end, into house 2's
// room, just inside its door back to house 1. Out that door again, on the bridge at house 2's end: the glow on the house
// they face along it; a tap on house 1 walks them along the bridge to it and in. Exits 1 on a failure.
//   node bridge246.mjs <devtools port> <url>
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
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
  const until = async (f, ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (f()) return Math.round(performance.now() - t0); await w(50); } return null; };
  const where = () => { const at = bridgeNow(); return { kind: B.kind, inside: B.inside, on: at ? { j: at.j, a: at.W.a + 1, b: at.W.b + 1, u: +at.u.toFixed(3), off: +Math.hypot(at.x - (B.figX ?? 0), at.y - SCENE.ground - (B.figY ?? 0)).toFixed(2) } : null, x: Math.round(B.figX ?? 0), y: Math.round(B.figY ?? 0) }; };
  const door = to => bgShown.node.querySelector('.portal[data-to="treeroom"][data-door][data-house="' + to + '"]');`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // out of house 1's door to house 2
  const out = JSON.parse(await ev(`(async () => { ${H} state.music.mute = true; state.world.at = null; state.body.anim = "none"; state.body.facing = "front"; climb = null;
    Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 5, inside: 1, treeSize: 100, treeHouseSize: 100, figX: 0, figY: 60, figSize: 100, things: [] }); delete B.onBridge; changed(); await w(700);
    const d = door(2); if (!d) return JSON.stringify({ none: true });
    enterScene(d); const t = await until(() => B.kind === "treehouse" && !entering, 9000); await w(300);
    return JSON.stringify({ t, ...where() }); })()`));
  console.log(`  house 1's door to house 2: ${JSON.stringify(out)}`);
  if (out.none) throw new Error("house 1 has no door to house 2");
  ok("through house 1's door to house 2: outside, on the bridge between them, at house 1's end, on its deck", out.t !== null && out.kind === "treehouse" && out.on && [out.on.a, out.on.b].sort().join() === "1,2" && (out.on.a === 1 ? out.on.u === 0 : out.on.u === 1) && out.on.off < 1, out);
  // along it toward house 2 with the controller, and on in
  const across = JSON.parse(await ev(`(async () => { ${H} const at = bridgeNow(), W = at.W, toB = at.W.a === 0, right = (toB ? W.q[0] > W.p[0] : W.p[0] > W.q[0]);
    touchWant(true); const btn = touchPad.pad.buttons[right ? 15 : 14]; btn.pressed = true; btn.value = 1;
    const us = [], t0 = performance.now(); let t = null;
    while (performance.now() - t0 < 16000) { await w(80); if (B.kind === "treehouse") { const a = bridgeNow(); if (a) us.push(+a.u.toFixed(3)); } else { t = Math.round(performance.now() - t0); break; } }
    btn.pressed = false; btn.value = 0; await w(300); touchWant(false); await w(400);
    const back = door(1), P = pic.getScreenCTM().inverse(), r = back && (back.querySelector("path, rect") || back).getBoundingClientRect(), dx = r ? new DOMPoint(r.x + r.width / 2, r.y).matrixTransform(P).x : null;
    return JSON.stringify({ t, right, us: [us[0], us[Math.floor(us.length / 2)], us[us.length - 1]], steps: us.length, ...where(), doorX: dx && Math.round(dx) }); })()`));
  console.log(`  walked toward house 2 (${across.right ? "▶" : "◀"}): u ${across.us.join(" → ")}, ${across.steps} samples; then ${across.kind} ${across.inside} at x ${across.x} (its door to house 1 at x ${across.doorX})`);
  ok("walked along the bridge toward house 2, a step at a time", across.steps > 10 && across.us[1] > Math.min(across.us[0], across.us[2]) - 1e-3 && across.us[1] < Math.max(across.us[0], across.us[2]) + 1e-3, across);
  ok("pushing on at its end: into house 2's room", across.t !== null && across.kind === "treeroom" && across.inside === 2, across);
  ok("just inside its door back to house 1, on that side of the room", across.doorX !== null && Math.sign(across.x) === Math.sign(across.doorX) && Math.abs(across.x) > 20, across);
  // out again; the glow on the house they face along it; a tap on house 1: along it, and in
  const tap = JSON.parse(await ev(`(async () => { ${H} enterScene(door(1)); await until(() => B.kind === "treehouse" && !entering, 9000); await w(400);
    const first = where(), at = bridgeNow(), toA = at.W.a === 0 ? (at.W.p[0] < at.W.q[0] ? "left" : "right") : (at.W.q[0] < at.W.p[0] ? "left" : "right");
    state.body.facing = toA; changed(); await w(300); measureMarks(); showEnterGlow();
    const glow = enterAt && enterAt.el.dataset.house;
    const house1 = bgShown.node.querySelector('.portal[data-to="treeroom"][data-house="1"]'); enterScene(house1);
    const us = []; const t = await until(() => { const a = bridgeNow(); if (a) us.push(+a.u.toFixed(3)); return B.kind === "treeroom"; }, 9000); await w(300);
    return JSON.stringify({ first, glow, t, us: [us[0], us[us.length - 1]], steps: us.length, ...where() }); })()`));
  console.log(`  out of house 2's door: ${JSON.stringify(tap.first)}; the glow on house ${tap.glow}; tapped house 1: u ${tap.us.join(" → ")}, then ${tap.kind} ${tap.inside}`);
  ok("out of house 2's door to house 1: on the same bridge, at house 2's end", tap.first.kind === "treehouse" && tap.first.on && (tap.first.on.a === 2 ? tap.first.on.u === 0 : tap.first.on.u === 1), tap.first);
  ok("facing house 1 along the bridge, the glow on house 1: where X would go in", tap.glow === "1", tap);
  ok("a tap on house 1: walked along the bridge to it, and into its room", tap.t !== null && tap.steps > 5 && tap.kind === "treeroom" && tap.inside === 1, tap);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
