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
  const groups = JSON.parse(await ev(`(async () => { state.music.mute = true; state.world = clone(DEFAULTS.world); worldEnter("3,2"); tab = TABS.findIndex(t => t[1] === "world"); showTab(); await new Promise(r => setTimeout(r, 500));
    const chips = [...document.querySelectorAll(".thing-groups button")], items = () => [...document.querySelectorAll(".thing-items button")].map(b => b.textContent);
    const out = { chips: chips.map(b => b.textContent), first: items() };
    for (const b of chips) { b.click(); await new Promise(r => setTimeout(r, 100)); out[b.dataset.group] = items(); }
    chips[0].click(); return JSON.stringify(out); })()`));
  ok("four groups, nature open at first: rock, bush, tree, pine, toadstool", groups.chips.length === 4 && groups.first.join() === "+ 🪨 rock,+ 🌿 bush,+ 🌳 tree,+ 🌲 pine,+ 🍄 toadstool", groups);
  ok("magic: a potion; spooky: a skeleton; signs: a sign", groups.magic.join() === "+ 🧪 potion" && groups.spooky.join() === "+ 💀 skeleton" && groups.signs.join() === "+ 🪧 sign", groups);
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
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
