// (ticket 600, Matthew 2026-10-24: "Let's do a new Zine and manual report --- for the kids to understand the story-script language, with
// examples, and more coloring pages"; "why is the friend have stick arms? ... fix going forward") ^du_report(18)'s pictures, as
// tools/checks/manual593.mjs takes report 17's: dark scenes for the web, the same in 🖍️ lines only for paper, eight coloring pages
// (limbs kept their width, not sticks), and the guide printed to half-letter pages (out/storyguide/guide-half.pdf) for 017's zine.sh.
// Scenes: the 🎬 story box with an example; the friend acting (a say, a dance); a lever walked to and pulled in the trap room; 👥
// People with a 🚶 path box open; two people walking their paths; a story with a wrong line. Not a gate: exits 1 only if a scene failed.
//   node storyguide600.mjs <devtools port> <url>
import { writeFileSync, mkdirSync } from "node:fs";
const [dport, url] = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const page = await (await fetch(`http://127.0.0.1:${dport}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0; const pending = new Map(), errs = [];
const send = (method, params = {}) => new Promise(res => { const i = ++n; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
const ev = async x => { const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
const shot = async (name, sel) => {
  let clip = null;
  if (sel) { const j = await ev(`(() => { const n = document.querySelector(${JSON.stringify(sel)}); if (!n) return ""; const r = n.getBoundingClientRect(); return JSON.stringify({ x: scrollX + Math.max(0, r.left - 6), y: scrollY + Math.max(0, r.top - 6), width: Math.min(r.width + 12, innerWidth), height: Math.min(r.height + 12, innerHeight - Math.max(0, r.top - 6)) }); })()`);
 if (j) clip = { ...JSON.parse(j), scale: 1 }; }
  // (a crop is measured from the page's top, not the window's: a scrolled page cropped where nothing was, and 06 and 11 came out blank)
  const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip } : {}) });
  writeFileSync(`out/${shotDir}/${name}.png`, Buffer.from(r.result.data, "base64")); if (shotDir === "storyguide-light") pics[name + ".png"] = "data:image/png;base64," + r.result.data; console.log(`ok   ${name}.png${sel ? " (" + sel + ")" : ""}`);
};
let bad = 0, shotDir = "storyguide"; const texts = {};
const pics = {};   // (each light picture as a data URL, for the printed guide)
const step = async (what, f) => { try { await f(); } catch (e) { bad++; console.log(`FAIL ${what}: ${String(e).slice(0, 300)}`); } };
mkdirSync("out/storyguide", { recursive: true });
const W = `const w = ms => new Promise(r => setTimeout(r, ms));`;
const ROOM = `const B = state.background; for (const k of Object.keys(B)) if (/^castle(Lever|Boulder)[LR]_/.test(k)) delete B[k];
  Object.assign(B, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -230, figY: 150, things: [], castleLeverWire3N: "normal", castleLeverL_3N: true, castleLeverR_3N: true }); changed();`;
const FARM = `Object.assign(state.background, { kind: "farmyard", figX: -260, figY: 150, things: [] }); changed();`;
const EXAMPLE = "# a walk round the farm yard\nwalk 30 60\nface right\nsay Good morning, farm!\npose dance\nwait 2\npose stand\nwalk 75 40\nface front\nsay Time for a rest.\npose sit";
// (until the story has done line n, or it ended: storyRun.i counts the steps begun)
const UNTIL = n => `for (let i = 0; i < 200 && storyRun && storyRun.i < ${n}; i++) await w(100);`;
async function scenes() {
  await step("the story box", async () => {
    await ev(`(async () => { ${W} state = clone(DEFAULTS); state.music.mute = true; ${FARM} state.background.story = ${JSON.stringify(EXAMPLE)};
      tab = TABS.findIndex(t => t[1] === "background"); showTab(); await w(1200); const s = document.querySelector(".story"); if (s) s.scrollIntoView({ block: "center" }); await w(400); return 1; })()`);
    await shot("01-story-box", ".story");
  });
  await step("acting: a say", async () => {
    await ev(`(async () => { ${W} storyPlay(state.background.story); ${UNTIL(4)} await w(300); return 1; })()`);
    await shot("02-say");
  });
  await step("acting: a dance", async () => {
    await ev(`(async () => { ${W} ${UNTIL(5)} await w(500); return 1; })()`);
    await shot("03-dance", ".pic-box");
    await ev(`(async () => { ${W} ${UNTIL(99)} for (let i = 0; i < 100 && storyRun; i++) await w(100); await w(400); return 1; })()`);
    await shot("04-sit", ".pic-box");
  });
  await step("a lever", async () => {
    await ev(`(async () => { ${W} storyStop(); ${ROOM} await w(800); storyPlay("walk 25 55\nsay Which lever opens the pit?\npull L\nwait 1\nface front\nsay That one!"); ${UNTIL(5)} await w(2600); return 1; })()`);
    await shot("05-lever", ".pic-box");
    await ev(`(async () => { ${W} for (let i = 0; i < 60 && storyRun; i++) await w(100); await w(300); return 1; })()`);
    await shot("05b-lever-said");
  });
  await step("people with paths", async () => {
    texts.people = JSON.parse(await ev(`(async () => { ${W} storyStop(); state = clone(DEFAULTS); state.music.mute = true; worldsInit();
      const Wd = state.world, keys = Object.keys(Wd.cells || {}); const land = keys.find(k => /farmyard|pasture|clearing|house|woodpath/.test(Wd.cells[k].kind)) || keys[0];
      if (land) worldEnter(land); await w(1500);
      const cos = personCostumes(), a = cos[0] ? cos[0][0] : "ninja", b = cos[1] ? cos[1][0] : a;
      state.background.figX = -150; changed(); personNewCostume(a, cos[0] ? cos[0][1] : a); await w(300);
      state.background.figX = 150; changed(); personNewCostume(b, cos[1] ? cos[1][1] : b); await w(300);
      state.background.figX = 0; state.background.figY = 160; changed();
      const away = Object.values(state.peopleAway).filter(P => P.place);
      if (away[0]) away[0].path = "# back and forth\nwalk 15 40\nface front\nwait 1\nwalk 45 40";
      if (away[1]) away[1].path = "# a little dance, then a walk\npose dance\nwait 2\npose stand\nwalk 85 70\nwalk 60 70";
      changed(); await w(2500);
      return JSON.stringify({ place: state.background.kind, people: away.map(P => personTitle(P)), dressed: personTitle(state.person) }); })()`));
    await ev(`(async () => { ${W} tab = TABS.findIndex(t => t[1] === "person"); showTab(); await w(1000); const b = document.querySelector(".person-row .person-path"); if (b) b.click(); await w(500);
      const x = document.querySelector(".person-path-box"); if (x) x.scrollIntoView({ block: "center" }); await w(300); return 1; })()`);
    await shot("06-people-path", ".people");
    await ev(`(async () => { ${W} await w(1200); return 1; })()`);
    await shot("07-walkers", ".pic-box");
  });
  await step("a wrong line", async () => {
    texts.wrong = await ev(`(async () => { ${W} state = clone(DEFAULTS); state.music.mute = true; ${FARM} state.background.story = "walk 30 60\njump 5\nsay I never get here";
      tab = TABS.findIndex(t => t[1] === "background"); showTab(); await w(1000); storyPlay(state.background.story); for (let i = 0; i < 100 && storyRun; i++) await w(100); await w(300);
      const s = document.querySelector(".story"); if (s) s.scrollIntoView({ block: "center" }); await w(300); return (document.querySelector(".story-status") || {}).textContent || ""; })()`);
    await shot("08-wrong-line", ".story");
  });
}

const LINEART = `(() => { const src = document.getElementById("pic"), out = src.cloneNode(true), a = [...src.querySelectorAll("*")], b = [...out.querySelectorAll("*")];
  const SHAPES = new Set(["path", "rect", "circle", "ellipse", "polygon", "polyline", "line"]);
  a.forEach((n, i) => { const m = b[i]; if (!m) return; const tag = n.tagName.toLowerCase();
    if (["image", "foreignobject", "filter", "mask", "lineargradient", "radialgradient", "pattern", "clippath"].includes(tag)) { if (tag !== "clippath") m.remove(); return; }
    const cs = getComputedStyle(n); m.removeAttribute("filter"); m.removeAttribute("mask"); m.removeAttribute("class");
    const op = (+cs.opacity) * (+cs.fillOpacity || 1);
    if (SHAPES.has(tag)) {
      if (op < 0.35 && cs.stroke === "none") { m.remove(); return; }
      const filled = cs.fill !== "none", stroked = cs.stroke !== "none";
      // (Matthew, 2026-10-24: "why is the friend have stick arms?": a limb is a thick stroke; kept its width, white over a black outline)
      if (n.classList.contains("lw-in")) { m.setAttribute("style", "fill:none;stroke:#fff;stroke-width:" + cs.getPropertyValue("--lw") + ";stroke-linecap:round;stroke-linejoin:round"); return; }
      if (n.classList.contains("lw-out")) { m.setAttribute("style", "fill:none;stroke:#000;stroke-width:" + cs.getPropertyValue("--lwl") + ";stroke-linecap:round;stroke-linejoin:round"); return; }
      m.setAttribute("style", "fill:" + (filled ? "#fff" : "none") + ";stroke:#000;stroke-width:" + (stroked && !filled ? 1.4 : 1.1) + "px;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round");
    } else if (tag === "text" || tag === "tspan") m.setAttribute("style", "fill:#000;stroke:none;font-family:system-ui,sans-serif");
    else m.setAttribute("style", "");
  });
  // (the friend's page: the drawing cropped to the friend, the empty room behind left out, so the friend fills the page)
  if (window.__cropFriend) { const f = src.querySelector("#figure"), r = f.getBoundingClientRect(), s = src.getBoundingClientRect(), vb = src.viewBox.baseVal, k = vb.width / s.width;
    const x = vb.x + (r.left - s.left) * k, y = vb.y + (r.top - s.top) * k, w = r.width * k, h = r.height * k, m = 0.08 * Math.max(w, h);
    out.setAttribute("viewBox", [x - m, y - m, w + 2 * m, h + 2 * m].map(v => v.toFixed(1)).join(" ")); const bg = out.querySelector("#bg"); if (bg) bg.remove(); }
  out.removeAttribute("style"); out.setAttribute("xmlns", "http://www.w3.org/2000/svg"); out.removeAttribute("id");
  return new XMLSerializer().serializeToString(out); })()`;
const colorPages = [];
async function coloring() {
  const scenes = [
    ["the trap room", `Object.assign(state.background, { kind: "castleroom", castle: "N", castleRoom: 3, figX: -320, figY: 140, things: [] })`],
    ["the farm yard", `Object.assign(state.background, { kind: "farmyard", figX: -200, figY: 160, things: [] })`],
    ["the camp site", `Object.assign(state.background, { kind: "campsite", figX: -220, figY: 160, things: [] })`],
    ["the tree house", `Object.assign(state.background, { kind: "treehouse", figX: -240, figY: 160, things: [] })`],
    ["the jungle waterfall", `Object.assign(state.background, { kind: "waterfall", figX: -240, figY: 160, things: [] })`],
    ["the castle", `Object.assign(state.background, { kind: "castle", figX: -260, figY: 160, things: [] })`],
    ["your friend", `Object.assign(state.background, { kind: "emptyroom", figX: 0, figY: 120, things: [] }); strikePose("stand"); state.body.facing = "front"; window.__cropFriend = true`],
    ["your friend, dancing", `Object.assign(state.background, { kind: "emptyroom", figX: 0, figY: 120, things: [] }); strikePose("dance"); window.__cropFriend = true`],
  ];
  for (const [name, set] of scenes) await step("coloring: " + name, async () => {
    const svg = await ev(`(async () => { ${W} storyStop(); state = clone(DEFAULTS); state.music.mute = true; window.__cropFriend = false; ${set}; changed(); await w(1800); const out = ${LINEART}; window.__cropFriend = false; return out; })()`);
    const file = `color-${colorPages.length + 1}.svg`;
    writeFileSync(`out/storyguide/${file}`, svg); colorPages.push({ name, svg }); console.log(`ok   ${file} (${name}, ${Math.round(svg.length / 1024)} KB)`);
  });
}
// The guide for paper: print.html, its pictures the light ones taken just now, and the coloring pages at its end, printed by Chrome to
// half-letter pages, each numbered at its foot (out/storyguide/guide-half.pdf); drivers/zine.sh lays them out on Letter for folding
async function printGuide() {
  await step("the printed guide", async () => {
    const at = new URL("reports/018/print.html", url.replace(/#.*$/, "")).href;
    await send("Emulation.setEmulatedMedia", { media: "print", features: [{ name: "prefers-color-scheme", value: "light" }] });
    await send("Page.navigate", { url: at }); await sleep(3000);
    const n = await ev(`(async () => { const P = ${JSON.stringify(pics)}, C = ${JSON.stringify(colorPages)};
      for (const img of document.querySelectorAll("img")) { const f = (img.getAttribute("src") || "").split("/").pop().replace(/\.webp$/, ".png");   // (the web report's pictures are WebP)
        // ("and even have them use vector graphics?": the pit room as the game's own drawing, its lines, in place of its picture)
        if (P[f]) img.src = P[f]; }
      const end = document.createElement("section"); end.className = "coloring";
      end.innerHTML = C.map((c, i) => '<div class="color-page"><h2><span class="ch">★ ' + (i + 1) + '</span>COLOR ME: ' + c.name.toUpperCase() + '</h2><div class="color-art">' + c.svg + '</div><p class="color-note">From Messed Up Dress Up. Color it in however you like!</p></div>').join("");
      const st = document.createElement("style"); st.textContent = ".color-page { break-before: page; display: flex; flex-direction: column; height: 7.5in; } .color-art { flex: 1; display: flex; align-items: center; justify-content: center; } .color-art svg { width: 100%; height: auto; max-height: 6.4in; } .color-note { font: 8pt system-ui, sans-serif; text-align: center; margin: 4pt 0 0; } .coloring h2 { break-before: auto; } figure.shot .vector svg { display: block; width: 100%; height: auto; }";
      document.head.append(st); document.querySelector("main").append(end);
      await document.fonts.ready; await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
      return document.images.length; })()`);
    const r = await send("Page.printToPDF", { preferCSSPageSize: true, printBackground: false, displayHeaderFooter: true,
      headerTemplate: "<span></span>", footerTemplate: '<div style="width:100%;text-align:center;font:7px system-ui,sans-serif;color:#000"><span class="pageNumber"></span></div>' });
    writeFileSync("out/storyguide/guide-half.pdf", Buffer.from(r.result.data, "base64"));
    console.log(`ok   guide-half.pdf (${n} pictures, ${colorPages.length} coloring pages, ${Math.round(r.result.data.length * 0.75 / 1024)} KB)`);
  });
}
try {
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.bringToFront"); await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
  await send("Page.navigate", { url: url.replace(/#inspect$/, "") }); await sleep(5000);
  await ev(`(() => { try { themeSet("dark"); } catch (e) {} return 1; })()`);
  await scenes();
  writeFileSync("out/storyguide/texts.json", JSON.stringify(texts, null, 1));
  // ---- (Matthew 2026-10-24: "a low-toner, Black and White, PDF version of the manual ... like a zine") the same scenes in light mode, for
  // paper (out/manual-light/), then the coloring pages, then the guide printed to half-letter pages ----
  shotDir = "storyguide-light"; mkdirSync("out/storyguide-light", { recursive: true });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
  await send("Page.navigate", { url: url.replace(/#inspect$/, "") }); await sleep(5000);
  // (Matthew, 2026-10-24: "a special config setting ... where all CSS and SVG drawings have no filling", "then we can use real screenshots
  // from the game": the paper's pictures taken in 🖍️ lines only)
  await ev(`(() => { try { themeSet("light"); lineArtSet(true); } catch (e) {} return 1; })()`);
  await scenes();
  await coloring();
  await printGuide();
  console.log(`ok   texts (${Object.keys(texts).join(", ")}); page errors: ${errs.length}`);
} catch (e) { console.log("stopped:", String(e).slice(0, 400)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`).catch(() => {}); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
