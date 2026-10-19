// (ticket 309) Walking from the side, the knee leads each step and the foot follows: as a thigh swings forward its knee
// is well ahead of its foot, bent; at the top of the stride the foot has swung on past the knee, the leg straight; and
// the leg stays straight while the foot is down (the thigh going back). Exits 1 on a failure.
//   node walk309.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, body = state.body, lfo0 = lfoNow;
    state.music.mute = true; state.world.at = null; if (B.seat) standUp(); B.kind = "emptyroom"; body.anim = "walk"; body.facing = "right"; strikePose("stand"); changed(); await w(300);
    const at = ph => { lfoNow = k => { const r = lfo0(k); return k === "B" && r ? { ...r, phase: ph } : r; };
      try { draw(); const L = poseJoints.legs.find(l => l.side === 1); return { ph, kneeAhead: Math.round(L.K[0] - L.F[0]), bend: Math.round(moveNow().KneeL) }; } finally { lfoNow = lfo0; } };
    const swing = [0.0625, 0.125].map(at), top = [0.3125, 0.375].map(at), stance = [0.5, 0.625, 0.75].map(at);
    body.anim = "none"; draw();
    return JSON.stringify({ swing, top, stance }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("as the thigh swings forward, its knee leads, well ahead of the foot, bent", r.swing.every(q => q.kneeAhead > 25 && q.bend > 30), r.swing);
  ok("at the top of the stride the foot has followed on past the knee, the leg straight", r.top.every(q => q.kneeAhead < -8 && q.bend <= 12), r.top);
  ok("while the foot is down, the leg straight", r.stance.every(q => q.bend <= 6), r.stance);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
