// (ticket 243, Matthew, with a picture of tree house room 4: "need more segments for this feature of this tree house
// room (NE corner) -- the tree's box is too big") In every tree house room, the tree's trunk is a solid in bands up it,
// measured by its braid alone: narrower at its foot than its whole drawing with the limbs that leave it; and walking
// at it from the room's open side stops at it. Exits 1 on a failure.
//   node trunk243.mjs <devtools port> <url>
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
  const rooms = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground, out = [];
    state.music.mute = true; state.world.at = null; state.body.facing = "front"; state.body.anim = "none";
    for (let i = 1; i <= 6; i++) {
      Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 6, inside: i, figX: 0, figY: 60, things: [], objectsOff: {} }); changed(); await w(500);
      const o = solidsHere().find(s => s.name === "tree trunk"); if (!o) { out.push({ room: i, none: solidsHere().map(s => s.name) }); continue; }
      const n = bgShown.node.querySelector('[data-obj="tree trunk"]'), b = n.getBoundingClientRect(), P = pic.getScreenCTM().inverse();
      const whole = new DOMPoint(b.right, b.top).matrixTransform(P).x - new DOMPoint(b.left, b.top).matrixTransform(P).x;
      // (everything else standing hidden, by the place's own 👁️ chips; then from beside its foot, on the room's open side, a step at a time)
      B.objectsOff = { [objPlace(B)]: solidsHere().filter(s => s.name !== "tree trunk").map(s => s.name) }; changed(); await w(300);
      const t = solidsHere().find(s => s.name === "tree trunk"), z = (t.back + t.front) / 2 - g, side = (t.x0 + t.x1) / 2 < 0 ? 1 : -1;   // (open side: toward the middle)
      let x = side > 0 ? t.x1 + 24 : t.x0 - 24; const dir = -side;
      for (let j = 0; j < 80 && (solidAt(x, z + g) || {}).name === "tree trunk"; j++) x += side * 3;
      for (let j = 0; j < 150; j++) { const [nx] = solidMove(x, z, x + dir * 3, z); if (Math.abs(nx - x) < 0.01) break; x = nx; }
      const met = (solidAt(x + dir * 3, z + g) || {}).name || null;
      B.objectsOff = {}; changed();
      out.push({ room: i, style: B["room" + i] || HOUSE_ROOMS[i - 1], bands: (t.bands || []).length, foot: Math.round(o.x1 - o.x0), whole: Math.round(whole), met, stoppedAt: Math.round(x) });
    }
    return JSON.stringify(out); })()`));
  for (const r of rooms) console.log(`  room ${r.room} (${r.style}): ${r.bands} bands, its foot ${r.foot} wide (its whole drawing ${r.whole}); walked at, met ${r.met}`);
  ok("every tree house room's trunk: a solid in bands up it", rooms.every(r => !r.none && r.bands >= 3), rooms);
  ok("measured by its braid alone: its foot narrower than its whole drawing with its limbs", rooms.every(r => r.foot > 20 && r.foot < 0.8 * r.whole), rooms);
  ok("walking at it from the room's open side: stopped by it", rooms.every(r => r.met === "tree trunk"), rooms);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
