// (ticket 313, Matthew: "the nav arrows as objects are often still overlapped in terms of their bounding boxes -- maybe we should space
// them further still, on each background?" "especially SE and E, and SW and W nav arrows") Every place, all eight ways open, at nine
// picture shapes (as the window's, 1.6 times wider, 0.8 times; each with the floor as deep, half as deep, twice as deep): the arrows'
// triangles as the picture has them (wayTriBox, turned to their angles), no two boxes overlapping, E and W within the picture. Counted
// first without the spacing (waysSpaced turned off: the problems it finds, overlaps, or E and W off the picture's foot where the floor
// is shallow, as GitHub's 1600x1000 has it, show the check can see them), then with. Exits 1 on a failure.
//   node spaced313.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(() => { state = clone(DEFAULTS); state.music.mute = true; changed();
    const ALL = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"], kinds = PLACES.map(p => p[0]), L0 = worldLiveWays, sp0 = waysSpaced; worldLiveWays = () => ALL;
    const ov = (a, b) => Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 0 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 0;
    const F = sceneFrame, G0 = SCENE.ground, frames = []; for (const wk of [1, 1.6, 0.8]) for (const hk of [1, 0.5, 2]) frames.push([F.left * wk, F.top, G0 + (F.bottom - G0) * hk]);
    const run = spaced => { const bad = [], moved = []; let pairs = 0;
      for (const [left, top, bottom] of frames) for (const kind of kinds) {
        const W0 = state.world; state.world = { ...clone(W0), at: "zz", cells: { ...W0.cells, zz: { kind } } };
        if (!spaced) waysSpaced = AT => AT;
        try { worldWaysSvg({ ...state.background, kind }, left, top, -left, bottom, SCENE.ground); } catch (e) { bad.push(kind + " threw " + e); }
        waysSpaced = sp0; state.world = W0;
        const k = (bottom - top) / 700, bx = Object.fromEntries(worldWaysAt.map(([d, x, y, a]) => [d, wayTriBox(x, y, a, k)]));
        for (let i = 0; i < ALL.length; i++) for (let j = i + 1; j < ALL.length; j++) { pairs++; if (ov(bx[ALL[i]], bx[ALL[j]])) bad.push(kind + " " + ALL[i] + "/" + ALL[j] + " at " + Math.round(-2 * left) + " wide, the floor " + Math.round(bottom - G0) + " deep"); }
        // (E and W still on their side of the picture, between its top and bottom)
        for (const d of ["E", "W"]) { const b = bx[d]; if (!(b[1] > top && b[3] < bottom)) moved.push(kind + " " + d + " off the picture at " + Math.round(-2 * left) + " wide, the floor " + Math.round(bottom - G0) + " deep"); }
      }
      return { pairs, overlaps: bad.length, bad: bad.slice(0, 20), offs: moved.length, off: moved.slice(0, 10) }; };
    const out = { before: run(false), after: run(true) };
    worldLiveWays = L0; state = clone(DEFAULTS); changed(); return JSON.stringify(out); })()`));
  console.log("  before: " + JSON.stringify(r.before).slice(0, 600));
  console.log("  after:  " + JSON.stringify(r.after).slice(0, 600));
  ok("the check sees problems without the spacing (overlaps, or E and W off the picture)", r.before.overlaps > 0 || r.before.offs > 0, r.before);
  ok("with it, no two arrows' boxes overlap, in any place, at any of the nine shapes", r.after.overlaps === 0, r.after.bad);
  ok("E and W stay within the picture's height", r.after.off.length === 0, r.after.off);
  ok("no error thrown", errs.length === 0, errs);
} catch (e) { ok("ran", false, String(e)); }
process.exit(bad ? 1 : 0);
