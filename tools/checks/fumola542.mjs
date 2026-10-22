// (ticket 542, Matthew: "open a PR against dress-up that does the Fumola versions") The room rules in Fumola, in the browser: the
// same events, in the same rooms, under ?logic=js, ?logic=fumola (the World rule's map held in Fumola) and ?logic=fumola-list (the
// map passed in with each way), each in a fresh page, as tools/checks/hazellogic531.mjs plays them for Hazel: the trap room wired at
// random (red and blue levers, both sides, eight pulls), a tree house's trap door and the round room's, a room of placed levers (one
// swinging two trap doors, one dropping rocks), the trap room's pits under four lever settings, both dungeons' ladders up, and every
// way out of six of the world's squares. Then a world walked, as a player walks it: four ways in turn from a square with a way
// (worldWalk, the friend going through), and where each one ends. The game's state after each pull, where each way leads and where
// each walk ends must be the same as under js. Under fumola and fumola-list: Fumola's wasm build loaded from fumola.org and the rules
// defined, every pull, way and walk decided by Fumola (__hz.calls), no command unknown, nothing said otherwise than drawn
// (__hz.mismatch), no rule stopped; fumola made its map at least once and fumola-list never. Each mode's per-event times printed
// from __hz. Exits 1 on a failure.
//   node fumola542.mjs <devtools port> <url>
const [dport, url0] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const withLogic = (u, m) => { const [base, hash] = u.split("#"); return base.split("?")[0] + "?logic=" + m + (hash ? "#" + hash : ""); };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 900)}`); if (!cond) bad++; };
const SCENARIO = `(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, out = { steps: [] };
  state.music.mute = true; state.world.at = null; climb = null;
  if (SCRIPT_FUMOLA) { const t0 = performance.now();
    try { await fumolaLoad(); } catch (e) { out.loadError = String(e && e.message || e); }
    for (let i = 0; i < 100 && !(fumolaCompile() || {}).ready; i++) await w(100);
    const C = fumolaCompile() || {}; out.ready = !!C.ready; out.errors = C.errors; out.loadMs = Math.round(performance.now() - t0); out.defineMs = C.ms; }
  const snap = what => out.steps.push({ what, kind: B.kind,
    keys: Object.fromEntries(Object.keys(B).filter(k => /^castle(Lever|Boulder)[LR]_3N$|^hatchShut/.test(k)).sort().map(k => [k, B[k]])),
    fallen: (B.things || []).filter(t => t.fallen).map(t => t.pit).sort(),
    things: (B.things || []).filter(t => !t.fallen).map(t => ({ kind: t.kind, on: !!t.on, open: !!t.open, boulder: !!t.boulder })) });
  // the trap room, wired at random
  for (const k of Object.keys(B)) if (/^castle(Lever|Boulder)[LR]_|^hatchShut/.test(k)) delete B[k];
  Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -700, figY: 0, things: [], castleLeverWire3N: "random", castleLeverSeed3N: 42, castleLeverL_3N: false, castleLeverR_3N: true });
  changed(); await w(500);
  for (const p of ["L", "BL", "R", "BR", "BL", "L", "BR", "R"]) { if (B.kind !== "castleroom") Object.assign(B, { kind: "castleroom", castleRoom: 3, figX: -700, figY: 0 }); roomLeverPull(p); await w(BOULDER_FALL + 500); snap("trap " + p); }
  // the tree house's trap door, then the round room's
  Object.assign(B, { kind: "treeroom", houses: 4, inside: 2, figX: -600, figY: 0, things: [] }); changed(); await w(400);
  for (let i = 0; i < 3; i++) { roomLeverPull("H"); await w(1000); snap("hatch " + i); }
  Object.assign(B, { kind: "treetop", figX: -600, figY: 0 }); changed(); await w(400);
  for (let i = 0; i < 3; i++) { roomLeverPull("H"); await w(1000); snap("top " + i); }
  // placed levers
  Object.assign(B, { kind: "emptyroom", figX: -700, figY: 0, things: [
    { ...(THING_DEFAULTS.trapdoor || {}), kind: "trapdoor", x: -200, z: SCENE.ground + 90, size: 100, uid: "da", open: false },
    { ...(THING_DEFAULTS.trapdoor || {}), kind: "trapdoor", x: 0, z: SCENE.ground + 90, size: 100, uid: "db", open: true },
    { ...(THING_DEFAULTS.trapdoor || {}), kind: "trapdoor", x: 200, z: SCENE.ground + 90, size: 100, uid: "dc", open: true },
    { ...(THING_DEFAULTS.lever || {}), kind: "lever", x: 300, z: SCENE.ground + 40, size: 100, works: ["da", "db"], on: false },
    { ...(THING_DEFAULTS.lever || {}), kind: "lever", x: 400, z: SCENE.ground + 40, size: 100, works: ["dc"], on: false, does: "boulder" }] });
  changed(); await w(400);
  for (const i of [3, 4, 3, 4, 3]) { leverPull(i); await w(1000); snap("thing " + i); }
  // the castle's and the world's ways, each as the game decides it when one is taken (scriptGo, scriptWay), on the doors drawn
  out.ways = []; out.extra = 0;
  const lead = (what, door) => { if (!door) { out.ways.push({ what, none: true }); return; }
    const go = scriptGo(door); out.extra++;
    out.ways.push({ what, to: go === false ? "nowhere" : go ? go.to : door.dataset.to, room: go ? go.room ?? null : go === false ? null : door.dataset.room ?? null }); };
  for (const k of Object.keys(B)) if (/^castle(Lever|Boulder)[LR]_/.test(k)) delete B[k];
  for (const [l, r] of [[false, false], [true, true], [false, true], [true, false]]) {
    Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -700, figY: 0, things: [], castleLeverWire3N: "normal", castleLeverL_3N: l, castleLeverR_3N: r });
    changed(); await w(400);
    for (const pit of bgShown.node ? bgShown.node.querySelectorAll(".portal[data-pit]") : []) lead("pit " + pit.dataset.pit.split(" ")[0] + " levers " + l + r, pit); }
  const K = castleOf(B);
  for (const st of ["dungeon1", "dungeon2"]) { const n = K.rooms.indexOf(st) + 1; if (!n) continue;
    Object.assign(B, { kind: "castleroom", castleRoom: n, figX: 0, figY: 0, things: [] }); changed(); await w(400);
    lead("ladder up from " + st, bgShown.node && bgShown.node.querySelector('.portal[data-to="castleroom"], .portal[data-to="castle"]')); }
  const W = state.world;
  for (const at of Object.keys(W.cells || {}).slice(0, 6)) { worldEnter(at, null, true); await w(300);
    for (const d of worldWays(W.cells[at])) { if (W.cells[at].links && W.cells[at].links[d]) continue;
      const t = scriptWay(W, d); out.extra++; out.ways.push({ what: "way " + at + " " + d, key: t ? t.key : null }); } }
  // a world walked: from the first square with a way somewhere, four ways in turn (each square's ways in order), the friend going through
  out.walks = []; out.walked = 0; const calls0 = (window.__hz || {}).calls || 0;
  const unlinked = (X, k) => worldWays(X.cells[k]).filter(d => !(X.cells[k].links && X.cells[k].links[d]));
  const start = Object.keys(W.cells).find(k => unlinked(W, k).some(d => worldTarget(W, k, d)));
  if (start) { worldEnter(start, null, true); await w(800);
    for (let i = 0; i < 4; i++) { const X = state.world, from = X.at, ds = unlinked(X, from);
      const d = ds.find(dd => worldTarget(X, from, dd) && dd !== (out.walks.length ? WORLD_OPP[out.walks[out.walks.length - 1].d] : "")) || ds[0];
      const door = d && bgShown.node && bgShown.node.querySelector('.portal[data-way="' + d + '"]');
      if (!door) { out.walks.push({ d, from, none: true }); continue; }
      const t0 = trips.length; out.walked++; worldWalk(door);
      for (let j = 0; j < 40 && trips.length === t0; j++) await w(150); await w(600);
      out.walks.push({ d, from, at: state.world.at, kind: state.background.kind, moved: trips.length > t0 }); } }
  out.walkCalls = ((window.__hz || {}).calls || 0) - calls0;
  W.at = null;
  out.held = SCRIPT_FUMOLA && fumolaCompiled && fumolaCompiled.rules ? fumolaCompiled.rules.held.builds : null;
  out.hz = window.__hz || null;
  return JSON.stringify(out); })()`;
async function runMode(mode) {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map(), errs = [];
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
  try {
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: withLogic(url0, mode) }); await sleep(4000);
    for (let i = 0; i < 60 && !(await ev(`typeof roomLeverPull === "function" && typeof scriptEvent === "function" && typeof fumolaCompile === "function"`).catch(() => false)); i++) await sleep(500);
    return { ...JSON.parse(await ev(SCENARIO)), errs };
  } finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
}
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const timesOf = (o, side) => Object.entries((o && o[side]) || {}).map(([k, a]) => `${k} n=${a.length} p50 ${q(a, 0.5)} p95 ${q(a, 0.95)} ms`).join("; ");
try {
  const js = await runMode("js");
  const PULLS = 8 + 3 + 3 + 5;
  ok(`js: the scenario's ${PULLS} pulls`, js.steps.length === PULLS, js.steps.length);
  ok("js: the trap room's pulls changed something (not a scenario that does nothing)", new Set(js.steps.slice(0, 8).map(s => JSON.stringify(s.keys))).size > 3, js.steps.slice(0, 8).map(s => s.keys));
  ok("js: pits, both dungeons' ladders and world ways were found", js.ways.some(x => /^pit /.test(x.what) && !x.none) && js.ways.filter(x => /^ladder/.test(x.what) && !x.none).length === 2 && js.ways.filter(x => /^way /.test(x.what)).length > 10, js.ways.map(x => x.what + (x.none ? " (none)" : "")));
  ok("js: the friend walked into another square at least twice", js.walks.filter(x => x.moved && x.at !== x.from).length >= 2, js.walks);
  ok("js: nothing went through a rule", !js.hz || js.hz.calls === 0, js.hz && js.hz.calls);
  console.log(`  js:    ${timesOf(js.hz, "js")}`);
  console.log(`  js walks: ${JSON.stringify(js.walks)}`);
  for (const mode of ["fumola", "fumola-list"]) {
    const fm = await runMode(mode);
    ok(`${mode}: Fumola loaded and the rules defined (${fm.loadMs} ms to ready, ${fm.defineMs && fm.defineMs.toFixed(1)} ms to define)`, fm.ready === true, { ready: fm.ready, loadError: fm.loadError, errors: fm.errors });
    ok(`${mode}: the same number of steps (${PULLS})`, fm.steps.length === js.steps.length, [js.steps.length, fm.steps.length]);
    js.steps.forEach((s, i) => ok(`${mode}: after ${s.what}: the same state as js`, JSON.stringify(s) === JSON.stringify(fm.steps[i]), { js: s, [mode]: fm.steps[i] }));
    ok(`${mode}: the castle's and the world's ways: the same decisions as js`, JSON.stringify(js.ways) === JSON.stringify(fm.ways), { js: js.ways, [mode]: fm.ways });
    ok(`${mode}: the world walked: each walk ends where it does under js`, JSON.stringify(js.walks) === JSON.stringify(fm.walks), { js: js.walks, [mode]: fm.walks });
    ok(`${mode}: every pull, way and walk went through Fumola (${PULLS} + ${fm.extra} + ${fm.walked})`, fm.hz && fm.hz.calls === PULLS + fm.extra + fm.walked && fm.walkCalls === fm.walked, fm.hz && [fm.hz.calls, fm.extra, fm.walked, fm.walkCalls]);
    ok(`${mode}: no command unknown, nothing said otherwise than drawn, no rule stopped`, fm.hz && fm.hz.unknown === 0 && fm.hz.mismatch === 0 && !fm.hz.stopped, fm.hz && { unknown: fm.hz.unknown, tags: fm.hz.unknownTags, mismatch: fm.hz.mismatch, stopped: fm.hz.stopped });
    ok(`${mode}: ${mode === "fumola" ? "the world's map held in Fumola, made at least once" : "no map held: it is passed in"} (made ${fm.held} times)`, mode === "fumola" ? fm.held >= 1 : fm.held === 0, fm.held);
    ok(`${mode}: no page errors`, !fm.errs.length && !js.errs.length, [js.errs, fm.errs]);
    console.log(`  ${mode}: ${timesOf(fm.hz, "fumola")}; handler p50 ${q(fm.hz.ms, 0.5)} ms, run p50 ${q(fm.hz.runMs, 0.5)} ms, define ${fm.hz.compileMs.join(", ")} ms`);
  }
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
