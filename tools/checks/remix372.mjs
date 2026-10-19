// (ticket 372, Matthew: "new bat wing boogie remix track, based on these settings and adjustments", his save of 23:07) The
// remix: in 🕺 groove after the bat-wing boogie; at his tempo (173, 166% of 104) and down 14 (its own shift, B flat minor); his
// mix its own (the bass's settings, the five dups: fifteen parts); and played, muted, it runs with no page error. Exits 1 on
// a failure.
//   node remix372.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); state.music.mute = true;
    const s = songOf("batsremix"), m = mixOf("batsremix"), grp = TUNE_GROUPS.find(g => g[0] === "groove");
    state.music.track = "batsremix"; changed(); await w(1500); const np = String(nowPlaying());
    return JSON.stringify({ bpm: s && s.T.bpm, shift: s && s.T.shift, parts: s && s.T.parts.length, dups: (m.dups || []).length, bass: m["bassA·buzz"], key: tuneKey("batsremix"), group: grp && grp[2], np }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("in 🕺 groove, after the bat-wing boogie", r.group && r.group.indexOf("batsremix") === r.group.indexOf("bats") + 1, r.group);
  ok("at his tempo and down 14: 173 beats a minute, B flat minor", r.bpm === 173 && r.shift === -14 && r.key === "Bb minor", r);
  ok("his mix its own: the bass as he set it, five dups, fifteen parts", r.dups === 5 && r.parts === 15 && r.bass && r.bass.knob === 55 && r.bass.pan === -3 && r.bass.level === 10, r);
  ok("named as it plays", /bat-wing boogie remix/.test(r.np) && /173/.test(r.np), r.np);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
