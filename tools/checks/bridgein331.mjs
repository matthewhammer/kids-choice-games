// (ticket 331, Matthew: "when we walk across the bridge by click, we animate the walk, but then we do not animate going into
// the door --- we do it pretty well for the ladder climbs outside of the tree house, so can't we reuse that again?") At the
// tree house, on the bridge from house 1 to house 4, a tap on house 4: along the bridge, the friend shrinking to house 4's
// size (a higher house, 0.85 of house 1's), off its end onto house 4's platform, along it to the door, through the door cut
// off at its opening (a clip, no fade), and in house 4's room, beside its door back to house 1. Exits 1 on a failure.
//   node bridgein331.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; delete B.onPlatform;
    Object.assign(B, { kind: "treehouse", houses: 6, ladders: 6, bridges: 5, treeHouseSize: 100, figSize: 100, figX: 0, figY: 40, things: [] }); changed(); await w(600);
    const W = treeWalks().find(w => [w.a, w.b].sort().join() === "0,3"); if (!W) return JSON.stringify({ none: true });
    bridgeOn(W.j, W.a === 0 ? 0.1 : 0.9); changed(); await w(300);
    const house4 = bgShown.node.querySelector('.portal[data-to="treeroom"][data-house="4"]'); enterScene(house4);
    const ks = [], xs = []; let clipped = false, faded = false; const t0 = performance.now();
    while (performance.now() - t0 < 20000 && B.kind === "treehouse") { await w(40);
      if (B.onBridge) ks.push(+figureT.k.toFixed(4));
      if (B.onPlatform) xs.push(Math.round(B.onPlatform.x));
      if (document.querySelector("#pic g.fig-clip") && B.onPlatform) clipped = true;
      const f = document.getElementById("figure"); if (B.onPlatform && f && f.style.opacity && +f.style.opacity < 0.9) faded = true; }
    await w(500);
    const d = bgShown.node.querySelector('.portal[data-door][data-house="1"]'), P = pic.getScreenCTM().inverse(), r = d && (d.querySelector("path, rect") || d).getBoundingClientRect();
    const doorX = r ? Math.round(new DOMPoint(r.x + r.width / 2, r.y).matrixTransform(P).x) : null;
    return JSON.stringify({ k: [ks[0], ks[ks.length - 1]], nk: ks.length, xs: [xs[0], xs[xs.length - 1]], nx: xs.length, hx: TREE_SLOTS[3][0], edge: Math.round(TREE_SLOTS[3][0] - Math.sign(TREE_SLOTS[3][0] - TREE_SLOTS[0][0]) * 78 * 0.85), clipped, faded, now: B.kind + " " + B.inside, x: B.figX, doorX }); })()`));
  console.log(`  house 1 to house 4 along the bridge: ${JSON.stringify(r)}`);
  if (r.none) ok("a bridge joins houses 1 and 4", false, r);
  else {
    ok("on the bridge, smaller toward house 4, a smaller house: at its end 0.85 of the size at house 1's", r.nk > 5 && Math.abs(r.k[1] / r.k[0] - 0.85) < 0.03, r);
    ok("off the bridge's end onto house 4's platform, and along it to the door, the house's middle", r.nx > 3 && Math.abs(r.xs[0] - r.edge) < 12 && r.xs[1] === r.hx, r);
    ok("through the door cut off at its opening, not faded", r.clipped && !r.faded, r);
    ok("and in house 4's room, on the side of its door back to house 1", r.now === "treeroom 4" && r.doorX !== null && Math.sign(r.x) === Math.sign(r.doorX), r);
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
