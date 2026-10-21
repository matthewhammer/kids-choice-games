// (ticket 510) The still picture's churn guard: on a slow computer the scenery is held still (a picture of the place in parts,
// behind and in front of the friend), and a place whose parts keep being made anew (the fairy forest: 20 to 40 screen-size
// pictures in a 4 s walk, 50 frames a second where live it walks at 60) is given up on, its scenery moving again until the
// game is loaded again, where its live drawing is cheap (under 9 ms). Checked, the slow flag set by hand: the fairy forest,
// its live drawing taken as 5 ms, the friend moved about, given up and moving; the lake, its live drawing taken as 20 ms (a
// truly slow computer), moved about the same, still held still; back in the fairy forest from the lake, moving at once (given up for the
// visit); 🧪's forced still (SPEED_TEST.still) never given up; no page errors.
//   node guard510.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background; state.music.mute = true; state.world.at = null;
    const go = async kind => { B.kind = kind; [B.figX, B.figY] = ARRIVE[kind] || [0, 0]; changed(); await w(1200); };
    const roam = async ms => { const x0 = B.figX, y0 = B.figY, t0 = performance.now();
      while (performance.now() - t0 < ms) { const u = (performance.now() - t0) / 1000; B.figX = Math.round(x0 + 200 * Math.sin(u * 1.7)); B.figY = Math.round(y0 - 90 + 90 * Math.cos(u * 1.1)); moved(); await w(33); }
      B.figX = x0; B.figY = y0; moved(true); await w(600); };
    slowFlag = true;
    await go("fairyforest"); const fairyBefore = sceneryStill(); liveDrawAvg = 5; await roam(6000);
    const fairy = { before: fairyBefore, after: sceneryStill(), gaveUp: [...stillGaveUp] };
    await go("lake"); const lakeBefore = sceneryStill(); liveDrawAvg = 20; await roam(6000);
    const lake = { before: lakeBefore, after: sceneryStill(), gaveUp: [...stillGaveUp] };
    await go("fairyforest"); const back = { still: sceneryStill() };
    stillGaveUp.clear(); SPEED_TEST.still = true; await go("fairyforest"); await roam(6000);
    const forced = { still: sceneryStill(), gaveUp: [...stillGaveUp] };
    SPEED_TEST.still = false; slowFlag = false; changed();
    return JSON.stringify({ fairy, lake, back, forced }); })()`));
  ok("the fairy forest, held still at first, moved about: given up, its scenery moving", r.fairy.before && !r.fairy.after && r.fairy.gaveUp.some(g => /^fairyforest/.test(g)), r.fairy);
  ok("the lake, moved about the same: still held still", r.lake.before && r.lake.after && !r.lake.gaveUp.some(g => /^lake/.test(g)), r.lake);
  ok("back in the fairy forest from the lake: moving at once, given up for the visit", !r.back.still, r.back);
  ok("🧪's forced still is never given up", r.forced.still && !r.forced.gaveUp.length, r.forced);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
