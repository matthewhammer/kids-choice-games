// (ticket 307, Matthew: "pit open and close work via switch -- let's animate it, like the doors opening and closing are
// now"; "let's have them closed by default"; "the switch should animate too -- rocking back and forth somehow") N's trap
// room at its defaults: both pits shut, their lids across them, no way down; the left lever pulled: its pit's lid swings
// down into it (mid-way a while after, hidden at the end), a way down, the handle rocking past its new angle and settling
// on it; pulled again: shut. A placed lever and trap door: the lid swings open. Exits 1 on a failure.
//   node pitlids307.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null;
    for (const k of Object.keys(B)) if (/^castleLever[LR]_/.test(k)) delete B[k];
    Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: 0, figY: 60, things: [] }); changed(); await w(500);
    const lids = () => [...bgShown.node.querySelectorAll(".pit-lid")].map(l => ({ i: l.dataset.pitI, hidden: l.getAttribute("visibility") === "hidden", tf: l.getAttribute("transform") || "" }));
    const ways = () => bgShown.node.querySelectorAll(".portal[data-pit]").length;
    const angle = side => { const a = bgShown.node.querySelector('[data-lever="' + side + '"] .lever-arm'); return a ? +((a.getAttribute("transform") || "").match(/rotate\\((-?[\\d.]+)/) || [0, NaN])[1] : NaN; };
    const start = { lids: lids(), ways: ways() };
    roomLeverPull("L"); const t0 = performance.now(), angles = [], mid = [];
    while (performance.now() - t0 < 1000) { await w(40); angles.push(angle("L")); const l = bgShown.node.querySelector('.pit-lid[data-pit-i="0"]'); if (l) mid.push(l.getAttribute("transform") || ""); }
    const opened = { lids: lids(), ways: ways(), angles, mid: mid.slice(0, 8) };
    roomLeverPull("L"); await w(900); const shut = { lids: lids(), ways: ways() };
    // (a placed lever and trap door)
    Object.assign(B, { kind: "emptyroom", things: [{ ...(THING_DEFAULTS.trapdoor || {}), kind: "trapdoor", x: -180, z: SCENE.ground + 90, size: 100, uid: "dtest" },
                                                   { ...(THING_DEFAULTS.lever || {}), kind: "lever", x: 180, z: SCENE.ground + 60, size: 100, works: ["dtest"], on: false }] });
    changed(); await w(400);
    const placedLid = () => { const l = bgShown.node.querySelector('[data-drag="thing:0"] .pit-lid'); return l ? { hidden: l.getAttribute("visibility") === "hidden", tf: l.getAttribute("transform") || "" } : null; };
    const before = placedLid(); leverPull(1); await w(120); const during = placedLid(); await w(800); const after = placedLid();
    return JSON.stringify({ start, opened, shut, placed: { before, during, after, open: B.things[0].open, hole: !!bgShown.node.querySelector('[data-drag="thing:0"] [data-hole]') }, tilt: LEVER_TILT }); })()`));
  const A = r.opened.angles.filter(Number.isFinite), last = A[A.length - 1], most = Math.max(...A.map(Math.abs));
  console.log(`  start: ${r.start.ways} ways down, lids ${JSON.stringify(r.start.lids.map(l => l.hidden))}; pulled: ${r.opened.ways} way(s), lids ${JSON.stringify(r.opened.lids.map(l => l.hidden))}, handle ${A.map(Math.round).join(" ")}; again: ${r.shut.ways}`);
  ok("at the defaults both pits are shut: two lids across them, no way down", r.start.ways === 0 && r.start.lids.length === 2 && r.start.lids.every(l => !l.hidden && !l.tf), r.start);
  ok("the left lever pulled: its pit's lid swings (mid-way between across and down)", r.opened.mid.some(tf => { const m = tf.match(/matrix\(1 0 0 ([\d.]+)/); return m && +m[1] > 0.02 && +m[1] < 0.98; }), r.opened.mid);
  ok("then hidden down in the pit, a way down there, the other pit still shut", r.opened.ways === 1 && r.opened.lids.find(l => l.i === "0")?.hidden && !r.opened.lids.find(l => l.i === "1")?.hidden, r.opened);
  ok("the handle rocks past its new angle and settles on it", Math.abs(Math.abs(last) - r.tilt) < 0.5 && most > r.tilt * 1.15, { A, tilt: r.tilt });
  ok("pulled again: shut, its lid across it", r.shut.ways === 0 && r.shut.lids.every(l => !l.hidden && !l.tf), r.shut);
  ok("a placed lever opens its trap door: the lid swings, then hidden, a hole", r.placed.before && !r.placed.before.hidden && /matrix/.test(r.placed.during?.tf || "") && r.placed.after?.hidden && r.placed.open && r.placed.hole, r.placed);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
