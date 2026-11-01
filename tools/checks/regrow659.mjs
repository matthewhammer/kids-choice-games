// (ticket 659, M: a way for the plants that are cut to regrow) 🌱 cut plants grow back, on to start: a tree the 🗡️ sword cut is
// back regrow.minutes after it was cut (its stamp made older here, not waited for), and not before; a bush put in the place is
// kept while cut and comes back where it was in the list; switched off, a cut stays; with 🌗 night and day on, a tree cut at 9 pm
// waits for the morning and is back after a night slept; a square of the world left while a cut is due has it back at once on
// coming again (before the first second's check); a cut from before stamps (0.0.465 to 0.0.469), stamped when first seen; and
// ⚙️ Advanced has the setting, its minutes hidden while night and day is on. A computer taken as fast. Exits 1 on a failure.
//   node regrow659.mjs <devtools port> <url>
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
    const swing = async () => { const s = toolUse(); await w(1500); return s; };
    const cutHere = () => (((state.background.cut || {}).clearing) || []).slice();
    const shown = n => { const t = bgShown.objs.find(o => o.name === n); return t ? t.node.style.display !== "none" : "no such"; };
    out.onToStart = { ...DEFAULTS.regrow };
    // a knight in the clearing, beside the left trees, facing them
    state.costume = { ...state.costume, kind: "knight" };
    state.background = { ...state.background, kind: "clearing", things: [], cut: {}, cutWhen: {}, cutThings: {}, figX: -230, figY: 389 - SCENE.ground };
    state.body.facing = "left"; changed(); draw(); await w(900);
    await swing(); out.cut = cutHere(); out.stamped = !!((state.background.cutWhen.clearing || {})["tree, left, inner"] || {}).t;
    await w(1200); out.notYet = cutHere();
    state.background.cutWhen.clearing["tree, left, inner"].t -= 3 * 60000; await w(1600);
    out.due = { cut: cutHere(), shown: shown("tree, left, inner"), stamps: Object.keys(state.background.cutWhen.clearing || {}) };
    // a bush put in the place, between two rocks, ahead of the friend
    let B = state.background; B.figX = 0;
    B.things = [{ kind: "rock", x: 300, z: 389, seed: 3 }, { ...(THING_DEFAULTS.bush || {}), kind: "bush", x: -60, z: 389, seed: 7 }, { kind: "rock", x: 350, z: 389, seed: 4 }]; changed(); await w(300);
    await swing(); out.bushCut = { things: B.things.map(t => t.kind), kept: ((B.cutThings || {}).clearing || []).map(k => [k.thing.kind, k.i]) };
    if ((B.cutThings || {}).clearing) B.cutThings.clearing[0].when.t -= 3 * 60000;
    await w(1600); out.bushBack = { things: B.things.map(t => t.kind + ":" + t.seed), kept: (B.cutThings || {}).clearing || null };
    // switched off: a cut stays; on again: back
    state.regrow.on = false; B.figX = -230; changed(); await w(300);
    await swing(); const n1 = cutHere()[0]; if (n1) B.cutWhen.clearing[n1].t -= 10 * 60000;
    await w(1600); out.offStays = cutHere();
    state.regrow.on = true; changed(); await w(1600); out.onAgain = cutHere();
    // 🌗 night and day: cut at 9 pm, back the next morning
    state.days = { on: true, dayMinutes: 12, nights: 0 };
    Object.assign(B, { skyHour: 21, skyDay: 29, skyMonth: 10, skyYear: 2026 }); changed(); await w(1200);
    await swing(); const n2 = cutHere()[0]; out.cutAt9 = n2; if (n2) B.cutWhen.clearing[n2].t -= 10 * 60000;
    await w(1600); out.waitsForMorning = cutHere();
    sleepTillMorning(21); await w(4500);
    out.morning = { hour: B.skyHour, day: B.skyDay, cut: cutHere() };
    state.days.on = false; changed();
    // the world: cut in one square, due while away in the other, back at once on coming again
    const W = state.world; W.cells = { ...(W.cells || {}), "90,0": { kind: "clearing", things: [] }, "91,0": { kind: "clearing", things: [] } };
    worldEnter("90,0"); await w(500); B = state.background;
    B.figX = -230; B.figY = 389 - SCENE.ground; state.body.facing = "left"; changed(); await w(300);
    await swing(); changed(); out.cellA = ((W.cells["90,0"].cut || {}).clearing) || [];
    worldEnter("91,0"); await w(500); out.notInB = cutHere();
    const st = ((W.cells["90,0"].cutWhen || {}).clearing || {})["tree, left, inner"]; if (st) st.t -= 3 * 60000;
    worldEnter("90,0");
    out.backInA = { cut: cutHere(), shown: shown("tree, left, inner") };
    // a cut from before stamps: stamped when first seen, and grows back from then
    state.world.at = null; worldHome = null;
    state.background = { ...state.background, kind: "clearing", cut: { clearing: ["tree, left, inner"] }, things: [] }; delete state.background.cutWhen; delete state.background.cutThings;
    changed(); await w(1500);
    out.old = { cut: cutHere(), stamped: !!((state.background.cutWhen || {}).clearing || {})["tree, left, inner"] };
    // ⚙️ Advanced
    const tab = [...document.querySelectorAll("button, [role=tab]")].find(b => /Advanced/.test(b.textContent)); if (tab) tab.click(); await w(800);
    const tg = document.querySelector(".regrow-toggle"), more = document.querySelector(".regrow-more"), morn = document.querySelector(".regrow-morning");
    out.ui = { toggle: tg ? tg.textContent + " " + tg.getAttribute("aria-pressed") : null, more: more && !more.hidden, morning: morn && !morn.hidden };
    state.days.on = true; changed(); await w(300); out.uiDays = { more: more && !more.hidden, morning: morn && !morn.hidden };
    return JSON.stringify(out); })()`));
  console.log("  " + JSON.stringify(r));
  ok("on to start, after 2 minutes", r.onToStart.on === true && r.onToStart.minutes === 2, r.onToStart);
  ok("a cut tree is stamped", r.cut.join() === "tree, left, inner" && r.stamped, [r.cut, r.stamped]);
  ok("not back before its time", r.notYet.join() === "tree, left, inner", r.notYet);
  ok("back when due: off the cut list, shown, its stamp gone", r.due.cut.length === 0 && r.due.shown === true && r.due.stamps.length === 0, r.due);
  ok("a bush put in the place is kept while cut", r.bushCut.things.join() === "rock,rock" && r.bushCut.kept.length === 1 && r.bushCut.kept[0][0] === "bush" && r.bushCut.kept[0][1] === 1, r.bushCut);
  ok("and comes back where it was", r.bushBack.things.join() === "rock:3,bush:7,rock:4" && r.bushBack.kept === null, r.bushBack);
  ok("switched off, a cut stays; on again, it grows back", r.offStays.length === 1 && r.onAgain.length === 0, [r.offStays, r.onAgain]);
  ok("night and day on: a tree cut at 9 pm waits for the morning", r.cutAt9 && r.waitsForMorning.length === 1, [r.cutAt9, r.waitsForMorning]);
  ok("and is back after a night slept", r.morning.hour === 7 && r.morning.day === 30 && r.morning.cut.length === 0, r.morning);
  ok("a square keeps its own cut; the other square has none", r.cellA.includes("tree, left, inner") && r.notInB.length === 0, [r.cellA, r.notInB]);
  ok("coming back to the square when it is due: back at once", r.backInA.cut.length === 0 && r.backInA.shown === true, r.backInA);
  ok("a cut from before stamps is stamped when first seen", r.old.cut.length === 1 && r.old.stamped, r.old);
  ok("⚙️ Advanced: 🌱 cut plants grow back, on, with its minutes", r.ui.toggle && /cut plants grow back true/.test(r.ui.toggle) && r.ui.more && !r.ui.morning, r.ui);
  ok("with night and day on: by the next morning, no minutes", !r.uiDays.more && r.uiDays.morning, r.uiDays);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
