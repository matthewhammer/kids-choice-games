// (ticket 255, Matthew: "ooops -- the letters do not scale large enough in the grid when not full screen. I misread
// them") The 🗺️ World design tab, not full screen: the columns' letters and the rows' numbers shown round the grid, one for
// each column and row, at least 13px; each empty square's own name as big; the grid within the panel, no wider. Prints
// the sizes. Exits 1 on a failure.
//   node grid255.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); state.music.mute = true; state.world = clone(WORLD_DEFAULT);
    tab = TABS.findIndex(t => t[1] === "world"); showTab(); changed(); await w(500);
    const G = document.querySelector("#panel .world-grid"), labs = [...G.querySelectorAll(".world-lab")].filter(l => getComputedStyle(l).display !== "none" && l.textContent.trim());
    const empties = [...G.querySelectorAll(".world-cell.empty")].map(e => parseFloat(getComputedStyle(e).fontSize)), cell = G.querySelector(".world-cell").getBoundingClientRect();
    const P = document.getElementById("panel").getBoundingClientRect(), g = G.getBoundingClientRect();
    return JSON.stringify({ cols: state.world.cols, rows: state.world.rows, labs: labs.map(l => l.textContent.trim()), labFont: labs.length ? parseFloat(getComputedStyle(labs[0]).fontSize) : 0,
      empties, cell: Math.round(cell.width), fits: g.right <= P.right + 1 && g.left >= P.left - 1, wide: [Math.round(g.left), Math.round(g.right), Math.round(P.left), Math.round(P.right)] }); })()`));
  console.log(`  ${r.cols} by ${r.rows}, squares ${r.cell}px: labels ${r.labs.join(" ")} at ${r.labFont}px; empty squares' names at ${[...new Set(r.empties)].join(", ")}px`);
  ok("the letters and numbers round the grid, one for each column and row", r.labs.length === r.cols + r.rows && r.labs.includes("A") && r.labs.includes("1"), r);
  ok("at least 13px", r.labFont >= 13, r);
  ok("each empty square's name as big", r.empties.length > 0 && r.empties.every(f => f >= 13), r);
  ok("the grid within the panel", r.fits, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
