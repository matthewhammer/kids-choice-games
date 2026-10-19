// (ticket 331, Matthew: "We need to make the scale down extreme to match how we draw the tree house outside the door, which is
// very shrunk down"; "we should do that gradually as we crawl out, and onto the bridge -- we should animate a part of walking
// on the bridge (after standing up, post crawl)") In tree room 1, through its door to house 2: crawled through, shrinking
// (figOver) from the room's size to the size of the bridge drawn in the doorway, a tenth or less; then standing, facing away
// along it, walking up it (smaller still), seen only inside the doorway (the clip's shape a path, the opening); then
// outside, on the bridge at house 1's end. (ticket 369: since 0.0.302, ticket 352, the default friend fits the tree's doors and
// walks through; an adult, size 150, crawls: the crawl is checked with an adult, and the default friend walking out too.)
// Exits 1 on a failure.
//   node doorout331.mjs <devtools port> <url>
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
  const pass = size => ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; delete B.onBridge; delete B.onPlatform; state.body.anim = "none";
    Object.assign(B, { kind: "treeroom", houses: 4, bridges: 2, inside: 1, figSize: ${size}, figX: 0, figY: 60, things: [] }); changed(); await w(600);
    const d = bgShown.node.querySelector('.portal[data-to="treeroom"][data-door][data-house="2"]'); if (!d) return JSON.stringify({ none: true });
    const k0 = figureT.k; enterScene(d);
    const ks = [], deckY = [], seen = []; let pathClip = false; const t0 = performance.now();
    while (performance.now() - t0 < 15000 && B.kind === "treeroom") { await w(30);
      const a = state.body.anim + " " + state.body.facing; if (figOver && seen[seen.length - 1] !== a) seen.push(a);
      if (figOver) { ks.push(figOver.k); if (state.body.facing === "back" && state.body.anim === "walk") { deckY.push(figOver.y); const c = document.querySelector("#pic g.fig-clip clipPath"); if (c && c.querySelector("path") && !c.querySelector("rect")) pathClip = true; } } }
    await w(800);
    return JSON.stringify({ k0, kMin: ks.length ? Math.min(...ks) : null, n: ks.length, seen, deckY: [deckY[0], deckY[deckY.length - 1]], nDeck: deckY.length, pathClip, on: B.onBridge || null, now: B.kind, left: !!figOver }); })()`);
  const r = JSON.parse(await pass(150)), d = JSON.parse(await pass(100));
  console.log(`  tree room 1's door to house 2, an adult (size 150): ${JSON.stringify(r)}`);
  console.log(`  the same, the default friend: ${JSON.stringify(d)}`);
  if (r.none) ok("tree room 1 has a door to house 2", false, r);
  else {
    ok("an adult crawled out through the doorway, shrinking to a tenth of the room's size or less", r.n > 10 && r.kMin < 0.1 * r.k0 && r.seen[0] && r.seen[0].startsWith("crawl"), r);
    ok("the default friend walked out through it (they fit the door, ticket 352), shrinking the same, onto the bridge", d.n > 10 && d.kMin < 0.1 * d.k0 && d.seen[0] && d.seen[0].startsWith("walk") && d.now === "treehouse" && d.on, d);
    ok("then standing, and walking along the bridge in the doorway, away from us, up it", r.seen.includes("none back") && r.seen.includes("walk back") && r.nDeck > 3 && r.deckY[1] < r.deckY[0], r);
    ok("seen only inside the doorway as they walk it (the clip, its opening alone)", r.pathClip, r);
    ok("then outside, on the bridge at house 1's end, drawn as usual again", r.now === "treehouse" && r.on && !r.left, r);
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
