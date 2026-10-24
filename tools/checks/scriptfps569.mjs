// (ticket 569, Matthew 2026-10-23: "speed-run standards per script setting: a minimum FPS for the squares each setting controls")
// Each engine held to the game's frame rate where its scripts decide what happens: under ?logic=js, ?logic=hazel and ?logic=fumola
// (every room's rule as the game ships it), each in a fresh page with the engine ready first, the game's frames counted while
// the rooms the scripts control are played: the trap room's red and blue levers, a tree house's trap door, a room of placed levers
// (two doors and a rock), the castle's ways (its pits and ladders, each decided as when taken), and the world's ways out of its
// squares. Each case three times; it passes when the median run is at least MIN (55) frames a second, as the game's own gate
// (tools/fpsgate.mjs) has it, and a case below that runs three more times once before it fails. Not lowered for an engine: Hazel's
// World rule is O(N) a call until ^ticket(558) lands (the game loads js-library-embed), so a miss there is recorded, not excused.
// Prints each case per engine (median fps, longest pause, the script's own time per call), then a RESULT line as JSON.
// Exits 1 on a failure.
//   node scriptfps569.mjs <devtools port> <url>      env: MIN=55 RUNS=3 RETRIES=1 MODES=js,hazel,fumola
const [dport, url0] = process.argv.slice(2);
const MIN = +(process.env.MIN || 55), RUNS = +(process.env.RUNS || 3), RETRIES = +(process.env.RETRIES ?? 1);
const MODES = (process.env.MODES || "js,hazel,fumola").split(",");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const withLogic = (u, m) => { const [base, hash] = u.split("#"); return base.split("?")[0] + "?logic=" + m + (hash ? "#" + hash : ""); };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 600)}`); if (!cond) bad++; };

// In the page: the engine made ready, then a case set up and played while the frames are counted
const READY = `(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
  state.music.mute = true; state.world.at = null; changed();
  if (SCRIPT_LOGIC === "hazel") { await hazelLoad(); for (let i = 0; i < 150 && !(scriptCompile() || {}).ready; i++) await w(100); return !!(scriptCompile() || {}).ready; }
  if (SCRIPT_LOGIC === "fumola") { try { await fumolaLoad(); } catch (e) { return String(e); } for (let i = 0; i < 150 && !(fumolaCompile() || {}).ready; i++) await w(100); return !!(fumolaCompile() || {}).ready; }
  return true; })()`;
const CASE = name => `(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
  const thing = (kind, more) => ({ ...(THING_DEFAULTS[kind] || {}), kind, size: 100, ...more });
  const setUp = {
    trap: () => { for (const k of Object.keys(B)) if (/^castle(Lever|Boulder)[LR]_/.test(k)) delete B[k];
      Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -700, figY: 0, things: [], castleLeverWire3N: "random", castleLeverSeed3N: 42 }); },
    tree: () => Object.assign(B, { kind: "treeroom", houses: 4, inside: 2, figX: -600, figY: 0, things: [] }),
    square: () => Object.assign(B, { kind: "emptyroom", figX: -700, figY: 0, things: [
      thing("trapdoor", { x: -200, z: SCENE.ground + 90, uid: "da", open: false }), thing("trapdoor", { x: 0, z: SCENE.ground + 90, uid: "db", open: true }),
      thing("trapdoor", { x: 200, z: SCENE.ground + 90, uid: "dc", open: true }),
      thing("lever", { x: 300, z: SCENE.ground + 40, works: ["da", "db"], on: false }), thing("lever", { x: 400, z: SCENE.ground + 40, works: ["dc"], on: false, does: "boulder" })] }),
    castle: () => Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -700, figY: 0, things: [], castleLeverWire3N: "normal", castleLeverL_3N: true, castleLeverR_3N: true }),
    world: () => { const at = Object.keys(state.world.cells || {})[0]; if (at) worldEnter(at, null, true); },
  };
  // each case's events, one every so often while the frames are counted (~3 s)
  const steps = {
    trap: ["L", "BL", "R", "BR", "L"].map(p => [600, () => { if (B.kind !== "castleroom") setUp.trap(); roomLeverPull(p); }]),
    tree: [0, 1, 2, 3].map(() => [700, () => roomLeverPull("H")]),
    square: [3, 4, 3, 4].map(i => [700, () => leverPull(i)]),
    castle: Array.from({ length: 12 }, (_, j) => [250, () => { const ds = bgShown.node ? [...bgShown.node.querySelectorAll(".portal[data-pit], .portal[data-to]")] : []; if (ds.length) scriptGo(ds[j % ds.length]); }]),
    world: Array.from({ length: 12 }, (_, j) => [250, () => { const W = state.world, at = W.at || Object.keys(W.cells || {})[0], ds = at ? worldWays(W.cells[at]) : []; if (ds.length) scriptWay(W, ds[j % ds.length]); }]),
  };
  setUp[${JSON.stringify(name)}](); changed(); await w(800);
  const hz = window.__hz, calls0 = hz ? hz.calls : 0, ms0 = hz ? (hz.ms || []).length : 0;
  const gaps = []; let last = 0, on = true;
  const g = t => { if (!on) return; if (last) gaps.push(t - last); last = t; requestAnimationFrame(g); };
  requestAnimationFrame(g); await w(200);
  const t0 = performance.now();
  for (const [gap, f] of steps[${JSON.stringify(name)}]) { f(); await w(gap); }
  await w(300); on = false;
  const s = (performance.now() - t0) / 1000, a = gaps.slice().sort((x, y) => x - y);
  const own = hz && hz.ms ? hz.ms.slice(ms0) : [];
  return JSON.stringify({ fps: +(gaps.length / s).toFixed(1), longest: a.length ? +a[a.length - 1].toFixed(1) : null, frames: gaps.length,
    over50: gaps.filter(x => x > 50).length, calls: hz ? hz.calls - calls0 : null, ownMs: own.length ? +own.sort((x, y) => x - y)[Math.floor(own.length / 2)].toFixed(2) : null });
})()`;

async function inPage(mode, f) {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map(), errs = [];
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
  try {
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: withLogic(url0, mode) }); await sleep(4000);
    for (let i = 0; i < 60 && !(await ev(`typeof roomLeverPull === "function" && typeof scriptGo === "function" && typeof scriptWay === "function"`).catch(() => false)); i++) await sleep(500);
    return await f(ev, errs);
  } finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
}

const CASES = ["trap", "tree", "square", "castle", "world"];
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const result = {};
try {
  for (const mode of MODES) {
    result[mode] = await inPage(mode, async (ev, errs) => {
      const ready = await ev(READY);
      ok(`${mode}: the engine ready`, ready === true, ready);
      const out = {};
      for (const c of CASES) {
        let runs = [];
        for (let tries = 0; tries <= RETRIES; tries++) {
          for (let i = 0; i < RUNS; i++) runs.push(JSON.parse(await ev(CASE(c))));
          if (med(runs.map(r => r.fps)) >= MIN) break;
        }
        const fps = med(runs.map(r => r.fps)), longest = Math.max(...runs.map(r => r.longest || 0));
        out[c] = { fps, longest, runs: runs.length, calls: runs.reduce((s, r) => s + (r.calls || 0), 0), ownMs: med(runs.map(r => r.ownMs).filter(x => x != null)) ?? null };
        ok(`${mode}, ${c}: ${fps} fps (median of ${runs.length}; longest pause ${longest} ms${out[c].ownMs != null ? `, the script ${out[c].ownMs} ms a call` : ""}) >= ${MIN}`, fps >= MIN, runs);
      }
      ok(`${mode}: no page errors`, !errs.length, errs);
      return out;
    });
  }
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
console.log("RESULT " + JSON.stringify({ min: MIN, result }));
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
