// (ticket 268, Matthew: "the motion plan for the spiral stairs needs work. it should follow the center of the stairs, not
// the farthest edge"; "the front half is missing. let's draw it all") In N's room 2 made the spiral staircase: the steps
// of the turns above drawn in front too; a walk to each door up the stairs planned along the steps' middle (each point
// before the last within reach of the middle line) and arriving where it leads. Exits 1 on a failure.
//   node spiral268.mjs <devtools port> <url>
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
    Object.assign(B, { kind: "castleroom", castle: "N", figX: 0, figY: 40, things: [], castleRoom2N: "spiral" }); const room = 2; B.castleRoom = room; changed(); await w(600);
    const front = bgShown.node.querySelectorAll('[data-obj="steps, in front"] [data-front-step]').length;
    const G = spiralGeom(stageC()), g = SCENE.ground, rm = (G.r0 + G.R) / 2, off = (x, y) => { let d = Infinity; for (let th = G.th0; th < G.th0 + 4.6 * Math.PI; th += 0.01) { const [px, py] = G.pt(rm, th, G.lvl(th)); d = Math.min(d, Math.hypot(px - x, py - (y + g))); } return d; };
    const out = [];
    const doors = () => [...bgShown.node.querySelectorAll('.portal[data-to]')].filter(d => d.dataset.room);
    for (let i = 0; i < doors().length; i++) {
      Object.assign(B, { kind: "castleroom", castleRoom: room, figX: 0, figY: 40 }); state.body.anim = "none"; changed(); await w(500);
      const d = doors()[i], to = +d.dataset.room; enterScene(d); await w(100);
      const pts = walkPath ? walkPath.pts.slice(1, -1) : [], far = pts.length ? Math.max(...pts.map(([x, y]) => off(x, y))) : 0;
      const t0 = performance.now(); while (performance.now() - t0 < 12000 && (entering || (B.kind === "castleroom" && B.castleRoom === room))) await w(80);
      out.push({ to, legs: pts.length, far: Math.round(far), now: B.castleRoom });
    }
    return JSON.stringify({ front, out }); })()`));
  console.log(`  ${r.front} steps in front; walks: ${JSON.stringify(r.out)}`);
  ok("the turns above drawn in front too", r.front > 3, r);
  ok("each walk to a door up the stairs along the steps' middle (its points within reach of it)", r.out.every(d => d.legs === 0 || d.far < 30), r.out);
  ok("and arriving where it leads", r.out.every(d => d.now === d.to), r.out);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
