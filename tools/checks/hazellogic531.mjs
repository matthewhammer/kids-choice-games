// (ticket 531, Matthew: "let's do an experimental PR to dress-up where we try to export as much game logic as possible into the
// Hazel panels for each square (or common logic) --- and do the speedruns again to compare against plain JS") The same pulls, in the
// same rooms, under ?logic=js and ?logic=hazel, each in a fresh page: the game's state after them must be the same, so a speed number
// never comes from broken behaviour. The trap room wired at random (seed 42): red and blue levers, both sides, eight pulls; a tree
// house's trap door and the round room's at the top, three pulls each; a room of placed levers (one swinging two trap doors, one
// dropping rocks into one), five pulls. Compared: the levers, the boulders, the fallen rocks' pits, the hatches, the trap doors'
// open and boulder, the levers' on, and where the friend is (a fall). Under hazel, every pull went through Hazel (__hz.calls), no
// command was unknown, and no pit was said otherwise than drawn (__hz.mismatch). Recorded: each mode's per-event times from __hz.
// Exits 1 on a failure.
//   node hazellogic531.mjs <devtools port> <url>
const [dport, url0] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const withLogic = (u, m) => { const [base, hash] = u.split("#"); return base.split("?")[0] + "?logic=" + m + (hash ? "#" + hash : ""); };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 900)}`); if (!cond) bad++; };
const SCENARIO = `(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, out = { steps: [] };
  state.music.mute = true; state.world.at = null; climb = null;
  if (SCRIPT_LOGIC === "hazel") { await hazelLoad(); for (let i = 0; i < 100 && !(scriptCompile() || {}).ready; i++) await w(100); out.ready = !!(scriptCompile() || {}).ready; }
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
    for (let i = 0; i < 60 && !(await ev(`typeof roomLeverPull === "function" && typeof scriptEvent === "function"`).catch(() => false)); i++) await sleep(500);
    return { ...JSON.parse(await ev(SCENARIO)), errs };
  } finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
}
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const timesOf = (o, side) => Object.entries((o && o[side]) || {}).map(([k, a]) => `${k} n=${a.length} p50 ${q(a, 0.5)} p95 ${q(a, 0.95)} ms`).join("; ");
try {
  const js = await runMode("js"), hz = await runMode("hazel");
  ok("hazel: the shipped program ready", hz.ready === true, hz.ready);
  // (the scenario's pulls: 8 in the trap room, 3 + 3 trap doors, 5 placed levers; 22 here until diag-531 counted 19 in both modes)
  const PULLS = 8 + 3 + 3 + 5;
  ok(`the same number of steps (${PULLS})`, js.steps.length === hz.steps.length && js.steps.length === PULLS, [js.steps.length, hz.steps.length]);
  js.steps.forEach((s, i) => ok(`after ${s.what}: the same state in both modes`, JSON.stringify(s) === JSON.stringify(hz.steps[i]), { js: s, hazel: hz.steps[i] }));
  ok("the trap room's pulls changed something (not a scenario that does nothing)", new Set(js.steps.slice(0, 8).map(s => JSON.stringify(s.keys))).size > 3, js.steps.slice(0, 8).map(s => s.keys));
  ok("js: no pull went through Hazel", !js.hz || js.hz.calls === 0, js.hz && js.hz.calls);
  ok(`hazel: every pull went through Hazel (${PULLS})`, hz.hz && hz.hz.calls === PULLS, hz.hz && hz.hz.calls);
  ok("hazel: no command unknown, no pit said otherwise than drawn", hz.hz && hz.hz.unknown === 0 && hz.hz.mismatch === 0, hz.hz && { unknown: hz.hz.unknown, tags: hz.hz.unknownTags, mismatch: hz.hz.mismatch });
  ok("no page errors", !js.errs.length && !hz.errs.length, [js.errs, hz.errs]);
  console.log(`  js:    ${timesOf(js.hz, "js")}`);
  console.log(`  hazel: ${timesOf(hz.hz, "hazel")}; handler p50 ${q(hz.hz.ms, 0.5)} ms, run p50 ${q(hz.hz.runMs, 0.5)} ms, compile ${hz.hz.compileMs.join(", ")} ms`);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
