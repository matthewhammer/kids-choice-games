// The safety net for refactoring Dress Up: draw every place (each time of
// day), every castle room style (both color themes), every costume, from
// the defaults with every LFO off, and hash each picture's markup (begin
// times stripped). Run it on two copies of the page and compare the lists:
// a refactor must leave every hash the same.
//   node sweep.mjs <devtools port> <url> <out.json>
import { writeFileSync } from "node:fs";
const [dport, url, out] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
// (in a tab of its own, closed at the end, so another job driving the browser's first tab, as the music archive does, is left alone)
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: "about:blank" }); await sleep(300);
await send("Page.navigate", { url }); await sleep(4000);
for (let i = 0; i < 40; i++) { const t = await send("Runtime.evaluate", { expression: "typeof state", returnByValue: true }); if (t.result.result.value === "object") break; await sleep(250); }
const r = await send("Runtime.evaluate", { awaitPromise: true, returnByValue: true, expression: `(async () => {
  const h = s => { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return (x >>> 0).toString(16); };
  const tick = () => new Promise(r => setTimeout(r, 60)), out = {};
  const reset = () => { for (const [p, v] of Object.entries(DEFAULTS)) if (state[p] && typeof v === "object") { for (const key of Object.keys(state[p])) delete state[p][key]; Object.assign(state[p], structuredClone(v)); }
    const B = state.background; Object.assign(B, { lfoFast: "none", lfoSlow: "none", lfoWings: "none", fairyHouseLfo: "none" });
    for (const key of Object.keys(B)) if (/^castle(Cat|Horse)\\d+Lfo/.test(key)) B[key] = "none";
    state.costume.wingLfo = "none"; for (const key of Object.keys(state.visible || {})) if (key.startsWith("lfo_")) state.visible[key] = "none"; };
  const shot = async (name, set) => { reset(); set(state.background, state.costume); changed(); await tick();
    // (ticket 187: a passage's glow is where the friend stands, not the scene: left out)
    for (const g of document.querySelectorAll("#pic .enter-glow")) g.remove();
    out[name] = h(document.getElementById("pic").innerHTML.replace(/ begin="[^"]*"/g, "").replace(/-?[0-9.]+s infinite/g, "Xs infinite")); };
  const times = { fairyforest: ["fairyTime", ["day", "sunrise", "sunset", "night"]], campsite: ["campTime", Object.keys(CAMP_SKY)], tent: ["campTime", Object.keys(CAMP_SKY)],
                  waterfall: ["fallTime", Object.keys(FALL_TINT)], cave: ["fallTime", Object.keys(FALL_TINT)] };
  for (const [kind] of PLACES) {
    if (kind === "castleroom") continue;
    const tv = times[kind];
    // (the tree house's six rooms, each drawn by its own room style)
    if (kind === "treeroom") { for (let r = 1; r <= 6; r++) await shot("treeroom:" + r, B => Object.assign(B, { kind, houses: 6, inside: r })); continue; }
    for (const t of tv ? tv[1] : [null]) await shot(kind + (t ? "@" + t : ""), B => { B.kind = kind; if (tv) B[tv[0]] = t; });
  }
  for (const [style] of CASTLE_ROOM_CHOICES) for (const th of ["A", "B"])
    await shot("castleroom:" + style + "/" + th, B => Object.assign(B, { kind: "castleroom", castle: "N", castleRoomsN: 6, castleRoom6N: style, castleRoomTheme6N: th, castleRoom: 6 }));
  const kinds = TABS.find(t => t[1] === "costume")[2].find(c => c[1] === "kind")[3].map(o => o[0]);
  for (const kind of kinds) await shot("costume:" + kind, (B, C) => { B.kind = "none"; C.kind = kind; });
  return out;
})()` });
if (r.result.exceptionDetails) { console.log("EXC", JSON.stringify(r.result.exceptionDetails).slice(0, 600)); process.exit(1); }
const res = r.result.result.value;
writeFileSync(out, JSON.stringify(res, null, 1));
console.log(Object.keys(res).length, "pictures hashed;", errs.length, "page errors", errs.slice(0, 3).join(" | "));
await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`);
process.exit(0);
