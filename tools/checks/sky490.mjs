// (ticket 490, Matthew: "moon cycles. Seeing the moon accurately, during the cycle. Selecting a GPS coordinate and seeing the
// moon in the sky accurately at that GPS coordinate during the game's idea of its date"; "sun cycles ... Same idea") The
// sky by the clock, where and when the game says: the sun's height at noon in Denver at the solstices (73.7° and 26.8°)
// and in Sydney in June (32.7°, to the north); the moon new on 2026-10-10 and full on 2026-10-26; the midnight sun and
// the polar night at Tromsø; the times of day it makes; the camp site and the fairy forest drawing the sun or the moon
// where they are; 🌍 where and when shown only where the time of day is by the clock. Exits 1 on a failure.
//   node sky490.mjs <devtools port> <url>
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
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1200)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background; state.music.mute = true; state.world.at = null;
    const deg = x => x * 180 / Math.PI, at = (where, Y, M, D, h) => skyNow({ skyWhere: where, skyYear: Y, skyMonth: M, skyDay: D, skyHour: h });
    const v = { dJune: deg(at("denver", 2026, 6, 21, 12).sun.alt), dDec: deg(at("denver", 2026, 12, 21, 12).sun.alt), sJune: at("sydney", 2026, 6, 21, 12),
      newLit: at("denver", 2026, 10, 10, 12).moon.frac, fullLit: at("denver", 2026, 10, 26, 0).moon.frac, wax: at("denver", 2026, 10, 20, 20).moon.phase,
      tNight: deg(at("tromso", 2026, 12, 21, 12).sun.alt), tSun: deg(at("tromso", 2026, 6, 21, 0).sun.alt) };
    v.sJuneAlt = deg(v.sJune.sun.alt); v.sJuneAz = Math.abs(deg(v.sJune.sun.az)); delete v.sJune;
    const times = [12, 6, 22].map(h => skyTimeOf({ skyWhere: "denver", skyYear: 2026, skyMonth: 10, skyDay: 20, skyHour: h }));
    tab = TABS.findIndex(t => /Background/.test(t[0]));
    const seen = () => { showTab(); return [...document.querySelectorAll("#panel *")].some(e => (e.textContent || "").startsWith("🌍 the sky: where and when") && e.getClientRects().length); };
    Object.assign(B, { kind: "campsite", things: [], figX: -150, figY: 40, campTime: "clock", skyWhere: "denver", skyYear: 2026, skyMonth: 10, skyDay: 20, skyHour: 21 }); changed(); await w(500);
    const night = { moon: !!bgShown.node.querySelector('path[fill="#f4eebc"]'), shown: seen() };
    Object.assign(B, { skyMonth: 6, skyDay: 21, skyHour: 8 }); changed(); await w(400);
    const day = { sun: bgShown.node.querySelectorAll('animateTransform[type="rotate"]').length > 0 };
    B.campTime = "day"; changed(); await w(300); const hidden = !seen();
    Object.assign(B, { kind: "fairyforest", fairyTime: "clock", skyMonth: 10, skyDay: 20, skyHour: 21 }); changed(); await w(500);
    const fairy = { moon: !!bgShown.node.querySelector('path[fill="#f4eebc"]') };
    return JSON.stringify({ v, times, night, day, hidden, fairy }); })()`));
  const V = r.v;
  ok("the noon sun in Denver: 73.7° at the June solstice, 26.8° at the December one (within half a degree)", Math.abs(V.dJune - 73.7) < 0.5 && Math.abs(V.dDec - 26.8) < 0.5, V);
  ok("the noon sun in Sydney in June: 32.7° up, to the north", Math.abs(V.sJuneAlt - 32.7) < 0.5 && V.sJuneAz > 170, V);
  ok("the moon new on 2026-10-10 and full on 2026-10-26; waxing on 2026-10-20", V.newLit < 0.03 && V.fullLit > 0.97 && V.wax > 0.2 && V.wax < 0.45, V);
  ok("at Tromsø, the polar night at noon in December, the midnight sun in June", V.tNight < 0 && V.tSun > 0, V);
  ok("the times of day it makes: noon day, six in the morning dawn, ten at night night", r.times.join() === "day,sunrise,night", r.times);
  ok("the camp site by the clock: the moon drawn at night, the sun by day", r.night.moon && r.day.sun, [r.night, r.day]);
  ok("🌍 where and when shows where the time of day is by the clock, and not otherwise", r.night.shown && r.hidden, [r.night.shown, r.hidden]);
  ok("the fairy forest by the clock draws the moon at night", r.fairy.moon, r.fairy);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
