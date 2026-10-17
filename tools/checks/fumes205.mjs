// (ticket 205, Matthew: the simple cauldron fumes closer to the fancy ones,
// "measured at 15 cauldrons on GitHub before release") The simple fumes'
// shape: twelve moments a turn (thirteen values, the last the first again),
// each strand painted with a band that slides up it, bright at the front.
// Then frames a second with 15 cauldrons in the clearing, 0.0.129's simple
// fumes (its helixCheapSvg, kept here) against these, taking turns on one
// computer, four rounds each, the order turned each round, so the runner's
// own speed and any drift cancel out. Said, and judged only against a loss
// of more than 10%. Exits 1 on a failure.
//   node fumes205.mjs <devtools port> <url>
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
const OLD = "function helixCheap129(cx, bottom, top, r0, r1, k, colors = [\"#7bd33a\", \"#4aa3ff\"]) {\n  const n = Math.max(2, Math.ceil((bottom - top) / (13 * k))), K = 6, N = 9;\n  const pathAt = (si, f) => {\n    const pts = [...Array(N)].map((_, i) => { const u = i / (N - 1), a = u * n * 0.42 + si * Math.PI - 2 * Math.PI * f / K;\n      return [cx + (r0 + (r1 - r0) * u) * Math.cos(a), bottom - (bottom - top) * u]; });\n    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;\n    for (let i = 0; i < N - 1; i++) {\n      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(N - 1, i + 2)];\n      d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;\n    }\n    return d;\n  };\n  // (fading as it rises, as the full ones do: a still gradient along each plume, no moving part)\n  return colors.map((c, si) => { const ds = [...Array(K + 1)].map((_, f) => pathAt(si, f)), id = `fume-${si}-${Math.round(bottom)}-${Math.round(top)}`;\n    return `<defs><linearGradient id=\"${id}\" gradientUnits=\"userSpaceOnUse\" x1=\"0\" y1=\"${f1(bottom)}\" x2=\"0\" y2=\"${f1(top)}\"><stop offset=\"0\" stop-color=\"${c}\" stop-opacity=\"0.9\"/><stop offset=\"1\" stop-color=\"${c}\" stop-opacity=\"0.2\"/></linearGradient></defs>` +\n           `<path d=\"${ds[0]}\" fill=\"none\" stroke=\"url(#${id})\" stroke-width=\"${f1(6 * k)}\" stroke-linecap=\"round\" stroke-linejoin=\"round\">` +\n           `<animate attributeName=\"d\" values=\"${ds.join(\";\")}\" dur=\"2.4s\" repeatCount=\"indefinite\"/></path>`; }).join(\"\");\n}";
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world = clone(DEFAULTS.world); worldEnter("3,3"); B.figX = -400;
    B.things = [{ kind: "cauldron", x: 100, z: 370, seed: 31, size: 100, fumes: "simple" }]; changed(); await w(600);
    const c = document.querySelector('#bg [data-drag="thing:0"]'), strands = [...c.querySelectorAll('path[id^="fume-"] > animate[attributeName="d"]')];
    const shape = { strands: strands.length, moments: strands.map(a => a.getAttribute("values").split(";").length), paint: strands.map(a => a.parentElement.getAttribute("stroke") || ""),
      bands: c.querySelectorAll('linearGradient > animateTransform[attributeName="gradientTransform"]').length, moving: thingMoving(c) };
    const NEW = helixCheapSvg; ${OLD}
    const put = async (fn, round) => { window.helixCheapSvg = fn; B.things = [...Array(15)].map((_, i) => ({ kind: "cauldron", x: -360 + (i % 8) * 100, z: 330 + Math.floor(i / 8) * 50, seed: 100 * round + i, size: 100, fumes: "simple" })); changed(); await w(800); };
    // (taking turns, the order turned each round, so a drift over the run falls on both alike)
    const V = [["0.0.129", helixCheap129], ["these", NEW]], ab = { old: [], now: [], movingOld: 0, movingNow: 0 };
    for (let round = 0; round < 4; round++) for (let j = 0; j < 2; j++) { const [name, fn] = V[(j + round) % 2]; await put(fn, round * 10 + j);
      const m = thingsMovingNow().reduce((s, x) => s + x.n, 0), fps = await framesNow(2000);
      if (name === "0.0.129") { ab.old.push(fps); ab.movingOld = m; } else { ab.now.push(fps); ab.movingNow = m; } }
    window.helixCheapSvg = NEW; B.things = []; changed();
    return JSON.stringify({ shape, ab }); })()`));
  ok("the simple fumes: two strands, each twelve moments a turn", r.shape.strands === 2 && r.shape.moments.every(m => m === 13), r.shape);
  ok("each painted with a band, bright at the front, sliding up", r.shape.paint.length === 2 && r.shape.paint.every(u => /url\(/.test(u)) && r.shape.bands === 2, r.shape);
  ok("a cauldron so drawn: under thirty moving parts", r.shape.moving < 30, r.shape);
  const med = a => { const b = [...a].sort((x, y) => x - y); return (b[(b.length - 1) >> 1] + b[b.length >> 1]) / 2; }, o = med(r.ab.old), m = med(r.ab.now);
  console.log(`  15 cauldrons, simple fumes, taking turns (GitHub's Chrome): 0.0.129's ${r.ab.old.join(", ")} fps (median ${o}; ${r.ab.movingOld} moving parts) · these ${r.ab.now.join(", ")} fps (median ${m}; ${r.ab.movingNow} moving parts)`);
  ok("these no more than 10% fewer frames a second than 0.0.129's", m >= 0.9 * o, { old: r.ab.old, now: r.ab.now });
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
