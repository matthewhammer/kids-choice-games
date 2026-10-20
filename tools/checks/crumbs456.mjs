// (ticket 456, Matthew, from M's request: "when we have activated a RHS menu panel (e.g., background), and we scroll the RHS
// into the sub-panels -- retain a small band above them saying 'background / sub-panel-1 / ... / sub-panel-N' --- we use
// slashes as separators to give a tree-path into the panel that we hover over. e.g., while hovering over the 'what stands
// here' toggles (let's call this -- 'default background objects' instead), we'd see a band on top of RHS saying: background
// / default background objects"; "to at least see the start of the breadcrumb trail ('background') in that fixed band") In
// 🏞️ Background: the band says "background"; over the 👁️ default background objects box's chips it says "background /
// default background objects" (the box renamed, no "what stands here" left); scrolled far down, the band is still at the
// top of the window; the pointer gone from the panel, "background" again; in 🧍 Body, over the jumps' sliders, "body / the
// jumps". Exits 1 on a failure.
//   node crumbs456.mjs <devtools port> <url>
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
    state = clone(DEFAULTS); state.music.mute = true; state.background.kind = "lake"; state.world.at = null; changed(); await w(300);
    const band = () => document.getElementById("crumbs"), over = e => e.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    const boxNamed = name => [...document.querySelectorAll("#panel section.box")].find(b => b.querySelector(":scope > .box-name").textContent.trim() === name);
    tab = TABS.findIndex(t => t[1] === "background"); showTab(); await w(400);
    out.start = band().textContent;
    const objs = boxNamed("👁️ default background objects"); out.renamed = !!objs; out.oldName = !!boxNamed("👁️ what stands here");
    const chip = objs && (objs.querySelector("button") || objs.lastElementChild); if (chip) over(chip); await w(50);
    out.over = band().textContent;
    window.scrollTo(0, 3000); await w(300); out.scrolled = window.scrollY; const br = band().getBoundingClientRect(); out.bandTop = Math.round(br.top); out.bandShown = br.height > 8 && getComputedStyle(band()).display !== "none";
    document.getElementById("panel").dispatchEvent(new PointerEvent("pointerleave")); await w(50); out.left = band().textContent;
    window.scrollTo(0, 0);
    tab = TABS.findIndex(t => t[0] === "🧍 Body"); showTab(); await w(300);
    const jumps = boxNamed("🐸 the jumps"), slider = jumps && jumps.querySelector("input[type=range]"); if (slider) over(slider); await w(50);
    out.body = band().textContent;
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  ok("🏞️ Background: the band says background", r.start === "background", r.start);
  ok("the box is 👁️ default background objects now (no what stands here)", r.renamed && !r.oldName, r);
  ok("over its chips: background / default background objects (and deeper since ticket 461)", r.over.startsWith("background / default background objects"), r.over);
  ok("scrolled far down, the band is still at the top of the window", r.scrolled > 200 && r.bandShown && Math.abs(r.bandTop) <= 2, r);
  ok("the pointer gone from the panel: background again", r.left === "background", r.left);
  ok("🧍 Body, over the jumps' sliders: body / the jumps (and the slider since ticket 461), not the hidden group", r.body.startsWith("body / the jumps") && !/two jumps/.test(r.body), r.body);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
