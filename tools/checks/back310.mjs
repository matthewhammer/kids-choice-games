// (ticket 310) At the house and the castle the back line is the horizon, not the building's front: each building has a box
// of its own at its foot, with room behind it for the feet (more than their depth twice) up to the back line, and a walk
// from the side reaches the middle behind it without passing through it. In the healer's hut, the feet go round behind
// the soup pot the same way. Exits 1 on a failure.
//   node back310.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; if (B.seat) standUp(); state.body.anim = "none";
    // (ticket 369: a round thing's box is an oval since 0.0.280, ticket 337, gone round as one: its own shape, not its rectangle's corners)
    const inBox = (o, x, y) => o.oval ? ovalMeets(o, x, x, y, y) : x > o.x0 && x < o.x1 && y > o.back && y < o.front;
    const behind = async (kind, name, from) => { B.kind = kind; B.figX = from[0]; B.figY = from[1]; changed(); await w(600); draw();
      const lim = g + figYMin(sceneFrame), box = solidsHere().find(o => o.name === name), depth = feetSpan()[1];
      if (!box) return { kind, missing: true };
      const x = (box.x0 + box.x1) / 2, ty = (lim + box.back) / 2, path = planPath(from[0], from[1], x, ty - g, 10), end = path[path.length - 1];
      let through = false; const P = [from, ...path];
      for (let i = 1; i < P.length; i++) for (let t = 0; t <= 1; t += 0.05) { const px = P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, py = g + P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t; if (inBox(box, px, py)) through = true; }
      return { kind, lim: Math.round(lim), back: Math.round(box.back), front: Math.round(box.front), gap: Math.round(box.back - lim), depth: +depth.toFixed(1),
               reached: !!end && Math.abs(end[0] - x) < 2 && Math.abs(g + end[1] - ty) < 2, through }; };
    const house = await behind("house", "house", [-320, 60]), castle = await behind("castle", "castle", [-330, 60]), healer = await behind("healerroom", "soup pot", [-200, 60]);
    return JSON.stringify({ house, castle, healer }); })()`));
  for (const k of ["house", "castle", "healer"]) console.log(`  ${JSON.stringify(r[k])}`);
  for (const k of ["house", "castle"]) {
    ok(`${k}: the building has a box of its own at its foot, the back line beyond it, room for the feet between`, !r[k].missing && r[k].gap > 2 * r[k].depth, r[k]);
    ok(`${k}: a walk from the side reaches behind the middle of it, not through it`, r[k].reached && !r[k].through, r[k]);
  }
  ok("the healer's hut: the feet go round behind the soup pot, room between it and the back line", r.healer.gap > 2 * r.healer.depth && r.healer.reached && !r.healer.through, r.healer);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
