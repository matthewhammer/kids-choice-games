// (ticket 432) The wizard costume, distinct from the witch: a robe to the feet covered in stars, a gold cord, a long beard, a
// hat with stars and a crescent moon whose tip flops forward, and a staff with a glowing orb; facing us, in profile both
// ways and from behind (no beard there); the staff and the beard can be taken off; the tab shows his rows; every pose drawn.
// Exits 1 on a failure.   node wizard432.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { views: {}, poses: {} };
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "emptyroom", things: [], seat: null }); state.body.sit = false;
    set("costume", "kind", "wizard");
    const fig = () => document.getElementById("figure").innerHTML, C = state.costume;
    for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(80); const m = fig();
      out.views[facing] = { stars: m.includes("polygon points") && ((document.getElementById("pat-shirt") || {}).outerHTML || "").includes("★"), beard: m.includes('fill="' + C.wizardBeard + '"'), orb: m.includes(C.staffOrb), cord: m.includes("#e0b030") }; }
    state.body.facing = "front"; set("costume", "staff", false); set("costume", "wizardBeardOn", false); changed(); await w(80);
    out.off = { orb: fig().includes(C.staffOrb), beard: fig().includes('fill="' + C.wizardBeard + '"') };
    set("costume", "staff", true); set("costume", "wizardBeardOn", true); changed();
    for (const pose of ["stand", "sit", "meditate", "dance", "hug", "lie"]) { set("body", "pose", pose); changed(); await w(60); out.poses[pose] = fig().length > 1000; }
    set("body", "pose", "stand"); state.body.sit = false; changed();
    tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(200);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    out.rows = ["wizardRobe", "wizardStars", "wizardBeardOn", "staff", "staffOrb", "witchColor", "gnomeWho"].map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  const V = r.views;
  ok("facing us and in profile: stars, beard, staff's orb, gold cord", ["front", "left", "right"].every(f => V[f].stars && V[f].beard && V[f].orb && V[f].cord), V);
  ok("from behind: the stars and the staff, no beard", V.back.stars && V.back.orb && !V.back.beard, V.back);
  ok("the staff and the beard taken off", !r.off.orb && !r.off.beard, r.off);
  ok("every pose drawn", Object.values(r.poses).every(Boolean), r.poses);
  ok("the tab shows the wizard's rows, not the witch's or the gnome's", r.rows === "1111100", r.rows);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
