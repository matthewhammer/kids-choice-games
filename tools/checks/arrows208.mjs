// (ticket 208, Matthew: the nav arrows shown at once "often overlap each
// other in the corners, like SE corner of this picture", the witch's woods,
// his with ways E to the beach and SE to the C3 crossing)
// First his case: the witch's woods with ways E and SE, the friend stood on
// a grid over the floor's right half. Then every way open in every place
// (one square of each kind; the first world's squares have no E with SE,
// so a check of it alone never saw this): the friend at each way's spot, a
// quarter, half and three quarters of the way between two side by side (E
// and SE, S and SE...), and on a grid over the floor. At three sizes of
// window, and the picture full screen at two: the arrows shown (near, or
// aimed), each its triangle and its words, never overlapping. Counted first
// without the arrows kept apart (waysApart turned off: the overlaps it finds
// show the check can see them), then with. Exits 1 on a failure.
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
// (width, height, the picture full screen)
const SIZES = [[1600, 1000, false], [2400, 1000, false], [1180, 820, false], [2400, 1000, true], [1180, 820, true]];
const label = ([w, h, big]) => `${w}x${h}${big ? " full screen" : ""}`;
// in the page: the friend stood at each spot in turn, the arrows shown counted where any two overlap
const H = `const frames = k => new Promise(r => { const f = () => (--k > 0 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }), B = state.background;
  const rect = el => { const r = [el.querySelector(".way-tri"), el.querySelector(".way-words")].map(e => e.getBoundingClientRect()); return [Math.min(r[0].left, r[1].left), Math.min(r[0].top, r[1].top), Math.max(r[0].right, r[1].right), Math.max(r[0].bottom, r[1].bottom)]; };
  const shownNow = () => [...document.querySelectorAll("#ways .way-arrow")].filter(el => el.classList.contains("near") || el.classList.contains("aimed")).map(el => ({ d: el.dataset.way, r: rect(el) }));
  const overlapping = s => { const o = []; for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) { const a = s[i].r, b = s[j].r;
    if (Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 1 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 1) o.push(s[i].d + " over " + s[j].d); } return o; };
  const grid = (xs, ys, nx, ny) => { const g = []; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) g.push([xs[0] + (xs[1] - xs[0]) * i / (nx - 1), ys[0] + (ys[1] - ys[0]) * j / (ny - 1), "grid"]); return g; };
  const standAt = async ([x, y]) => { B.figX = Math.round(x); B.figY = Math.round(y - SCENE.ground); changed(); await frames(2); };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { state.music.mute = true; window.__apart = waysApart; return 1; })()`);
  const his = {}, all = {};
  for (const size of SIZES) {
    const [w, h, big] = size;
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await ev(`(() => { setBig(${big}, true); return 1; })()`); await sleep(800);
    for (const mode of ["off", "on"]) {
      // his witch's woods: ways E (the beach) and SE (the C3 crossing, its NW opened to meet it)
      his[`${label(size)} ${mode}`] = JSON.parse(await ev(`(async () => { ${H}
        window.waysApart = ${mode === "on" ? "window.__apart" : "() => {}"};
        state.world = clone(DEFAULTS.world); state.world.cells["1,1"].ways = ["E", "SE"]; state.world.cells["2,2"].crossNW = true;
        worldEnter("1,1", null, false); changed(); await frames(3);
        const by = Object.fromEntries(worldWaysAt.map(e => [e[0], e])), out = { ways: Object.keys(by), spots: 0, together: 0, overlaps: [], box: null, at: null };
        if (!by.E || !by.SE) return JSON.stringify(out);
        const pb = pic.getBoundingClientRect(); out.box = [Math.round(pb.width), Math.round(pb.height)];
        // (the floor's right half: from its middle to past E's spot, from E's depth to the bottom)
        for (const s of [[by.E[1], by.E[2], "E"], [by.SE[1], by.SE[2], "SE"], ...grid([0, by.E[1] + 30], [by.E[2], by.SE[2] + 30], 9, 7)]) {
          await standAt(s); out.spots++;
          const sh = shownNow(); if (sh.some(a => a.d === "E") && sh.some(a => a.d === "SE")) out.together++;
          const o = overlapping(sh); if (o.length) { out.overlaps.push(Math.round(s[0]) + "," + Math.round(s[1]) + ": " + o.join(", ")); if (!out.at) out.at = sh.map(a => a.d + "@" + a.r.map(Math.round).join(",")); }
        }
        window.waysApart = window.__apart; return JSON.stringify(out); })()`));
      // every way open in every place, one square of each kind
      all[`${label(size)} ${mode}`] = JSON.parse(await ev(`(async () => { ${H}
        window.waysApart = ${mode === "on" ? "window.__apart" : "() => {}"};
        const W = state.world = clone(DEFAULTS.world), DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"], kinds = new Set(), keys = [];
        for (const [key, c] of Object.entries(W.cells)) {
          if (c.kind === "crossing") for (const d of DIRS) c["cross" + d] = true; else c.ways = DIRS.filter(d => !worldNoWay(c.kind, d));
          if (!kinds.has(c.kind)) { kinds.add(c.kind); keys.push(key); }
        }
        const SIDE = [["N", "NE"], ["NE", "E"], ["E", "SE"], ["SE", "S"], ["S", "SW"], ["SW", "W"], ["W", "NW"], ["NW", "N"]];
        const out = { squares: 0, spots: 0, overlaps: [] };
        for (const key of keys) {
          worldEnter(key, null, false); changed(); await frames(3); out.squares++;
          const by = Object.fromEntries(worldWaysAt.map(e => [e[0], e])), ways = Object.values(by);
          const between = SIDE.filter(([a, b]) => by[a] && by[b]).flatMap(([a, b]) => [0.25, 0.5, 0.75].map(t => [by[a][1] + (by[b][1] - by[a][1]) * t, by[a][2] + (by[b][2] - by[a][2]) * t, a + "+" + b]));
          const xs = ways.map(e => e[1]), ys = ways.map(e => e[2]);
          const spots = [...ways.map(e => [e[1], e[2], e[0]]), ...between, ...(ways.length > 1 ? grid([Math.min(...xs), Math.max(...xs)], [Math.min(...ys), Math.max(...ys)], 5, 4) : [])];
          for (const s of spots) {
            await standAt(s); out.spots++;
            for (const o of overlapping(shownNow())) out.overlaps.push(squareName(key) + " (" + B.kind + ") at " + s[2] + ": " + o);
            if (${mode === "off"} && out.overlaps.length >= 12) break;   // (without them kept apart: enough to show it sees them)
          }
          if (${mode === "off"} && out.overlaps.length >= 12) break;
        }
        window.waysApart = window.__apart; return JSON.stringify(out); })()`));
    }
    await ev(`(() => { setBig(false, true); return 1; })()`);
  }
  for (const [k, v] of Object.entries(his)) console.log(`  his witch's woods, ${k}: ways ${v.ways.join(" ")}, picture ${v.box ? v.box.join("x") : "?"}, ${v.spots} spots, E and SE shown together at ${v.together}, overlapping at ${v.overlaps.length}${v.overlaps.length ? " (" + v.overlaps.slice(0, 3).join("; ") + "; arrows " + v.at.join(" ") + ")" : ""}`);
  for (const [k, v] of Object.entries(all)) console.log(`  every way open, ${k}: ${v.squares} places, ${v.spots} spots, ${v.overlaps.length} overlapping${v.overlaps.length ? " (" + [...new Set(v.overlaps)].slice(0, 6).join("; ") + ")" : ""}`);
  const hisOff = SIZES.reduce((s, z) => s + his[`${label(z)} off`].overlaps.length, 0), allOff = SIZES.reduce((s, z) => s + all[`${label(z)} off`].overlaps.length, 0);
  ok("his witch's woods has both ways, E and SE", SIZES.every(z => ["E", "SE"].every(d => his[`${label(z)} on`].ways.includes(d))), his);
  ok("without the arrows kept apart, the check finds his overlap (E and SE in the witch's woods)", hisOff > 0, hisOff);
  ok("without the arrows kept apart, the check finds overlaps with every way open", allOff > 0, allOff);
  for (const z of SIZES) {
    ok(`${label(z)}: his witch's woods, no arrows shown together overlap`, his[`${label(z)} on`].overlaps.length === 0, his[`${label(z)} on`].overlaps.slice(0, 12));
    ok(`${label(z)}: every way open, no arrows shown together overlap, at any spot in any place`, all[`${label(z)} on`].overlaps.length === 0, [...new Set(all[`${label(z)} on`].overlaps)].slice(0, 12));
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
