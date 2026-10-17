// (ticket 214, Matthew: "all collision directions that correspond to: edge of
// the N 'back wall' (or horizon); E, S or W edges of the screen; Or their
// diagonals, to trigger the enter passage action") With the on-screen
// controller, in the first world: in the clearing (D4), walked on into its
// east edge, the friend goes through its way E, to the castle (E4); into its
// back limit, through its way N, to the forest path (D3); and every outdoor
// place's back limit is below the picture's middle's stand-in (the old
// 60% of the way up), at its ground's far edge; and through an edge they go
// on facing it, not turned back to the doorway's spot. Exits 1 on a failure.
//   node edges214.mjs <devtools port> <url>
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
const until = async (cond, ms = 9000) => { for (let t = 0; t < ms; t += 100) { if (await ev(cond)) return t; await sleep(100); } return null; };
// the friend stood near an edge of a square, then a direction held on the on-screen controller; u, v: where, as
// shares of the picture's width (0 its left) and of the floor's depth (0 the back limit), when x, y are null;
// open: every way out of every square open (a crossing's paths too)
const OPEN = `const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  for (const c of Object.values(state.world.cells)) { if (c.kind === "crossing") for (const d of DIRS) c["cross" + d] = true; else c.ways = DIRS.filter(d => !worldNoWay(c.kind, d)); }`;
const tryEdge = async (place, x, y, buttons, open = false, u = null, v = null) => {
  await ev(`(async () => { state.music.mute = true; state.world = clone(DEFAULTS.world); ${open ? OPEN : ""} worldEnter("${place}", null, false); state.body.anim = "none"; climb = null;
    const B = state.background; changed(); await new Promise(r => setTimeout(r, 300)); const F = sceneFrame, yMin = figYMin(F), yMax = F.bottom - F.ground;
    B.figX = ${x ?? `F.left + ${u} * (F.right - F.left)`}; B.figY = ${y ?? `yMin + ${v} * (yMax - yMin)`}; changed(); await new Promise(r => setTimeout(r, 600)); touchWant(true);
    for (const b of ${JSON.stringify(buttons)}) { const p = touchPad.pad.buttons[b]; p.pressed = true; p.value = 1; } return 1; })()`);
  // (and which way they face as they go through: Matthew, "we are turning and facing away from the edge we are initially going into")
  const r = JSON.parse(await ev(`(async () => { const faced = [], t0 = performance.now();
    while (state.world.at === "${place}" && performance.now() - t0 < 8000) { if (entering) faced.push(state.body.facing); await new Promise(r => setTimeout(r, 40)); }
    const t = state.world.at !== "${place}" ? Math.round(performance.now() - t0) : null;
    for (const p of touchPad.pad.buttons) { p.pressed = false; p.value = 0; } touchWant(false);
    return JSON.stringify({ t, where: state.world.at + ":" + state.background.kind, faced: [...new Set(faced)] }); })()`));
  return r;
};
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const lim = JSON.parse(await ev(`(async () => { const out = {}; state.world.at = null;
    for (const kind of Object.keys(SCENE_FAR)) { Object.assign(state.background, { kind, figX: 0, figY: 40 }); changed(); await new Promise(r => setTimeout(r, 250));
      const F = sceneFrame; out[kind] = { back: Math.round(F.ground + figYMin(F)), stand: Math.round(F.ground + (F.top - F.ground) * 0.6) }; }
    return JSON.stringify(out); })()`));
  const high = Object.entries(lim).filter(([, v]) => !(v.back > v.stand + 20));
  ok("every outdoor place's back limit at its own far edge, well below the old stand-in up in the sky", high.length === 0, high);
  // (Matthew: "should scale the player down more dramatically as they go 'into' the scene (heading N)"; "each picture
  // should have its own setting ... north-ward scaling factor") the 🔭 setting: one for each place, shown in it alone;
  // at its default the mountain trail's far edge well under half the size where they arrive; at 0 the same size anywhere
  const sz = JSON.parse(await ev(`(async () => { const B = state.background; state.world.at = null; Object.assign(B, { kind: "mountains", figX: 0, figY: 0 }); changed();
    await new Promise(r => setTimeout(r, 400)); const F = sceneFrame, back = figYMin(F), at = y => depthSize(B, y);
    const shown = [...document.querySelectorAll("#panel .ctl")].filter(c => /smaller going north/.test(c.textContent) && c.offsetParent).length;
    const r = { keys: NORTH_OUT.every(kd => Number.isFinite(B["north_" + kd])), def: B.north_mountains, back: +at(back).toFixed(2), arrive: +at(0).toFixed(2), shown };
    B.north_mountains = 0; r.flat = [at(back), at(0)].map(v => +v.toFixed(2)); B.north_mountains = northDefault("mountains"); changed(); return JSON.stringify(r); })()`));
  ok("🔭 each outdoor place its own setting, the mountain trail's 40 by default", sz.keys && sz.def === 40, sz);
  ok("at the default, the mountain trail's far edge well under half the size where they arrive", sz.back < 0.5 && sz.arrive === 1, sz);
  ok("at 0, the same size anywhere", sz.flat[0] === 1 && sz.flat[1] === 1, sz);
  const e = await tryEdge("3,3", 300, 40, [15]);
  ok("in the clearing, walked on into its east edge: through its way E, to the castle (E4)", e.t !== null && e.where.startsWith("4,3"), e);
  ok("going through it, facing east, the way they walked, never turned back", e.faced.length > 0 && e.faced.every(f => f === "right"), e);
  const nn = await tryEdge("3,3", 0, -40, [12]);
  ok("in the clearing, walked on into its back limit: through its way N, to the forest path (D3)", nn.t !== null && nn.where.startsWith("3,2"), nn);
  ok("going through it, facing away from us, the way they walked", nn.faced.length > 0 && nn.faced.every(f => f === "back"), nn);
  const c = await tryEdge("3,3", 300, -40, [12, 15]);
  ok("in the clearing, walked on into its far right corner: through NE, or N or E", c.t !== null && ["4,2", "3,2", "4,3"].some(k => c.where.startsWith(k)), c);
  // (Matthew: "if I walk into the corner that I'm facing (NW), I get a path plan to walk N, not NW"; "check each corner
  // passage can be triggered by colliding into that corner, up to some limit like 1/4 of the screen width away from the corner")
  const cross = await ev(`(() => { state.world = clone(DEFAULTS.world); const k = worldKeys(state.world).find(k => state.world.cells[k].kind === "crossing"); return k || null; })()`);
  if (!cross) ok("a forest crossing in the first world, for the corners", false, null);
  else {
    const to = JSON.parse(await ev(`(() => { state.world = clone(DEFAULTS.world); ${OPEN} const o = {};
      for (const d of DIRS) { const nb = worldNeighbour(state.world, "${cross}", d); o[d] = nb.off || !state.world.cells[nb.key] ? null : nb.key; } return JSON.stringify(o); })()`));
    const N = 12, S = 13, W = 14, E = 15;
    for (const [what, u, v, btn, want] of [
      ["the back limit, an eighth of the width from the left", 0.12, 0, [N], "NW"], ["the back limit, an eighth from the right", 0.88, 0, [N], "NE"],
      ["the back limit, in the middle", 0.5, 0, [N], "N"], ["the bottom, a tenth from the left", 0.1, 1, [S], "SW"], ["the bottom, a tenth from the right", 0.9, 1, [S], "SE"],
      ["the left side, near the back", 0, 0.1, [W], "NW"], ["the right side, near the bottom", 1, 0.9, [E], "SE"], ["the left side, in the middle", 0, 0.5, [W], "W"]]) {
      if (!to[want]) { console.log(`  (no ${want} square beside ${cross}: skipped ${what})`); continue; }
      const r = await tryEdge(cross, null, null, btn, true, u, v);
      ok(`in the crossing (${cross}), walked on into ${what}: through ${want}, to ${to[want]}`, r.t !== null && r.where.startsWith(to[want] + ":"), { ...r, want: to[want] });
    }
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
