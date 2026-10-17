// The passages audit (Matthew, 2026-10-17: "audit every passage (door,
// pit, nav arrow, sign, etc.) and make them all work in a uniform way; no
// more pictures vs passages"). Visits every place (each square of the
// first world through the world, so its nav arrows show; the other places
// directly; every tree house room; every castle room style) and lists what
// can take the friend somewhere: each .portal, ladder and nav arrow, what
// kind it is, where it leads, and how it can be used today: X (the
// controller's "go through", whether measureMarks lists it), a click (the
// pointer at its middle lands on it), the hover glow (a .portal's CSS).
// Prints a table per place and a summary; writes the JSON.
//   node passages.mjs <devtools port> <url> <out.json>
import { writeFileSync } from "node:fs";
const [dport, url, out] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url }); await sleep(4000);
const r = await send("Runtime.evaluate", { awaitPromise: true, returnByValue: true, expression: `(async () => {
  const wait = ms => new Promise(res => setTimeout(res, ms)), out = [];
  state.music.mute = true; state.world = clone(DEFAULTS.world); padName = "audit";
  const look = async (name, set) => {
    set(state.background); changed(); await wait(350); measureMarks();
    const B = state.background, items = [];
    const center = el => { const s = el.querySelector("rect, path, polygon, ellipse, circle, image, svg") || el, b = s.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, b.width, b.height]; };
    const onIt = (el, [x, y]) => { const u = document.elementFromPoint(x, y); return !!u && (u === el || el.contains(u)); };
    const seen = new Set();
    for (const el of bgShown.node ? bgShown.node.querySelectorAll(".portal, [data-ladder]") : []) {
      if (seen.has(el)) continue; seen.add(el);
      const view = el.querySelector(":scope > svg, :scope > image"), d = el.dataset;
      const kind = d.way ? "nav arrow" : d.pit ? "pit" : el.hasAttribute("data-ladder") ? (el.closest(".portal") || d.house ? "ladder (a way)" : "ladder") :
                   view ? "picture" : el.classList.contains("south-way") ? "▼ sign" : el.querySelector("text") && !d.door ? "sign" : d.door ? "door" : "doorway (unmarked)";
      const c = center(el), x = marks.pics.some(p => p.el === el) || marks.ladders.some(l => l.el === el);
      const hud = d.way ? !!document.querySelector('#ways .way-arrow[data-way="' + d.way + '"]') : null;
      items.push({ kind, to: d.to || (d.way ? "square " + d.way : d.house ? "tree house " + d.house : d.pit ? "below" : ""), house: d.house || "", room: d.room || "", tent: d.tent || "",
        x, click: d.way ? hud : (c[2] > 0 && c[3] > 0 ? onIt(el, c) : false), glow: el.classList.contains("portal") && !d.way, size: [Math.round(c[2]), Math.round(c[3])] });
    }
    out.push({ place: name, kind: B.kind, items });
  };
  const squares = new Map(Object.entries(state.world.cells).map(([k, c]) => [c.kind, k]));
  for (const [kind] of PLACES) {
    if (kind === "none" || kind === "castleroom") continue;
    if (kind === "treeroom") { for (let i = 1; i <= 6; i++) await look("treeroom " + i, B => Object.assign(B, { kind, houses: 6, inside: i })); continue; }
    const key = squares.get(kind);
    await look(kind + (key ? " (square " + squareName(key) + ")" : ""), B => { if (key) worldEnter(key, null, false); else B.kind = kind; });
  }
  for (const [style] of CASTLE_ROOM_CHOICES) await look("castle room: " + style, B => Object.assign(B, { kind: "castleroom", castle: "N", castleRoomsN: 6, castleRoom6N: style, castleRoom: 6 }));
  padName = ""; return out;
})()` });
if (r.result.exceptionDetails) { console.log("EXC", JSON.stringify(r.result.exceptionDetails).slice(0, 800)); process.exit(1); }
const res = r.result.result.value;
if (out) writeFileSync(out, JSON.stringify(res, null, 1));
const yn = v => v === null ? "–" : v ? "yes" : "NO";
const all = res.flatMap(p => p.items.map(i => ({ ...i, place: p.place })));
for (const p of res) {
  console.log(`\n## ${p.place}: ${p.items.length} passage${p.items.length === 1 ? "" : "s"}`);
  for (const i of p.items) console.log(`  ${i.kind.padEnd(19)} → ${(i.to + (i.room ? " room " + i.room : "") + (i.tent ? " tent " + i.tent : "")).padEnd(22)} X ${yn(i.x).padEnd(3)} click ${yn(i.click).padEnd(3)} glow ${yn(i.glow).padEnd(3)} ${i.size.join("x")}`);
}
console.log("\n== summary: passages by kind, and how many X, a click and the glow reach");
const kinds = [...new Set(all.map(i => i.kind))];
for (const k of kinds) { const g = all.filter(i => i.kind === k); console.log(`  ${k.padEnd(19)} ${String(g.length).padStart(4)}   X ${g.filter(i => i.x).length}   click ${g.filter(i => i.click).length}   glow ${g.filter(i => i.glow).length}`); }
console.log(`  ${"all".padEnd(19)} ${String(all.length).padStart(4)}   X ${all.filter(i => i.x).length}   click ${all.filter(i => i.click).length}`);
console.log(errs.length ? "page errors: " + errs.slice(0, 3).join(" | ") : "no page errors");
await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`);
process.exit(0);
