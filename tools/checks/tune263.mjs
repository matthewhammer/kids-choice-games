// (ticket 263, Matthew: "One new track for music -- 'turtle super-dub step' ... 153 beats a minute, down 12 half steps
// ... a new version of that song, with a new title, in the track list, same category. use fire emoji as the emoji.") The
// tune: in 🌴 reggae beside turtle steppers dub, named with 🔥; 153 beats a minute at the tempo slider's 100; its pitched
// parts an octave down, the bass, the sonar's bell and the first melodica back up as he set them, the drums as they were;
// his mixing board its own to start from, kept when the player changes one thing on it; picked, it plays (no errors).
// Exits 1 on a failure.
//   node tune263.mjs <devtools port> <url>
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
  const r = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    const g = TUNE_GROUPS.find(x => x[0] === "reggae"), T = songOf("superdub").T, S = songOf("steppers").T;
    const shift = Object.fromEntries(T.parts.map(q => [q.name + "·" + q.inst, q.shift || 0]));
    const before = JSON.stringify(mixOf("superdub")); state.music.mix = {}; chan("superdub", "chop·chop").level = 3; const after = mixOf("superdub");
    state.music.mute = true; state.music.track = "superdub"; changed(); await w(800);
    return JSON.stringify({ group: g[2], name: TUNES.superdub.name, bpm: T.bpm, steppersBpm: S.bpm, parts: T.parts.length === S.parts.length, shift, mixBefore: JSON.parse(before),
      kept: after["tuneA·melodica"] && after["tuneA·melodica"].level === -7 && after["chop·chop"].level === 3 && after["chop·chop"].echo === 81 && after.fx.repeats === 70, now: nowPlaying() }); })()`));
  console.log(`  ${r.name}: ${r.bpm} bpm; shifts ${JSON.stringify(r.shift)}; ${r.now}`);
  // (ticket 369: steppers dub A-D, ticket 301, came between them since; after them all, then; ticket 374: and D-1 to D-4)
  ok("in 🌴 reggae, after turtle steppers dub (and its A-D), named with 🔥", r.group.indexOf("superdub") > r.group.indexOf("steppers") && r.group.slice(r.group.indexOf("steppers") + 1, r.group.indexOf("superdub")).every(g => /^steppers[A-Z]\d?$/.test(g)) && /^🔥 turtle super-dub step$/.test(r.name), r);
  ok("153 beats a minute at the tempo slider's 100, the same parts as turtle steppers dub (at 74)", r.bpm === 153 && r.steppersBpm === 74 && r.parts, r);
  ok("an octave down, the bass, the sonar and the first melodica back up as he set them, the drums as they were", r.shift["bass·bass"] === 0 && r.shift["sonar·bell"] === 0 && r.shift["tuneA·melodica"] === 12 && r.shift["tuneB·melodica"] === -12 && r.shift["chop·chop"] === -12 && r.shift["kick·kick"] === 0 && r.shift["drums·rim"] === 0, r.shift);
  ok("his mixing board its own to start from", r.mixBefore["tuneA·melodica"].level === -7 && r.mixBefore.fx.room === 186, r.mixBefore);
  ok("one thing changed on it: the rest of his board kept", r.kept, r);
  ok("picked, it plays (the line says so)", /super-dub/.test(r.now), r.now);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
