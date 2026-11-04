// (ticket 687, Matthew) 🎒 your items: the button opens the screen over the game (dimmed to start, the picture held still);
// on it the abilities (🫧, 🔥) and the tools found (a 🥅 net in the backpack), the ones not found dim; 🅰️ and 🅱️ under an
// item put it in that slot (taken from the other, the two swap); the backdrop is dimmed, black or white; Escape shuts it,
// the picture moving again. In the game, Z held breathes the fire in 🅰️, X swings the net in 🅱️, the on-screen
// controller's 🅱️ shows 🥅, and the controller's 🅰️ held breathes fire. An old save's 🫧 and 🔥 buttons become 🅰️'s and
// 🅱️'s. Exits 1 on a failure.
//   node items687.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1200)}`); if (!cond) bad++; };
const KEYS = { z: ["KeyZ", 90], x: ["KeyX", 88], Escape: ["Escape", 27] };
const key = async (type, k) => send("Input.dispatchKeyEvent", { type, key: k, code: KEYS[k][0], text: type === "keyDown" && k.length === 1 ? k : undefined, windowsVirtualKeyCode: KEYS[k][1] });
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "forest", figX: 0, figY: 60 }); state.body.facing = "right"; changed(); await new Promise(r => setTimeout(r, 600)); document.body.focus(); return 1; })()`);
  const open = JSON.parse(await ev(`(async () => { document.getElementById("items-btn").click(); await new Promise(r => setTimeout(r, 300));
    const s = document.getElementById("items-screen");
    return JSON.stringify({ open: itemsOpen, shown: !s.hidden, cls: s.className, held: document.getElementById("pic").animationsPaused(), slots: [state.pack.a, state.pack.b],
      tiles: [...s.querySelectorAll(".items-tile")].map(t => t.dataset.item + (t.classList.contains("missing") ? "-" : "+")) }); })()`));
  ok("🎒 opens the screen, dimmed, the picture held still, 🫧 in 🅰️ and 🔥 in 🅱️", open.open && open.shown && open.cls.includes("dim") && open.held && open.slots[0] === "bubbles" && open.slots[1] === "fire", open);
  ok("the abilities had, the net not found yet", open.tiles.includes("bubbles+") && open.tiles.includes("fire+") && open.tiles.includes("net-"), open);
  const pick = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    document.querySelector('.items-tile[data-item="fire"] .items-pick button').click(); await w(100); const swap = [state.pack.a, state.pack.b];
    state.backpack = [...state.backpack, { id: "net", got: Date.now(), from: "chest" }]; itemsRender(); await w(100);
    document.querySelectorAll('.items-tile[data-item="net"] .items-pick button')[1].click(); await w(100); const net = [state.pack.a, state.pack.b];
    const backs = {}; for (const k of ["black", "white", "dim"]) { [...document.querySelectorAll(".items-backs button")].find(b => b.textContent.includes(k === "dim" ? "dimmed" : k)).click(); await w(60); backs[k] = document.getElementById("items-screen").className; }
    return JSON.stringify({ swap, net, backs }); })()`));
  ok("🔥 to 🅰️: the two swap", pick.swap[0] === "fire" && pick.swap[1] === "bubbles", pick);
  ok("the net found, to 🅱️", pick.net[0] === "fire" && pick.net[1] === "net", pick);
  ok("black, white and dimmed behind the items", pick.backs.black.includes("black") && pick.backs.white.includes("white") && pick.backs.dim.includes("dim"), pick);
  await key("keyDown", "Escape"); await key("keyUp", "Escape"); await sleep(200);
  const shut = JSON.parse(await ev(`JSON.stringify({ open: itemsOpen, hidden: document.getElementById("items-screen").hidden, moving: !document.getElementById("pic").animationsPaused() })`));
  ok("Escape shuts it, the picture moving again", !shut.open && shut.hidden && shut.moving, shut);
  await key("keyDown", "z"); await sleep(500);
  const z = JSON.parse(await ev(`JSON.stringify({ on: (O => !!O && O.style.display !== "none")(document.getElementById("fire-over")) })`));
  await key("keyUp", "z"); await sleep(300);
  ok("Z held: the fire in 🅰️", z.on, z);
  await key("keyDown", "x"); await sleep(80);
  const x = JSON.parse(await ev(`JSON.stringify({ swinging, tool: state.pack.tool })`));
  await key("keyUp", "x"); await sleep(600);
  ok("X: the net in 🅱️, held and swung", x.swinging === "net" && x.tool === "net", x);
  const pad = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); touchWant(true); await w(400);
    const b7 = document.querySelector('#touchpad [data-b="7"]'), label = b7 ? b7.textContent : "";
    touchSet(state.controls.useA, true); await w(300); const fire = firePad; touchSet(state.controls.useA, false); await w(200); touchWant(false); await w(200);
    return JSON.stringify({ label, fire }); })()`));
  ok("the on-screen 🅱️ shows the net, and the controller's 🅰️ held breathes the fire in it", /🥅/.test(pad.label) && pad.fire, pad);
  const old = JSON.parse(await ev(`(async () => { loadSaved({ state: { controls: { bubbles: 3, fire: 5, tool: 2 } } }); await new Promise(r => setTimeout(r, 200));
    const C = state.controls; return JSON.stringify({ useA: C.useA, useB: C.useB, gone: !("bubbles" in C) && !("fire" in C) && !("tool" in C), slots: [state.pack.a, state.pack.b] }); })()`));
  ok("an old save: its 🫧 and 🔥 buttons are 🅰️'s and 🅱️'s, 🫧 and 🔥 in them", old.useA === 3 && old.useB === 5 && old.gone && old.slots[0] === "bubbles" && old.slots[1] === "fire", old);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
