// (ticket 337) Collision shapes that follow the things: round things are ovals on the floor (a foot in the corner of a
// well's box but outside its oval is free; at its front it is stopped), a table is its top and four legs, the tea table
// its round top on one pedestal, and the friend standing has a legs box (ankle to hips) between the soles and the torso.
// The planned walks' sweep over the places is path332.mjs's. Exits 1 on a failure.
//   node ovals337.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null;
    B.kind = "castle"; changed(); await w(400);
    const well = solidsHere().find(o => o.name === "well"), E = ovalOf(well), [sx, sz] = feetSpan(), has = (x, z) => solidAt(x, z, true).list.includes(well);
    const a = Math.PI * 0.75, cx = E.cx + Math.cos(a) * E.rx * 1.12 - sx - 1, cz = E.cz + Math.sin(a) * E.rz * 1.12 + sz + 1;
    const wellR = { oval: !!well.oval, inBox: cx + sx > well.x0 && cz - sz < well.front, corner: has(cx, cz), front: has(E.cx, E.cz + E.rz + sz * 0.5), clear: has(E.cx, E.cz + E.rz + sz + 2) };
    const rounds = {}; for (const kd of ["witchroom", "fairyforest", "mountains", "campsite"]) { B.kind = kd; changed(); await w(250); rounds[kd] = solidsHere().filter(o => o.oval).length; }
    B.kind = "hutpotion"; changed(); await w(300); const tbl = solidsHere().filter(o => o.name === "table").map(o => o.part);
    B.kind = "healerroom"; changed(); await w(300); const tea = solidsHere().filter(o => o.name === "tea table").map(o => [o.part, !!o.oval]);
    state.body.anim = "none"; changed(); await w(100); const boxes = youBoxes(B.figX ?? 0, SCENE.ground + (B.figY ?? 0)), H = youHeights();
    const legsBox = boxes.length === 4 && Math.abs(boxes[2][4] - H.ankle) < 0.5 && Math.abs(boxes[2][5] - H.hips) < 0.5 && Math.abs(boxes[3][4] - H.hips) < 0.5;
    return JSON.stringify({ wellR, rounds, tbl, tea, legsBox, n: boxes.length }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("the well is an oval: its box's corner free, its front met, just in front free", r.wellR.oval && r.wellR.inBox && !r.wellR.corner && r.wellR.front && !r.wellR.clear, r.wellR);
  ok("round things are ovals in the witch's room, the fairy forest, the mountains and the campsite", Object.values(r.rounds).every(n => n > 0), r.rounds);
  ok("the potion hut's table is its top and four legs", r.tbl.filter(p => p === "top").length === 1 && r.tbl.filter(p => p === "leg").length === 4, r.tbl);
  ok("the healer's tea table is a round top on one pedestal", r.tea.length === 2 && r.tea.some(([p, ov]) => p === "top" && ov) && r.tea.some(([p]) => p === "leg"), r.tea);
  ok("standing, the friend has a legs box from the ankles to the hips, before the torso's", r.legsBox, r.n);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
