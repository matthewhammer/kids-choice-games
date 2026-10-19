// (ticket 358, Matthew: "most deep sea objects should have a very small collision box. Each plant extending upwards, but also
// shells beyond a certain small size"; "the same logic for other scenes too, and the objects that do not have them"; "ladders
// ... should have collision boxes near the base ... All ladders probably") Under the sea, its seaweed and kelp small boxes (at
// most 22 wide) and its rocks and wreck in the way; the audit's kinds in the way (the forest's and castle's big trees, the
// witch's giant tree, the cemetery's stones, the cave's stalagmites, the hut's woodpile, the trap room's helmet, the house's
// toys); every ladder a box at its foot, and still climbed; and in those places no planned walk through a box, none left short.
// Exits 1 on a failure.
//   node solids358.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; const at = {};
    const look = async (label, set) => { set(); changed(); await w(300); at[label] = solidsHere().map(o => ({ n: o.name, w: o.x1 - o.x0, small: !!o.small, ladder: !!o.ladder })); };
    for (const kd of ["underwater", "deepsea", "forest", "castle", "witch", "cemetery", "cave", "hut", "house", "treehouse", "imagination"]) await look(kd, () => { B.kind = kd; });
    const K = castleOf(B); for (const st of ["trap", "stable"]) await look(st, () => { B.kind = "castleroom"; B["castleRoom6" + K.id] = st; B["castleRooms" + K.id] = 6; B.castleRoom = 6; });
    // (a climb, by a tree house ladder)
    B.kind = "treehouse"; changed(); await w(400); const L = solidsHere().find(o => o.ladder), g = SCENE.ground;
    B.figX = Math.round((L.x0 + L.x1) / 2 + 30); B.figY = Math.round(L.front - g + 10); state.body.anim = "climbup"; climbAnywhere = false; startClimb(); await w(200);
    const climbs = !!(climb && !climb.none); climb = null; state.body.anim = "none"; changed(); await w(200);
    // (the walks)
    let seed = 6 * 7919; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const walks = {};
    for (const kd of ["underwater", "deepsea", "cemetery", "cave", "house", "imagination"]) { B.kind = kd; changed(); await w(300);
      const F = sceneFrame, yMin = figYMin(F), S = solidsHere(), spots = [];
      for (let t = 0; t < 500 && spots.length < 20; t++) { const x = F.left + 20 + rnd() * (F.right - F.left - 40), y = yMin + 2 + rnd() * (F.bottom - g - yMin - 4); if (!solidAt(x, g + y)) spots.push([x, y]); }
      const inBox = (o, x, z) => o.oval ? ovalMeets(o, x, x, z, z) : x > o.x0 && x < o.x1 && z > o.back && z < o.front;
      let n = 0, short = 0, through = 0;
      for (let i = 0; i < spots.length; i++) for (let j = 0; j < spots.length; j += 2) { if (i === j) continue; const [ax, ay] = spots[i], [bx, by] = spots[j], P = planPath(ax, ay, bx, by, 10), pts = [[ax, ay], ...P]; n++; if (P.short) short++;
        for (let q = 1; q < pts.length; q++) for (const o of S) { if (o.pit || inBox(o, ax, g + ay) || inBox(o, bx, g + by)) continue;
          if (o.oval ? segOval(pts[q - 1][0], g + pts[q - 1][1], pts[q][0], g + pts[q][1], ovalOf(o)) : segBox(pts[q - 1][0], g + pts[q - 1][1], pts[q][0], g + pts[q][1], o.x0, o.back, o.x1, o.front)) through++; } }
      walks[kd] = { n, short, through }; }
    return JSON.stringify({ at, climbs, walks }); })()`));
  const has = (p, re) => (r.at[p] || []).some(o => re.test(o.n));
  console.log("  " + JSON.stringify(r.walks) + " climbs: " + r.climbs);
  ok("under the sea: seaweed and kelp small boxes (22 wide at most), rocks and the wreck in the way", r.at.underwater.some(o => /seaweed/.test(o.n) && o.small && o.w <= 23) && r.at.deepsea.some(o => /kelp/.test(o.n) && o.small && o.w <= 23) && has("underwater", /shipwreck/) && has("deepsea", /rock/), [r.at.underwater, r.at.deepsea]);
  ok("the audit's kinds in the way", has("forest", /big tree/) && has("castle", /big tree/) && has("witch", /giant tree/) && has("cemetery", /headstone/) && has("cemetery", /cross/) && has("cave", /stalagmite/) && has("hut", /woodpile/) && has("trap", /helmet/) && has("house", /teddy/), Object.fromEntries(Object.entries(r.at).map(([k, v]) => [k, v.map(o => o.n)])));
  ok("every ladder a box at its foot (the tree house's, our imagination's, the stable's)", (r.at.treehouse || []).filter(o => o.ladder).length >= 2 && (r.at.imagination || []).filter(o => o.ladder).length >= 8 && (r.at.stable || []).some(o => o.ladder), [r.at.treehouse, r.at.stable]);
  ok("a ladder still climbed", r.climbs, r.climbs);
  ok("no planned walk through a box, none left short", Object.values(r.walks).every(v => v.through === 0 && v.short === 0 && v.n > 50), r.walks);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
