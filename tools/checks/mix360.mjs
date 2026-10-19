// (ticket 360) Matthew's post-production as the new tracks' starting mix: couch-cushion rave A exactly his board (his
// save of 2026-10-18 20:48), B his two basses; and, after his "more low octave play in the rhythm and melody in general
// -- and more groovy bass, with more wah and effects (and more level)", every new rave and steppers dub (ticket 301)
// starts with its melody down an octave or more and its bass loud (+5 dB or more) with the wah open (90 or more). Every
// mix key names a channel the song has (a typo would silently do nothing). Exits 1 on a failure.
//   node mix360.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const HIS = {"cushionsA": {"hookA·lead": {"upN": -3, "knob": 79, "tone": 28, "rev": 51, "level": 2}, "stabsA·lead": {"upN": -2}, "sparkle·musicbox": {"upN": -2, "rev": 85, "echo": 50}, "ghost·ghost": {"upN": -2}, "extra·shaker": {"rev": 24, "echo": 0}, "hats·hat": {"echo": 22, "level": 5, "rev": 40}, "hookB·lead": {"upN": -3, "knob": 82, "tone": 26, "rev": 59, "echo": 69, "level": 8}, "bassA·buzz": {"upN": -1}}, "cushionsB": {"bassA·buzz": {"upN": -1, "level": 7, "echo": 49, "rev": 36, "tone": 75, "knob": 100, "pan": 4}, "bassB·buzz": {"knob": 95, "level": 5, "pan": -7, "echo": 30, "rev": 18, "tone": 77}}};
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
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
try {
  await send("Runtime.enable");
  await send("Page.navigate", { url }); await sleep(4000);
  const r = JSON.parse(await ev(`(() => { const ids = [..."ABCDE"].map(v => "cushions" + v).concat([..."ABCD"].map(v => "steppers" + v));
    return JSON.stringify(ids.map(id => { const T = TUNES[id], song = T.make(), keys = song.parts.map(channelKey), mix = T.mix || {};
      const bass = Object.entries(mix).filter(([k]) => /^bass/.test(k)).map(([, c]) => c), tune = Object.entries(mix).filter(([k]) => /^(hook|tune)/.test(k)).map(([, c]) => c);
      return { id, mix, stray: Object.keys(mix).filter(k => k !== "fx" && !k.startsWith("lfo") && !keys.includes(k)), notes: (songOf(id).events || []).length,
               low: tune.length > 0 && tune.every(c => (c.upN || 0) < 0), loud: bass.length > 0 && bass.every(c => (c.level || 0) >= 5 && (c.knob ?? 50) >= 90) }; })); })()`));
  for (const t of r) console.log(`  ${t.id}: ${JSON.stringify({ stray: t.stray, notes: t.notes, low: t.low, loud: t.loud })}`);
  const A = r.find(t => t.id === "cushionsA"), B = r.find(t => t.id === "cushionsB");
  ok("rave A starts from his board exactly", Object.keys(HIS.cushionsA).length === Object.keys(A.mix).length && Object.entries(HIS.cushionsA).every(([k, c]) => A.mix[k] && same(A.mix[k], c)), A.mix);
  ok("rave B starts with his two basses exactly", Object.entries(HIS.cushionsB).every(([k, c]) => B.mix[k] && same(B.mix[k], c)), B.mix);
  ok("every mix key names one of the song's channels", r.every(t => !t.stray.length), r.map(t => [t.id, t.stray]));
  ok("every new track's melody starts an octave or more down", r.every(t => t.low), r.map(t => [t.id, t.low]));
  ok("every new track but A (his board as is) starts its bass loud (+5 dB) with the wah open (90)", r.every(t => t.loud || t.id === "cushionsA"), r.map(t => [t.id, t.loud]));
  ok("each still a song with notes", r.every(t => t.notes > 100), r.map(t => [t.id, t.notes]));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
