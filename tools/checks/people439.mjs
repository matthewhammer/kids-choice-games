// (ticket 439, Matthew: "System for creating people templates, and multiple people. Use the new 'multi-world' system you
// created as the inspiration for its functions -- we want a single .json file for MUDU to have a list of people, some of
// whom are marked as templates ... any person can become a template by toggling it. As a template, we can create a new
// instance ('knight 1' versus 'knight 2') and style them differently, and place them into the game.") In the 👥 People tab:
// one person to start, the friend; made ⭐ a template as a knight, two new people from it are "knight 1" and "knight 2"; at
// the lake the two not being dressed stand where they were left, drawn, apart, among the scene's objects, their ids their
// own; going to knight 1 dresses them (their red arms) and leaves knight 2 standing; ✖ out takes one out of the places, 🗑️
// out of the game; the saved state holds them all and a Load keeps them. Exits 1 on a failure.
//   node people439.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    state = clone(DEFAULTS); state.music.mute = true; state.world.at = null; state.background.kind = "lake"; changed(); await w(400);   // (from the start: a profile may hold an autosave)
    tab = TABS.findIndex(t => t[0] === "👥 People"); showTab(); await w(200);
    const chips = () => [...document.querySelectorAll("#panel .person-chip")].map(b => b.textContent + (b.getAttribute("aria-pressed") === "true" ? " *" : ""));
    out.start = { chips: chips(), hint: !!document.querySelector("#panel .person-new-row .hint") && !document.querySelector("#panel .person-new") };
    set("costume", "kind", "knight"); state.person.name = "knight"; personSetTemplate(state.person.id, true); await w(150);
    out.new1 = personNew("p1"); await w(150); set("costume", "knightA", "#8a2b2b"); await w(100);
    out.new2 = personNew("p1"); await w(150); set("costume", "knightA", "#2e7d32"); await w(1500);
    out.names = peopleAll().map(p => personTitle(p)); out.me = state.person.name; out.from = Object.values(state.peopleAway).map(p => p.from);
    out.chips = chips();
    const placed = () => [...document.querySelectorAll("#pic g.person-placed")];
    out.placed = placed().map(g => g.getAttribute("data-person")); out.xs = Object.values(state.peopleAway).map(p => p.place && p.place.x);
    out.inScene = placed().every(g => !!g.closest("#pic"));
    out.shirtIds = document.querySelectorAll('[id="pat-shirt"]').length;
    out.svgIds = (() => { const ids = [...document.querySelectorAll("#pic [id]")].map(e => e.id), seen = new Set(), dup = []; for (const i of ids) { if (seen.has(i)) dup.push(i); seen.add(i); } return dup.slice(0, 5); })();
    // (going to knight 1: their red arms on the friend; knight 2 left standing at the lake)
    personSwitch("p2"); await w(1500);
    out.after = { me: state.person.name, arms: state.costume.knightA, k2: state.peopleAway.p3 && !!state.peopleAway.p3.place, placed: placed().map(g => g.getAttribute("data-person")) };
    // (out of the places; out of the game)
    personPlace("p1", null); await w(300); out.outPlaced = placed().map(g => g.getAttribute("data-person"));
    personDrop("p1"); await w(200); out.dropped = peopleAll().map(p => personTitle(p));
    // (the saved state holds them; a Load-style merge keeps them)
    const saved = JSON.parse(JSON.stringify(state)), next = clone(DEFAULTS);
    for (const k of Object.keys(DEFAULTS)) next[k] = { ...DEFAULTS[k], ...(saved[k] || {}) };
    out.loaded = { me: next.person.name, away: Object.values(next.peopleAway).map(p => p.name) };
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("to start: one person, the friend, being dressed; no new person without a template", r.start.chips.length === 1 && r.start.chips[0] === "🧍 the friend *" && r.start.hint, r.start);
  ok("from the knight made a template: knight 1 and knight 2, made from it, knight 2 being dressed", JSON.stringify(r.names) === '["knight","knight 1","knight 2"]' && r.me === "knight 2" && r.from.every(f => f === null || f === "p1"), [r.names, r.me, r.from]);
  ok("at the lake, the two not being dressed stand there, apart, in the scene", r.placed.length === 2 && new Set(r.xs).size === 2 && r.inScene, [r.placed, r.xs]);
  ok("their figures' ids are their own (one pat-shirt, no id twice)", r.shirtIds === 1 && !r.svgIds.length, [r.shirtIds, r.svgIds]);
  ok("going to knight 1 dresses them (red arms) and leaves knight 2 standing there", r.after.me === "knight 1" && r.after.arms === "#8a2b2b" && r.after.k2 && r.after.placed.includes("p3"), r.after);
  ok("✖ out takes one out of the places; 🗑️ out of the game", !r.outPlaced.includes("p1") && JSON.stringify(r.dropped) === '["knight 1","knight 2"]', [r.outPlaced, r.dropped]);
  ok("the saved state holds them, and a Load keeps them", r.loaded.me === "knight 1" && JSON.stringify(r.loaded.away) === '["knight 2"]', r.loaded);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
