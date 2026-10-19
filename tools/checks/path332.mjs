// (ticket 332, Matthew: "why is the path planned through the collision boxes of the corner tree trunk?") No lane behind a
// solid near the back line (in every place, no solid's back within LANE_MIN of it: the tree room's trunk was 4 short, a lane
// the feet could stand in and plan no way out of); and in sixteen places, from 24 free spots each to every third other, no
// planned walk crosses any solid's box (but one it starts or ends in). Exits 1 on a failure.
//   node path332.mjs <devtools port> <url>
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
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); state.music.mute = true; state.world.at = null; climb = null;
    const lanes = {};
    for (const kd of PLACES.map(([v]) => v).filter(v => v !== "none")) { state.background.kind = kd; changed(); await w(200);
      const bl = SCENE.ground + figYMin(sceneFrame), open = solidsHere().filter(o => !o.pit && o.back > bl - 0.5 && o.back - bl < LANE_MIN).map(o => o.name);
      if (open.length) lanes[kd] = open; }
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const walks = {};
    for (const kd of ["treeroom", "livingroom", "castleroom", "hutroom", "witchroom", "healerroom", "emptyroom", "forest", "clearing", "house", "castle", "waterfall", "campsite", "tent", "cave", "hut"]) {
      state.background.kind = kd; changed(); await w(250);
      const F = sceneFrame, g = SCENE.ground, yMin = figYMin(F), L = solidsHere(), spots = [];
      for (let t = 0; t < 400 && spots.length < 24; t++) { const x = F.left + 20 + rnd() * (F.right - F.left - 40), y = yMin + 2 + rnd() * (F.bottom - g - yMin - 4); if (!solidAt(x, g + y)) spots.push([x, y]); }
      const inBox = (o, x, z) => o.oval ? ovalMeets(o, x, x, z, z) : x > o.x0 && x < o.x1 && z > o.back && z < o.front;
      let count = 0; const through = [];
      for (let i = 0; i < spots.length; i++) for (let j = 0; j < spots.length; j += 3) { if (i === j) continue;
        const [ax, ay] = spots[i], [bx, by] = spots[j], pts = [[ax, ay], ...planPath(ax, ay, bx, by, 10)]; count++;
        for (let q = 1; q < pts.length; q++) for (const o of L) { if (o.pit || inBox(o, ax, g + ay) || inBox(o, bx, g + by)) continue;
          if (o.oval ? segOval(pts[q - 1][0], g + pts[q - 1][1], pts[q][0], g + pts[q][1], ovalOf(o)) : segBox(pts[q - 1][0], g + pts[q - 1][1], pts[q][0], g + pts[q][1], o.x0, o.back, o.x1, o.front)) through.push([o.name, Math.round(ax), Math.round(ay), Math.round(bx), Math.round(by)]); } }
      walks[kd] = { count, through: through.slice(0, 3), n: through.length };
    }
    return JSON.stringify({ lanes, walks }); })()`));
  for (const [kd, v] of Object.entries(r.walks)) console.log(`  ${kd}: ${v.count} walks, ${v.n} through a box`);
  ok("no lane under LANE_MIN behind a solid, in any place", !Object.keys(r.lanes).length, r.lanes);
  ok("no planned walk crosses a solid's box", Object.values(r.walks).every(v => v.n === 0), Object.fromEntries(Object.entries(r.walks).filter(([, v]) => v.n)));
  ok("each place's walks were tried", Object.values(r.walks).every(v => v.count > 100), Object.fromEntries(Object.entries(r.walks).map(([k, v]) => [k, v.count])));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
