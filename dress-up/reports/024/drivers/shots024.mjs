// (ticket 661, Matthew 2026-11-01: "a new du_report in the style of du_report 23, now explaining all new features between that
// report and the current release") ^du_report(24)'s pictures, as packguide639.mjs takes report 23's: dark scenes for the web. Scenes:
// the garden (the cover); the 🗡️ sword held by a bush, swung (chop!), the bush gone and grown back, and 🙈 in 🏞️ Background (a tree cut);
// 🌗 night and day turned on in ⚙️ Advanced, noon, nightfall, the camp site's own night, lying down in bed, asleep, the next morning;
// 🌱 cut plants grow back (the setting); the place menu with the 🌻 garden and the 💧 spring, the garden, its six
// beds, the spring, wading in it, its frogs up close; the 🗺️ World design's places. Kept with the report (not in tools/checks, so not
// in every release's speed run): a diag branch copies it into tools/checks to run it. Not a gate: exits 1 only if a scene failed.
//   node shots024.mjs <devtools port> <url>      (writes out/guide024/)
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
const OUT = "out/guide024";
// a picture: the whole window, a selector's box, or (a JS expression) an element or a box of its own: {x, y, width, height} in the window
const shot = async (name, where) => {
  let clip = null;
  if (where) {
    const box = where.startsWith("(") ? where : `document.querySelector(${JSON.stringify(where)})`;
    const j = await ev(`(() => { const b = ${box}; if (!b) return ""; const r = b.getBoundingClientRect ? b.getBoundingClientRect() : b;
      const x = Math.max(0, r.x ?? r.left), y = Math.max(0, r.y ?? r.top);
      return JSON.stringify({ x: scrollX + x, y: scrollY + y, width: Math.min(innerWidth - x, r.width), height: Math.min(innerHeight - y, r.height) }); })()`);
    if (j) { const b = JSON.parse(j); clip = { ...b, scale: Math.min(3, Math.max(1.5, 900 / b.width)) }; }
  }
  const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip } : {}) });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, "base64")); console.log(`ok   ${name}.png${clip ? " (" + Math.round(clip.width) + "x" + Math.round(clip.height) + ")" : ""}`);
};
let bad = 0; const texts = {};
const step = async (what, f) => { try { await f(); } catch (e) { bad++; console.log(`FAIL ${what}: ${String(e).slice(0, 300)}`); } };
mkdirSync(OUT, { recursive: true });
const W = `const w = ms => new Promise(r => setTimeout(r, ms));`;
// the friend and what is round them (packguide639's NEAR): the figure's box grown by k each way, kept in the picture
const NEAR = (k = 1.6, up = 0.5) => `(() => { const T = figureT, H = (T.base || 300) * T.k, M = document.getElementById("pic").getScreenCTM(), p = document.getElementById("pic").getBoundingClientRect();
  const a = new DOMPoint(T.dx - 0.22 * H, T.sg + T.dy - H).matrixTransform(M), c = new DOMPoint(T.dx + 0.22 * H, T.sg + T.dy).matrixTransform(M);
  const f = { left: a.x, top: a.y, width: c.x - a.x, height: c.y - a.y };
  const w = f.width * (1 + 2 * ${k}), h = f.height * (1 + ${k} + ${up}); const x = Math.max(p.left, f.left - f.width * ${k}), y = Math.max(p.top, f.top - f.height * ${up});
  return { x, y, width: Math.min(w, p.right - x), height: Math.min(h, p.bottom - y) }; })()`;
const PIC = ".pic-box";
// a place of the kind, empty of things, the friend at x, y (y up from the front), facing f
const PLACE = (kind, x, y, f = "front", more = "") => `state.background = { ...state.background, kind: "${kind}", things: [], carrySeeded: false, plateSolved: false, potsGone: "", figX: ${x}, figY: ${y}, seat: null ${more} };
  state.body.facing = "${f}"; state.body.anim = "none"; strikePose("stand"); changed(); draw();`;
// a tab shown, and its control whose words match re, scrolled to the middle: the control's box (a .ctl, or the nearest box round it)
const TAB = key => `tab = TABS.findIndex(t => t[1] === "${key}"); showTab(); await w(900);`;
const CTL = re => `(() => { const all = [...document.querySelectorAll(".ctl")].filter(c => c.getBoundingClientRect().height > 0 && ${re}.test(c.textContent));
  const c = all.sort((a, b) => a.textContent.length - b.textContent.length)[0]; if (c) c.scrollIntoView({ block: "center" }); return c || null; })()`;
// the smallest panel (a section.box, a .chipset, a .ctl) whose words match re, scrolled to the middle
const BOX = re => `(() => { const all = [...document.querySelectorAll("section.box, .chipset, .ctl")].filter(c => { const r = c.getBoundingClientRect(); return r.height > 0 && ${re}.test(c.textContent); });
  const area = c => { const r = c.getBoundingClientRect(); return r.width * r.height; }; const c = all.sort((a, b) => area(a) - area(b))[0]; if (c) c.scrollIntoView({ block: "center" }); return c || null; })()`;
// the picture and the words the game says over it (Night is falling, Good morning)
const SAID = `document.querySelector(".pic-box"), [...document.querySelectorAll("*")].filter(n => n.childElementCount === 0 && /Night is falling|Good morning|still daytime/.test(n.textContent)).slice(-1)[0]`;
// the window's box round several boxes, with a margin
const UNION = list => `(() => { const rs = [${list}].filter(Boolean).map(n => n.getBoundingClientRect ? n.getBoundingClientRect() : n).filter(r => r.width && r.height); if (!rs.length) return null;
  const x0 = Math.min(...rs.map(r => r.left ?? r.x)) - 8, y0 = Math.min(...rs.map(r => r.top ?? r.y)) - 8, x1 = Math.max(...rs.map(r => r.right ?? r.x + r.width)) + 8, y1 = Math.max(...rs.map(r => r.bottom ?? r.y + r.height)) + 8;
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }; })()`;
const said = `(() => [...document.querySelectorAll("*")].filter(n => n.childElementCount === 0 && /Good morning|still daytime|Night is falling|somewhere to sleep|Sleep/.test(n.textContent)).map(n => n.textContent.trim()).slice(-1)[0] || "")()`;
async function scenes() {
  await step("the garden, the cover", async () => {
    texts.garden = await ev(`(async () => { ${W} state = clone(DEFAULTS); state.music.mute = true; state.world.at = null;
      ${PLACE("garden", 30, 30, "left")} state.background.things = [{ kind: "bee", x: -90, z: SCENE.ground - 95, seed: 301 }, { kind: "bee", x: 120, z: SCENE.ground - 30, seed: 302 }];
      changed(); draw(); await w(1800); return bgShown.objs.map(o => o.name); })()`);
    await shot("01-garden", PIC);
  });
  await step("the sword, held, a bush ahead", async () => {
    await ev(`(async () => { ${W} state.backpack = [{ id: "sword", got: Date.now(), from: "floor" }]; toolHold("sword"); state.regrow = { on: true, minutes: 2 };
      ${PLACE("garden", -110, 40, "right", ", cut: {}, cutWhen: {}, cutThings: {}")} state.background.things = [{ ...(THING_DEFAULTS.bush || {}), kind: "bush", x: 10, z: SCENE.ground + 40, seed: 7 }];
      changed(); draw(); await w(1500); return 1; })()`);
    await shot("02-sword-held", NEAR(1.8, 0.6));
  });
  await step("chop!", async () => {
    texts.chop = await ev(`(async () => { ${W} const s = toolUse(); await w(450); return s; })()`);
    await shot("03-chop", NEAR(1.8, 0.6));
  });
  await step("the bush gone", async () => {
    texts.cut = await ev(`(async () => { ${W} await w(1600); return { things: state.background.things.map(t => t.kind), kept: ((state.background.cutThings || {}).garden || []).length }; })()`);
    await shot("04-cut", NEAR(1.8, 0.6));
  });
  await step("🌱 the bush growing back", async () => {
    texts.regrow = await ev(`(async () => { ${W} for (const c of ((state.background.cutThings || {}).garden || [])) c.when.t -= 3 * 60000; await w(1150);
      return state.background.things.map(t => t.kind); })()`);
    await shot("13-regrow", NEAR(1.8, 0.6));
  });
  await step("🙈 in 🏞️ Background: grow it back by hand", async () => {
    texts.tree = await ev(`(async () => { ${W} ${PLACE("clearing", -230, "389 - SCENE.ground", "left", ", cut: {}, cutWhen: {}, cutThings: {}")} state.regrow.on = false; changed(); draw(); await w(1200);
      toolUse(); await w(1600); const cut = ((state.background.cut || {}).clearing || []).slice(); ${TAB("background")} return cut; })()`);
    await shot("05-grow-by-hand", BOX(/default background objects/));
  });
  await step("🌗 night and day, turned on", async () => {
    await ev(`(async () => { ${W} state.days = { on: true, dayMinutes: 12, nights: 0 }; state.regrow = { on: true, minutes: 2 };
      ${PLACE("clearing", 0, 0, "front", ", skyHour: 12, skyDay: 1, skyMonth: 11, skyYear: 2026, cut: {}, cutWhen: {}, cutThings: {}")} ${TAB("advanced")} return 1; })()`);
    await shot("06-days-on", UNION(`document.querySelector(".day-night-toggle"), [...document.querySelectorAll("*")].filter(n => n.childElementCount === 0 && /nights slept/.test(n.textContent))[0]`));
  });
  await step("noon", async () => {
    await ev(`(async () => { ${W} document.querySelector(".pic-box").scrollIntoView({ block: "center" }); await w(1500); return 1; })()`);
    await shot("07-noon", PIC);
  });
  await step("nightfall", async () => {
    texts.nightfall = await ev(`(async () => { ${W} state.background.skyHour = 21; changed(); await w(1800); return ${said}; })()`);
    await shot("08-nightfall", UNION(SAID));
  });
  await step("the camp site's own night", async () => {
    await ev(`(async () => { ${W} ${PLACE("campsite", -120, 20, "right", ", skyHour: 22")} await w(1800); return 1; })()`);
    await shot("09-campsite-night", PIC);
  });
  await step("into bed, asleep, the next morning", async () => {
    texts.bed = await ev(`(async () => { ${W} ${PLACE("hutbed", 0, 0, "front", ", skyHour: 22")} await w(1500);
      const bed = seatsHere(state.background).find(s => s.lie); if (!bed) return "no bed"; sitOn(bed); await w(900); return { pose: state.body.pose, said: ${said} }; })()`);
    await shot("10-asleep", PIC);
    texts.morning = await ev(`(async () => { ${W} await w(4200); return { hour: state.background.skyHour, nights: state.days.nights, said: ${said} }; })()`);
    await shot("11-morning", UNION(SAID));
    await ev(`(async () => { ${W} standUp(); await w(500); return 1; })()`);
  });
  await step("🌱 cut plants grow back: the setting", async () => {
    await ev(`(async () => { ${W} state.days.on = false; changed(); ${TAB("advanced")} const b = document.querySelector(".regrow-toggle"); if (b) b.scrollIntoView({ block: "center" }); await w(300); return 1; })()`);
    await shot("12-regrow-setting", UNION(`document.querySelector(".regrow-toggle"), document.querySelector(".regrow-more")`));
  });
  await step("the place menu: the 🌻 garden and the 💧 spring", async () => {
    await ev(`(async () => { ${W} ${PLACE("garden", 0, 0)} await w(600); ${TAB("background")} return 1; })()`);
    await shot("14-place-menu", BOX(/kind of place[\s\S]*🌻 garden/));
    await ev(`(async () => { ${W} ${PLACE("spring", 0, 0)} await w(600); ${TAB("background")} return 1; })()`);
    await shot("14-place-menu-water", BOX(/kind of place[\s\S]*💧 spring/));
  });
  await step("the garden, its six beds", async () => {
    await ev(`(async () => { ${W} state.backpack = []; toolHold(""); ${PLACE("garden", -150, 60, "right", ", gardenBeds: 6")} document.querySelector(".pic-box").scrollIntoView({ block: "center" }); await w(1600); return 1; })()`);
    await shot("15-garden-beds", PIC);
  });
  await step("the spring", async () => {
    texts.spring = await ev(`(async () => { ${W} ${PLACE("spring", -260, 30, "right", ", springFrogs: 3, springBubbles: 6")} await w(1700); return bgShown.objs.map(o => o.name); })()`);
    await shot("16-spring", PIC);
  });
  await step("wading in the spring", async () => {
    texts.wade = await ev(`(async () => { ${W} const P = springPool(stageC()); Object.assign(state.background, { figX: -40, figY: Math.round(P.cy - SCENE.ground) }); state.body.facing = "front"; changed(); draw(); await w(1400);
      return inWater(state.background, state.background.figX, SCENE.ground + state.background.figY); })()`);
    await shot("17-wading", NEAR(2, 0.6));
  });
  await step("the spring's frogs up close", async () => {
    await ev(`(async () => { ${W} Object.assign(state.background, { figX: -300, figY: 60 }); changed(); draw(); await w(1200); return 1; })()`);
    await shot("18-frogs", `(() => { const P = springPool(stageC()), M = document.getElementById("pic").getScreenCTM();
      const a = new DOMPoint(P.cx - P.rx * 1.2, P.cy - P.ry * 4.5).matrixTransform(M), c = new DOMPoint(P.cx + P.rx * 1.2, P.cy + P.ry * 2.6).matrixTransform(M);
      return { x: a.x, y: a.y, width: c.x - a.x, height: c.y - a.y }; })()`);
  });
  await step("🗺️ World design's places", async () => {
    await ev(`(async () => { ${W} ${TAB("world")} return 1; })()`);
    await shot("19-world-places", `(() => { const p = document.querySelector(".world-palette"); if (p) p.scrollIntoView({ block: "center" }); return p; })()`);
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
  texts.version = await ev(`VERSION.number`);
  writeFileSync(`${OUT}/texts.json`, JSON.stringify(texts, null, 1));
  console.log(`ok   texts (${JSON.stringify(texts).slice(0, 600)}); page errors: ${errs.length}`);
  for (const e of errs) console.log("     page error: " + e);
} catch (e) { console.log("stopped:", String(e).slice(0, 400)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`).catch(() => {}); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
