// (ticket 383, ^du_report(12)'s next step 4, Matthew: "Yes, I want moving foam back on by default: build 383's layered foam") The bubble
// room at the game's defaults, 1600x1000: the foam moving (88), its backdrop under a see-through picture (#pic-under), its moving bubbles
// page layers between them (#foam-layers), none of the picture's own animations; each layer over its bubble in the backdrop (within half
// a pixel), and again after the window is resized; the friend takes a press; 👁️ a surface hidden hides its moving bubbles; held still
// (holdStill: the archive) the backdrop is back in the picture at once and no layer is left; the foam at 0, no layers; moving again, the
// layers back. Then, recorded and not a verdict, frames counted standing at CPU 1 and 4: the layered foam, the old drawing (its
// animations inside the picture, FOAM_LAYERS.on false) and still foam. Exits 1 on a failure of the facts.
//   node layers383.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const open = async () => {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map(), errs = [];
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
  return { page, send, ev, errs };
};
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 900)}`); if (!cond) bad++; };
const ALIGN = `(() => { const orig = [...document.querySelectorAll("#pic-under [data-foam]")], inner = foamLayers.inner; if (!inner) return { n: 0, max: null };
  const errs = orig.map((el, i) => { const d = inner.children[i]; if (!d) return 999; const prev = d.style.animationName; d.style.animationName = "none"; const c1 = el.querySelector("circle"), c2 = d.querySelector("circle");
    const p1 = new DOMPoint(0, 0).matrixTransform(c1.getScreenCTM()), p2 = new DOMPoint(0, 0).matrixTransform(c2.getScreenCTM()); d.style.animationName = prev; return Math.hypot(p1.x - p2.x, p1.y - p2.y); });
  return { n: errs.length, max: +Math.max(...errs).toFixed(3) }; })()`;
try {
  const { page, send, ev, errs } = await open();
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const a = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    localStorage.removeItem("dress-up-slow"); slowFlag = false; choppy = false; state = clone(DEFAULTS); state.music.mute = true; state.world.at = null;
    Object.assign(state.background, { kind: "bubbleroom", figX: 60, figY: 60 }); PERF.slowMoving = true; changed(); await w(1500);
    const smil = () => document.querySelectorAll("#pic animate, #pic animateTransform, #pic-under animate, #pic-under animateTransform").length, layers = () => document.querySelectorAll("#foam-layers .foam-b").length;
    const f = document.getElementById("figure").getBoundingClientRect(), hit = document.elementFromPoint(f.left + f.width / 2, f.top + f.height * 0.45);
    return JSON.stringify({ foamMove: state.background.foamMove, layers: layers(), under: document.querySelectorAll("#pic-under [data-obj^='foam']").length, smil: smil(), see: document.body.classList.contains("pic-see-through"),
      align: ${ALIGN}, friend: !!(hit && hit.closest("#figure")) }); })()`));
  console.log("  " + JSON.stringify(a));
  ok("the foam moving at the start (88), its moving bubbles page layers (40 or more)", a.foamMove === 88 && a.layers >= 40, a);
  ok("its five surfaces' backdrop under a see-through picture", a.under === 5 && a.see, a);
  ok("none of the picture's own animations", a.smil === 0, a);
  ok("each layer over its bubble in the backdrop, within half a pixel", a.align.n === a.layers && a.align.max < 0.5, a.align);
  ok("the friend takes a press, over the layers", a.friend, a);
  await send("Emulation.setDeviceMetricsOverride", { width: 1180, height: 820, deviceScaleFactor: 1, mobile: false }); await sleep(1500);
  const rs = JSON.parse(await ev(`JSON.stringify(${ALIGN})`));
  ok("after the window is resized (1180x820), still within half a pixel", rs.n > 0 && rs.max < 0.5, rs);
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false }); await sleep(1000);
  const b = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, layers = () => document.querySelectorAll("#foam-layers .foam-b").length;
    const out = {};
    B.objectsOff = { bubbleroom: ["foam, back wall"] }; changed(); await w(300);
    out.hidden = [...document.querySelectorAll("#foam-layers .foam-b")].filter(d => d.dataset.obj === "foam, back wall" && d.style.display !== "none").length;
    out.others = [...document.querySelectorAll("#foam-layers .foam-b")].filter(d => d.dataset.obj !== "foam, back wall" && d.style.display !== "none").length;
    B.objectsOff = {}; changed(); await w(300);
    holdStill(0); changed(); out.held = { layers: layers(), under: !!document.getElementById("pic-under"), inPic: document.querySelectorAll("#pic #bg [data-under]").length, see: document.body.classList.contains("pic-see-through") };
    holdStill(null); stillAt = null; changed(); await w(600); out.released = layers();
    B.foamMove = 0; changed(); await w(400); out.still0 = layers();
    B.foamMove = 88; changed(); await w(600); out.again = layers();
    return JSON.stringify(out); })()`));
  console.log("  " + JSON.stringify(b));
  ok("👁️ the back wall's foam hidden: its moving bubbles hidden, the others shown", b.hidden === 0 && b.others > 0, b);
  ok("held still (the archive): the backdrop back in the picture at once, no layer left", b.held.layers === 0 && !b.held.under && b.held.inPic === 1 && !b.held.see, b.held);
  ok("released, the layers back", b.released > 0, b);
  ok("the foam at 0: no layers; moving again: back", b.still0 === 0 && b.again > 0, b);
  ok("no error thrown", errs.length === 0, errs);
  await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`);
  // recorded: frames counted standing
  for (const cpu of [1, 4]) for (const [name, setup] of [["layered (0.0.334)", ""], ["the old drawing (animations in the picture)", "FOAM_LAYERS.on = false; READS.clear(); PARTS.clear();"], ["still foam", "state.background.foamMove = 0;"]]) {
    const { page: p2, send: s2, ev: e2 } = await open();
    await s2("Runtime.enable"); await s2("Emulation.setCPUThrottlingRate", { rate: cpu });
    await s2("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    await s2("Page.navigate", { url }); await sleep(4000);
    await e2(`localStorage.removeItem("dress-up-slow"); slowFlag = false; choppy = false; state = clone(DEFAULTS); state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "bubbleroom", figX: 60, figY: 60 }); PERF.slowMoving = true; ${setup} changed(); "ok"`);
    await sleep(2500);
    await e2(`window.__F = { gaps: [], last: 0, on: true }; { const f = t => { if (!__F.on) return; if (__F.last) __F.gaps.push(t - __F.last); __F.last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); } "go"`);
    await sleep(3000);
    const F = JSON.parse(await e2(`(() => { __F.on = false; const g = __F.gaps, s = g.reduce((a, b) => a + b, 0), q = g.slice().sort((a, b) => a - b); return JSON.stringify({ fps: +(1000 * g.length / Math.max(1, s)).toFixed(1), p95: Math.round(q[Math.floor(0.95 * (q.length - 1))] || 0), layers: document.querySelectorAll("#foam-layers .foam-b").length, smil: document.querySelectorAll("#pic animate, #pic animateTransform").length }); })()`));
    console.log(`  recorded: CPU ${cpu}  ${name.padEnd(44)} ${String(F.fps).padStart(5)} fps  p95 ${F.p95} ms  layers ${F.layers}  picture animations ${F.smil}`);
    await fetch(`http://127.0.0.1:${dport}/json/close/${p2.id}`);
  }
} catch (e) { ok("ran", false, String(e)); }
process.exit(bad ? 1 : 0);
