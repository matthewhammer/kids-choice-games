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
// the friend stood near an edge of the clearing, then a direction held on the on-screen controller
const tryEdge = async (place, x, y, buttons) => {
  await ev(`(async () => { state.music.mute = true; state.world = clone(DEFAULTS.world); worldEnter("${place}", null, false); state.body.anim = "none"; climb = null;
    const B = state.background; B.figX = ${x}; B.figY = ${y}; changed(); await new Promise(r => setTimeout(r, 600)); touchWant(true);
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
  const e = await tryEdge("3,3", 300, 40, [15]);
  ok("in the clearing, walked on into its east edge: through its way E, to the castle (E4)", e.t !== null && e.where.startsWith("4,3"), e);
  ok("going through it, facing east, the way they walked, never turned back", e.faced.length > 0 && e.faced.every(f => f === "right"), e);
  const nn = await tryEdge("3,3", 0, -40, [12]);
  ok("in the clearing, walked on into its back limit: through its way N, to the forest path (D3)", nn.t !== null && nn.where.startsWith("3,2"), nn);
  ok("going through it, facing away from us, the way they walked", nn.faced.length > 0 && nn.faced.every(f => f === "back"), nn);
  const c = await tryEdge("3,3", 300, -40, [12, 15]);
  ok("in the clearing, walked on into its far right corner: through NE, or N or E", c.t !== null && ["4,2", "3,2", "4,3"].some(k => c.where.startsWith(k)), c);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
