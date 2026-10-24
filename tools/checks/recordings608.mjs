// (ticket 608, N and M, through Matthew, 2026-10-24: "new 'recordings' chip, at top level for MUDU --- record from the microphone
// ... until the user presses stop", each recording a button with when it was made, its length, an emoji name, a colour, a wave
// picture and ✖ to remove it; "should be privacy-safe ... please double check") 🎙️ Recordings, with an oscillator's sound for the
// microphone (recTestStream: no microphone and no prompt here):
//   1. ⏺ then ⏹ makes one recording: its button shows its length and time, its wave drawn, the microphone let go;
//   2. its button plays it, and shows it playing; 🏷️ and 🎨 name it with an emoji and colour it, and both are kept after a reload;
//   3. ✖ asks once more, a second ✖ removes it, from the browser's storage too;
//   4. privacy: nothing sent while recording, playing, naming, colouring and removing (no request but a GET of the game's own
//      files; blob: and data: URLs never leave the page), and nothing of a recording in the friend's state (what 💾 saves);
//   5. no page errors, and the panel no wider than itself.
// Exits 1 on a failure.
//   node recordings608.mjs <devtools port> <url>
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0, watching = false; const pending = new Map(), errs = [], sent = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300));
  if (m.method === "Network.requestWillBeSent" && watching && !/^(blob|data):/.test(m.params.request.url)) sent.push([m.params.request.method, m.params.request.url]); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
// (as a press: the game's sound and its playing are allowed only after one)
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true, userGesture: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 900)}`); if (!cond) bad++; };
const TONE = `recTestStream = async () => { const ctx = new AudioContext(); await ctx.resume(); const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  o.frequency.value = 330; lfo.frequency.value = 1.5; lg.gain.value = 0.5; g.gain.value = 0.5; lfo.connect(lg); lg.connect(g.gain); o.connect(g);
  const d = ctx.createMediaStreamDestination(); g.connect(d); o.start(); lfo.start(); window.__tone = d.stream; return d.stream; };`;
const OPEN = `state.music.mute = true; changed(); tab = TABS.findIndex(t => t[1] === "recordings"); showTab(); await w(500);`;
try {
  await send("Runtime.enable"); await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  watching = true;
  const a = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); ${TONE} ${OPEN}
    for (const r of [...(await recLoad())]) await recRemove(r);
    const P = document.getElementById("panel"), rec = () => P.querySelector(".rec-record");
    const tabName = TABS[tab][0];
    rec().click(); await w(1600); const during = { text: rec().textContent, on: rec().classList.contains("on"), live: !P.querySelector(".rec-live").hidden };
    rec().click(); await w(900);
    const r = recList[0], play = P.querySelector(".rec-play");
    const out = { tab: tabName, during, count: recList.length, ms: r && r.ms, bytes: r && r.data.byteLength, peaks: r && r.peaks.length, peakMax: r && Math.max(...r.peaks),
      words: play && play.innerText.replace(/\\n/g, " "), micEnded: !!window.__tone && window.__tone.getTracks().every(t => t.readyState === "ended"), recNow: !!recNow,
      wavePainted: (() => { const c = P.querySelector(".rec-wave"); if (!c || !c.width) return false; const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) k++; return k; })() };
    play.click(); await w(500);
    out.playing = { pressed: P.querySelector(".rec-play").getAttribute("aria-pressed"), on: !!recPlaying && !recPlaying.a.paused, said: P.querySelector(".rec-said").textContent };
    P.querySelector(".rec-play").click(); await w(200); out.stopped = !recPlaying;
    P.querySelector(".rec-name").click(); await w(200);
    const box = document.querySelector(".person-pick"); out.kinds = box.querySelectorAll(".rec-emoji-kinds button").length;
    box.querySelector('.rec-emoji-kinds button[data-kind="2"]').click(); await w(100); box.querySelector('.rec-emoji-chip[data-emoji="🦄"]').click(); await w(200);
    P.querySelector(".rec-color").click(); await w(200); document.querySelector('.person-pick .rec-color-chip[data-color="#3b82f6"]').click(); await w(400);
    out.inState = /🦄|dress-up-recordings/.test(JSON.stringify(state)) || JSON.stringify(state).includes(recList[0].id);
    out.over = P.scrollWidth - P.clientWidth;
    return JSON.stringify(out); })()`));
  console.log("  " + JSON.stringify(a));
  ok("a 🎙️ Recordings tab", a.tab === "🎙️ Recordings", a.tab);
  ok("⏺ records: the button says ⏹ stop with the time, lit, the sound's wave beside it", /^⏹ stop\s+0:0[12]$/.test(a.during.text) && a.during.on && a.during.live, a.during);
  ok("⏹ keeps one recording, about 1.6 s, some bytes, its wave 120 slices", a.count === 1 && a.ms > 1200 && a.ms < 2600 && a.bytes > 1000 && a.peaks === 120 && a.peakMax === 1, a);
  ok("its button: the length and when it was made, its wave painted", /0:0[12]/.test(a.words) && /today/.test(a.words) && a.wavePainted > 50, a);
  ok("⏹ lets go of the microphone (every track ended)", a.micEnded && !a.recNow, a);
  ok("its button plays it, and stops it", a.playing.pressed === "true" && a.playing.on && !a.playing.said && a.stopped, a);
  ok("🏷️ the emoji by kind (9 kinds)", a.kinds === 9, a.kinds);
  ok("nothing of it in the friend's state (what 💾 saves)", !a.inState, a);
  ok("the panel no wider than itself", a.over <= 2, a.over);
  // (a reload: kept, with its name and colour, in this browser's storage)
  watching = false;
  await send("Page.reload", { ignoreCache: true }); await sleep(4000);
  watching = true;
  const b = JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); ${OPEN}
    const P = document.getElementById("panel"), out = { kept: recList.map(r => [r.emoji, r.color]), style: (P.querySelector(".rec-play") || { getAttribute: () => "" }).getAttribute("style") };
    P.querySelector(".rec-remove").click(); await w(150); out.once = [recList.length, P.querySelector(".rec-remove").textContent];
    P.querySelector(".rec-remove").click(); await w(400); out.twice = recList.length;
    out.stored = (await recTx("readonly", s => s.getAll())).length;
    return JSON.stringify(out); })()`));
  watching = false;
  console.log("  " + JSON.stringify(b));
  ok("after a reload: kept, named 🦄 and blue", JSON.stringify(b.kept) === JSON.stringify([["🦄", "#3b82f6"]]) && /background:#3b82f6/.test(b.style), b);
  ok("✖ asks once more, a second ✖ removes it, from the browser's storage too", b.once[0] === 1 && /remove\?/.test(b.once[1]) && b.twice === 0 && b.stored === 0, b);
  // (the game's own files may be fetched meanwhile, as at any time (its version, its speed): a GET of this site; nothing else)
  const here = new URL(url).origin, out = sent.filter(([m, u]) => m !== "GET" || new URL(u).origin !== here);
  console.log(`  requests while it ran: ${sent.length} (${sent.map(([m, u]) => m + " " + u.replace(here, "")).join(", ") || "none"})`);
  ok("nothing sent anywhere while recording, playing, naming, colouring and removing (no request but GETs of the game's own files)", !out.length, out);
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
