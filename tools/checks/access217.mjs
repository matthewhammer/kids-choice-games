// (ticket 217, Matthew) The ♿ Accessibility tab: every nav arrow shown, the
// far ones dimmer and in their own colour; the arrows' size (and shown
// together, still never overlapping, at twice the size); the words in the
// game bigger; the planned path drawn while the friend walks to a passage,
// and gone when they arrive; and Surprise me leaves it alone. Exits 1 on a
// failure.
//   node access217.mjs <devtools port> <url>
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
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, A = state.access, g = SCENE.ground;
  const frames = k => new Promise(r => { const f = () => (--k > 0 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); });
  const clearing = async () => { state.world = clone(DEFAULTS.world); worldEnter("3,3", null, false); B.figX = 0; B.figY = 0; changed(); await frames(4); };
  const arrows = () => [...document.querySelectorAll("#ways .way-arrow")];
  const rect = el => { const r = [el.querySelector(".way-tri"), el.querySelector(".way-words")].map(e => e.getBoundingClientRect()); return [Math.min(r[0].left, r[1].left), Math.min(r[0].top, r[1].top), Math.max(r[0].right, r[1].right), Math.max(r[0].bottom, r[1].bottom)]; };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { state.music.mute = true; return 1; })()`);
  const tab = JSON.parse(await ev(`(async () => { const t = TABS.find(t => t[1] === "access"); const before = JSON.stringify(state.access);
    for (let i = 0; i < 5; i++) document.getElementById("surprise").click(); await new Promise(r => setTimeout(r, 300));
    return JSON.stringify({ has: !!t, n: t ? t[2].length : 0, same: JSON.stringify(state.access) === before }); })()`));
  ok("a ♿ Accessibility tab with its six settings", tab.has && tab.n === 6, tab);
  ok("Surprise me leaves it alone", tab.same, tab);
  // every arrow shown: off, none far shows; on, all, the far ones dim and coloured
  const all = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access); await clearing();
    const vis = () => arrows().map(el => +getComputedStyle(el).opacity);
    const off = vis(); A.allArrows = true; A.arrowDim = 40; A.arrowColor = "#f472b6"; changed(); await frames(4); await w(400);
    const far = arrows().filter(el => !el.classList.contains("near") && !el.classList.contains("aimed"));
    const r = { n: arrows().length, offShown: off.filter(o => o > 0.05).length, onAlways: arrows().filter(el => el.classList.contains("always")).length,
      farOpacity: far.map(el => +getComputedStyle(el).opacity), farColor: far.map(el => getComputedStyle(el.querySelector(".way-tri"), "::before").backgroundColor) };
    return JSON.stringify(r); })()`));
  ok("off: the far arrows hidden, as before", all.n > 2 && all.offShown === 0, all);
  ok("on: every arrow shown", all.onAlways === all.n, all);
  ok("the far ones at the brightness set (40%)", all.farOpacity.length > 0 && all.farOpacity.every(o => Math.abs(o - 0.4) < 0.06), all);
  ok("in the colour set", all.farColor.length > 0 && all.farColor.every(c => c === "rgb(244, 114, 182)"), all);
  // twice the size, every way open, three windows: shown together, never overlapping
  for (const [W, Ht] of [[1600, 1000], [2400, 1000], [1180, 820]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: W, height: Ht, deviceScaleFactor: 1, mobile: false }); await sleep(600);
    const big = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access, { allArrows: true, arrowSize: 200 });
      state.world = clone(DEFAULTS.world); const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      for (const c of Object.values(state.world.cells)) { if (c.kind === "crossing") for (const d of DIRS) c["cross" + d] = true; else c.ways = DIRS.filter(d => !worldNoWay(c.kind, d)); }
      const over = [], scales = new Set();
      for (const key of ["3,3", "1,1", "2,3"]) { worldEnter(key, null, false); B.figX = 0; B.figY = 0; changed(); await frames(4);
        const s = arrows().map(el => ({ d: el.dataset.way, r: rect(el) })); arrows().forEach(el => scales.add(getComputedStyle(el).scale));
        for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) { const a = s[i].r, b = s[j].r;
          if (Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 1 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 1) over.push(key + ": " + s[i].d + " over " + s[j].d); } }
      return JSON.stringify({ over, scales: [...scales] }); })()`));
    ok(`${W}x${Ht}: arrows at twice the size, every one shown, none over another`, big.over.length === 0 && big.scales.includes("2"), big);
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false }); await sleep(600);
  // the words: a sign in the clearing, bigger
  const font = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access); await clearing();
    const t = bgShown.node.querySelector("text"); if (!t) return JSON.stringify({ none: true }); const h0 = t.getBoundingClientRect().height;
    A.gameFont = 200; changed(); await frames(4); const t2 = bgShown.node.querySelector("text"); const h1 = t2.getBoundingClientRect().height;
    const r = { h0, h1, cls: document.body.classList.contains("game-font") }; A.gameFont = 100; changed(); await frames(3); return JSON.stringify(r); })()`));
  ok("the words in the game at twice the size: a sign's words grow", !font.none && font.cls && font.h1 > 1.6 * font.h0, font);
  // the planned path: shown while walking to a passage, gone after
  const path = JSON.parse(await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access, { showPath: true });
    state.world = clone(DEFAULTS.world); state.world.at = null; Object.assign(B, { kind: "livingroom", figX: -300, figY: 60 }); changed(); await w(450); measureMarks();
    const p = marks.pics.find(q => q.kind === "door" || q.kind === "doorway" || q.kind === "sign") || marks.pics[0]; if (!p) return JSON.stringify({ none: true });
    const from = B.kind; enterScene(p.el); let seen = 0, lines = 0;
    for (let t = 0; t < 4000 && entering; t += 50) { await w(50); const ov = document.querySelector("#ways svg.walk-path"); if (ov) { seen++; lines = Math.max(lines, ov.querySelectorAll("polyline").length); } }
    await w(300); const after = !!document.querySelector("#ways svg.walk-path"); A.showPath = false; changed();
    return JSON.stringify({ seen, lines, after, kind: B.kind, from }); })()`));
  ok("the planned path is drawn while the friend walks to a passage", !path.none && path.seen > 0 && path.lines > 0, path);
  ok("and gone once they are there", !path.after, path);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
