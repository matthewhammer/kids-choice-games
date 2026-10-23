// (ticket 546, M: in a dress, riding the horse (facing left, right, toward us and away), squatting and running, "the legs
// stick out of the dress as if it had strange holes in it") A dress, a long skirt and a robe each drawn over posed legs:
// riding (a smaller horse, 55, so the rider's legs are in sight beside it), crouching, running and walking at several
// moments of the stride, sitting and the knees bent by their slider, in every facing that applies. Each leg, its middle and
// both its edges, sampled from the hip down to just above the hem: every point inside the cloth (the cloth's own path,
// isPointInFill), so a leg comes out only under the hem. Standing, the cloth is drawn as before: its outline starts at the
// waist (M-x y Lx y). Exits 1 on a failure.
//   node dress546.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1500)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { cases: {}, standing: {} };
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "none", things: [], seat: null });
    set("body", "pose", "stand"); state.body.sit = false; state.body.anim = "none"; set("costume", "kind", "none");
    // (each cloth in a colour of its own, to find its path in the friend by its fill; the king's robe by his robe's colour)
    const CLOTHS = { dress: { pants: { style: "dress", skirtLen: 95, color: "#d0508b", pattern: "plain" } },
                     skirt: { pants: { style: "skirt", skirtLen: 100, color: "#3f7fbe", pattern: "plain" } },
                     robe: { costume: { kind: "king", kingRobe: "#7a1f2d" }, color: "#7a1f2d" } };
    const POSES = { "ride/left": { horse: "ride", facing: "left" }, "ride/right": { horse: "ride", facing: "right" }, "ride/front": { horse: "ride", facing: "front" },
                    "ride/back": { horse: "ride", facing: "back" }, "crouch/front": { anim: "crouch", facing: "front" }, "crouch/right": { anim: "crouch", facing: "right" },
                    "crouch/back": { anim: "crouch", facing: "back" }, "run/right": { anim: "run", facing: "right", phases: [0, 0.0625, 0.125, 0.25, 0.375] },
                    "run/left": { anim: "run", facing: "left", phases: [0.125, 0.375] }, "walk/right": { anim: "walk", facing: "right", phases: [0, 0.25, 0.5, 0.75] },
                    "sit/right": { sit: true, facing: "right" }, "knees/front": { knees: 120, facing: "front" } };
    const clothOf = (fill, L) => [...document.querySelectorAll("#figure path")].filter(p => p.getAttribute("fill") === fill)
      .map(p => ({ p, b: p.getBBox() })).filter(({ b }) => Math.abs(b.y - (L - 10)) < 14 && b.y + b.height > L + 20).sort((a, c) => c.b.height - a.b.height)[0] || null;
    // (a leg's points from the hip down, every 4 units, its middle and both edges, until it goes under the hem)
    const uncovered = (cloth, hemTest) => { const miss = [], J = poseJoints, r = J.legW / 2;
      for (const l of J.legs) { const pts = [l.H, l.K, l.F]; let under = false;
        for (let i = 1; i < pts.length && !under; i++) { const [a, b] = [pts[i - 1], pts[i]], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
          for (let s = 0; s <= len; s += 4) { const x = a[0] + (b[0] - a[0]) * s / len, y = a[1] + (b[1] - a[1]) * s / len;
            const ps = [[x, y], [x + nx * r, y + ny * r], [x - nx * r, y - ny * r]];
            if (ps.some(([, py]) => py >= hemTest)) { under = true; break; }
            for (const [px, py] of ps) if (py > J.L && !cloth.isPointInFill(new DOMPoint(px, py))) miss.push([l.side, Math.round(px), Math.round(py)]); } } }
      return miss; };
    for (const [cn, C] of Object.entries(CLOTHS)) {
      set("costume", "kind", "none"); Object.assign(state.pants, DEFAULTS.pants, C.pants || {}); if (C.costume) Object.assign(state.costume, C.costume);
      const fill = C.color || C.pants.color;
      for (const [pn, Po] of Object.entries(POSES)) for (const ph of Po.phases || [0]) {
        Object.assign(state.body, { horse: "none", horseSize: 55, anim: "none", sit: false, knees: 0, facing: "front", pose: "stand" }, Po); delete state.body.phases;
        holdStill(0); const L0 = lfoNow("B"); holdStill(ph * L0.dur); changed(); await w(40);
        const t = document.getElementById("figure").outerHTML, J = poseJoints, c = clothOf(fill, J.L);
        const key = cn + " " + pn + (Po.phases ? " @" + ph : "");
        if (!c) { out.cases[key] = { found: false }; continue; }
        // (the hem: the cloth's lowest, less its scallops' depth and a margin)
        const miss = uncovered(c.p, c.b.y + c.b.height - 20);
        out.cases[key] = { found: true, miss: miss.length, at: miss.slice(0, 4), bad: /NaN|undefined/.test(t) };
      }
      // standing, every facing: drawn as before, from the waist
      Object.assign(state.body, { horse: "none", anim: "none", sit: false, knees: 0, pose: "stand" });
      for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(40);
        const c = clothOf(fill, poseJoints.L), m = c && c.p.getAttribute("d").match(/^M(-[0-9.]+) (-?[0-9.]+) L([0-9.]+) (-?[0-9.]+) L/);
        out.standing[cn + " " + facing] = !!m && m[2] === m[4] && Number(m[1]) === -Number(m[3]); }
    }
    stillAt = null;
    return JSON.stringify(out); })()`));
  const C = r.cases, keys = Object.keys(C);
  console.log(`  ${keys.map(k => k + ": " + (C[k].found ? C[k].miss : "not found")).join(", ")}`);
  ok("the cloth found in every case", keys.every(k => C[k].found), keys.filter(k => !C[k].found));
  ok("nothing undefined in the friend", keys.every(k => !C[k].bad), keys.filter(k => C[k].bad));
  for (const pose of ["ride", "crouch", "run", "walk", "sit", "knees"]) {
    const ks = keys.filter(k => k.split(" ")[1].startsWith(pose + "/"));
    ok(`${pose}: every leg covered from the hip to the hem (dress, long skirt, robe)`, ks.every(k => C[k].found && C[k].miss === 0), Object.fromEntries(ks.filter(k => C[k].miss).map(k => [k, C[k].at])));
  }
  ok("standing, every facing, the cloth drawn as before (from the waist)", Object.values(r.standing).every(Boolean), r.standing);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
