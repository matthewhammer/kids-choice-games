// (ticket 185, v2) The world designer by hand, with real mouse drags: a
// forest crossing dragged from the palette onto an empty square; that
// square dragged to another, then onto 🗑️; the grid one column wider and
// back; in the clearing's square, its way NE turned off (and the mistake it
// makes listed) and on again; the start moved; a rock dragged from the
// things palette into the picture, standing near where it was let go, and a
// tree tapped in. Exits 1 on a failure.
//   node world2-185.mjs <devtools port> <url>
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
  await ev(`(async () => { state.music.mute = true; state.world = clone(DEFAULTS.world); state.background.kind = "clearing"; state.world.at = null; changed(); tab = TABS.findIndex(t => t[1] === "world"); showTab(); await new Promise(r => setTimeout(r, 400)); return 1; })()`);
  // a crossing from the palette onto E1 (4,0), empty
  const chip = await ev(`(() => { const c = [...document.querySelectorAll(".world-palette .world-chip")].find(b => /forest crossing/.test(b.textContent)); c.id = "chip-crossing"; return 1; })()`);
  await dragSel("the crossing chip onto E1", "#chip-crossing", '.world-grid [data-square="4,0"]');
  let W = await world();
  ok("a forest crossing dragged from the palette onto E1", W.cells["4,0"] === "crossing", W.cells);
  await dragSel("E1 onto A1", '.world-grid [data-square="4,0"]', '.world-grid [data-square="0,0"]');
  W = await world();
  ok("dragged from E1 to A1", W.cells["0,0"] === "crossing" && !W.cells["4,0"], W.cells);
  await dragSel("A1 onto 🗑️", '.world-grid [data-square="0,0"]', ".world-trash");
  W = await world();
  ok("and onto 🗑️: gone", !W.cells["0,0"] && Object.keys(W.cells).length === 18, Object.keys(W.cells).length);
  const sizes = await ev(`(async () => { const b = [...document.querySelectorAll("#panel button, button")].filter(x => /column/.test(x.textContent)); b.find(x => /＋/.test(x.textContent)).click(); await new Promise(r => setTimeout(r, 200)); const wide = state.world.cols;
    [...document.querySelectorAll("button")].find(x => /－ column/.test(x.textContent)).click(); await new Promise(r => setTimeout(r, 200)); return JSON.stringify([wide, state.world.cols]); })()`);
  ok("＋ column, then － column", JSON.parse(sizes).join() === "6,5", sizes);
  // into the clearing's square, its way NE off and on
  await click('.world-grid [data-square="3,2"]');
  W = await world();
  ok("a tap on D3 goes to the clearing", W.at === "3,2", W.at);
  await click('.world-here button[title="NE"]');
  W = await world();
  ok("its way NE off: the fairy forest's way back has nothing to meet", W.problems.some(t => /fairy forest/.test(t) && /no way back|meets/.test(t)), W.problems);
  await click('.world-here button[title="NE"]');
  W = await world();
  ok("and on again: no mistakes", W.problems.length === 0, W.problems);
  await click('.world-grid [data-square="4,2"]');
  await ev(`(() => { [...document.querySelectorAll(".world-here button")].find(b => /start here/.test(b.textContent)).click(); return 1; })()`); await sleep(300);
  W = await world();
  ok("🏁 start here, in the castle's square (E3)", W.start === "4,2", W.start);
  // a rock from the things palette into the picture
  const seen = async () => JSON.parse(await ev(`JSON.stringify({ kind: state.background.kind, at: state.world.at, entering, things: (state.background.things || []).map(t => t.kind), cell: ((state.world.cells[state.world.at] || {}).things || []).map(t => t.kind) })`));
  const rocks = await ev(`(() => { const all = [...document.querySelectorAll("button")].filter(x => /^\\+ 🪨 rock/.test(x.textContent)), b = all.find(x => x.offsetParent); if (b) b.id = "add-rock"; return all.length + " found, " + all.filter(x => x.offsetParent).length + " shown"; })()`);
  const beforeRock = await seen();
  const re = await ends("#add-rock", null);   // (scrolled to first: the picture's point is measured after)
  const target = JSON.parse(await ev(`(() => { const p = new DOMPoint(120, 360).matrixTransform(pic.getScreenCTM()); const u = document.elementFromPoint(p.x, p.y); return JSON.stringify([p.x, p.y, !!(u && u.closest && u.closest("#pic"))]); })()`));
  if (!re.missing && re.onFrom) await mouseDrag(re.from, target.slice(0, 2));
  W = await world();
  const afterRock = { ...(await seen()), rocks, target, press: re };
  const rock = W.things.find(t => t[0] === "rock");
  ok("a rock dragged into the picture stands near where it was let go (120, 360)", rock && Math.abs(rock[1] - 120) < 12 && Math.abs(rock[2] - 360) < 12, { things: W.things, beforeRock, afterRock });
  await ev(`(() => { const b = [...document.querySelectorAll("button")].filter(x => /^\\+ 🌳 tree/.test(x.textContent)).find(x => x.offsetParent); if (b) b.id = "add-tree"; return 1; })()`);
  const te = await ends("#add-tree", null), tc = te.from || [0, 0];
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: tc[0], y: tc[1], button: "left", buttons: 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: tc[0], y: tc[1], button: "left", buttons: 0, clickCount: 1 }); await sleep(400);
  W = await world();
  ok("a tree tapped in", W.things.some(t => t[0] === "tree"), { things: W.things, press: te, now: await seen() });
  const kept = await ev(`JSON.stringify((state.world.cells["4,2"].things || []).map(t => t.kind))`);
  ok("and both kept in the castle's square", JSON.parse(kept).includes("rock") && JSON.parse(kept).includes("tree"), kept);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
