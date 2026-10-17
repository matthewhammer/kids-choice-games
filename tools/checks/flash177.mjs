// (ticket 177) Blank frames while moving: the still pictures forced on (as
// on a slow computer: SPEED_TEST.still), the friend walked right and left
// with a fake controller and dragged with real mouse events, in five places,
// every frame Chrome draws recorded (CDP screencast) and checked: a frame is
// BLANK when most of the picture is the colour behind it (the scene hidden,
// its still pictures not painted). Runs on this branch's page and on main's
// beside it (/main/dress-up/ in CI); fails if this branch draws any blank
// frame.
//   node flash177.mjs <devtools port> <url>
import { inflateSync } from "node:zlib";
const [dport, url] = process.argv.slice(2);
const mainUrl = url.replace("/dress-up/", "/main/dress-up/");
const sleep = ms => new Promise(r => setTimeout(r, ms));

// (a PNG's pixels: 8-bit RGB or RGBA, not interlaced, as Chrome's screencast sends them)
function png(buf) {
  let p = 8, w = 0, h = 0, type = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), kind = buf.toString("latin1", p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (kind === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); type = d[9]; if (d[8] !== 8 || d[12] !== 0) throw new Error("png: not 8-bit, or interlaced"); }
    else if (kind === "IDAT") idat.push(d);
    else if (kind === "IEND") break;
    p += 12 + len;
  }
  const bpp = type === 6 ? 4 : type === 2 ? 3 : 0;
  if (!bpp) throw new Error("png: colour type " + type);
  const raw = inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[row + x - bpp] : 0, b = y ? out[row - stride + x] : 0, c = x >= bpp && y ? out[row - stride + x - bpp] : 0;
      const pr = (() => { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; })();
      out[row + x] = (src[x] + [0, a, b, (a + b) >> 1, pr][f]) & 255;
    }
  }
  return { w, h, bpp, px: out };
}

async function run(pageUrl) {
  const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let n = 0; const pending = new Map(), errs = [], frames = [];
  let rec = null;
  const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300));
    if (m.method === "Page.screencastFrame") { send("Page.screencastFrameAck", { sessionId: m.params.sessionId }); if (rec) rec.push({ data: m.params.data, meta: m.params.metadata }); } });
  const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
  const results = [];
  try {
    await send("Page.enable"); await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: pageUrl }); await sleep(4000);
    for (let i = 0; i < 40; i++) { if (await ev("typeof state") === "object") break; await sleep(250); }
    const version = await ev("VERSION.number");
    await ev(`(() => { window.__pad = { id: "Test Pad (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
      Object.defineProperty(navigator, "getGamepads", { value: () => [window.__pad], configurable: true });
      const e = new Event("gamepadconnected"); e.gamepad = window.__pad; window.dispatchEvent(e); return 1; })()`);
    // (the colour behind the picture: the nearest ancestor with a background of its own)
    const behind = await ev(`(() => { for (let el = document.getElementById("pic"); el; el = el.parentElement) { const c = getComputedStyle(el).backgroundColor; if (c && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(c)) return c; } return "rgb(255, 255, 255)"; })()`);
    const bg = behind.match(/\d+/g).map(Number).slice(0, 3);
    await send("Page.startScreencast", { format: "png", maxWidth: 640, maxHeight: 400, everyNthFrame: 1 });
    for (const kind of ["lake", "forest", "castle", "livingroom", "witch"]) {
      await ev(`state = Object.assign(clone(DEFAULTS), { controls: state.controls }); state.music.mute = true; state.background.kind = ${JSON.stringify(kind)}; state.background.figX = -150; SPEED_TEST.still = true; changed(); 1`);
      await sleep(1500);
      const r = JSON.parse(await ev(`JSON.stringify((r => ({ x: r.left, y: r.top, w: r.width, h: r.height }))(document.getElementById("pic").getBoundingClientRect()))`));
      rec = [];
      for (const b of [15, 14, 15]) { await ev(`__pad.buttons[${b}].pressed = true; 1`); await sleep(1300); await ev(`__pad.buttons.forEach(x => x.pressed = false); 1`); await sleep(200); }
      // (a drag of the friend: from their middle, right and back, a move every 16 ms)
      const f = JSON.parse(await ev(`JSON.stringify((b => ({ x: b.left + b.width / 2, y: b.top + b.height * 0.45 }))((figShown.find(n => n.getBoundingClientRect) || document.getElementById("pic")).getBoundingClientRect()))`));
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x: f.x, y: f.y, button: "left", clickCount: 1 });
      for (let i = 0; i <= 90; i++) { const dx = 160 * Math.sin(Math.PI * i / 90); await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: f.x + dx, y: f.y, button: "left" }); await sleep(16); }
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: f.x, y: f.y, button: "left", clickCount: 1 });
      await sleep(800);
      const got = rec; rec = null;
      // each frame: the share of the picture's pixels that are the colour behind it
      let blank = 0, worst = 0;
      for (const fr of got) {
        let im; try { im = png(Buffer.from(fr.data, "base64")); } catch (e) { continue; }
        const sx = im.w / fr.meta.deviceWidth, sy = im.h / fr.meta.deviceHeight;
        const x0 = Math.max(0, Math.round(r.x * sx)), x1 = Math.min(im.w, Math.round((r.x + r.w) * sx)), y0 = Math.max(0, Math.round((r.y - fr.meta.offsetTop) * sy)), y1 = Math.min(im.h, Math.round((r.y + r.h - fr.meta.offsetTop) * sy));
        let same = 0, all = 0;
        for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
          const i = (y * im.w + x) * im.bpp; all++;
          if (Math.abs(im.px[i] - bg[0]) + Math.abs(im.px[i + 1] - bg[1]) + Math.abs(im.px[i + 2] - bg[2]) < 30) same++;
        }
        const share = all ? same / all : 0;
        worst = Math.max(worst, share);
        if (share > 0.6) blank++;
      }
      results.push({ kind, frames: got.length, blank, worst: +worst.toFixed(2) });
    }
    await send("Page.stopScreencast");
    return { version, bg: behind, results, errs };
  } finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
}

let fails = 0;
try {
  const branch = await run(url);
  let main = null;
  try { main = await run(mainUrl); } catch (e) { console.log("main's page: not reachable here (" + String(e).slice(0, 80) + ")"); }
  for (const [label, R] of [["this branch", branch], ["main", main]]) {
    if (!R) continue;
    console.log(`${label}: ${R.version}, behind the picture ${R.bg}`);
    for (const x of R.results) console.log(`  ${x.kind.padEnd(11)} ${String(x.frames).padStart(4)} frames, ${x.blank} blank (the most of the picture blank in one frame: ${Math.round(100 * x.worst)}%)`);
    console.log(`  page errors: ${R.errs.length ? R.errs.slice(0, 3).join(" | ") : "none"}`);
  }
  const b = branch.results.reduce((s, x) => s + x.blank, 0), m = main ? main.results.reduce((s, x) => s + x.blank, 0) : null;
  if (b > 0) { fails++; console.log(`FAIL this branch drew ${b} blank frames${m !== null ? ` (main: ${m})` : ""}`); }
  else console.log(`ok   this branch drew no blank frame${m !== null ? ` (main: ${m}${m ? ", so the fix shows here" : ", so headless Chrome does not show it either way"})` : ""}`);
  if (branch.errs.length) { fails++; console.log("FAIL page errors on this branch"); }
} catch (e) { fails++; console.log("FAIL", String(e).slice(0, 400)); }
process.exit(fails ? 1 : 0);
