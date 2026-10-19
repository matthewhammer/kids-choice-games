// (ticket 369) Every drawing's markup well formed: the cave's crystals and light from the falls were written cx=""… and
// points=""… since 0.0.249, which the page's own parser quietly drops (the glows drawn at 0, the light beams missing
// corners) and which stopped cull261 (the picture saved as an SVG file could not be read back as one). Every place at its
// defaults, every castle room, every tree room, every thing put in the empty room, then the page with every 🔬 overlay
// on: no attribute name the page had to make up from broken markup, and the picture, saved, reads back as SVG.
// Exits 1 on a failure.
//   node markup369.mjs <devtools port> <url>
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
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null;
    const badIn = root => { const bad = []; for (const e of root.querySelectorAll("*")) for (const a of e.attributes) if (!/^[A-Za-z_:][-A-Za-z0-9_:.]*$/.test(a.name)) bad.push(e.tagName + " " + a.name.slice(0, 30) + " in " + ((e.closest("[data-obj]") || { dataset: {} }).dataset.obj || "?")); return bad; };
    const xmlErr = () => { const e = new DOMParser().parseFromString(new XMLSerializer().serializeToString(pic), "image/svg+xml").querySelector("parsererror"); return e ? e.textContent.slice(0, 160) : null; };
    const out = {}, look = async (label, set) => { set(); changed(); await w(250); const b = badIn(pic), x = xmlErr(); if (b.length || x) out[label] = { bad: b.slice(0, 3), xml: x }; };
    const places = PLACES.map(p => p[0]).filter(k => k !== "none");
    for (const kd of places) await look(kd, () => { B.kind = kd; B.things = []; });
    B.kind = "castleroom"; changed(); await w(200); const K = castleOf(B), rooms = CASTLE_ROOM_CHOICES.map(x => Array.isArray(x) ? x[0] : x);
    for (const rk of rooms) await look("castle room " + rk, () => { B.kind = "castleroom"; B["castleRoom6" + K.id] = rk; B["castleRooms" + K.id] = 6; B.castleRoom = 6; });
    for (const n of [1, 2, 3, 4]) await look("tree room " + n, () => { B.kind = "treeroom"; B.inside = n; });
    B.kind = "emptyroom"; changed(); await w(300); const kinds = Object.keys(THING_KINDS);
    await look("every thing", () => { B.things = kinds.map((kind, i) => ({ kind, x: -400 + (i % 10) * 90, z: SCENE.ground + 20 + Math.floor(i / 10) * 40, seed: 40 + i, size: 100, ...structuredClone(THING_DEFAULTS[kind] || {}) })); });
    Object.assign(state.access, INSPECT_ON); changed(); await w(400); const page = badIn(document.body);
    B.things = []; changed();
    return JSON.stringify({ places: places.length, rooms: rooms.length, things: kinds.length, out, page: page.slice(0, 5) }); })()`));
  console.log(`  ${r.places} places, ${r.rooms} castle rooms, 4 tree rooms, ${r.things} things`);
  ok("every drawing's markup well formed: no attribute made up from broken markup, the picture reads back as SVG", !Object.keys(r.out).length, r.out);
  ok("and the page with every 🔬 overlay on", !r.page.length, r.page);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
