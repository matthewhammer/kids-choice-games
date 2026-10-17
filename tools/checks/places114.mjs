// (0.0.114) Each place keeps its own things, whichever way the friend goes
// (Matthew, 2026-10-17: a potion put in one square was in every square):
// through a place's own doorway into an inside off the grid, back by the
// back chip, through a place's own sign to the square beside it. And the
// witch's hut door, with a real mouse (Matthew: inside the witch's house
// her door no longer glows or works): the door under the pointer, glowing
// on hover, and a click taking the friend out. Exits 1 on a failure.
//   node places114.mjs <devtools port> <url>
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
// (what is under a point, top first)
const under = (x, y) => `(() => { const out = []; for (let e = document.elementFromPoint(${x}, ${y}); e && out.length < 6; e = e.parentElement)
  out.push(e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (e.getAttribute("class") ? "." + e.getAttribute("class").trim().replace(/\\s+/g, ".") : "") + (e.dataset && e.dataset.to ? "[to=" + e.dataset.to + "]" : "") + (e.dataset && e.dataset.drag ? "[drag=" + e.dataset.drag + "]" : "") + (e.dataset && e.dataset.obj ? "[obj=" + e.dataset.obj + "]" : ""));
  return out.join(" < "); })()`;
// (a place's doorway, by where it leads: the middle of its first shape, on the screen)
const doorAt = async to => JSON.parse(await ev(`(() => { const d = document.querySelector('#bg .portal[data-to="${to}"]'); if (!d) return "null";
  const s = d.querySelector("rect, path") || d, r = s.getBoundingClientRect(); return JSON.stringify([r.left + r.width / 2, r.top + r.height / 2]); })()`));
const until = async (cond, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(cond)) return true; await sleep(100); } return false; };
const where = async () => JSON.parse(await ev(`JSON.stringify({ kind: state.background.kind, at: state.world.at, things: (state.background.things || []).map(t => t.kind), off: Object.fromEntries(Object.entries(state.world.off || {}).map(([k, v]) => [k, v.map(t => t.kind)])) })`));
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  // a potion in the clearing (D3)
  await ev(`(async () => { state.music.mute = true; state.world = clone(DEFAULTS.world); worldEnter("3,2");
    state.background.things = [{ kind: "potion", x: 60, z: 370, seed: 1, size: 100, shape: "flask", color: "#e53935" }]; changed(); await new Promise(r => setTimeout(r, 500)); return 1; })()`);
  // into the healer's hut by the clearing's own doorway
  await ev(`(() => { const d = document.querySelector('#bg .portal[data-to="healerroom"]'); d.dispatchEvent(new MouseEvent("click", { bubbles: true })); return 1; })()`);
  await until(`state.background.kind === "healerroom" && !entering`);
  let W = await where();
  ok("through the clearing's own doorway into the healer's hut: the potion stays in the clearing", W.kind === "healerroom" && W.things.length === 0 && W.at === "3,2", W);
  await ev(`(async () => { state.background.things = [{ kind: "bush", x: -100, z: 380, seed: 2, size: 100 }]; changed(); await new Promise(r => setTimeout(r, 300)); return 1; })()`);
  W = await where();
  ok("a bush put in the hut is kept as the hut's, off the grid", W.off.healerroom && W.off.healerroom.join() === "bush", W);
  // back by the back chip
  await ev(`(() => { document.getElementById("back").click(); return 1; })()`);
  await until(`state.background.kind === "clearing" && !entering`);
  W = await where();
  ok("back to the clearing by the back chip: its potion, not the hut's bush", W.kind === "clearing" && W.things.join() === "potion", W);
  // by the clearing's own sign to the wood path, the square beside it (D2)
  await ev(`(() => { const d = document.querySelector('#bg .portal[data-to="woodpath"]'); d.dispatchEvent(new MouseEvent("click", { bubbles: true })); return 1; })()`);
  await until(`state.background.kind === "woodpath" && !entering`);
  W = await where();
  ok("by the clearing's own sign to the wood path: its square, D2, with nothing in it", W.kind === "woodpath" && W.at === "3,1" && W.things.length === 0, W);
  // and the hut again, its bush still there
  await ev(`(async () => { worldEnter("3,2"); await new Promise(r => setTimeout(r, 300)); const d = document.querySelector('#bg .portal[data-to="healerroom"]'); d.dispatchEvent(new MouseEvent("click", { bubbles: true })); return 1; })()`);
  await until(`state.background.kind === "healerroom" && !entering`);
  W = await where();
  ok("the healer's hut again: its bush", W.kind === "healerroom" && W.things.join() === "bush", W);
  // the witch's hut door, with a real mouse: in from her woods (B1), and out again
  await ev(`(async () => { worldEnter("1,0"); await new Promise(r => setTimeout(r, 500)); return 1; })()`);
  const inDoor = await doorAt("witchroom");
  ok("her woods have a door into her hut", !!inDoor, inDoor);
  if (inDoor) {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: inDoor[0], y: inDoor[1] });
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: inDoor[0], y: inDoor[1], button: "left", buttons: 1, clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: inDoor[0], y: inDoor[1], button: "left", buttons: 0, clickCount: 1 });
    await until(`state.background.kind === "witchroom" && !entering`);
    const inside = await where();
    ok("a click on it: inside her hut", inside.kind === "witchroom", { inside, under: await ev(under(inDoor[0], inDoor[1])) });
    await sleep(600);
    const out = await doorAt("witch");
    const top = out ? await ev(under(out[0], out[1])) : null;
    if (out) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: out[0], y: out[1] });
    await sleep(200);
    const hover = await ev(`(() => { const d = document.querySelector('#bg .portal[data-to="witch"]'); return !!d && d.matches(":hover"); })()`);
    ok("inside, her door is what the pointer is on, and it glows under it", !!out && /\[to=witch\]/.test(top) && hover, { out, top, hover });
    if (out) {
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x: out[0], y: out[1], button: "left", buttons: 1, clickCount: 1 });
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: out[0], y: out[1], button: "left", buttons: 0, clickCount: 1 });
    }
    const left = await until(`state.background.kind === "witch" && !entering`);
    ok("a click on her door: out in her woods again", left, await where());
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
