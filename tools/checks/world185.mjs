// (ticket 185) The world on its grid: the first world has no mistakes and
// its insides off the grid with ids; the 🗺️ World design tab draws a square
// per cell; a tap on a forest crossing's square takes the friend there with
// its own paths; a rock put there stays in its square after going elsewhere
// and back; taking the wood path away gives the mistakes it should (a way to
// an empty square; the mountains cut off). Exits 1 on a failure.
//   node world185.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 500)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const first = JSON.parse(await ev(`(() => { state.music.mute = true; state.world = clone(DEFAULTS.world); changed();
    return JSON.stringify({ cells: Object.keys(state.world.cells).length, problems: worldProblems(state.world).map(p => p.text), off: worldOffGrid(state.world).map(o => o.id + ":" + o.kind) }); })()`));
  ok("the first world: 17 places, no mistakes", first.cells === 17 && first.problems.length === 0, first.problems);
  ok("its insides off the grid, each with an id", first.off.includes("inside 1:" + "witchroom") || first.off.some(o => /^inside \d+:livingroom$/.test(o)), first.off);
  // the tab
  const tab = JSON.parse(await ev(`(async () => { tab = TABS.findIndex(t => t[1] === "world"); showTab(); await new Promise(r => setTimeout(r, 300));
    return JSON.stringify({ squares: document.querySelectorAll(".world-grid > *").length, places: document.querySelectorAll(".world-grid button.world-cell").length, ok: !!document.querySelector(".world-probs") }); })()`));
  ok("the World design tab: 25 squares, 17 places", tab.squares === 25 && tab.places === 17 && tab.ok, tab);
  // into the crossing at B3 (1,2)
  const into = JSON.parse(await ev(`(async () => { document.querySelector('.world-grid [data-square="1,2"]').click(); await new Promise(r => setTimeout(r, 400));
    const B = state.background; return JSON.stringify({ kind: B.kind, at: state.world.at, ways: CROSS_DIRS.map(([d]) => d).filter(d => B["cross" + d]) }); })()`));
  ok("a tap on B3 takes the friend to its forest crossing, with its own paths", into.kind === "crossing" && into.at === "1,2" && into.ways.join() === "N,E,S,W", into);
  const kept = JSON.parse(await ev(`(async () => { const B = state.background; B.things = [...(B.things || []), { kind: "rock", x: 40, z: 370, seed: 7, size: 100, tone: "#a8634a" }]; changed();
    await new Promise(r => setTimeout(r, 200)); const inCell = state.world.cells["1,2"].things.length;
    document.querySelector('.world-grid [data-square="2,2"]').click(); await new Promise(r => setTimeout(r, 300)); const away = state.background.kind;
    document.querySelector('.world-grid [data-square="1,2"]').click(); await new Promise(r => setTimeout(r, 300));
    return JSON.stringify({ inCell, away, back: (state.background.things || []).map(t => t.kind + t.tone) }); })()`));
  ok("a rock put there is kept in its square, and is there again after the clearing and back", kept.inCell === 1 && kept.away === "clearing" && kept.back.join() === "rock#a8634a", kept);
  const broken = JSON.parse(await ev(`(() => { delete state.world.cells["2,1"]; changed(); return JSON.stringify(worldProblems(state.world).map(p => p.text)); })()`));
  ok("the wood path taken away: a way into an empty square, and the mountains cut off", broken.some(t => /empty square, C2/.test(t)) && broken.some(t => /mountain/.test(t) && /can't be reached/.test(t)), broken);
  const marked = await ev(`(async () => { await new Promise(r => setTimeout(r, 300)); return document.querySelectorAll(".world-grid .world-cell.bad").length; })()`);
  ok("and the squares the mistakes are about are marked", marked >= 2, marked);
  // the ways out, in the picture: from the clearing (C3), E to the castle and back
  const ways = JSON.parse(await ev(`(async () => { state.world = clone(DEFAULTS.world); worldEnter("2,2"); await new Promise(r => setTimeout(r, 500));
    const w = [...document.querySelectorAll("#bg .way-out")]; return JSON.stringify({ ways: w.filter(e => e.dataset.way).map(e => e.dataset.way).sort(), door: w.every(e => e.hasAttribute("data-door")) }); })()`));
  ok("in the clearing, its ways out in the picture: N, NE, E, S, W, each a doorway", ways.ways.join() === "E,N,NE,S,W" && ways.door, ways);
  const walked = JSON.parse(await ev(`(async () => { document.querySelector('#bg [data-way="E"]').dispatchEvent(new MouseEvent("click", { bubbles: true }));
    for (let i = 0; i < 60 && state.world.at === "2,2"; i++) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 300)); const B = state.background;
    return JSON.stringify({ at: state.world.at, kind: B.kind, figX: B.figX, back: !document.getElementById("back").hidden }); })()`));
  ok("through the way E: the castle (D3), come in from its west side, the back chip offered", walked.at === "3,2" && walked.kind === "castle" && walked.figX < -200 && walked.back, walked);
  const back = JSON.parse(await ev(`(async () => { document.getElementById("back").click(); for (let i = 0; i < 60 && state.world.at !== "2,2"; i++) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 300)); return JSON.stringify({ at: state.world.at, kind: state.background.kind }); })()`));
  ok("and the back chip brings them back to the clearing (C3)", back.at === "2,2" && back.kind === "clearing", back);
  const nowhere = JSON.parse(await ev(`(async () => { delete state.world.cells["2,1"]; changed(); await new Promise(r => setTimeout(r, 300));
    const n = [...document.querySelectorAll("#bg .way-out.nowhere")]; return JSON.stringify({ n: n.length, way: n.map(e => e.dataset.way || null), text: n.map(e => e.textContent).join(" ") }); })()`));
  ok("with the wood path gone, the way N is dimmed, 🚧, and goes nowhere", nowhere.n === 1 && nowhere.way[0] === null && /nowhere/.test(nowhere.text), nowhere);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
