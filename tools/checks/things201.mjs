// (ticket 201, Matthew: N put fifteen or more cauldrons in one place and the
// Ubuntu laptop ground to a halt) The frames a second and moving parts with
// 0, 5, 10 and 15 cauldrons in the clearing (on GitHub's computer, said, not
// judged); then the guard: too many moving parts, or too few frames a
// second, and no more moving things can be put there, the busiest marked
// (rows and picture), the note saying why; taken away, all as before.
// (ticket 203, Matthew: N kept adding past the red boxes) While any thing
// is marked, nothing of any kind can be put there: every button greyed, a
// real tap on one refused; and it stays shut, taken down to 2, until a
// fresh measure finds the place smooth. Exits 1 on a failure.
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
    const put = async (k, kind = "cauldron") => { B.things = [...Array(k)].map((_, i) => ({ kind, x: -360 + (i % 8) * 100, z: 330 + Math.floor(i / 8) * 50, seed: 30 + i, size: 100, ...structuredClone(THING_DEFAULTS[kind] || {}) })); changed(); await w(600); };
    const look = () => { const b = document.querySelector('.thing-items button[data-kind="cauldron"]'), note = document.querySelector(".thing-slow");
      const all = [...document.querySelectorAll(".thing-items button[data-kind]")];
      return { blocked: !!b && b.disabled, every: all.length > 1 && all.every(x => x.disabled), shut: thingsLatch, rows: document.querySelectorAll(".cross-list .row.thing-costly").length, frames: document.querySelectorAll("#bg .cost-glow").length, note: note && !note.hidden ? note.textContent : "" }; };
    const counts = {};
    for (const k of [0, 1, 5, 10, 15]) { await put(k); const moving = thingsMovingNow().reduce((s, m) => s + m.n, 0); counts[k] = { fps: await framesNow(1500), moving }; }
    // (since ticket 202 two or more cauldrons are drawn cheap: the guard's count is met with campfires, about twenty moving parts each)
    await put(60, "campfire"); thingFps = null; changed(); await w(300); const busy = look();
    // (a real tap on the potion's button, a thing that does not move: refused)
    const pb = document.querySelector('.thing-items button[data-kind="potion"]'); if (pb) { pb.scrollIntoView({ block: "center" }); await w(200); } const pr = pb ? pb.getBoundingClientRect() : null;
    const tapAt = pr && pb.contains(document.elementFromPoint(pr.left + pr.width / 2, pr.top + pr.height / 2)) ? [pr.left + pr.width / 2, pr.top + pr.height / 2] : null, before = B.things.length;
    return JSON.stringify({ counts, busy, tapAt, before }); })()`));
  if (r.tapAt) for (const type of ["mouseMoved", "mousePressed", "mouseReleased"])
    await send("Input.dispatchMouseEvent", { type, x: r.tapAt[0], y: r.tapAt[1], button: "left", buttons: type === "mousePressed" ? 1 : 0, clickCount: 1 });
  Object.assign(r, JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    const put = async (k, kind = "cauldron") => { B.things = [...Array(k)].map((_, i) => ({ kind, x: -360 + (i % 8) * 100, z: 330 + Math.floor(i / 8) * 50, seed: 30 + i, size: 100, ...structuredClone(THING_DEFAULTS[kind] || {}) })); changed(); await w(600); };
    const look = () => { const b = document.querySelector('.thing-items button[data-kind="cauldron"]'), note = document.querySelector(".thing-slow"), all = [...document.querySelectorAll(".thing-items button[data-kind]")];
      return { blocked: !!b && b.disabled, every: all.length > 1 && all.every(x => x.disabled), shut: thingsLatch, rows: document.querySelectorAll(".cross-list .row.thing-costly").length, frames: document.querySelectorAll("#bg .cost-glow").length, note: note && !note.hidden ? note.textContent : "" }; };
    await w(400); const tapped = B.things.length;
    await put(2); thingFps = null; changed(); await w(100); const still = look();
    const t0 = performance.now(); while (thingsLatch && performance.now() - t0 < 6000) await w(100); const opened = Math.round(performance.now() - t0); await w(200); const calm = look();
    thingFps = 30; changed(); await w(200); const slow = look();   // (as a slow computer measures: one cauldron's place too busy)
    // (ticket 206) in the witch's woods, her own cauldron upgraded and two simple ones put there, the computer slow: hers marked, not theirs
    thingFps = null; B.things = []; changed(); worldEnter("1,1"); B.cauldronFumes = "fancy"; await put(2); thingFps = 30; changed(); await w(300);
    const ownGlow = () => { const c = document.querySelector('#bg [data-obj="cauldron"]'); return !!c && !!c.querySelector(":scope > .cost-glow"); };
    const hers = { ...look(), own: ownGlow() };
    B.cauldronFumes = "simple"; changed(); await w(100); thingFps = 30; changed(); await w(300); const plain = { ...look(), own: ownGlow() };
    thingFps = null; B.things = []; changed(); worldEnter("3,3"); await w(300);
    return JSON.stringify({ tapped, still, opened, calm, slow, hers, plain }); })()`)));
  console.log("  with 0, 1, 5, 10, 15 cauldrons in the clearing (GitHub's Chrome): " + Object.entries(r.counts).map(([k, v]) => `${k}: ${v.fps} fps, ${v.moving} moving parts`).join(" · "));
  ok("every cauldron simple unless upgraded (ticket 206): under thirty moving parts each", r.counts[1].moving <= 30 && r.counts[5].moving <= 5 * 30 && r.counts[15].moving <= 15 * 30, r.counts);
  ok("60 campfires: no more things that move can be put there; the busiest marked, rows and picture; the note says why", r.busy.blocked && r.busy.rows >= 1 && r.busy.frames >= 1 && /moving parts|frames a second/.test(r.busy.note), r.busy);
  ok("(ticket 203) and every kind's button greyed, a thing that does not move too", r.busy.every && r.busy.shut, r.busy);
  ok("a real tap on the potion's button then: nothing put", r.tapAt && r.tapped === r.before, { tapAt: r.tapAt, before: r.before, after: r.tapped });
  ok("taken down to 2: still shut, still marked, till measured again", r.still.blocked && r.still.every && r.still.rows >= 1, r.still);
  ok("measured smooth: open again", r.opened < 6000, r.opened);
  ok("taken away to 2: all as before", !r.calm.blocked && !r.calm.every && r.calm.rows === 0 && r.calm.frames === 0 && !r.calm.note, r.calm);
  ok("on a computer measuring 30 frames a second: blocked at 2, its note saying so", r.slow.blocked && /About 30 frames a second/.test(r.slow.note), r.slow);
  ok("(ticket 206) her own cauldron upgraded, the computer slow: hers marked, the two simple ones put there not; the note says where to make it simple", r.hers.blocked && r.hers.own && r.hers.rows === 0 && /Background/.test(r.hers.note), r.hers);
  ok("hers simple again: not marked; what is put there counts as before", !r.plain.own && r.plain.blocked && r.plain.rows >= 1, r.plain);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
