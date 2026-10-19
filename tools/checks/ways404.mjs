// (ticket 404) A nav arrow lights where it is drawn, not at its spot on the floor: the pointer on an arrow picks that
// way, and the pointer on its floor spot, where the arrow was moved away from it, does not (in the fairy forest the arrow
// to bubble space sat well above its spot, and the flower below it lit it). And ♿'s "arrow words stay" slider: 500 ms by
// default, 250 to 1500, given to the arrows as --label-stay. Exits 1 on a failure.
//   node ways404.mjs <devtools port> <url>
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
  const set = JSON.parse(await ev(`(() => { const rows = TABS.flatMap(t => JSON.stringify(t).includes("labelStay") ? [t[0]] : []);
    return JSON.stringify({ def: DEFAULTS.access.labelStay, tabs: rows, range: JSON.stringify(TABS).match(/"range","labelStay","[^"]*",(\\d+),(\\d+)/) }); })()`));
  console.log(`  ${JSON.stringify(set)}`);
  ok("the setting is 500 ms by default", set.def === 500, set);
  ok("its slider runs 250 to 1500, in ♿ Accessibility", set.range && set.range[1] === "250" && set.range[2] === "1500" && set.tabs.some(t => /Accessibility/.test(t)), set);
  const r = JSON.parse(await ev(`(async () => { state.music.mute = true; state.world = clone(WORLD_DEFAULT_0183); worldEnter("3,3");
    await new Promise(r => setTimeout(r, 1500)); worldWaysHud();
    const P = pic.getScreenCTM(), rows = [];
    for (const p of marks.pics) if (p.kind === "nav" && p.spot) {
      const d = p.el.dataset.way, tri = document.querySelector('#ways .way-arrow[data-way="' + d + '"] .way-tri'), b = tri && tri.getBoundingClientRect();
      if (!b || !b.width) { rows.push({ d, drawn: false }); continue; }
      const a = { x: b.left + b.width / 2, y: b.top + b.height / 2 }, s = new DOMPoint(p.spot[0], p.spot[1]).matrixTransform(P);
      const at = (x, y) => { const h = passUnderPointer({ target: pic, clientX: x, clientY: y }); return h ? h.el.dataset.way || "other" : null; };
      rows.push({ d, apart: Math.round(Math.hypot(a.x - s.x, a.y - s.y)), onArrow: at(a.x, a.y), onSpot: at(s.x, s.y) });
    }
    return JSON.stringify({ at: state.world.at, stay: document.getElementById("ways").style.getPropertyValue("--label-stay"), rows }); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("the square has nav arrows to test", r.rows.length > 0, r);
  ok("the arrows are given --label-stay (500ms)", r.stay === "500ms", r.stay);
  for (const w of r.rows) {
    if (w.drawn === false) { ok(`the arrow ${w.d} is drawn`, false, w); continue; }
    ok(`the pointer on the arrow ${w.d} picks it`, w.onArrow === w.d, w);
    if (w.apart > 60) ok(`the pointer on ${w.d}'s floor spot, ${w.apart} px from its arrow, does not pick it`, w.onSpot !== w.d, w);
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
