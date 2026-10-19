// (ticket 300) Places with instances: two lake squares; a change in one with "📍 only this square" is its own (the other
// shows the template), a change with "🧩 the template" reaches every lake without its own, ↺ puts a square back; a square
// taken away waits as unreachable and comes back as it was; every place, the abstract ones too, is in the world's
// palette. Exits 1 on a failure.
//   node instance300.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state.music.mute = true; changed(); await w(300);
    const W = state.world, B = state.background, lakes = Object.keys(W.cells).filter(k => W.cells[k].kind === "lake");
    let L2 = lakes[1];
    if (!L2) { outer: for (let rr = 0; rr < W.rows; rr++) for (let cc = 0; cc < W.cols; cc++) if (!W.cells[cc + "," + rr]) { L2 = cc + "," + rr; break outer; } worldPut(L2, "lake"); }
    const L1 = lakes[0], out = {};
    B.instEdit = "template"; worldEnter(L1); B.ducks = 5; changed(); await w(100);
    B.instEdit = "instance"; changed(); B.ducks = 9; changed(); await w(100); out.own = B.ducks;
    worldEnter(L2); await w(100); out.other = state.background.ducks;
    state.background.instEdit = "template"; changed(); state.background.ducks = 7; changed();
    worldEnter(L1); await w(100); out.ownKept = state.background.ducks;
    instanceReset(); changed(); out.reset = state.background.ducks;
    // taken away and put back as it was
    W.cells[L1].name = "Duck Test"; changed(); const before = JSON.stringify(W.cells[L1]);
    worldRemove(L1); out.unreach = (W.unreachable || []).length; worldRestore(W.unreachable.length - 1); out.same = JSON.stringify(W.cells[L1]) === before;
    delete W.cells[L1].name; changed();
    out.palette = ["imagination", "emptyroom", "bubblespace", "bubbleroom"].every(k => worldPalette().includes(k));
    return JSON.stringify(out); })()`));
  console.log(`  instances: ${JSON.stringify(r)}`);
  ok("📍 only this square: the change is that lake's own", r.own === 9, r);
  ok("the other lake shows the template", r.other === 5, r);
  ok("🧩 the template changed elsewhere: this lake keeps its own", r.ownKept === 9, r);
  ok("↺ back to the template", r.reset === 7, r);
  ok("a square taken away waits as unreachable, and comes back as it was", r.unreach >= 1 && r.same, r);
  ok("the abstract places are in the world's palette", r.palette, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
