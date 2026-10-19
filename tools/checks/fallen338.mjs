// (ticket 338, Matthew: "let's let them be placeable -- so we as the user/tester can move them after they fall ... maybe a
// special name 'fallen 1, 2, 3'") The trap room's blue lever drops a rock that lands as a placed rock, "fallen 1", a solid
// covering its pit (no way down); dragged off, the pit is open again; the next pull drops "fallen 2"; the next lifts it
// away, "fallen 1" left where it was put. Exits 1 on a failure.
//   node fallen338.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; B.kind = "castleroom"; const K = castleOf(B), n = K.rooms.indexOf("trap") + 1;
    B.castleRoom = n; B.things = []; B.figX = 0; B.figY = 120; changed(); await w(700);
    const T = () => trapState(B, n, K.id), ways = () => [...bgShown.node.querySelectorAll(".portal[data-pit]")].length, fallen = () => (B.things || []).filter(t => t.fallen).map(t => t.fallen);
    if (!T().open[1]) { roomLeverPull("R"); await w(1200); }
    const w0 = ways();
    roomLeverPull("BR"); await w(2300);
    const s1 = { fallen: fallen(), covered: T().covered[1], ways: ways(), solid: solidsHere().some(o => o.name === "fallen 1"), named: bgShown.objs.some(o => o.name === "fallen 1") };
    const r1 = B.things.find(t => t.fallen === 1); if (r1) { r1.x -= 250; changed(); } await w(400);
    const s2 = { covered: T().covered[1], ways: ways() };
    roomLeverPull("BR"); await w(2300); const s3 = { fallen: fallen(), covered: T().covered[1] };
    roomLeverPull("BR"); await w(2300); const s4 = { fallen: fallen(), covered: T().covered[1], kept: B.things.find(t => t.fallen === 1)?.x };
    return JSON.stringify({ w0, s1, s2, s3, s4, x1: r1 && r1.x }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("dropped, it lands as a placed rock, fallen 1: a solid, named so, covering its pit (no way down)", r.s1.fallen.join() === "1" && r.s1.covered && r.s1.solid && r.s1.named && r.s1.ways === r.w0 - 1, [r.w0, r.s1]);
  ok("dragged off its pit, the pit is open again", !r.s2.covered && r.s2.ways === r.w0, r.s2);
  ok("the next pull drops fallen 2 into the pit", r.s3.fallen.join() === "1,2" && r.s3.covered, r.s3);
  ok("the next lifts fallen 2 away, fallen 1 left where it was put", r.s4.fallen.join() === "1" && !r.s4.covered && r.s4.kept === r.x1, r.s4);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
