// (ticket 367, Matthew: "spiral stair topology is still perplexing the path planner") In the spiral staircase: from in front
// of the column to just behind the bottom steps beside it (his screenshot: -51,-32 to -111,-102), a click walk goes up the
// steps' middle (spiralPath), well under twice the straight way, not round the column (612); a floor walk in front of the
// column stays straight; and the walk arrives. Exits 1 on a failure.
//   node spiral367.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, b = state.body;
    state.music.mute = true; state.world.at = null; climb = null; b.sit = false; B.seat = null; b.pose = "stand"; b.anim = "none"; B.things = [];
    const K = castleOf(B); B.kind = "castleroom"; B["castleRoom6" + K.id] = "spiral"; B["castleRooms" + K.id] = 6; B.castleRoom = 6; changed(); await w(600);
    const g = SCENE.ground, len = (x0, y0, pts) => pts.reduce((a, p, i) => { const q = i ? pts[i - 1] : [x0, y0]; return a + Math.hypot(p[0] - q[0], (p[1] - q[1]) / 0.6); }, 0);
    const his = planWalk(-51, -32, -111, -102, 10), floor = planWalk(-150, 40, 150, 40, 10);
    B.figX = -51; B.figY = -32; changed(); await w(200); walkPlanned(-111, g - 102); await w(4500);
    return JSON.stringify({ his: len(-51, -32, his), direct: Math.hypot(60, 70 / 0.6), floor: floor.length, at: [B.figX, B.figY] }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("behind the bottom steps: up the stairs, under twice the straight way", r.his < 2 * r.direct, [r.his, r.direct]);
  ok("a floor walk in front of the column: straight", r.floor === 1, r.floor);
  ok("the walk arrives", Math.hypot(r.at[0] + 111, r.at[1] + 102) < 4, r.at);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
