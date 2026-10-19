// (ticket 363, Matthew: "let's store key data in the songs going forward, and display it") Every tune has a key (its TUNES
// entry's key, else TUNE_KEYS), and its notes agree: a key-finding pass (Krumhansl-Kessler profiles, the parts' shifts in,
// drums and effects out) puts the declared key first, or second within 0.06 of the first (the bubble super-dub: A minor by
// its chords, close to C major by its notes). The playing line says the key, moved with 🎵 transpose. Exits 1 on a failure.
//   node key363.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(() => {
    const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    const SKIP = new Set([...PERCUSSION, "bubble", "zap", "bird"]);
    const corr = (a, b) => { const ma = a.reduce((x, y) => x + y) / 12, mb = b.reduce((x, y) => x + y) / 12; let n = 0, da = 0, db = 0; for (let i = 0; i < 12; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return n / Math.sqrt(da * db); };
    const bad = [], missing = [];
    for (const id of Object.keys(TUNES)) { const k = tuneKey(id); if (!k) { missing.push(id); continue; }
      const s = songOf(id), h = new Array(12).fill(0);
      for (const e of s.events) { const p = s.T.parts[e.part]; if (SKIP.has(p.inst)) continue; for (const m of e.notes || []) h[(((m + (p.shift || 0)) % 12) + 12) % 12] += e.len || 1; }
      const all = []; for (let t = 0; t < 12; t++) for (const [prof, mode] of [[MAJ, "major"], [MIN, "minor"]]) all.push({ key: KEY_NAMES[t] + " " + mode, r: corr(h, prof.map((_, i) => prof[(i - t + 12) % 12])) });
      all.sort((a, b) => b.r - a.r);
      if (!(all[0].key === k || (all[1].key === k && all[0].r - all[1].r < 0.06))) bad.push([id, k, all[0].key, +all[0].r.toFixed(2)]); }
    const m = state.music; m.mute = true; m.track = "underwater"; m.transpose = 2; const line = nowPlaying(); m.transpose = 0;
    return JSON.stringify({ n: Object.keys(TUNES).length, missing, bad, line }); })()`));
  console.log("  " + JSON.stringify(r));
  ok("every tune has a key", r.missing.length === 0 && r.n > 30, r.missing);
  ok("each key agrees with the tune's notes", r.bad.length === 0, r.bad);
  ok("the playing line says the key, moved with transpose (A minor up 2: B minor)", /in B minor/.test(r.line), r.line);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
