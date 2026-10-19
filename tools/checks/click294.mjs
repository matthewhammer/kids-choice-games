// (ticket 294) Walking to a click, another click while walking: with ♿ 👆's "walks there instead" (the default) the walk
// under way stops where the friend is and a new one goes to the new click, never on to the first; with "walks there
// next, after", the first is walked to first (ticket 266's queue). The choice shows in ♿ and in 🎮 Controls. Exits 1 on a failure.
//   node click294.mjs <devtools port> <url>
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground;
    state.music.mute = true; state.world.at = null; climb = null; B.things = []; B.kind = "emptyroom"; state.access.clickWalk = true; changed(); await w(400);
    const dflt = state.access.clickPlan;
    const run = async mode => { state.access.clickPlan = mode; B.figX = -200; B.figY = 40; changed(); await w(200);
      walkPlanned(200, g + 40); await w(400); const mid = B.figX; walkPlanned(-100, g + 60); const segs = new Set(walkPath.segs).size;
      let most = -999; for (let i = 0; i < 160 && clickRun; i++) { most = Math.max(most, B.figX); await w(50); }
      return { mid: Math.round(mid), most: Math.round(most), segs, end: [Math.round(B.figX), Math.round(B.figY)] }; };
    const replace = await run("replace"), queue = await run("queue");
    state.access.clickPlan = dflt; changed();
    return JSON.stringify({ dflt, replace, queue }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("the default: a click while walking walks there instead", r.dflt === "replace", r);
  ok("instead: one plan, the friend never walks on toward the first click, and gets to the new one", r.replace.segs === 1 && r.replace.most < r.replace.mid + 120 && r.replace.end[0] === -100, r.replace);
  ok("next, after: two plans, the first walked to first, then the new one", r.queue.segs === 2 && r.queue.most > 150 && r.queue.end[0] === -100, r.queue);
  const ctl = JSON.parse(await ev(`(() => { const has = t => [...document.querySelectorAll("button, span, div")].some(e => e.textContent.trim() === t);
    const tab = name => [...document.querySelectorAll("button")].find(b => b.textContent.trim() === name);
    tab("🎮 Controls")?.click(); const inControls = has("👆 a click while walking to one");
    tab("♿ Accessibility")?.click(); const inAccess = has("🔁 walks there instead") && has("➕ walks there next, after");
    return JSON.stringify({ inControls, inAccess }); })()`));
  ok("the choice shows in 🎮 Controls and in ♿ Accessibility", ctl.inControls && ctl.inAccess, ctl);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
