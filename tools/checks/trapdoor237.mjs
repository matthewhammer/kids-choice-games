// (ticket 237, Matthew: "collision detection should avoid walking over the trap doors in the floor of the tree
// houses") A tree room's trapdoor, its hole in the floor, is a solid: in the list (solidsHere, as "trapdoor", where the
// drawing's hole is), a walk planned across the room goes round it, and walking straight at it stops at its edge.
// (Its ladder down, still taken from its near edge: nav199's and passages187's own cases.) Exits 1 on a failure.
//   node trapdoor237.mjs <devtools port> <url>
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
    let room = null;
    for (let i = 1; i <= 6 && !room; i++) { Object.assign(B, { kind: "treeroom", houses: 6, inside: i, figX: 0, figY: 0, things: [] }); changed(); await w(450);
      if (bgShown.node.querySelector("[data-hole]")) room = i; }
    if (!room) return JSON.stringify({ none: true });
    const el = bgShown.node.querySelector("[data-hole]"), [hx0, hx1, hb, hf] = el.dataset.hole.split(" ").map(Number);
    const holes = solidsHere().filter(o => o.name === "trapdoor"), o = holes[0];
    // a walk planned across the room, from one side of the hole to the other at its depth
    const zm = (o.back + o.front) / 2, from = [o.x0 - 80, zm - g], to = [o.x1 + 80, zm - g], path = planPath(from[0], from[1], to[0], to[1]);
    const pts = [from, ...path].map(([x, y]) => [x, y + g]);
    const crosses = pts.slice(1).some((p, i) => segBox(pts[i][0], pts[i][1], p[0], p[1], o.x0, o.back, o.x1, o.front));
    // walking straight back into it from in front of it
    const cx = (o.x0 + o.x1) / 2, fy = o.front + 40 - g; B.figX = cx; B.figY = fy; changed(); await w(200);
    const hit0 = solidHit.n, [mx, my] = solidMove(cx, fy, cx, zm - g);
    return JSON.stringify({ room, hole: [hx0, hx1, hb, hf], holes: holes.length, box: o && [o.x0, o.x1, o.back, o.front].map(Math.round), path: path.map(p => p.map(Math.round)), crosses,
      stoppedAt: Math.round(my + g), front: Math.round(o.front), hit: solidHit.n > hit0 ? solidHit.name : null }); })()`));
  if (r.none) ok("a tree room with a trapdoor found", false, r);
  else {
    ok(`tree room ${r.room}'s trapdoor is a solid, where its hole is drawn`, r.holes === 1 && r.box[0] === Math.round(r.hole[0]) && r.box[3] === Math.round(r.hole[3]), r);
    ok("a walk planned across the room, past the hole, goes round it", r.path.length > 1 && !r.crosses, r);
    ok("walking straight back into it: stopped at its near edge, by the trapdoor", r.stoppedAt >= r.front && r.hit === "trapdoor", r);
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
