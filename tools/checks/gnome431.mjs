// (ticket 431) The gnome costume: a gnome man (the tall pointed hat, a beard and moustache, a belted tunic over trousers,
// felt boots) or a gnome woman (the hat, a white blouse, a laced bodice, an apron, a skirt of upright stripes), facing us,
// in profile both ways and from behind; the hat's cover colour following the gnome chosen; the tab's rows for each; every
// pose drawn without an error. Exits 1 on a failure.
//   node gnome431.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { views: {}, poses: {}, rows: {} };
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "emptyroom", things: [], seat: null }); state.body.sit = false;
    set("costume", "kind", "gnome");
    const fig = () => document.getElementById("figure").innerHTML;
    const shown = key => { const r = document.querySelector('#panel [data-key="' + key + '"]'); return !!r && !r.hidden; };
    for (const who of ["man", "woman"]) { set("costume", "gnomeWho", who); out[who + "Hat"] = state.costume.gnomeHat;
      for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(80); const m = fig(), C = state.costume;
        out.views[who + "-" + facing] = { hat: m.includes('fill="' + C.gnomeHat + '"'), beard: m.includes('fill="' + C.beardColor + '"'), bodice: m.includes('fill="' + C.gnomeBodice + '"'),
          stripes: ((document.getElementById("pat-pants") || {}).outerHTML || "").includes('fill="' + GNOME_STRIPES[2] + '"') && m.includes("url(#pat-pants)"), boots: m.includes(C.gnomeBoots) }; }
      state.body.facing = "front";
      for (const pose of ["stand", "sit", "meditate", "dance", "hug", "lie"]) { set("body", "pose", pose); changed(); await w(60); out.poses[who + "-" + pose] = fig().length > 1000; }
      set("body", "pose", "stand"); state.body.sit = false; changed();
      tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(200);
      out.rows[who] = ["gnomeWho", "gnomeHat", "gnomeBeard", "gnomeTunic", "gnomeBodice", "gnomeSkirt", "gnomeBoots", "witchColor"].map(k => shown(k) ? 1 : 0).join(""); }
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  const V = r.views;
  ok("the man: hat, beard, felt boots facing us and in profile; the hat and no beard from behind", ["front", "left", "right"].every(f => V["man-" + f].hat && V["man-" + f].beard && V["man-" + f].boots) && V["man-back"].hat && !V["man-back"].beard, V);
  ok("the woman: hat, bodice, striped skirt, no beard, every way", ["front", "left", "right", "back"].every(f => V["woman-" + f].hat && V["woman-" + f].bodice && V["woman-" + f].stripes && !V["woman-" + f].beard), V);
  ok("the hat red for the man and purple for the woman, as on the cover", r.manHat === "#d2382b" && r.womanHat === "#7b3f8c", [r.manHat, r.womanHat]);
  ok("every pose drawn, both gnomes", Object.values(r.poses).every(Boolean), r.poses);
  ok("the tab shows the man's rows for the man and the woman's for the woman, never the witch's", r.rows.man === "1111001" + "0" && r.rows.woman === "1100111" + "0", r.rows);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
