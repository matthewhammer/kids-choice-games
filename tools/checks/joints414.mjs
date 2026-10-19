// (ticket 414) The elbows' and knees' curl and swing: facing us, a 90-degree curl points the forearm at us (seen short),
// a swing moves the hand out (+) or in (-); in profile the curl bends forward; a knee curled 90 facing us kneels, its shoe
// under the leg; every animation and pose draws with them set (no NaN, a body of a sane size). Exits 1 on a failure.
//   node joints414.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, Bd = state.body;
    state.music.mute = true; state.world.at = null; climb = null; Bd.sit = false; B.seat = null; B.things = []; B.kind = "emptyroom"; B.figX = 0; B.figY = 60;
    const set = async o => { Object.assign(Bd, { elbowCurl: 0, elbowSwing: 0, kneeCurl: 0, kneeSwing: 0, facing: "front", anim: "none", pose: "stand" }, o); changed(); await w(150); };
    const arm = () => poseJoints.arms.find(a => a.side === 1), fore = a => Math.hypot(a.H[0] - a.E[0], a.H[1] - a.E[1]);
    await set({}); const a0 = arm(), f0 = fore(a0);
    await set({ elbowCurl: 90 }); const f90 = fore(arm());
    await set({ elbowCurl: 90, elbowSwing: 60 }); const out = arm().H[0];
    await set({ elbowCurl: 90, elbowSwing: -60 }); const inn = arm().H[0];
    await set({ elbowCurl: 90, facing: "right" }); const pr = poseJoints.arms.map(a => a.H[0] - a.E[0]);
    await set({}); const g0 = figureT.dy + figureT.sg, h0 = document.getElementById("figure").getBBox().height;
    await set({ kneeCurl: 90 }); const f = document.getElementById("figure"), kneelH = f.getBBox().height, parts = [...f.querySelectorAll("[data-part]")].map(e => e.dataset.part);
    const feetFirst = parts.indexOf("feet") >= 0 && parts.indexOf("feet") < parts.indexOf("pants");
    const bad = [];
    for (const facing of ["front", "right"]) for (const a of ANIMS.map(x => x[0])) { await set({ elbowCurl: 100, elbowSwing: 40, kneeCurl: 70, kneeSwing: -30, facing, anim: a });
      const g = document.getElementById("figure"), b = g.getBBox(); if (/NaN/.test(g.innerHTML) || !(b.height > 60) || b.height > 3000) bad.push(a + " " + facing); }
    for (const p of Object.keys(POSES)) { await set({ elbowCurl: 100, elbowSwing: 40, kneeCurl: 70, kneeSwing: -30 }); strikePose(p); changed(); await w(150);
      const g = document.getElementById("figure"), b = g.getBBox(); if (/NaN/.test(g.innerHTML) || !(b.height > 60) || b.height > 3000) bad.push("pose " + p); }
    await set({});
    return JSON.stringify({ f0: Math.round(f0), f90: Math.round(f90), out: Math.round(out), inn: Math.round(inn), x0: Math.round(a0.H[0]), pr: pr.map(Math.round), h0: Math.round(h0), kneelH: Math.round(kneelH), feetFirst, bad }); })()`));
  console.log(`  the joints: ${JSON.stringify(r)}`);
  ok("facing us, a 90-degree elbow curl points the forearm at us: seen short", r.f90 < 0.25 * r.f0, r);
  ok("the swing moves the hand out (+) and in (-)", r.out > r.inn + 10, r);
  ok("in profile the curl bends the forearm forward, the way they face", r.pr.every(dx => dx > 5), r);
  ok("a knee curled 90 facing us kneels (shorter), its shoe drawn under the leg", r.kneelH < r.h0 - 20 && r.feetFirst, r);
  ok("every animation and pose draws with them set: no NaN, a sane size", !r.bad.length, r.bad);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
