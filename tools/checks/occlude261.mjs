// (ticket 261, Matthew: "looks like we are wasting time drawing flowers behind the tree house tree? Can we do an audit,
// long run tagged ticket, minted now: check to see if we are drawing totally occluded objects -- remove them from the
// scene if they are more than 75% occluded (rough approx is fine).") Every place at its defaults (and the tree house at
// its busiest): each drawing ♿ 🧩 boxes (its objects, and its plants by the procedure that drew them) sampled at points
// over its box on the screen; at each point where it is painted, is it the topmost thing there, or is something drawn
// after it over it (the friend and the placed things out of the way; a see-through layer, under 60% opaque, not counted
// as covering). A drawing painted at enough points and more than 75% covered is listed, with what covers it.
// Since 0.0.198 the scenes leave out what their outlines say is hidden (seenOnly); what is left is listed, and each
// place has a budget, its count then (BUDGET, a little over for the sampling's noise): exits 1 when a place goes over
// it, a new drawing drawn where it is not seen (or on a page error).
//   node occlude261.mjs <devtools port> <url> [kind ...]
const [dport, url, ...only] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
// (each place's count of drawings more than 75% hidden at 0.0.198, after ticket 261's culling; 4 more allowed)
const BUDGET = { forest: 15, underwater: 2, witch: 12, lake: 4, house: 12, treehouse: 63, livingroom: 15, clearing: 37, fairyforest: 10, mountains: 8,
                 waterfall: 4, campsite: 1, woodpath: 14, crossing: 7, castle: 45, castleroom: 0, "the greenhouse": 35, "treehouse at its busiest": 64 }, SLACK = 4;
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1500)}`); if (!cond) bad++; };
const MEASURE = `async (setup) => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
  state.music.mute = true; state.world.at = null; state.access.showMadeOf = false; state.access.showSolids = false;
  Object.assign(B, setup, { things: [] }); changed(); await w(400); changed(); await w(300);
  const node = bgShown.node, fig = document.getElementById("figure"), t0 = performance.now();
  const st = document.createElement("style"); st.textContent = "#pic, #pic * { pointer-events: visiblePainted !important; } #figure, #access-layer { display: none !important; }";
  document.head.append(st); await w(50);
  const SHAPE = /^(path|rect|circle|ellipse|polygon|polyline|line|use|image|text)$/i, alpha = new Map();
  // (how opaque a shape is drawn: its opacities and its fill's, through its groups up to the background)
  const opaque = el => { if (alpha.has(el)) return alpha.get(el); let a = 1;
    for (let e = el; e && e !== node; e = e.parentElement) { const cs = getComputedStyle(e); a *= +cs.opacity; }
    const cs = getComputedStyle(el); if (cs.fill === "none") a *= +cs.strokeOpacity; else a *= +cs.fillOpacity;
    // (a gradient: as opaque as its most opaque stop; a layer blended into what is under it (multiply, screen) is see-through)
    const paint = cs.fill === "none" ? cs.stroke : cs.fill, u = /url\\(["']?#([^"')]+)/.exec(paint);
    if (u) { let g = document.getElementById(u[1]), stops = [];
      for (let i = 0; g && i < 4 && !stops.length; i++) { stops = [...g.querySelectorAll("stop")]; if (!stops.length) { const h = g.getAttribute("href") || g.getAttribute("xlink:href"); g = h ? document.getElementById(h.slice(1)) : null; } }
      if (stops.length) a *= Math.max(...stops.map(st => { const c = getComputedStyle(st), m = /rgba\\([^)]*,\\s*([\\d.]+)\\)/.exec(c.stopColor); return +c.stopOpacity * (m ? +m[1] : 1); })); }
    for (let e = el; e && e !== node; e = e.parentElement) if (getComputedStyle(e).mixBlendMode !== "normal") { a = 0; break; }
    alpha.set(el, a); return a; };
  const nameOf = el => { const p = el.closest("[data-proc]"), o = el.closest("[data-obj]");
    return (p && node.contains(p) ? p.dataset.proc : "") + (o && node.contains(o) ? (p ? " in " : "") + o.dataset.obj : "") || (el.tagName + (el.id ? "#" + el.id : "")); };
  const L = pic.getBoundingClientRect();
  const drawings = [...bgShown.objs.map(o => ({ el: o.node, name: o.name, obj: true })),
    ...[...node.querySelectorAll("[data-proc], use")].filter(el => !el.closest("defs, clipPath, mask, pattern, symbol"))
      .map(el => ({ el, name: el.tagName.toLowerCase() === "use" ? useProc(el) : el.dataset.proc })).filter(d => d.name && PROC_CAT[d.name])];
  const out = [];
  for (const d of drawings) {
    const r = d.el.getBoundingClientRect(), x0 = Math.max(r.left, L.left), x1 = Math.min(r.right, L.right), y0 = Math.max(r.top, L.top), y1 = Math.min(r.bottom, L.bottom);
    if (x1 - x0 < 2 || y1 - y0 < 2) continue;
    let painted = 0, covered = 0; const by = {};
    const N = 8;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = x0 + (i + 0.5) * (x1 - x0) / N, y = y0 + (j + 0.5) * (y1 - y0) / N;
      const hits = document.elementsFromPoint(x, y).filter(h => SHAPE.test(h.tagName) && node.contains(h));
      const k = hits.findIndex(h => h === d.el || d.el.contains(h));
      if (k < 0) continue;
      painted++;
      const over = hits.slice(0, k).find(h => opaque(h) >= 0.6);
      if (over) { covered++; const nm = nameOf(over); by[nm] = (by[nm] || 0) + 1; }
    }
    if (painted) out.push({ name: d.name, obj: !!d.obj, painted, hidden: Math.round(100 * covered / painted), by: Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k + " " + v),
      box: [x0 - L.left, y0 - L.top, x1 - x0, y1 - y0].map(Math.round) });
  }
  st.remove();
  return JSON.stringify({ n: drawings.length, ms: Math.round(performance.now() - t0), out }); }`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`window.__occl = ${MEASURE}; 1`);
  const kinds = JSON.parse(await ev(`JSON.stringify(PLACES.map(p => p[0]).filter(k => k !== "none"))`));
  const cases = [...kinds.map(k => [k, { kind: k, figX: 0, figY: 60, ...(k === "castleroom" ? { castle: "N", castleRoom: 1 } : {}) }]),
                 ["treehouse at its busiest", { kind: "treehouse", houses: 6, ladders: 6, bridges: 6, figX: 0, figY: 60 }],
                 ["the greenhouse", { kind: "castleroom", castle: "N", castleRoomsN: 6, castleRoom6N: "greenhouse", castleRoom: 6, figX: 0, figY: 60 }]]
    .filter(([k]) => !only.length || only.some(o => k.startsWith(o)));
  const report = [];
  for (const [label, setup] of cases) {
    const r = JSON.parse(await ev(`__occl(${JSON.stringify(setup)})`));
    const hid = r.out.filter(d => d.hidden > 75 && d.painted >= 4);
    console.log(`  ${label}: ${r.out.length} of ${r.n} drawings measured in ${r.ms} ms; ${hid.length} more than 75% hidden`);
    for (const d of hid) console.log(`    ${d.hidden}% of ${d.painted} pts  ${d.obj ? "object" : "plant"} ${d.name} at ${JSON.stringify(d.box)}  under ${d.by.join(", ")}`);
    report.push({ label, hidden: hid });
  }
  const total = report.reduce((a, r) => a + r.hidden.length, 0);
  console.log(`  in all: ${total} drawings more than 75% hidden`);
  const over = report.filter(r => r.hidden.length > (BUDGET[r.label] ?? 0) + SLACK);
  ok("no place drawing more where it is not seen than its budget (0.0.198's count, 4 more allowed)", !over.length, over.map(r => [r.label, r.hidden.length, BUDGET[r.label] ?? 0]));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
