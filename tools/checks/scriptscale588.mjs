// (ticket 588, for ^report(32), Matthew 2026-10-23: "Can we project what will happen if the code gets bigger? ... what happens as we
// edit? Let's measure and plot response to edits that are valid logic edits (how long does the program take to complete the edit and
// be ready to be responsive)?"; "let's also show each room with an interesting script, and an example of the three scripts for that
// room: pit room? include screenshot in report"; "use pit room as the thumbnail") Three parts, recorded, not gated:
//   1. the trap room (the pit room): the game's picture of it, and its rule at max size in Hazel's tiles, as PNGs in out/r32/; its
//      three scripts (the game's JS, the Hazel rule, the Fumola rule) as text in out/r32/trap-code.json.
//   2. as the code grows: Common at 1, 2, 4, 8 and 16 times its size (copies of its functions, renamed), in Hazel and in Fumola. At
//      each size: a valid logic edit (a definition added to Common), timed until the program is compiled and the rules ready again
//      (scriptCompile, fumolaCompile; the game adds its 600 ms typing pause before it starts); Hazel's analysis of the whole program
//      (Hazel.analyzeProgram, the work Hazel's tiles redo after an edit); and the game calling into the script, 10 lever pulls.
//      A RESULT line per engine and size.
//   node scriptscale588.mjs <devtools port> <url>
import { mkdirSync, writeFileSync } from "node:fs";
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result.result.value; };
const shot = async (file, clip) => { const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(file, Buffer.from(r.result.data, "base64")); };
let bad = 0;
mkdirSync("out/r32", { recursive: true });
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.bringToFront"); await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  // (the pictures without the CI's #inspect overlays: a report's and a thumbnail's, not a test's)
  // (dark, Matthew 2026-10-23: "use dark mode screenshots in report please": the browser's preference dark, and the game's theme
  // switch on dark, so Hazel's tiles take dark and high contrast from the page)
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
  await send("Page.navigate", { url: url.replace(/#inspect$/, "") }); await sleep(5000);
  await ev(`(() => { try { themeSet("dark"); } catch (e) {} return 1; })()`);
  // ---- 1. the pit room: its picture, its rule in tiles, its three scripts ----
  const pic = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    state = clone(DEFAULTS); state.music.mute = true;
    Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -120, figY: 80, things: [] });
    state.scripts = { on: true, all: "hazel", common: null, rooms: {}, editor: { hazel: "tiles", size: 14 } };
    changed(); await w(1500);
    const st = document.getElementById("stage") || document.querySelector(".stage, #pic, svg");
    const r = st.getBoundingClientRect();
    return JSON.stringify({ x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight) }); })()`));
  await shot("out/r32/trap-game.png", pic);
  const code = await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    tab = TABS.findIndex(t => t[1] === "scripting"); showTab(); await w(500);
    const S = scriptsState();
    const out = { js: scriptJsSource("TrapRoom"), hazel: S.rooms.TrapRoom, fumola: (S.fumola.rooms || {}).TrapRoom || FUMOLA_ROOM_TEXTS.TrapRoom, common_hazel: S.common, common_fumola: S.fumola.common };
    document.querySelector('.script-box[data-room="TrapRoom"] .script-max-btn').click();
    for (let i = 0; i < 300 && ![...scriptTileFrames].some(T => T.mod === "TrapRoom" && T.ready && T.height > 30); i++) await w(100);
    await w(2500);
    return JSON.stringify(out); })()`);
  writeFileSync("out/r32/trap-code.json", code);
  await shot("out/r32/trap-tiles.png");
  // (Matthew: "include MUDU game script screenshots, of max script mode, with common defs being shown") 📚 Common at max size, its
  // tiles: the definitions every room calls, the outline of them all at the left
  await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    document.querySelectorAll(".script-max-item")[1].click();
    for (let i = 0; i < 300 && ![...scriptTileFrames].some(T => T.mod === "Common" && T.ready && T.height > 30); i++) await w(100);
    await w(2500); return 1; })()`);
  await shot("out/r32/common-tiles.png");
  console.log("ok   pictures and the trap room's three scripts written (out/r32)");
  // ---- 2. as the code grows, and an edit at each size ----
  await send("Emulation.setEmulatedMedia", { features: [] });
  await send("Page.navigate", { url }); await sleep(5000);
  for (const eng of ["hazel", "fumola"]) for (const k of [1, 2, 4, 8, 16]) {
    try {
      const res = await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), eng = ${JSON.stringify(eng)}, k = ${k};
        if (!window.__base) { state = clone(DEFAULTS); state.music.mute = true; Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -200, figY: 80, things: [] }); changed(); await w(800);
          const S0 = scriptsState(); window.__base = { hazel: S0.common, fumola: S0.fumola.common }; }
        const S = scriptsState(); S.all = eng; S.engines = {}; S.on = eng === "hazel";
        // Common at k times its size: k - 1 copies of its functions, each renamed _1, _2 ...
        const base = __base[eng];
        let text = base;
        if (eng === "hazel") { for (let c = 1; c < k; c++) text += ";\\n" + base.replace(/^let (\\w+) =/gm, "let $1_" + c + " =").replace(/;\\s*$/, ""); S.common = text; }
        else { const body = base.slice(base.indexOf("{") + 1, base.lastIndexOf("}")); let extra = ""; for (let c = 1; c < k; c++) extra += (extra ? ";" : "") + body.replace(/func (\\w+)\\(/g, "func $1_" + c + "(").replace(/public type [\\s\\S]*?};\\n/g, ""); S.fumola.common = base.slice(0, base.lastIndexOf("}")).replace(/\\s*$/, "") + (extra ? ";" + extra.replace(/\\s*$/, "") : "") + "\\n}"; }
        const lines = (eng === "hazel" ? S.common : S.fumola.common).split("\\n").length;
        if (eng === "hazel") { if (!window.Hazel) await hazelLoad(); } else { await fumolaLoad(); }
        const compile = () => { const t = performance.now(); const C = eng === "hazel" ? scriptCompile() : fumolaCompile(); return { ms: performance.now() - t, ok: eng === "hazel" ? !!(C && C.ready) : !!(C && C.ready) }; };
        const first = compile();
        if (!first.ok) { const C = eng === "hazel" ? scriptCompile() : fumolaCompile(); return JSON.stringify({ eng, k, lines, first: first.ms, error: "not ready at first", why: String(((C && C.errors) || [])[0] || (C && C.unfinished && C.unfinished[0]) || "").slice(0, 300) }); }
        // edits: a definition added to Common each time, compiled until ready again
        const edits = [];
        for (let e = 0; e < 5; e++) {
          if (eng === "hazel") S.common = S.common.replace(/;?\\s*$/, "") + ";\\nlet edit_" + k + "_" + e + " = " + e;
          else S.fumola.common = S.fumola.common.slice(0, S.fumola.common.lastIndexOf("}")).replace(/\\s*$/, "") + ";\\n  public func edit_" + k + "_" + e + "() : Int { " + e + " }\\n}";
          const c = compile(); edits.push(+c.ms.toFixed(2));
          if (!c.ok) { const C = eng === "hazel" ? scriptCompile() : fumolaCompile(); return JSON.stringify({ eng, k, lines, edit_ms: c.ms, error: "not ready after an edit", why: String(((C && C.errors) || [])[0] || (C && C.unfinished && C.unfinished[0]) || "").slice(0, 300) }); }
          await w(50);
        }
        // Hazel's analysis of the whole program, as the tiles redo it after an edit
        let analyze = null;
        if (eng === "hazel" && window.Hazel && Hazel.analyzeProgram) { const sp = scriptSpec(), ts = []; for (let a = 0; a < 3; a++) { const t = performance.now(); Hazel.analyzeProgram(sp); ts.push(performance.now() - t); } analyze = ts.map(x => +x.toFixed(1)); }
        // the game calling into the script
        window.__hz = undefined;
        for (let i = 0; i < 10; i++) { roomLeverPull(i % 2 ? "R" : "L"); await w(120); }
        const Z = window.__hz || {}, med = a => { a = (a || []).slice().sort((x, y) => x - y); return a.length ? +a[Math.floor(a.length / 2)].toFixed(3) : null; };
        const sorted = edits.slice().sort((x, y) => x - y);
        return JSON.stringify({ eng, k, lines, first: +first.ms.toFixed(1), edit: { median: sorted[2], min: sorted[0], max: sorted[4], all: edits }, analyze, script: { calls: Z.calls || 0, median: med(Z.ms), max: (Z.ms || []).length ? Math.max(...Z.ms) : null } });
      })()`);
      console.log("RESULT " + res);
    } catch (e) { bad++; console.log(`FAIL ${eng} x${k}: ${String(e.message || e).slice(0, 400)}`); }
  }
  console.log(`page errors: ${errs.length}${errs.length ? " " + errs.slice(0, 3).join(" | ") : ""}`);
} catch (e) { bad++; console.log("FAIL " + (e.stack || e)); }
console.log(bad ? `${bad} failed` : "all ok");
ws.close();
process.exit(bad ? 1 : 0);
