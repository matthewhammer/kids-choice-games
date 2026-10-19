// (ticket 316) Pulling a lever is a planned action, with 👆 walk where you click on: the trap room's red lever pressed,
// the friend walks to the floor in front of it, turns to face it, reaches up and pulls it down with the dominant hand
// (the right by default: from behind, on our right), and the lever goes over during the pull, not before; ✋ dominant
// hand is a Body choice. Exits 1 on a failure.
//   node lever316.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, body = state.body;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; if (B.seat) standUp(); body.anim = "none"; body.hand = "right"; state.access.clickWalk = true;
    B.kind = "castleroom"; B.castle = "N"; B.castleRoom = castleOf(B).rooms.indexOf("trap") + 1; B.figX = 200; B.figY = 80; changed(); await w(600); draw();
    const K = castleOf(B), rn = B.castleRoom, before = leverDown(B, "L", rn, K.id), lev = document.querySelector('#bg [data-lever="L"]'), q = lev.getBoundingClientRect(), x = (q.left + q.right) / 2, y = (q.top + q.bottom) / 2;
    const lx = new DOMPoint(x, y).matrixTransform(pic.getScreenCTM().inverse()).x;   // (before: the picture is drawn again as it goes)
    lev.dispatchEvent(new PointerEvent("pointerdown", { clientX: x, clientY: y, bubbles: true, isPrimary: true, pointerId: 1 }));
    lev.dispatchEvent(new PointerEvent("pointerup", { clientX: x, clientY: y, bubbles: true, isPrimary: true, pointerId: 1 }));   // (letGo listens on the picture)
    const early = leverDown(B, "L", rn, K.id) !== before, start = [B.figX, B.figY];
    let moved = null, sawPull = false, hand = null;
    for (let i = 0; i < 150; i++) { await w(100); if (body.anim === "pull") { sawPull = true; if (hand === null && performance.now() - pullAt > 380) { draw(); const J = poseJoints, up = J.arms.map(a => a.H[1]); hand = up[0] < up[1] ? "L" : "R"; } }
      if (moved === null && leverDown(B, "L", rn, K.id) !== before) moved = { anim: body.anim, facing: body.facing };
      if (moved && !clickRun && !entering && body.anim === "none") break; }
    return JSON.stringify({ early, start: start.map(Math.round), at: [Math.round(B.figX), Math.round(B.figY)], leverX: Math.round(lx), sawPull, moved, hand }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("pressing the lever does not move it at once", !r.early, r);
  ok("the friend walks to it (ends near the lever, across)", Math.abs(r.at[0] - r.leverX) < 40 && (r.at[0] !== r.start[0] || r.at[1] !== r.start[1]), r);
  ok("facing it, they pull, and the lever goes over during the pull", r.sawPull && r.moved && r.moved.anim === "pull" && r.moved.facing === "back", r);
  ok("the right hand, from behind on our right (the rig's L side)", r.hand === "L", r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
