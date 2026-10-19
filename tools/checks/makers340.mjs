// (ticket 340, Matthew: "bubble room with one bubble machine is stressing my modern laptop"; 23:39, in Firefox, "About 19 frames
// a second here") What 0.0.306 and 0.0.307 put right, as facts rather than a frame rate: the bubble room's foam still at the start
// (its moving foam was the cost: 18 frames a second in Firefox against 60 still); the bubble makers' bubbles in a picture of their
// own over the scene's (#pic-over, its viewBox the scene's), each where the scene would put it; and all makers together blowing
// MAKER_BUDGET bubbles a second, not each its own. Exits 1 on a failure.
//   node makers340.mjs <devtools port> <url>
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
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state = clone(DEFAULTS); state.music.mute = true; state.world.at = null; PERF.slowMoving = true; const B = state.background;
    Object.assign(B, { kind: "bubbleroom", figX: 0, figY: 60 }); changed(); await w(800);
    const foam = { start: DEFAULTS.background.foamMove, smil: document.getElementById("pic").querySelectorAll("animate, animateTransform, animateMotion").length };
    B.things = Array.from({ length: 16 }, (_, i) => ({ kind: "bubblemaker", x: Math.round(-300 + 600 * (i + 0.5) / 16), z: SCENE.ground + 40 + 30 * (i % 2), seed: 600 + i, size: 100, ...structuredClone(THING_DEFAULTS.bubblemaker || {}) }));
    changed(); await w(1500);
    const O = document.getElementById("pic-over"), L = document.getElementById("maker-bubbles");
    let made = 0; const mo = new MutationObserver(ms => { for (const m of ms) made += m.addedNodes.length; }); if (L) mo.observe(L, { childList: true });
    await w(4000); mo.disconnect();
    // (each bubble on the screen where the scene's own matrix puts its middle)
    const P = document.getElementById("pic"), M = P.getScreenCTM(), off = makerSim.list.filter(b => !b.pop && b.el.isConnected).slice(0, 8).map(b => { const q = b.el.getBoundingClientRect(), p = new DOMPoint(b.x, b.y).matrixTransform(M); return Math.hypot(q.left + q.width / 2 - p.x, q.top + q.height / 2 - p.y); });
    return JSON.stringify({ foam, over: !!O, layerInOver: !!(L && O && O.contains(L)), layerInPic: !!(L && P.contains(L)), vb: O && O.getAttribute("viewBox") === P.getAttribute("viewBox"), made, flying: makerSim.list.length, off: off.map(x => +x.toFixed(2)) }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("the bubble room's foam is still at the start (0.0.306): no moving foam drawn", r.foam.start === 0 && r.foam.smil === 0, r.foam);
  ok("the makers' bubbles are in their own picture over the scene's, with the scene's viewBox", r.over && r.layerInOver && !r.layerInPic && r.vb, r);
  ok("sixteen makers blow MAKER_BUDGET (12) a second between them: at most 60 made in 4 s", r.made > 0 && r.made <= 60, r.made);
  ok("each bubble on the screen where the scene would put it (within 1 px)", r.off.length > 0 && r.off.every(x => x < 1), r.off);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
