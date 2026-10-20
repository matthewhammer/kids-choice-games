// (ticket 433) The monk or dryad costume: a hooded cloak to the feet and a rope belt; the hood up hides the hair and frames
// the face (its front, with the face's opening, facing us and in profile), closed over the head from behind; the hood
// down shows the hair and a cowl on the shoulders; the dryad's cloak green with leaves and her staff sprouting leaves, the
// monk's brown with a knobbed staff; the staff can be taken off; the tab's rows; every pose drawn. Exits 1 on a failure.
//   node monk433.mjs <devtools port> <url>
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
    set("hair", "beard", "none"); set("hair", "color", "#e8c35a"); set("costume", "kind", "monk");
    const fig = () => document.getElementById("figure").innerHTML;
    // (the hair shows when its style changes the drawing: hidden under the hood, shown with it down)
    const hairShows = async () => { const was = state.hair.style; set("hair", "style", "long"); changed(); await w(40); const a = fig();
      set("hair", "style", "none"); changed(); await w(40); const b = fig(); set("hair", "style", was); changed(); await w(40); return a !== b; };
    for (const who of ["monk", "dryad"]) { set("costume", "monkWho", who); out[who + "Cloak"] = state.costume.monkCloak;
      for (const up of [true, false]) { set("costume", "hoodUp", up);
        for (const facing of ["front", "right", "back"]) { state.body.facing = facing; changed(); await w(70); const m = fig();
          out.v[who + (up ? "-up-" : "-down-") + facing] = { opening: m.includes('fill-rule="evenodd"') && m.includes(" A"), closed: m.includes('data-hood="closed"'), hair: await hairShows() }; } } }
    // (ticket 447: in profile the hood's peak sticks out behind the head, away from the face: the hood reaches further behind
    // the head's middle than in front of it)
    set("costume", "monkWho", "monk"); set("costume", "hoodUp", true); out.peak = {};
    for (const [facing, d] of [["left", -1], ["right", 1]]) { state.body.facing = facing; changed(); await w(70);
      const hood = [...document.querySelectorAll("#figure path")].find(e => e.getAttribute("fill") === darker(state.costume.monkCloak) && e.getAttribute("stroke-width") === "4");
      const eye = document.querySelector("#figure circle, #figure ellipse"), hb = hood && hood.getBoundingClientRect(), fb = document.querySelector("#figure").getBoundingClientRect();
      const head = [...document.querySelectorAll("#figure path")].find(e => e.getAttribute("fill") === state.face.color);
      const hc = head ? (b => b.left + b.width / 2)(head.getBoundingClientRect()) : 0;
      const flap = document.querySelector('#figure [data-hood="flap"]'), fb2 = flap && flap.getBoundingClientRect();
      out.peak[facing] = hb ? { behind: Math.round(d > 0 ? hc - hb.left : hb.right - hc), front: Math.round(d > 0 ? hb.right - hc : hc - hb.left), flap: !!flap, flapBelowHood: fb2 ? fb2.bottom > hb.top + 0.75 * hb.height : false } : null; }
    state.body.facing = "front"; changed(); await w(50); out.flapFront = !!document.querySelector('#figure [data-hood="flap"]');
    // (ticket 449: the hood falls onto the shoulders, against the body, not bell-shaped: barely wider than the head)
    { const hood = [...document.querySelectorAll("#figure path")].find(e => e.getAttribute("fill-rule") === "evenodd" && e.getAttribute("fill") === state.costume.monkCloak);
      const head = [...document.querySelectorAll("#figure path")].find(e => e.getAttribute("fill") === state.face.color);
      out.hoodWidth = hood && head ? +(hood.getBoundingClientRect().width / head.getBoundingClientRect().width).toFixed(2) : null; }
    state.body.facing = "front"; set("costume", "hoodUp", true);
    set("costume", "monkWho", "dryad"); changed(); await w(60); out.leaves = ((document.getElementById("pat-shirt") || {}).outerHTML || "").includes("M3 11") && fig().includes("#4caf50");
    set("costume", "monkWho", "monk"); changed(); await w(60); out.knob = !fig().includes("#4caf50") && fig().includes('r="8" fill="#7a4f2a"');
    set("costume", "staff", false); changed(); await w(60); out.noStaff = !fig().includes('r="8" fill="#7a4f2a"'); set("costume", "staff", true);
    for (const pose of ["stand", "sit", "meditate", "dance", "hug", "lie"]) { set("body", "pose", pose); changed(); await w(60); out.poses[pose] = fig().length > 1000; }
    set("body", "pose", "stand"); state.body.sit = false; changed();
    tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(200);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    out.rows = ["monkWho", "monkCloak", "hoodUp", "staff", "staffOrb", "wizardRobe"].map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  const V = r.v;
  ok("the hood up: the face's opening facing us and in profile, and no hair, monk and dryad", ["monk", "dryad"].every(w => ["front", "right"].every(f => V[w + "-up-" + f].opening && !V[w + "-up-" + f].hair)), V);
  ok("the hood up, from behind: closed over the head, its peak a flap toward us, no face opening under it, no hair (ticket 447)", ["monk", "dryad"].every(w => !V[w + "-up-back"].hair && V[w + "-up-back"].closed && !V[w + "-up-back"].opening), V);
  ok("the hood down: the hair shows, no hood", ["monk", "dryad"].every(w => ["front", "right", "back"].every(f => V[w + "-down-" + f].hair && !V[w + "-down-" + f].opening && !V[w + "-down-" + f].closed)), V);
  // (ticket 448, Matthew: "now the peak hangs down behind our head"; "it doesn't 'stick out' at all")
  ok("in profile the hood's peak hangs down behind the head as a flap, sticking out nowhere; facing us, no flap", ["left", "right"].every(f => r.peak[f] && r.peak[f].flap && r.peak[f].flapBelowHood && r.peak[f].behind < 1.6 * r.peak[f].front) && !r.flapFront, [r.peak, r.flapFront]);
  ok("facing us, the hood falls onto the shoulders, no wider than 1.5 heads, not bell-shaped (ticket 449)", r.hoodWidth && r.hoodWidth < 1.5, r.hoodWidth);
  ok("the monk's cloak brown, the dryad's moss green", r.monkCloak === "#6b4a2b" && r.dryadCloak === "#4f6b3a", [r.monkCloak, r.dryadCloak]);
  ok("the dryad's cloak in leaves and her staff sprouting; the monk's staff knobbed; the staff taken off", r.leaves && r.knob && r.noStaff, [r.leaves, r.knob, r.noStaff]);
  ok("every pose drawn", Object.values(r.poses).every(Boolean), r.poses);
  ok("the tab shows the monk's rows and the staff, not the orb or the wizard's", r.rows === "111100", r.rows);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
