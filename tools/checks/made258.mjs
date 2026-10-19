// (ticket 258, Matthew: "showing all of the 'objects' that are baked into the background options, with their bounding
// box and label. OBJECTS.md content should appear, right? ... Let's start with all plants, in all scenes"; "a toggle
// that reveals a sub-panel of toggles, per category of object") With ♿ 🧩 on: in every place, its objects boxed and
// named (its objects list), its plants boxed and named by the procedure that drew them, as many as each kind's chip
// counts; a kind's chip turns its boxes on and off (leaf pads off at first); the legend names the procedures. Prints
// each place's kinds and counts. Exits 1 on a failure.
//   node made258.mjs <devtools port> <url>
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
const SEE = `(() => { const ov = document.querySelector("#access-layer svg.made-of"), leg = document.querySelector("#access-layer .made-legend");
  const procs = ov ? [...ov.querySelectorAll(".proc text")].map(t => t.textContent) : [], boxes = ov ? ov.querySelectorAll(".proc rect").length : 0;
  return { on: !!ov, objs: ov ? ov.querySelectorAll(".obj rect:not(.under)").length : 0, objNames: ov ? [...ov.querySelectorAll(".obj text")].map(t => t.textContent) : [], boxes, procs: [...new Set(procs)], counts: { ...madeCounts }, legend: leg ? leg.textContent : "" }; })()`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // every place
  const all = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, out = [];
    state.music.mute = true; state.world.at = null; state.access.showMadeOf = true; state.access.madeCats = {};
    for (const kind of PLACES.map(p => p[0]).filter(k => k !== "none")) { Object.assign(B, { kind, figX: 0, figY: 60 }); changed(); await w(250); changed(); await w(150);
      // (its objects that have a box on the picture: one off its edge, or an empty group, is not seen)
      const L = document.getElementById("access-layer").getBoundingClientRect();
      const seen = bgShown.objs.filter(o => { const r = o.node.getBoundingClientRect(); return Math.min(r.right, L.right) - Math.max(r.left, L.left) > 1 && Math.min(r.bottom, L.bottom) - Math.max(r.top, L.top) > 1; }).length;
      madeShown = ""; madeOfHud();   // (as it is now: bubble space's bubbles come after its drawing)
      const s = ${SEE}; out.push({ kind, objs: s.objs, list: bgShown.objs.length, seen, counts: s.counts, procs: s.procs }); }
    return JSON.stringify(out); })()`));
  for (const p of all) console.log(`  ${p.kind}: ${p.objs} of ${p.list} objects boxed; plants ${JSON.stringify(Object.fromEntries(Object.entries(p.counts).filter(([k]) => k !== "objects")))}; named ${p.procs.join(", ") || "none"}`);
  ok("every place: its objects boxed and named, all of its objects list that are seen", all.every(p => p.objs === p.seen), all.filter(p => p.objs !== p.seen).map(p => [p.kind, p.objs, p.seen]));
  const plants = k => { const p = all.find(q => q.kind === k); return p ? Object.entries(p.counts).filter(([c]) => c !== "objects").reduce((a, [, v]) => a + v, 0) : 0; };
  ok("the plant places have plants boxed: the tree house, the forest, the beach, the cemetery", ["treehouse", "forest", "beach", "cemetery"].every(k => plants(k) > 0), ["treehouse", "forest", "beach", "cemetery"].map(k => [k, plants(k)]));
  // the tree house: kinds on and off, the legend
  const th = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    Object.assign(B, { kind: "treehouse", houses: 6, figX: -250, figY: 60 }); state.access.madeCats = {}; changed(); await w(400);
    const before = ${SEE}; state.access.madeCats = { pads: true }; changed(); await w(300); const pads = ${SEE};
    state.access.madeCats = { pads: true, objects: false, pines: false }; changed(); await w(300); const less = ${SEE};
    state.access.madeCats = {}; changed(); return JSON.stringify({ before, pads, less }); })()`));
  console.log(`  the tree house: ${JSON.stringify({ counts: th.before.counts, procs: th.before.procs, legend: th.before.legend.slice(0, 200) })}`);
  ok("at first, leaf pads counted but not boxed; with their chip on, boxed", th.before.counts.pads > 0 && !th.before.procs.some(p => /^pad/.test(p)) && th.pads.boxes > th.before.boxes, { before: th.before.boxes, pads: th.pads.boxes, counts: th.before.counts });
  ok("the tree house's pines and leafy trees named by their procedures, and the legend names them", th.before.procs.includes("pineTree") && th.before.procs.includes("leafyTree") && /pineTree/.test(th.before.legend) && /objects/.test(th.before.legend), th.before);
  ok("objects off and pines off: no objects boxed, no pines named", th.less.objs === 0 && !th.less.procs.includes("pineTree"), th.less);
  // the greenhouse and the beach: their own plants
  const gh = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    Object.assign(B, { kind: "castleroom", castle: "N", figX: 0, figY: 70 }); B.castleRoom = castleOf(B).rooms.indexOf("greenhouse") + 1; changed(); await w(500); const g = ${SEE};
    Object.assign(B, { kind: "beach" }); changed(); await w(400); const b = ${SEE}; return JSON.stringify({ g, b }); })()`));
  console.log(`  the greenhouse: ${gh.g.procs.join(", ")}; the beach: ${gh.b.procs.join(", ")}`);
  ok("the greenhouse's palms, ferns, monsteras, hibiscus and birds of paradise named", ["palm", "fern", "monstera", "hibiscus", "paradise"].every(p => gh.g.procs.includes(p)), gh.g.procs);
  ok("the beach's palms named", gh.b.procs.includes("beachPalm"), gh.b.procs);
  // the ♿ panel: the row, and a chip per kind with its count
  const panel = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); tab = TABS.findIndex(t => t[1] === "access"); showTab(); changed(); await w(300);
    // (ticket 369: the collision boxes' kinds have chips of their own beside these since 0.0.255; the made-of ones are MADE_CATS's)
    const labels = MADE_CATS.map(c => c[1]), chips = [...document.querySelectorAll("#panel .madecats .flip")].filter(b => labels.some(l => b.textContent.startsWith(l))).map(b => ({ text: b.textContent, on: b.getAttribute("aria-pressed") }));
    return JSON.stringify({ chips, counts: madeCounts, kinds: MADE_CATS.length }); })()`));
  console.log(`  ♿ chips: ${panel.chips.map(c => c.text + (c.on === "true" ? " ✓" : "")).join(" | ")}`);
  ok("the 🔬 panel: a chip for each kind (MADE_CATS's, 11 since ticket 368's skulls and fences), with how many are here", panel.chips.length === panel.kinds && panel.chips.every(c => /×\d+/.test(c.text)), panel);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
