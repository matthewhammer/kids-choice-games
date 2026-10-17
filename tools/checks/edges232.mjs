// (ticket 232, Matthew: "'all passageways' does not respect the edge of the grid ... and it introduces issues that can
// be avoided", with E6's fairy forest red, its way SW off the bottom) No way out of a square leads off the map's edge:
// a place put on the grid keeps only its usual ways that stay on it; a square moved to an edge, or along a grid made
// smaller, loses the ways off it; and 🔗 all passageways takes away any left from before (saying how many), leaving no
// warning of a way off the map. A forest crossing's dead-end paths stay its own look. Exits 1 on a failure.
//   node edges232.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 800)}`); if (!cond) bad++; };
// (in the page: the ways of a square that lead off the map, and the warnings that say so)
const H = `const W = () => state.world, off = key => { const c = W().cells[key]; return c ? worldWays(c).filter(d => worldOffMap(W(), key, d)) : null; };
  const offWarn = () => worldProblems(W()).filter(p => /off the map/.test(p.text)).map(p => p.text);`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { ${H} state.music.mute = true; state.world = clone(DEFAULTS.world); changed(); const out = {};
    // his case: a fairy forest put in E6, the grid's bottom right corner
    out.usual = worldUsualWays("fairyforest");
    worldPut("4,5", "fairyforest"); out.put = { ways: worldWays(W().cells["4,5"]), off: off("4,5"), warn: offWarn() };
    // a square moved into a corner: the castle (E4) to A6
    worldMove("4,3", "0,5"); out.moved = { kind: W().cells["0,5"].kind, ways: worldWays(W().cells["0,5"]), off: off("0,5") };
    // a grid made smaller: a column more, a way east into it from E1 (open water), the column taken away again
    state.world = clone(DEFAULTS.world); worldResize(1, 0); const e1 = W().cells["4,0"]; e1.ways = [...new Set([...e1.ways, "E"])]; out.wide = { cols: W().cols, off: off("4,0") };
    worldResize(-1, 0); out.narrow = { cols: W().cols, ways: worldWays(W().cells["4,0"]), off: off("4,0") };
    // a world from before, with a way off the map: 🔗 all passageways takes it away and says so
    state.world = clone(DEFAULTS.world); W().cells["4,5"] = { kind: "fairyforest", ways: ["N", "NW", "SW", "SE", "E"], things: [] }; changed();
    out.before = { off: off("4,5"), warn: offWarn().length };
    tab = TABS.findIndex(t => t[1] === "world"); showTab(); await new Promise(r => setTimeout(r, 300));
    const btn = [...document.querySelectorAll("#panel button")].find(b => /all passageways/.test(b.textContent)); btn.click(); await new Promise(r => setTimeout(r, 300));
    out.after = { off: off("4,5"), warn: offWarn(), note: btn.nextElementSibling ? btn.nextElementSibling.textContent : null };
    // a crossing's dead ends stay its look: one put in A1, its paths N and W off the map, kept and not warned of
    state.world = clone(DEFAULTS.world); worldPut("0,0", "crossing"); const cr = W().cells["0,0"]; cr.crossN = true; cr.crossW = true; worldTrimEdges(W());
    out.crossing = { N: cr.crossN, W: cr.crossW, warn: offWarn().length };
    return JSON.stringify(out); })()`));
  ok("E6's fairy forest, put on the grid: none of its ways off the edge, and no warning of one", r.put.off.length === 0 && r.put.warn.length === 0 && r.put.ways.length > 0, r.put);
  ok("(its usual ways had some that would have gone off there)", r.usual.some(d => ["SW", "S", "SE", "E", "NE"].includes(d)), r.usual);
  ok("the castle moved into the bottom left corner: none of its ways off the edge", r.moved.kind === "castle" && r.moved.off.length === 0, r.moved);
  ok("a way east into a new column, the column taken away again: the way is gone with it", r.wide.cols === 6 && r.wide.off.length === 0 && r.narrow.cols === 5 && !r.narrow.ways.includes("E") && r.narrow.off.length === 0, { wide: r.wide, narrow: r.narrow });
  ok("🔗 all passageways: a way off the map left from before is taken away, and the note says so", r.before.off.length > 0 && r.after.off.length === 0 && r.after.warn.length === 0 && /off the edge taken away/.test(r.after.note || ""), { before: r.before, after: r.after });
  ok("a forest crossing's paths off the edge stay (dead ends, not drawn), with no warning", r.crossing.N && r.crossing.W && r.crossing.warn === 0, r.crossing);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
