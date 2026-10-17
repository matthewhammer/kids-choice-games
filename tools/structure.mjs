// The safety net's other half: what the pictures cannot show. Dumps the
// defaults, the controls (functions as "fn"), every show-when rule over a
// set of background states, and castleOf for them, to compare across a refactor.
//   node structure.mjs <devtools port> <url> <out.json>
import { writeFileSync } from "node:fs";
const [dport, url, out] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = (await (await fetch(`http://127.0.0.1:${dport}/json/list`)).json()).find(t => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: "about:blank" }); await sleep(300);
await send("Page.navigate", { url }); await sleep(3500);
const r = await send("Runtime.evaluate", { returnByValue: true, expression: `(() => {
  const sorted = v => Array.isArray(v) ? v.map(sorted) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sorted(v[k])])) : typeof v === "function" ? "fn" : v;
  const D = structuredClone(DEFAULTS.background);
  const states = [{}, { kind: "castle" }, { kind: "castleroom", castleRoom: 2, castleRoom2N: "catroom" }, { kind: "castleroom", castleRoom: 2, castleRoom2N: "stable", castleHorsesN: 2 },
    { kind: "castleroom", castle: "M", castleRoom: 1, castleRoom1M: "catroom", castleCatsM: 3, castleCat2PoseM: "walk", castleCat3LfoM: "none", castleCat1SizeM: 999 },
    { kind: "castle", castleRoomsN: 6, castleRoom5N: "stable", castleRoom6N: "catroom", castleCatsN: 8, castleHorse2MarkN: "blaze", castleHorse1LfoN: "Q" }].map(s => ({ ...D, ...s }));
  const shown = states.map(b => Object.fromEntries(Object.keys(SHOWN_WHEN).filter(k => k.startsWith("background.")).sort().map(k => { try { return [k, !!SHOWN_WHEN[k](b)]; } catch (e) { return [k, "err"]; } })));
  return { defaults: sorted(DEFAULTS), tabs: sorted(TABS.filter(t => t[1] !== "music")), shown, castles: states.map(b => sorted(castleOf(b))) };
})()` });
writeFileSync(out, JSON.stringify(r.result.result.value));
console.log("dumped", Object.keys(r.result.result.value).join(", "));
process.exit(0);
