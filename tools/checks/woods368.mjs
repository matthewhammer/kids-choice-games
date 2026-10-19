// (ticket 368, Matthew: "seems like all trees and fence and fence skulls are missing from the object list?"; "we want to offer
// these kinds of objects for reuse, for one") The witch's woods: each dead tree (19), each skull on the fence (11) and the fence
// found by 🧩 (their drawings tagged: deadTree, skull, fence); and the three as placed things (🌳 dead tree, 💀 skull on a
// stake, 🪵 fence of stakes), drawn by the same drawings, each an object and in the way. Exits 1 on a failure.
//   node woods368.mjs <devtools port> <url>
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
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; B.kind = "witch"; changed(); await w(1000);
    const procs = {}; for (const e of bgShown.node.querySelectorAll("[data-proc]")) procs[e.dataset.proc] = (procs[e.dataset.proc] || 0) + 1;
    const cats = { deadTree: PROC_CAT.deadTree, skull: PROC_CAT.skull, fence: PROC_CAT.fence }, kinds = ["deadtree", "skullstake", "palisade"].map(k => [k, !!THING_KINDS[k], THING_KINDS[k] && THING_KINDS[k].group]);
    B.kind = "emptyroom"; changed(); await w(500); const g = SCENE.ground;
    B.things = [["deadtree", -260], ["skullstake", -60], ["palisade", 200]].map(([kind, x], i) => ({ kind, x, z: g + 60, seed: 1201 + i, size: 100, mirror: false, ...THING_DEFAULTS[kind] })); B.figX = 60; changed(); await w(800);
    const objs = bgShown.objs.map(o => o.name), solids = solidsHere().map(o => o.name), drawn = [...document.querySelectorAll("#bg .thing [data-proc]")].map(e => e.dataset.proc);
    return JSON.stringify({ procs, cats, kinds, objs, solids, drawn }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("the woods' dead trees, skulls and fence each found by 🧩", r.procs.deadTree >= 19 && r.procs.skull >= 11 && r.procs.fence === 1, r.procs);
  ok("in 🧩's kinds: trees, skulls, fences", r.cats.deadTree === "trees" && r.cats.skull === "skulls" && r.cats.fence === "fences", r.cats);
  ok("three new placed things, in 💀 spooky", r.kinds.every(([, has, gr]) => has && gr === "spooky"), r.kinds);
  ok("each placed one an object, in the way, drawn by the woods' drawings", ["deadtree 1", "skullstake 2", "palisade 3"].every(n => r.objs.includes(n) && r.solids.includes(n)) && r.drawn.includes("deadTree") && r.drawn.includes("skull") && r.drawn.includes("fence"), r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
