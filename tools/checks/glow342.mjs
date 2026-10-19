// (ticket 342, Matthew: "when we hover over a placeable object, it glows like the doors, etc.") A placed rock, a bubble maker
// and a trap door in the empty room: the mouse moved over each in turn (a real mouse move), that one glows (the levers' drop
// shadow) and the others do not. Exits 1 on a failure.
//   node glow342.mjs <devtools port> <url>
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
  const at = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), B = state.background, g = SCENE.ground;
    state.music.mute = true; state.world.at = null; B.kind = "emptyroom"; B.figX = 0; B.figY = 0;
    B.things = [{ kind: "rock", x: -220, z: g + 60, seed: 901, size: 160, mirror: false, tone: ROCK_TONES[0] }, { kind: "bubblemaker", x: 220, z: g + 60, seed: 902, size: 100, mirror: false, rate: 1 },
                { kind: "trapdoor", x: 0, z: g + 120, seed: 903, size: 100, mirror: false, uid: "dglow", open: false }];
    changed(); await w(800);
    return JSON.stringify([...document.querySelectorAll('#bg .thing[data-drag^="thing:"]')].map(e => { const r = e.getBoundingClientRect(); return [e.dataset.drag, r.left + r.width / 2, r.top + r.height * 0.6]; })); })()`));
  const seen = [];
  for (const [name, x, y] of at) {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }); await sleep(150);
    seen.push(JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('#bg .thing[data-drag^="thing:"]')].map(e => [e.dataset.drag, getComputedStyle(e).filter !== "none"]))`)).concat([[ "over", name ]]));
  }
  console.log("  " + JSON.stringify(seen));
  ok("three placed things", at.length === 3, at);
  ok("each glows under the pointer, and only it", seen.every(s => { const over = s[s.length - 1][1]; return s.slice(0, -1).every(([n, glow]) => glow === (n === over)); }), seen);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
