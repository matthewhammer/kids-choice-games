// (ticket 657, M's next: night and day, and "the need to sleep at night") 🌗 night and day: off to start; on, the hour runs
// (dayMinutes), a place is darkened after sunset (lighter inside; none where a place has its own night, which then follows the
// clock), the hour and the nights slept are shown; lying down in a bed by day only says so; after sunset it is sleeping: the next
// morning at 7, the date on, one more night (before midnight, the next day; after it, the same day). A computer taken as fast.
// Exits 1 on a failure.
//   node night657.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    slowFlag = false; PERF.slowMoving = true; state = clone(DEFAULTS); state.music.mute = true; state.world.at = null;
    const dn = () => { const g = document.getElementById("day-night"); return g ? { tint: Number(g.querySelector(".tint").getAttribute("opacity")), clock: g.querySelector(".clock text").textContent } : null; };
    const said = () => [...document.querySelectorAll("*")].filter(n => n.childElementCount === 0 && /Good morning|still daytime|Night is falling/.test(n.textContent)).map(n => n.textContent.trim()).slice(-1)[0] || "";
    state.background = { ...state.background, kind: "clearing", skyHour: 12, skyDay: 29, skyMonth: 10, skyYear: 2026 }; changed(); await w(1500);
    out.offByDefault = !daysOn() && !document.getElementById("day-night");
    state.days = { on: true, dayMinutes: 12, nights: 0 }; changed(); await w(1500);
    out.noon = dn();
    state.background.skyHour = 21; changed(); await w(1500);
    out.night = dn(); out.nightSaid = said();
    state.background.kind = "campsite"; changed(); await w(1200);
    out.camp = { ...dn(), followsClock: clockHere(state.background), dark: bgShown.objs.some(o => o.name === "dark") };
    state.background.kind = "hutbed"; changed(); await w(1200);
    out.inside = dn();
    const bed = seatsHere(state.background).find(s => s.lie);
    state.background.skyHour = 12; changed(); await w(1200);
    sitOn(bed); await w(600); out.byDay = { pose: state.body.pose, nights: state.days.nights, said: said() };
    standUp(); state.background.skyHour = 22; changed(); await w(1200);
    sitOn(bed); await w(4500);
    out.morning = { hour: state.background.skyHour, day: state.background.skyDay, nights: state.days.nights, said: said(), ...dn() };
    standUp(); state.background.skyHour = 2; changed(); await w(1200);
    sitOn(bed); await w(4500);
    out.afterMidnight = { hour: state.background.skyHour, day: state.background.skyDay, nights: state.days.nights };
    standUp(); state.background = { ...state.background, kind: "clearing", skyHour: 23.9, skyDay: 31, skyMonth: 12, skyYear: 2026 };
    state.days.dayMinutes = 4; changed(); await w(4500);
    out.newYear = { hour: state.background.skyHour, day: state.background.skyDay, month: state.background.skyMonth, year: state.background.skyYear };
    state.days.on = false; changed(); await w(1500);
    out.offAgain = !document.getElementById("day-night") && !clockHere({ ...state.background, kind: "campsite" });
    return JSON.stringify(out); })()`));
  console.log("  " + JSON.stringify(r));
  ok("off to start: no darkness, no clock", r.offByDefault, r.offByDefault);
  ok("on, at noon: no darkness, the sun and the hour", r.noon && r.noon.tint < 0.01 && /☀️ 12:00 pm/.test(r.noon.clock), r.noon);
  ok("at 9 pm: dark, the moon and the hour, and a word about sleeping", r.night && r.night.tint > 0.5 && /🌙 9:00 pm/.test(r.night.clock) && /Night is falling/.test(r.nightSaid), [r.night, r.nightSaid]);
  ok("the camp site follows the clock with its own night, no darkness over it", r.camp.followsClock && r.camp.dark && r.camp.tint < 0.01, r.camp);
  ok("inside, lighter", r.inside && r.inside.tint > 0.2 && r.inside.tint < 0.4, r.inside);
  ok("lying in bed by day: lying down, no night counted, a word", r.byDay.pose === "lie" && r.byDay.nights === 0 && /still daytime/.test(r.byDay.said), r.byDay);
  ok("asleep at 10 pm: 7 the next morning, a night slept", r.morning.hour === 7 && r.morning.day === 30 && r.morning.nights === 1 && /Good morning! Nights slept: 1/.test(r.morning.said) && r.morning.tint < 0.1, r.morning);
  ok("asleep at 2 am: 7 the same morning", r.afterMidnight.hour === 7 && r.afterMidnight.day === 30 && r.afterMidnight.nights === 2, r.afterMidnight);
  ok("up past midnight on New Year's Eve: the 1st of January, a year on", r.newYear.day === 1 && r.newYear.month === 1 && r.newYear.year === 2027 && r.newYear.hour < 1, r.newYear);
  ok("off again: no darkness, the camp site its own time again", r.offAgain, r.offAgain);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
