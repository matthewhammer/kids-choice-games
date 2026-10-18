// (ticket 252, Matthew: "the trapdoor-stairs in the tree house animate very nicely now, on the floor. But the ones
// going up still do not clip the character right, and we instead use a fade away ... and at the same time, the way up
// the pits by ladder, which has the same issue") Up a tree room's ladder through its ceiling, and up a dungeon's ladder
// out of its pit: the friend cut off at the opening as they climb (a clip, its line the opening's), never faded while
// still seen, and arriving in the room above. Exits 1 on a failure.
//   node climbup252.mjs <devtools port> <url>
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
// (in the page: from where the friend stands, up the ladder L; what was seen on the way)
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
  const settle = async () => { changed(); await w(450); measureMarks(); };
  const up = async (L, done) => { const out = { clipUp: L.up, clipLines: new Set(), fadedSeen: false, ms: 0 }; climbLadder(L.el); const t0 = performance.now();
    while (performance.now() - t0 < 12000) { await w(50);
      const r = document.querySelector("#pic g.fig-clip clipPath rect"); if (r) out.clipLines.add(Math.round(+r.getAttribute("y")));
      const seen = climb && climb.all != null && climb.at < climb.all - 8;   // (still below the opening, partly seen)
      if (seen && [...figShown].some(n => n.style && n.style.opacity !== "" && +n.style.opacity < 0.99)) out.fadedSeen = true;
      if (done() && !entering) break; }
    out.ms = Math.round(performance.now() - t0); out.clipLines = [...out.clipLines]; return out; };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const tree = JSON.parse(await ev(`(async () => { ${H} state.music.mute = true; state.world.at = null; state.body.facing = "front"; state.body.anim = "none";
    let L = null, room = 0;
    for (let i = 1; i <= 6 && !L; i++) { Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 6, inside: i, figX: 0, figY: 60, things: [] }); await settle();
      L = marks.ladders.find(q => q.up != null && q.door); if (L) room = i; }
    if (!L) return JSON.stringify({ none: true });
    B.figX = Math.round(L.x); B.figY = Math.round(L.z - SCENE.ground); await settle();
    const r = await up(L, () => B.inside !== room); return JSON.stringify({ room, to: B.inside, kind: B.kind, ...r }); })()`));
  ok("up a tree room's ladder: cut off at its ceiling's opening as they climb", !tree.none && tree.clipLines.length > 0 && tree.clipLines.every(y => Math.abs(y - tree.clipUp) <= 1), tree);
  ok("never faded while still seen, and in the room above", !tree.none && !tree.fadedSeen && tree.to !== tree.room && tree.kind === "treeroom", tree);
  const dun = JSON.parse(await ev(`(async () => { ${H} Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 4, figX: 0, figY: 60, things: [] }); state.body.anim = "none"; await settle();
    const L = marks.ladders.find(q => q.up != null && q.door); if (!L) return JSON.stringify({ none: marks.ladders.map(q => [q.up, !!q.door]) });
    B.figX = Math.round(L.x); B.figY = Math.round(L.z - SCENE.ground); await settle();
    const r = await up(L, () => !(B.kind === "castleroom" && B.castleRoom === 4)); return JSON.stringify({ to: B.kind + ":" + B.castleRoom, ...r }); })()`));
  ok("up a dungeon's ladder out of its pit: cut off at the opening, never faded while seen, and out", !dun.none && dun.clipLines.length > 0 && dun.clipLines.every(y => Math.abs(y - dun.clipUp) <= 1) && !dun.fadedSeen && dun.to !== "castleroom:4", dun);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
