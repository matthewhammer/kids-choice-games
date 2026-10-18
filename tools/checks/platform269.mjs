// (ticket 269, Matthew: "when I climb to the top of the external tree house ladder ... there's no motion plan of walking to
// the door, and walking through it ... the animation, again, of going through the doorway, with clipping, is very
// compelling") At the tree house: house 5's ladder from the ground climbed; at its top, the friend on the platform at the
// tree's size, walked along it toward the door (its place along it moving to the house's middle), then through the door,
// cut off at its opening (a clip, no fade), and in house 5's room. Exits 1 on a failure.
//   node platform269.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; delete B.onBridge;
    Object.assign(B, { kind: "treehouse", houses: 6, ladders: 6, bridges: 5, figX: -300, figY: 40, things: [] }); changed(); await w(600);
    const L = bgShown.node.querySelector('[data-ladder][data-house="5"]'); if (!L) return JSON.stringify({ none: true });
    const kGround = +figureT.k.toFixed(3); climbLadder(L);
    const xs = [], ks = []; let clipped = false, faded = false; const t0 = performance.now();
    while (performance.now() - t0 < 20000 && B.kind === "treehouse") { await w(40);
      if (B.onPlatform) { xs.push(Math.round(B.onPlatform.x)); ks.push(+figureT.k.toFixed(3)); }
      if (document.querySelector("#pic g.fig-clip") && B.onPlatform) clipped = true;
      const f = document.getElementById("figure"); if (B.onPlatform && f && f.style.opacity && +f.style.opacity < 0.9) faded = true; }
    await w(500);
    return JSON.stringify({ kGround, xs: [xs[0], xs[xs.length - 1]], n: xs.length, k: ks.length ? Math.max(...ks) : null, clipped, faded, hx: TREE_SLOTS[4][0], now: B.kind + " " + B.inside }); })()`));
  console.log(`  house 5's ladder: ${JSON.stringify(r)}`);
  if (r.none) ok("house 5 has a ladder from the ground", false, r);
  else {
    ok("at its top, on the platform at the tree's size, far smaller than on the ground", r.n > 3 && r.k < 0.5 * r.kGround, r);
    ok("walked along it to the door, the house's middle", r.xs[1] === r.hx && r.xs[0] !== r.hx, r);
    ok("through the door cut off at its opening, not faded", r.clipped && !r.faded, r);
    ok("and in house 5's room", r.now === "treeroom 5", r);
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
