// (ticket 682, Matthew 2026-11-03: undo and redo in the scripts "bound to the usual key combinations", and "console messages that
// give timing information: cost per edit, cost per undo, cost per redo, in ms") In 📜 Scripting, TrapRoom's Hazel box: a typed change
// is one step and logs "[scripts] edit: N ms"; Ctrl+Z gives the text back and logs "[scripts] undo: N ms"; Ctrl+Shift+Z puts the
// change back ("[scripts] redo"), and so does Ctrl+Y after another undo; an undo with nothing to undo leaves the text as it is.
// Exits 1 on a failure.
//   node undo682.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [], logs = [];
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300));
  if (m.method === "Runtime.consoleAPICalled") logs.push(m.params.args.map(a => a.value).join(" ")); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 500)); return r.result.result.value; };
// a key with Ctrl (and Shift), as the browser sends it to the focused box
const chord = async (key, shift = false) => {
  const modifiers = 2 | (shift ? 8 : 0), code = "Key" + key.toUpperCase(), vk = key.toUpperCase().charCodeAt(0);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: shift ? key.toUpperCase() : key, code, windowsVirtualKeyCode: vk, modifiers });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: shift ? key.toUpperCase() : key, code, windowsVirtualKeyCode: vk, modifiers });
  await sleep(300);
};
const focusBox = () => ev(`(() => { const ta = document.querySelector('#panel textarea[data-module="TrapRoom"]'); ta.focus(); return document.activeElement === ta; })()`);
const where = () => ev(`(() => { const a = document.activeElement; return a ? a.tagName + (a.dataset && a.dataset.module ? ":" + a.dataset.module : "") : "none"; })()`);
const text = () => ev(`document.querySelector('#panel textarea[data-module="TrapRoom"]').value`);
const logged = kind => logs.filter(l => l.startsWith(`[scripts] ${kind}:`));
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 600)}`); if (!cond) bad++; };
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.bringToFront"); await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await send("Page.navigate", { url }); await sleep(4000);
  await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state = clone(DEFAULTS); state.music.mute = true;
    state.scripts = { on: false, all: "hazel", common: null, rooms: {} };
    scriptEditorSettings().hazel = "text";   // (the Hazel boxes as text, not tiles: the text box is what takes the keys here)
    changed(); await w(300);
    tab = TABS.findIndex(t => t[1] === "scripting"); showTab(); await w(300);
    for (let i = 0; i < 120 && !window.Hazel; i++) await w(250);
    return true; })()`);
  ok("Hazel loaded in 📜 Scripting", await ev(`!!window.Hazel`), null);
  const shipped = await text();
  ok("TrapRoom's Hazel box is there, with the shipped rule", typeof shipped === "string" && shipped.includes("on_event"), shipped);
  // a typed change: one step, compiled after the pause, its cost logged
  const typed = shipped + "\n# a note #";   // (a change the box keeps as it is: a trailing newline alone is tidied away)
  await ev(`(() => { const ta = document.querySelector('#panel textarea[data-module="TrapRoom"]'); ta.focus();
    ta.value = ${JSON.stringify(typed)}; ta.dispatchEvent(new Event("input")); return true; })()`);
  await sleep(1500);
  ok("a typed change logs its cost: [scripts] edit: N ms", logged("edit").length >= 1 && /^\[scripts\] edit: [\d.]+ ms/.test(logged("edit")[0]), logs.slice(-5));
  console.log("  (focus after the edit was compiled: " + await where() + ")");
  ok("the caret can go back in the box", await focusBox(), await where());
  await chord("z");
  ok("Ctrl+Z gives the text back", (await text()) === shipped, await text());
  ok("an undo logs its cost: [scripts] undo: N ms", logged("undo").length === 1 && /^\[scripts\] undo: [\d.]+ ms/.test(logged("undo")[0]), logs.slice(-5));
  await chord("z", true);
  ok("Ctrl+Shift+Z puts the change back", (await text()) === typed, await text());
  ok("a redo logs its cost: [scripts] redo: N ms", logged("redo").length === 1 && /^\[scripts\] redo: [\d.]+ ms/.test(logged("redo")[0]), logs.slice(-5));
  await chord("z"); await chord("y");
  ok("Ctrl+Y redoes too", (await text()) === typed && logged("redo").length === 2, [await text(), logged("redo").length]);
  await chord("z"); await chord("z");
  ok("an undo with nothing left to undo leaves the text as it is", (await text()) === shipped, await text());
  // with no box focused, the keys reach the box changed last
  await chord("y", false); await ev(`document.activeElement.blur(), true`);
  ok("redone, then no box focused", (await text()) === typed && (await where()) === "BODY", [await where()]);
  await chord("z");
  ok("Ctrl+Z with no box focused undoes in the box changed last", (await text()) === shipped, await text());
  console.log("  (the logged costs: " + logs.filter(l => l.startsWith("[scripts]")).join(" | ") + ")");
  ok("no page errors", errs.length === 0, errs);
} catch (e) { ok("the check ran", false, String(e && e.stack || e)); }
ws.close();
process.exit(bad ? 1 : 0);
