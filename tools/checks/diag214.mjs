// (ticket 214, a diagnostic, never merged) Why two checks fail: passages187's far views (the clearing's castle and
// tree house: standing at their spots, X takes neither) and access217's twice-size arrows (overlapping in 3,3, 1,1,
// 2,3). Prints, does not judge.
//   node diag214.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
const H = `const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, A = state.access;
  const settle = async () => { changed(); await w(400); measureMarks(); };
  const frames = k => new Promise(r => { let i = 0; const f = () => ++i >= k ? r() : requestAnimationFrame(f); requestAnimationFrame(f); });
  const R = el => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map(v => Math.round(v)); };`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // A: the clearing's far views
  console.log("A " + await ev(`(async () => { ${H} state.music.mute = true; state.world = clone(DEFAULTS.world); worldEnter("3,3"); await settle();
    const out = { figYMin: figYMin(sceneFrame), ground: SCENE.ground, back: SCENE.ground + figYMin(sceneFrame), views: [] };
    for (const to of ["castle", "treehouse", "house", "witch"]) {
      const p = marks.pics.find(q => q.el.dataset.to === to && q.kind !== "nav"); if (!p) { out.views.push({ to, none: true }); continue; }
      B.figX = Math.round(p.spot[0]); B.figY = Math.round(p.spot[1] - SCENE.ground); await settle();
      const set = { figX: B.figX, figY: B.figY };
      const all = passesNear(Infinity).slice(0, 4).map(q => ({ kind: q.p.kind, to: q.p.el.dataset.to || q.p.el.dataset.way, n: +q.n.toFixed(3) }));
      const t = enterTarget();
      // and with the feet where walking can take them: at the back limit
      B.figY = Math.max(figYMin(sceneFrame), B.figY); await settle();
      const all2 = passesNear(Infinity).slice(0, 4).map(q => ({ kind: q.p.kind, to: q.p.el.dataset.to || q.p.el.dataset.way, n: +q.n.toFixed(3) }));
      out.views.push({ to, kind: p.kind, spot: p.spot.map(Math.round), set, near: all, target: t ? t.kind + ":" + (t.el.dataset.to || t.el.dataset.way) : null, atLimit: { figY: B.figY, near: all2, target: (enterTarget() || { kind: "-", el: { dataset: {} } }).kind + ":" + ((enterTarget() || { el: { dataset: {} } }).el.dataset.to || "") } });
    }
    return JSON.stringify(out); })()`));
  // B: the twice-size arrows, as access217 sets them, with waysApart's own boxes beside the real ones
  for (const [W, Ht] of [[1600, 1000], [1180, 820]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: W, height: Ht, deviceScaleFactor: 1, mobile: false }); await sleep(600);
    console.log(`B ${W}x${Ht} ` + await ev(`(async () => { ${H} Object.assign(A, DEFAULTS.access, { allArrows: true, arrowSize: 200 });
      state.world = clone(DEFAULTS.world); const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      for (const c of Object.values(state.world.cells)) { if (c.kind === "crossing") for (const d of DIRS) c["cross" + d] = true; else c.ways = DIRS.filter(d => !worldNoWay(c.kind, d)); }
      const out = {};
      for (const key of ["3,3", "1,1", "2,3"]) { worldEnter(key, null, false); B.figX = 0; B.figY = 0; changed(); await frames(4);
        const layer = document.getElementById("ways"), box = layer.getBoundingClientRect();
        out[key] = { box: [Math.round(box.width), Math.round(box.height)], arrows: [...layer.querySelectorAll(".way-arrow")].filter(el => getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden").map(el => {
          const t = el.querySelector(".way-tri"), ww = el.querySelector(".way-words");
          return { d: el.dataset.way, cls: el.className, side: el.dataset.side, at: [el.style.left, el.style.top], words: el.__words, scale: getComputedStyle(el).scale,
                   all: R(el), tri: t ? R(t) : null, text: ww ? R(ww) : null, wordsShown: ww ? getComputedStyle(ww).display : null }; }) }; }
      return JSON.stringify(out); })()`));
  }
  console.log("errors " + JSON.stringify(errs));
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
process.exit(0);
