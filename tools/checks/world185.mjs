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
  ok("the first world: 18 places, no mistakes", first.cells === 18 && first.problems.length === 0, first.problems);
  ok("its insides off the grid, each with an id", first.off.includes("inside 1:" + "witchroom") || first.off.some(o => /^inside \d+:livingroom$/.test(o)), first.off);
  // the tab
  const tab = JSON.parse(await ev(`(async () => { tab = TABS.findIndex(t => t[1] === "world"); showTab(); await new Promise(r => setTimeout(r, 300));
    return JSON.stringify({ squares: document.querySelectorAll(".world-grid > *").length, places: document.querySelectorAll(".world-grid button.world-cell").length, ok: !!document.querySelector(".world-probs") }); })()`));
  ok("the World design tab: 25 squares, 18 places", tab.squares === 25 && tab.places === 18 && tab.ok, tab);
  // into the crossing at B3 (1,2)
  const into = JSON.parse(await ev(`(async () => { document.querySelector('.world-grid [data-square="1,2"]').click(); await new Promise(r => setTimeout(r, 400));
    const B = state.background; return JSON.stringify({ kind: B.kind, at: state.world.at, ways: CROSS_DIRS.map(([d]) => d).filter(d => B["cross" + d]) }); })()`));
  ok("a tap on B3 takes the friend to its forest crossing, with its own paths", into.kind === "crossing" && into.at === "1,2" && into.ways.join() === "N,E,S,W", into);
  const kept = JSON.parse(await ev(`(async () => { const B = state.background; B.things = [...(B.things || []), { kind: "rock", x: 40, z: 370, seed: 7, size: 100, tone: "#a8634a" }]; changed();
    await new Promise(r => setTimeout(r, 200)); const inCell = state.world.cells["1,2"].things.length;
    document.querySelector('.world-grid [data-square="2,2"]').click(); await new Promise(r => setTimeout(r, 300)); const away = state.background.kind;
    document.querySelector('.world-grid [data-square="1,2"]').click(); await new Promise(r => setTimeout(r, 300));
    return JSON.stringify({ inCell, away, back: (state.background.things || []).map(t => t.kind + t.tone) }); })()`));
  ok("a rock put there is kept in its square, and is there again after the pond and back", kept.inCell === 1 && kept.away === "lake" && kept.back.join() === "rock#a8634a", kept);
  const broken = JSON.parse(await ev(`(() => { delete state.world.cells["3,1"]; delete state.world.cells["2,0"]; changed(); return JSON.stringify(worldProblems(state.world).map(p => p.text)); })()`));
  ok("the wood path and the beach taken away: a way into an empty square, and the mountains cut off", broken.some(t => /empty square, D2/.test(t)) && broken.some(t => /mountain/.test(t) && /can't be reached/.test(t)), broken);
  // (Matthew, 2026-10-17: M finds the warnings distracting) hidden unless asked for: how many, near the top; the list and the red squares behind "show warnings"
  const marked = JSON.parse(await ev(`(async () => { await new Promise(r => setTimeout(r, 300));
    const look = () => ({ count: document.querySelector(".world-warn-count").textContent, chip: document.querySelector(".world-warn-chip").textContent,
      red: document.querySelectorAll(".world-grid .world-cell.bad").length, listed: document.querySelector(".world-probs").hidden ? 0 : document.querySelectorAll(".world-probs .world-prob").length,
      aboveGrid: !!(document.querySelector(".world-warn").compareDocumentPosition(document.querySelector(".world-grid")) & Node.DOCUMENT_POSITION_FOLLOWING) });
    const hidden = look(); document.querySelector(".world-warn-chip").click(); await new Promise(r => setTimeout(r, 200));
    const lists = () => ({ at: state.world.at, here: [...document.querySelectorAll(".world-probs-here .world-prob")].map(e => e.textContent), others: document.querySelectorAll(".world-probs-else .world-prob").length });
    const shown = { ...look(), ...lists() };
    document.querySelector('.world-grid [data-square="3,2"]').click(); await new Promise(r => setTimeout(r, 400));
    const clearing = { ...look(), ...lists() }; document.querySelector(".world-warn-chip").click(); await new Promise(r => setTimeout(r, 200));
    return JSON.stringify({ hidden, shown, clearing, again: look(), kept: localStorage.getItem("dress-up-world-warnings") }); })()`));
  const n = broken.length;
  ok("the warnings hidden at first: how many, above the grid, no list, no red squares", marked.hidden.count === `⚠️ ${n} warnings` && marked.hidden.chip === "show warnings" && marked.hidden.red === 0 && marked.hidden.listed === 0 && marked.hidden.aboveGrid, marked.hidden);
  ok("'show warnings': each listed, and the squares they are about red", marked.shown.chip === "hide warnings" && marked.shown.listed === n && marked.shown.red >= 2, marked.shown);
  // (Matthew: a lot of them overwhelm) two lists: the square the friend is in, then the others
  ok("in the crossing at B3, nothing to put right there: every warning under the other squares", marked.shown.at === "1,2" && marked.shown.here.length === 0 && marked.shown.others === n, marked.shown);
  ok("in the clearing at D3: its way N into the empty D2 listed first, as this square's; the rest under the others", marked.clearing.at === "3,2" && marked.clearing.here.length >= 1 && marked.clearing.here.every(t => /D3/.test(t)) && marked.clearing.here.some(t => /empty square, D2/.test(t)) && marked.clearing.here.length + marked.clearing.others === n, marked.clearing);
  ok("and hidden again, which the browser remembers", marked.again.red === 0 && marked.again.listed === 0 && marked.kept === null, { again: marked.again, kept: marked.kept });
  // the ways out, in the picture: from the clearing (D3), E to the castle and back
  const ways = JSON.parse(await ev(`(async () => { state.world = clone(DEFAULTS.world); worldEnter("3,2"); await new Promise(r => setTimeout(r, 500));
    const w = [...document.querySelectorAll("#bg .way-out")]; return JSON.stringify({ ways: w.filter(e => e.dataset.way).map(e => e.dataset.way).sort(), door: w.every(e => e.hasAttribute("data-door")) }); })()`));
  ok("in the clearing, its ways out in the picture: N, NE, E, S, W, each a doorway", ways.ways.join() === "E,N,NE,S,W" && ways.door, ways);
  const walked = JSON.parse(await ev(`(async () => { document.querySelector('#bg [data-way="E"]').dispatchEvent(new MouseEvent("click", { bubbles: true }));
    for (let i = 0; i < 60 && state.world.at === "3,2"; i++) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 300)); const B = state.background;
    return JSON.stringify({ at: state.world.at, kind: B.kind, figX: B.figX, back: !document.getElementById("back").hidden }); })()`));
  ok("through the way E: the castle (E3), come in from its west side, the back chip offered", walked.at === "4,2" && walked.kind === "castle" && walked.figX < -200 && walked.back, walked);
  const back = JSON.parse(await ev(`(async () => { document.getElementById("back").click(); for (let i = 0; i < 60 && state.world.at !== "3,2"; i++) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 300)); return JSON.stringify({ at: state.world.at, kind: state.background.kind }); })()`));
  ok("and the back chip brings them back to the clearing (D3)", back.at === "3,2" && back.kind === "clearing", back);
  const nowhere = JSON.parse(await ev(`(async () => { delete state.world.cells["3,1"]; changed(); await new Promise(r => setTimeout(r, 300));
    const n = [...document.querySelectorAll("#bg .way-out.nowhere")], a = [...document.querySelectorAll("#ways .way-arrow.nowhere")];
    return JSON.stringify({ n: n.length, way: n.map(e => e.dataset.way || null), text: a.map(e => e.textContent).join(" ") }); })()`));
  ok("with the wood path gone, the way N is dimmed, 🚧, and goes nowhere", nowhere.n === 1 && nowhere.way[0] === null && /nowhere/.test(nowhere.text), nowhere);
  // the arrows over the picture: only when the friend is near one; then on top, and their words on the screen
  const near = JSON.parse(await ev(`(async () => { state.world = clone(DEFAULTS.world); worldEnter("3,2"); const B = state.background; B.figX = 0; B.figY = 0; changed(); await new Promise(r => setTimeout(r, 500));
    const shown = () => [...document.querySelectorAll("#ways .way-arrow.near")].map(e => e.dataset.way);
    const middle = shown();
    B.figX = 330; B.figY = 30; changed(); await new Promise(r => setTimeout(r, 500));
    const east = shown(), a = document.querySelector('#ways .way-arrow[data-way="E"]'), r = a.querySelector(".way-tri").getBoundingClientRect(), box = document.getElementById("ways").getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2), w = a.querySelector(".way-words").getBoundingClientRect();
    return JSON.stringify({ middle, east, opacity: getComputedStyle(a).opacity, onTop: !!(top && top.closest && top.closest('.way-arrow[data-way="E"]')),
      wordsInside: w.left >= box.left - 1 && w.right <= box.right + 1 && w.top >= box.top - 1 && w.bottom <= box.bottom + 1, lines: Math.round(w.height / parseFloat(getComputedStyle(a.querySelector(".way-words")).lineHeight)) }); })()`));
  ok("in the middle of the clearing, no arrow shows", near.middle.length === 0, near.middle);
  ok("walked to its east edge: the arrow E shows, on top of everything there, its words on the screen in two lines or more", near.east.join() === "E" && near.opacity === "1" && near.onTop && near.wordsInside && near.lines >= 2, near);
  // (Matthew, 2026-10-17) the ways are on the floor: which is near, and which X takes, is judged by the feet, in depth.
  // His wood path: by the arrow at the bottom, the top one was the one X would take.
  const floor = JSON.parse(await ev(`(async () => { state.world = clone(DEFAULTS.world); worldEnter("3,1"); const B = state.background; padName = "a test controller";
    const at = async (x, y) => { B.figX = x; B.figY = y; changed(); await new Promise(r => setTimeout(r, 500)); measureMarks();
      const t = enterTarget(), aimed = [...document.querySelectorAll("#ways .way-arrow.aimed")].map(e => e.dataset.way);
      return { near: [...document.querySelectorAll("#ways .way-arrow.near")].map(e => e.dataset.way), x: t && t.el.dataset.way || null, aimed, frame: !!document.querySelector("#bg .enter-glow") }; };
    const r = { kind: B.kind, bottom: await at(0, 70), middle: await at(0, 0), far: await at(0, -140), past: await at(0, -250), west: await at(-340, 30) };
    padName = ""; changed(); return JSON.stringify(r); })()`));
  ok("the wood path (D2), feet by the bottom arrow: only S shows, and X takes S, its arrow glowing, no frame in the picture", floor.kind === "woodpath" && floor.bottom.near.join() === "S" && floor.bottom.x === "S" && floor.bottom.aimed.join() === "S" && !floor.bottom.frame, floor.bottom);
  ok("in its middle, no way is near and X takes none", floor.middle.near.length === 0 && floor.middle.x === null && floor.middle.aimed.length === 0, floor.middle);
  ok("walked to the far end of the path: N, and further back still N", floor.far.near.join() === "N" && floor.far.x === "N" && floor.past.near.join() === "N" && floor.past.x === "N", { far: floor.far, past: floor.past });
  ok("at its west side: W", floor.west.near.join() === "W" && floor.west.x === "W", floor.west);
  // (ticket 189, M) a way off the map's edge can't be turned on; an off way that would put a warning right is starred, with the warnings shown
  const m189 = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state.world = clone(DEFAULTS.world); worldEnter("1,0"); tab = TABS.findIndex(t => t[1] === "world"); showTab(); await w(400);
    const btn = d => document.querySelector('.world-ways-out button[data-way="' + d + '"]');
    const edge = ["N", "NE", "NW"].map(d => !!btn(d) && btn(d).disabled), inside = ["E", "S"].map(d => !!btn(d) && !btn(d).disabled);
    btn("N").click(); await w(200); const stillOff = !state.world.cells["1,0"].ways.includes("N");
    // the clearing's way N off: the wood path's way S waits for it
    worldEnter("3,2"); state.world.cells["3,2"].ways = state.world.cells["3,2"].ways.filter(d => d !== "N"); worldWarnShow(false); changed(); await w(400);
    const hidden = !!btn("N") && btn("N").classList.contains("way-suggest");
    document.querySelector(".world-warn-chip").click(); await w(300);
    const shown = !!btn("N") && btn("N").classList.contains("way-suggest"), others = [...document.querySelectorAll(".world-ways-out button.way-suggest")].map(b => b.dataset.way);
    btn("N").click(); await w(300);
    const after = worldProblems(state.world).length; document.querySelector(".world-warn-chip").click(); await w(100);
    return JSON.stringify({ edge, inside, stillOff, hidden, shown, others, after }); })()`));
  ok("at B1 on the top edge: its ways N, NE and NW can't be turned on; E and S can", m189.edge.every(Boolean) && m189.inside.every(Boolean) && m189.stillOff, m189);
  ok("an off way that would put a warning right: starred only with the warnings shown, and on, the warning is gone", !m189.hidden && m189.shown && m189.others.join() === "N" && m189.after === 0, m189);
  // (ticket 191) red where a fix is suggested, not its neighbour; and a way to take away marked ✕ (a way into an empty square)
  const t191 = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state.world = clone(DEFAULTS.world); worldEnter("3,2"); tab = TABS.findIndex(t => t[1] === "world"); showTab(); worldWarnShow(true);
    const btn = d => document.querySelector('.world-ways-out button[data-way="' + d + '"]'), red = () => [...document.querySelectorAll(".world-grid .world-cell.bad")].map(e => e.dataset.square).sort();
    const fixAt = () => worldKeys(state.world).filter(k => { const t = worldWaysToToggle(state.world, k); return t.on.length + t.off.length > 0; }).sort();
    // the clearing's way N off: its own square (turn N on) and the wood path's (or take its S away) are red; nothing else
    state.world.cells["3,2"].ways = state.world.cells["3,2"].ways.filter(d => d !== "N"); changed(); await w(400);
    const noBack = { red: red(), fixAt: fixAt(), starN: !!btn("N") && btn("N").classList.contains("way-suggest") };
    // the wood path taken away: the clearing's way N leads into an empty square: ✕ on it
    state.world = clone(DEFAULTS.world); worldEnter("3,2"); delete state.world.cells["3,1"]; changed(); await w(400);
    const empty = { red: red(), fixAt: fixAt(), dropN: !!btn("N") && btn("N").classList.contains("way-suggest-off"), emptyRed: red().includes("3,1") };
    btn("N").click(); await w(300); const afterN = worldProblems(state.world).filter(p => p.key === "3,2").length;
    worldWarnShow(false); changed(); await w(100);
    return JSON.stringify({ noBack, empty, afterN }); })()`));
  ok("a way with no way back: red on the squares whose ways could put it right (D3 and D2), and those only", t191.noBack.red.join() === t191.noBack.fixAt.join() && t191.noBack.red.join() === "3,1,3,2" && t191.noBack.starN, t191.noBack);
  ok("a way into an empty square: ✕ on it to take it away; red where a fix is, never the empty square", t191.empty.dropN && !t191.empty.emptyRed && t191.empty.red.join() === t191.empty.fixAt.join() && t191.afterN === 0, { ...t191.empty, afterN: t191.afterN });
  // a crossing's dead ends: no trail, no arrow, no mistake (Matthew: a crossing missing a passageway has no trail and no arrow that way)
  const dead = JSON.parse(await ev(`(async () => { state.world = clone(DEFAULTS.world); worldPut("0,0", "crossing"); worldEnter("0,0"); await new Promise(r => setTimeout(r, 400));
    const paths = () => document.querySelectorAll('#bg path[fill="' + CROSS_PATH + '"]').length, arrows = () => document.querySelectorAll("#bg .way-out").length;
    const about = () => worldProblems(state.world).filter(p => p.key === "0,0" || p.to === "0,0").map(p => (p.dir ? "way " : "") + p.text);
    const before = { paths: paths(), arrows: arrows(), mistakes: about() };
    state.world.cells["0,1"].ways.push("N"); changed(); await new Promise(r => setTimeout(r, 400));
    const after = { paths: paths(), arrows: arrows(), way: [...document.querySelectorAll("#bg .way-out")].map(e => e.dataset.way).join(), mistakes: about() };
    return JSON.stringify({ before, after }); })()`));
  // (its dead ends are no mistake; that nothing reaches it is: a square no one can get to)
  ok("a crossing at A1 meeting nothing: no trail, no arrow, and its one warning that nothing reaches it", dead.before.paths === 0 && dead.before.arrows === 0 && dead.before.mistakes.length === 1 && /can't be reached/.test(dead.before.mistakes[0]), dead.before);
  // (0.0.109) the tree room's toy count was "things" too, a number, and lost to the list: one toy, not ten, and its slider broke the picture
  const toys = JSON.parse(await ev(`(async () => { const d = { toys: DEFAULTS.background.toys, list: Array.isArray(DEFAULTS.background.things) };
    const B = state.background; B.kind = "treeroom"; changed(); await new Promise(r => setTimeout(r, 400));
    tab = TABS.findIndex(t => t.some && t.some(x => x === "background" || x === "bg")); if (tab < 0) tab = 0; showTab(); await new Promise(r => setTimeout(r, 300));
    B.toys = 4; changed(); await new Promise(r => setTimeout(r, 400));
    const next = { background: { things: 7, toys: 10 }, world: { cells: { "0,0": { kind: "forest", things: 3 }, "1,0": { kind: "beach" } } } }; upgradeThings(next, { background: { things: 7 } });
    return JSON.stringify({ ...d, things: B.things, drawn: !!document.querySelector("#bg [data-obj]"), up: { toys: next.background.toys, things: next.background.things, cell: next.world.cells["0,0"].things, untouched: !("things" in next.world.cells["1,0"]) } }); })()`));
  ok("the tree room's toys are their own setting (ten at first) and the things list stays a list", toys.toys === 10 && toys.list && Array.isArray(toys.things) && toys.drawn, toys);
  ok("an older save's number of things comes back as toys, its things an empty list; a square never given things left as it was", toys.up.toys === 7 && Array.isArray(toys.up.things) && !toys.up.things.length && Array.isArray(toys.up.cell) && toys.up.untouched, toys.up);
  ok("the cemetery below given a way north: one trail and one arrow, S, and no warning about A1", dead.after.paths === 1 && dead.after.arrows === 1 && dead.after.way === "S" && dead.after.mistakes.length === 0, dead.after);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
