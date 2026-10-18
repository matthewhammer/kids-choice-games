// (ticket 271, Matthew: "the trap room pit style is a property of the room number, not all pit rooms. also, the chip
// doesn't seem to affect it immediately.") N's castle with two trap rooms (3 and 6): room 3's pits set square and
// triangle, room 6's left round; each drawn its own way; a chip on room 3's first pit, pressed in the room, redraws it at
// once; a save with the old castle-wide setting gives it to every room. Exits 1 on a failure.
//   node pits271.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null;
    const shapes = () => [...bgShown.node.querySelectorAll(".portal[data-pit]")].map(p => p.dataset.shape);
    Object.assign(B, { kind: "castleroom", castle: "N", castleLeverL_3N: false, castleLeverR_3N: false, castleLeverL_6N: false, castleLeverR_6N: false, castleRoomsN: 6, castleRoom6N: "trap", castlePit1_3N: "square", castlePit2_3N: "triangle", figX: 0, figY: 60, things: [] });
    B.castleRoom = 3; changed(); await w(500); const three = shapes();
    B.castleRoom = 6; changed(); await w(500); const six = shapes();
    // (in room 3, its chip pressed: the Background tab's room 3 box)
    B.castleRoom = 3; changed(); await w(300); tab = TABS.findIndex(t => t[1] === "background"); showTab(); changed(); await w(400);
    const chip = [...document.querySelectorAll("#panel button")].find(b => b.closest(".ctl") && b.closest(".ctl").dataset.key === "castlePit1_3N" && /circle/.test(b.textContent));
    if (chip) chip.click(); await w(300); const after = shapes();
    // (an old save: the castle-wide shape, to each room)
    const next = { background: { ...clone(DEFAULTS.background) } }; upgradePitShapes(next, { background: { castlePitShape1N: "triangle" } });
    return JSON.stringify({ three, six, chip: !!chip, after, up: [next.background.castlePit1_3N, next.background.castlePit1_6N, next.background.castlePit2_3N] }); })()`));
  console.log(`  room 3's pits ${r.three}, room 6's ${r.six}; room 3's first chip (circle) pressed: ${r.after}; an old save's castle-wide triangle: ${r.up}`);
  ok("room 3's pits square and triangle, room 6's (also a trap room) round: each its own", r.three.join() === "square,triangle" && r.six.join() === "circle,circle", r);
  ok("a chip in room 3 redraws it at once", r.chip && r.after.join() === "circle,triangle", r);
  ok("an old save's castle-wide shape given to each room", r.up[0] === "triangle" && r.up[1] === "triangle" && r.up[2] === "circle", r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
