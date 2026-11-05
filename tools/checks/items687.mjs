// (ticket 687, Matthew) 🎒 your items: the button opens the screen over the game (dimmed to start, the picture held still);
// on it the abilities (🫧, 🔥) and the tools found (a 🥅 net in the backpack), the ones not found dim; 🔹 and 🔸 under an
// item put it in that slot (taken from the other, the two swap); the backdrop is dimmed, black or white; Escape shuts it,
// the picture moving again. In the game, Z held breathes the fire in 🔹, X swings the net in 🔸, the on-screen
// controller's 🔸 shows 🥅, and the controller's 🔹 held breathes fire; start opens and shuts the screen. The hands hold the
// two items (🔥 simmering), where a costume's own things (a knight's sword and shield) are not. An old save's 🫧
// and 🔥 buttons become 🔹's and 🔸's, and its 🚪 start 🎒's. Exits 1 on a failure.
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
  ok("🎒 opens the screen, dimmed, the picture held still, 🫧 in 🔹 and 🔥 in 🔸", open.open && open.shown && open.cls.includes("dim") && open.held && open.slots[0] === "bubbles" && open.slots[1] === "fire", open);
  ok("the abilities had, the net not found yet", open.tiles.includes("bubbles+") && open.tiles.includes("fire+") && open.tiles.includes("net-"), open);
  const pick = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    document.querySelector('.items-tile[data-item="fire"] .items-pick button').click(); await w(100); const swap = [state.pack.a, state.pack.b];
    state.backpack = [...state.backpack, { id: "net", got: Date.now(), from: "chest" }]; itemsRender(); await w(100);
    document.querySelectorAll('.items-tile[data-item="net"] .items-pick button')[1].click(); await w(100); const net = [state.pack.a, state.pack.b];
    const backs = {}; for (const k of ["black", "white", "dim"]) { [...document.querySelectorAll(".items-backs button")].find(b => b.textContent.includes(k === "dim" ? "dimmed" : k)).click(); await w(60); backs[k] = document.getElementById("items-screen").className; }
    return JSON.stringify({ swap, net, backs }); })()`));
  ok("🔥 to 🔹: the two swap", pick.swap[0] === "fire" && pick.swap[1] === "bubbles", pick);
  ok("the net found, to 🔸", pick.net[0] === "fire" && pick.net[1] === "net", pick);
  ok("black, white and dimmed behind the items", pick.backs.black.includes("black") && pick.backs.white.includes("white") && pick.backs.dim.includes("dim"), pick);
  await key("keyDown", "Escape"); await key("keyUp", "Escape"); await sleep(200);
  const shut = JSON.parse(await ev(`JSON.stringify({ open: itemsOpen, hidden: document.getElementById("items-screen").hidden, moving: !document.getElementById("pic").animationsPaused() })`));
  ok("Escape shuts it, the picture moving again", !shut.open && shut.hidden && shut.moving, shut);
  await key("keyDown", "z"); await sleep(500);
  const z = JSON.parse(await ev(`JSON.stringify({ on: (O => !!O && O.style.display !== "none")(document.getElementById("fire-over")) })`));
  await key("keyUp", "z"); await sleep(300);
  ok("Z held: the fire in 🔹", z.on, z);
  await key("keyDown", "x"); await sleep(80);
  const x = JSON.parse(await ev(`JSON.stringify({ swinging, tool: toolHeld() })`));
  await key("keyUp", "x"); await sleep(600);
  ok("X: the net in 🔸, held and swung", x.swinging === "net" && x.tool === "net", x);
  // the hands: 🔹's 🔥 in the left, 🔸's net in the right, the flame simmering by CSS (no SMIL in the friend); a knight put on gives
  // the 🎒 its sword and shield, in its hands' slots; taken off, they stay; 🔹's 🔥 chosen again shows over the knight's own
  const hands = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), q = sel => document.querySelector("#figure " + sel + ", #figure-far " + sel);
    const figText = () => [...document.querySelectorAll("#figure, #figure-far")].map(n => n.outerHTML).join("");
    state.body.facing = "front"; changed(); draw(); await w(300);
    const fire = q('[data-ability="fire"]'), net = q('[data-tool="net"]'), simmer = fire ? /simmer-flicker/.test(fire.outerHTML) : false, smil = /<animate|<set\\b/.test(figText());
    const keepC = state.costume; state.costume = { ...state.costume, kind: "knight" }; changed(); draw(); await w(300);
    const on = { pack: packList().map(o => o.id), slots: [state.pack.a, state.pack.b], drawn: !!q('[data-tool="sword"]') && !!q('[data-prop="shield"]'), inHand: toolInHand() };
    itemSet("a", "fire"); await w(150); const over = { L: !!q('[data-ability="fire"]'), shield: !!q('[data-prop="shield"]') };
    state.costume = keepC; changed(); draw(); await w(300);
    const off = { pack: packList().map(o => o.id), slots: [state.pack.a, state.pack.b] };
    state.pack = { ...state.pack, a: "fire", b: "net" }; changed(); draw(); await w(150);
    return JSON.stringify({ fire: !!fire, net: !!net, simmer, smil, on, over, off }); })()`));
  ok("in the hands: 🔥 in the left, simmering (CSS, no SMIL in the friend), the net in the right", hands.fire && hands.net && hands.simmer && !hands.smil, hands);
  ok("a knight put on: its sword and shield in the 🎒 and in its hands' slots, drawn, the sword the tool in hand", hands.on.pack.includes("sword") && hands.on.pack.includes("shield") && hands.on.slots[0] === "sword" && hands.on.slots[1] === "shield" && hands.on.drawn && hands.on.inHand === "sword", hands);
  ok("🔥 chosen for 🔹 shows in the left hand over the knight's own sword; the shield stays in the right", hands.over.L && hands.over.shield, hands);
  // the held items' own budget (the costume checks count the costume's look with the slots empty): 🫧 and 🔥 together at most 5 shapes
  const cost = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), keep = { ...state.pack };
    const shapes = () => ((document.getElementById("figure") || {}).outerHTML || "").match(/<(path|circle|ellipse|rect|polygon|polyline|line|use|image|text)[\\s>\\/]/g) || [];
    const n = {}; for (const f of ["front", "left", "right", "back"]) { state.body.facing = f;
      state.pack = { ...keep, a: "", b: "" }; changed(); await w(40); const empty = shapes().length;
      state.pack = { ...keep, a: "bubbles", b: "fire" }; changed(); await w(40); n[f] = shapes().length - empty; }
    state.pack = keep; state.body.facing = "front"; changed(); return JSON.stringify(n); })()`));
  ok("🫧 and 🔥 in the hands: at most 5 shapes more, in every facing", Object.values(cost).every(v => v <= 5), cost);
  // every 🎒 thing an item too: gold coins in 🔹, the chocolate bar in 🔸, held in those hands; each thing held still (no SMIL), at most 22 shapes
  const things = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), keep = { ...state.pack }, keepB = state.backpack;
    const fig = () => (document.getElementById("figure") || {}).outerHTML || "", far = () => (document.getElementById("figure-far") || {}).outerHTML || "";
    const count = t => (t.match(/<(path|circle|ellipse|rect|polygon|polyline|line|use|image|text)[\\s>\\/]/g) || []).length;
    const ids = [...new Set([...CHEST_GIFTS.map(([k]) => k), ...CARRY_KINDS])].filter(k => k !== "item");
    state.backpack = [...keepB, ...ids.map(id => ({ id, got: Date.now(), from: "chest" }))]; state.body.facing = "front";
    state.pack = { ...keep, a: "gold", b: "chocolate" }; changed(); await w(150);
    const shown = [...document.querySelectorAll(".items-tile")].length, gold = !!document.querySelector('#figure [data-thing="gold"], #figure-far [data-thing="gold"]'), choc = !!document.querySelector('#figure [data-thing="chocolate"], #figure-far [data-thing="chocolate"]');
    itemsShow(true); const tiles = [...document.querySelectorAll(".items-tile")].map(t => t.dataset.item); itemsShow(false);
    state.pack = { ...keep, a: "", b: "" }; changed(); await w(40); const empty = count(fig() + far());
    const over = {}; for (const id of ids) { state.pack = { ...keep, a: id, b: "" }; changed(); await w(25); const t = fig() + far(), n = count(t) - empty;
      if (n > 22 || /<animate|<set\\b|<filter|feGaussianBlur|Gradient/.test(t)) over[id] = n; }
    state.pack = keep; state.backpack = keepB; changed();
    return JSON.stringify({ gold, choc, tiles: tiles.length, every: ids.every(id => tiles.includes(id)), over }); })()`));
  ok("every 🎒 thing an item: gold coins in 🔹 and the chocolate bar in 🔸, held in those hands, and each on the screen", things.gold && things.choc && things.every, things);
  ok("each 🎒 thing held: still (no SMIL), no filter or gradient, at most 22 shapes", !Object.keys(things.over).length, things.over);
  // (ticket 690) riding, the reins win over 🔹 and 🔸, as a carried pot does: two reins facing us, no item in either hand
  const rode = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), keep = { ...state.pack }, q = sel => document.querySelectorAll("#figure " + sel + ", #figure-far " + sel).length;
    state.pack = { ...keep, a: "bubbles", b: "fire" }; state.body.facing = "front"; set("body", "horse", "ride"); changed(); await w(150);
    const out = { reins: q(".rein"), items: q("[data-ability]") + q("[data-tool]") + q("[data-thing]") };
    set("body", "horse", "none"); changed(); await w(60); out.after = q("[data-ability]"); state.pack = keep; changed();
    return JSON.stringify(out); })()`));
  ok("riding: two reins facing us, 🫧 and 🔥 put away; off the horse, back in the hands", rode.reins === 2 && rode.items === 0 && rode.after === 2, rode);
  ok("the knight taken off: the sword and shield stay, in the 🎒 and in the hands", hands.off.pack.includes("sword") && hands.off.pack.includes("shield") && hands.off.slots[1] === "shield", hands);
  const pad = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); touchWant(true); await w(400);
    const b7 = document.querySelector('#touchpad [data-b="7"]'), label = b7 ? b7.textContent : "";
    touchSet(state.controls.useA, true); await w(300); const fire = firePad; touchSet(state.controls.useA, false); await w(200);
    const b9 = document.querySelector('#touchpad [data-b="9"]'), start = b9 ? b9.textContent : "";
    touchSet(state.controls.items, true); await w(250); const opened = itemsOpen; touchSet(state.controls.items, false); await w(150);
    touchSet(state.controls.items, true); await w(250); const shut = !itemsOpen; touchSet(state.controls.items, false); await w(150);
    touchWant(false); await w(200);
    return JSON.stringify({ label, fire, start, opened, shut, items: DEFAULTS.controls.items, door: DEFAULTS.controls.door }); })()`));
  ok("the on-screen 🔸 shows the net, and the controller's 🔹 held breathes the fire in it", /🥅/.test(pad.label) && pad.fire, pad);
  ok("start is 🎒 (🚪 off it, Matthew's pick): it opens the screen, and shuts it", pad.items === 9 && pad.door === -1 && /🎒/.test(pad.start) && pad.opened && pad.shut, pad);
  const old = JSON.parse(await ev(`(async () => { loadSaved({ state: { controls: { bubbles: 3, fire: 5, tool: 2, door: 9 } } }); await new Promise(r => setTimeout(r, 200));
    const C = state.controls; return JSON.stringify({ useA: C.useA, useB: C.useB, items: C.items, door: C.door, gone: !("bubbles" in C) && !("fire" in C) && !("tool" in C), slots: [state.pack.a, state.pack.b] }); })()`));
  ok("an old save: its 🫧 and 🔥 buttons are 🔹's and 🔸's, 🫧 and 🔥 in them, and its 🚪 start 🎒's", old.useA === 3 && old.useB === 5 && old.items === 9 && old.door === -1 && old.gone && old.slots[0] === "bubbles" && old.slots[1] === "fire", old);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
