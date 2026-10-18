// (ticket 322, Matthew on 0.0.227: "the trap door animations happen the first time, and then it reverts to non animation
// (immediate change)"; on 0.0.228: "I see no animations of the pits at all, or the levers") N's trap room, the music ON,
// 🔬 Inspection's overlays on (#inspect), and the left lever clicked four times with real mouse events; every frame, the
// left pit's lid as drawn (its fold, and whether it is the same element as the frame before) and the room's rebuilds
// (mountScene calls). A pull passes when its lid is seen mid-swing on several frames. Exits 1 on a failure.
//   node lidswing322.mjs <devtools port> <url>
//   node pitlids307.mjs <devtools port> <url>
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
  await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.world.at = null; climb = null; state.music.mute = false;
    for (const k of Object.keys(B)) if (/^castleLever[LR]_/.test(k)) delete B[k];
    Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: 160, figY: 70, things: [] }); changed(); await w(800);
    window.__mounts = 0; const m0 = mountScene; mountScene = function (...a) { window.__mounts++; return m0.apply(this, a); };
    const ids = new WeakMap(); let nid = 0; const idOf = n => n ? (ids.has(n) ? ids.get(n) : (ids.set(n, ++nid), nid)) : 0;
    window.__rec = []; const tick = () => { const lid = bgShown.node && bgShown.node.querySelector('.pit-lid[data-pit-i="0"]'), arm = bgShown.node && bgShown.node.querySelector('[data-lever="L"] .lever-arm');
      const tf = lid ? lid.getAttribute("transform") || "" : "", s = /matrix\\(1 0 0 ([\\d.]+)/.exec(tf), a = arm ? /rotate\\((-?[\\d.]+)/.exec(arm.getAttribute("transform") || "") : null;
      window.__rec.push({ t: performance.now(), lid: idOf(lid), s: s ? +s[1] : (tf ? NaN : 1), hid: lid ? lid.getAttribute("visibility") === "hidden" : null, a: a ? +a[1] : NaN, mounts: window.__mounts, playing: !!playing });
      requestAnimationFrame(tick); }; requestAnimationFrame(tick); return "ok"; })()`);
  const results = [];
  for (let p = 1; p <= 4; p++) {
    const c = JSON.parse(await ev(`(() => { const r = bgShown.node.querySelector('[data-lever="L"] .lever-arm').getBoundingClientRect(); return JSON.stringify([r.left + r.width / 2, r.top + r.height / 2]); })()`));
    const t0 = await ev(`performance.now()`);
    for (const [type, buttons] of [["mouseMoved", 0], ["mousePressed", 1], ["mouseReleased", 0]]) {
      await send("Input.dispatchMouseEvent", { type, x: c[0], y: c[1], button: type === "mouseMoved" ? "none" : "left", buttons, clickCount: type === "mouseMoved" ? 0 : 1 });
      if (type === "mousePressed") await sleep(70);
    }
    await sleep(1600);
    const R = JSON.parse(await ev(`JSON.stringify(window.__rec.filter(f => f.t >= ${t0}))`));
    const mid = R.filter(f => f.s > 0.02 && f.s < 0.98), lids = new Set(R.map(f => f.lid)), armMid = R.filter(f => Number.isFinite(f.a) && Math.abs(Math.abs(f.a) - 31) > 1.5);
    const r = { pull: p, frames: R.length, midFrames: mid.length, armMidFrames: armMid.length, lidElements: lids.size, rebuilds: R.length ? R[R.length - 1].mounts - R[0].mounts : 0, playing: R.length ? R[R.length - 1].playing : null,
                folds: R.slice(0, 40).map(f => Number.isFinite(f.s) ? f.s.toFixed(2) : "?").join(" ") };
    results.push(r);
    console.log(`  pull ${p}: ${r.frames} frames, the lid mid-swing on ${r.midFrames}, the handle on ${r.armMidFrames}; ${r.lidElements} lid element(s); ${r.rebuilds} rebuild(s) of the room; music ${r.playing ? "playing" : "not playing"}`);
    console.log(`    folds: ${r.folds}`);
    await sleep(400);
  }
  for (const r of results) ok(`pull ${r.pull}: the lid seen mid-swing (and the handle rocking)`, r.midFrames >= 5 && r.armMidFrames >= 5, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
