// (ticket 243, a diagnostic, never merged) collide176's walk into room 1's trunk, from the right, walking and facing left: each step's soles and what they meet
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
try {
  await send("Runtime.enable"); await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  console.log("D " + await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground;
    state.music.mute = true; state.world.at = null; Object.assign(B, { kind: "treeroom", houses: 6, ladders: 6, bridges: 6, inside: 1, figX: -189, figY: 0, things: [] }); changed(); await w(500);
    const t = solidsHere().find(s => s.name === "tree trunk"), z = (t.back + t.front) / 2 - g; B.figY = z; state.body.anim = "walk"; state.body.facing = "left"; changed(); await w(300);
    const steps = []; let x = -189;
    for (let i = 0; i < 60; i++) { B.figX = x; draw(); const S = youBoxes(x, z + g).map(s => s.map(v => Math.round(v))), hit = solidAt(x - 2, z + g), [nx] = solidMove(x, z, x - 2, z);
      if (i % 3 === 0 || Math.abs(nx - x) < 0.01) steps.push({ x: Math.round(x), soles: S.slice(0, 2).map(s => [s[0], s[1], s[4], s[5]]), torso: S[2] && [S[2][0], S[2][1], S[2][4], S[2][5]], next: hit && hit.name, moved: Math.round((nx - x) * 10) / 10 });
      if (Math.abs(nx - x) < 0.01) break; x = nx; }
    return JSON.stringify({ trunk: { x0: Math.round(t.x0), x1: Math.round(t.x1), back: Math.round(t.back), front: Math.round(t.front), bands: t.bands.map(b => [Math.round(b.x0), Math.round(b.x1), Math.round(b.lo), Math.round(b.hi)]) }, z: Math.round(z + g), steps }); })()`));
} catch (e) { console.log("stopped:", String(e).slice(0, 400)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
process.exit(0);
