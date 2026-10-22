// (ticket 435) The knight costume, and the helmet one routine with the trap room's: chain mail under a tabard in his arms
// (quartered, halves or plain, an emblem on his chest, none on his back), a shield in the same arms (its wooden back from
// behind), the trap room's sword upright in his hand, and the trap room's great helm worn (closed, or open with his face in
// its window; its own side view in profile; its back from behind), the hair under it; the 🪖 helmet placed facing toward,
// away, left and right, four different drawings; every pose drawn; the tab's rows. Exits 1 on a failure.
//   node knight435.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), out = { v: {}, poses: {}, placed: {} };
    state.music.mute = true; state.world.at = null; Object.assign(state.background, { kind: "emptyroom", things: [], seat: null }); state.body.sit = false;
    set("hair", "beard", "none"); set("costume", "kind", "knight"); const C = state.costume, fig = () => document.getElementById("figure").innerHTML;
    const hairMatters = async () => { set("hair", "style", "long"); changed(); await w(30); const a = fig(); set("hair", "style", "none"); changed(); await w(30); const b = fig(); set("hair", "style", "long"); changed(); await w(30); return a !== b; };
    for (const facing of ["front", "left", "right", "back"]) { state.body.facing = facing; changed(); await w(70); const m = fig();
      out.v[facing] = { helm: m.includes('fill="#a3a9b4"'), plate: m.includes('fill="#959ba6"'), slit: m.includes('fill="#1d1f24"'), emblem: m.includes('fill="#e0b030" opacity="0.95"'),
        armsA: m.includes('fill="' + C.knightA + '"'), shieldBack: m.includes('fill="#7a4f2a" stroke="#3b3b44"'), sword: (h => h.includes("22,-3.4 88,-2.6") || h.includes('fill="#c9ced6" stroke="#7d838e"') || h.includes('fill="#b9bec7" stroke="#7d838e"'))(m + ((document.getElementById("figure-far") || {}).innerHTML || "")), hair: await hairMatters() }; }
    state.body.facing = "front"; set("costume", "helmOpen", true); changed(); await w(60); out.open = fig().includes('fill-rule="evenodd"') && fig().includes('fill="#a3a9b4"'); set("costume", "helmOpen", false);
    for (const lay of ["quartered", "halves", "plain"]) { set("costume", "tabardLayout", lay); changed(); await w(40); out["lay_" + lay] = (fig().match(/<rect [^>]*fill="(#2f6db5|#f4f1ea)"/g) || []).length; }
    set("costume", "tabardLayout", "quartered");
    for (const pose of ["stand", "sit", "meditate", "dance", "hug", "lie"]) { set("body", "pose", pose); changed(); await w(60); out.poses[pose] = fig().length > 1000; }
    set("body", "pose", "stand"); state.body.sit = false; changed();
    for (const f of ["toward", "away", "left", "right"]) { state.background.things = [{ kind: "helmet", x: 0, z: SCENE.ground + 60, size: 100, facing: f, plume: "#c0392b", seed: 1 }]; changed(); await w(60);
      const t = document.querySelector('#pic [data-drag^="thing:"]'); out.placed[f] = t ? t.innerHTML.length + ":" + t.innerHTML.slice(0, 0) + (t.innerHTML.match(/<circle/g) || []).length + "/" + (t.innerHTML.includes('fill="#959ba6"') ? "p" : "-") : "none"; }
    state.background.things = []; changed();
    tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(200);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    out.rows = ["knightA", "tabardLayout", "emblem", "plume", "helmOpen", "sword", "shield", "robinTunic"].map(k => shown(k) ? 1 : 0).join("");
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  const V = r.v;
  ok("the great helm worn every way, the hair under it", Object.values(V).every(v => v.helm && !v.hair), V);
  ok("closed facing us: its front plate and slit; in profile its own side view; from behind, no plate or slit", V.front.plate && V.front.slit && V.left.plate && V.right.plate && !V.back.plate && !V.back.slit, V);
  ok("the arms: the emblem on his chest and shield facing us, none from behind; the shield's wooden back from behind", V.front.emblem && !V.back.emblem && V.back.shieldBack && !V.front.shieldBack, V);
  // (ticket 518, 0.0.403: each held thing its own drawing: the blade edge on in profile, its other flat from behind; in profile
  // a thing in the far hand is behind the body, in #figure-far)
  ok("the trap room's sword in his hand", V.front.sword && V.left.sword && V.right.sword && V.back.sword, V);
  ok("the open helm: his face in its window", r.open, r.open);
  ok("quartered, halves and plain lay the arms out differently", r.lay_quartered > r.lay_halves && r.lay_halves > r.lay_plain, [r.lay_quartered, r.lay_halves, r.lay_plain]);
  ok("every pose drawn", Object.values(r.poses).every(Boolean), r.poses);
  ok("the placed helmet facing toward, away, left and right: four different drawings, a plate on all but the back", new Set(Object.values(r.placed)).size === 4 && !r.placed.away.endsWith("p") && r.placed.left.endsWith("p") && r.placed.toward.endsWith("p"), r.placed);
  ok("the tab shows the knight's rows, not Robin Hood's", r.rows === "11111110", r.rows);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
