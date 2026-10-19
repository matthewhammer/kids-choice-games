// (ticket 298) The tree house's back limit, where the friend's feet stop going back (and 🔬's line for it), at the far edge
// of its meadow: in front of its far row of trees, but far enough back to walk round behind the trunk; a spot right
// behind the trunk is free, a way from one side to the other goes behind it (at the feet's own reach), and the planned walk
// there reaches its spot. Exits 1 on a failure.
//   node back298.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; B.onBridge = null; B.kind = "treehouse"; B.figX = -200; B.figY = 0; changed(); await w(600); draw();
    const F = sceneFrame, g = SCENE.ground, k = (SCENE.bottom - SCENE.top) / 700, limit = g + figYMin(F);
    const far = Math.max(...[...document.querySelectorAll('#bg [data-obj="trees, far row"]')].map(e => +e.dataset.z));
    const trunk = [...document.querySelectorAll('#bg [data-obj="tree house"]')].map(e => +e.dataset.z)[0];
    // (just in front of the limit, behind the trunk's footprint, which reaches back from its foot)
    const behind = [-40, 0, 40].every(x => !solidAt(x, limit + 8));
    // (where the planned walk crosses the trunk's middle, between its corners)
    // (ticket 369: the lane behind the trunk, at the feet's own reach (planPath's more 0): with the stride's margin the planner may
    // go round the front instead, as it does in a wider window, the bushes closer; the walk itself must reach the spot)
    const mid = P => { let at = null; for (let i = 1; i < P.length; i++) { const [a, b] = [P[i - 1], P[i]]; if (a[0] * b[0] <= 0 && a[0] !== b[0]) { at = g + a[1] + (b[1] - a[1]) * (0 - a[0]) / (b[0] - a[0]); break; } } return at; };
    const P0 = planPath(-200, 0, 200, -50 * k, 0), P = planPath(-200, 0, 200, -50 * k, 10), atMid = mid([[-200, 0], ...P0]);
    return JSON.stringify({ limit: Math.round(limit), far: Math.round(far), trunk: Math.round(trunk), k: +k.toFixed(3), behind, atMid: atMid && Math.round(atMid), crossesBehind: atMid !== null && atMid < trunk - 50 * k,
      walk: { legs: P.length, short: !!P.short, end: P.length ? P[P.length - 1].map(Math.round) : null } }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("the back limit is in front of the far row of trees", r.limit > r.far, r);
  ok("and far enough back to walk behind the trunk (over 80 of its units behind its foot)", r.trunk - r.limit > 80 * r.k, r);
  ok("right behind the trunk is free to stand in", r.behind, r);
  ok("a way from one side to the other behind the trunk, at the feet's own reach", r.crossesBehind, r);
  ok("and the planned walk there (the stride's margin) reaches the spot", r.walk.legs > 0 && !r.walk.short, r.walk);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
