// (ticket 321) A walk of several legs (round the trap room's pits), with 👣 the planned path shown: the path stays up from
// leg to leg (no flash: gone at most once, as the walk ends) and the friend keeps walking (no frame standing still
// between legs). Exits 1 on a failure.
//   node path321.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, body = state.body, g = SCENE.ground;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; if (B.seat) standUp(); body.anim = "none"; state.access.showPath = true; state.access.clickWalk = true;
    // (ticket 369: the pits shut by default since ticket 307, a lever never touched pulled down: both levers up, the pits open)
    B.kind = "castleroom"; B.castle = "N"; B.castleRoom = castleOf(B).rooms.indexOf("trap") + 1; { const K = castleOf(B); B[leverKey("L", B.castleRoom, K.id)] = false; B[leverKey("R", B.castleRoom, K.id)] = false; }
    changed(); await w(500);
    let best = null; for (const [fx, fy, tx, ty] of [[-250, 20, 250, 20], [-300, 60, 300, 60], [-300, 30, 300, 120], [-150, -20, 150, 140]]) { const p = planPath(fx, fy, tx, ty, 10); if (!best || p.length > best.p.length) best = { p, fx, fy, tx, ty }; }
    B.figX = best.fx; B.figY = best.fy; changed(); await w(400); draw();
    walkPlanned(best.tx, g + best.ty); const legs = walkPath.pts.length - 1;
    let gaps = 0, stops = 0, frames = 0, started = false;
    while (clickRun && frames < 4000) { await new Promise(r => requestAnimationFrame(r)); frames++; if (body.anim !== "none") started = true; if (!started) continue;
      if (!document.querySelector("#access-layer svg.walk-path")) gaps++; if (body.anim === "none" && clickRun) stops++; }
    state.access.showPath = false;
    return JSON.stringify({ legs, frames, gaps, stops }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("a walk of three legs or more round the pits", r.legs >= 3, r);
  ok("👣 the path stays up from leg to leg (gone at most once, as the walk ends)", r.gaps <= 1, r);
  ok("the friend keeps walking from leg to leg (no frame standing still)", r.stops === 0, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
