// (ticket 364, Matthew, for N: "a toggle to switch the levers without walking to them, so I can stand on the place where the
// boulder falls, and still trigger that animation") ⚙️ Advanced's 🎚️ pull levers from where you stand (access.leverFar, off to
// start): on, a press on the trap room's blue lever drops its boulder at once and the friend stays where they stand; off,
// they walk to it first (ticket 316). Exits 1 on a failure.
//   node leverfar364.mjs <devtools port> <url>
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
    state.music.mute = true; state.world.at = null; climb = null; B.kind = "castleroom"; const K = castleOf(B), n = K.rooms.indexOf("trap") + 1;
    B.castleRoom = n; B.figX = 150; B.figY = 40; changed(); await w(600);
    const A = state.access, x0 = B.figX, y0 = B.figY, dflt = A.leverFar, before = trapState(B, n, K.id).boulders.R;
    A.leverFar = true; leverAct('[data-lever="BR"]', () => roomLeverPull("BR")); await w(200);
    const far = { moved: B.figX !== x0 || B.figY !== y0, walking: !!clickRun, boulder: trapState(B, n, K.id).boulders.R !== before };
    await w(1500); roomLeverPull("BR"); await w(1500);
    A.leverFar = false; leverAct('[data-lever="BR"]', () => roomLeverPull("BR")); await w(200);
    const near = { walking: !!clickRun, boulderYet: trapState(B, n, K.id).boulders.R !== before };
    walkStop++; clickRun = null; state.body.anim = "none";
    const tab = [...document.querySelectorAll("button")].find(b => /Advanced/.test(b.textContent)); if (tab) tab.click(); await w(300);
    const btn = document.querySelector("button.lever-far-toggle"); let flips = null;
    if (btn) { btn.click(); flips = [state.access.leverFar]; btn.click(); flips.push(state.access.leverFar); }
    return JSON.stringify({ dflt, far, near, button: !!btn, flips }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("off to start", r.dflt === false, r.dflt);
  ok("on: the boulder drops at once, the friend not moved, no walk", r.far.boulder && !r.far.moved && !r.far.walking, r.far);
  ok("off: a walk to the lever first, the boulder not yet", r.near.walking && !r.near.boulderYet, r.near);
  ok("⚙️ Advanced has its toggle, and it flips the setting", r.button && r.flips && r.flips[0] === true && r.flips[1] === false, r.flips);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
