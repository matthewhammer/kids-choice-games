// (ticket 290, for N) The bubble room: a place of the 🫧 bubbles kind, with bubble space; its five surfaces each foamed, an
// object each ("foam, back wall" ...), packed bubbles of many sizes (more small ones than big); each surface's foam gone
// when switched off, and a wall's foam lower when its height is lower; the friend kept in by its walls. Exits 1 on a failure.
//   node bubbleroom290.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; delete B.onBridge; delete B.onPlatform;
    Object.assign(B, { kind: "bubbleroom", figX: 0, figY: 40, things: [], foamBack: true, foamBackH: 70, foamLeft: true, foamRight: true, foamFloor: true, foamCeil: true }); changed(); await w(500);
    const objs = () => [...bgShown.node.querySelectorAll("[data-obj]")].map(n => n.getAttribute("data-obj"));
    const sizes = [...bgShown.node.querySelectorAll('[data-obj="foam, back wall"] g > circle:first-child')].map(c => +c.getAttribute("r"));
    const box = () => { const n = bgShown.node.querySelector('[data-obj="foam, back wall"] g[clip-path]'); const b = n && n.getBBox(); return b ? Math.round(b.y) : null; };
    const all = objs(), top70 = box();
    B.foamBackH = 30; changed(); await w(200); const top30 = box();
    B.foamLeft = false; changed(); await w(200); const noLeft = objs();
    B.foamLeft = true; B.foamBackH = 70; changed();
    const group = PLACE_GROUPS.find(g => g[2].includes("bubbleroom")), walls = !!castleWalls(B);
    return JSON.stringify({ all, n: sizes.length, big: sizes.filter(v => v > 20).length, small: sizes.filter(v => v < 8).length, top70, top30, noLeft, group: group && group[0], with: group && group[2], walls }); })()`));
  console.log(`  the bubble room: ${JSON.stringify(r)}`);
  ok("in the 🫧 bubbles kind of place, with bubble space", r.group === "bubbles" && r.with.includes("bubblespace"), r);
  ok("foam on all five surfaces, an object each", ["foam, back wall", "foam, left wall", "foam, right wall", "foam, floor", "foam, ceiling"].every(n => r.all.includes(n)), r);
  ok("packed bubbles of many sizes, more small ones than big", r.n > 100 && r.small > r.big && r.big > 0, r);
  ok("the back wall's foam lower at a lower height", r.top30 > r.top70, r);
  ok("the left wall's foam gone when it is switched off", !r.noLeft.includes("foam, left wall") && r.noLeft.includes("foam, right wall"), r);
  ok("a square room: walls the friend stays inside", r.walls, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
