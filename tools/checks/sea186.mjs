// (ticket 186, Matthew) Open water, a new place, and a row of it along the
// first world's top edge, beyond the beach: the beach's way N leads to it,
// the friend swims anywhere in it, and its squares join along the row and
// down to the beach. Exits 1 on a failure.
//   node sea186.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 700)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; // (ticket 260: the first world, 0.0.183's, since Matthew's is the default)
    state.world = clone(WORLD_DEFAULT_0183); worldChoose(B.kind); changed();
    const row = [0, 1, 2, 3, 4].map(c => state.world.cells[c + ",0"] && state.world.cells[c + ",0"].kind);
    worldEnter("2,1"); await w(400); const beachWays = worldLiveWays(state.world, "2,1"), toSea = (worldWaysAt.find(e => e[0] === "N") || [])[4];
    worldEnter("2,0"); await w(500);
    const drawn = !!document.querySelector("#bg") && document.querySelector("#bg").innerHTML.length > 2000;
    const spots = [[0, 0], [-300, 60], [250, -150], [0, 80]].map(([x, y]) => { B.figX = x; B.figY = y; return inWater(B, x, SCENE.ground + y); });
    B.figX = 0; B.figY = 0; changed(); await w(200);
    return JSON.stringify({ row, beachWays, toSea: toSea ? toSea.kind : null, kind: B.kind, drawn, spots, seaWays: worldLiveWays(state.world, "2,0"), name: worldName(state.world, "2,0"), problems: worldProblems(state.world).length }); })()`));
  ok("the first world's top row: five squares of open water", r.row.every(k => k === "sea"), r.row);
  ok("the beach (C2): its way N goes to the open water above it", r.beachWays.includes("N") && r.toSea === "sea", r);
  ok("in the open water (C1): drawn, and water wherever the friend is", r.kind === "sea" && r.drawn && r.spots.every(Boolean), r);
  ok("its ways: along the row, and down to the beach; no warnings in the first world", r.seaWays.join() === "E,S,W" && r.problems === 0, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
