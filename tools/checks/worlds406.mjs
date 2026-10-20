// (ticket 406) Many worlds, linked: the first world is "start" (w1); a new world from a template is "world N", or its name;
// a way out of a square linked to a square of another world leads there both ways (walked, with the friend arriving in
// that world), the back chip returns to the world left, a link taken off takes its link back too, a world kept as a
// template copies without its links, a world taken away takes the links into it, the worlds survive a reload, and the
// 🗺️ World design tab's worlds box and links editor make the same links. Exits 1 on a failure.
//   node worlds406.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    state.music.mute = true; worldsInit();
    out.first = { id: state.world.id, title: worldTitle(state.world), n: worldsAll().length, tpls: worldTemplatesAll().map(t => t.id) };
    out.badLinks = [worldLink(undefined, "w1", "0,0"), worldLink("Q", "w1", "0,0")];
    // the first world's first square with a way allowed off the grid that an empty room can come back by
    const W1 = state.world; let from = null, dir = null;
    for (const key of worldKeys(W1)) { const d = Object.keys(WORLD_DIRS).find(d => worldNeighbour(W1, key, d).off && !worldNoWay(W1.cells[key].kind, d) && !worldNoWay("emptyroom", WORLD_OPP[d])); if (d) { from = key; dir = d; break; } }
    const back = WORLD_OPP[dir];
    worldEnter(from); await w(300);
    const fromKind = state.background.kind, before = worldProblems(W1).map(p => p.text);
    worldNew("small"); await w(300);
    out.made = { id: state.world.id, title: worldTitle(state.world), at: state.world.at, kind: state.background.kind, n: worldsAll().length };
    worldSwitch("w1"); await w(300);
    worldNew("first"); state.world.name = "my world"; changed(); await w(300);
    out.named = { id: state.world.id, title: worldTitle(state.world) };
    worldSwitch("w1", from); await w(300);
    out.link = { ok: worldLink(dir, "w2", "1,1"), from, dir };
    const W2 = state.worldsAway.w2;
    out.link.here = W1.cells[from].links; out.link.there = W2.cells["1,1"].links;
    out.link.ways = [worldWays(W1.cells[from]).includes(dir), worldWays(W2.cells["1,1"]).includes(back)];
    out.link.arrow = (worldWaysAt.find(a => a[0] === dir) || [])[5];
    out.link.newProblems = worldProblems(W1).map(p => p.text).filter(t => !before.includes(t)).concat(worldProblems(W2).map(p => p.text));
    // walked out the linked way, then back by the back chip, then out again and back by the way back
    const walk = async d => { const door = document.querySelector('#pic [data-way="' + d + '"]'); if (!door) return false; const t0 = trips.length; worldWalk(door); for (let i = 0; i < 60 && trips.length === t0; i++) await w(150); await w(600); return trips.length > t0; };
    out.walked = await walk(dir);
    out.there = { id: state.world.id, at: state.world.at, kind: state.background.kind, tripFrom: trips.length && trips.at(-1).worldId, backArrow: (worldWaysAt.find(a => a[0] === back) || [])[5] };
    const chip = document.getElementById("back"), t1 = trips.length; if (chip) chip.click(); for (let i = 0; i < 60 && trips.length === t1; i++) await w(150); await w(600);
    out.chipBack = { chip: !!chip, id: state.world.id, at: state.world.at, kind: state.background.kind };
    await walk(dir); out.walkedBack = await walk(back);
    out.wayBack = { id: state.world.id, at: state.world.at, kind: state.background.kind };
    out.fromKind = fromKind;
    // kept as a template: a copy without links
    worldSwitch("w1"); await w(200);
    worldKeepTemplate(); const tpl = worldTemplatesAll().at(-1); out.tpl = tpl && tpl.id;
    worldNew(tpl.id); await w(300);
    out.copy = { id: state.world.id, links: Object.values(state.world.cells).filter(c => c.links && Object.keys(c.links).length).length, cells: Object.keys(state.world.cells).length, of: Object.keys(W1.cells).length };
    // taken away: the copy (w4), then my world (w3); never the last
    out.drop4 = worldDrop(); await w(200);
    worldSwitch("w3"); await w(200); out.drop3 = worldDrop(); await w(200);
    out.left = worldsAll().map(w => w.id);
    // saved: the worlds and the link after a reload
    worldSwitch("w1"); await w(1500);
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("the first world is start (w1), alone, its template first", r.first.id === "w1" && r.first.title === "start" && r.first.n === 1 && r.first.tpls[0] === "first", r.first);
  ok("a link with no compass direction is refused", r.badLinks.every(x => x === false), r.badLinks);
  ok("a new world from the one-square template is world 2, in its empty room", r.made.id === "w2" && r.made.title === "world 2" && r.made.at === "1,1" && r.made.kind === "emptyroom" && r.made.n === 2, r.made);
  ok("a world named is called by its name", r.named.id === "w3" && r.named.title === "my world", r.named);
  ok("a linked way leads there, and the way back leads here, both ways on", r.link.ok && r.link.here[r.link.dir].world === "w2" && r.link.there[{ N: "S", NE: "SW", E: "W", SE: "NW", S: "N", SW: "NE", W: "E", NW: "SE" }[r.link.dir]].world === "w1" && r.link.ways.every(Boolean), r.link);
  ok("its arrow names the other world and its square", /^🌍 world 2: /.test(r.link.arrow || ""), r.link.arrow);
  ok("a link makes no warnings, here or there", !r.link.newProblems.length, r.link.newProblems);
  ok("walked out the linked way, the friend is in world 2's square", r.walked && r.there.id === "w2" && r.there.at === "1,1" && r.there.kind === "emptyroom" && r.there.tripFrom === "w1", r.there);
  ok("there, the way back is named by the world left", /^🌍 start: /.test(r.there.backArrow || ""), r.there.backArrow);
  ok("the back chip returns to the world left, its square", r.chipBack.chip && r.chipBack.id === "w1" && r.chipBack.at === r.link.from && r.chipBack.kind === r.fromKind, r.chipBack);
  ok("walked out and back by the way back, the friend is home", r.walkedBack && r.wayBack.id === "w1" && r.wayBack.at === r.link.from && r.wayBack.kind === r.fromKind, r.wayBack);
  ok("a world kept as a template copies its squares, without its links", r.tpl && r.copy.id === "w4" && r.copy.links === 0 && r.copy.cells === r.copy.of, r.copy);
  ok("worlds taken away are gone, the rest kept", r.drop4 && r.drop3 && JSON.stringify(r.left) === '["w1","w2"]', r.left);
  await send("Page.reload"); await sleep(4000);
  const s = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    state.music.mute = true;
    const from = Object.keys(state.world.cells).find(k => state.world.cells[k].links), L = from && state.world.cells[from].links, d = L && Object.keys(L)[0];
    out.reload = { id: state.world.id, worlds: worldsAll().map(w => w.id), from, link: L && L[d] };
    // taken off: the link back goes too, and the ways that met nothing else
    worldUnlinkAt(state.world, from, d); changed(); await w(200);
    const W2 = worldById("w2");
    out.off = { here: Object.keys(state.world.cells[from].links || {}).length, there: Object.keys(W2.cells["1,1"].links || {}).length, wayThere: worldWays(W2.cells["1,1"]).length };
    // the tab: the worlds box and the links editor
    if (state.world.at !== from) worldEnter(from); await w(300);
    tab = TABS.findIndex(t => t[1] === "world"); showTab(); await w(600);
    out.chips = [...document.querySelectorAll(".world-world")].map(b => b.dataset.world);
    document.querySelector(".world-links-toggle").click(); await w(300);
    const dirB = [...document.querySelectorAll("[data-link-dir]")].find(b => b.dataset.linkDir === d); if (dirB) dirB.click(); await w(200);
    const wB = document.querySelector('[data-link-world="w2"]'); if (wB) wB.click(); await w(200);
    out.mini = document.querySelectorAll(".world-mini-cell").length;
    const cell = document.querySelector('.world-mini-cell[data-link-to="1,1"]'); if (cell) cell.click(); await w(300);
    out.ui = { link: state.world.cells[from].links && state.world.cells[from].links[d], chosen: !!document.querySelector('.world-mini-cell.chosen[data-link-to="1,1"]'), marked: document.querySelectorAll(".world-way.linked").length, listed: document.querySelectorAll(".world-link").length };
    // ➕ new world from the tab, then its chip back
    document.querySelector(".world-new").click(); await w(400);
    out.uiNew = state.world.id; const c1 = document.querySelector('.world-world[data-world="w1"]'); if (c1) c1.click(); await w(400);
    out.uiBack = state.world.id;
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(s)}`);
  ok("after a reload, both worlds and the link are there", s.reload.id === "w1" && JSON.stringify(s.reload.worlds) === '["w1","w2"]' && s.reload.link && s.reload.link.world === "w2" && s.reload.link.key === "1,1", s.reload);
  ok("a link taken off takes its link back, and the way that met nothing else", s.off.here === 0 && s.off.there === 0 && s.off.wayThere === 0, s.off);
  ok("the worlds box has a chip per world", JSON.stringify(s.chips) === '["w1","w2"]', s.chips);
  ok("the links editor draws world 2's grid small, and a tap on a square links it", s.mini === 9 && s.ui.link && s.ui.link.world === "w2" && s.ui.link.key === "1,1" && s.ui.chosen && s.ui.marked >= 1 && s.ui.listed === 1, { mini: s.mini, ...s.ui });
  ok("➕ new world makes one, and a world's chip goes back to it", s.uiNew === "w3" && s.uiBack === "w1", [s.uiNew, s.uiBack]);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
