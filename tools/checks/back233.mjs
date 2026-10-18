// (Matthew, 2026-10-18 on 0.0.232: "bug -- stuck in the climb into tree house animation -- a new regression, not there this
// morning") Every trip that leaves a way back names the place it left on "⬅️ back" (sceneName); from 0.0.213 that name was read
// from the 🏞️ Background tab's first row, the full-screen chip by then, and threw, the trip stopping with the friend going in.
// Each tree house with a door into its room, gone into at once (the trip's animations skipped): the friend arrives in the
// room, "⬅️ back" names the tree house, no page error. Exits 1 on a failure.
//   node back233.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background;
    state.music.mute = true; state.world.at = null; climb = null;
    const rf = flyInto, rw = walkInto;
    flyInto = function (b, arrive) { if (typeof arrive === "function") { arrive(); changed(); } else return rf.apply(this, arguments); };
    walkInto = function (d, arrive) { if (typeof arrive === "function") { arrive(); changed(); } else return rw.apply(this, arguments); };
    const out = [];
    for (let h = 1; h <= 6; h++) {
      Object.assign(B, { kind: "treehouse", houses: 6, figX: 0, figY: 60, things: [] }); entering = null; changed(); await w(400);
      const door = bgShown.node.querySelector('.portal[data-to="treeroom"][data-house="' + h + '"]');
      if (!door) continue;
      let err = null; try { enterScene(door); } catch (e) { err = String(e).slice(0, 160); }
      await w(700);
      if (state.background.kind !== "treeroom") continue;   // (a house reached by its ladder first: its climb is animated; not this check's)
      out.push({ h, kind: state.background.kind, back: document.getElementById("back").hidden ? "" : document.getElementById("back").textContent, err });
    }
    return JSON.stringify(out); })()`));
  console.log("  " + r.map(x => `house ${x.h}: ${x.kind}, back "${x.back}"${x.err ? ", " + x.err : ""}`).join("; "));
  ok("at least one tree house gone into", r.length >= 1, r);
  ok("each arrives in its room with \"⬅️ back\" naming the tree house, no error", r.every(x => x.kind === "treeroom" && /back/.test(x.back) && !x.err), r);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
