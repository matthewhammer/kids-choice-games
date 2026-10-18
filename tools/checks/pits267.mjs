// (ticket 267, Matthew: "let's limit the pit click hover-over box to have two separate boxes: pit itself (maybe even an
// oval for it) sign above it. the combination is so large, I can't find anywhere else to click on the floor") In the trap
// room: each pit two marks, its hole (as wide as its opening) and its sign above, apart; a spot on the floor beside the
// hole, under the sign's end, in neither; the glow on a hole in its opening's shape (a path, not a box). Exits 1 on a
// failure.
//   node pits267.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null;
    Object.assign(B, { kind: "castleroom", castle: "N", castleLeverL_3N: false, castleLeverR_3N: false, figX: 0, figY: 20, things: [] }); B.castleRoom = castleOf(B).rooms.indexOf("trap") + 1; changed(); await w(600); measureMarks();
    const pits = marks.pics.filter(q => q.kind === "pit"), round = q => [q.x0, q.y0, q.x1, q.y1].map(Math.round);
    const p0 = bgShown.node.querySelector(".portal[data-pit]"), [cx, cy, rx, ry] = p0.dataset.pit.split(" ").map(Number), mine = pits.filter(q => q.el === p0);
    const hole = mine.find(q => q.outline), sign = mine.find(q => !q.outline);
    // (beside the hole, just above its edge, under the sign's end: the floor)
    // (as a hover or a click tests them: the hole by its shape)
    const fx = cx + rx * 0.9, fy = cy - ry * 0.9, inAny = pits.some(q => q.within ? q.within(fx, fy) : fx >= q.x0 && fx <= q.x1 && fy >= q.y0 && fy <= q.y1);
    // (the glow on the hole: as showEnterGlow draws it)
    const shape = hole && /^<path/.test(passFrame(hole.box, false, hole.outline)) ? "path" : "rect";
    return JSON.stringify({ n: pits.length, hole: hole && round(hole), sign: sign && round(sign), pit: [cx - rx, cy - ry, cx + rx, cy + ry].map(Math.round), floor: [Math.round(fx), Math.round(fy)], inAny, shape }); })()`));
  console.log(`  the trap room: ${JSON.stringify(r)}`);
  ok("each pit two marks, its hole and its sign", r.n === 4 && !!r.hole && !!r.sign, r);
  ok("the hole's mark as wide as its opening, the sign's above it, apart", JSON.stringify(r.hole) === JSON.stringify(r.pit) && r.sign[3] <= r.hole[1] + 2, r);
  ok("the floor beside the hole, under the sign's end, in neither mark", !r.inAny, r);
  ok("the glow on a hole in its opening's shape, not a box", r.shape === "path", r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
