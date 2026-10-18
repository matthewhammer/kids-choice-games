// (ticket 260, Matthew: "Let's use this world design grid as the new default in future releases") A fresh friend's
// world is his grid: 6 by 7, 31 squares, starting at the clearing (3,3), with the things he put in its squares; a save
// still holding the world before it (0.0.183's), untouched, comes back with his; one changed is kept as it was.
// Exits 1 on a failure.
//   node world260.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(() => { const W = DEFAULTS.world, C = W.cells, things = Object.values(C).reduce((a, c) => a + (c.things || []).length, 0);
    const kinds = {}; for (const c of Object.values(C)) kinds[c.kind] = (kinds[c.kind] || 0) + 1;
    // (a save holding 0.0.183's world, untouched; and one with a square changed)
    const old = { world: clone(WORLD_DEFAULT_0183) }; upgradeWorld(old);
    const mine = { world: clone(WORLD_DEFAULT_0183) }; mine.world.cells["3,3"].kind = "forest"; upgradeWorld(mine);
    return JSON.stringify({ cols: W.cols, rows: W.rows, n: Object.keys(C).length, start: W.start, startKind: C[W.start] && C[W.start].kind, things, kinds,
      oldNow: Object.keys(old.world.cells).length, oldSame: JSON.stringify(old.world.cells) === JSON.stringify(C), mineKept: mine.world.cells["3,3"].kind === "forest" && Object.keys(mine.world.cells).length === Object.keys(WORLD_DEFAULT_0183.cells).length }); })()`));
  console.log(`  the default world: ${r.cols} by ${r.rows}, ${r.n} squares, start ${r.start} (${r.startKind}), ${r.things} things put; ${JSON.stringify(r.kinds)}`);
  ok("his grid: 6 by 7, 31 squares, starting at the clearing (3,3), the things he put", r.cols === 6 && r.rows === 7 && r.n === 31 && r.start === "3,3" && r.startKind === "clearing" && r.things > 0, r);
  ok("a save still holding 0.0.183's world, untouched: his grid now", r.oldSame && r.oldNow === 31, r);
  // (0.0.190: A4 and B5 not joined, his fix)
  const ab = JSON.parse(await ev(`JSON.stringify({ a: worldLiveWays(DEFAULTS.world, "0,3"), b: worldLiveWays(DEFAULTS.world, "1,4") })`));
  ok("A4 and B5 not joined (A4 no way SE, B5 no way NW)", !ab.a.includes("SE") && !ab.b.includes("NW"), ab);
  ok("a save whose world was changed: kept as it was", r.mineKept, r);
  // a fresh friend walks his world: the clearing, and a square of deep sea drawn
  const walk = JSON.parse(await ev(`(async () => { state = clone(DEFAULTS); state.music.mute = true; changed(); await new Promise(r => setTimeout(r, 500));
    worldEnter(state.world.start); await new Promise(r => setTimeout(r, 500)); const a = state.background.kind;
    worldEnter("0,0"); await new Promise(r => setTimeout(r, 600)); return JSON.stringify({ a, b: state.background.kind, things: (state.background.things || []).length }); })()`));
  ok("a fresh friend starts in his clearing, and his deep sea (0,0) is drawn with what he put there", walk.a === "clearing" && walk.b === "deepsea" && walk.things > 0, walk);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
