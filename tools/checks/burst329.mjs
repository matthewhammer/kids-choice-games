// (ticket 329) Bubble space: bubbles smaller farther back (🔭: at 70 the nearest half again the farthest or more, drawn
// last; at 0 all one size); a pop bursts into smaller bubbles of its style as 💥 says (at 100 always, at 0 never), with
// lines out from it (✨) and, born on the friend, the smaller ones not popping on them until they have left; the pop's
// sound settings shown only with a sound, how many only with bursts. Exits 1 on a failure.
//   node burst329.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; B.kind = "bubblespace"; B.bubbleCount = 30; B.bubbleDepth = 70; changed(); await w(800);
    const sizes = () => { const L = bubbleSim.list, dom = [...document.getElementById("bubble-layer").childNodes].map(g => +g.querySelector("circle").getAttribute("r"));
      return { lo: Math.min(...dom), hi: Math.max(...dom), farFirst: L.every((b, i) => !i || L[i - 1].d >= b.d), first: dom[0], last: dom[dom.length - 1] }; };
    const deep = sizes(); B.bubbleDepth = 0; changed(); await w(500); const flat = sizes(); B.bubbleDepth = 70; changed(); await w(500);
    const pop = async burst => { B.bubbleBurst = burst; B.bubbleBurstCount = 4; bubbleKidsClear(); bubbleSim.bonds = []; await w(100);
      const fig = document.getElementById("figure"), P = pic.getScreenCTM().inverse(), q = fig.getBoundingClientRect(), c = new DOMPoint((q.left + q.right) / 2, q.top + (q.bottom - q.top) * 0.3).matrixTransform(P);
      const L = bubbleSim.list, b = L[L.length - 1]; b.back = 0; b.pop = 0; b.x = c.x; b.y = c.y; b.vx = b.vy = 0; await w(120);
      const kids = bubbleSim.kids.map(k => ({ r: k.r, color: k.th.color, gen: k.gen })), rays = document.querySelectorAll("#bubble-kids .pop-rays").length;
      await w(350); return { popped: !!b.pop, kids, rays, popR: b.r, color: b.th.color, chained: bubbleSim.kids.filter(k => k.pop).length }; };
    const always = await pop(100), never = await pop(0);
    const shown = l => [...document.querySelectorAll("*")].some(e => !e.children.length && e.textContent.includes(l) && e.offsetParent);
    const tab = [...document.querySelectorAll("button")].find(b => /Background/.test(b.textContent)); if (tab) tab.click(); await w(300);
    B.bubblePopVol = 0; B.bubbleBurst = 0; changed(); await w(300); const hid = { inst: shown("the pop's instrument"), count: shown("how many smaller bubbles") };
    B.bubblePopVol = 40; B.bubbleBurst = 40; changed(); await w(300); const vis = { inst: shown("the pop's instrument"), count: shown("how many smaller bubbles") };
    return JSON.stringify({ deep, flat, always, never, hid, vis }); })()`));
  console.log("  " + JSON.stringify(r).slice(0, 1200));
  ok("smaller farther back: the nearest half again the farthest or more, the farthest drawn first", r.deep.hi >= 1.5 * r.deep.lo && r.deep.farFirst && r.deep.first < r.deep.last, r.deep);
  ok("at 🔭 0 all one size", Math.abs(r.flat.hi - r.flat.lo) < 0.01, r.flat);
  ok("at 💥 100 a pop bursts into smaller bubbles of its style", r.always.popped && r.always.kids.length > 0 && r.always.kids.every(k => k.r < r.always.popR && k.color === r.always.color && k.gen === 1), r.always);
  ok("with lines out from it", r.always.rays > 0, r.always.rays);
  ok("born on the friend, none pops on them before leaving", r.always.chained === 0, r.always.chained);
  ok("at 💥 0 a pop bursts into none", r.never.popped && r.never.kids.length === 0, r.never);
  ok("the pop's sound settings only with a sound, how many only with bursts", !r.hid.inst && !r.hid.count && r.vis.inst && r.vis.count, [r.hid, r.vis]);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
