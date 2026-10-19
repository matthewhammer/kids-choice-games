// (ticket 366, Matthew: "when sitting, click to walk seems broken") Sitting on either throne in N's castle's king's room,
// a click on the carpet walks the friend there (they stand and go); and a click on the other throne walks them to it and
// they sit there. Since ticket 332 a plan with no way round walks nowhere, and the throne being got off was in the way.
// Exits 1 on a failure.
//   node sit366.mjs <devtools port> <url>
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
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; B.kind = "castleroom"; B.castle = "N"; B.things = [];
    const K = castleOf(B); B.castleRoom = K.rooms.indexOf("king") + 1; state.access.clickWalk = true; changed(); await w(700);
    const g = SCENE.ground, tz = g + (sceneFrame.bottom - g) * 0.55, res = {};
    for (const name of ["throne 1", "throne 2"]) { sitOn(seatsHere(B).find(t => t.name === name)); await w(2600);
      const sat = B.seat; walkPlanned(0, tz); await w(4000);
      res[name] = { sat, seat: B.seat || null, at: [Math.round(B.figX), Math.round(B.figY)], want: [0, Math.round(tz - g)] }; }
    const t1 = seatsHere(B).find(t => t.name === "throne 1"), t2 = seatsHere(B).find(t => t.name === "throne 2");
    sitOn(t2); await w(2600); walkPlanned((t1.x0 + t1.x1) / 2, t1.z + 6, () => sitOn(t1)); await w(5000); res.other = B.seat;
    return JSON.stringify(res); })()`));
  console.log("  " + JSON.stringify(r));
  for (const name of ["throne 1", "throne 2"]) { const q = r[name];
    ok(`sitting on ${name}, a click on the carpet walks there`, q.sat === name && !q.seat && Math.hypot(q.at[0] - q.want[0], q.at[1] - q.want[1]) < 6, q); }
  ok("sitting on throne 2, a click on throne 1 walks there and sits on it", r.other === "throne 1", r.other);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
