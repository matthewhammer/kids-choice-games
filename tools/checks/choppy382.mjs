// (ticket 382, ^du_report(12)'s next step 3: "the slow tier's first walk in the room ran at 5 to 12 frames a second before the game
// held the scenery still; find out sooner (from the first frames) that a computer is slow") The choppy finder (noteMoveFrame) fed made-up
// walks, frame gaps in ms: a walk at 10 and at 20 frames a second is found choppy within its first 15 frames; a fast walk is not, nor one
// with a late frame in five, nor one whose first three frames are long (a walk's start); a computer late one frame in three is still
// found, by the two windows of 60; short walks between pauses each start the count again. Exits 1 on a failure.
//   node choppy382.mjs <devtools port> <url>
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
    const keep = { choppy, entering }; entering = null;
    const run = gaps => { choppy = false; choppyRun = 0; moveFrames = moveLate = 0; walkFrames = walkLate = 0; moveFrameLast = 0; let t = 10000, at = null; noteMoveFrame(t);
      gaps.forEach((g, i) => { t += g; noteMoveFrame(t); if (choppy && at === null) at = i + 1; }); return { choppy, at }; };
    const out = { slow10: run(Array(40).fill(100)), slow20: run(Array(40).fill(50)), fast: run(Array(200).fill(16.7)),
      hiccups: run(Array.from({ length: 200 }, (_, i) => i % 5 === 0 ? 40 : 16.7)), warm: run([120, 90, 60, ...Array(80).fill(16.7)]),
      third: run(Array.from({ length: 200 }, (_, i) => i % 3 === 0 ? 33 : 16.7)), short: run([...Array(10).fill(100), 400, ...Array(10).fill(100)]) };
    choppy = keep.choppy; entering = keep.entering; moveFrames = moveLate = 0; walkFrames = walkLate = 0; return JSON.stringify(out); })()`));
  console.log("  " + JSON.stringify(r));
  ok("a walk at 10 frames a second: choppy within its first 15 frames", r.slow10.choppy && r.slow10.at <= 15, r.slow10);
  ok("a walk at 20 frames a second: choppy within its first 15 frames", r.slow20.choppy && r.slow20.at <= 15, r.slow20);
  ok("a fast walk (60 frames a second): never choppy", !r.fast.choppy, r.fast);
  ok("a fast walk with one frame in five late: not choppy", !r.hiccups.choppy, r.hiccups);
  ok("a fast walk whose first three frames are long: not choppy", !r.warm.choppy, r.warm);
  ok("a computer late one frame in three: still found, by the two windows of 60", r.third.choppy && r.third.at > 15, r.third);
  ok("two short slow walks (10 frames each) between pauses: not yet choppy (each starts the count again)", !r.short.choppy, r.short);
  ok("no error thrown", errs.length === 0, errs);
} catch (e) { ok("ran", false, String(e)); }
process.exit(bad ? 1 : 0);
