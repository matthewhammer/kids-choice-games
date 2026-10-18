// (ticket 239, Matthew: "it makes sense that the doors of the tree house are smaller than ordinary doors -- Can we do a
// nice check to see if we are currently 'too tall' and if so, part of the path plan for going out is crawling at the
// end of the animation, near to the threshold of the door") Going through a door lower than the friend, the walk ends
// crawling: walking first, crawling the last stretch and through, and in the room beyond. A door they fit through is
// walked through. Prints each door's opening and the friend's height there. Exits 1 on a failure.
//   node crawl239.mjs <devtools port> <url>
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
// (in the page: a door's opening and the friend's height there, as walkInto reckons them; then going through it,
// the animations seen along the way, in order, and where they end up)
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
  const settle = async () => { changed(); await w(400); measureMarks(); };
  const measure = d => { const P = pic.getScreenCTM().inverse(), s = d.querySelector("path, rect") || d, r = s.getBoundingClientRect(), foot = new DOMPoint(r.x + r.width / 2, r.y + r.height).matrixTransform(P);
    const lo = doorTooLow(r, P, foot); return { foot: [Math.round(foot.x), Math.round(foot.y)], low: lo && { tall: Math.round(lo.tall), open: Math.round(lo.open) },
      open: Math.round(foot.y - new DOMPoint(r.x, r.y).matrixTransform(P).y) }; };
  const through = async (d, done) => { const seen = []; enterScene(d); const t0 = performance.now();
    while (performance.now() - t0 < 9000) { await w(40); const a = state.body.anim; if (seen[seen.length - 1] !== a) seen.push(a); if (done() && !entering) break; } return seen; };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // a tree room's door to a bridge, from across the room
  const tree = JSON.parse(await ev(`(async () => { ${H} state.music.mute = true; state.world.at = null; state.body.facing = "front"; state.body.anim = "none";
    let d = null, room = 0;
    for (let i = 1; i <= 6 && !d; i++) { Object.assign(B, { kind: "treeroom", houses: 6, bridges: 6, inside: i, figX: 0, figY: 60, figSize: 100, things: [] }); await settle();
      d = bgShown.node.querySelector('.portal[data-door][data-to="treeroom"]'); if (d) room = i; }
    if (!d) return JSON.stringify({ none: true });
    const m = measure(d), to = +d.dataset.house; B.figX = m.foot[0] < 0 ? 200 : -200; await settle();
    // (since ticket 246 the door leads out onto the rope bridge to that house)
    const seen = await through(d, () => B.kind === "treehouse" && !!B.onBridge);
    return JSON.stringify({ room, to, ...m, seen, now: B.kind === "treehouse" && !!B.onBridge ? "bridge" : B.kind + " " + B.inside }); })()`));
  console.log(`  tree room ${tree.room}'s door to room ${tree.to}: opening ${tree.open}, the friend ${tree.low ? tree.low.tall + " tall there: too tall" : "fits"}; seen ${JSON.stringify(tree.seen)}`);
  if (tree.none) ok("a tree room with a door to a bridge found", false, tree);
  else if (tree.low) ok("too tall for the tree room's door: walked, then crawled the last stretch and through, out onto the bridge beyond", tree.seen.includes("walk") && tree.seen.indexOf("crawl") > tree.seen.indexOf("walk") && tree.now === "bridge", tree);
  else ok("(the friend fits the tree room's door at this size: walked through)", tree.seen.includes("walk") && !tree.seen.includes("crawl") && tree.now === "bridge", tree);
  // a castle room's side door: walked through at the friend's own size; crawled at three times it
  const castle = JSON.parse(await ev(`(async () => { ${H} const out = {};
    for (const size of [100, 300]) {
      Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 1, figX: 0, figY: 60, figSize: size, things: [] }); state.body.anim = "none"; await settle();
      const d = bgShown.node.querySelector('.portal[data-door][data-to="castleroom"]'); if (!d) { out[size] = { none: true }; continue; }
      const m = measure(d), room = +d.dataset.room; out[size] = { ...m, room, seen: await through(d, () => B.kind === "castleroom" && B.castleRoom === room) , now: B.castleRoom }; }
    B.figSize = 100; changed(); return JSON.stringify(out); })()`));
  const c1 = castle[100], c3 = castle[300];
  console.log(`  the king's room's door, at 100%: opening ${c1.open}, ${c1.low ? "too tall" : "fits"}; at 300%: ${c3.low ? c3.low.tall + " tall: too tall" : "fits"}`);
  ok("a castle door at the friend's own size: walked through, no crawl", !c1.none && !c1.low && c1.seen.includes("walk") && !c1.seen.includes("crawl") && c1.now === c1.room, c1);
  ok("the same door at three times the size: too tall, the last stretch crawled", !c3.none && !!c3.low && c3.seen.indexOf("crawl") > c3.seen.indexOf("walk") && c3.now === c3.room, c3);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
