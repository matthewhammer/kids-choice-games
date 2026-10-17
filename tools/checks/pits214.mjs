// (ticket 214, Matthew: "planned path goes through the pit --- they don't seem registered in the collision system, but
// they should have their own status as something to avoid when planning a path"; "but the mechanism for falling a pit
// works -- let's integrate that with the rest of collision detection") In N's castle's trap room: its pits, named; a
// planned walk from in front of one to behind it goes round its hole (the straight line goes through it); ♿'s
// collision boxes show each pit; and walked onto with the on-screen controller, the friend falls in, to the room it
// leads to, the pit glowing as a collision. Exits 1 on a failure.
//   node pits214.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1200)}`); if (!cond) bad++; };
const ROOM = `state.music.mute = true; state.world.at = null; state.body.anim = "none"; climb = null;
  Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 3, castleRoom3N: "trap", figX: 0, figY: 60 }); changed(); await new Promise(r => setTimeout(r, 900));`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { ${ROOM}
    const g = SCENE.ground, P = pitsHere(), q = P[P.length - 1]; if (!q) return JSON.stringify({ none: true });
    const inHole = (x, z) => P.some(p => overPit(p, x, z));
    const a = [q.cx, q.cy + PIT_EDGE * q.ry + 40], b = [q.cx, Math.max(g + figYMin(sceneFrame) + 2, q.cy - PIT_EDGE * q.ry - 25)];
    const crosses = (pts) => { for (let i = 1; i < pts.length; i++) for (let t = 0; t <= 1; t += 0.01) { const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, z = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t; if (inHole(x, z)) return true; } return false; };
    const plan = planPath(a[0], a[1] - g, b[0], b[1] - g).map(p => [p[0], p[1] + g]);
    // ♿'s boxes: each pit drawn, named
    Object.assign(state.access, { showSolids: true }); changed(); await new Promise(r => setTimeout(r, 300));
    const drawn = P.map(p => !!document.querySelector('#access-layer svg.solid-boxes [data-solid="' + p.name + '"] ellipse.pit'));
    state.access.showSolids = false; changed();
    return JSON.stringify({ names: P.map(p => p.name), straight: crosses([a, b]), plan: plan.map(p => p.map(Math.round)), planCrosses: crosses([a, ...plan]), drawn }); })()`));
  ok("the trap room's pits, each named by the room it leads to", !r.none && r.names.length >= 1 && r.names.every(nm => /^pit to room \d+$/.test(nm)), r);
  ok("from in front of a pit to behind it, the straight way goes through its hole (the check sees it)", !r.none && r.straight, r);
  ok("and the planned walk goes round it", !r.none && !r.planCrosses && r.plan.length > 1, r);
  ok("🧱 collision boxes show each pit", !r.none && r.drawn.length && r.drawn.every(Boolean), r);
  // walked onto with the on-screen controller (up, from in front of the right pit): falls in, to its room
  const f = JSON.parse(await ev(`(async () => { ${ROOM}
    const g = SCENE.ground, P = pitsHere(), q = P[P.length - 1], to = q.el.dataset.room;
    state.background.figX = Math.round(q.cx); state.background.figY = Math.round(q.cy + PIT_EDGE * q.ry + 30 - g); changed(); await new Promise(r => setTimeout(r, 400));
    touchWant(true); const p = touchPad.pad.buttons[12]; p.pressed = true; p.value = 1;
    let hit = null; const t0 = performance.now();
    while (performance.now() - t0 < 6000 && !(state.background.castleRoom == to && !entering)) { if (!hit && solidHit.name && /^pit/.test(solidHit.name)) hit = solidHit.name; await new Promise(r => setTimeout(r, 50)); }
    p.pressed = false; p.value = 0; touchWant(false);
    return JSON.stringify({ to, room: state.background.castleRoom, kind: state.background.kind, hit, name: q.name }); })()`));
  ok("walked onto the pit, the friend falls in, to the room it leads to", f.kind === "castleroom" && String(f.room) === String(f.to), f);
  ok("the fall is a collision with the pit (it glows, as ♿ shows a collision)", f.hit === f.name, f);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
