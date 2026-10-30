// (ticket 274) A save draws the same picture every time. Every place (with the
// friend), and a climb clipped through a castle room's floor, drawn with the
// picture's clock held at 0 (holdStill), in two fresh loads of the page a few
// seconds apart (the second marked a slow computer), come out the same, byte
// for byte; none is a slow computer's still picture (a blob: image); and in
// play, not held, bubble space's bubbles still drift. Exits 1 on a failure
// or page error.
//   node still274.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0, fails = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
const say = (ok, line) => { if (!ok) fails++; console.log(`${ok ? "ok  " : "FAIL"} ${line}`); };
// (every place, then the climb: each a hash of the picture's markup, and whether it holds a blob: image)
const DRAW_ALL = `(async () => {
  const tick = ms => new Promise(r => setTimeout(r, ms));
  const h = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return (x >>> 0).toString(16); };
  const reset = () => { for (const [p, v] of Object.entries(DEFAULTS)) if (state[p] && typeof v === "object") { for (const key of Object.keys(state[p])) delete state[p][key]; Object.assign(state[p], structuredClone(v)); } state.music.mute = true;
    state.dungeon.made = true; };   // (0.0.468: the game's dungeon made already, as in any game, or each reset makes it again: a hole with a new name)
  const pic = document.getElementById("pic"), out = {};
  const grab = k => { out[k] = h(pic.innerHTML) + (pic.innerHTML.includes("blob:") ? " BLOB" : ""); };
  for (const [kind] of PLACES) {
    if (kind === "none" || kind === "castleroom") continue;
    reset(); state.background.kind = kind; for (const g of VISIBLE_PARTS) state.visible[g] = 100;
    holdStill(0); changed(); await tick(250); grab(kind);
  }
  reset(); Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoomsN: 6, castleRoom6N: "dungeon1", castleRoom: 6 }); for (const g of VISIBLE_PARTS) state.visible[g] = 100;
  state.body.anim = "climbup"; state.body.facing = "back"; climb = null; climbAnywhere = true; holdStill(0); changed(); await tick(200); if (!climb) startClimb();
  if (climb && !climb.none) { climb.manual = true; climb.got = 0.5 * (climb.all || 0); changed(); await tick(300); grab("climb, dungeon"); out.clipped = pic.innerHTML.includes("fig-clip-"); }
  climb = null;
  return JSON.stringify(out);
})()`;
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  say(await ev(`typeof holdStill === "function" && stillAt === null`), "the page has holdStill, and play starts not held");
  // (in play: the bubbles drift)
  const drift = JSON.parse(await ev(`(async () => { const tick = ms => new Promise(r => setTimeout(r, ms));
    state.music.mute = true; state.background.kind = "bubblespace"; changed(); await tick(600);
    const pos = () => [...document.getElementById("bubble-layer").childNodes].slice(0, 5).map(n => n.getAttribute("transform")).join("|");
    const a = pos(); await tick(1200); return JSON.stringify({ a, b: pos() }); })()`));
  say(drift.a && drift.a !== drift.b, "in play, bubble space's bubbles drift");
  const first = JSON.parse(await ev(DRAW_ALL));
  await ev(`localStorage.setItem("dress-up-slow", "1"); 1`);
  await send("Page.navigate", { url }); await sleep(4000 + 2345);
  const second = JSON.parse(await ev(DRAW_ALL));
  await ev(`localStorage.removeItem("dress-up-slow"); 1`);
  const keys = Object.keys(first).filter(k => k !== "clipped"), differ = keys.filter(k => first[k] !== second[k]), blobs = keys.filter(k => first[k].includes("BLOB") || second[k].includes("BLOB"));
  say(keys.length >= 25, `${keys.length} pictures drawn held still`);
  say(!differ.length, differ.length ? `${differ.length} differ between the two loads: ${differ.join(", ")}` : "all the same in both loads, the second on a computer marked slow");
  say(!blobs.length, blobs.length ? `a slow computer's still picture in: ${blobs.join(", ")}` : "none is a still picture");
  say(first.clipped === true, "the climb through the dungeon's floor is clipped (its clip named by its shape)");
  if (errs.length) { fails++; console.log("FAIL page errors:", errs.slice(0, 3)); } else console.log("page errors: none");
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(fails ? 1 : 0); }
