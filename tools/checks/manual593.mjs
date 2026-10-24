// (ticket 593, Matthew 2026-10-24: "a report draft du_report series, explaining the new game script feature, in the spirit of a 1980s or
// 1990s game manual, with screenshots (of script panels, of in-game correspondance (pit room)) ... show what log events look like, and
// how to use them to 'debug' the game script"; "the report/manual for game scripts should show examples of erroneous scripts, and how to
// check the errors and fix them") The manual's pictures, dark, each a scene set up and taken: the pit room in the game; the 📜 panel;
// ⛶ at the trap room's tiles with the game viewport (the friend away from the door: Matthew, "the box around the door isn't important"); 🪵 the event log, an entry opened and its globals side by side; a type error
// (its box, its check entry, its event's entry); a command the room does not know; a Fumola rule that stops; Hazel's type error fixed.
// Pictures to out/manual/, the texts the manual quotes to out/manual/texts.json. Not a gate: exits 1 only if a scene could not be set up.
//   node manual593.mjs <devtools port> <url>
import { writeFileSync, mkdirSync } from "node:fs";
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
const shot = async (name, sel) => {
  let clip = null;
  if (sel) { const j = await ev(`(() => { const n = document.querySelector(${JSON.stringify(sel)}); if (!n) return ""; const r = n.getBoundingClientRect(); return JSON.stringify({ x: Math.max(0, r.left - 6), y: Math.max(0, r.top - 6), width: Math.min(r.width + 12, innerWidth), height: Math.min(r.height + 12, innerHeight - Math.max(0, r.top - 6)) }); })()`); if (j) clip = { ...JSON.parse(j), scale: 1 }; }
  const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip } : {}) });
  writeFileSync(`out/manual/${name}.png`, Buffer.from(r.result.data, "base64")); console.log(`ok   ${name}.png${sel ? " (" + sel + ")" : ""}`);
};
let bad = 0; const texts = {};
const step = async (what, f) => { try { await f(); } catch (e) { bad++; console.log(`FAIL ${what}: ${String(e).slice(0, 300)}`); } };
mkdirSync("out/manual", { recursive: true });
const W = `const w = ms => new Promise(r => setTimeout(r, ms));`;
const ROOM = `const B = state.background; for (const k of Object.keys(B)) if (/^castle(Lever|Boulder)[LR]_/.test(k)) delete B[k];
  Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -470, figY: 150, things: [], castleLeverWire3N: "normal", castleLeverL_3N: true, castleLeverR_3N: true }); changed();`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.bringToFront"); await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
  await send("Page.navigate", { url: url.replace(/#inspect$/, "") }); await sleep(5000);
  await ev(`(() => { try { themeSet("dark"); } catch (e) {} try { localStorage.setItem("scriptMaxGame", "0"); } catch (e) {} return 1; })()`);
  // ---- the pit room, in the game ----
  await step("the pit room", async () => {
    await ev(`(async () => { ${W} state = clone(DEFAULTS); state.music.mute = true;
      state.scripts = { on: true, all: "hazel", common: null, rooms: {}, editor: { hazel: "tiles", size: 14, log: true } }; ${ROOM} await hazelLoad();
      for (let i = 0; i < 100 && !(scriptCompile() || {}).ready; i++) await w(100); await w(1200); return 1; })()`);
    await shot("01-pit-room", ".pic-box");
  });
  // ---- the panel ----
  await step("the panel", async () => {
    await ev(`(async () => { ${W} tab = TABS.findIndex(t => t[1] === "scripting"); showTab(); await w(1500); document.querySelector("#panel").scrollTop = 0; return 1; })()`);
    await shot("02-panel");
    await shot("03-settings", ".script-settings");
  });
  // ---- some play, for the log: a red lever, a blue lever, under Hazel; then under JS ----
  await step("play", async () => {
    await ev(`(async () => { ${W} ${ROOM} await w(500); scriptLog.length = 0;
      for (const p of ["L", "BL", "R"]) { roomLeverPull(p); await w(2600); }
      const S = scriptsState(); S.all = "js"; S.on = false; changed(); await w(300); roomLeverPull("L"); await w(800);
      S.all = "hazel"; S.on = true; changed(); return 1; })()`);
  });
  // ---- ⛶ at the trap room, its tiles, the game viewport on ----
  await step("max view", async () => {
    await ev(`(async () => { ${W} document.querySelector('.script-box[data-room="TrapRoom"] .script-max-btn').click(); await w(400);
      scriptMaxGame(true); for (let i = 0; i < 300 && ![...scriptTileFrames].some(T => T.mod === "TrapRoom" && T.ready && T.height > 30); i++) await w(100);
      await w(2500); return 1; })()`);
    await shot("04-max-trap-room");
  });
  // ---- 🪵 the log beside the game (Matthew: "include screenshots like this one": the viewport, the log, two entries opened) ----
  await step("the log", async () => {
    await ev(`(async () => { ${W} scriptMaxOpen(scriptMax.boxes, document.querySelector(".script-log")); scriptMaxGame(true); await w(600);
      ${ROOM} await w(400); for (const p of ["R", "L"]) { roomLeverPull(p); await w(1200); } await w(2200);
      const es = [...document.querySelectorAll(".script-log .log-entry")].filter(d => !d.classList.contains("log-check"));
      for (const d of es.slice(0, 2)) d.open = true; await w(500); document.querySelector(".script-log").scrollTop = 0; return 1; })()`);
    await shot("05-log");
    // the same, one entry's globals opened side by side, the changed field marked
    await ev(`(async () => { ${W} const es = [...document.querySelectorAll(".script-log .log-entry")].filter(d => !d.classList.contains("log-check"));
      es[1] && (es[1].open = false); const g = es[0] && es[0].querySelector(".log-globals"); if (g) g.open = true; await w(500); return 1; })()`);
    await shot("05b-log-globals");
    texts.log = JSON.parse(await ev(`JSON.stringify(scriptLog.map(e => ({ n: e.n, engine: e.engine, call: e.call, ev: e.ev, ms: e.ms, diff: scriptDiff(e.before, e.settled || e.after) })))`));
  });
  // ---- a type error: the box, the check entry, the event's entry ----
  await step("type error", async () => {
    texts.typeError = JSON.parse(await ev(`(async () => { ${W} scriptMaxClose(); const S = scriptsState(); S.editor.hazel = "text"; scriptEditorApply();
      const orig = S.rooms.TrapRoom; S.rooms.TrapRoom = orig.replace("Flip(side,", "Flip(3,"); for (const b of document.querySelectorAll(".script-box")) if (b.refresh) b.refresh(); changed();
      scriptCompile(); await w(1500); ${ROOM} await w(400); scriptLog.length = 0; scriptCompile.said = null; scriptCompiled.key = null; scriptCompile(); roomLeverPull("L"); await w(1500);
      const C = scriptCompiled; window.__orig = orig;
      return JSON.stringify({ text: S.rooms.TrapRoom, errors: C.byModule.TrapRoom, entry: (() => { const e = scriptLog[scriptLog.length - 1]; return { engine: e.engine, dry: e.dry }; })() }); })()`));
    await ev(`(async () => { ${W} const b = document.querySelector('.script-box[data-room="TrapRoom"]'); b.scrollIntoView({ block: "start" }); await w(600); return 1; })()`);
    await shot("06-type-error-box", '.script-box[data-room="TrapRoom"]');
    await ev(`(async () => { ${W} document.querySelector(".script-log .script-max-btn").click(); await w(600);
      for (const d of document.querySelectorAll(".script-log .log-entry")) d.open = true; await w(500); document.querySelector(".script-log").scrollTop = 0; return 1; })()`);
    await shot("07-type-error-log");
  });
  // ---- fixed: the error gone, the check says fine again ----
  await step("fixed", async () => {
    await ev(`(async () => { ${W} const S = scriptsState(); S.rooms.TrapRoom = window.__orig; changed(); scriptCompile(); await w(800); ${ROOM} await w(300); roomLeverPull("L"); await w(1500);
      scriptMaxOpen(scriptMax.boxes, document.querySelector(".script-log")); await w(300); for (const d of [...document.querySelectorAll(".script-log .log-entry")].slice(0, 2)) d.open = true; await w(500); return 1; })()`);
    await shot("08-fixed-log");
  });
  // ---- a command the room does not know ----
  await step("unknown command", async () => {
    texts.unknown = JSON.parse(await ev(`(async () => { ${W} const S = scriptsState(); scriptLog.length = 0;
      S.rooms.TrapRoom = "let on_event = fun (g, e) : (Globals, Event) -> GoSquare(0, 0, N, Flip(L, Done))"; changed(); scriptCompile(); await w(600); ${ROOM} await w(300);
      roomLeverPull("L"); await w(1500); for (const d of document.querySelectorAll(".script-log .log-entry")) d.open = true; await w(500);
      const e = scriptLog[scriptLog.length - 1]; const out = { text: S.rooms.TrapRoom, unknown: e.unknown, answer: e.answer }; S.rooms.TrapRoom = window.__orig; changed(); scriptCompile(); return JSON.stringify(out); })()`));
    await shot("09-unknown-command");
  });
  // ---- a Fumola rule that stops ----
  await step("fumola stops", async () => {
    texts.stops = JSON.parse(await ev(`(async () => { ${W} const S = scriptsState(), F = S.fumola, orig = F.rooms.TrapRoom; scriptLog.length = 0;
      const m = orig.match(/public func on_event\\([^)]*\\)\\s*:\\s*[\\w.]+\\s*\\{/); F.rooms.TrapRoom = orig.replace(m[0], m[0] + " let z = [1, 2][5];");
      S.all = "fumola"; changed(); await fumolaLoad(); for (let i = 0; i < 100 && !(fumolaCompile() || {}).ready; i++) await w(100); ${ROOM} await w(300);
      roomLeverPull("L"); await w(1500); for (const d of document.querySelectorAll(".script-log .log-entry")) d.open = true; await w(500);
      const e = scriptLog[scriptLog.length - 1]; const out = { line: m[0] + " let z = [1, 2][5];", error: e.error, engine: e.engine }; F.rooms.TrapRoom = orig; S.all = "hazel"; changed(); return JSON.stringify(out); })()`));
    await shot("10-fumola-stops");
  });
  // ---- 🔬 the scripts' cost ----
  await step("cost", async () => {
    await ev(`(async () => { ${W} scriptMaxClose(); tab = TABS.findIndex(t => t[1] === "advanced"); showTab(); await w(1500); const c = document.querySelector(".script-cost"); if (c) c.scrollIntoView({ block: "center" }); await w(500); return 1; })()`);
    await shot("11-cost", ".script-cost");
  });
  writeFileSync("out/manual/texts.json", JSON.stringify(texts, null, 1));
  console.log(`ok   texts (${Object.keys(texts).join(", ")}); page errors: ${errs.length}`);
} catch (e) { console.log("stopped:", String(e).slice(0, 400)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`).catch(() => {}); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
