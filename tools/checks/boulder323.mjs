// (ticket 323, N, through Matthew: a second pair of levers under the first, blue-knobbed, that let boulders fall from the
// ceiling into the pits; and every lever choosing what it does) N's trap room: the blue pair there; the left one pulled:
// its pit covered (no way down, a "boulder, left" standing there, since ticket 338 a placed rock, "fallen N"), the boulder seen falling; pulled again: gone, the way
// down back. A placed lever set to drop boulders, wired to a trap door: pulled, the trap door has a boulder in it and no
// hole. Exits 1 on a failure.
//   node boulder323.mjs <devtools port> <url>
//   node pitlids307.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null;
    for (const k of Object.keys(B)) if (/^castle(Lever|Boulder)[LR]_/.test(k)) delete B[k];
    Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: 0, figY: 80, things: [], castleLeverL_3N: false, castleLeverR_3N: false }); changed(); await w(500);
    const q = () => ({ blue: bgShown.node.querySelectorAll('[data-lever^="B"]').length, ways: bgShown.node.querySelectorAll(".portal[data-pit]").length, boulder: (B.things || []).some(t => t.fallen) && !!bgShown.node.querySelector('[data-drag^="thing:"]') });   // (ticket 369: since ticket 338 a landed boulder is a placed rock, "fallen N", in the place's things)
    const start = q(); roomLeverPull("BL"); const ys = [];
    for (let i = 0; i < Math.ceil((BOULDER_FALL + 300) / 50); i++) { await w(50);   /* (ticket 369: the whole fall, 1300 ms since ticket 328; this watched 800) */ const g = bgShown.node.querySelector('[data-boulder="0"]'); const m = g && /translate\\(0 (-?[\\d.]+)/.exec(g.getAttribute("transform") || ""); ys.push(m ? Math.round(+m[1]) : 0); }
    const fallen = q(); roomLeverPull("BL"); await w(BOULDER_FALL + 400); const lifted = q();   // (the lift as long as the fall, ticket 328's; the rock gone after it)
    Object.assign(B, { kind: "emptyroom", things: [{ ...(THING_DEFAULTS.trapdoor || {}), kind: "trapdoor", x: -180, z: SCENE.ground + 90, size: 100, uid: "dtest", open: true },
                                                   { ...(THING_DEFAULTS.lever || {}), kind: "lever", x: 180, z: SCENE.ground + 60, size: 100, works: ["dtest"], on: false, does: "boulder" }] });
    changed(); await w(300); leverPull(1); await w(900);
    const placed = { boulder: !!B.things[0].boulder, drawn: !!bgShown.node.querySelector('[data-drag="thing:0"] [data-boulder]'), hole: !!bgShown.node.querySelector('[data-drag="thing:0"] [data-hole]'), blueKnob: bgShown.node.querySelector('[data-drag="thing:1"]').innerHTML.includes(BOULDER_KNOB) };
    return JSON.stringify({ start, ys, fallen, lifted, placed }); })()`));
  console.log(`  start ${JSON.stringify(r.start)}; falling ${r.ys.join(" ")}; fallen ${JSON.stringify(r.fallen)}; lifted ${JSON.stringify(r.lifted)}; placed ${JSON.stringify(r.placed)}`);
  ok("the trap room has its blue pair, both pits a way down", r.start.blue === 2 && r.start.ways === 2 && !r.start.boulder, r.start);
  // (ticket 369: since ticket 338 the landed boulder is a placed rock, and the room's own goes back up out of sight: seen from the
  // ceiling down to the pit, not still there at the end)
  ok("the left one pulled: the boulder seen falling (between the ceiling and the pit)", r.ys.some(y => y < -400) && r.ys.some(y => y > -30 && y < -2), r.ys);
  ok("then its pit covered: one way down left, a boulder standing in it", r.fallen.ways === 1 && r.fallen.boulder, r.fallen);
  ok("pulled again: the boulder gone, both ways down back", r.lifted.ways === 2 && !r.lifted.boulder, r.lifted);
  ok("a placed boulder lever (blue knob) drops a boulder into its trap door, which has no hole then", r.placed.boulder && r.placed.drawn && !r.placed.hole && r.placed.blueKnob, r.placed);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
