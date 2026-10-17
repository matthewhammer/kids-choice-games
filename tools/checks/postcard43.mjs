// (ticket 43) A postcard: postcardBlob makes one PNG, the picture in a
// card's border with a line written under it; without words, no band for
// them. Checks its size both ways, and that the save pop-up starts the
// words as the picture's own line. Exits 1 on a failure or page error.
//   node postcard43.mjs <devtools port> <url>
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
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(4000);
  const dims = async caption => JSON.parse(await ev(`(async () => { const b = await postcardBlob(${JSON.stringify(caption)}); const im = await createImageBitmap(b);
    const vb = document.getElementById("pic").viewBox.baseVal; return JSON.stringify({ w: im.width, h: im.height, picW: Math.round(vb.width * 1000 / vb.height), bytes: b.size }); })()`));
  await ev(`state.music.mute = true; state.background.kind = "lake"; changed(); 1`); await sleep(800);
  const a = await dims("Greetings from the duck pond!"), b = await dims("");
  say(a.w === a.picW + 96 && a.h === 1000 + 96 + 160, `with words: ${a.w} x ${a.h} (the picture ${a.picW} x 1000, a 48 border, a 160 band), ${a.bytes} bytes`);
  say(b.w === b.picW + 96 && b.h === 1000 + 96, `without words: ${b.w} x ${b.h}, no band`);
  const long = await dims("A very very long postcard message that goes on and on about the ducks and the pond and the castle beyond it");
  say(long.h === a.h, `a long message keeps the card's size (two lines, smaller): ${long.w} x ${long.h}`);
  const words = JSON.parse(await ev(`(() => { setSavePop(true); const t = document.getElementById("postcard-text").value, m = document.getElementById("mood").textContent; setSavePop(false); return JSON.stringify({ t, m }); })()`));
  say(words.t === words.m && words.t.length > 0, `the pop-up starts the words as the picture's own line: "${words.t}"`);
  if (errs.length) { fails++; console.log("FAIL page errors:", errs.slice(0, 3)); } else console.log("page errors: none");
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 300)); }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); process.exit(fails ? 1 : 0); }
