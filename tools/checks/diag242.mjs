// (ticket 242, a diagnostic, never merged) why no tree room hangs a picture: the measure, the bounds, what blocks each slot
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  console.log("D " + await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null;
    Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 6, inside: 1, figX: 0, figY: 60, things: [] }); changed(); await w(500); changed(); await w(500);
    const c = { g: SCENE.ground, k: (SCENE.bottom - SCENE.top) / 700 }; const fr = (() => { try { return roomFrame({ ...c, x0: SCENE.left, x1: -SCENE.left, y0: SCENE.top, y1: SCENE.bottom, W: -2 * SCENE.left, H: SCENE.bottom - SCENE.top }); } catch (e) { return String(e); } })();
    const big = (treeBusy.boxes || []).map(b => ({ w: Math.round(b.r[2] - b.r[0]), h: Math.round(b.r[3] - b.r[1]), r: b.r.map(Math.round) })).sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 6);
    return JSON.stringify({ keyNow: treeKeyNow, key: treeBusy.key, same: treeKeyNow === treeBusy.key, boxes: (treeBusy.boxes || []).length, slots: treeBusy.slots, big, frame: fr && { top: fr.top, bw: fr.bw }, scene: { top: SCENE.top, bottom: SCENE.bottom, ground: SCENE.ground, left: SCENE.left } }); })()`));
  console.log("errors " + JSON.stringify(errs));
} catch (e) { console.log("stopped:", String(e).slice(0, 400)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
process.exit(0);
