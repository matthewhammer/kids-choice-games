// (ticket 365, Matthew: "castle designer FS mode -- after we do knowlling on all panels") 🏰 The castle designer full screen, at
// 1600x1000 in N's castle's room 2: its ⛶ chip opens it over the background designer's columns; only 🏰 the castles left of the game,
// every room a box of its own in order (its picture, named by its number and kind, the room you are in marked), the map open and big,
// the game in the card on the right; a room tapped on the map marks its box and brings it into view; ✕ goes back to the side panel
// (one room's box again, the game home); opened from the background designer, Escape goes back to it, then to the game. Exits 1 on
// a failure.
//   node castle365.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), cls = () => [...document.body.classList].filter(c => /big/.test(c)).sort().join(" ");
    state = clone(DEFAULTS); state.music.mute = true; state.world.at = null; const B = state.background; B.kind = "castleroom"; B.castle = "N"; B.castleRoom = 2; changed();
    tab = TABS.findIndex(t => t[1] === "background"); showTab(); await w(400);
    const P = document.getElementById("panel"), vis = e => !!e && e.offsetParent !== null, out = {};
    const rooms = () => [...P.querySelectorAll('[data-group^="castleRoomBox"]')].filter(vis);
    out.side = rooms().map(g => g.dataset.group);
    const chip = P.querySelector("button.castlebig:not(.castle-bar-chip)"); out.chip = chip ? [chip.textContent, vis(chip)] : null;
    chip.click(); await w(1500);
    out.open = cls(); out.boxes = [...P.querySelectorAll(".bg-boxes > section")].filter(vis).map(b => b.dataset.box || "?");
    const K = castleOf(B); out.nRooms = K.rooms.length;
    out.rooms = rooms().map(g => ({ key: g.dataset.group, here: g.classList.contains("here"), cap: g.querySelector(":scope > .cap").textContent, pic: ((g.querySelector(".room-pic") || {}).src || "").split("/").pop() }));
    out.want = K.rooms.map((st, i) => ({ key: "castleRoomBox" + (i + 1) + "N", cap: (i + 1) + " · " + roomLabel(st), pic: "castleroom--" + st + ".webp" }));
    const map = P.querySelector(".designer .map"); out.map = map ? Math.round(map.getBoundingClientRect().height) : 0;
    out.gameIn = !!document.querySelector(".bg-view-pic .pic-box");
    out.bar = [...P.querySelectorAll(":scope > .ctl > button")].filter(vis).map(b => b.textContent);
    const cy = map && map._cyreg && map._cyreg.cy; out.cy = !!cy;
    if (cy) { cy.getElementById("r4").emit("tap"); await w(800); }
    const g4 = P.querySelector('[data-group="castleRoomBox4N"]'), b4 = g4 && g4.getBoundingClientRect();
    out.picked = [...P.querySelectorAll(".picked")].map(x => x.dataset.group); out.inView = !!b4 && b4.top < innerHeight && b4.bottom > 0;
    P.querySelector(":scope > .ctl > button.castle-bar-chip").click(); await w(600);
    out.back = cls(); out.home = !!document.querySelector(".pic-area .pic-box"); out.sideAfter = rooms().map(g => g.dataset.group);
    out.capsAfter = [...P.querySelectorAll('[data-group^="castleRoomBox"] > .cap')].map(c => c.textContent).slice(0, 2);
    P.querySelector(":scope > .ctl > button.bgbig").click(); await w(600); out.bg = cls();
    P.querySelector("button.castlebig:not(.castle-bar-chip)").click(); await w(1000); out.open2 = cls();
    out.bar2 = (P.querySelector(":scope > .ctl > button.castle-bar-chip") || {}).textContent;
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); await w(600); out.esc1 = cls();
    out.bgBoxes = [...P.querySelectorAll(".bg-boxes > section")].filter(vis).length;
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); await w(600); out.esc2 = cls();
    state = clone(DEFAULTS); changed(); return JSON.stringify(out); })()`));
  console.log("  " + JSON.stringify(r).slice(0, 1600));
  ok("side panel: only the room you are in has its box", r.side.length === 1 && r.side[0] === "castleRoomBox2N", r.side);
  ok("the castle designer's ⛶ chip shows", r.chip && r.chip[1] && /full screen/.test(r.chip[0]), r.chip);
  ok("⛶ opens the castle designer full screen (over the background designer's columns)", r.open === "bg-big castle-big designer-big", r.open);
  ok("only 🏰 the castles left of the game", r.boxes.length === 1 && r.boxes[0] === "castles", r.boxes);
  ok("every room a box of its own, in order", r.rooms.length === r.nRooms && r.rooms.every((x, i) => x.key === r.want[i].key), [r.rooms.map(x => x.key), r.nRooms]);
  ok("each room's box named by its number and kind", r.rooms.every((x, i) => x.cap === r.want[i].cap), r.rooms.map(x => x.cap));
  ok("each room's box shows its kind's picture", r.rooms.every((x, i) => x.pic === r.want[i].pic), r.rooms.map(x => x.pic));
  ok("the room you are in marked (2), no other", r.rooms.filter(x => x.here).map(x => x.key).join() === "castleRoomBox2N", r.rooms.filter(x => x.here));
  ok("the map open and big (400 px or more)", r.map >= 400, r.map);
  ok("the game in the card on the right", r.gameIn, r);
  ok("the bar's one chip: ✕ back to the game", r.bar.length === 1 && /✕ back to the game/.test(r.bar[0]), r.bar);
  ok("a room tapped on the map: its box marked and in view", r.cy && r.picked.join() === "castleRoomBox4N" && r.inView, [r.cy, r.picked, r.inView]);
  ok("✕ back: the side panel, one room's box, its own name, the game home", r.back === "" && r.home && r.sideAfter.join() === "castleRoomBox2N" && /N's castle: room/.test(r.capsAfter[0] || ""), r);
  ok("from the background designer: ✕ says back to it, Escape goes back to it (all its boxes)", r.bg === "bg-big designer-big" && r.open2 === "bg-big castle-big designer-big" && /background designer/.test(r.bar2 || "") && r.esc1 === "bg-big designer-big" && r.bgBoxes > 1, r);
  ok("and Escape again, back to the game", r.esc2 === "", r.esc2);
  ok("no error thrown", errs.length === 0, errs);
} catch (e) { ok("ran", false, String(e)); }
process.exit(bad ? 1 : 0);
