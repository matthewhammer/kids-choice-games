// (ticket 441, Matthew: "collision box for fountain in the castle greenhouse looks off --- I should say -- collision oval") The
// greenhouse fountain's solid is an oval on the floor round its pool: as wide as the basin, its middle where the basin's wall
// meets the floor (its marked footprint), never behind the pool; and a drawing without a footprint keeps its box as before
// (the greenhouse's palms and pots). Exits 1 on a failure.
//   node fountain441.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state.music.mute = true; state.world.at = null;
    const style = (CASTLE_ROOM_CHOICES.find(c => /greenhouse/i.test(c[0] + c[1])) || [])[0];
    Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoomsN: 6, castleRoom6N: style, castleRoom: 6, things: [] }); changed(); await w(500);
    const f = solidsHere().filter(o => o.name === "fountain");
    const pool = [...document.querySelectorAll('#pic [data-obj="fountain"] ellipse')].map(e => ({ cy: +e.getAttribute("cy"), rx: +e.getAttribute("rx"), ry: +e.getAttribute("ry"), fp: e.hasAttribute("data-footprint") }));
    const others = solidsHere().filter(o => /palm|bromeliad|hibiscus/.test(o.name)).length;
    return JSON.stringify({ style, f, pool, others }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  const f = r.f[0], fp = r.pool.find(p => p.fp), rim = r.pool.find(p => !p.fp && p.ry > 20);
  ok("the greenhouse has its fountain, one oval", r.style && r.f.length === 1 && f.oval, r.f);
  ok("the oval as wide as the basin", fp && Math.abs((f.x1 - f.x0) / 2 - fp.rx) < 3, { f, fp });
  ok("its middle where the basin meets the floor, in front of the rim's middle", fp && rim && Math.abs((f.back + f.front) / 2 - fp.cy) < 3 && (f.back + f.front) / 2 > rim.cy, { f, fp, rim });
  ok("the palms, hibiscus and bromeliads keep their boxes", r.others >= 4, r.others);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
