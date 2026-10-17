// (ticket 241, Matthew: "there's no collision info for the outside tree house tree trunk system") The tree house's
// trunk, outside, is a solid: in the list as stacked bands, as other trunks are, measured by its braid alone (narrow,
// at the tree's foot, not as wide as its houses and bridges), and walking at it from either side stops at it.
// Exits 1 on a failure.
//   node trunk241.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground;
    state.music.mute = true; state.world.at = null; state.body.facing = "front"; state.body.anim = "none";
    Object.assign(B, { kind: "treehouse", figX: -300, figY: 60, things: [] }); changed(); await w(700);
    const o = solidsHere().find(s => s.name === "tree house"); if (!o) return JSON.stringify({ none: solidsHere().map(s => s.name) });
    const whole = (() => { const n = bgShown.node.querySelector('[data-obj="tree house"]'), b = n.getBoundingClientRect(), P = pic.getScreenCTM().inverse();
      return new DOMPoint(b.right, b.top).matrixTransform(P).x - new DOMPoint(b.left, b.top).matrixTransform(P).x; })();
    // (walking at it from either side, along its depth, a small step at a time as the controller moves, from just
    // beside it (the tree house's bushes stand a little farther out): stopped before its box, by it)
    const z = (o.back + o.front) / 2 - g, hits = {};
    const walk = side => { let x = side < 0 ? o.x0 - 24 : o.x1 + 24; const dir = side < 0 ? 1 : -1, n0 = solidHit.n;
      for (let i = 0; i < 120; i++) { const [nx] = solidMove(x, z, x + dir * 3, z); if (Math.abs(nx - x) < 0.01) break; x = nx; }
      hits[side] = solidHit.n > n0 ? solidHit.name : null; return Math.round(x); };
    const lx = walk(-1), rx = walk(1);
    return JSON.stringify({ box: [o.x0, o.x1, o.back, o.front].map(Math.round), bands: (o.bands || []).length, width: Math.round(o.x1 - o.x0), whole: Math.round(whole), lx, rx, hits }); })()`));
  if (r.none) ok("the tree house's trunk is a solid", false, r);
  else {
    console.log(`  the trunk's box ${JSON.stringify(r.box)}, ${r.bands} bands, ${r.width} wide (the whole tree house ${r.whole})`);
    ok("the tree house's trunk is a solid, in stacked bands", r.bands >= 3, r);
    ok("measured by its braid alone: far narrower than the whole tree house", r.width > 20 && r.width < 0.35 * r.whole, r);
    ok("walking at it from the left, and from the right: stopped at it, by it", r.lx <= r.box[0] + 2 && r.rx >= r.box[1] - 2 && r.hits["-1"] === "tree house" && r.hits["1"] === "tree house", r);
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
