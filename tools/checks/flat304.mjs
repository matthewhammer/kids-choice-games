// (ticket 304) A standing object's collision box is what stands, not what lies flat beside it: the king's chest of gold's
// box ends at the chest (not at the coins spilled to its left), and a rock's and the fountain's at themselves, not their
// shadows. Exits 1 on a failure.
//   node flat304.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; B.things = [];
    const inPic = el => { const M = pic.getScreenCTM().inverse(), q = el.getBoundingClientRect(); return [new DOMPoint(q.left, q.top).matrixTransform(M).x, new DOMPoint(q.right, q.top).matrixTransform(M).x]; };
    B.kind = "castleroom"; B.castle = "N"; B.castleRoom = castleOf(B).rooms.indexOf("king") + 1; B.figX = -2000; changed(); await w(500); draw();
    const chest = solidsHere().find(o => o.name === "chest of gold"), body = inPic(document.querySelector('#bg [data-obj="chest of gold"] rect'));
    const coins = inPic(document.querySelector('#bg [data-obj="chest of gold"] .flat'));
    // (rocks with shadows: each box narrower than its drawing, shadow and all)
    B.kind = "forest"; changed(); await w(500); draw();
    const rocks = solidsHere().filter(o => /^rock/.test(o.name)).map(o => { const g = document.querySelector('#bg [data-obj="' + o.name + '"]'), sh = g && g.querySelector('ellipse[fill="#000"], ellipse[fill="#000000"]');
      return sh ? { name: o.name, box: Math.round(o.x1 - o.x0), all: Math.round(inPic(g)[1] - inPic(g)[0]) } : null; }).filter(Boolean);
    B.figX = 0; changed();
    return JSON.stringify({ chest: [Math.round(chest.x0), Math.round(chest.x1)], body: body.map(Math.round), coins: coins.map(Math.round), rocks }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("the chest of gold's box starts at the chest, not at the coins spilled to its left", r.chest[0] >= r.body[0] - 2 && r.chest[0] > r.coins[0] + 10, r);
  // (a shadow tucked inside a rock's own width changes nothing; one spreading past it no longer widens the box)
  ok("rocks with shadows: no box wider than its drawing, and most narrower (their shadows left out)", r.rocks.length > 0 && r.rocks.every(q => q.box <= q.all + 1) && r.rocks.filter(q => q.box < q.all - 3).length >= r.rocks.length / 2, r.rocks);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
