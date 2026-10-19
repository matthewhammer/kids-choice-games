// (ticket 288) Diving: a scuba suit (its yoke and fins) and an old diving suit (its helmet and corselet, its air hose up
// to the top of the scene, no hair under the helmet; its seams and rivets), each facing us, from behind and in profile;
// gear worn with anything (a face mask, a snorkel, an air tank), but not under the old helmet; and 🫧 leaks: none at 0,
// bubbles streaming out at 100, more than at 30. Exits 1 on a failure.
//   node dive288.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), C = state.costume, B = state.body, W = state.background;
    state.music.mute = true; state.world.at = null; climb = null; W.things = []; W.kind = "underwater"; W.figX = 0; W.figY = 0; B.anim = "none"; changed(); await w(500);
    // (in profile in a place the far leg, its shoe or fin too, is drawn apart, a body's depth behind: #figure-far)
    const views = ["front", "back", "left"], look = () => { const f = document.getElementById("figure"), n = k => document.querySelectorAll('#figure [data-dive="' + k + '"], #figure-far [data-dive="' + k + '"]').length;
      const h = f.querySelector("[data-hose]"), P = document.getElementById("pic").getBoundingClientRect();
      return { helmet: n("helmet"), corselet: n("corselet"), seam: n("seam"), ring: n("ring"), fin: n("fin"), yoke: n("yoke"), mask: n("mask"), snorkel: n("snorkel"), tank: n("tank"),
               hoseTop: h ? Math.round(h.getBoundingClientRect().top - P.top) : null, hair: f.querySelectorAll('[data-layer="hair"], .veil-hair').length }; };
    const wear = (kind, gear) => views.map(v => { Object.assign(C, { kind, mask: !!gear, snorkel: !!gear, tank: !!gear }); B.facing = v; draw(); return look(); });
    const scuba = wear("scuba"), diver = wear("diver", true), gear = wear("none", true);
    const choices = [...document.querySelectorAll("button, option")].map(e => e.textContent).filter(t => /scuba suit|old diving suit/.test(t)).length;
    // (leaks: the bubbles out in two seconds, at 0, 30 and 100)
    const leak = async (kind, v) => { Object.assign(C, { kind, mask: false, snorkel: false, tank: kind === "scuba", leaks: v }); B.facing = "front"; draw(); await w(2000);
      const L = document.getElementById("leak-bubbles"); return L ? L.children.length : 0; };
    const leaks = { diver0: await leak("diver", 0), diver30: await leak("diver", 30), diver100: await leak("diver", 100), scuba100: await leak("scuba", 100) };
    Object.assign(C, { kind: "none", mask: false, snorkel: false, tank: false, leaks: 0 }); B.facing = "front"; draw();
    return JSON.stringify({ scuba, diver, gear, choices, leaks }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("the scuba suit: its yoke and both fins, facing us, from behind and in profile", r.scuba.every(v => v.yoke === 1 && v.fin === 2), r.scuba);
  ok("the old diving suit: its helmet and corselet in every view", r.diver.every(v => v.helmet === 1 && v.corselet === 1), r.diver);
  ok("its seams and rivets: a seam over the crown and the neck ring, in every view", r.diver.every(v => v.seam === 1 && v.ring === 1), r.diver.map(v => [v.seam, v.ring]));
  ok("its air hose reaches the top of the scene", r.diver.every(v => v.hoseTop !== null && v.hoseTop <= 6), r.diver.map(v => v.hoseTop));
  ok("no mask, snorkel or tank under the old helmet, even switched on", r.diver.every(v => !v.mask && !v.snorkel && !v.tank), r.diver);
  ok("gear with everyday clothes: a mask, a snorkel and a tank in every view", r.gear.every(v => v.mask >= 1 && v.snorkel === 1 && v.tank === 1), r.gear);
  ok("🫧 leaks: no bubbles at 0; at 100 bubbles stream out of the old suit and the scuba suit, more than at 30", r.leaks.diver0 === 0 && r.leaks.diver100 > 10 && r.leaks.diver100 > r.leaks.diver30 && r.leaks.scuba100 > 10, r.leaks);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
