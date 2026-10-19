// (ticket 297) Flowers and grass tufts, in the places that have them in their dozens (the tree house, the clearing, the
// castle, the fairy forest, the grass hut, the forest), stand in rows by depth, each an object: with the friend among
// them, every row nearer than their feet is drawn after them (in front), every row farther back before (behind), at two
// depths. Exits 1 on a failure.
//   node flowers297.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; B.onBridge = null;
    const look = async (kind, y) => { B.kind = kind; B.figX = 160; B.figY = y; changed(); await w(500); draw(); const fig = document.getElementById("figure"), feet = SCENE.ground + y;
      const rows = [...document.querySelectorAll('#bg [data-obj^="flowers"]')].map(el => ({ name: el.dataset.obj, z: +el.dataset.z, after: !!(fig.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) }));
      return { kind, y, rows: rows.length, front: rows.filter(q => q.after).length, wrong: rows.filter(q => (q.z > feet + 1) !== q.after).map(q => q.name) }; };
    const out = []; for (const kind of ["treehouse", "clearing", "castle", "fairyforest", "hut", "forest"]) for (const y of [30, 90]) out.push(await look(kind, y));
    return JSON.stringify(out); })()`));
  for (const p of r) console.log(`  ${JSON.stringify(p)}`);
  ok("every such place has its flowers in rows by depth (five or more)", r.every(p => p.rows >= 5), r.map(p => [p.kind, p.rows]));
  ok("rows nearer than the friend's feet are drawn in front of them, rows farther back behind, at two depths", r.every(p => !p.wrong.length), r.filter(p => p.wrong.length));
  ok("the nearer the friend stands, the fewer rows in front of them", ["treehouse", "clearing", "castle", "fairyforest", "hut", "forest"].every(k => { const [a, b] = r.filter(p => p.kind === k); return b.front <= a.front; }), r.map(p => [p.kind, p.y, p.front]));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
