// (ticket 240, Matthew: "the swing's collision box does not swing at the tree house. our collision boxes don't swing
// either") With ♿'s collision boxes on at the tree house: the swing's box turns about its hook as the seat swings, and
// the friend's boxes with it while they sit on it; and the swing's box, as walking meets it, is where the seat is.
// The picture's clock is held at moments across a swing, to find its two ends. Exits 1 on a failure.
//   node swing240.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 800)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    const frames = k => new Promise(r => { let i = 0; const f = () => ++i >= k ? r() : requestAnimationFrame(f); requestAnimationFrame(f); });
    state.music.mute = true; state.world.at = null; Object.assign(state.access, DEFAULTS.access, { showSolids: true });
    Object.assign(B, { kind: "treehouse", figX: -200, figY: 60, things: [] }); changed(); await w(600);
    const swing = solidsHere().find(o => o.name === "swing"); if (!swing) return JSON.stringify({ none: true });
    // (the clock held at moments across six seconds: the swing's two ends)
    pic.pauseAnimations(); const at = []; for (let t = 0; t <= 6; t += 0.1) { pic.setCurrentTime(t); const s = swingNow(); at.push({ t: +t.toFixed(1), deg: s.deg, dx: s.dx }); }
    const lo = at.reduce((a, b) => b.deg < a.deg ? b : a), hi = at.reduce((a, b) => b.deg > a.deg ? b : a);
    const look = async t => { pic.setCurrentTime(t); await frames(3); const ov = document.querySelector("#access-layer svg.solid-boxes"), g = ov && ov.querySelector('[data-solid="swing"]'), you = ov && ov.querySelector(".you");
      const deg = tf => { const m = /rotate\\(([-\\d.]+)/.exec(tf || ""); return m ? +m[1] : null; };
      const s = swingNow(), mid = (swing.x0 + swing.x1) / 2 + s.dx;
      // (walking into the seat where it is now, from beside it: met)
      return { deg: s.deg, box: deg(g && g.getAttribute("transform")), you: deg(you && you.getAttribute("transform")), dx: s.dx, metAtSeat: !!solidAt(mid, swing.front - 2) }; };
    const a = await look(lo.t), b = await look(hi.t);
    // (sitting on it: the friend's boxes turn with it)
    sitOn(seatsHere(B).find(t => t.name === "swing")); await w(300); const sa = await look(lo.t), sb = await look(hi.t);
    standUp(); pic.unpauseAnimations();
    return JSON.stringify({ lo: lo.deg, hi: hi.deg, a, b, sa, sb, sitting: !!state.body.sit }); })()`));
  if (r.none) ok("the tree house has its swing", false, r);
  else {
    ok("the swing swings: its two ends turned opposite ways", r.lo < -5 && r.hi > 5, r);
    ok("♿'s swing box turned as the seat, at each end", Math.abs(r.a.box - r.a.deg) < 0.5 && Math.abs(r.b.box - r.b.deg) < 0.5, { a: r.a, b: r.b });
    ok("standing, the friend's boxes are not turned", r.a.you === null && r.b.you === null, { a: r.a, b: r.b });
    ok("sitting on the swing, the friend's boxes turn with it", Math.abs(r.sa.you - r.sa.deg) < 0.5 && Math.abs(r.sb.you - r.sb.deg) < 0.5, { sa: r.sa, sb: r.sb });
    ok("the swing's box, as walking meets it, moves with the seat: across one way at one end, the other way at the other, and met where the seat is", r.a.dx * r.b.dx < 0 && Math.abs(r.a.dx - r.b.dx) > 20 && r.a.metAtSeat && r.b.metAtSeat, { a: r.a, b: r.b });
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
