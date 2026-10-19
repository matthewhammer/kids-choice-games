// (ticket 212, part 4, Matthew: "include an audit, just for that background as in 214, for the new revisions to open water") The open
// water's horizon with its distant shore: off (by default), and on (snowy peaks, a mixed forest, a beach) at its smallest size (25), at
// 100 and at its largest (300). In each, the friend swum north from the middle on the on-screen controller, held up until they stop: their
// feet stop at the horizon, the shore's water line, never in the sky or on the shore; the shore's layers all above that line (as 🔬
// names them: far mountains, far forest, far beach). And in a world of two open water squares, one north of the other: swum north into
// the horizon, the N arrow shows near it and the way is taken, with the shore off and with it on at 300. No island and no sail boat
// (part 1). Exits 1 on a failure.
//   node shore212.mjs <devtools port> <url>
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
const SHORE = (size) => size ? `seaMountains: "snowy", seaForest: "mixed", seaBeach: true, seaShoreSize: ${size}` : `seaMountains: "none", seaForest: "none", seaBeach: false, seaShoreSize: 100`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const cases = [];
  for (const size of [0, 25, 100, 300]) {
    cases.push(JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
      state = clone(DEFAULTS); state.music.mute = true; state.world.at = null; state.body.anim = "none"; climb = null;
      Object.assign(state.background, { kind: "sea", ${SHORE(size)} }); changed(); await w(300);
      const F = sceneFrame, B = state.background, hz = seaHorizon({ g: SCENE.ground, k: (SCENE.bottom - SCENE.top) / 700 }), yMin = figYMin(F), yMax = F.bottom - F.ground;
      B.figX = 0; B.figY = (yMin + yMax) / 2; changed(); await w(400); touchWant(true);
      const p = touchPad.pad.buttons[12]; p.pressed = true; p.value = 1;
      // (held until they stop: 1 s with no move, 8 s at most)
      { let last = B.figY, still = 0; for (let t = 0; t < 8000 && still < 1000; t += 100) { await w(100); if (Math.abs(B.figY - last) < 0.5) still += 100; else { still = 0; last = B.figY; } } }
      p.pressed = false; p.value = 0; touchWant(false); await w(300);
      const layers = [...document.querySelectorAll('#bg [data-obj^="far "]')].map(g => { const b = g.getBBox(); return [g.dataset.obj, Math.round(b.y + b.height)]; });
      return JSON.stringify({ size: ${size}, hz: Math.round(hz), feet: Math.round(SCENE.ground + B.figY), layers, objs: [...document.querySelectorAll("#bg [data-obj]")].map(e => e.dataset.obj) }); })()`)));
  }
  for (const c of cases) console.log("  " + JSON.stringify(c));
  ok("no island and no sail boat on the open water", cases.every(c => !c.objs.some(o => /island|sailboat/.test(o))), cases.map(c => c.objs));
  ok("the shore off by default: no layer drawn", cases[0].layers.length === 0, cases[0].layers);
  ok("the shore on: its three layers drawn at each size", cases.slice(1).every(c => ["far mountains", "far forest", "far beach"].every(nm => c.layers.some(([o]) => o === nm))), cases.slice(1).map(c => c.layers));
  ok("swum north, the feet stop at the horizon (never above it), whatever the shore", cases.every(c => c.feet >= c.hz - 1), cases.map(c => [c.size, c.hz, c.feet]));
  ok("swum north, the feet reach the horizon's water (within 12 of it)", cases.every(c => c.feet <= c.hz + 12), cases.map(c => [c.size, c.hz, c.feet]));
  ok("the shore's layers all above the water line", cases.every(c => c.layers.every(([, bottom]) => bottom <= c.hz + 1)), cases.map(c => [c.hz, c.layers]));
  // the way N, taken by swimming into the horizon
  const ways = [];
  for (const size of [0, 300]) {
    ways.push(JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
      state = clone(DEFAULTS); state.music.mute = true; state.body.anim = "none"; climb = null;
      state.world = { ...clone(state.world), cols: 1, rows: 2, start: "0,1", at: null, unreachable: [], cells: { "0,0": { kind: "sea", ways: ["S"], things: [] }, "0,1": { kind: "sea", ways: ["N"], things: [] } } };
      Object.assign(state.background, { ${SHORE(size)} }); worldEnter("0,1", null, false); changed(); await w(400);
      const F = sceneFrame, B = state.background, yMin = figYMin(F), yMax = F.bottom - F.ground; B.figX = 0; B.figY = (yMin + yMax) / 2; changed(); await w(400); touchWant(true);
      const p = touchPad.pad.buttons[12]; p.pressed = true; p.value = 1; let arrow = false; const t0 = performance.now();
      while (state.world.at === "0,1" && performance.now() - t0 < 9000) { const a = document.querySelector('#ways .way-arrow[data-way="N"]'); if (a && (a.classList.contains("near") || a.classList.contains("aimed"))) arrow = true; await w(50); }
      p.pressed = false; p.value = 0; touchWant(false);
      return JSON.stringify({ size: ${size}, arrow, at: state.world.at, kind: state.background.kind, t: Math.round(performance.now() - t0) }); })()`)));
  }
  for (const c of ways) console.log("  " + JSON.stringify(c));
  ok("a way N: swum into the horizon, its arrow shows and the way is taken (shore off, and on at 300)", ways.every(c => c.arrow && c.at === "0,0" && c.kind === "sea"), ways);
  // (part 3, ticket 213: "stack them into a column in the world grid and rescale the distant shore in each to make it seem like we are
  // getting closer as we go north") the two squares, the shore's layers set for every open water square (🧩 the template), its size for
  // each square alone (📍 only this square, ticket 300's instances)
  const per = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state = clone(DEFAULTS); state.music.mute = true; state.body.anim = "none"; climb = null;
    state.world = { ...clone(state.world), cols: 1, rows: 2, start: "0,1", at: null, unreachable: [], cells: { "0,0": { kind: "sea", ways: ["S"], things: [] }, "0,1": { kind: "sea", ways: ["N"], things: [] } } };
    worldEnter("0,1", null, false); changed(); await w(300);
    set("background", "seaForest", "pines"); set("background", "seaMountains", "blue"); set("background", "instEdit", "instance"); set("background", "seaShoreSize", 60); await w(200);
    worldEnter("0,0", "S", false); changed(); await w(300); set("background", "instEdit", "instance"); set("background", "seaShoreSize", 220); await w(200);
    worldEnter("0,1", "N", false); changed(); await w(300); const south = [state.background.seaForest, state.background.seaMountains, state.background.seaShoreSize];
    worldEnter("0,0", "S", false); changed(); await w(300); const north = [state.background.seaForest, state.background.seaMountains, state.background.seaShoreSize];
    state = clone(DEFAULTS); changed(); return JSON.stringify({ south, north }); })()`));
  ok("each square its own shore size (📍 only this square): 60 south, 220 north; the layers the same in both (🧩 the template)", per.south.join() === "pines,blue,60" && per.north.join() === "pines,blue,220", per);
  ok("no error thrown", errs.length === 0, errs);
} catch (e) { ok("ran", false, String(e)); }
process.exit(bad ? 1 : 0);
