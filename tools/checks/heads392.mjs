// (ticket 392) A panel says its header once: in every tab's boxes, a box with one row or group showing shows no header of
// its own beyond the box's (a slider keeps its name), and no row name or group header showing says only the box's words
// again; Matthew's cases (🤸 the pose's "poses", ↔️ facing and moving's "facing", ✋ the dominant hand's "dominant hand",
// 🐸 the jumps' "the two jumps") are hidden, lying down too, and the 🎵 Music and 🗺️ World design tabs' "⛶ full screen"
// and "🗺️ world design" names are hidden; 🅰️ theme A keeps its name. Exits 1 on a failure.
//   node heads392.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { boxes: 0, seen: [], repeats: [], lone: [] };
    state.music.mute = true;
    // (the check's own words: emoji and the, its, her, his, and, &, of, both left out, a plural and 's folded)
    const skip = new Set(["the", "its", "her", "his", "and", "&", "of", "both"]);
    const words = t => t.replace(/[\\p{Extended_Pictographic}\\u200D\\uFE0F]/gu, " ").toLowerCase().split(/[\\s,:;()]+/).map(x => x.replace(/'s$/, "").replace(/s$/, "")).filter(x => x && !skip.has(x));
    const repeats = (h, b) => { const hw = words(h), bw = words(b); return hw.length > 0 && hw.every(x => bw.some(y => x === y || (y.length >= 4 && x.endsWith(y)))); };
    const shows = e => { for (let x = e; x && x.id !== "panel"; x = x.parentElement) if (x.hidden || getComputedStyle(x).display === "none") return false; return true; };
    const headOf = c => c.matches(".ctlgroup") ? c.querySelector(":scope > .cap") : c.querySelector(":scope > .lbl .name");
    const sweep = label => { for (const b of document.querySelectorAll("#panel section.box")) { if (!shows(b)) continue; out.boxes++;
      const name = b.querySelector(":scope > .box-name").textContent.trim(), rows = [...b.children].filter(c => !c.classList.contains("box-name") && shows(c));
      for (const c of rows) { const h = headOf(c); if (!h || !shows(h) || !h.textContent.trim()) continue; const t = h.textContent.trim(), slider = !!c.querySelector(":scope > input[type=range]");
        out.seen.push(label + " | " + name + " | " + t);
        if (!slider && repeats(t, name)) out.repeats.push(label + " | " + name + " | " + t);
        if (!slider && rows.length === 1) out.lone.push(label + " | " + name + " | " + t); } } };
    for (let i = 0; i < TABS.length; i++) { tab = i; showTab(); await w(150); sweep(TABS[i][0]); }
    // lying down: the pose box's rows grow
    tab = TABS.findIndex(t => t[0] === "🧍 Body"); state.body.pose = "lie"; changed(); showTab(); await w(300); sweep("🧍 Body, lying");
    state.body.pose = "stand"; changed(); await w(200);
    // the places' own boxes, a few of them
    tab = TABS.findIndex(t => t[1] === "background"); showTab(); await w(200);
    for (const k of ["lake", "crossing", "livingroom", "treehouse", "witch", "beach"]) { state.background.kind = k; state.world.at = null; changed(); await w(250); sweep("🏞️ " + k); }
    // Matthew's cases, as he named them
    tab = TABS.findIndex(t => t[0] === "🧍 Body"); showTab(); await w(200);
    const boxText = name => { const b = [...document.querySelectorAll("#panel section.box")].find(x => x.querySelector(":scope > .box-name").textContent.trim() === name); return b ? [...b.querySelectorAll(".cap, .lbl .name")].filter(shows).map(e => e.textContent.trim()) : null; };
    out.cases = { pose: boxText("🤸 the pose"), facing: boxText("↔️ facing and moving"), hand: boxText("✋ the dominant hand"), jumps: boxText("🐸 the jumps") };
    out.designers = {};
    for (const part of ["music", "world"]) { tab = TABS.findIndex(t => t[1] === part); showTab(); await w(300);
      out.designers[part] = [...document.querySelectorAll("#panel > .ctl > .lbl .name")].filter(shows).map(e => e.textContent.trim()); }
    tab = TABS.findIndex(t => t[0] === "🎮 Controls"); showTab(); await w(300);
    out.themeA = [...document.querySelectorAll("#panel .cap")].filter(shows).map(e => e.textContent.trim()).filter(t => /theme [ABC]/.test(t));
    return JSON.stringify(out); })()`));
  console.log(`  ${r.boxes} boxes looked at, ${r.seen.length} headers showing`);
  ok("no row name or group header showing says only its box's words again", !r.repeats.length, r.repeats);
  ok("a box with one row or group showing shows only the box's header (a slider keeps its name)", !r.lone.length, r.lone);
  ok("🤸 the pose shows no “poses”", r.cases.pose && !r.cases.pose.some(t => /poses/.test(t)), r.cases.pose);
  ok("↔️ facing and moving shows no “↔️ facing”, and keeps 🎬 animations", r.cases.facing && !r.cases.facing.includes("↔️ facing") && r.cases.facing.some(t => /animations/.test(t)), r.cases.facing);
  ok("✋ the dominant hand shows only its box's header, 🐸 the jumps no “the two jumps” (its sliders keep their names)", r.cases.hand && !r.cases.hand.length && r.cases.jumps && !r.cases.jumps.some(t => /two jumps/.test(t)) && r.cases.jumps.length === 4, [r.cases.hand, r.cases.jumps]);
  ok("🎵 Music and 🗺️ World design show no “⛶ full screen”, and World design no “🗺️ world design”", !r.designers.music.includes("⛶ full screen") && !r.designers.world.length && r.designers.music.length >= 4, r.designers);
  ok("🅰️ theme A, 🅱️ theme B and ©️ theme C keep their names", r.themeA.length === 3, r.themeA);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
