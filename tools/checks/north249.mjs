// (ticket 249, Matthew: "rescale the placed objects when I drag the 'smaller going north' slider, including the main char";
// "expose the three far away options to the world designer"; "for the toggles for N/S/E/W, etc.... use the UX we made
// for world designer, with the 9 cells -- the center cell be empty in this case") In a forest crossing: a rock put far
// back and the friend there, both smaller as 🔭 goes up and the same size anywhere at 0, live; the World design tab's
// square panel offers its three 🌄 choices, and one chosen is the crossing's and kept in its square; the Background
// tab's 🛤️ paths a compass round an empty middle, a tap turning a path on or off. Exits 1 on a failure.
//   node north249.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world = clone(WORLD_DEFAULT); const key = Object.keys(state.world.cells).find(k => state.world.cells[k].kind === "crossing"); worldEnter(key); await w(500);
    const yMin = figYMin(sceneFrame), farY = Math.round(yMin + 20);
    B.things = [{ kind: "rock", x: 150, z: SCENE.ground + farY, seed: 77, size: 100, mirror: false, tone: ROCK_TONES[0] }]; B.figX = -150; B.figY = farY; changed(); await w(300);
    // (the rock's drawn scale, and the friend's)
    const sizes = () => { const el = bgShown.node.querySelector('[data-drag="thing:0"] > g'), m = /scale\\(([-\\d.]+)/.exec(el ? el.getAttribute("transform") : ""); return { rock: m ? +m[1] : null, friend: +figureT.k.toFixed(4) }; };
    const out = {}; for (const pct of [5, 10, 20, 0]) { set("background", "north_crossing", pct); await w(150); out[pct] = sizes(); }
    set("background", "north_crossing", northDefault("crossing"));
    return JSON.stringify({ key, out }); })()`));
  console.log(`  🔭 at 5, 10, 20, 0: ${JSON.stringify(r.out)}`);
  const o = r.out;
  ok("🔭 up, the rock far back smaller: at 5, 10, 20 its drawn size goes down", o[5].rock > o[10].rock && o[10].rock > o[20].rock, o);
  ok("and the friend there with it", o[5].friend > o[10].friend && o[10].friend > o[20].friend, o);
  ok("at 0, both the same size as anywhere (the rock its own size)", Math.abs(o[0].rock - 1) < 0.01 && o[0].friend > o[5].friend, o);
  // the World design tab: the crossing's 🌄 choices
  const wd = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); tab = TABS.findIndex(t => t[1] === "world"); showTab(); changed(); await w(400);
    const btns = [...document.querySelectorAll("#panel .world-back-row button")]; const names = btns.map(b => b.dataset.back);
    // (0.0.191: chosen twice, the second shown chosen too, without the panel built again: it was left showing the first)
    const pick = v => { const b = [...document.querySelectorAll("#panel .world-back-row button")].find(b => b.dataset.back === v); if (b) b.click(); };
    pick("mountains"); await w(200); pick("sky"); await w(300); settle(); await w(200);
    const after = [...document.querySelectorAll("#panel .world-back-row button")].find(b => b.dataset.back === "sky");
    return JSON.stringify({ names, now: state.background.crossBack, kept: state.world.cells[state.world.at].crossBack, pressed: after && after.getAttribute("aria-pressed") }); })()`));
  console.log(`  the World design tab at the crossing: ${JSON.stringify(wd)}`);
  ok("the World design tab's square panel offers the crossing's three 🌄 choices", wd.names.join() === "woods,sky,mountains", wd);
  ok("one chosen there is the crossing's, kept in its square, and shown chosen", wd.now === "sky" && wd.kept === "sky" && wd.pressed === "true", wd);
  // the Background tab: the paths as a compass
  const bg = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background; tab = TABS.findIndex(t => t[1] === "background"); showTab(); changed(); await w(400);
    const g = document.querySelector('#panel .compass-group[data-key="crossPaths"]'); if (!g) return JSON.stringify({ none: true });
    const cells = [...g.querySelectorAll(".world-compass > *")].map(c => c.tagName === "BUTTON" ? c.dataset.way : "·");
    const was = !!B.crossNE; g.querySelector('[data-way="NE"]').click(); await w(200); const now = !!B.crossNE, pressed = g.querySelector('[data-way="NE"]').getAttribute("aria-pressed");
    g.querySelector('[data-way="NE"]').click(); await w(100);
    return JSON.stringify({ cells, was, now, pressed, hidden: g.hidden }); })()`));
  console.log(`  the Background tab's paths: ${JSON.stringify(bg)}`);
  ok("🛤️ the paths that meet here: a compass, NW N NE / W · E / SW S SE, its middle empty", !bg.none && bg.cells.join() === "NW,N,NE,W,·,E,SW,S,SE" && !bg.hidden, bg);
  ok("a tap on NE turns that path the other way, and the button shows it", bg.now === !bg.was && bg.pressed === String(bg.now), bg);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
