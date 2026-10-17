// Trips' frames (Matthew, 2026-10-16, on 0.0.90: pauses clicking a castle
// door and its animation, and going into a pit, by a click and by walking
// into it, and falling). In headless Chrome (start it pinned: taskset -c 0-3
// nice -n 10), a fresh page per trip, at Matthew's laptop's size by default
// (1203x802 at 1.875x): each frame's gap, which of the game's functions ran
// in it and for how long (wrapped: draw, mountScene, changed, persist, ...),
// long tasks, and a CPU profile's top functions by self time.
//   node trips_perf.mjs <devtools port> <url> [trip,...]   env: W H DPR PROFILE=1 GAP=34
// trips: gate (outside the castle, click its gate), hallway (click a side
// door that swings), pitclick (a trap room, click a pit), pitwalk (walk onto a pit, a fake pad)
const [dport, url, only] = process.argv.slice(2);
const W = +(process.env.W || 1203), H = +(process.env.H || 802), DPR = +(process.env.DPR || 1.875), GAP = +(process.env.GAP || 34);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TRIPS = {
  gate: { setup: `Object.assign(state.background, { kind: "castle", castle: "N" }); [state.background.figX, state.background.figY] = ARRIVE.castle || [0, 0];`,
          target: `[...bgShown.node.querySelectorAll(".portal[data-door]")].find(d => d.dataset.to === "castleroom")` },
  hallway: { setup: `Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 1, castleRoom1N: "hallway", figX: 0, figY: 40 });`,
             target: `[...bgShown.node.querySelectorAll(".portal[data-door]")].find(d => d.querySelector("[data-leaf]"))` },
  pitclick: { setup: `Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 1, castleRoom1N: "trap", figX: 250, figY: 40 });`,
              target: `bgShown.node.querySelector(".portal[data-pit]")` },
  pitwalk: { setup: `Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 1, castleRoom1N: "trap" });
                     { const [cx, cy, rx, ry] = bgShown.node.querySelector(".portal[data-pit]").dataset.pit.split(" ").map(Number); state.background.figX = Math.round(cx); state.background.figY = Math.round(cy + 2.2 * ry - SCENE.ground); }`,
             pad: 12 },
};
async function openPage() {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map(), errs = [];
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? "ERROR " + JSON.stringify(r.result.exceptionDetails).slice(0, 300) : r.result.result.value; };
  await send("Runtime.enable"); await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  return { page, send, ev, errs, close: () => fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`) };
}
const INSTRUMENT = `(() => {
  window.__T = { t0: performance.now(), frames: [], calls: [], long: [], marks: [] };
  const wrap = name => { const f = window[name]; if (typeof f !== "function") return; window[name] = function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { __T.calls.push([name, t - __T.t0, performance.now() - t]); } }; };
  for (const n of ["draw", "drawNow", "mountScene", "changed", "persist", "settle", "measureMarks", "sceneObjects", "showObjects", "showEnterGlow", "showHover", "moved", "musicSync", "feedMusic", "fitPic", "renderHud", "backSync", "fallDown", "fallLand", "startJump", "endJump", "stillLayers", "castleWallsOf", "seatsHere", "stillPart", "stillPicReset", "showStillPic"]) wrap(n);
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) __T.long.push([e.startTime - __T.t0, e.duration]); }).observe({ entryTypes: ["longtask"] }); } catch (e) {}
  let last = 0; const f = t => { if (last) __T.frames.push([t - __T.t0, t - last, state.background.kind + (state.background.castleRoom ?? ""), state.body.anim, entering ? 1 : 0]); last = t; if (!__T.stop) requestAnimationFrame(f); };
  requestAnimationFrame(f); return 1; })()`;
const results = {};
for (const [name, T] of Object.entries(TRIPS)) {
  if (only && !only.split(",").includes(name)) continue;
  const P = await openPage(), { send, ev } = P;
  try {
    // (CHOPPY=1: as a computer found choppy, the places held still and drawn as still pictures while moving)
    await ev(`localStorage.removeItem("dress-up-choppy"); localStorage.removeItem("dress-up-slow"); choppy = ${process.env.CHOPPY ? "true" : "false"}; slowFlag = false; state.music.mute = true; state.body.anim = "none"; changed(); 1`);
    if (T.pad !== undefined) await ev(`(() => { window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true }); const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); return 1; })()`);
    await ev(`${T.setup} changed(); 1`); await sleep(1500);
    await ev(INSTRUMENT);
    if (process.env.PROFILE) { await send("Profiler.enable"); await send("Profiler.setSamplingInterval", { interval: 200 }); await send("Profiler.start"); }
    const kind0 = await ev(`state.background.kind + (state.background.castleRoom ?? "")`);
    await sleep(300);
    if (T.pad !== undefined) await ev(`__T.marks.push(["press", performance.now() - __T.t0]); __pad.buttons[${T.pad}].pressed = true; 1`);
    else {
      // (the doorway's own shape, not one in a clip's defs, which has no box)
      const c = JSON.parse(await ev(`(() => { const d = ${T.target}; const r = (d.querySelector("[data-leaf] path, :scope > path, :scope > rect, :scope > ellipse") || d.querySelector("path, rect") || d).getBoundingClientRect(); return JSON.stringify([r.x + r.width / 2, r.y + r.height * 0.6]); })()`));
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: c[0], y: c[1] });
      await ev(`__T.marks.push(["click", performance.now() - __T.t0]); 1`);
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x: c[0], y: c[1], button: "left", buttons: 1, clickCount: 1 });
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: c[0], y: c[1], button: "left", buttons: 0, clickCount: 1 });
    }
    // until they have arrived somewhere else and stood a while
    let arrived = 0;
    for (let i = 0; i < 80; i++) { await sleep(100); const k = await ev(`state.background.kind + (state.background.castleRoom ?? "") + (entering ? "*" : "") + ":" + state.body.anim`); if (!arrived && !k.includes("*") && !k.startsWith(kind0 + ":")) arrived = i; if (arrived && i - arrived > 15) break; }
    if (T.pad !== undefined) await ev(`__pad.buttons.forEach(b => b.pressed = false); 1`);
    const D = JSON.parse(await ev(`__T.stop = true; JSON.stringify(__T)`));
    let prof = null;
    if (process.env.PROFILE) { prof = (await send("Profiler.stop")).result.profile; }
    // the report
    const fr = D.frames, gaps = fr.filter(f => f[1] > GAP), tot = fr.reduce((a, f) => a + f[1], 0);
    const by = {}; for (const [n, t, ms] of D.calls) { by[n] = by[n] || [0, 0, 0]; by[n][0]++; by[n][1] += ms; by[n][2] = Math.max(by[n][2], ms); }
    console.log(`\n== ${name}: ${(tot / 1000).toFixed(1)} s, ${fr.length} frames, ${Math.round(1000 * fr.length / tot)} fps; frames over ${GAP} ms: ${gaps.length}; long tasks: ${D.long.length}${P.errs.length ? " · ERRORS " + P.errs.join(" | ") : ""}`);
    console.log("   marks", JSON.stringify(D.marks.map(([m, t]) => [m, Math.round(t)])));
    for (const g of gaps) {
      const end = g[0], start = end - g[1], inside = D.calls.filter(([n, t, ms]) => t >= start - 1 && t < end && ms > 1).map(([n, t, ms]) => `${n} ${ms.toFixed(1)}`);
      console.log(`   gap ${g[1].toFixed(0).padStart(4)} ms at ${Math.round(start)} (${g[2]} ${g[3]}${g[4] ? " entering" : ""}): ${inside.slice(0, 8).join(", ") || "(no game function over 1 ms: the browser)"}`);
    }
    console.log("   functions (calls, total ms, max ms):", Object.entries(by).sort((a, b) => b[1][1] - a[1][1]).slice(0, 12).map(([n, [c, s, m]]) => `${n} ${c}/${s.toFixed(0)}/${m.toFixed(1)}`).join(" · "));
    if (D.long.length) console.log("   long tasks:", D.long.map(([t, d]) => `${Math.round(t)}+${Math.round(d)}`).join(" "));
    if (prof) {
      const self = new Map(), dt = prof.timeDeltas, byId = new Map(prof.nodes.map(n => [n.id, n]));
      prof.samples.forEach((id, i) => { const n = byId.get(id), f = n.callFrame, k = `${f.functionName || "(anon)"}:${f.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (dt[i] || 0) / 1000); });
      console.log("   profile self ms:", [...self.entries()].filter(([k]) => !/^\((idle|program|garbage collector)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(" · "));
      const gc = [...self.entries()].filter(([k]) => /garbage|program/.test(k)).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(" · "); console.log("   (also: " + gc + ")");
    }
    results[name] = { frames: fr.length, gaps: gaps.map(g => Math.round(g[1])), by };
  } finally { await P.close(); }
}
