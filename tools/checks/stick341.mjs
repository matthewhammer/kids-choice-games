// (ticket 341, Matthew: "find a way to for dynamic bubbles in scene, in some proportion, to stick to bubbles extending from
// floors and walls in this scene, and others"; "slider to control how often they stick") A bubble maker in the bubble room:
// at 🫧 100 its bubbles stick to the bubbles standing out of the foam, up to STICK_MAX (30) at once; at 0 none do; in bubble
// space they stick to its own bubbles. Cheap: makerTick under a millisecond with the room's hundreds. Exits 1 on a failure.
//   node stick341.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground;
    state.music.mute = true; state.world.at = null; climb = null; B.kind = "bubbleroom"; B.things = []; B.figX = 300; changed(); await w(900);
    const run = async (kind, key, v) => { B.kind = kind; B[key] = v; makerSim.list.forEach(b => b.el.remove()); makerSim.list = [];
      B.things = [{ kind: "bubblemaker", x: -200, z: g + 40, seed: 901, size: 100, mirror: false, rate: 12 }]; changed(); await w(5000);
      const t0 = performance.now(); for (let i = 0; i < 50; i++) { makerSim.last = 0; makerTick(performance.now()); cancelAnimationFrame(makerSim.raf); makerSim.raf = 0; }
      makerSim.raf = requestAnimationFrame(makerTick);
      return { n: makerSim.list.length, stuck: makerSim.list.filter(b => b.stuck).length, ms: (performance.now() - t0) / 50 }; };
    const all = await run("bubbleroom", "foamStick", 100), none = await run("bubbleroom", "foamStick", 0), space = await run("bubblespace", "bubbleStick", 100);
    return JSON.stringify({ all, none, space, balls: roomBalls ? roomBalls.list.length : 0, dflt: [DEFAULTS.background.foamStick, DEFAULTS.background.bubbleStick] }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("at 100, the bubble room's moving bubbles stick, up to 30 at once", r.all.stuck === 30 && r.all.n > 30, r.all);
  ok("at 0, none stick", r.none.stuck === 0 && r.none.n > 10, r.none);
  ok("in bubble space, they stick to its bubbles", r.space.stuck > 0, r.space);
  ok("cheap: a frame's step under a millisecond", r.all.ms < 1 && r.none.ms < 1, [r.all.ms, r.none.ms]);
  ok("30 to start, in both places", r.dflt[0] === 30 && r.dflt[1] === 30, r.dflt);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
