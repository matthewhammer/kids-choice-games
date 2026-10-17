// (ticket 225) After 🎲 Surprise me, a tap on a passage sometimes did nothing. Many times over: Surprise me, then in
// the living room a real click (the mouse, through the browser) on its far picture, and on its door: each must start
// the trip (entering, or the place changing). When one does not, what the friend and the page were: their pose,
// animation, seat, size, climb; entering; whether the passages' list is the picture's (marks.text); what is under the
// pointer. Exits 1 if any tap did nothing.
//   node surprise225.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
const click = async (x, y) => { for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1500)}`); if (!cond) bad++; };
const TRIES = 24, dead = [];
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  for (let i = 0; i < TRIES; i++) {
    const which = i % 2 ? "door" : "picture";
    const at = JSON.parse(await ev(`(async () => { state.music.mute = true; document.getElementById("surprise").click(); await new Promise(r => setTimeout(r, 300));
      state.world.at = null; Object.assign(state.background, { kind: "livingroom", figX: 0, figY: 60 }); changed(); await new Promise(r => setTimeout(r, 700));
      const fig = document.getElementById("figure"), fr = fig && fig.getBoundingClientRect();
      const P = marks.pics.filter(p => p.el.isConnected && (${which === "door"} ? p.kind !== "picture" && p.kind !== "nav" : p.kind === "picture"));
      // (a spot on the passage not covered by the friend, if there is one)
      for (const p of P) { const r = p.el.getBoundingClientRect();
        for (const [u, v] of [[0.5, 0.5], [0.2, 0.3], [0.8, 0.3], [0.2, 0.7], [0.8, 0.7]]) { const x = r.left + r.width * u, y = r.top + r.height * v;
          if (fr && x > fr.left && x < fr.right && y > fr.top && y < fr.bottom) continue;
          return JSON.stringify({ x: Math.round(x), y: Math.round(y), kind: p.kind, to: p.el.dataset.to || "" }); } }
      return JSON.stringify({ none: P.length }); })()`));
    if (at.none !== undefined) { console.log(`  try ${i + 1} (${which}): no ${which} free of the friend to click (${at.none} of them)`); continue; }
    await click(at.x, at.y); await sleep(450);
    const r = JSON.parse(await ev(`(() => { const B = state.background, b = state.body, el = document.elementFromPoint(${at.x}, ${at.y});
      return JSON.stringify({ went: entering || B.kind !== "livingroom", entering, marksFresh: marks.text === bgShown.text, under: el ? (el.closest("#figure") ? "the friend" : el.closest("[data-drag]") ? "a dragged thing " + el.closest("[data-drag]").dataset.drag : el.closest("#ways") ? "the ways' layer" : el.closest(".portal") ? "a portal" : el.tagName) : null,
        pose: b.pose, anim: b.anim, sit: !!b.sit, seat: B.seat || null, climb: !!climb, figSize: B.figSize, k: +figureT.k.toFixed(3), facing: b.facing }); })()`));
    if (!r.went) dead.push({ try: i + 1, which, at, ...r });
    // back to the living room for the next try (wait out the trip)
    for (let t = 0; t < 40 && await ev("entering"); t++) await sleep(150);
    await sleep(200);
  }
  console.log(`  ${TRIES} tries, ${dead.length} taps that did nothing`);
  for (const d of dead) console.log("  dead:", JSON.stringify(d));
  ok("after Surprise me, every tap on a passage starts the trip", dead.length === 0, dead.slice(0, 4));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
