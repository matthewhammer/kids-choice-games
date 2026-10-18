// (ticket 185, v3) The object library: the things palette in groups (🌲
// nature, 🧪 magic, 💀 spooky, 🪧 signs), a chip per group showing its
// things' buttons; each new thing drawn from a drawing a place already has
// (a toadstool, a potion, a skeleton, a sign on a post), standing where it
// was put; a sign's words typed in its row, drawn as words (never as
// markup), the box keeping the caret while typing. Exits 1 on a failure.
//   node library185.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 800)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1400, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // the World design tab, in the clearing's square
  const groups = JSON.parse(await ev(`(async () => { state.music.mute = true; state.world = clone(WORLD_DEFAULT_0183); worldEnter("3,2"); tab = TABS.findIndex(t => t[1] === "world"); showTab(); await new Promise(r => setTimeout(r, 500));
    const chips = [...document.querySelectorAll(".thing-groups button")], items = () => [...document.querySelectorAll(".thing-items button")].map(b => b.textContent);
    const out = { chips: chips.map(b => b.textContent), first: items() };
    for (const b of chips) { b.click(); await new Promise(r => setTimeout(r, 100)); out[b.dataset.group] = items(); }
    chips[0].click(); return JSON.stringify(out); })()`));
  const THING_GROUPS_N = await ev("THING_GROUPS.length");
  ok("its groups (six since the 🐚 sea's, ticket 219), nature open at first: rock, bush, tree, pine, toadstool", groups.chips.length === THING_GROUPS_N && groups.first.join() === "+ 🪨 rock,+ 🌿 bush,+ 🌳 tree,+ 🌲 pine,+ 🍄 toadstool", groups);
  ok("camp: log, campfire, bench, barrel; magic: cauldron, potion; spooky: a skeleton; signs: a sign", groups.camp.join() === "+ 🪵 log,+ 🔥 campfire,+ 🪑 bench,+ 🛢️ barrel" && groups.magic.join() === "+ 🫕 cauldron,+ 🧪 potion" && groups.spooky.join() === "+ 💀 skeleton" && groups.signs.join() === "+ 🪧 sign,+ 🧭 sign with directions", groups);
  // (0.0.113) the drawings lifted out of the places: each drawn as a thing too, burning or not
  const lifted = JSON.parse(await ev(`(async () => { const B = state.background, kinds = ["log", "campfire", "bench", "barrel", "cauldron"];
    B.things = kinds.map((kind, i) => ({ kind, x: -300 + i * 150, z: 370, seed: 20 + i, size: 100, ...structuredClone(THING_DEFAULTS[kind] || {}) })); changed(); await new Promise(r => setTimeout(r, 500));
    const look = i => { const e = document.querySelector('#bg [data-drag="thing:' + i + '"]'), r = e && e.getBoundingClientRect(); return e ? { w: Math.round(r.width), h: Math.round(r.height), anim: e.querySelectorAll("animate").length } : null; };
    const all = kinds.map((_, i) => look(i)); B.things[1].burning = false; changed(); await new Promise(r => setTimeout(r, 300));
    return JSON.stringify({ all, out: look(1) }); })()`));
  ok("a log, a campfire, a bench, a barrel and a cauldron, each drawn as a thing", lifted.all.every(t => t && t.w > 10 && t.h > 10), lifted.all);
  ok("the campfire's flames move; put out, they are gone", lifted.all[1].anim > 0 && lifted.out && lifted.out.anim === 0, { burning: lifted.all[1], out: lifted.out });
  // each new thing drawn, standing where it was put
  const drawn = JSON.parse(await ev(`(async () => { const B = state.background;
    B.things = [{ kind: "toadstool", x: -250, z: 370, seed: 1, size: 100, cap: "#7c3aed", glow: true }, { kind: "potion", x: -80, z: 380, seed: 2, size: 100, shape: "tall", color: "#e53935" },
                { kind: "skeleton", x: 120, z: 360, seed: 3, size: 100 }, { kind: "sign", x: 280, z: 350, seed: 4, size: 100, text: "camp →" }];
    changed(); await new Promise(r => setTimeout(r, 500));
    const by = i => document.querySelector('#bg [data-drag="thing:' + i + '"]');
    return JSON.stringify([0, 1, 2, 3].map(i => { const e = by(i), r = e && e.getBoundingClientRect(); return e ? { w: Math.round(r.width), h: Math.round(r.height), tf: e.firstElementChild.getAttribute("transform"), html: e.innerHTML.length } : null; })
      .concat([{ cap: !!by(0) && by(0).innerHTML.includes("#7c3aed"), red: !!by(1) && by(1).innerHTML.includes("#e53935"), words: by(3) ? by(3).querySelector("text").textContent : null }])); })()`));
  const [toad, potion, skel, sign, look] = drawn;
  ok("a toadstool, a potion, a skeleton and a sign, each drawn with something to see", [toad, potion, skel, sign].every(t => t && t.w > 10 && t.h > 20 && t.html > 200), drawn);
  ok("each standing where it was put", /translate\(-250 370\)/.test(toad.tf) && /translate\(-80 380\)/.test(potion.tf) && /translate\(120 360\)/.test(skel.tf) && /translate\(280 350\)/.test(sign.tf), drawn.map(t => t && t.tf));
  ok("the toadstool's cap and the potion in their own colours, the sign's words on it", look.cap && look.red && look.words === "camp →", look);
  // (Matthew, 2026-10-17) each thing rescaled by a slider in its row, from a good size of its own: the toadstool was too big
  ok("the toadstool smaller than the tall potion beside it, at their own sizes", toad.h < potion.h, { toadstool: toad.h, potion: potion.h });
  const sized = JSON.parse(await ev(`(async () => { const sliders = [...document.querySelectorAll('input[type="range"][data-param="size"]')], r = sliders[0];
    const h = () => Math.round(document.querySelector('#bg [data-drag="thing:0"]').getBoundingClientRect().height), before = h();
    r.value = "200"; r.dispatchEvent(new Event("input", { bubbles: true })); await new Promise(res => setTimeout(res, 400));
    return JSON.stringify({ sliders: sliders.length, size: state.background.things[0].size, before, after: h(), same: r.isConnected, shows: r.nextElementSibling.textContent }); })()`));
  ok("a size slider in each thing's row; the toadstool at 200% twice as tall, the slider still in hand", sized.sliders === 4 && sized.size === 200 && sized.after > sized.before * 1.7 && sized.same && sized.shows === "200%", sized);
  // a sign's words typed in its row: drawn as words, never markup; the caret stays
  const typed = JSON.parse(await ev(`(async () => { const box = [...document.querySelectorAll('input[type="text"]')].find(i => i.getAttribute("aria-label") === "✏️ its words");
    if (!box) return JSON.stringify({ box: false }); box.focus(); box.select(); return JSON.stringify({ box: true }); })()`));
  if (typed.box) { await send("Input.insertText", { text: "<b>hi</b>" }); await sleep(500); }
  const after = JSON.parse(await ev(`(() => { const e = document.querySelector('#bg [data-drag="thing:3"]'), a = document.activeElement;
    return JSON.stringify({ text: state.background.things[3].text, drawn: e ? e.querySelector("text").textContent : null, bold: !!(e && e.querySelector("text b")), focused: !!a && a.getAttribute && a.getAttribute("aria-label") === "✏️ its words" }); })()`));
  ok("the sign's words typed in its row, drawn as words, not markup", typed.box && after.text === "<b>hi</b>" && after.drawn === "<b>hi</b>" && !after.bold, { typed, after });
  ok("and the box kept the caret while typing", after.focused, after);
  // (Matthew, 2026-10-17: his pines white, M's ordinary, on the same version) a pine is green in a dark page and a light one
  const greens = {};
  for (const scheme of ["dark", "light"]) {
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
    greens[scheme] = await ev(`(async () => { state.background.things = [{ kind: "pine", x: 0, z: 360, seed: 5, size: 100, tiers: 6 }]; changed(); await new Promise(r => setTimeout(r, 400));
      const p = document.querySelector('#bg [data-drag="thing:0"] polygon'); return p ? getComputedStyle(p).fill : null; })()`);
  }
  ok("a pine is green, in a dark page and a light one", greens.dark === "rgb(47, 110, 58)" && greens.light === "rgb(47, 110, 58)", greens);
  // (Matthew, 2026-10-17) a sign with directions: a board for each way chosen, named by the square it leads to; every square's name its own
  const post = JSON.parse(await ev(`(async () => {
    const C = { "1,1": { kind: "crossing", crossN: true, crossNE: true, crossE: true, crossSE: true, crossS: true, crossSW: true, crossW: true, crossNW: true, crossFloor: "#76843a", crossBack: "sky", things: [] },
      "1,0": { kind: "beach", ways: ["S"], things: [] }, "2,0": { kind: "mountains", ways: ["SW"], things: [] }, "2,1": { kind: "castle", ways: ["W"], things: [] }, "2,2": { kind: "house", ways: ["NW"], things: [] },
      "1,2": { kind: "lake", ways: ["N"], things: [] }, "0,2": { kind: "campsite", ways: ["NE"], things: [] }, "0,1": { kind: "forest", ways: ["E"], name: "Grandma's woods", things: [] }, "0,0": { kind: "witch", ways: ["SE"], things: [] } };
    state.world = { cols: 3, rows: 3, start: "1,1", cells: C }; worldEnter("1,1");
    const B = state.background; B.things = [{ kind: "signpost", x: 90, z: 380, seed: 1, size: 100 }]; changed(); await new Promise(r => setTimeout(r, 500));
    const boards = () => [...document.querySelectorAll('#bg [data-drag="thing:0"] text')].map(e => e.textContent);
    const all = boards(); B.things[0].dirs = ["N", "E", "S"]; changed(); await new Promise(r => setTimeout(r, 300));
    const three = boards(); B.things[0].dirs = []; changed(); await new Promise(r => setTimeout(r, 300));
    const none = boards(), chips = [...document.querySelectorAll(".cross-list button")].filter(b => /^(N|NE|E|SE|S|SW|W|NW)$/.test(b.title || "")).length;
    state.world.cells["2,1"].name = "Grandma's woods"; changed(); await new Promise(r => setTimeout(r, 300));
    const dup = worldProblems(state.world).filter(p => /named/.test(p.text)).map(p => p.text);
    return JSON.stringify({ all, three, none, chips, dup, names: worldNames(state.world) }); })()`));
  ok("a sign with directions in the middle square: eight boards, each the name of the square it leads to", post.all.length === 8 && post.all.some(t => /Grandma's woods/.test(t)) && post.all.some(t => /beach/.test(t)), post.all);
  ok("three ways chosen: three boards; none: a bare post; a chip for each of the eight ways in its row", post.three.length === 3 && post.none.length === 0 && post.chips === 8, post);
  ok("two squares given one name: a warning", post.dup.length === 1 && /Grandma's woods/.test(post.dup[0]), post.dup);
  ok("a place's own name where it is the only one; the designer's where given", post.names["1,0"] === "🏖️ beach" && post.names["0,1"] === "Grandma's woods", post.names);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
