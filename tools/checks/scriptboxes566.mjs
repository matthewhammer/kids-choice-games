// (ticket 566, Matthew: "each script box can be either: baked-in JS, or hazel code boxes, or fumola code boxes (3-way chip per code
// box) ... we default to builtin JS, but there's a \"master toggle\" chip in the game script panel, at the top, that switches the
// code boxes all"; "let's have the jS versions show up as JS code, but read only. The hazel and fumola boxes are for editing.")
// 📜 Scripting's three-way boxes, in the trap room: to start, the master chip on JS and every room's box showing its JS, read-only,
// the game's own functions (their source as they run: TrapRoom's roomLeverFlip, Castle's pit lines, ...), and a red lever pulled
// runs the JS; the master chip on Hazel: every room an editor, the pull through Hazel; TrapRoom's own chip on Fumola: the master
// chip on none (rooms differ), TrapRoom's editor holds its Fumola module, Fumola loads and the pull runs through it; a broken
// Fumola text: said, and the pull back on the JS; the master chip on JS again: every room's JS. Each pull flips the left lever.
// Exits 1 on a failure.
//   node scriptboxes566.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 900)}`); if (!cond) bad++; };
// (in the page: the panel's look, and a pull of the left red lever with which engine ran it and whether the lever flipped)
const LOOK = `(() => { const P = document.getElementById("panel"), pressed = sel => [...P.querySelectorAll(sel + " button")].filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.dataset.engine);
  const room = r => { const s = P.querySelector('section[data-room="' + r + '"]'); if (!s) return null; const pre = s.querySelector("pre.script-js"), ta = s.querySelector("textarea.script-editor");
    return { chip: pressed('section[data-room="' + r + '"] .script-engines'), js: pre ? pre.textContent : null, text: ta ? ta.value : null }; };
  return JSON.stringify({ master: pressed(".script-master"), mixed: (P.querySelector(".script-mixed") || {}).textContent || "",
    fumola: (P.querySelector(".script-fumola-status") || {}).textContent || "", hazel: (P.querySelector(".script-status") || {}).textContent || "",
    rooms: Object.fromEntries(["Common", ...SCRIPT_ROOMS.map(r => r.name)].map(r => [r, room(r)])) }); })()`;
const PULL = `(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, K = castleOf(B), Z = hzCounters();
  const c = () => ({ js: (Z.js.Pull || []).length, hazel: (Z.hazel.Pull || []).length, fumola: ((Z.fumola || {}).Pull || []).length });
  const before = c(), l0 = leverDown(B, "L", 3, K.id); roomLeverPull("L"); await w(1700); const after = c();
  return JSON.stringify({ ran: Object.keys(after).filter(k => after[k] > before[k]), flipped: leverDown(B, "L", 3, K.id) !== l0 }); })()`;
const click = sel => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true; })()`);
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state = clone(DEFAULTS); state.music.mute = true;
    Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -200, figY: 80, things: [], castleLeverL_3N: true, castleLeverR_3N: true });
    changed(); await w(400);
    tab = TABS.findIndex(t => t[1] === "scripting"); showTab(); await w(400); return true; })()`);
  // ---- to start: JS everywhere, each room's own functions, read-only ----
  const L0 = JSON.parse(await ev(LOOK));
  ok("to start, the master chip is on JS, and so is every room's", JSON.stringify(L0.master) === '["js"]' && ["TrapRoom", "TreeRoom", "Square", "World", "Castle"].every(r => L0.rooms[r] && JSON.stringify(L0.rooms[r].chip) === '["js"]'), L0);
  ok("each room's box shows its JS, read-only (no editor): the game's own functions", ["TrapRoom", "TreeRoom", "Square", "World", "Castle"].every(r => L0.rooms[r].js && !L0.rooms[r].text),
    Object.fromEntries(Object.entries(L0.rooms).map(([k, v]) => [k, v && { js: v.js && v.js.slice(0, 40), text: v.text && v.text.slice(0, 40) }])));
  const J = L0.rooms;
  ok("... their source as they run: roomLeverFlip, hatchSet, leverPull, worldTarget, the castle's pit lines and wayOutOf",
    /function roomLeverFlip\(/.test(J.TrapRoom.js) && /function hatchSet\(/.test(J.TreeRoom.js) && /function leverPull\(/.test(J.Square.js)
    && /function worldTarget\(/.test(J.World.js) && /const pits =/.test(J.Castle.js) && /function wayOutOf\(/.test(J.Castle.js)
    && J.TrapRoom.js === (await ev(`String(roomLeverPull) + "\\n\\n" + String(roomLeverFlip) + "\\n\\n" + String(roomBoulderPull)`)), J.TrapRoom.js.slice(0, 200));
  const P0 = JSON.parse(await ev(PULL));
  ok("a red lever pulled runs the JS, and flips", JSON.stringify(P0.ran) === '["js"]' && P0.flipped, P0);
  // ---- the master chip on Hazel ----
  ok("the master chip's Hazel", await click('#panel .script-master button[data-engine="hazel"]'), "no button");
  let hz = false; for (let i = 0; i < 120 && !hz; i++) { await sleep(500); hz = await ev(`!!window.Hazel && scriptCompile().ready`); }
  const L1 = JSON.parse(await ev(LOOK));
  ok("on Hazel: every room an editor holding its Hazel rule, the master chip on Hazel", JSON.stringify(L1.master) === '["hazel"]'
    && ["TrapRoom", "TreeRoom", "Square", "World", "Castle"].every(r => L1.rooms[r].text && /on_event/.test(L1.rooms[r].text) && !L1.rooms[r].js), L1);
  ok("Hazel loads, and the program is fine", hz && /is fine/.test(L1.hazel), L1.hazel);
  const P1 = JSON.parse(await ev(PULL));
  ok("the pull runs through Hazel, and flips", JSON.stringify(P1.ran) === '["hazel"]' && P1.flipped, P1);
  // ---- TrapRoom alone on Fumola ----
  ok("TrapRoom's own chip on Fumola", await click('#panel section[data-room="TrapRoom"] .script-engines button[data-engine="fumola"]'), "no button");
  let fm = false; for (let i = 0; i < 120 && !fm; i++) { await sleep(500); fm = await ev(`fumolaReady() && fumolaCompile().ready`); }
  await sleep(700);
  const L2 = JSON.parse(await ev(LOOK));
  ok("rooms differ: the master chip on none, and said", JSON.stringify(L2.master) === "[]" && /differ/.test(L2.mixed), [L2.master, L2.mixed]);
  ok("TrapRoom's editor holds its Fumola module; the other rooms stay on Hazel", JSON.stringify(L2.rooms.TrapRoom.chip) === '["fumola"]' && /module TrapRoom/.test(L2.rooms.TrapRoom.text || "")
    && JSON.stringify(L2.rooms.World.chip) === '["hazel"]', { trap: L2.rooms.TrapRoom, world: L2.rooms.World.chip });
  ok("Fumola loads, and its rules are fine", fm && /are fine/.test(L2.fumola), L2.fumola);
  const P2 = JSON.parse(await ev(PULL));
  ok("the pull runs through Fumola, and flips", JSON.stringify(P2.ran) === '["fumola"]' && P2.flipped, P2);
  // ---- a broken Fumola text: said, and the room back on its JS ----
  await ev(`(() => { const ta = document.querySelector('#panel section[data-room="TrapRoom"] textarea.script-editor'); ta.value = "module TrapRoom { this is not Fumola }"; ta.dispatchEvent(new Event("input")); return true; })()`);
  await sleep(1200);
  const L3 = JSON.parse(await ev(LOOK)), P3 = JSON.parse(await ev(PULL));
  ok("a Fumola text with an error: said in Fumola's status", /error/.test(L3.fumola), L3.fumola);
  ok("... and the pull runs the JS, and flips", JSON.stringify(P3.ran) === '["js"]' && P3.flipped, P3);
  ok("the edit is kept in the state, the Hazel text untouched", (await ev(`state.scripts.fumola.rooms.TrapRoom`)) === "module TrapRoom { this is not Fumola }" && /on_event/.test(await ev(`state.scripts.rooms.TrapRoom`)), "");
  // ---- the master chip on JS again ----
  ok("the master chip's JS", await click('#panel .script-master button[data-engine="js"]'), "no button");
  await sleep(300);
  const L4 = JSON.parse(await ev(LOOK)), P4 = JSON.parse(await ev(PULL));
  ok("every room back on JS, its own chip forgotten", JSON.stringify(L4.master) === '["js"]' && JSON.stringify(L4.rooms.TrapRoom.chip) === '["js"]' && !!L4.rooms.TrapRoom.js && JSON.stringify(await ev(`JSON.stringify(state.scripts.engines)`)) === JSON.stringify("{}"), L4.master);
  ok("the pull runs the JS, and flips", JSON.stringify(P4.ran) === '["js"]' && P4.flipped, P4);
  // (the sums' kinds for node, where the game's lists are not loaded: the same as the game's own)
  const K = JSON.parse(await ev(`JSON.stringify({ places: SCRIPT_PLACES_KNOWN.join() === PLACES.map(p => p[0]).join(), rooms: SCRIPT_ROOMS_KNOWN.join() === Object.keys(ROOM_KINDS).join(),
    exits: [...new Set(Object.values(ROOM_KINDS).map(R => R.exits))].every(x => SCRIPT_EXITS.includes(x)) })`));
  ok("the sums' kinds held for node are the game's own (PLACES, ROOM_KINDS and their exits)", K.places && K.rooms && K.exits, K);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
