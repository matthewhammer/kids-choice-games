// (ticket 264, Matthew) The tree house's and the castle's doors, as the trapdoors do them. A tree room's door to a
// bridge, the glow on it: taken, it stays open (never swung shut on the way), and the friend is cut off at the wall going
// through (a clip, no fade), and out on the bridge; on the bridge, a click on the far house goes to it, not the one near
// the feet; the king's room's side door taken the same way, clipped, no fade; down house 5's ladder to the ground: at that
// ladder's foot outside, facing us. Exits 1 on a failure.
//   node doors264.mjs <devtools port> <url>
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
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
  const beside = async d => { const s = d.querySelector("path"), T = pic.getScreenCTM().inverse().multiply(s.getScreenCTM()), nn = s.getAttribute("d").match(/-?[0-9]+([.][0-9]+)?/g).map(Number);
    const a = new DOMPoint(nn[0], nn[1]).matrixTransform(T), b = new DOMPoint(nn[nn.length - 2], nn[nn.length - 1]).matrixTransform(T);
    B.figX = Math.round(a.x - Math.sign(a.x) * 40); B.figY = Math.round((a.y + b.y) / 2 - SCENE.ground); state.body.anim = "none"; changed(); await w(300); measureMarks(); showEnterGlow(); await w(700); };
  // (taking it: while the walk goes, whether the door was ever shut, a clip seen, the friend ever faded)
  const take = async (d, done) => { const leaf = d.querySelector("[data-leaf]"); let shut = false, clipped = false, faded = false; enterScene(d); const t0 = performance.now();
    while (performance.now() - t0 < 9000 && !(done() && !entering)) { await w(30); if (leaf.isConnected && leaf.dataset.swung === "shut") shut = true;
      if (document.querySelector("#pic g.fig-clip")) clipped = true; const f = document.getElementById("figure"); if (f && f.style.opacity && +f.style.opacity < 0.9 && entering) faded = true; }
    return { shut, clipped, faded }; };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const tree = JSON.parse(await ev(`(async () => { ${H} state.music.mute = true; state.world.at = null; climb = null;
    Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 5, inside: 1, figX: 0, figY: 80, things: [] }); delete B.onBridge; changed(); await w(600);
    const d = bgShown.node.querySelector('.portal[data-door][data-house="2"]'); await beside(d); const open = d.querySelector("[data-leaf]").dataset.swung;
    const r = await take(d, () => B.kind === "treehouse" && !!B.onBridge); await w(300);
    // on the bridge at house 1's end: a click on house 2
    measureMarks(); const h2 = marks.pics.find(q => q.el.matches('.portal[data-to="treeroom"][data-house="2"]')); enterAt = h2; enterPicture();
    const t0 = performance.now(); while (performance.now() - t0 < 12000 && B.kind !== "treeroom") await w(60); await w(400);
    return JSON.stringify({ open, ...r, then: B.kind + " " + B.inside }); })()`));
  console.log(`  tree room 1's door to house 2: ${JSON.stringify(tree)}`);
  ok("a bridge door, the glow on it: open", tree.open === "open", tree);
  ok("taken: never swung shut on the way, the friend cut off at the wall going through, not faded", !tree.shut && tree.clipped && !tree.faded, tree);
  ok("on the bridge at house 1's end, a click on house 2: into house 2, not back into house 1", tree.then === "treeroom 2", tree);
  const king = JSON.parse(await ev(`(async () => { ${H} climb = null; Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 1, figX: 0, figY: 60, things: [] }); changed(); await w(600);
    const d = bgShown.node.querySelector('.portal[data-door][data-to="castleroom"]'), to = +d.dataset.room; await beside(d);
    const r = await take(d, () => B.kind === "castleroom" && B.castleRoom === to); return JSON.stringify({ to, ...r, now: B.castleRoom }); })()`));
  console.log(`  the king's room's side door: ${JSON.stringify(king)}`);
  ok("the king's room's side door: open all the way, cut off going through, not faded, into the next room", !king.shut && king.clipped && !king.faded && king.now === king.to, king);
  const down = JSON.parse(await ev(`(async () => { ${H} climb = null; Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 5, inside: 5, figX: 0, figY: 80, things: [] }); changed(); await w(600);
    const d = [...bgShown.node.querySelectorAll('.portal[data-to="treehouse"]')].find(p => p.querySelector("[data-down]")); if (!d) return JSON.stringify({ none: true });
    enterScene(d); const t0 = performance.now(); while (performance.now() - t0 < 12000 && !(B.kind === "treehouse" && !entering)) await w(60); await w(500);
    const hz = (B.treeHouseSize ?? 100) / 100, s = (B.treeSize ?? 100) / 100 * (SCENE.bottom - SCENE.top) / 700, want = (TREE_SLOTS[4][0] - 52 * hz) * s;
    return JSON.stringify({ kind: B.kind, x: Math.round(B.figX), want: Math.round(want), y: Math.round(B.figY), facing: state.body.facing }); })()`));
  console.log(`  down house 5's ladder: ${JSON.stringify(down)}`);
  ok("down house 5's ladder to the ground: outside at that ladder's foot, facing us", !down.none && down.kind === "treehouse" && Math.abs(down.x - down.want) <= 3 && down.facing === "front", down);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
