// (ticket 164, 0.0.87) The still picture a slow computer draws a place as,
// while the friend moves: for each place (PLACES), on a computer marked
// choppy, a screenshot of the picture with the scene itself (stopped), then
// with the still picture on (moved() called every frame, the friend held in
// the same spot and pose), and then stopped again: the picture must turn on
// (stillPic.on), off again after the last move, and look like the scene.
// Writes <out>/<kind>-live.png and <kind>-pic.png; compare them with
// stillpic_diff.py.
//   node stillpic164.mjs <devtools port> <url> <out dir> [kind,...]   env: SVG=1 (the svg pictures, as before 0.0.93)
// Start the browser muted and pinned (taskset -c 0-3), nothing heavy alongside.
import { writeFileSync } from "node:fs";
const [dport, url, out, only] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 400));
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error " + JSON.stringify(m.params.args).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? "ERROR " + JSON.stringify(r.result.exceptionDetails).slice(0, 300) : r.result.result.value; };
const shot = async (file) => {
  const r = JSON.parse(await ev(`JSON.stringify((b => ({ x: b.x, y: b.y, width: b.width, height: b.height }))(pic.getBoundingClientRect()))`));
  const s = await send("Page.captureScreenshot", { format: "png", clip: { ...r, scale: 0.5 } });
  writeFileSync(file, Buffer.from(s.result.data, "base64"));
};
try {
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 810, deviceScaleFactor: 2, mobile: false });
  await send("Page.navigate", { url }); await sleep(3000);
  await ev(`localStorage.setItem("dress-up-choppy", "1"); localStorage.removeItem("dress-up-perf"); 1`);
  await send("Page.reload"); await sleep(4000);
  // (since 0.0.92 a stored mark is cleared on load: the mark set in the page itself)
  await ev(`choppy = true; changed(); 1`);
  console.log("version", await ev("VERSION.number"), "choppy", await ev("choppy"), "still", await ev("sceneryStill()"));
  if (process.env.SVG) await ev("SPEED_TEST.svg = true; 1");
  const kinds = only ? only.split(",") : await ev(`PLACES.filter(([k]) => k !== "none").map(([k]) => k)`);
  for (const kind of kinds) {
    const e0 = errs.length;
    await ev(`state.music.mute = true; Object.assign(state.background, { kind: ${JSON.stringify(kind)}, figX: 0, figY: 0 }); state.body.anim = "none"; changed(); 1`);
    let ready = false;
    for (let i = 0; i < 50 && !ready; i++) { await sleep(100); ready = await ev("stillPic.parts.size > 0 && [...stillPic.parts.values()].every(p => p.ready)"); }
    await sleep(300);
    const offBefore = await ev("stillPic.on");
    await shot(`${out}/${kind}-live.png`);
    await ev(`window.__mv = setInterval(() => moved(), 16); 1`);
    await sleep(250);
    const shownWhile = await ev("stillPic.shown.length");
    const on = await ev("stillPic.on"), hidden = await ev("bgShown.node.style.visibility");
    await shot(`${out}/${kind}-pic.png`);
    await ev(`clearInterval(window.__mv); 1`);
    await sleep(600);
    const offAfter = await ev("stillPic.on"), shownAfter = await ev("bgShown.node.style.visibility");
    const info = await ev(`JSON.stringify({ objs: bgShown.objs.length, shapes: bgShown.node.querySelectorAll("*").length, inObjs: bgShown.objs.reduce((a, o) => a + o.node.querySelectorAll("*").length + 1, 0), bitmapOk: stillPic.bitmapOk, parts: [...stillPic.parts.keys()], shown: stillPic.shown.length })`);
    const ok = ready && !offBefore && on && hidden === "hidden" && !offAfter && shownAfter === "" && errs.length === e0;
    console.log(`${ok ? "ok  " : "FAIL"} ${kind.padEnd(14)} ready ${ready} · on while moving ${on} (scene ${hidden || "shown"}, ${shownWhile} pictures) · after ${offAfter ? "STILL ON" : "off"} (scene ${shownAfter || "shown"}) · ${info}${errs.length > e0 ? " · ERRORS " + errs.slice(e0).join(" | ") : ""}`);
  }
  console.log("errors:", errs.length ? errs.slice(0, 4) : "none");
} finally {
  await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`);
  process.exit(0);
}
