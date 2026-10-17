// (ticket 201, Matthew: N put fifteen or more cauldrons in one place and the
// Ubuntu laptop ground to a halt) The frames a second and moving parts with
// 0, 5, 10 and 15 cauldrons in the clearing (on GitHub's computer, said, not
// judged); then the guard: too many moving parts, or too few frames a
// second, and no more moving things can be put there, the busiest marked
// (rows and picture), the note saying why; taken away, all as before.
// Exits 1 on a failure.
//   node things201.mjs <devtools port> <url>
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
    state.music.mute = true; state.world = clone(DEFAULTS.world); worldEnter("3,3"); thingGroup = "magic"; tab = TABS.findIndex(t => t[1] === "world"); showTab(); await w(400);
    const put = async k => { B.things = [...Array(k)].map((_, i) => ({ kind: "cauldron", x: -360 + (i % 8) * 100, z: 330 + Math.floor(i / 8) * 50, seed: 30 + i, size: 100 })); changed(); await w(600); };
    const look = () => { const b = document.querySelector('.thing-items button[data-kind="cauldron"]'), note = document.querySelector(".thing-slow");
      return { blocked: !!b && b.disabled, rows: document.querySelectorAll(".cross-list .row.thing-costly").length, frames: document.querySelectorAll("#bg .cost-glow").length, note: note && !note.hidden ? note.textContent : "" }; };
    const counts = {};
    for (const k of [0, 5, 10, 15]) { await put(k); const moving = thingsMovingNow().reduce((s, m) => s + m.n, 0); counts[k] = { fps: await framesNow(1500), moving }; }
    const busy = look();
    await put(2); thingFps = null; changed(); await w(200); const calm = look();
    thingFps = 30; changed(); await w(200); const slow = look();   // (as a slow computer measures: one cauldron's place too busy)
    thingFps = null; B.things = []; changed();
    return JSON.stringify({ counts, busy, calm, slow }); })()`));
  console.log("  with 0, 5, 10, 15 cauldrons in the clearing (GitHub's Chrome): " + Object.entries(r.counts).map(([k, v]) => `${k}: ${v.fps} fps, ${v.moving} moving parts`).join(" · "));
  ok("each cauldron about 240 moving parts (its fumes' spiral most of them), and the frames fall as they are added", r.counts[5].moving >= 5 * 150 && r.counts[5].moving <= 5 * 320 && r.counts[15].fps < r.counts[0].fps, r.counts);
  ok("15 cauldrons: no more things that move can be put there; the busiest marked, rows and picture; the note says why", r.busy.blocked && r.busy.rows >= 1 && r.busy.frames >= 1 && /moving parts|frames a second/.test(r.busy.note), r.busy);
  ok("taken away to 2: all as before", !r.calm.blocked && r.calm.rows === 0 && r.calm.frames === 0 && !r.calm.note, r.calm);
  ok("on a computer measuring 30 frames a second: blocked at 2, its note saying so", r.slow.blocked && /About 30 frames a second/.test(r.slow.note), r.slow);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
