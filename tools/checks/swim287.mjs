// (ticket 287) Moving through deep water the friend swims, flat, not treading upright: from the side, turned about the
// hips to lie along the surface (wider than tall), the arms windmilling (over a stroke the near hand goes from ahead of
// the shoulder, down in the water, to back behind it, and up over the water: the arm is shorter than the body, so not
// past the hips), the legs back; the waterline level. Still in the water, they
// tread, upright, as before. Exits 1 on a failure.
//   node swim287.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.body, W = state.background;
    state.music.mute = true; state.world.at = null; climb = null; W.things = []; W.kind = "lake"; W.figX = 0; W.figY = -110; changed(); await w(500);
    const deep = deepHere(), lfo0 = lfoNow;
    const at = (anim, facing, ph) => { B.anim = anim; B.facing = facing; lfoNow = k => { const r = lfo0(k); return k === "B" && r ? { ...r, phase: ph } : r; };
      try { draw(); const m = moveNow() || {}, f = document.getElementById("figure").getBoundingClientRect(), J = poseJoints;
        const a = (m.rot || 0) * Math.PI / 180, P = ([x, y]) => [x * Math.cos(a) - (y - J.L) * Math.sin(a), J.L + x * Math.sin(a) + (y - J.L) * Math.cos(a)];
        const near = J.arms.find(q => q.side === 1), hand = P(near.H), shoulder = P(near.A), hips = P(J.legs[0].H);
        return { swim: !!m.swim, rot: m.rot || 0, wide: Math.round(f.width), tall: Math.round(f.height), hand: hand.map(Math.round), shoulder: shoulder.map(Math.round), hips: hips.map(Math.round),
                 level: !!document.querySelector('#figure clipPath[id^="water-above"]') && !document.querySelector('#figure > g[transform*="rotate"] clipPath[id^="water-above"]') }; }
      finally { lfoNow = lfo0; } };
    const strokes = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map(ph => at("swimfast", "left", ph));
    const right = at("swim", "right", 0.3), still = at("none", "left", 0.3);
    B.anim = "none"; draw();
    return JSON.stringify({ deep, strokes, right, still }); })()`));
  console.log(`  ${JSON.stringify({ deep: r.deep, first: r.strokes[0], right: r.right, still: r.still })}`);
  const S = r.strokes;
  ok("the friend is in deep water in the lake", r.deep, r);
  ok("swimming, from the side: swimming flat (turned about the hips), facing left and right", S.every(s => s.swim && s.rot < -60) && r.right.swim && r.right.rot > 60, { S0: S[0], right: r.right });
  ok("lying along the water: wider than tall", S.every(s => s.wide > s.tall), S.map(s => [s.wide, s.tall]));
  // (facing left, ahead is -x: a hand ahead of the shoulder has the smaller x; behind it, the larger)
  ok("the arms windmill: over a stroke the near hand is out ahead of the shoulder, and back well behind it", S.some(s => s.hand[0] < s.shoulder[0] - 40) && S.some(s => s.hand[0] > s.shoulder[0] + 40), S.map(s => [s.hand, s.shoulder]));
  ok("and down in the water ahead (below the shoulder)", S.some(s => s.hand[0] < s.shoulder[0] && s.hand[1] > s.shoulder[1] + 30), S.map(s => s.hand));
  ok("and up over the water too (above the shoulder) on its way back", S.some(s => s.hand[1] < s.shoulder[1] - 30), S.map(s => s.hand));
  ok("the waterline level: drawn outside the turn", S.every(s => s.level), S.map(s => s.level));
  ok("still in the water, treading upright as before (taller than wide, not turned)", !r.still.swim && !r.still.rot && r.still.tall > r.still.wide, r.still);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
