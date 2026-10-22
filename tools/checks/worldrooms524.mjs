// (ticket 524, Matthew: "cave room behind water looks good -- but we need to make each room, and its params, available to
// world builder and this one is not dragable -- please re-audit, and fix this one and any others."; "world design panel I
// mean") 🗺️ World design: every place in the palette, the insides too (the cave room among them), one dragged with the mouse
// onto a square is a square (no "is an inside" warning, its own ways and its archway back to the cave); a living room in a
// square keeps its way toward us, out to the house; the places off the grid are chips, one tapped goes there (the cave
// room through its waterfall's square, which stays the square the friend is in), and the card says so (not "Tap a
// square"); ⚙️ this place's settings, opened, shows the cave room's own rows (its floor, its ceiling; not the cave's gems),
// and with ✏️ 📍 only this square a change goes into that square's own settings, another waterfall square keeping the
// template's; a tent in a square, set to tent 2, is tent 2 again after leaving and coming back; and the ⚙️ box closed adds
// no refreshes, open adds some, and settling does not pile them up. Exits 1 on a failure.
//   node worldrooms524.mjs <devtools port> <url>
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
const center = async sel => JSON.parse(await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return "null"; e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return JSON.stringify([r.left + r.width / 2, r.top + r.height / 2]); })()`));
// (both ends measured after both are scrolled to, and the press checked to be
// on what it means: measured apart, the second's scroll moved the first, and
// the drag picked up the square under the palette chip's old spot)
const ends = async (fromSel, toSel) => JSON.parse(await ev(`(() => {
  const f = document.querySelector(${JSON.stringify(fromSel)}), t = ${toSel ? `document.querySelector(${JSON.stringify(toSel)})` : "null"};
  if (!f || (${JSON.stringify(!!toSel)} && !t)) return JSON.stringify({ missing: true });
  if (t) t.scrollIntoView({ block: "nearest" }); f.scrollIntoView({ block: "nearest" });
  const c = e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, a = c(f), b = t ? c(t) : null;
  const on = (p, e) => { const u = document.elementFromPoint(p[0], p[1]); return !!u && (u === e || e.contains(u)); };
  return JSON.stringify({ from: a, to: b, onFrom: on(a, f), onTo: t ? on(b, t) : true });
})()`));
const dragSel = async (what, fromSel, toSel) => {
  const e = await ends(fromSel, toSel);
  if (e.missing || !e.onFrom || !e.onTo) { ok(what + ": both ends on screen", false, e); return false; }
  await mouseDrag(e.from, e.to); return true;
};
const mouseDrag = async (from, to) => {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: from[0], y: from[1] });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: from[0], y: from[1], button: "left", buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 12; i++) { const x = from[0] + (to[0] - from[0]) * i / 12, y = from[1] + (to[1] - from[1]) * i / 12; await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "left", buttons: 1 }); await sleep(25); }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: to[0], y: to[1], button: "left", buttons: 0, clickCount: 1 });
  await sleep(400);
};
const click = async sel => { const c = await center(sel); await send("Input.dispatchMouseEvent", { type: "mousePressed", x: c[0], y: c[1], button: "left", buttons: 1, clickCount: 1 }); await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: c[0], y: c[1], button: "left", buttons: 0, clickCount: 1 }); await sleep(400); };
const world = async () => JSON.parse(await ev(`JSON.stringify({ cols: state.world.cols, cells: Object.fromEntries(Object.entries(state.world.cells).map(([k, c]) => [k, c.kind])), start: state.world.start, at: state.world.at, problems: worldProblems(state.world).map(p => p.text), things: (state.background.things || []).map(t => [t.kind, t.x, t.z]) })`));
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1400, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const settle = `await new Promise(r => setTimeout(r, 500))`;
  await ev(`(async () => { state.music.mute = true; state.world.at = null; worldEnter(worldKeys(state.world).find(k => state.world.cells[k].kind === "waterfall")); tab = TABS.findIndex(t => t[1] === "world"); showTab(); ${settle}; return 1; })()`);
  // (a) the palette: every place but "none", the insides too
  const a = JSON.parse(await ev(`JSON.stringify((() => { const have = [...document.querySelectorAll(".world-palette .world-chip[data-kind]")].map(b => b.dataset.kind);
    return { missing: PLACES.map(p => p[0]).filter(k => k !== "none" && !have.includes(k)), insides: [...INSIDE_KINDS].filter(k => PLACES.some(p => p[0] === k)).every(k => have.includes(k)), cave: have.includes("caveroom") }; })())`));
  ok("(a) every place in the palette, the insides and the cave room among them", !a.missing.length && a.insides && a.cave, a);
  // (b) the cave room dragged onto an empty square with the mouse
  const empty = await ev(`(() => { const W = state.world; for (let r = 0; r < W.rows; r++) for (let c = 0; c < W.cols; c++) if (!W.cells[c + "," + r]) return c + "," + r; return ""; })()`);
  await ev(`(() => { document.querySelector('.world-palette .world-chip[data-kind="caveroom"]').id = "chip-caveroom"; return 1; })()`);
  await dragSel("the cave room chip onto an empty square", "#chip-caveroom", `.world-grid [data-square="${empty}"]`);
  const b = JSON.parse(await ev(`(async () => { const W = state.world, k = ${JSON.stringify(empty)}; const kind = W.cells[k] && W.cells[k].kind; const warn = worldProblems(W).filter(p => /inside/.test(p.text)).map(p => p.text);
    const off = worldOffGrid(W).filter(o => o.kind === "caveroom").length;
    worldEnter(k); ${settle};
    const ways = worldWaysAt.map(w => w[0]), live = worldLiveWays(W, k), back = !!(bgShown.node && bgShown.node.querySelector('.portal[data-to="cave"]'));
    return JSON.stringify({ kind, warn, off, ways, live, back }); })()`));
  ok("(b) the cave room dragged onto a square is a square, no 'inside' warning, not off the grid as well", b.kind === "caveroom" && !b.warn.length && b.off === 0, b);
  ok("(b) in it: its ways out are its arrows, and its archway back to the cave is there", JSON.stringify(b.ways) === JSON.stringify(b.live) && b.back, b);
  const lr = JSON.parse(await ev(`(async () => { const W = state.world, k = ${JSON.stringify(empty)}; worldRemove(k); worldPut(k, "livingroom"); worldEnter(k); ${settle};
    const r = JSON.stringify({ ways: worldWaysAt.map(w => [w[0], w[6] || ""]), portal: !!(bgShown.node && bgShown.node.querySelector('.portal[data-way="S"][data-to]')) }); worldRemove(k); return r; })()`));
  ok("(b) a living room in a square keeps its way toward us, out to its house", lr.ways.some(([d, at]) => d === "S" && /data-to="house"/.test(at)) && lr.portal, lr);
  // (c) the waterfall's square, then its cave room by its chip off the grid
  const wf = await ev(`(async () => { const W = state.world, k = worldKeys(W).find(k => W.cells[k].kind === "waterfall"); worldEnter(k); ${settle}; return k; })()`);
  const chipSel = `.world-off .world-off-chip[data-kind="caveroom"][data-from="${wf}"]`;
  const chips = await ev(`document.querySelectorAll(".world-off .world-off-chip").length`);
  ok("(e) the places off the grid are chips", chips > 3, chips);
  await click(chipSel); await sleep(500);
  const c = JSON.parse(await ev(`JSON.stringify({ at: state.world.at, kind: state.background.kind, inst: instanceOf(state.world), cap: (document.querySelector(".world-here .cap") || {}).textContent || "",
    here: document.querySelector(".world-here").textContent, note: document.querySelector(".world-alert").hidden, back: !!document.querySelector(".world-here .world-to-square"), compass: !!document.querySelector(".world-here .world-compass") })`));
  ok("(c) its chip tapped: in the cave room, the waterfall's square still the friend's", c.kind === "caveroom" && c.at === wf && c.inst === wf, c);
  ok("(c) the card names the square and the inside, with a way back to it and no ways out", /inside/.test(c.cap) && !/Tap a square/.test(c.here) && c.back && !c.compass && c.note, c);
  // ⚙️ opened: the cave room's own rows
  const s0 = await ev(`(async () => { ${settle}; return syncs.length; })()`);
  await click(".world-settings-toggle"); await sleep(600);
  const vis = k => `(() => { const r = document.querySelector('#panel .world-settings .ctl[data-key="${k}"]'); return !!r && !r.hidden && r.getClientRects().length > 0; })()`;
  const s = JSON.parse(await ev(`JSON.stringify({ floor: ${vis("caveFloor")}, ceiling: ${vis("caveCeiling")}, gems: ${vis("caveGems")}, name: document.querySelector(".world-settings").dataset.boxName, n: syncs.length })`));
  ok("(c) ⚙️ opened: the cave room's floor and ceiling, not the cave's gems", s.floor && s.ceiling && !s.gems && /cave room/.test(s.name), s);
  const s1 = await ev(`(async () => { for (let i = 0; i < 5; i++) { changed(); await new Promise(r => setTimeout(r, 120)); } ${settle}; return syncs.length; })()`);
  ok("(g) the ⚙️ box: closed adds nothing, open adds its rows' refreshes, and settling does not pile them up", s.n > s0 && s1 === s.n, { closed: s0, open: s.n, after: s1 });
  // (d) 📍 only this square: a change of the cave room's floor goes into the waterfall square's own
  const d = JSON.parse(await ev(`(async () => { const B = state.background, W = state.world; B.instEdit = "instance"; changed(); ${settle};
    const was = B.caveFloor, btn = [...document.querySelectorAll('#panel .world-settings .ctl[data-key="caveFloor"] button')].find(x => x.getAttribute("aria-pressed") !== "true");
    if (!btn) return JSON.stringify({ nobtn: true }); btn.click(); ${settle};
    const now = B.caveFloor, own = (W.cells[${JSON.stringify(wf)}].own || {}).caveFloor;
    const other = (() => { for (let r = 0; r < W.rows; r++) for (let c = 0; c < W.cols; c++) if (!W.cells[c + "," + r]) return c + "," + r; })();
    worldPut(other, "waterfall"); const otherOwn = (W.cells[other].own || {}).caveFloor; worldRemove(other); B.instEdit = "template"; changed(); ${settle};
    return JSON.stringify({ was, now, own, otherOwn }); })()`));
  ok("(d) with 📍 only this square, the cave room's floor goes into its waterfall square's own settings", !d.nobtn && d.now !== d.was && d.own === d.now && d.otherOwn === undefined, d);
  await click(".world-settings-toggle"); await sleep(600);
  const s2 = await ev(`(async () => { ${settle}; return syncs.length; })()`);
  ok("(g) closed again: the refreshes as before", s2 === s0, { before: s0, again: s2 });
  // (f) a tent in a square: tent 2, gone from and come back to
  const f = JSON.parse(await ev(`(async () => { const W = state.world, B = state.background, k = (() => { for (let r = 0; r < W.rows; r++) for (let c = 0; c < W.cols; c++) if (!W.cells[c + "," + r]) return c + "," + r; })();
    worldPut(k, "tent"); worldEnter(k); ${settle};
    const btn = document.querySelector('.world-here .world-which [data-which="2"]'); if (!btn) return JSON.stringify({ nobtn: true }); btn.click(); ${settle};
    const set = [B.tent, W.cells[k].tent]; worldEnter(${JSON.stringify(wf)}); ${settle}; worldEnter(k); ${settle};
    const r = JSON.stringify({ set, back: B.tent, kind: B.kind }); worldRemove(k); return r; })()`));
  ok("(f) a tent in a square set to tent 2 is tent 2 again after leaving and coming back", !f.nobtn && f.set[0] === 2 && f.set[1] === 2 && f.back === 2 && f.kind === "tent", f);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
