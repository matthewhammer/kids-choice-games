// (ticket 144) The controller's diagonals: toward us and to a side, the
// friend faces us turned partway that side's way (turn); straight sideways,
// up or down, and a facing chip, not turned. Exits 1 on a failure or page error.
//   node turn144.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0, fails = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
const say = (ok, line) => { if (!ok) fails++; console.log(`${ok ? "ok  " : "FAIL"} ${line}`); };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 810, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(() => { window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true });
    const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); return 1; })()`);
  const hold = async (btns, ms = 700) => { for (const b of btns) await ev(`__pad.buttons[${b}].pressed = true; 1`); await sleep(ms);
    await ev(`__pad.buttons.forEach(x => x.pressed = false); 1`); await sleep(300);
    return JSON.parse(await ev(`JSON.stringify({ facing: state.body.facing, turn: state.body.turn })`)); };
  await ev(`state.music.mute = true; Object.assign(state.background, { kind: "emptyroom", figX: 0, figY: 0 }); state.body.anim = "none"; changed(); 1`); await sleep(500);
  // (buttons: 12 up, 13 down, 14 left, 15 right)
  let r = await hold([13, 15]); say(r.facing === "front" && r.turn === "right", `down and right: facing ${r.facing}, turned "${r.turn}"`);
  r = await hold([13, 14]); say(r.facing === "front" && r.turn === "left", `down and left: facing ${r.facing}, turned "${r.turn}"`);
  r = await hold([15]); say(r.facing === "right" && r.turn === "", `right alone: facing ${r.facing}, turned "${r.turn}"`);
  r = await hold([13, 15]); r = await hold([13]); say(r.facing === "front" && r.turn === "", `after a diagonal, down alone: facing ${r.facing}, turned "${r.turn}"`);
  r = await hold([12, 15]); say(r.facing !== "front" && r.turn === "", `up and right (away from us, as before): facing ${r.facing}, turned "${r.turn}"`);
  r = await hold([13, 15]);
  const chip = JSON.parse(await ev(`(() => { const b = [...document.querySelectorAll("button, label")].find(x => /toward us/.test(x.textContent)); if (b) b.click(); return JSON.stringify({ found: !!b, facing: state.body.facing, turn: state.body.turn }); })()`));
  say(!chip.found || chip.turn === "", `the "toward us" chip after a diagonal: ${chip.found ? `facing ${chip.facing}, turned "${chip.turn}"` : "chip not found (Body tab closed): skipped"}`);
  // the drawing: turned, the body is narrower than facing us, and different from it
  const pics = JSON.parse(await ev(`(() => { const out = {}; for (const t of ["", "right", "left"]) { state.body.facing = "front"; state.body.turn = t; state.body.anim = "none"; changed(); draw();
    out[t || "none"] = figShown.map(n => n.outerHTML || "").join(""); } state.body.turn = ""; changed(); return JSON.stringify(out); })()`));
  say(pics.right !== pics.none && pics.left !== pics.none && pics.left !== pics.right, `the friend turned left, turned right and facing us are three different drawings`);
  if (errs.length) { fails++; console.log("FAIL page errors:", errs.slice(0, 3)); } else console.log("page errors: none");
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(fails ? 1 : 0); }
