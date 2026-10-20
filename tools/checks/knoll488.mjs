// (ticket 488, Matthew: "how can we best 'Knowl' the panels on the RHS ... Especially, for example, non-FS world design
// control panels") 🗺️ World design in the side panel, not full screen: each of its parts a box (a border, named once: by
// its own heading or its data-box-name), in the order they had (worlds, warnings, the places, the world's grid, its size,
// this square, things here, off the grid); one column in a narrow side panel, more side by side in a wide one, the grid,
// the places and the things across all of them. And 🎮 Controls in boxes (0.0.383): the game controller, the bubbles (blowing
// and the themes), moving (how the friend moves, and a click while walking); 🐯 Costume's 👻 visibility rows still in its
// ghost's box (rows of another part are boxed by their own key only where the plan does not name the part). Exits 1 on a failure.
//   node knoll488.mjs <devtools port> <url>
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
const measure = `(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); state.music.mute = true;
  tab = TABS.findIndex(t => /World design/.test(t[0])); showTab(); await w(600);
  const parts = [...document.querySelectorAll("#panel .world-rest > *:not([hidden]):not(.world-view), #panel .world-gridcol")].filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    return { cls: [...e.classList].find(c => c.startsWith("world-")) || "", x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), border: parseFloat(cs.borderTopWidth), named: !!e.dataset.boxName || !!e.querySelector(".lbl, .cap, .hint, b, h3, .world-warn-count") }; });
  const cols = getComputedStyle(document.querySelector("#panel .world-layout")).gridTemplateColumns.split(" ").length;
  return JSON.stringify({ parts, cols, big: document.body.classList.contains("world-big") }); })()`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const a = JSON.parse(await ev(measure));
  const order = [...a.parts].sort((p, q) => p.y - q.y || p.x - q.x).map(p => p.cls);
  const want = ["world-worlds", "world-warn", "world-palette", "world-gridcol", "world-sizes", "world-here", "world-things", "world-off"];
  ok("not full screen: every part of World design a box (a border), the world's grid apart", !a.big && a.parts.filter(p => p.cls !== "world-gridcol").every(p => p.border >= 1), a.parts);
  ok("each box named once (its own heading, or its name above it)", a.parts.filter(p => p.cls !== "world-gridcol").every(p => p.named), a.parts);
  ok("in the order they had", JSON.stringify(order.filter(c => want.includes(c))) === JSON.stringify(want.filter(c => order.includes(c))) && order.includes("world-gridcol"), order);
  await send("Emulation.setDeviceMetricsOverride", { width: 2200, height: 1000, deviceScaleFactor: 1, mobile: false }); await sleep(800);
  await ev(`setSplit(innerWidth * 0.4)`); await sleep(400);
  const b = JSON.parse(await ev(measure)), row = y => b.parts.filter(p => Math.abs(p.y - y) < 2).length;
  ok("in a wide side panel, boxes side by side (more than one column), the grid across them all", b.cols >= 2 && b.parts.some(p => row(p.y) >= 2) && b.parts.find(p => p.cls === "world-gridcol").w >= b.parts.find(p => p.cls === "world-sizes").w * 1.8, { cols: b.cols, parts: b.parts });
  const c = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    const boxes = () => [...document.querySelectorAll("#panel .tabbox")].filter(b => b.getClientRects().length).map(b => [(b.querySelector(":scope > .box-name") || {}).textContent,
      [...b.children].filter(x => !x.classList.contains("box-name")).map(x => x.dataset.key || "")]);
    tab = TABS.findIndex(t => t[0] === "🎮 Controls"); showTab(); await w(300); const controls = boxes();
    const was = state.costume.kind; state.costume.kind = "ghost"; changed(); tab = TABS.findIndex(t => t[0] === "🐯 Costume"); showTab(); await w(300);
    const ghost = boxes().find(b => /ghost/.test(b[0] || "")); state.costume.kind = was; changed(); showTab();
    return JSON.stringify({ controls, ghost }); })()`));
  ok("🎮 Controls in three boxes: the game controller, the bubbles, moving", c.controls.length === 3 && /controller/.test(c.controls[0][0]) && /bubbles/.test(c.controls[1][0]) && c.controls[1][1].length === 2 && /moving/.test(c.controls[2][0]) && c.controls[2][1].length === 2, c.controls);
  ok("🐯 Costume's 👻 visibility rows still in the ghost's box", c.ghost && c.ghost[1].filter(k => k === "all").length === 2, c.ghost);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
