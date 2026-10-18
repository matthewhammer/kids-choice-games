// (ticket 253, Matthew: "this was a good try, but the cut offs don't permit me to reach the doors! We may need more than 2
// segments for those 'side' cut offs, in general WDYT?") In N's spiral staircase: each door's foot inside the room's sides
// (castleWalls' half there, past the friend's reach), and each door taken (a click: walked to, through) arrives in the
// room it leads to. Exits 1 on a failure.
//   node spiral253.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null;
    // (N's room 2 made the spiral staircase: none of N's rooms is one at first)
    Object.assign(B, { kind: "castleroom", castle: "N", figX: 0, figY: 40, things: [], castleRoom2N: "spiral" }); const room = castleOf(B).rooms.indexOf("spiral") + 1; if (!room) return JSON.stringify({ none: true });
    B.castleRoom = room; changed(); await w(600);
    // (what the sides are made from: each door's foot as spiralDoorAt has it, and the sides there)
    const spots = [0, 1, 2, 3].map(j => { const d = spiralDoorAt(stageC(), j); return [Math.round(d.x), Math.round(d.y), Math.round(castleWalls(B).half(d.y))]; }), vy = Math.round(roomFrame(stageC()).vy);
    const doors = [...bgShown.node.querySelectorAll('.portal[data-to]')].filter(d => d.dataset.room || d.dataset.to === "castle");
    const out = [];
    for (let i = 0; i < doors.length; i++) {
      Object.assign(B, { kind: "castleroom", castleRoom: room, figX: 0, figY: 40 }); state.body.anim = "none"; changed(); await w(500);
      const d = [...bgShown.node.querySelectorAll('.portal[data-to]')].filter(d => d.dataset.room || d.dataset.to === "castle")[i];
      const P = pic.getScreenCTM().inverse(), b = d.getBoundingClientRect(), foot = new DOMPoint(b.x + b.width / 2, b.y + b.height).matrixTransform(P);
      const W = castleWalls(B), inside = Math.abs(foot.x) <= W.half(foot.y) - feetSpan()[0], to = d.dataset.room ? +d.dataset.room : 0;
      enterScene(d); const t0 = performance.now(); while (performance.now() - t0 < 9000 && (entering || (B.kind === "castleroom" && B.castleRoom === room))) await w(80);
      out.push({ i, to, foot: [Math.round(foot.x), Math.round(foot.y)], half: Math.round(W.half(foot.y)), inside, now: B.kind === "castleroom" ? B.castleRoom : B.kind });
    }
    return JSON.stringify({ room, out, spots, vy }); })()`));
  console.log(`  spiralDoorAt: ${JSON.stringify(r.spots)}, vy ${r.vy}`);
  if (r.none) throw new Error("N's castle has no spiral staircase");
  for (const d of r.out) console.log(`  door ${d.i + 1} (to ${d.to || "out"}): foot ${JSON.stringify(d.foot)}, the sides there ±${d.half}, ${d.inside ? "inside" : "OUTSIDE"}; taken: now in ${d.now}`);
  ok("a door or more in the spiral staircase", r.out.length >= 2, r);
  ok("every door's foot inside the room's sides, with room for the friend", r.out.every(d => d.inside), r.out.filter(d => !d.inside));
  ok("every door taken arrives where it leads", r.out.every(d => d.to ? d.now === d.to : d.now === "castle"), r.out);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
