// (ticket 334) A tree room's trap door: a lever on its wall (data-lever "H"), the trap door open by default (its handle up,
// the hole a solid, its ladder a way down); pulled, shut (handle down, its lid across, no hole, no ladder, no doorway), and the
// room below's ladder up no way up either; pulled again, open. And the trap room's pits: no spikes by default, spikes with
// its 🔱 toggle. Exits 1 on a failure.
//   node trap334.mjs <devtools port> <url>
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
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null; B.kind = "treeroom";
    // (a house whose way down is into another house, so the one below's ladder up is checked too; else any with a way down)
    const downs = [1, 2, 3, 4, 5, 6].filter(n => n <= (B.houses ?? 4) && houseLinks(B, n - 1).some(L => L.way === "down"));
    const me = downs.find(n => houseLinks(B, n - 1).some(L => L.way === "down" && L.to >= 0)) ?? downs[0];
    B.inside = me; changed(); await w(600);
    const look = () => { const N = bgShown.node, arm = N.querySelector('[data-lever="H"] .lever-arm');
      return { lever: !!arm, up: arm ? /rotate\\(\\d/.test(arm.getAttribute("transform")) : null, ladder: !!N.querySelector("[data-ladder][data-down]"),
               doorway: [...N.querySelectorAll(".portal")].some(p => p.querySelector("[data-down]")), solid: solidsHere().some(o => o.name === "trapdoor"),
               lid: N.querySelector('.pit-lid[data-pit-i="hatch"]')?.getAttribute("visibility") !== "hidden" }; };
    const open0 = look(); roomLeverPull("H"); await w(1600); const shut = look();
    // (the house below: its ladder up into this one)
    const below = [1, 2, 3, 4, 5, 6].find(n => n <= (B.houses ?? 4) && houseLinks(B, n - 1).some(L => L.way === "up" && L.to === me - 1));
    let belowShut = null, belowOpen = null;
    if (below) { B.inside = below; changed(); await w(500); belowShut = !!bgShown.node.querySelector("[data-ladder][data-up]"); }
    B.inside = me; changed(); await w(400); roomLeverPull("H"); await w(1600); const open1 = look();
    if (below) { B.inside = below; changed(); await w(500); belowOpen = !!bgShown.node.querySelector("[data-ladder][data-up]"); }
    B.kind = "castleroom"; const K = castleOf(B), n = K.rooms.indexOf("trap") + 1; B.castleRoom = n; changed(); await w(600);
    const spikes = () => [...bgShown.node.querySelectorAll('g[clip-path^="url(#bg-pit"] polygon')].length;
    const dflt = B[pitSpikesKey(n, K.id)], off = spikes(); B[pitSpikesKey(n, K.id)] = true; changed(); await w(500); const on = spikes(); B[pitSpikesKey(n, K.id)] = false; changed();
    return JSON.stringify({ me, open0, shut, open1, below, belowShut, belowOpen, dflt, off, on }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("a tree room with a way down has the lever, the trap door open (handle up, hole, ladder, doorway)", r.open0.lever && r.open0.up && r.open0.ladder && r.open0.doorway && r.open0.solid && !r.open0.lid, r.open0);
  ok("pulled: shut (handle down, the lid across, no ladder, no doorway, walked over)", r.shut.lever && !r.shut.up && !r.shut.ladder && !r.shut.doorway && !r.shut.solid && r.shut.lid, r.shut);
  ok("pulled again: open as before", r.open1.up && r.open1.ladder && r.open1.doorway && r.open1.solid && !r.open1.lid, r.open1);
  ok("the room below: no way up while it is shut, a way up again once open", !!r.below && r.belowShut === false && r.belowOpen === true, [r.below, r.belowShut, r.belowOpen]);
  ok("the trap room's pits: no spikes by default, spikes with the toggle", r.dflt === false && r.off === 0 && r.on > 0, [r.dflt, r.off, r.on]);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
