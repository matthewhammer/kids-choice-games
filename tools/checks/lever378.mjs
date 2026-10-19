// (ticket 378, Matthew: "after closing a tree house trap door and reopening it -- we cannot click to activate walking and entering
// it"; "other glowing things (like the doorway to the bridge) are also inactive on click") Tree room 1, 👆 walk where you click on: a
// real click on the trap door's lever pulls it (walked to) and sends the friend through no passage; then they step aside, the lever
// not under them; a second click opens it again; and a walk into a door with no way found (planPath empty) goes through, its trip
// ending (entering cleared), no page error. Exits 1 on a failure.
//   node lever378.mjs <devtools port> <url>
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
const click = async (x, y) => { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }); await sleep(80);
  for (const type of ["mousePressed", "mouseReleased"]) { await send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mousePressed" ? 1 : 0, clickCount: 1 }); await sleep(90); } };
// (a point on the lever itself, not its box's middle: the first of its shapes whose middle the lever is on top at)
const LEVER = `(() => { const L = bgShown.node.querySelector('[data-lever="H"]'); if (!L) return "null";
  for (const sh of L.querySelectorAll("circle, rect, path, line")) { const r = sh.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, el = document.elementFromPoint(x, y);
    if (el && el.closest('[data-lever="H"]')) return JSON.stringify([Math.round(x), Math.round(y)]); } return JSON.stringify({ covered: true }); })()`;
const STATE = `JSON.stringify({ shut: state.background.hatchShut1, kind: state.background.kind, entering, x: Math.round(state.background.figX), log: __log.splice(0) })`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(() => { state = clone(DEFAULTS); state.music.mute = true; state.world.at = null; Object.assign(state.access, { clickWalk: true }); Object.assign(state.background, { kind: "treeroom", inside: 1, figX: 60, figY: 60, hatchShut1: false }); changed();
    window.__log = []; const es = enterScene; enterScene = (...a) => { __log.push("enterScene " + (a[0].dataset.to || "")); return es(...a); }; return 1; })()`);
  await sleep(1500);
  const p1 = JSON.parse(await ev(LEVER)); if (!Array.isArray(p1)) throw new Error("no lever point: " + JSON.stringify(p1));
  await click(...p1); await sleep(6500); const s1 = JSON.parse(await ev(STATE)), p2 = JSON.parse(await ev(LEVER));
  console.log("  lever clicked:", JSON.stringify(s1), "; the lever then:", JSON.stringify(p2));
  ok("a click on the lever shuts the trap door, the friend through no passage (still in the tree room)", s1.shut === true && s1.kind === "treeroom" && !s1.log.length, s1);
  ok("then they step aside: the lever not under them", Array.isArray(p2), p2);
  if (Array.isArray(p2)) { await click(...p2); await sleep(6500); const s2 = JSON.parse(await ev(STATE)); console.log("  clicked again:", JSON.stringify(s2));
    ok("a second click opens it again", s2.shut === false && s2.kind === "treeroom" && !s2.log.length, s2); }
  const r3 = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const orig = planPath; window.planPath = () => [];
    const door = bgShown.node.querySelector(".portal[data-door]"); enterScene(door); await w(7000); window.planPath = orig;
    return JSON.stringify({ entering, kind: state.background.kind, onBridge: !!state.background.onBridge }); })()`));
  console.log("  a door with no way found:", JSON.stringify(r3));
  ok("a walk into a door with no way found goes through, its trip ended", !r3.entering && r3.kind === "treehouse" && r3.onBridge, r3);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
