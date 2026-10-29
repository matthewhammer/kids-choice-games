// (ticket 639, Matthew 2026-10-29: "a du_report in the form of another young player's guide (with that retro style we used for two others)
// --- this one explains how to use the backpack"; "document how to pick up pots and swing tools in this manual too") ^du_report(23)'s
// pictures, as storyguide600.mjs takes report 18's: dark scenes for the web. Scenes: the backpack on the friend; the 🎒 tab; a shut chest
// glowing in reach, then opened; the backpack's cards; a thing put down, picked up; a pot lifted and thrown; the healer's things; the bug
// net held, swung, and a bee in a bottle; the plate puzzle set up and solved; the controller's new actions. Not a gate: exits 1 only if a
// scene failed.
//   node packguide639.mjs <devtools port> <url>
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
// a picture: the whole window, a selector's box, or (a JS expression) a box of its own: {x, y, width, height} in the window
const shot = async (name, where) => {
  let clip = null;
  if (where) {
    const box = where.startsWith("(") ? where : `document.querySelector(${JSON.stringify(where)})`;
    const j = await ev(`(() => { const b = ${box}; if (!b) return ""; const r = b.getBoundingClientRect ? b.getBoundingClientRect() : b;
      const x = Math.max(0, r.x ?? r.left), y = Math.max(0, r.y ?? r.top);
      return JSON.stringify({ x: scrollX + x, y: scrollY + y, width: Math.min(innerWidth - x, r.width), height: Math.min(innerHeight - y, r.height) }); })()`);
    if (j) clip = { ...JSON.parse(j), scale: 1 };
  }
  const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip } : {}) });
  writeFileSync(`out/packguide/${name}.png`, Buffer.from(r.result.data, "base64")); console.log(`ok   ${name}.png${clip ? " (" + Math.round(clip.width) + "x" + Math.round(clip.height) + ")" : ""}`);
};
let bad = 0; const texts = {};
const step = async (what, f) => { try { await f(); } catch (e) { bad++; console.log(`FAIL ${what}: ${String(e).slice(0, 300)}`); } };
mkdirSync("out/packguide", { recursive: true });
const W = `const w = ms => new Promise(r => setTimeout(r, ms));`;
// the friend and what is round them, in the window: the figure's box grown by k each way (a close-up of the picture), kept in the picture
// (from where the friend stands, figureT, mapped to the window: on GitHub's computers #figure may be drawn as a still, not an element)
const NEAR = (k = 1.6, up = 0.5) => `(() => { const T = figureT, H = (T.base || 300) * T.k, M = document.getElementById("pic").getScreenCTM(), p = document.getElementById("pic").getBoundingClientRect();
  const a = new DOMPoint(T.dx - 0.22 * H, T.sg + T.dy - H).matrixTransform(M), c = new DOMPoint(T.dx + 0.22 * H, T.sg + T.dy).matrixTransform(M);
  const f = { left: a.x, top: a.y, width: c.x - a.x, height: c.y - a.y };
  const w = f.width * (1 + 2 * ${k}), h = f.height * (1 + ${k} + ${up}); const x = Math.max(p.left, f.left - f.width * ${k}), y = Math.max(p.top, f.top - f.height * ${up});
  return { x, y, width: Math.min(w, p.right - x), height: Math.min(h, p.bottom - y) }; })()`;
const PIC = ".pic-box";
// a place of the kind, empty of things, the friend at x, y (y up from the front), facing f
const PLACE = (kind, x, y, f = "front", more = "") => `state.background = { ...state.background, kind: "${kind}", things: [], carrySeeded: false, plateSolved: false, potsGone: "", figX: ${x}, figY: ${y}, seat: null ${more} };
  state.body.facing = "${f}"; state.body.anim = "none"; strikePose("stand"); changed(); draw();`;
// the 🎒 tab's panel, from its first chip to the end of its list
// (its tab-content and tab-layout have no box of their own: the union of the tab's .ctl boxes, and the puzzle's row after them)
const PACKBOX = `(() => { const l = document.querySelector(".pack-list"), c = l && l.closest(".tab-content"); if (!c) return null;
  const rs = [...c.children].map(n => n.getBoundingClientRect()).filter(r => r.width && r.height); if (!rs.length) return null;
  const x0 = Math.min(...rs.map(r => r.left)) - 6, y0 = Math.min(...rs.map(r => r.top)) - 6, x1 = Math.max(...rs.map(r => r.right)) + 6, y1 = Math.max(...rs.map(r => r.bottom)) + 6;
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }; })()`;
async function scenes() {
  await step("the backpack on", async () => {
    await ev(`(async () => { ${W} state = clone(DEFAULTS); state.music.mute = true; state.pack = { drawn: true, tool: "" }; ${PLACE("treeroom", 0, 0, "away")} await w(1600); return 1; })()`);
    await shot("01-pack-on", NEAR(1.1, 0.25));
  });
  await step("the 🎒 tab", async () => {
    await ev(`(async () => { ${W} tab = TABS.findIndex(t => t[1] === "pack"); showTab(); await w(900); const l = document.querySelector(".pack-list"); if (l) l.scrollIntoView({ block: "center" }); await w(300); return 1; })()`);
    await shot("02-pack-tab", PACKBOX);
  });
  await step("a shut chest, glowing", async () => {
    await ev(`(async () => { ${W} ${PLACE("dungeon", -60, -60, "right")} state.background.things = [{ kind: "chest", x: 40, z: SCENE.ground - 60, open: false, treasure: "gold", gives: "crown", flourish: "chestfanfare", rec: "" }]; changed(); draw(); await w(1400); return 1; })()`);
    await shot("03-chest-shut", NEAR(1.4, 0.4));
  });
  await step("the chest opened", async () => {
    texts.chest = await ev(`(async () => { ${W} const ok = actionPress(); await w(1300); return ok; })()`);
    await shot("04-chest-open", NEAR(1.4, 0.9));
    await ev(`(async () => { ${W} await w(2600); return 1; })()`);
  });
  await step("the cards", async () => {
    await ev(`(async () => { ${W} state.backpack = [...state.backpack, { id: "potion", got: Date.now(), from: "floor", t: { kind: "potion", shape: "flask", color: POTION_COLORS[2] } }, { id: "chocolate", got: Date.now(), from: "floor" }];
      changed(); tab = TABS.findIndex(t => t[1] === "pack"); showTab(); await w(900); const l = document.querySelector(".pack-list"); if (l) l.scrollIntoView({ block: "center" }); await w(300); return 1; })()`);
    await shot("05-cards", PACKBOX);
  });
  await step("put down", async () => {
    texts.putDown = await ev(`(async () => { ${W} state.body.facing = "front"; changed(); draw(); const k = state.backpack.findIndex(x => x.id === "crown"); putDown(k); await w(900);
      return state.background.things.filter(t => t.kind === "item").map(t => t.id); })()`);
    await shot("06-put-down", NEAR(1.4, 0.4));
  });
  await step("pick up", async () => {
    texts.pickUp = await ev(`(async () => { ${W} const ok = actionPress(); await w(190); return ok; })()`);
    await shot("07-pick-up", NEAR(1.4, 0.5));
    await ev(`(async () => { ${W} await w(600); return 1; })()`);
  });
  await step("a pot lifted, and thrown", async () => {
    texts.pot = await ev(`(async () => { ${W} ${PLACE("dungeon", 0, 0, "front")} await w(1500);
      const g = bgShown.node && bgShown.node.querySelector('[data-obj^="pot "]'); if (!g) return "no pot";
      const bb = g.getBBox(); Object.assign(state.background, { figX: Math.round(bb.x + bb.width / 2), figY: Math.round(+g.dataset.z - SCENE.ground) + 30 }); changed(); draw(); await w(500);
      const ok = actionPress(); await w(500); return ok && !!carry; })()`);
    await shot("08-pot-held", NEAR(1.4, 0.6));
    await ev(`(async () => { ${W} state.body.facing = "front"; changed(); draw(); await w(200); potThrow(); await w(260); return 1; })()`);
    await shot("09-pot-thrown", NEAR(1.6, 0.6));
    await ev(`(async () => { ${W} await w(800); return 1; })()`);
  });
  await step("the healer's things", async () => {
    texts.healer = await ev(`(async () => { ${W} ${PLACE("healerroom", 150, -40, "right")} await w(1800); return state.background.things.map(t => t.kind + (t.id ? ":" + t.id : "")); })()`);
    await shot("10-healer", PIC);
  });
  await step("the net, held", async () => {
    await ev(`(async () => { ${W} state.backpack = [{ id: "net", got: Date.now(), from: "floor" }, { id: "bottle", got: Date.now(), from: "floor" }]; toolHold("net");
      ${PLACE("clearing", -40, -40, "right")} state.background.carrySeeded = true; state.background.things = [{ kind: "bee", x: 50, z: SCENE.ground - 60, seed: 4 }]; changed(); draw(); await w(1500); return 1; })()`);
    await shot("11-net-held", NEAR(1.5, 0.5));
  });
  await step("the net, swung", async () => {
    await ev(`(async () => { ${W} toolUse(); await w(170); return 1; })()`);
    await shot("12-net-swing", NEAR(1.5, 0.5));
  });
  await step("a bee in a bottle", async () => {
    texts.bee = await ev(`(async () => { ${W} await w(1100); return state.backpack.map(x => x.id); })()`);
    await shot("13-bee-bottle", NEAR(1.5, 1));
    await ev(`(async () => { ${W} await w(1800); return 1; })()`);
  });
  await step("the plate puzzle", async () => {
    await ev(`(async () => { ${W} state.backpack = []; ${PLACE("dungeon", 0, -100, "front")} await w(1200); plateSetUp(); await w(900); return 1; })()`);
    await shot("14-plates", PIC);
    texts.plates = await ev(`(async () => { ${W} const B = state.background;
      for (const c of B.things.filter(t => t.kind === "chest")) { B.figX = c.x; B.figY = c.z - SCENE.ground + 20; changed(); draw(); await w(200); actionPress(); await w(3100); }
      for (const p of B.things.filter(t => t.kind === "plate")) { const k = state.backpack.findIndex(x => x.id === p.wants);
        B.figX = p.x; B.figY = p.z - SCENE.ground - 34; state.body.facing = "front"; changed(); draw(); await w(200); putDown(k); await w(900); }
      B.figX = 0; B.figY = -60; state.body.facing = "front"; changed(); draw(); await w(1200); return { solved: !!B.plateSolved, egg: B.things.some(t => t.kind === "chest" && t.gives === "egg") }; })()`);
    await shot("15-plates-solved", PIC);
  });
  await step("the tree house's net", async () => {
    await ev(`(async () => { ${W} state.backpack = []; state.pack = { drawn: true, tool: "" }; ${PLACE("treeroom", -120, -50, "left")} await w(1800); return 1; })()`);
    await shot("17-tree-net", PIC);
  });
  // ---- (Matthew 2026-10-29: "a full walk through of the dungeon") the dungeon, from the cemetery's hole to the ladder out ----
  const DG = `const D = worldsAll().find(x => x.name === "dungeon"), W1 = worldById("w1"), gate = u => Object.keys(D.cells).find(k => (D.cells[k].things || []).some(t => t.uid === u));
    const pl = u => state.background.things.find(t => t.uid === u), stand = async (t, dz = -20) => { const B = state.background; B.figX = t.x; B.figY = t.z - SCENE.ground + dz; changed(); draw(); await w(500); };`;
  await step("the dungeon: its map", async () => {
    texts.maze = await ev(`(async () => { ${W} state = clone(DEFAULTS); state.music.mute = true; state.backpack = []; worldsInit(); ${DG}
      const cells = {}; for (const [k, c] of Object.entries(D.cells)) cells[k] = { N: !!c.crossN, E: !!c.crossE, S: !!c.crossS, W: !!c.crossW,
        things: (c.things || []).map(t => ({ kind: t.kind, id: t.id || t.gives || t.wants || t.style || "", uid: t.uid || "", opens: t.opens || "", sw: t.switch || "", hidden: !!t.hidden })) };
      return { cols: D.cols, rows: D.rows, start: D.start, cells }; })()`);
  });
  await step("the dungeon: the cemetery's hole", async () => {
    await ev(`(async () => { ${W} ${DG} const k = Object.keys(W1.cells).find(k => W1.cells[k].kind === "cemetery"); worldSwitch("w1", k); await w(400); worldEnter(k); await w(1800); return 1; })()`);
    await shot("18-cemetery-hole", PIC);
  });
  await step("the dungeon: the way in", async () => {
    await ev(`(async () => { ${W} ${DG} worldSwitch(D.id, D.start); await w(1800); return 1; })()`);
    await shot("19-dungeon-in", PIC);
  });
  await step("the dungeon: gate 1, a switch to step on", async () => {
    texts.g1 = await ev(`(async () => { ${W} ${DG} worldSwitch(D.id, gate("dg-g1")); await w(1500); const p = pl("dg-g1"); state.background.figX = 0; state.background.figY = 0; changed(); draw(); await w(300);
      await stand(p); await w(800); return { lit: !!p.lit, opens: p.opens }; })()`);
    await shot("20-gate-step", PIC);
  });
  await step("the dungeon: gate 2, a rock to keep it down", async () => {
    texts.g2 = await ev(`(async () => { ${W} ${DG} worldSwitch(D.id, gate("dg-g2")); await w(1500); const r = state.background.things.find(t => t.kind === "rock");
      await stand(r, -10); actionPress(); await w(700); await stand(pl("dg-g2")); actionPress(); await w(1100); const B = state.background; B.figX = 0; B.figY = 0; changed(); draw(); await w(900);
      return { lit: !!pl("dg-g2").lit, held: !!pl("dg-g2").held }; })()`);
    await shot("21-gate-rock", PIC);
  });
  await step("the dungeon: gate 3, the gems", async () => {
    texts.g3 = await ev(`(async () => { ${W} ${DG} const gk = Object.keys(D.cells).find(k => k !== "7,0" && (D.cells[k].things || []).some(t => t.kind === "chest" && t.gives === "gems"));
      worldSwitch(D.id, gk); await w(1500); const c = state.background.things.find(t => t.kind === "chest" && t.gives === "gems"); await stand(c, 25); actionPress(); await w(1200); return gk; })()`);
    await shot("22-gems", NEAR(1.5, 0.9));
    await ev(`(async () => { ${W} ${DG} await w(2200); worldSwitch(D.id, gate("dg-g3")); await w(1500); await stand(pl("dg-g3")); actionPress(); await w(1100); const B = state.background; B.figX = 0; B.figY = 0; changed(); draw(); await w(900); return 1; })()`);
    await shot("23-gate-gems", PIC);
  });
  await step("the dungeon: the treasure room", async () => {
    await ev(`(async () => { ${W} ${DG} worldSwitch(D.id, "7,0"); await w(1500); const B = state.background; B.figX = -60; B.figY = 0; changed(); draw(); await w(900); return 1; })()`);
    await shot("24-treasure", PIC);
    texts.out = await ev(`(async () => { ${W} ${DG} const p = state.background.things.find(t => t.kind === "plate"); await stand(p); await w(1200); return !state.background.things.find(t => t.kind === "passage").hidden; })()`);
    await shot("25-ladder", PIC);
  });
  await step("the dungeon: out to the castle", async () => {
    await ev(`(async () => { ${W} ${DG} const k = Object.keys(W1.cells).find(k => W1.cells[k].kind === "castle"); worldSwitch("w1", k); await w(400); worldEnter(k); await w(1800); return 1; })()`);
    await shot("26-castle-out", PIC);
  });
  await step("the controller's actions", async () => {
    await ev(`(async () => { ${W} tab = TABS.findIndex(t => t[1] === "controls"); showTab(); await w(900);
      const r = [...document.querySelectorAll("*")].find(n => n.children.length < 4 && /use the tool you hold/.test(n.textContent || "")); if (r) r.scrollIntoView({ block: "center" }); await w(300); return 1; })()`);
    await shot("16-controls");
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
  writeFileSync("out/packguide/texts.json", JSON.stringify(texts, null, 1));
  console.log(`ok   texts (${JSON.stringify(texts).slice(0, 400)}); page errors: ${errs.length}`);
  for (const e of errs) console.log("     page error: " + e);
} catch (e) { console.log("stopped:", String(e).slice(0, 400)); bad++; }
finally { await fetch(`http://127.0.0.1:${dport}/json/close/${page.id}`).catch(() => {}); }
console.log(bad ? `${bad} failed` : "all ok");
process.exit(bad ? 1 : 0);
