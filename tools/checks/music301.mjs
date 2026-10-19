// (ticket 301, for M) Five more couch-cushion raves under 🏠 house and four more turtle steppers dubs under 🌴 reggae, each
// building (a song with notes), in its kind beside the first, about as long as the first (within a third), and upbeat, as
// Matthew asked: its first chord major (or a 7th or 9th), or, minor, fast (140 a minute or more). Exits 1 on a failure.
//   node music301.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(() => { const len = id => { const T = TUNES[id].make(); return T.form.reduce((a, f) => a + f.bars, 0) * 4 * 60 / T.bpm; };
    const tune = (id, first, kind, chordsOf) => { const T = TUNES[id].make(), sg = songOf(id), ch = chordsOf(T, id);
      return { id, kind: groupOfTune(id), inKind: groupOfTune(id) === kind, notes: sg && sg.events ? sg.events.length : 0, secs: Math.round(len(id)), firstSecs: Math.round(len(first)), bpm: T.bpm, chord: ch,
               upbeat: !/^[A-G][#b]?m(?!aj)/.test(ch) || T.bpm >= 140 }; };
    const raves = "ABCDE".split("").map(v => tune("cushions" + v, "cushions", "house", (T, id) => CUSHION_RAVE[id.slice(-1)].A[0]));
    const dubs = "ABCD".split("").map(v => tune("steppers" + v, "steppers", "reggae", (T, id) => TURTLE_DUB[id.slice(-1)].chords[0]));
    return JSON.stringify({ raves, dubs }); })()`));
  for (const t of [...r.raves, ...r.dubs]) console.log(`  ${JSON.stringify(t)}`);
  const all = [...r.raves, ...r.dubs];
  ok("nine new tracks, each a song with notes", all.length === 9 && all.every(t => t.notes > 100), all.map(t => [t.id, t.notes]));
  ok("each in its kind beside the first (🏠 house, 🌴 reggae)", all.every(t => t.inKind), all.map(t => [t.id, t.kind]));
  ok("each about as long as the first (within a third)", all.every(t => Math.abs(t.secs - t.firstSecs) <= t.firstSecs / 3 || t.bpm >= 140), all.map(t => [t.id, t.secs, t.firstSecs]));
  ok("each upbeat: major (or a 7th or 9th), or minor and fast", all.every(t => t.upbeat), all.map(t => [t.id, t.chord, t.bpm]));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
