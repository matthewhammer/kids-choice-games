// (ticket 499, Matthew: "new costume to add -- dragon." "look at Lego castles and knights for inspiration." "wings, tail and
// optional dragon breath"; on the mock-up, mockups/dragon-fire.html: "dragon tail spikes should be facing upward, not
// downward :)") The 🐉 dragon, an animal suit beside the wolf: on the hood two horns, spines, teeth, slit-pupilled eyes and
// nostrils (no whiskers); scales; a plated belly; claws on the paws and feet; two bat wings (in profile the near one bigger;
// flapping, open and still, or folded; flapping with an LFO when one is chosen); a long tail, every spike on it standing up,
// a spade at its tip. Toward us, from behind and from the side each drawn for itself (only moved into place, never scaled
// or turned from another view); every pose and animation drawn, nothing undefined; its four colours each its own chooser,
// shown only for the dragon. Exits 1 on a failure.
//   node dragon499.mjs <devtools port> <url>
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
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { v: {}, poses: {}, spikes: {} };
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "emptyroom", things: [], seat: null }); state.body.sit = false;
    set("body", "pose", "stand"); state.body.anim = "none"; set("costume", "kind", "dragon"); changed(); await w(100);
    const C = state.costume, fig = () => document.getElementById("figure"), all = s => [...fig().querySelectorAll(s)];
    const D = DEFAULTS.costume; out.defaults = [D.dragonScales, D.dragonBelly, D.dragonWings, D.dragonHorns, D.dragonWingsHow, D.dragonWingLfo];
    out.chooser = TABS.find(t => t[1] === "costume")[2].find(c => c[1] === "kind")[3].some(([v, l]) => v === "dragon" && l.startsWith("🐉"));
    // (a spike: base, apex, base; it stands up when its apex is above the middle of its base, in the friend's own units)
    const spikesUp = () => all('[data-dragon="spikes"]').flatMap(p => [...p.getAttribute("d").matchAll(/M(\\S+) (\\S+) L(\\S+) (\\S+) L(\\S+) (\\S+) Z/g)]
      .map(m => m.slice(1).map(Number)).map(([x0, y0, x1, y1, x2, y2]) => y1 < (y0 + y2) / 2 - 2));
    set("costume", "dragonWingsHow", "open");
    for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(80); const m = fig().innerHTML, head = all('[data-part="head"]').map(g => g.innerHTML).join("");
      const wings = all('[data-dragon="wing"]'), up = spikesUp();
      out.v[facing] = { wings: wings.length, area: wings.map(g => { const b = g.getBBox(); return Math.round(b.width * b.height); }),
        moved: wings.every(g => /^translate\\([^)]*\\)$/.test(g.getAttribute("transform"))), wingD: wings.map(g => g.querySelector("path").getAttribute("d")).join("|"),
        tail: all('[data-dragon="tail"]').length, tailD: (all('[data-dragon="tail"]')[0] || { getAttribute: () => "" }).getAttribute("d"), spade: all('[data-dragon="spade"]').length,
        spikes: up.length, spikesUp: up.every(Boolean), horns: (head.match(/data-dragon="horn"/g) || []).length, hornD: (head.match(/data-dragon="horn" d="([^"]+)"/) || [])[1],
        spines: head.includes('data-dragon="spines"'), teeth: head.includes('data-dragon="teeth"'), slits: (head.match(/rx="1.8" ry="6.6" fill="#111"/g) || []).length,
        whiskers: head.includes("M86 44 L60 40"), plates: m.includes('data-dragon="plates"'), scales: !!document.querySelector("#pic #pat-fur path"),
        hornColour: (m.match(new RegExp('fill="' + C.dragonHorns + '"', "g")) || []).length, nan: /NaN|undefined/.test(m) }; }
    // (sitting too: its tail's spikes still up)
    state.body.facing = "right"; set("body", "pose", "sit"); changed(); await w(80); out.spikes.sit = spikesUp(); set("body", "pose", "stand");
    // the colours: each its own, each where it belongs
    state.body.facing = "front"; Object.assign(C, { dragonScales: "#2f6db5", dragonBelly: "#f9a8d4", dragonWings: "#7b3f8c", dragonHorns: "#e0b030" }); changed(); await w(80);
    const m2 = fig().innerHTML;
    out.colours = { scales: (document.querySelector("#pic #pat-fur rect") || { getAttribute: () => "" }).getAttribute("fill"), belly: m2.includes('fill="#f9a8d4"'),
      wings: all('[data-dragon="wing"] path')[0].getAttribute("fill"), spikes: (all('[data-dragon="spikes"]')[0] || { getAttribute: () => "" }).getAttribute("fill"),
      teeth: (all('[data-dragon="teeth"]')[0] || { getAttribute: () => "" }).getAttribute("fill"), handClaws: all('[data-part="hands"]').some(g => g.innerHTML.includes('fill="#e0b030"')),
      feetClaws: all('[data-part="feet"]').some(g => g.innerHTML.includes('fill="#e0b030"')) };
    Object.assign(C, { dragonScales: D.dragonScales, dragonBelly: D.dragonBelly, dragonWings: D.dragonWings, dragonHorns: D.dragonHorns });
    // the wings: flapping (their own slow beat, or an LFO's), open and still, folded
    const anims = () => all('[data-dragon="wing"] animateTransform').map(a => a.getAttribute("dur"));
    set("costume", "dragonWingsHow", "flap"); set("costume", "dragonWingLfo", "none"); changed(); await w(80); out.flap = anims();
    set("costume", "dragonWingLfo", "B"); changed(); await w(80); out.flapB = anims(); out.lfoB = lfoNow("B").dur.toFixed(4) + "s";
    out.follows = lfoFollowers().some(([L, name]) => L === "B" && /dragon/.test(name));
    set("costume", "dragonWingLfo", "none"); set("costume", "dragonWingsHow", "open"); changed(); await w(80); out.open = anims(); const openD = all('[data-dragon="wing"] path')[0].getAttribute("d");
    set("costume", "dragonWingsHow", "folded"); changed(); await w(80); out.folded = anims(); out.foldedDiffers = all('[data-dragon="wing"] path')[0].getAttribute("d") !== openD;
    set("costume", "dragonWingsHow", "flap");
    // every pose and animation, every facing: drawn, with its wings and tail, nothing undefined
    for (const pose of ["stand", "sit", "meditate", "dance", "hug", "lie"]) for (const facing of ["front", "left", "right", "back"]) {
      set("body", "pose", pose); state.body.facing = facing; changed(); await w(50); const m = fig().innerHTML;
      out.poses[pose + "/" + facing] = m.length > 1000 && all('[data-dragon="wing"]').length === 2 && all('[data-dragon="tail"]').length === 1 && !/NaN|undefined/.test(m); }
    set("body", "pose", "stand");
    for (const anim of ["walk", "run", "crawl", "crouch", "jump", "swim"]) for (const facing of ["front", "right", "back"]) {
      state.body.facing = facing; state.body.anim = anim; changed(); await w(120); const m = fig().innerHTML;
      out.poses[anim + "/" + facing] = m.length > 1000 && all('[data-dragon="tail"]').length === 1 && !/NaN|undefined/.test(m); }
    state.body.anim = "none"; state.body.facing = "front"; changed();
    // the tab: the dragon's rows only for the dragon; the other animals' colours not for it, its eye colour yes
    tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(250);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    const keys = ["dragonScales", "dragonBelly", "dragonWings", "dragonHorns", "dragonWingsHow", "dragonWingLfo", "fur", "marks", "belly", "accent", "eyes"];
    out.rowsDragon = keys.map(k => shown(k) ? 1 : 0).join("");
    set("costume", "dragonWingsHow", "folded"); changed(); await w(150); out.rowsFolded = shown("dragonWingLfo") ? 1 : 0;
    set("costume", "dragonWingsHow", "flap"); set("costume", "kind", "wolf"); changed(); await w(150); out.rowsWolf = keys.map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify({ defaults: r.defaults, flap: r.flap, flapB: r.flapB, lfoB: r.lfoB, rows: [r.rowsDragon, r.rowsWolf] })}`);
  const V = r.v, views = Object.values(V);
  ok("🐉 dragon is among the costumes", r.chooser, r.chooser);
  ok("its colours start as the mock-up's, the wings flapping at their own slow beat", r.defaults.join() === "#3f8f4a,#e9d27a,#d0453a,#f4ecd6,flap,none", r.defaults);
  ok("two wings and one tail with a spade, every facing; nothing undefined", views.every(v => v.wings === 2 && v.tail === 1 && v.spade === 1 && !v.nan), V);
  ok("every spike on the tail stands up (Matthew: \"facing upward, not downward\"), every facing and sitting", views.every(v => v.spikes >= 8 && v.spikesUp) && r.spikes.sit.length >= 8 && r.spikes.sit.every(Boolean), { V, sit: r.spikes.sit });
  ok("in profile the near wing is bigger than the far one", V.left.area[1] > V.left.area[0] && V.right.area[1] > V.right.area[0], [V.left.area, V.right.area]);
  ok("each view its own drawing: wings, tail and horns differ toward us, from behind and from the side, each only moved into place",
     V.front.wingD !== V.back.wingD && V.front.wingD !== V.right.wingD && V.back.wingD !== V.right.wingD && new Set([V.front.tailD, V.back.tailD, V.right.tailD]).size === 3 &&
     new Set([V.front.hornD, V.back.hornD, V.right.hornD]).size === 3 && views.every(v => v.moved), { front: V.front.hornD, back: V.back.hornD, side: V.right.hornD });
  ok("the hood: two horns and its spines every way; teeth and slit-pupilled eyes toward us (two) and in profile (one), none from behind; no whiskers",
     views.every(v => v.horns === 2 && v.spines && !v.whiskers) && V.front.teeth && V.left.teeth && !V.back.teeth && V.front.slits === 2 && V.right.slits === 1 && V.back.slits === 0, V);
  ok("scales all over; a plated belly toward us and in profile, none on its back", views.every(v => v.scales) && V.front.plates && V.right.plates && !V.back.plates, V);
  ok("each colour its own: scales, belly, wings and spines, horns, teeth and claws (paws and feet)", r.colours.scales === "#2f6db5" && r.colours.belly && r.colours.wings === "#7b3f8c" &&
     r.colours.spikes === "#7b3f8c" && r.colours.teeth === "#e0b030" && r.colours.handClaws && r.colours.feetClaws, r.colours);
  ok("flapping: both wings move, at their own slow beat (1.7 s) or with the LFO chosen, which then names them on the mixing board",
     r.flap.length === 2 && r.flap.every(d => d === "1.7000s") && r.flapB.length === 2 && r.flapB.every(d => d === r.lfoB) && r.follows, { flap: r.flap, flapB: r.flapB, lfoB: r.lfoB, follows: r.follows });
  ok("open and still, and folded (a drawing of its own): no wing moves", r.open.length === 0 && r.folded.length === 0 && r.foldedDiffers, r);
  ok("every pose and animation drawn, toward us, from behind and from the side", Object.values(r.poses).every(Boolean), r.poses);
  ok("the tab: the dragon's rows and its eye colour for the dragon, not the other animals' colours", r.rowsDragon === "11111100001", r.rowsDragon);
  ok("the LFO's row only while the wings flap", r.rowsFolded === 0, r.rowsFolded);
  ok("the wolf shows the animals' colours, none of the dragon's", r.rowsWolf === "00000011111", r.rowsWolf);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
