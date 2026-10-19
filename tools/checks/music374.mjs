// (ticket 374, Matthew: "turtle stepper's dub D is awlful -- the others -- A, B, C are great. Let's make several replacement
// candidates"; "just add them as D-1, D-2, etc") Four candidates in 🌴 reggae right after D, named D-1 to D-4, each a song with
// notes; plain chords (no ninths, D's trouble) and no racing groups in the drums ("8(xxxxx)"); each its key, which its notes
// agree with (as key363 finds keys); and each plays, muted, with no page error. Exits 1 on a failure.
//   node music374.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    const SKIP = new Set([...PERCUSSION, "bubble", "zap", "bird"]);
    const corr = (a, b) => { const ma = a.reduce((x, y) => x + y) / 12, mb = b.reduce((x, y) => x + y) / 12; let n = 0, da = 0, db = 0; for (let i = 0; i < 12; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return n / Math.sqrt(da * db); };
    const g = TUNE_GROUPS.find(x => x[0] === "reggae")[2], ids = ["D1", "D2", "D3", "D4"].map(v => "steppers" + v), out = [];
    for (const id of ids) { const c = TURTLE_DUB[id.slice(8)], s = songOf(id), h = new Array(12).fill(0);
      for (const e of s.events) { const p = s.T.parts[e.part]; if (SKIP.has(p.inst)) continue; for (const m of e.notes || []) h[(((m + (p.shift || 0) + (s.T.shift || 0)) % 12) + 12) % 12] += e.len || 1; }
      const all = []; for (let t = 0; t < 12; t++) for (const [prof, mode] of [[MAJ, "major"], [MIN, "minor"]]) all.push({ key: KEY_NAMES[t] + " " + mode, r: corr(h, prof.map((_, i) => prof[(i - t + 12) % 12])) });
      all.sort((a, b) => b.r - a.r); const k = tuneKey(id);
      const pats = [c.drums.kick, c.drums.rim, c.drums.hat, ...(c.drums.extra || []).map(x => x[1]), ...(c.drums.break || []).map(x => x[1])].filter(Boolean);
      out.push({ id, name: TUNES[id].name, notes: s.events.length, key: k, keyOk: all[0].key === k || (all[1].key === k && all[0].r - all[1].r < 0.06), found: all[0].key,
        ninths: c.chords.filter(x => /9|11|13/.test(x)), tuplets: pats.filter(p => /\\(/.test(p)) }); }
    state.music.mute = true; for (const id of ids) { state.music.track = id; changed(); await w(400); }
    return JSON.stringify({ order: g.slice(g.indexOf("steppersD"), g.indexOf("steppersD") + 5), out }); })()`));
  for (const t of r.out) console.log("  " + JSON.stringify(t));
  ok("in 🌴 reggae right after D: D-1, D-2, D-3, D-4", JSON.stringify(r.order) === JSON.stringify(["steppersD", "steppersD1", "steppersD2", "steppersD3", "steppersD4"]), r.order);
  ok("named D-1 to D-4", r.out.every((t, i) => t.name.startsWith(`🐢 turtle steppers dub D-${i + 1}: `)), r.out.map(t => t.name));
  ok("each a song with notes", r.out.every(t => t.notes > 500), r.out.map(t => [t.id, t.notes]));
  ok("plain chords (no ninths) and no racing groups in the drums", r.out.every(t => !t.ninths.length && !t.tuplets.length), r.out.map(t => [t.id, t.ninths, t.tuplets]));
  ok("each its key, which its notes agree with", r.out.every(t => t.key && t.keyOk), r.out.map(t => [t.id, t.key, t.found]));
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
