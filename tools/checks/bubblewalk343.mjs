// (ticket 343, Matthew: "standing on bubbles, with a param for how much they are moving under us --- the more they do, the
// more we 'brace our feet' and 'stick out our arms'; walking on bubbles -- with arms out sideways for balance ... more
// precarious than the usual walk") On the bubble room's floor: standing, the hands raised out to the sides, the feet apart,
// the knees bent, the body swaying (and more so at 100 than at 30); at 0 as on any floor; walking in profile, a shorter
// stride than in the empty room, tipping. Elsewhere nothing changes. Exits 1 on a failure.
//   node bubblewalk343.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; b.sit = false; B.seat = null; b.pose = "stand"; B.things = []; B.figX = 0; B.figY = 60;
    const stand = async (kind, wob) => { B.kind = kind; B.bubbleFloorWobble = wob; b.anim = "none"; b.facing = "front"; changed(); await w(500); draw();
      const J = poseJoints, m = moveNow() || {}; return { handY: Math.round(Math.min(...J.arms.map(a => a.H[1]))), feet: Math.round(Math.abs(J.legs[0].F[0] - J.legs[1].F[0])), knee: Math.round(m.KneeL || 0), tip: Math.abs(m.rot || 0) > 0, balance: m.balance ?? 0 }; };
    const stride = async kind => { B.kind = kind; B.bubbleFloorWobble = 60; b.facing = "left"; b.anim = "walk"; const lf = lfoNow, out = [];
      for (const ph of [0, 0.25, 0.5, 0.75]) { lfoNow = k => { const q = lf(k); return k === "B" && q ? { ...q, phase: ph } : q; }; try { out.push(Math.abs((moveNow() || {}).LegL || 0)); } finally { lfoNow = lf; } }
      b.anim = "none"; return Math.round(Math.max(...out)); };
    const room = await stand("emptyroom", 60), still = await stand("bubbleroom", 0), some = await stand("bubbleroom", 30), lots = await stand("bubbleroom", 100);
    const strideRoom = await stride("emptyroom"), strideBubbles = await stride("bubbleroom");
    b.facing = "front"; changed();
    return JSON.stringify({ room, still, some, lots, strideRoom, strideBubbles }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("on bubbles, standing: hands raised out, feet apart, knees bent, swaying", r.some.handY < r.room.handY - 15 && r.some.feet > r.room.feet && r.some.knee > 5 && r.some.tip, [r.room, r.some]);
  ok("more bubbling, more bracing", r.lots.knee > r.some.knee && r.lots.handY < r.some.handY, [r.some, r.lots]);
  ok("still bubbles (0): as on any floor", r.still.balance === 0 && Math.abs(r.still.handY - r.room.handY) <= 1, [r.room, r.still]);
  ok("walking on bubbles: a shorter stride than on a floor", r.strideBubbles < r.strideRoom, [r.strideRoom, r.strideBubbles]);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
