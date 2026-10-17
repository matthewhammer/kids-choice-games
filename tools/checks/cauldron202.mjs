// (ticket 202, Matthew) A cheaper cauldron: its two fume plumes each one
// curvy path, a fat stroke in its colour, turning by one animation; used
// for all the cauldrons put in a place when there are two or more, or one
// on a slow computer; the witch's woods' own cauldron as it was. Exits 1 on
// a failure.
//   node cauldron202.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 700)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world = clone(DEFAULTS.world); worldEnter("3,3");
    const put = async k => { B.things = [...Array(k)].map((_, i) => ({ kind: "cauldron", x: -260 + i * 170, z: 360, seed: 30 + i, size: 100 })); changed(); await w(500); };
    const look = () => [...document.querySelectorAll('#bg [data-drag^="thing:"]')].map(el => ({ full: el.querySelectorAll("[data-helix]").length, plumes: el.querySelectorAll('path > animate[attributeName="d"]').length, moving: thingMoving(el) }));
    await put(1); const one = look();
    await put(3); const three = look();
    // (ticket 206: no more choosing for them; three upgraded stay fancy, on a slow computer too)
    B.things = [0, 1, 2].map(i => ({ kind: "cauldron", x: -260 + i * 170, z: 360, seed: 30 + i, size: 100, fumes: "fancy" })); thingFps = 30; changed(); await w(500); const fancy3 = look(); thingFps = null; changed();
    // (ticket 204) each cauldron's own 💨 fumes: fancy among three, simple alone; and chosen in its row
    B.things = [0, 1, 2].map(i => ({ kind: "cauldron", x: -260 + i * 170, z: 360, seed: 30 + i, size: 100, fumes: i === 1 ? "fancy" : "auto" })); changed(); await w(500); const mixed = look();
    B.things = [{ kind: "cauldron", x: 0, z: 360, seed: 30, size: 100, fumes: "simple" }]; changed(); await w(500); const simple = look();
    B.things = [{ kind: "cauldron", x: 0, z: 360, seed: 30, size: 100, ...structuredClone(THING_DEFAULTS.cauldron) }]; thingGroup = "magic"; tab = TABS.findIndex(t => t[1] === "world"); showTab(); changed(); await w(500);
    const row = document.querySelector(".cross-list .row"), names = row ? [...row.querySelectorAll("button")].map(b => b.textContent) : [];
    const sb = row && [...row.querySelectorAll("button")].find(b => b.textContent === "✨ fancy"); if (sb) sb.click(); await w(500);
    const picked = { names, fumes: B.things[0].fumes, drawn: look() };
    // (ticket 206) her own cauldron, in her woods and her hut: simple, and upgraded in 🏞️ Background
    const own = () => { const c = document.querySelector('#bg [data-obj="cauldron"]'); return c ? { full: c.querySelectorAll("[data-helix]").length, plumes: c.querySelectorAll('path[id^="fume-"] > animate[attributeName="d"]').length } : null; };
    B.things = []; worldEnter("1,1"); await w(500); const witch = own();
    tab = TABS.findIndex(t => t[1] === "background"); showTab(); await w(300);
    // (no things here: the only ✨ fancy button is hers)
    const fb = [...document.querySelectorAll("button")].find(b => b.textContent === "✨ fancy"), label = document.body.textContent.includes("💨 her cauldron's fumes");
    if (fb) fb.click(); await w(600); const witchFancy = { found: !!fb, label, set: B.cauldronFumes, ...own() };
    B.cauldronFumes = "simple"; Object.assign(B, { kind: "witchroom" }); changed(); await w(600); const hut = own();
    B.cauldronFumes = "fancy"; changed(); await w(600); const hutFancy = own(); B.cauldronFumes = "simple"; changed();
    tab = TABS.findIndex(t => t[1] === "body"); showTab();
    return JSON.stringify({ one, three, fancy3, mixed, simple, picked, witch, witchFancy, hut, hutFancy }); })()`));
  ok("(ticket 206) one cauldron: simple, two plumes turning, under thirty moving parts", r.one.length === 1 && r.one[0].full === 0 && r.one[0].plumes >= 2 && r.one[0].moving < 30, r.one);
  ok("three cauldrons: each drawn cheap, two plumes turning, under thirty moving parts", r.three.length === 3 && r.three.every(c => c.full === 0 && c.plumes >= 2 && c.moving < 30), r.three);
  ok("three upgraded to ✨ fancy, on a computer measuring 30 frames a second: all three still fancy (the spiral)", r.fancy3.length === 3 && r.fancy3.every(c => c.full > 30 && c.moving > 150), r.fancy3);
  ok("(ticket 204) three cauldrons, the middle one's fumes ✨ fancy: it the spiral, the other two simple", r.mixed.length === 3 && r.mixed[1].full > 30 && r.mixed[0].full === 0 && r.mixed[2].full === 0, r.mixed);
  ok("one cauldron, its fumes simple: cheap", r.simple.length === 1 && r.simple[0].full === 0 && r.simple[0].plumes >= 2, r.simple);
  ok("in its row: 💨 fumes simple, ✨ fancy; fancy tapped, drawn as the spiral", ["simple", "✨ fancy"].every(x => r.picked.names.includes(x)) && !r.picked.names.includes("auto") && r.picked.fumes === "fancy" && r.picked.drawn.length === 1 && r.picked.drawn[0].full > 30, r.picked);
  ok("(ticket 206) the witch's woods' own cauldron: simple", !!r.witch && r.witch.full === 0 && r.witch.plumes >= 2, r.witch);
  ok("and ✨ fancy tapped in 🏞️ Background (💨 her cauldron's fumes): the spiral", r.witchFancy.found && r.witchFancy.label && r.witchFancy.set === "fancy" && r.witchFancy.full > 30, r.witchFancy);
  ok("her hut's cauldron: simple, and fancy when upgraded", !!r.hut && r.hut.full === 0 && r.hut.plumes >= 2 && !!r.hutFancy && r.hutFancy.full > 30, { hut: r.hut, hutFancy: r.hutFancy });
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
