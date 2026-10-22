// (ticket 521, Matthew: "re-Knolling (or Knowlling for the first time) -- the entire panel system of MUDU ... The prior effort
// created panels that leave a lot of "whitespace" between them in common zoom levels and screen sizes. Do an audit of that for the
// new report, and try to reduce that (before vs after)") ^du_report(16)'s instrument, and the check that keeps its fixes.
// Every tab's panel, in the side panel and full screen, at common screens and zoom levels, laid out by the game itself; for each:
//  - between boxes: over the panel's whole length, the share of its area covered by no box (each box widened by half the box gap,
//    so the 8 px gutters are not counted) and no loose control or text; the three largest empty rectangles, and the box above each;
//    a grid's columns and how many its first row uses (an empty column: auto-fill keeps it)
//  - inside boxes: the share of each box's content area covered by no control and no line of text (each widened by 3 px, half a
//    chip gap); labels on a line of their own above chips that would fit beside them; chip rows ending in one chip; rows of 12 or
//    more chips on 3 lines or more (the chip box's candidates, ticket 459)
//  - the screen: at the top of the scroll, the share of the window showing nothing (no box, control, text or drawing); the
//    picture's drawing against its element (letterbox, as the generic full screen's fitPic leaves it), and the empty column under
//    the game's card in full screen
//  - how many windows tall the tab is, and where the panel starts (the title and the 20 tabs above it)
// Zoom is emulated as the browser and the system do it: the window's CSS width and height divided by the zoom, the device scale
// factor the zoom (Emulation.setDeviceMetricsOverride), so media queries (760 px, 900 px), matchMedia, setSplit's 320 px and the
// container queries see what a zoomed browser sees. Not CSS zoom: innerWidth and the media queries would stay at 100%.
// The box is found by its look, not its class (a border on 3 sides or a tint of its own, holding a control or text), so the same
// measure reads 0.0.204 (^du_report(5)'s version), main and this branch alike.
//   node knoll521.mjs <devtools port> <url>                 (the check: 1366x768 and 1080p at 125% side, 1920x1080 full screen; its asserts)
//   FULL=1 OUT=<dir> [SHOTS=1] [ORDER=1|2|3] node knoll521.mjs <devtools port> <label>=<url> ...   (the report's whole matrix)
import { mkdirSync, writeFileSync } from "node:fs";
const [dport, ...args] = process.argv.slice(2);
const FULL = !!process.env.FULL, OUT = process.env.OUT || "out/checks/knoll521", SHOTS = !!process.env.SHOTS, ORDER = +(process.env.ORDER || 1);
// (a build may carry CSS to try a layout before it is code: label=url::css, as "main-min240=<main's url>:::root{--box-min:240px}")
let builds = FULL ? args.map(a => { const i = a.indexOf("="), [url, css] = a.slice(i + 1).split("::"); return { label: a.slice(0, i), url, css }; })
  : [{ label: "this", url: args[0].replace(/#.*/, "") }];   // (the check: this page alone, about 2 minutes; the report's runs compare)
// (FULL: main and the branch's head in every job, the pair the report compares; 0.0.204 in job 1; each commit between in one job of
// three, at the reference screens only, so a job takes about 45 minutes)
const REF_SCREENS = ["1366x768", "1920x1080@125", "1920x1080", "ipad-820x1180"];
if (FULL) { const last = builds[builds.length - 1].label;
  builds = builds.filter(b => b.label === "main" || b.label === last || (b.label === "v204" ? ORDER === 1 : /^c\d+$/.test(b.label) ? +b.label.slice(1) % 3 === ORDER % 3 : b.css ? ORDER === 1 : true));
  for (const b of builds) b.quick = (/^c\d+$/.test(b.label) && b.label !== last) || !!b.css; }
if (FULL && ORDER === 2) builds.reverse();
const sleep = ms => new Promise(r => setTimeout(r, ms));
// The screens: a window's CSS size at that zoom (its bars taken off: 120 px on a desktop, Safari's on a tablet or phone) for the
// side panel, and the whole screen for a designer's full screen (it asks the browser for the screen).
const SCREENS = [
  ["1280x800", 1280, 800, 1, 0], ["1366x768", 1366, 768, 1, 120], ["1366x768@125", 1366, 768, 1.25, 120],
  ["1440x900", 1440, 900, 1, 120], ["1440x900@125", 1440, 900, 1.25, 120],
  ["1920x1080", 1920, 1080, 1, 120], ["1920x1080@125", 1920, 1080, 1.25, 120], ["1920x1080@150", 1920, 1080, 1.5, 120],
  ["2560x1440@150", 2560, 1440, 1.5, 120], ["ipad-1180x820", 1180, 820, 1, 70], ["ipad-820x1180", 820, 1180, 1, 70], ["phone-390x844", 390, 844, 1, 180],
].map(([id, W, H, z, bars]) => ({ id, z, side: [Math.round(W / z), Math.round(H / z) - bars], full: [Math.round(W / z), Math.round(H / z) - (/ipad|phone/.test(id) ? bars : 0)] }));
const CI_SCREENS = { "1366x768": ["side"], "1920x1080@125": ["side"], "1920x1080": ["fs"] };
const SHOT_SCREENS = ["1366x768", "1920x1080", "1920x1080@125", "ipad-820x1180", "phone-390x844"];
// The places the 🏞️ Background tab is measured in besides the defaults: the fewest rows, the most, and the ones the audit named
const PLACES = [["forest"], ["castle", "state.background.castle = 'N';"], ["castleroom", "state.background.castle = 'N'; state.background.castleRoom = 1;"],
  ["bubbleroom"], ["livingroom"], ["treeroom"]];

const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result.result.value; };
let bad = 0;
const ok = (what, cond, got) => { console.log(`${cond ? "ok  " : "FAIL"} ${what}${cond ? "" : ": " + JSON.stringify(got).slice(0, 1200)}`); if (!cond) bad++; };

// ---- in the page: the panel as it is laid out now (a function, put into the page by its source: its regexes keep one backslash)
function measure(o) {
  const C = o.cell || 4, GAP = o.halfGap ?? 4, INK = o.inkPad ?? 3, R = e => e.getBoundingClientRect();
  const panel = document.getElementById("panel"); if (!panel) return { error: "no #panel" };
  window.scrollTo(0, 0); const side = document.querySelector(".side"); if (side) side.scrollTop = 0;
  const shown = e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden";
  const CTRL = "button, input, select, textarea, svg, img, canvas";
  const clear = c => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);
  const bgAt = e => { for (let p = e; p && p !== document.documentElement; p = p.parentElement) { const c = getComputedStyle(p).backgroundColor; if (!clear(c)) return c; } return "page"; };
  const VIEW = ".world-view, .tab-view, .bg-view";
  const isBox = e => {
    if (e === panel || e.matches(CTRL) || e.closest("button, svg, select") || e.closest(VIEW)) return false;
    const cs = getComputedStyle(e); if (cs.display === "contents" || cs.position === "fixed") return false;
    const r = R(e); if (r.width < 48 || r.height < 20) return false;
    const sides = ["Top", "Right", "Bottom", "Left"].filter(s => parseFloat(cs["border" + s + "Width"]) >= 1 && !/none|hidden/.test(cs["border" + s + "Style"]) && !clear(cs["border" + s + "Color"])).length;
    const tint = !clear(cs.backgroundColor) && cs.backgroundColor !== bgAt(e.parentElement);
    return (sides >= 3 || tint) && !!e.querySelector(CTRL + ", .name, .cap, .hint, .box-name, p, li, span");
  };
  const all = [...panel.querySelectorAll("*")].filter(shown), boxes = all.filter(isBox);
  const outer = boxes.filter(b => !boxes.some(a => a !== b && a.contains(b)));
  const nameOf = b => ((b.querySelector(":scope > .box-name, :scope > .cap, :scope > h3, :scope > .lbl .name") || b).textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
  const textRects = root => { const out = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), rg = document.createRange();
    for (let t; (t = tw.nextNode());) { if (!t.data.trim()) continue; const pe = t.parentElement;
      if (!pe || !shown(pe) || pe.closest("svg, button, select, textarea, script, style")) continue;
      rg.selectNodeContents(t); for (const r of rg.getClientRects()) if (r.width > 0 && r.height > 0) out.push(r); }
    return out; };
  const ctrlRects = root => [...root.querySelectorAll(CTRL)].filter(e => shown(e) && !(e.parentElement && e.parentElement.closest(CTRL))).map(R);
  const fs = document.body.classList.contains("designer-big");
  // the region: the panel's content box, its whole length; in a full screen with a game's card in a column of its own, the boxes' side
  const pr = R(panel), pcs = getComputedStyle(panel), px = k => parseFloat(pcs[k]) || 0;
  const reg = { x: pr.left + px("borderLeftWidth") + px("paddingLeft"), y: pr.top + px("borderTopWidth") + px("paddingTop") };
  reg.w = pr.width - px("borderLeftWidth") - px("borderRightWidth") - px("paddingLeft") - px("paddingRight");
  reg.h = pr.height - px("borderTopWidth") - px("borderBottomWidth") - px("paddingTop") - px("paddingBottom");
  const split = fs ? [...panel.querySelectorAll(".tab-split, .bg-split")].find(shown) : null;
  if (split) reg.w = Math.max(0, R(split).left - 8 - reg.x);
  const cols = Math.max(1, Math.ceil(reg.w / C)), rows = Math.max(1, Math.ceil(reg.h / C)), grid = new Uint8Array(cols * rows);
  const mark = (g, gc, gr, ox, oy, r, pad) => {
    const x0 = Math.max(0, Math.floor((r.left - pad - ox) / C)), x1 = Math.min(gc, Math.ceil((r.right + pad - ox) / C));
    const y0 = Math.max(0, Math.floor((r.top - pad - oy) / C)), y1 = Math.min(gr, Math.ceil((r.bottom + pad - oy) / C));
    if (x1 > x0) for (let y = y0; y < y1; y++) g.fill(1, y * gc + x0, y * gc + x1); };
  for (const b of outer) mark(grid, cols, rows, reg.x, reg.y, R(b), GAP);
  for (const v of [...panel.querySelectorAll(VIEW)].filter(shown)) mark(grid, cols, rows, reg.x, reg.y, R(v), GAP);
  const loose = [...textRects(panel), ...ctrlRects(panel)];
  for (const r of loose) mark(grid, cols, rows, reg.x, reg.y, r, INK);
  let empty = 0; for (let i = 0; i < grid.length; i++) if (!grid[i]) empty++;
  // the three largest empty rectangles (largest rectangle in a histogram, row by row), each taken out before the next
  const holes = [];
  for (let k = 0; k < 3; k++) {
    const h = new Int32Array(cols); let best = { a: 0 };
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) h[x] = grid[y * cols + x] ? 0 : h[x] + 1;
      const st = [];
      for (let x = 0; x <= cols; x++) { const cur = x < cols ? h[x] : 0; let start = x;
        while (st.length && st[st.length - 1][1] >= cur) { const [s, hh] = st.pop(), a = hh * (x - s); if (a > best.a) best = { a, x: s, y: y - hh + 1, w: x - s, h: hh }; start = s; }
        st.push([start, cur]); }
    }
    if (!best.a) break;
    const hr = { x: best.x * C, y: best.y * C, w: best.w * C, h: best.h * C };
    const above = outer.map(b => [b, R(b)]).filter(([, r]) => Math.abs(r.bottom - reg.y - hr.y) <= 12 && r.right - reg.x > hr.x && r.left - reg.x < hr.x + hr.w).map(([b]) => nameOf(b))[0] || "";
    holes.push({ ...hr, above });
    for (let y = best.y; y < best.y + best.h; y++) grid.fill(2, y * cols + best.x, y * cols + best.x + best.w);
  }
  // the least space between two boxes one above the other (0: their borders touch)
  let minGap = null; const rs = outer.map(R);
  for (const a of rs) for (const b of rs) if (a !== b && b.top >= a.bottom - 1 && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 20) { const g = Math.round(b.top - a.bottom); if (minGap === null || g < minGap) minGap = g; }
  // a grid's columns, and how many its first row uses; its columns no box reaches (an empty column), and the boxes across more than
  // one. Columns are the tracks wider than 0: auto-fit's folded tracks are still listed, as 0px, in gridTemplateColumns
  const grids = [...new Set(outer.map(b => b.parentElement))].filter(p => p && getComputedStyle(p).display === "grid").map(p => {
    const kids = [...p.children].filter(shown), top = Math.min(...kids.map(k => R(k).top)), gcs = getComputedStyle(p), kr = kids.map(R);
    const sizes = gcs.gridTemplateColumns.split(" ").map(parseFloat), gap = parseFloat(gcs.columnGap) || 0, spans = [];
    let x = R(p).left + (parseFloat(gcs.borderLeftWidth) || 0) + (parseFloat(gcs.paddingLeft) || 0);
    for (const sz of sizes) if (sz > 0) { spans.push([x, x + sz]); x += sz + gap; }   // (a folded track's gutters fold with it)
    const reach = r => spans.filter(([a, b]) => Math.min(r.right, b) - Math.max(r.left, a) > 1).length;
    // (packed, c5: the most room over a box beyond one row gap, between it and the lowest box above it in its columns, or the grid's
    // top; a grid in rows leaves a short box's hole over the box under it)
    const rowGap = parseFloat(gcs.rowGap) || 0, colGap = gap, ctop = R(p).top + (parseFloat(gcs.borderTopWidth) || 0) + (parseFloat(gcs.paddingTop) || 0);
    const slack = Math.round(Math.max(0, ...kr.map(r => { const over = kr.filter(o => o !== r && o.bottom <= r.top + 1 && Math.min(o.right, r.right) - Math.max(o.left, r.left) > 1);
      return over.length ? r.top - Math.max(...over.map(o => o.bottom)) - Math.max(rowGap, colGap) : r.top - ctop; })));
    const full = kr.filter(r => spans.length > 1 && reach(r) === spans.length).length;
    return { cls: (p.className || "").toString().slice(0, 40), tracks: spans.length, tracksListed: sizes.length, boxes: kids.length,
             emptyTracks: spans.filter(([a, b]) => !kr.some(r => Math.min(r.right, b) - Math.max(r.left, a) > 1)).length, across: kr.filter(r => reach(r) > 1).length,
             full, reachSum: kr.filter(r => !(spans.length > 1 && reach(r) === spans.length)).reduce((t, r) => t + reach(r), 0), slack,
             usedFirstRow: new Set(kids.filter(k => R(k).top < top + 2).map(k => Math.round(R(k).left))).size }; });
  // inside each box: what holds a control or a line of text
  let boxPx = 0, inkPx = 0;
  for (const b of outer) {
    const r = R(b), cs = getComputedStyle(b), q = k => parseFloat(cs[k]) || 0;
    const ib = { left: r.left + q("borderLeftWidth") + q("paddingLeft"), top: r.top + q("borderTopWidth") + q("paddingTop") };
    const w = r.right - q("borderRightWidth") - q("paddingRight") - ib.left, hh = r.bottom - q("borderBottomWidth") - q("paddingBottom") - ib.top;
    const gc = Math.max(1, Math.ceil(w / C)), gr = Math.max(1, Math.ceil(hh / C)), g = new Uint8Array(gc * gr);
    for (const t of [...textRects(b), ...ctrlRects(b)]) mark(g, gc, gr, ib.left, ib.top, t, INK);
    let on = 0; for (let i = 0; i < g.length; i++) if (g[i]) on++;
    boxPx += gc * gr * C * C; inkPx += on * C * C;
  }
  // chip rows: ending in one chip; 12 chips or more on 3 lines or more; a label above chips that would fit beside it
  let orphans = 0, tall = 0, tallPx = 0, labelLines = 0, labelPx = 0, labelFit = 0;
  for (const row of all.filter(e => e.matches(".row"))) {
    const kids = [...row.children].filter(c => c.matches("button") && shown(c)); if (kids.length < 2) continue;
    const lineOf = k => Math.round(R(k).top / 6), lines = [...new Set(kids.map(lineOf))], last = Math.max(...lines);
    if (lines.length >= 2 && kids.filter(k => lineOf(k) === last).length === 1) orphans++;
    if (lines.length >= 3 && kids.length >= 12) { tall++; tallPx += R(row).height; }
  }
  for (const c of all.filter(e => e.matches(".ctl"))) {
    const L = c.querySelector(":scope > .lbl"), row = c.querySelector(":scope > .row"); if (!L || !row || !shown(L) || !shown(row)) continue;
    const lr = R(L), rr = R(row); if (lr.bottom > rr.top + 2) continue;
    labelLines++; labelPx += rr.top - lr.top;
    const rg = document.createRange(); rg.selectNodeContents(L.querySelector(".name") || L);
    const kids = [...row.children].filter(shown), t0 = Math.min(...kids.map(k => R(k).top));
    const used = kids.filter(k => R(k).top < t0 + 4).reduce((s, k) => s + R(k).width + 6, 0);
    if (rg.getBoundingClientRect().width + 12 + used <= R(c).width) labelFit++;
  }
  // the screen at the top of the scroll: covered by a box, a control, a line of text, or the drawing (not its letterbox)
  const SC = 8, sw = Math.ceil(innerWidth / SC), sh = Math.ceil(innerHeight / SC), sg = new Uint8Array(sw * sh);
  for (const b of outer) mark(sg, sw, sh, 0, 0, R(b), GAP);
  for (const r of [...textRects(document.body), ...ctrlRects(document.body)]) mark(sg, sw, sh, 0, 0, r, INK);
  const pic = document.getElementById("pic"); let picture = null;
  if (pic && shown(pic)) { const pb = R(pic), vb = pic.viewBox.baseVal, ar = vb && vb.height ? vb.width / vb.height : 4 / 3;
    const iw = pb.width - 4, ih = pb.height - 4, dw = Math.min(iw, ih * ar), dh = dw / ar;
    picture = { w: Math.round(iw), h: Math.round(ih), drawnW: Math.round(dw), drawnH: Math.round(dh), letterbox: Math.round(iw * ih - dw * dh) };
    const cx = pb.left + 2 + (iw - dw) / 2, cy = pb.top + 2 + (ih - dh) / 2;
    // (the drawing: in the screen raster it is content, so clear the svg's own mark and mark the drawing alone)
    const sx0 = Math.max(0, Math.floor(pb.left / SC)), sx1 = Math.min(sw, Math.ceil(pb.right / SC));
    for (let y = Math.max(0, Math.floor(pb.top / SC)); y < Math.min(sh, Math.ceil(pb.bottom / SC)); y++) if (sx1 > sx0) sg.fill(0, y * sw + sx0, y * sw + sx1);
    mark(sg, sw, sh, 0, 0, { left: cx, right: cx + dw, top: cy, bottom: cy + dh }, 0); }
  let screenEmpty = 0; for (let i = 0; i < sg.length; i++) if (!sg[i]) screenEmpty++;
  const card = fs ? [...document.querySelectorAll(".tab-view, .bg-view")].find(shown) : null;
  const underCard = card ? Math.round(R(card).width * Math.max(0, innerHeight - R(card).bottom)) : null;
  // (the card the picture sits in, full screen: its width, and the height fitPic allows there: 60% of the window under the bar in the
  // world designer's; in the others the window below the card's top, less 16 px, and no less than that 60%)
  const slotEl = fs ? [...document.querySelectorAll(".tab-view-pic, .bg-view-pic, .world-view-pic")].find(e => shown(e) && e.contains(pic)) : null;
  const cap60 = (innerHeight - 56) * 0.6;
  const slot = slotEl ? { w: slotEl.clientWidth, top: Math.round(R(slotEl).top),
    capH: Math.round(slotEl.classList.contains("world-view-pic") ? cap60 : Math.max(cap60, innerHeight - R(slotEl).top - 16)) } : null;
  const tabs = document.getElementById("tabs"), tb = tabs && shown(tabs) ? [...tabs.children].filter(shown) : [];
  const scrollH = fs && side ? side.scrollHeight : document.documentElement.scrollHeight;
  return {
    w: innerWidth, h: innerHeight, dpr: devicePixelRatio, rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize), fs,
    region: { w: Math.round(reg.w), h: Math.round(reg.h) }, panelTop: Math.round(pr.top + scrollY), windows: +(scrollH / innerHeight).toFixed(2),
    between: { emptyPx: empty * C * C, share: +(empty / grid.length).toFixed(4), holes, grids, boxes: outer.length, names: outer.map(nameOf), minGap },
    access: panel.dataset.part === "access" ? [...panel.querySelectorAll(".accbox")].filter(shown).map(a => [a.classList.contains("on"), Math.round(R(a).width), Math.round(R(a).top)]) : undefined,
    inside: { boxPx, inkPx, share: boxPx ? +(1 - inkPx / boxPx).toFixed(4) : null, labelLines, labelPx: Math.round(labelPx), labelFit, orphans, tall, tallPx: Math.round(tallPx) },
    view: { share: +(screenEmpty / sg.length).toFixed(4), picture, underCard, slot },   // (the window at the top of the scroll)
    tabStrip: tb.length ? { h: Math.round(R(tabs).height), lines: new Set(tb.map(b => Math.round(R(b).top / 6))).size } : null,
    map: o.map ? outer.map(b => { const r = R(b); return [Math.round(r.left - reg.x), Math.round(r.top - reg.y), Math.round(r.width), Math.round(r.height), nameOf(b)]; }) : undefined,
  };
}

// ---- the instrument checked first, on a page whose answer is known: two boxes side by side, 296 px wide, 100 and 300 px tall, 8 px
// apart, in a 600 px panel: the hole under the short one is 300 x 196 px (its 4 px of half-gap off), 32.7% of 600 x 300
async function selfTest() {
  const html = `<!doctype html><body style="margin:0"><div id="panel" style="width:600px"><div style="display:grid;grid-template-columns:296px 296px;gap:8px;align-items:start">` +
    `<section style="height:100px;border:2px solid #888;box-sizing:border-box"><button>a</button></section>` +
    `<section style="height:300px;border:2px solid #888;box-sizing:border-box"><button>b</button></section></div></div></body>`;
  await send("Emulation.setDeviceMetricsOverride", { width: 1000, height: 800, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "data:text/html," + encodeURIComponent(html) }); await sleep(800);
  const m = await ev(`(${measure})({})`);
  ok("the instrument: a known hole (300 x 196 of 600 x 300 = 32.7%) read as such", Math.abs(m.between.share - 0.3267) < 0.01 && m.between.holes[0] && m.between.holes[0].w === 300 && m.between.holes[0].h === 196, m.between);
}

// ---- one build at one screen: the page loaded fresh (no saved split, no saved state: main and this branch share the origin)
async function load(url, [w, h], z, css) {
  const origin = new URL(url).origin;
  await send("Storage.clearDataForOrigin", { origin, storageTypes: "local_storage,indexeddb,cache_storage,service_workers" });
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: z, mobile: false });
  await send("Page.navigate", { url });
  for (let i = 0; i < 60; i++) { await sleep(250); try { if (await ev(`typeof state === "object" && typeof showTab === "function" && typeof TABS === "object"`)) break; } catch (e) { /* (loading) */ } }
  if (css) await ev(`document.head.append(Object.assign(document.createElement("style"), { textContent: ${JSON.stringify(css)} })); 1`);
  await ev(`document.fonts.ready.then(() => 1)`); await sleep(1200);
}
const BIG = `({ music: typeof setMusicBig === "function" ? setMusicBig : null, world: typeof setWorldBig === "function" ? setWorldBig : null,
  background: typeof setBgBig === "function" ? setBgBig : null })`;
async function caseAt(i, fs, setup, opts) {
  return JSON.parse(await ev(`(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    for (const [cls, f] of [["castle-big", "setCastleBig"], ["music-big", "setMusicBig"], ["world-big", "setWorldBig"], ["bg-big", "setBgBig"], ["tab-big", "setTabBig"]])
      if (document.body.classList.contains(cls) && typeof window[f] === "function") { try { window[f](false); } catch (e) { /* (the next showTab lays it out again) */ } }
    state = clone(DEFAULTS); state.music.mute = true; if (state.world) state.world.at = null; ${setup || ""} changed();
    tab = ${i}; showTab(); await w(300);
    let big = false;
    if (${fs}) { const part = TABS[${i}][1], B = ${BIG};
      const f = B[part] || (["music", "world", "background"].includes(part) ? null : (typeof setTabBig === "function" ? setTabBig : null));
      if (f) { f(true); big = true; ${opts.castle ? "if (typeof setCastleBig === 'function') setCastleBig(true);" : ""} await w(700); } }
    if (${fs} && !big) return JSON.stringify({ skip: "no full screen" });
    return JSON.stringify((${measure})(${JSON.stringify(opts)})); })()`));
}
async function shot(file, z) {
  const m = await ev(`[innerWidth, innerHeight]`);
  const s = await send("Page.captureScreenshot", { format: "webp", quality: 72, clip: { x: 0, y: 0, width: m[0], height: m[1], scale: 1 / z } });
  if (s.result) writeFileSync(file, Buffer.from(s.result.data, "base64"));
}

async function measureBuild(b, screens) {
  const out = { label: b.label, url: b.url, cases: [] };
  for (const S of screens) {
    for (const mode of FULL ? ["side", "fs"] : CI_SCREENS[S.id]) {
      await load(b.url, S[mode === "side" ? "side" : "full"], S.z, b.css);
      const tabs = await ev(`TABS.map(t => [t[0], t[1]])`), version = await ev(`typeof VERSION === "object" ? VERSION.number : "?"`);
      const list = tabs.map(([name, part], i) => ({ i, name, part, setup: "" }));
      const bg = tabs.findIndex(t => t[1] === "background"), acc = tabs.findIndex(t => /Inspection|Accessibility/.test(t[0]));
      for (const [kind, extra] of PLACES) list.push({ i: bg, name: tabs[bg][0] + " · " + kind, part: "background", setup: `state.background.kind = "${kind}"; ${extra || ""}` });
      if (acc >= 0) list.push({ i: acc, name: tabs[acc][0] + " · all on", part: "access",
        setup: "for (const k of Object.keys(state.access)) if (typeof state.access[k] === 'boolean') state.access[k] = true;" });
      if (mode === "fs") list.push({ i: bg, name: "🏰 castle designer", part: "background", setup: `state.background.kind = "castleroom"; state.background.castle = "N"; state.background.castleRoom = 1;`, castle: true });
      for (const c of list) {
        const m = await caseAt(c.i, mode === "fs", c.setup, { map: FULL, castle: !!c.castle });
        out.cases.push({ screen: S.id, zoom: S.z, mode, tab: c.name, part: c.part, version, ...m });
        if (SHOTS && !b.quick && SHOT_SCREENS.includes(S.id) && !m.skip) {
          mkdirSync(`${OUT}/shots/${b.label}`, { recursive: true });
          await shot(`${OUT}/shots/${b.label}/${S.id}-${mode}-${c.name.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "")}.webp`, S.z);
        }
        if (!m.skip) console.log(`${b.label.padEnd(6)} ${S.id.padEnd(15)} ${mode.padEnd(4)} ${c.name.slice(0, 34).padEnd(34)} between ${(100 * m.between.share).toFixed(1).padStart(5)}%  inside ${m.inside.share == null ? "  -  " : (100 * m.inside.share).toFixed(1).padStart(5) + "%"}  window ${(100 * m.view.share).toFixed(1).padStart(5)}%  ${String(m.windows).padStart(5)} windows` +
                                (m.rootPx !== 16 ? `  rootPx ${m.rootPx}!` : ""));
      }
    }
  }
  return out;
}

try {
  await send("Runtime.enable"); await send("Page.enable");
  await selfTest();
  mkdirSync(OUT, { recursive: true });
  const screens = SCREENS.filter(S => FULL || CI_SCREENS[S.id]);
  const results = [];
  for (const b of builds) {
    results.push(await measureBuild(b, b.quick ? screens.filter(S => REF_SCREENS.includes(S.id)) : screens));
  }
  writeFileSync(`${OUT}/${FULL ? "knoll521-" + ORDER : "knoll521"}.json`, JSON.stringify({ when: new Date().toISOString(), order: ORDER, screens: SCREENS, results }));
  const me = results[0], at = (scr, mode, tab) => me.cases.find(c => c.screen === scr && c.mode === mode && c.tab === tab);
  ok("every case laid out at 16 px to the rem (no text autosizing)", me.cases.filter(c => !c.skip).every(c => c.rootPx === 16), me.cases.filter(c => c.rootPx !== 16).map(c => [c.screen, c.tab, c.rootPx]));
  // (the asserts below come with the fixes that make them true, each in its fix's commit; on main they fail)
  if (!FULL) {
    // (c2, ticket 521: four bugs the audit found; each assert is its bug's case)
    const gen = me.cases.filter(c => c.mode === "fs" && !c.skip && !["music", "world", "background"].includes(c.part) && c.screen === "1920x1080");
    const fits = c => { const p = c.view.picture, s = c.view.slot; return !!(p && s && p.letterbox <= 0.02 * p.w * p.h && (p.drawnW >= s.w - 8 || p.drawnH >= s.capH - 8)); };
    ok("full screen, every generic designer: the picture sized to its card, as wide as the card or as tall as fitPic allows, no letterbox (fitPic knows .tab-view-pic)",
       gen.length > 0 && gen.every(fits), gen.filter(c => !fits(c)).map(c => [c.tab, c.view.picture, c.view.slot]));
    const bub = at("1366x768", "side", "🏞️ Background · bubbleroom");
    ok("the bubble room's settings in its own box, none in 🏰 the castles (BG_BOX tested a heading for 'room')",
       bub && !bub.between.names.includes("🏰 the castles") && bub.between.names.some(n => /bubble room/.test(n)), bub && bub.between.names);
    const acc = at("1366x768", "side", me.cases.find(c => /all on$/.test(c.tab)).tab), off = at("1920x1080", "fs", me.cases.find(c => c.part === "access" && !/all on$/.test(c.tab)).tab);
    ok("🔬 overlays: an open one the panel's width; switches off side by side in full screen (the 0.0.314 rules reach through .tab-content)",
       acc && acc.access.some(a => a[0]) && acc.access.filter(a => a[0]).every(a => a[1] >= 0.95 * acc.region.w) && off && new Set(off.access.map(a => a[2])).size < off.access.length, { acc: acc && acc.access, w: acc && acc.region.w, off: off && off.access });
    const bgs = at("1366x768", "side", "🏞️ Background · castle");
    ok("🏞️ Background's boxes apart in the side panel (a gap, as every tab's)", bgs && bgs.between.boxes >= 4 && bgs.between.minGap >= 6, bgs && { boxes: bgs.between.boxes, minGap: bgs.between.minGap });
    // (c3, ticket 521: no empty columns. auto-fit folds a column no box is in, and --n keeps a tab's boxes column to the boxes it shows)
    const fs1920 = me.cases.filter(c => c.mode === "fs" && !c.skip && c.screen === "1920x1080");
    // (a box across is in every column, so it hides an empty cell beside the others: the columns no more than the boxes not across,
    // unless every box is across)
    // (c5: a box over two columns of three, the 🫧 themes, is not across: the columns no more than the columns the boxes not across
    // reach)
    const emptyCol = g => g.emptyTracks > 0 || (g.boxes > g.full && g.tracks > g.reachSum);
    ok("full screen at 1920x1080: no grid has more columns than the boxes it shows that are not across (no column without a box, nor a cell beside a row's last box)",
       fs1920.length > 0 && fs1920.every(c => !c.between.grids.some(emptyCol)), fs1920.filter(c => c.between.grids.some(emptyCol)).map(c => [c.tab, c.between.grids.filter(emptyCol)]));
    const one = fs1920.filter(c => c.between.grids.some(g => /tabboxes/.test(g.cls) && g.boxes <= 2));
    const narrow = c => { const g = c.between.grids.find(x => /tabboxes/.test(x.cls)); return c.region.w <= g.boxes * (440 + 8) + 16; };
    ok("full screen at 1920x1080: a tab of one or two boxes leaves the rest to the game's card (its column no wider than its boxes at --box-max, 440 px)",
       one.length > 0 && one.every(narrow), one.filter(c => !narrow(c)).map(c => [c.tab, c.region.w, c.view.slot, c.between.grids.map(g => [g.tracks, g.boxes])]));
    // (c5, ticket 521: the boxes packed. Each box sits one gap under the lowest box above it in its columns (packBoxes' 4 px rows: at
    // most 4 px more), not at the top of a row as tall as the row's tallest box; in the side panel and full screen alike)
    const packed = me.cases.filter(c => !c.skip && c.between.grids.some(g => /tabboxes|bg-boxes/.test(g.cls) && g.tracks >= 2));
    const loose = c => c.between.grids.filter(g => /tabboxes|bg-boxes/.test(g.cls) && g.tracks >= 2 && g.slack > 4);
    ok("every grid of boxes of two columns or more packed: no box more than a gap and 4 px under the box above it (packBoxes)",
       packed.length > 0 && packed.every(c => !loose(c).length), packed.filter(c => loose(c).length).map(c => [c.screen, c.mode, c.tab, loose(c).map(g => [g.cls, g.tracks, g.boxes, g.slack])]));
    const ctl = at("1920x1080", "fs", me.cases.find(c => c.part === "controls")?.tab), cg = ctl && ctl.between.grids.find(g => /tabboxes/.test(g.cls));
    ok("full screen at 1920x1080: 🎮 Controls' 🫧 themes box two columns wide (the grid 864 px or wider), its groups side by side",
       !!cg && cg.tracks >= 3 && cg.across >= 1, ctl && { w: ctl.region.w, grids: ctl.between.grids });
  }
  ok("no page errors", !errs.length, errs);
} catch (e) { console.log("stopped:", String(e).slice(0, 300)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
