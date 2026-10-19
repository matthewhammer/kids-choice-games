// (ticket 308) Walking up or down stairs (🔼, with a flag for the way; no stairs drawn): up, a knee lifted high in turn
// (its knee well above where a walking knee goes), the body rising each step; down, twice as quick, a leg reaching on
// nearly straight while the other knee bends under the weight, standing on the lower foot; the flag's choice shows only
// with the animation. Exits 1 on a failure.
//   node stairs308.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; if (B.seat) standUp(); B.kind = "emptyroom"; body.facing = "right"; strikePose("stand"); changed(); await w(300);
    const at = (anim, way, ph) => { body.anim = anim; body.stairsWay = way; lfoNow = k => { const r = lfo0(k); return k === "B" && r ? { ...r, phase: ph } : r; };
      try { draw(); const m = moveNow() || {}, J = poseJoints; return { knees: J.legs.map(l => Math.round(l.K[1] - l.H[1])), feet: J.legs.map(l => Math.round(l.F[1] - l.H[1])), LL: J.LL, grounded: !!m.grounded, lift: Math.round(m.lift || 0) }; } finally { lfoNow = lfo0; } };
    const walk = [0.25, 0.75].map(ph => at("walk", "up", ph)), up = [0.25, 0.75].map(ph => at("stairs", "up", ph)), down = [0.125, 0.375].map(ph => at("stairs", "down", ph));
    const S = SHOWN_WHEN["body.stairsWay"], shown = { stairs: !!S({ anim: "stairs" }), walk: !!S({ anim: "walk" }) };
    body.anim = "none"; draw();
    return JSON.stringify({ walk, up, down, shown, inList: ANIMS.some(a => a[0] === "stairs") }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  const highest = q => Math.min(...q.knees);   // (a knee's height below the hip: smaller, higher)
  ok("🔼 walking up or down stairs is an animation in the Body tab", r.inList, r);
  ok("up: a knee lifted high in turn (above where a walking knee goes)", r.up.every(q => highest(q) < Math.min(...r.walk.map(highest)) - 0.15 * q.LL), { up: r.up, walk: r.walk });
  ok("up: rising each step", r.up.every(q => q.lift > 3), r.up);
  // (the bent leg's foot rides well above the reaching one's, which they stand on)
  ok("down: standing on the lower foot (grounded), the other knee bent under the weight, its foot well up", r.down.every(q => q.grounded && Math.abs(q.feet[0] - q.feet[1]) > 0.15 * q.LL), r.down);
  ok("the up-or-down choice shows only with the animation", r.shown.stairs && !r.shown.walk, r.shown);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
