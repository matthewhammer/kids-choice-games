// (ticket 193, Matthew 2026-10-17) The spin into a picture and out of it:
// all of the friend spins (every piece, the far arm too), a drawing during
// the spin does not stop it or put a still friend back, and once landed the
// friend is themselves again. Exits 1 on a failure.
//   node spin193.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => {
    const w = t => new Promise(r => setTimeout(r, t)), B = state.background;
    state.music.mute = true; B.kind = "livingroom"; B.figX = 0; B.figY = 0; state.body.anim = "walk"; state.body.facing = "right"; changed(); await w(500);
    const pieces = figShown.filter(n => n.nodeType === 1).length, d = [...document.querySelectorAll("#bg .portal")].find(p => p.querySelector(":scope > svg, :scope > image"));
    if (!d) return JSON.stringify({ none: true });
    const look = () => { const c = document.querySelector("#pic .fig-spin"); return { copy: !!c, pieces: c ? c.children.length : 0, tf: c ? getComputedStyle(c).transform : null,
      hidden: figShown.filter(n => n.style).every(n => n.style.visibility === "hidden"), kind: B.kind }; };
    enterScene(d);
    await w(400); const a = look();
    changed(); await w(50); const redrawn = look();   // (a drawing in the middle of the spin)
    await w(600); const b = look();
    // (into the picture's place, and spinning out there)
    let out = null; for (let i = 0; i < 60 && !out; i++) { await w(50); if (B.kind !== "livingroom" && document.querySelector("#pic .fig-spin")) out = look(); }
    await w(900); const end = { ...look(), phase: tripPhase, figure: !!document.getElementById("figure") };
    return JSON.stringify({ pieces, a, redrawn, b, out, end }); })()`));
  ok("going into a picture: a copy of all the friend's pieces spins, the friend itself hidden", !r.none && r.a.copy && r.a.pieces === r.pieces && r.a.hidden, r);
  ok("a drawing in the middle of the spin: still the copy spinning, the friend still hidden", r.redrawn.copy && r.redrawn.hidden && r.b.copy && r.b.tf !== r.a.tf, { a: r.a, redrawn: r.redrawn, b: r.b });
  ok("in the new place: the friend spins out as a whole, every piece", !!r.out && r.out.pieces >= 1 && r.out.hidden, r.out);
  ok("then the friend is themselves again: no copy, nothing hidden", r.end.kind !== "livingroom" && !r.end.copy && !r.end.hidden && r.end.figure && r.end.phase === "arrived", r.end);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
