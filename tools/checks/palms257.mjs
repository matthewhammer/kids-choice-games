// (ticket 257, Matthew: "the palm trees in the castle's green house need more segments for collision detection -- and we
// should improve the image -- it looks pretty sloppy -- let's have a palm tree segment system, with 3 or 4 variations of
// shapes, and stack them, not use ovals") In N's greenhouse: each palm's trunk drawn as stacked segments, no ovals, of
// at least three shapes; boxed in PALM_BANDS bands up its trunk, leaning the way it leans; walking at the left palm from
// the room with the controller, stopped by it, before its foot. Prints each palm's bands. Exits 1 on a failure.
//   node palms257.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; state.body.anim = "none";
    Object.assign(B, { kind: "castleroom", castle: "N", figX: 0, figY: 60, things: [] }); B.castleRoom = castleOf(B).rooms.indexOf("greenhouse") + 1; changed(); await w(800);
    if (B.castleRoom < 1) return JSON.stringify({ none: true });
    const palms = solidsHere().filter(o => /^palm/.test(o.name)).map(o => { const node = bgShown.objs.find(q => q.name === o.name).node;
      const segs = [...node.querySelectorAll('g[transform*="rotate"] > path:first-child')].map(p => p.getAttribute("d").replace(/[^A-Za-z]/g, ""));
      const bands = solidBands(o).map(b => ({ x0: Math.round(b.x0), x1: Math.round(b.x1), lo: Math.round(b.lo), hi: Math.round(Number.isFinite(b.hi) ? b.hi : 9999) }));
      return { name: o.name, x0: Math.round(o.x0), x1: Math.round(o.x1), z: Math.round((o.back + o.front) / 2), bands, ovals: node.querySelectorAll("ellipse").length, segs: segs.length, shapes: [...new Set(segs)].length }; });
    return JSON.stringify({ palms }); })()`));
  if (r.none) throw new Error("N's castle has no greenhouse");
  for (const p of r.palms) console.log(`  ${p.name}: ${p.segs} segments of ${p.shapes} shapes, ${p.ovals} ovals; ${p.bands.length} bands: ${p.bands.map(b => `${b.x0}..${b.x1}@${b.lo}-${b.hi}`).join(" ")}`);
  ok("two palms", r.palms.length === 2, r.palms.map(p => p.name));
  ok("each trunk stacked segments (10 or more), of three shapes or more, and no ovals", r.palms.every(p => p.segs >= 10 && p.shapes >= 3 && p.ovals === 0), r.palms);
  ok("each boxed in 8 bands up its trunk (PALM_BANDS)", r.palms.every(p => p.bands.length === 8), r.palms.map(p => p.bands.length));
  const lean = p => { const mid = b => (b.x0 + b.x1) / 2, foot = p.bands.reduce((a, b) => b.lo < a.lo ? b : a), top = p.bands.reduce((a, b) => b.hi > a.hi ? b : a); return mid(top) - mid(foot); };
  ok("the left palm's bands lean right, the right palm's left, as they are drawn", lean(r.palms.find(p => /left/.test(p.name))) > 20 && lean(r.palms.find(p => /right/.test(p.name))) < -20, r.palms.map(lean));
  ok("each band narrow: a trunk's width, not the crown's", r.palms.every(p => p.bands.every(b => b.x1 - b.x0 < 80)), r.palms.map(p => p.bands.map(b => b.x1 - b.x0)));
  // walking left at the left palm, from the room, at its depth
  const left = r.palms.find(p => /left/.test(p.name)), foot = left.bands.reduce((a, b) => b.lo < a.lo ? b : a);
  const walk = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    B.figX = ${foot.x1 + 70}; B.figY = ${left.z} - SCENE.ground; state.body.facing = "left"; changed(); await w(300);
    touchWant(true); const b = touchPad.pad.buttons[14]; b.pressed = true; b.value = 1; let met = null; const t0 = performance.now();
    while (performance.now() - t0 < 3500) { await w(50); if (solidHit.name && performance.now() - solidHit.t < 100) met = solidHit.name; }
    b.pressed = false; b.value = 0; await w(400); touchWant(false); await w(300);
    return JSON.stringify({ x: B.figX, met, in: solidAt(B.figX, SCENE.ground + B.figY, true).list.map(o => o.name) }); })()`));
  console.log(`  walking left at ${left.name} (its foot ${foot.x0}..${foot.x1}): stopped at x ${walk.x}, met ${walk.met}`);
  ok("walking left at the left palm: stopped by it, short of its foot", walk.met === left.name && walk.x > foot.x1 && !walk.in.includes(left.name), walk);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
