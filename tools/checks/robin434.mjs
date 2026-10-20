// (ticket 434) The Robin Hood costume: a forester's cap with a feather, a tunic with a dagged cape and hem, a strap across the
// chest, a belt and pouch, hose and boots, a bow in the hand and a quiver of arrows (its fletching over the shoulder from the
// front, the whole quiver on the back from behind); facing us, in profile both ways and from behind; the bow and quiver
// taken off; no pouch from behind; every pose drawn; the tab's rows. Exits 1 on a failure.
//   node robin434.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { v: {}, poses: {} };
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "emptyroom", things: [], seat: null }); state.body.sit = false;
    set("costume", "kind", "robin"); const C = state.costume, fig = () => document.getElementById("figure").innerHTML;
    const has = sel => !!document.querySelector("#figure " + sel);
    for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(70); const m = fig();
      out.v[facing] = { feather: m.includes('fill="' + C.robinFeather + '"'), bow: m.includes('stroke="#e8e0cc"'), fletch: m.includes("l-5 -18 l5 6 l5 -6"), quiverCase: has('rect[rx="8"][fill="#7a4f2a"]'),
        pouch: has('rect[fill="#8a5a2b"]'), dagged: (m.match(/ L[\\d.-]+ [\\d.-]+ L[\\d.-]+ [\\d.-]+/g) || []).length > 8 }; }
    state.body.facing = "front"; set("costume", "bow", false); set("costume", "quiver", false); changed(); await w(60);
    out.off = { bow: fig().includes('stroke="#e8e0cc"'), fletch: fig().includes("l-5 -18 l5 6 l5 -6") }; set("costume", "bow", true); set("costume", "quiver", true);
    for (const pose of ["stand", "sit", "meditate", "dance", "hug", "lie"]) { set("body", "pose", pose); changed(); await w(60); out.poses[pose] = fig().length > 1000; }
    set("body", "pose", "stand"); state.body.sit = false; changed();
    tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(200);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    out.rows = ["robinTunic", "robinHat", "robinFeather", "bow", "quiver", "staff", "wizardRobe"].map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  const V = r.v;
  ok("facing us and in profile: the feather, the bow, the fletching over the shoulder, the pouch, the dagged edges", ["front", "left", "right"].every(f => V[f].feather && V[f].bow && V[f].fletch && V[f].pouch && V[f].dagged), V);
  ok("from behind: the whole quiver on the back, no pouch", V.back.quiverCase && V.back.fletch && !V.back.pouch, V.back);
  ok("the bow and the quiver taken off", !r.off.bow && !r.off.fletch, r.off);
  ok("every pose drawn", Object.values(r.poses).every(Boolean), r.poses);
  ok("the tab shows Robin Hood's rows, not the staff's or the wizard's", r.rows === "1111100", r.rows);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
