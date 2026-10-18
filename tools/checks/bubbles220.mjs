// (ticket 220, Matthew) 🫧 bubble space: a place, off the grid (elsewhere);
// its bubbles, as many as set, moving in the room's wind; sticking together
// (bonds) where they touch; one put on the friend pops, and the room keeps its
// number; theme B, switched on, takes turns with A; and the frames a second
// there (GitHub's Chrome: a reading, the gate is the speed run's). Exits 1 on
// a failure.
//   node bubbles220.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1200)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null;
    const place = { inPlaces: PLACES.some(p => p[0] === "bubblespace"), elsewhere: ELSEWHERE.includes("bubblespace"), inPalette: worldPalette().includes("bubblespace") };
    Object.assign(B, { kind: "bubblespace", figX: 0, figY: 70, bubbleCount: 30, bubbleWind: 60, bubbleBOn: false }); changed(); await w(800);
    const layer = document.getElementById("bubble-layer"), count = layer ? layer.childNodes.length : 0, at0 = bubbleSim.list.map(b => [b.x, b.y]);
    await w(2500);
    const moved = bubbleSim.list.filter((b, i) => at0[i] && Math.hypot(b.x - at0[i][0], b.y - at0[i][1]) > 3).length, bonds = bubbleSim.bonds.length;
    // (one put on the friend: it pops, and comes back later)
    const fig = document.getElementById("figure").getBoundingClientRect(), inv = pic.getScreenCTM().inverse(), mid = new DOMPoint(fig.left + fig.width / 2, fig.top + fig.height / 2).matrixTransform(inv);
    // (one not popped already and waiting to come back in, which cannot pop again till it is: bubble 0 often had, drifting
    // into the friend in the wait before)
    // (and let go of its clump: a bond's spring pulled it back off the friend before the pop could be tested)
    const i0 = Math.max(0, bubbleSim.list.findIndex(b => !b.pop && !b.back)), b0 = bubbleSim.list[i0];
    bubbleSim.bonds = bubbleSim.bonds.filter(([p, q]) => p !== i0 && q !== i0); b0.x = mid.x; b0.y = mid.y; b0.vx = b0.vy = 0; await w(150);
    const popped = !!b0.pop; await w(1800); const back = !b0.pop && !b0.back;
    // (theme B on: it takes turns with A)
    B.bubbleBOn = true; changed(); await w(500);
    const colors = [...new Set(bubbleSim.list.map(b => b.th.color))];
    B.bubbleCount = 50; changed(); await w(500); const count50 = document.getElementById("bubble-layer").childNodes.length;
    // (frames a second over two seconds, here)
    let f = 0; const t0 = performance.now(); await new Promise(res => { const tick = () => { f++; performance.now() - t0 < 2000 ? requestAnimationFrame(tick) : res(); }; requestAnimationFrame(tick); });
    return JSON.stringify({ place, count, moved, bonds, popped, back, colors, count50, fps: Math.round(f / ((performance.now() - t0) / 1000)) }); })()`));
  console.log("  bubble space:", JSON.stringify(r));
  ok("bubble space is a place, off the grid (elsewhere), not among the world's squares", r.place.inPlaces && r.place.elsewhere && !r.place.inPalette, r.place);
  ok("as many bubbles as set (30)", r.count === 30, r);
  ok("they move in the room's wind", r.moved >= 20, r);
  ok("touching ones stick together", r.bonds > 0, r);
  ok("one put on the friend pops", r.popped, r);
  ok("and another comes back in, so the room keeps its number", r.back, r);
  ok("theme B, switched on, takes turns with A", r.colors.length === 2, r);
  ok("the number set again (50), so many bubbles", r.count50 === 50, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
