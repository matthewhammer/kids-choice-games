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
      const ctls = [...P.querySelectorAll(".ctl")].filter(vis), loose = boxed ? ctls.filter(c => !c.closest(".tabbox")).length : null;
      const dashed = [...P.querySelectorAll("*")].filter(e => vis(e) && /dashed/.test(getComputedStyle(e).borderTopStyle + getComputedStyle(e).borderLeftStyle)).length;
      out.tabs.push({ name, boxed, boxes: P.querySelectorAll(".tabbox:not([hidden])").length, loose, dashed, over: P.scrollWidth - P.clientWidth }); }
    tab = TABS.findIndex(t => t[0].includes("Neck")); showTab(); await w(250);
    const knees = [...P.querySelectorAll(".ctl")].find(c => c.dataset.key === "knees"), kn = knees && knees.querySelector(".name");
    out.knees = kn ? [kn.textContent, kn.title] : null;
    tab = TABS.findIndex(t => t[0].includes("Costume")); showTab(); await w(250);
    out.witchHidden = [...P.querySelectorAll(".tabbox")].filter(b => /witch|her cat|her broom/.test(b.querySelector(".box-name").textContent)).every(b => b.hidden);
    set("costume", "kind", "witch"); changed(); await w(250);
    out.witchShown = [...P.querySelectorAll(".tabbox")].some(b => /the witch/.test(b.querySelector(".box-name").textContent) && !b.hidden);
    state = clone(DEFAULTS); changed(); return JSON.stringify(out); })()`));
  for (const t of r.tabs) console.log("  " + JSON.stringify(t));
  const boxed = r.tabs.filter(t => t.boxed);
  ok("the friend's tabs and the costume boxed (13 tabs)", boxed.length >= 13, boxed.map(t => t.name));
  ok("each boxed tab: its rows in boxes, none loose, a box at least", boxed.every(t => t.boxes > 0 && t.loose === 0), boxed.filter(t => !(t.boxes > 0 && t.loose === 0)));
  ok("no dashed border in any tab's panel", r.tabs.every(t => t.dashed === 0), r.tabs.filter(t => t.dashed));
  ok("no tab's panel wider than itself", r.tabs.every(t => t.over <= 2), r.tabs.filter(t => t.over > 2));
  ok("a label's explanation a hint: knees bend, its parenthesis on pointing", r.knees && r.knees[0] === "🦵 knees bend" && /crouches/.test(r.knees[1]), r.knees);
  ok("the witch's boxes hidden with no costume, shown with the witch", r.witchHidden && r.witchShown, r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
