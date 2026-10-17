// (ticket 218, Matthew: "align the nav arrow for SW with the trail being
// draw, favoring the placement of the nav arrow and moving the trail SW (and
// mirrored in the SE direction)") In a forest crossing with every path open,
// at several windows and full screen: the SW and SE arrows' spots are on
// their trails as drawn (the trail's shape holds the spot), and the old aim
// (at the picture's sides) is shown to have missed them on a wide picture.
// Exits 1 on a failure.
//   node trails218.mjs <devtools port> <url>
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
const SIZES = [[1600, 1000, false], [2400, 1000, false], [1180, 820, false], [390, 844, false], [2400, 1000, true]];
let oldMissed = 0;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { state.music.mute = true; return 1; })()`);
  for (const [W, H, big] of SIZES) {
    await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    await ev(`(() => { setBig(${big}, true); return 1; })()`); await sleep(700);
    const r = JSON.parse(await ev(`(async () => {
      const frames = k => new Promise(r => { const f = () => (--k > 0 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); });
      state.world = clone(DEFAULTS.world); const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      for (const c of Object.values(state.world.cells)) { if (c.kind === "crossing") for (const d of DIRS) c["cross" + d] = true; else c.ways = DIRS.filter(d => !worldNoWay(c.kind, d)); }
      worldEnter("2,2", null, false); changed(); await frames(4);
      const F = sceneFrame, k = (F.bottom - F.top) / 700, G = crossGeom({ x0: F.left, x1: F.right, y1: F.bottom, g: SCENE.ground, W: F.right - F.left, k, pad: 0 });
      const paths = [...bgShown.node.querySelectorAll("path")].filter(p => (p.getAttribute("fill") || "").toLowerCase() === String(CROSS_PATH).toLowerCase());
      const wAt = y => (14 + 190 * Math.max(0, Math.min(1.2, (y - G.far) / (F.bottom + 20 * k - G.far)))) * k;
      const out = {};
      for (const d of ["SW", "SE"]) {
        const a = worldWaysAt.find(e => e[0] === d); if (!a) { out[d] = { none: true }; continue; }
        const [, x, y] = a, on = paths.some(p => p.isPointInFill(new DOMPoint(x, y)));
        const oldEnd = d === "SW" ? [F.left, F.bottom + 60 * k] : [F.right, F.bottom + 60 * k], oldX = oldEnd[0] * (y - G.cy) / (oldEnd[1] - G.cy);
        out[d] = { on, oldOff: Math.round(Math.abs(oldX - x)), half: Math.round(wAt(y) / 2) };
      }
      return JSON.stringify(out); })()`));
    for (const d of ["SW", "SE"]) {
      const v = r[d];
      if (v && !v.none && v.oldOff > v.half) oldMissed++;
      ok(`${W}x${H}${big ? " full screen" : ""}: the ${d} arrow's spot is on its trail as drawn`, v && !v.none && v.on, v);
    }
    await ev(`(() => { setBig(false, true); return 1; })()`);
  }
  ok("the old aim, at the sides, missed the arrows somewhere (the check sees Matthew's case)", oldMissed > 0, { oldMissed });
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
