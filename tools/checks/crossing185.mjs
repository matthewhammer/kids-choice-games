// (ticket 185) The forest crossing: as many paths drawn as are switched on
// (and a meeting place when any is); its things drawn, each a draggable
// piece; mirror turns one about its feet (the same place, the drawing
// flipped); a mouse drag moves one. Exits 1 on a failure.
//   node crossing185.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}: ${JSON.stringify(got)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const paths = async on => JSON.parse(await ev(`(async () => {
    state.music.mute = true; const B = state.background; B.kind = "crossing"; B.figX = 0; B.figY = 120;
    for (const [d] of CROSS_DIRS) B["cross" + d] = ${JSON.stringify(on)}.includes(d);
    changed(); await new Promise(r => setTimeout(r, 400));
    return JSON.stringify({ paths: document.querySelectorAll('#bg path[fill="' + CROSS_PATH + '"]').length, patch: document.querySelectorAll('#bg ellipse[fill="' + CROSS_PATH + '"]').length });
  })()`));
  for (const on of [[], ["N", "S"], ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]]) {
    const r = await paths(on);
    ok(`${on.length} paths on`, r.paths === on.length && (on.length ? r.patch >= 1 : r.patch === 0), r);
  }
  const t = JSON.parse(await ev(`(async () => {
    const B = state.background; B.things = [{ kind: "tree", x: -200, z: 360, seed: 901, size: 100 }, { kind: "rock", x: 150, z: 380, seed: 902, size: 100, mirror: true, tone: "#a8634a" }, { kind: "pine", x: 300, z: 330, seed: 903, size: 100 }, { kind: "bush", x: -80, z: 400, seed: 904, size: 100 }];
    changed(); await new Promise(r => setTimeout(r, 400));
    const g = [...document.querySelectorAll("#bg .thing")];
    // (the page puts objects in depth order: find each thing by its own data-drag, not by place)
    const by = i => document.querySelector('#bg [data-drag="thing:' + i + '"]');
    return JSON.stringify({ n: g.length, drag: g.map(e => e.dataset.drag).sort(), tf: [0, 1, 2, 3].map(i => by(i).firstElementChild.getAttribute("transform")),
      rockFill: by(1).querySelector("polygon") ? by(1).querySelector("polygon").getAttribute("fill") : null });
  })()`));
  ok("four things, each draggable", t.n === 4 && t.drag.join() === "thing:0,thing:1,thing:2,thing:3", t.drag);
  ok("the mirrored rock is flipped, the others not", /scale\(-/.test(t.tf[1]) && !/scale\(-/.test(t.tf[0]) && !/scale\(-/.test(t.tf[2]), t.tf);
  ok("the mirrored rock stands where it was put", /translate\(150 380\)/.test(t.tf[1]), t.tf[1]);
  ok("the rock is drawn in its own colour (red rock)", t.rockFill === "#a8634a", t.rockFill);
  const leaves = JSON.parse(await ev(`(async () => { const B = state.background, T = B.things[0], before = document.querySelector('#bg [data-drag="thing:0"]').innerHTML;
    T.leaves = "autumn"; changed(); await new Promise(r => setTimeout(r, 300)); const after = document.querySelector('#bg [data-drag="thing:0"]').innerHTML;
    T.leaves = "summer"; changed(); await new Promise(r => setTimeout(r, 300)); const back = document.querySelector('#bg [data-drag="thing:0"]').innerHTML;
    return JSON.stringify({ changed: before !== after, autumn: after.includes("#c2410c") || after.includes("#d97706"), backAsBefore: back === before }); })()`));
  ok("a tree's leaves to autumn, and back to summer as it was", leaves.changed && leaves.autumn && leaves.backAsBefore, leaves);
  // a mouse drag on the tree's trunk moves it
  const at = JSON.parse(await ev(`(() => { const e = document.querySelector('#bg [data-drag="thing:0"]'), r = e.getBoundingClientRect(); return JSON.stringify([r.left + r.width / 2, r.bottom - r.height * 0.12]); })()`));
  const before = JSON.parse(await ev(`JSON.stringify(state.background.things[0])`));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: at[0], y: at[1] });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: at[0], y: at[1], button: "left", buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 10; i++) { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: at[0] + 12 * i, y: at[1] + 4 * i, button: "left", buttons: 1 }); await sleep(30); }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: at[0] + 120, y: at[1] + 40, button: "left", buttons: 0, clickCount: 1 });
  await sleep(300);
  const after = JSON.parse(await ev(`JSON.stringify(state.background.things[0])`));
  ok("a drag moves the tree (right, and nearer)", after.x > before.x + 20 && after.z > before.z + 5, { before, after });
  const fig = JSON.parse(await ev(`JSON.stringify([state.background.figX, state.background.figY])`));
  ok("and not the friend", fig[0] === 0 && fig[1] === 120, fig);
  // off in the distance: each backdrop its own (woods: shafts of light; sky: far woods under the sun; mountains: far pines below peaks)
  const backs = JSON.parse(await ev(`(async () => { const out = {}; for (const b of ["woods", "sky", "mountains"]) { state.background.crossBack = b; changed(); await new Promise(r => setTimeout(r, 300));
    out[b] = [...document.querySelectorAll("#bg [data-obj]")].map(e => e.getAttribute("data-obj")).filter(n => /sunbeams|far woods|far pines|far trees/.test(n)).join(); } return JSON.stringify(out); })()`));
  ok("three backdrops, each its own", /sunbeams/.test(backs.woods) && /far woods/.test(backs.sky) && /far pines/.test(backs.mountains), backs);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
