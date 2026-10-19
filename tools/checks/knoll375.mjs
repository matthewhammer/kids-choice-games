// (ticket 375, Matthew: "redesign all panels in menu of dress up that are not following the guidance and insights outlined in the
// knowling report"; "does the non FS sub panel system look as well as the FS version? Are they each knowlled equally?") Each tab
// TAB_BOXES lays out, in the side panel: its rows all in boxes (none loose), each box named once; no dashed border anywhere in the
// panel (every tab); no panel wider than itself (every tab); a label's explanation a hint (the legs' knees: "knees bend" with its
// "(out, so the friend crouches)" on pointing); a box hidden when nothing in it applies (the witch's boxes, no costume). Exits 1 on
// a failure.
//   node knoll375.mjs <devtools port> <url>
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); state = clone(DEFAULTS); state.music.mute = true; state.world.at = null; changed();
    const P = document.getElementById("panel"), vis = e => e.offsetParent !== null, out = { tabs: [] };
    for (let i = 0; i < TABS.length; i++) { tab = i; showTab(); await w(250); const name = TABS[i][0], boxed = !!TAB_BOXES[name];
      const ctls = [...P.querySelectorAll(".ctl")].filter(vis).filter(c => !c.classList.contains("tab-bar")), loose = boxed ? ctls.filter(c => !c.closest(".tabbox")).length : null;   // (the ⛶ chip's bar, the way in, not a row)
      const dashed = [...P.querySelectorAll("*")].filter(e => vis(e) && /dashed/.test(getComputedStyle(e).borderTopStyle + getComputedStyle(e).borderLeftStyle)).length;
      out.tabs.push({ name, boxed, boxes: P.querySelectorAll(".tabbox:not([hidden])").length, loose, dashed, over: P.scrollWidth - P.clientWidth }); }
    tab = TABS.findIndex(t => t[0].includes("Neck")); showTab(); await w(250);
    const knees = [...P.querySelectorAll(".ctl")].find(c => c.dataset.key === "knees"), kn = knees && knees.querySelector(".name");
    out.knees = kn ? [kn.textContent, kn.title] : null;
    tab = TABS.findIndex(t => t[0].includes("Costume")); showTab(); await w(250);
    out.witchHidden = [...P.querySelectorAll(".tabbox")].filter(b => /witch|her cat|her broom/.test(b.querySelector(".box-name").textContent)).every(b => b.hidden);
    set("costume", "kind", "witch"); changed(); await w(250);
    out.witchShown = [...P.querySelectorAll(".tabbox")].some(b => /the witch/.test(b.querySelector(".box-name").textContent) && !b.hidden);
    // (0.0.311) 🏞️ Background's side panel boxed by thing; ⚙️ Advanced in boxes, its long accounts folded; the bubble themes drawn
    state = clone(DEFAULTS); state.background.kind = "lake"; changed(); tab = TABS.findIndex(t => t[1] === "background"); showTab(); await w(300);
    out.bg = [...P.querySelectorAll(".bg-boxes > .tabbox")].filter(b => !b.hidden).map(b => b.querySelector(".box-name").textContent);
    tab = TABS.findIndex(t => t[1] === "advanced"); showTab(); await w(300);
    out.adv = { boxes: P.querySelectorAll(".advbox").length, folds: P.querySelectorAll("details.how").length };
    tab = TABS.findIndex(t => t[1] === "controls"); showTab(); await w(300);
    out.themes = [...P.querySelectorAll(".ctlgroup .cap > .cap-pic")].filter(sv => sv.childElementCount > 0).length;
    out.themeNames = [...P.querySelectorAll(".ctlgroup")].filter(g => /theme A/.test((g.querySelector(":scope > .cap") || {}).textContent || "")).map(g => [...g.querySelectorAll(":scope > .ctl .name")].map(n => n.textContent)).flat();
    // (0.0.315) every other tab a designer: 😀 Face full screen with the game beside its boxes; Escape back, the game home
    tab = TABS.findIndex(t => t[0].includes("Face")); showTab(); await w(300); document.querySelector("#panel .tab-bar button").click(); await w(600);
    out.fs = { big: document.body.classList.contains("tab-big"), gameIn: !!document.querySelector(".tab-view-pic .pic-box") || !matchMedia("(min-width: 900px)").matches, cols: getComputedStyle(document.querySelector(".tabboxes")).gridTemplateColumns.split(" ").length };
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); await w(400);
    out.fs.back = !document.body.classList.contains("tab-big") && !!document.querySelector(".pic-area .pic-box");
    state = clone(DEFAULTS); changed(); return JSON.stringify(out); })()`));
  for (const t of r.tabs) console.log("  " + JSON.stringify(t));
  const boxed = r.tabs.filter(t => t.boxed);
  ok("the friend's tabs and the costume boxed (13 tabs)", boxed.length >= 13, boxed.map(t => t.name));
  ok("each boxed tab: its rows in boxes, none loose, a box at least", boxed.every(t => t.boxes > 0 && t.loose === 0), boxed.filter(t => !(t.boxes > 0 && t.loose === 0)));
  ok("no dashed border in any tab's panel", r.tabs.every(t => t.dashed === 0), r.tabs.filter(t => t.dashed));
  ok("no tab's panel wider than itself", r.tabs.every(t => t.over <= 2), r.tabs.filter(t => t.over > 2));
  ok("a label's explanation a hint: knees bend, its parenthesis on pointing", r.knees && r.knees[0] === "🦵 knees bend" && /crouches/.test(r.knees[1]), r.knees);
  ok("the witch's boxes hidden with no costume, shown with the witch", r.witchHidden && r.witchShown, r);
  ok("🏞️ Background's side panel in boxes by thing: the place, the lake's own, the friend here, what stands, things", ["🗺️ the place", "🧍 the friend here", "👁️ what stands here", "🪨 things to put here"].every(n => r.bg.includes(n)) && r.bg.some(n => /lake/.test(n)), r.bg);
  ok("⚙️ Advanced in boxes (5 or more), its long accounts folded under ℹ️", r.adv.boxes >= 5 && r.adv.folds >= 2, r.adv);
  ok("the bubble themes each drawn by its name (3), theme A's rows not repeating 🅰️", r.themes === 3 && r.themeNames.length && r.themeNames.every(n => !/🅰/.test(n)), r);
  ok("😀 Face a designer: full screen, the game beside its boxes (a grid of 2 or more), Escape back with the game home", r.fs.big && r.fs.gameIn && r.fs.cols >= 2 && r.fs.back, r.fs);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
