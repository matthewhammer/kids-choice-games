// (ticket 352, Matthew: "we crawl when we run out of tree houses, but on the exterior view, we are tall enough to go into
// the doors -- and quite small"; then: align with three reference friends, "the default, and version that's 1.5 bigger,
// like an adult, and 0.5 size, like a small child") A friend's size against a tree house's door, outside (the cabin's,
// 72 of the house's units, from its platform) and inside (a tree room's side door to the bridge, at its foot): the default,
// the adult (1.5), the child (0.5) and a short-legged friend (legs 100; the default's are 140, as in his save): the same
// share of either door, within 0.05, and the same answer to whether they crawl (over 0.97): the default, the child and the
// short legs walk, the adult crawls, both ways. Exits 1 on a failure.
//   node scale352.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; delete B.onBridge; delete B.onPlatform; entering = false;
    const out = [];
    for (const [name, legLen, figSize] of [["default", null, 100], ["adult", null, 150], ["child", null, 50], ["short legs", 100, 100]]) {
      Object.assign(body, clone(DEFAULTS.body), legLen ? { legLen } : {}); B.figSize = figSize;
      Object.assign(B, { kind: "treeroom", inside: 1, houses: 4, treeHouseSize: 100, treeSize: 100, figX: 0, figY: 40 }); changed(); await w(400);
      const d = bgShown.node.querySelector(".portal[data-door]"), sh = d && d.querySelector("path"), rr = sh && sh.getBoundingClientRect(), inv = pic.getScreenCTM().inverse();
      let inside = null, crawlIn = null;
      if (rr) { const footY = new DOMPoint(rr.x + rr.width / 2, rr.y + rr.height).matrixTransform(inv).y, top = new DOMPoint(rr.x, rr.y).matrixTransform(inv).y;
        inside = youHeights(true).crown / figureT.k * B.figSize / 100 * sceneFig(B.kind) * depthSize(B, footY - SCENE.ground) / (footY - top); crawlIn = !!doorTooLow(rr, inv, { x: 0, y: footY }); }
      B.kind = "treehouse"; B.figX = -200; B.figY = 60; changed(); await w(300);
      const outside = youHeights(true).crown / figureT.k * B.figSize / 100 * BRIDGE_TALL / BRIDGE_BASE / 72;
      out.push({ name, inside: inside && +inside.toFixed(2), outside: +outside.toFixed(2), crawlIn, crawlOut: outside > 0.97 }); }
    Object.assign(body, clone(DEFAULTS.body)); B.figSize = 100; changed();
    return JSON.stringify(out); })()`));
  for (const f of r) console.log(`  ${f.name}: inside ${f.inside} of the room's door${f.crawlIn ? " (crawls)" : ""}, outside ${f.outside} of the cabin's${f.crawlOut ? " (crawls)" : ""}`);
  ok("each the same share of either door, within 0.05", r.every(f => f.inside !== null && Math.abs(f.inside - f.outside) <= 0.05), r);
  ok("and the same answer to crawling, both ways", r.every(f => f.crawlIn === f.crawlOut), r);
  ok("the default, the child and the short legs walk through; the adult crawls", r.map(f => f.crawlOut).join() === "false,true,false,false", r.map(f => f.name + ":" + f.crawlOut));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
