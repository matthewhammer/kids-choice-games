// (ticket 248) Two ways the friend got inside a solid and stayed there, with the controller. (1) The woodpath: a high
// jump at "mushroom, right inner", a tree just past it stopping the jump in the air: it comes down inside the mushroom,
// and is let out of it, clear of every solid, and can walk away. (2) Tree room 1: one foot inside the toy chest, walking
// left into the tree trunk: stopped at the trunk, not let into it as a way out of the chest. Exits 1 on a failure.
//   node solids248.mjs <devtools port> <url>
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
const press = async (b, on) => ev(`__pad.buttons[${typeof b === "number" ? b : `state.controls.${b}`}].pressed = ${on}; 1`);
const hold = async (btn, ms, jump = false) => { await press(btn, true); if (jump) { await sleep(120); await press("jumpHigh", true); await sleep(120); await press("jumpHigh", false); await sleep(ms - 240); } else await sleep(ms);
  await ev(`__pad.buttons.forEach(b => b.pressed = false); 1`); await sleep(1300); };
const where = async () => JSON.parse(await ev(`(() => { const B = state.background, z = SCENE.ground + B.figY, r = solidAt(B.figX, z, true);
  return JSON.stringify({ x: B.figX, z: +z.toFixed(1), anim: state.body.anim, in: r.list.map(o => o.name), wall: r.wall }); })()`));
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 810, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(() => { window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); return 1; })()`);
  const setUp = async (bg, name) => JSON.parse(await ev(`(async () => { state = Object.assign(clone(DEFAULTS), { controls: state.controls }); state.music.mute = true; state.world.at = null;
    Object.assign(state.background, ${JSON.stringify(bg)}); state.body.anim = "none"; changed(); await new Promise(r => setTimeout(r, 600));
    const o = solidsHere().find(o => o.name === ${JSON.stringify(name)}); return JSON.stringify(o ? { x0: o.x0, x1: o.x1, z: (o.back + o.front) / 2, y: (o.back + o.front) / 2 - SCENE.ground,
      bandX1: Math.max(...solidBands(o).filter(b => b.lo < 20).map(b => b.x1)) } : null); })()`));
  const put = async (x, y) => ev(`Object.assign(state.background, { figX: ${Math.round(x)}, figY: ${Math.round(y)} }); state.body.anim = "none"; state.body.facing = "front"; changed(); 1`);
  // (1) the woodpath's mushroom
  const m = await setUp({ kind: "woodpath" }, "mushroom, right inner");
  if (!m) ok("the woodpath has its right inner mushroom", false, null);
  else {
    await put(m.x0 - 60, m.y); await sleep(300); await hold(15, 2200, true);
    const after = await where(); await hold(14, 1000); const away = await where();
    console.log(`  the mushroom ${Math.round(m.x0)}..${Math.round(m.x1)}: after the high jump at it, ${JSON.stringify(after)}; walked left a second: x ${away.x}`);
    ok("after the high jump at the mushroom (a tree just past it): out of it, back the way they came", after.x < m.x0 && !after.in.includes("mushroom, right inner"), after);
    ok("and free to walk away from it", away.x < after.x - 20 && !away.in.length, away);
  }
  // (2) tree room 1's trunk, from one foot in the toy chest
  const t = await setUp({ kind: "treeroom", inside: 1, houses: 4 }, "tree trunk");
  if (!t) ok("tree room 1 has its tree trunk", false, null);
  else {
    await put(t.x1 + 60, t.y); await sleep(300); const start = await where();
    await hold(14, 3000); const end = await where();
    console.log(`  the trunk ${Math.round(t.x0)}..${Math.round(t.x1)} (its foot's band to ${Math.round(t.bandX1)}): from ${JSON.stringify(start)}, walked left 3 s: ${JSON.stringify(end)}`);
    ok("walking left into the trunk: stopped at it, at its foot's band, never into it; and not carried off back past the chest", end.x > t.bandX1 && end.x < start.x, { start, end, trunk: t });
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
