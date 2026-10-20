// (tickets 436, 437) The queen and the king: a crown (the queen's three points, the king's five; jewels facing us, none from
// behind), a robe to the floor in each one's colour, an ermine collar and a gold girdle, an ermine mantle behind them (over
// them from behind), a scepter; the king given a full beard from 💇 Hair when he has none, taken off with the crown; every
// pose drawn; the tab's rows. Exits 1 on a failure.   node royal436.mjs <devtools port> <url>
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
    set("hair", "beard", "none"); const fig = () => document.getElementById("figure").innerHTML;
    const pearls = () => (fig().match(/r="4" fill="#f7f4ec"/g) || []).length;
    for (const k of ["queen", "king"]) { set("costume", "kind", k); const C = state.costume, robe = k === "king" ? C.kingRobe : C.queenRobe;
      out[k + "Beard"] = state.hair.beard;
      for (const facing of ["front", "left", "back"]) { state.body.facing = facing; changed(); await w(70); const m = fig();
        out.v[k + "-" + facing] = { pearls: pearls(), jewels: (m.match(/transform="rotate\\(45/g) || []).length, robe: m.includes('fill="' + robe + '"'), ermine: m.includes("url(#pat-ermine)"),
          girdle: m.includes('stroke="#e0b030" stroke-width="6"'), scepter: m.includes('r="11" fill="#e0b030"') }; }
      state.body.facing = "front";
      for (const pose of ["stand", "sit", "meditate", "dance", "hug", "lie"]) { set("body", "pose", pose); changed(); await w(50); out.poses[k + pose] = fig().length > 1000; }
      set("body", "pose", "stand"); state.body.sit = false; }
    set("costume", "mantle", false); set("costume", "scepter", false); changed(); await w(50);
    out.off = { ermineHem: (fig().match(/url\\(#pat-ermine\\)/g) || []).length, scepter: fig().includes('r="11" fill="#e0b030"'), collarPattern: !!document.getElementById("pat-ermine") };
    set("costume", "mantle", true); set("costume", "scepter", true);
    set("costume", "kind", "none"); out.beardAfter = state.hair.beard;
    set("costume", "kind", "queen"); tab = TABS.findIndex(t => t[1] === "costume"); showTab(); await w(200);
    const shown = key => { const el = document.querySelector('#panel [data-key="' + key + '"]'); return !!el && !el.hidden; };
    out.rowsQueen = ["queenRobe", "kingRobe", "crownJewel", "mantle", "scepter", "knightA"].map(k => shown(k) ? 1 : 0).join("");
    set("costume", "kind", "king"); await w(150); out.rowsKing = ["queenRobe", "kingRobe", "crownJewel", "mantle", "scepter", "knightA"].map(k => shown(k) ? 1 : 0).join("");
    set("costume", "kind", "none"); set("hair", "beard", "none");
    return JSON.stringify(out); })()`));
  console.log(`  ${JSON.stringify(r)}`);
  const V = r.v;
  ok("the queen's crown three points, the king's five", V["queen-front"].pearls === 3 && V["king-front"].pearls === 5, [V["queen-front"].pearls, V["king-front"].pearls]);
  ok("jewels on the crown facing us, none from behind", V["queen-front"].jewels === 3 && V["queen-back"].jewels === 0 && V["king-back"].jewels === 0, V);
  ok("each one's robe, the ermine, the girdle and the scepter, every way", Object.values(V).every(v => v.robe && v.ermine && v.scepter), V);
  ok("the king given a full beard, the queen none, and the king's taken off with the crown", r.kingBeard === "full" && r.queenBeard === "none" && r.beardAfter === "none", [r.queenBeard, r.kingBeard, r.beardAfter]);
  ok("the mantle and the scepter taken off; the collar's ermine still there", r.off.ermineHem <= 1 && !r.off.scepter && r.off.collarPattern, r.off);
  ok("every pose drawn", Object.values(r.poses).every(Boolean), r.poses);
  ok("the tab shows the queen's or the king's rows", r.rowsQueen === "101110" && r.rowsKing === "011110", [r.rowsQueen, r.rowsKing]);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
