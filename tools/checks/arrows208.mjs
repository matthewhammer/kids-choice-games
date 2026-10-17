// (ticket 208, Matthew: the nav arrows shown at once "often overlap each
// other in the corners, like SE corner of this picture", the witch's woods)
// In every square of the first world, at three sizes of window (a wide one
// as his), the friend stood at each way's spot and halfway between two ways
// side by side (E and SE, S and SE...): the arrows shown (near, or aimed),
// each its triangle and its words, never overlapping. Counted first without
// the arrows kept apart (waysApart turned off: the overlaps it finds show the
// check can see them), then with. Exits 1 on a failure.
//   node arrows208.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1500)}`); if (!cond) bad++; };
const SIZES = [[1600, 1000], [2400, 1000], [1180, 820]];
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { state.music.mute = true; state.world = clone(DEFAULTS.world); window.__apart = waysApart; return 1; })()`);
  const results = {};
  for (const [w, h] of SIZES) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false }); await sleep(800);
    for (const mode of ["off", "on"]) {
      results[`${w}x${h} ${mode}`] = JSON.parse(await ev(`(async () => {
        const frames = k => new Promise(r => { const f = () => (--k > 0 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }), B = state.background;
        window.waysApart = ${mode === "on" ? "window.__apart" : "() => {}"};
        const SIDE = [["E", "SE"], ["E", "NE"], ["S", "SE"], ["S", "SW"], ["W", "SW"], ["W", "NW"], ["N", "NE"], ["N", "NW"], ["NE", "E"], ["SE", "S"]];
        const rect = el => { const r = [el.querySelector(".way-tri"), el.querySelector(".way-words")].map(e => e.getBoundingClientRect()); return [Math.min(r[0].left, r[1].left), Math.min(r[0].top, r[1].top), Math.max(r[0].right, r[1].right), Math.max(r[0].bottom, r[1].bottom)]; };
        const out = { spots: 0, overlaps: [] };
        for (const key of Object.keys(state.world.cells)) {
          worldEnter(key, null, false); changed(); await frames(3);
          const ways = worldWaysAt.map(e => [e[0], e[1], e[2]]), by = Object.fromEntries(ways.map(e => [e[0], e]));
          const spots = [...ways.map(e => [e[1], e[2], e[0]]), ...SIDE.filter(([a, b]) => by[a] && by[b]).map(([a, b]) => [(by[a][1] + by[b][1]) / 2, (by[a][2] + by[b][2]) / 2, a + "+" + b])];
          for (const [x, y, what] of spots) {
            B.figX = Math.round(x); B.figY = Math.round(y - SCENE.ground); changed(); await frames(2); out.spots++;
            const shown = [...document.querySelectorAll("#ways .way-arrow")].filter(el => el.classList.contains("near") || el.classList.contains("aimed")).map(el => ({ d: el.dataset.way, r: rect(el) }));
            for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) { const a = shown[i].r, b = shown[j].r;
              if (Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 1 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 1) out.overlaps.push(squareName(key) + " at " + what + ": " + shown[i].d + " over " + shown[j].d); }
          }
        }
        window.waysApart = window.__apart; return JSON.stringify(out); })()`));
    }
  }
  for (const [k, v] of Object.entries(results)) console.log(`  ${k}: ${v.spots} spots, ${v.overlaps.length} with arrows overlapping${v.overlaps.length ? " (" + [...new Set(v.overlaps)].slice(0, 6).join("; ") + ")" : ""}`);
  const off = SIZES.reduce((s, [w, h]) => s + results[`${w}x${h} off`].overlaps.length, 0);
  ok("without the arrows kept apart, the check finds overlaps (as Matthew saw)", off > 0, off);
  for (const [w, h] of SIZES) ok(`${w}x${h}: no arrows shown together overlap, at any spot in any square`, results[`${w}x${h} on`].overlaps.length === 0, [...new Set(results[`${w}x${h} on`].overlaps)].slice(0, 12));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
