// ^du_report(15)'s pictures, every one drawn by its own code, none drawn by hand:
//  - mock/  : the two mock-ups (../mockups/dragon-fire.html, horse-armour.html, the files Matthew looked at), each page's own
//             script run under node with a stub page, and one picture drawn by its own scene(); the page's animations
//             (its CSS from the animated rules on) put inside the picture, so it moves as an <img> as it does on the page.
//  - game/  : the game at its release tag dress-up-0.0.392 (git archive of this repository), its 26 parts loaded as
//             tools/check_load.mjs loads them; the horse by horseSvg(), each fire by fireSvg() with its FIRE_DEFS, its mouth
//             and style.css's fi- animations (lines .fi-heat to fi-a-bubpop) put inside the picture.
//  - archive/: the picture archive's run of 0.0.392 (git tag run-2026-10-20 of ~/dress-up-pictures), copied as they are.
// Writes pictures/**, pictures/source.json and data/pictures.json (each picture: its file, what it shows, where it came
// from, its bytes, its shapes and how many of them are animated).
//   node drivers/pictures.mjs            (from 015/; set PICTURES=<archive checkout> if it is not ~/dress-up-pictures)
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path"; import os from "node:os";
import { execFileSync } from "node:child_process";
const HERE = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const REPO = execFileSync("git", ["-C", HERE, "rev-parse", "--show-toplevel"]).toString().trim();
const ARCH = process.env.PICTURES || path.join(os.homedir(), "dress-up-pictures");
const TAG = "dress-up-0.0.392", RUN = "run-2026-10-20";
const out = (rel, s) => { const f = path.join(HERE, "pictures", rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); return f; };
const LIST = [];
const count = s => ({ bytes: Buffer.byteLength(s), shapes: (s.match(/<(path|circle|ellipse|rect|polygon|polyline|line)\b/g) || []).length,
  animated: (s.match(/class="[^"]*\b(roar-|fb\b|fb-|tw|twp-|jet|brick|fbub|bub-|glow|heat|wing-|plume|fi-)[^"]*"/g) || []).length +
            (s.match(/<animate/g) || []).length });
const keep = (rel, s, what, from) => { out(rel, s); LIST.push({ file: "pictures/" + rel, what, from, ...count(s) }); };
const sized = (svg, vb, w) => { const [, , W, H] = vb.split(/[ ,]+/).map(Number); return svg.replace(/^<svg /, `<svg width="${w}" height="${Math.round(w * H / W)}" `); };

// ---- the mock-ups, by their own code ----
function mockup(file) {
  const src = fs.readFileSync(path.join(HERE, "mockups", file), "utf8");
  const script = src.slice(src.lastIndexOf("<script>") + 8, src.lastIndexOf("</script>"));
  const css = src.slice(src.indexOf("<style>") + 7, src.indexOf("</style>"));
  // (the page's inputs answer with their own default values, read from the page; anything else is a do-nothing stub)
  const defaults = Object.fromEntries([...src.matchAll(/<input type="color" id="(\w+)" value="(#[0-9a-f]{6})"/g)].map(m => [m[1], m[2]]));
  const el = id => ({ innerHTML: "", value: defaults[id] || "", checked: true, style: {}, classList: { toggle() {} }, addEventListener() {}, dataset: {},
    querySelector() { return null; }, querySelectorAll() { return []; }, scrollIntoView() {}, insertAdjacentHTML() {}, textContent: "", set onclick(f) {} });
  const els = {};
  const ctx = { document: { getElementById: id => (els[id] ||= el(id)), querySelectorAll: () => [], addEventListener() {}, body: { classList: { toggle() {} } } },
    localStorage: { getItem: () => null, setItem() {} }, requestAnimationFrame() {}, console, Math, JSON, String, Number, Object, Array };
  vm.createContext(ctx); vm.runInContext(script, ctx, { filename: file });
  // (its animations: the page's rules from the first animated one on, the layout rules before it left out)
  const anim = css.slice(css.search(/\/\* the fire|\.plume \{/));
  return { draw: expr => vm.runInContext(expr, ctx), anim };
}
const dragonPage = mockup("dragon-fire.html"), horsePage = mockup("horse-armour.html");
const withStyle = (svg, css) => svg.replace(/(<svg[^>]*>)/, `$1<style>${css}</style>`);
const STYLES = dragonPage.draw("STYLES.map(s => s.slice())"), HEAT = dragonPage.draw("JSON.parse(JSON.stringify(HEAT))");
for (const [k, name] of STYLES) {
  const vb = "-160 -236 690 345";
  const s = dragonPage.draw(`scene({ vb: [-160, -236, 690, 345], style: ${JSON.stringify(k)}, sky: "dusk", c: colours(), on: true, aria: ${JSON.stringify("The mock-up: the friend in the dragon costume breathing " + name.replace(/^\S+ /, ""))} })`);
  keep(`mock/fire-${k}.svg`, sized(withStyle(s, dragonPage.anim), vb, 690), `the mock-up's ${name}, as its card draws it (dusk, fire on, heat shown)`, "mockups/dragon-fire.html scene()");
}
{
  const vb = "-300 -262 1000 610";
  const s = dragonPage.draw(`scene({ vb: [-300, -262, 1000, 610], style: "roar", sky: "dusk", c: colours(), on: true, labels: true, showLabels: true, aria: "The mock-up: the friend in the dragon costume, its pieces named, breathing a roaring flame" })`);
  keep("mock/dragon-pieces.svg", sized(withStyle(s, dragonPage.anim), vb, 1000), "the mock-up's big picture: the costume with its pieces named, the roaring flame on", "mockups/dragon-fire.html scene()");
  // the card's thumbnail on the series index: the same drawing, nearer (the head, the flame and its heat)
  const tv = "-130 -232 560 330";
  const t = dragonPage.draw(`scene({ vb: [-130, -232, 560, 330], style: "roar", sky: "dusk", c: colours(), on: true, aria: "The friend in the dragon costume breathing a roaring flame" })`);
  keep("thumb.svg", sized(withStyle(t, dragonPage.anim), tv, 280), "the series index card's thumbnail: the mock-up's roaring flame, nearer", "mockups/dragon-fire.html scene()");
}
const SETS = horsePage.draw("SETS.map(s => s.slice())");
const SKY = '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe6f7"/><stop offset="1" stop-color="#eef6ea"/></linearGradient></defs>';
const HVB = "-240 -540 590 560";
const ground = s => s.replace(/(<svg[^>]*>(?:<style>[\s\S]*?<\/style>)?)/, `$1${SKY}<rect x="-240" y="-540" width="590" height="560" fill="url(#sky)"/>`);
const gameKey = k => k === "lego" ? "toy" : k;   // (the game calls the mock-up's "lego" set "toy")
for (const [k, name] of SETS) {
  const s = horsePage.draw(`scene(${JSON.stringify(k)}, K(), COATS[0], ${JSON.stringify(HVB)})`);
  keep(`mock/horse-${gameKey(k)}.svg`, sized(ground(withStyle(s, horsePage.anim)), HVB, 590), `the mock-up's ${name}, as its card draws it (white coat, the arms quartered blue and white with a falcon)`, "mockups/horse-armour.html scene()");
}

// ---- the game at 0.0.392 ----
const G = fs.mkdtempSync(path.join(os.tmpdir(), "du15-"));
execFileSync("bash", ["-c", `git -C "${REPO}" archive ${TAG} dress-up/index.html dress-up/js dress-up/style.css | tar -x -C "${G}"`]);
const page = path.join(G, "dress-up", "index.html"), html = fs.readFileSync(page, "utf8");
const parts = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]).filter(p => !/^https?:/.test(p));
const stub = () => { const f = function () { return P; }; const P = new Proxy(f, {
  get: (t, k) => k === Symbol.toPrimitive ? (() => 0) : k === "length" ? 0 : k === Symbol.iterator ? function* () {} : k === "then" ? undefined : P,
  set: () => true, apply: () => P, construct: () => P, has: () => true }); return P; };
const S = stub();
const gctx = { console, Math, JSON, Date, Array, Object, String, Number, Boolean, Map, Set, WeakMap, Promise, RegExp, Error, Symbol, Proxy, Reflect, Intl,
  parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, structuredClone, setTimeout: () => 0, clearTimeout: () => 0, setInterval: () => 0,
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => 0, performance: { now: () => 0 }, document: S, navigator: S, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: S, history: S, matchMedia: () => ({ matches: false, addEventListener() {} }), getComputedStyle: () => S, fetch: () => new Promise(() => {}), Image: function () { return S; },
  DOMPoint: function () { return S; }, AudioContext: function () { return S; }, ResizeObserver: function () { return S; }, MutationObserver: function () { return S; }, CSS: S, screen: S, devicePixelRatio: 1 };
Object.assign(gctx, { addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true, innerWidth: 1600, innerHeight: 1000 });
gctx.window = gctx; gctx.globalThis = gctx; gctx.self = gctx;
vm.createContext(gctx);
vm.runInContext(parts.map(p => fs.readFileSync(path.join(G, "dress-up", p), "utf8")).join("\n;\n"), gctx, { filename: "dress-up-0.0.392.js" });
const game = expr => vm.runInContext(expr, gctx);
const version = game("typeof VERSION !== 'undefined' ? VERSION : ''");
// the horse side on, standing, ridden, in each set, in the mock-up's own arms and coat (a knight's horse)
const ARMS = '{ knightA: "#2f6db5", knightB: "#f4f1ea", tabardLayout: "quartered", emblem: "falcon" }';
for (const [k, name] of game("HORSE_ARMOURS.map(a => a.slice())").filter(([k]) => k !== "none")) {
  let s = game(`horseSvg("side", "stand", 0, { coat: "#f3efe6", mane: "#c0c0c0", tack: "#7a3a1a", armour: ${JSON.stringify(k)}, arms: ${ARMS} }, 0, true)`);
  if (typeof s !== "string") s = s.svg || s.s;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${HVB}" role="img" aria-label="The game at 0.0.392: the horse in ${name.replace(/^\S+ /, "")}, side on, ridden">${SKY}<rect x="-240" y="-540" width="590" height="560" fill="url(#sky)"/>${s}</svg>`;
  keep(`game/horse-${k}-side.svg`, sized(svg, HVB, 590), `the game's ${name}: horseSvg("side", "stand", …, ridden) at 0.0.392, in the mock-up's arms and coat`, `${TAG}: dress-up/js/08-body.js horseSvg()`);
}
// each fire, in each of its three drawings, with its heat, from the mouth, on the mock-up's dusk sky
const css = fs.readFileSync(path.join(G, "dress-up", "style.css"), "utf8");
const fcss = css.slice(css.indexOf(".fi-heat {"), css.indexOf("\n", css.indexOf("@keyframes fi-a-bubpop")) + 1);
// (only the rules a picture uses: a class it carries, and the keyframes those rules name)
const BLOCKS = []; { let d = 0, s = 0; const c = fcss.replace(/\/\*[\s\S]*?\*\//g, "");
  for (let i = 0; i < c.length; i++) { if (c[i] === "{") d++; else if (c[i] === "}" && --d === 0) { BLOCKS.push(c.slice(s, i + 1).trim()); s = i + 1; } } }
const cssFor = svg => { const used = new Set([...svg.matchAll(/class="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/)));
  const rules = BLOCKS.filter(b => !b.startsWith("@keyframes") && [...b.slice(0, b.indexOf("{")).matchAll(/\.([\w-]+)/g)].some(m => used.has(m[1])));
  const names = new Set(rules.flatMap(r => [...r.matchAll(/animation:\s*([\w-]+)/g)].map(m => m[1])));
  return rules.concat(BLOCKS.filter(b => names.has((b.match(/^@keyframes\s+([\w-]+)/) || [])[1]))).join("\n"); };
const DUSK = '<linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2547"/><stop offset="0.6" stop-color="#3b3560"/><stop offset="1" stop-color="#7a5560"/></linearGradient>';
const FVB = { side: "-60 -130 760 370", front: "-260 -260 520 520", away: "-230 -440 460 500" };
const VIEWS = { side: "side on", front: "toward us", away: "away from us" };
for (const [st, name] of game("FIRE_STYLES.map(a => a.slice())")) for (const view of ["side", "front", "away"]) {
  const vb = FVB[view], [x, y, w, h] = vb.split(" ").map(Number);
  const mouth = game(`fireMouth(${JSON.stringify(view)}, 1)`), fire = game(`fireSvg(${JSON.stringify(st)}, ${JSON.stringify(view)}, true)`);
  const way = view === "side" ? ' transform="rotate(6)"' : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="The game at 0.0.392: ${name.replace(/^\S+ /, "")}, ${VIEWS[view]}"><style>${cssFor(fire)}</style>` +
    `<defs>${game("FIRE_DEFS")}${DUSK}</defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#dusk)"/>` +
    `<g><g${way}>${view === "front" ? mouth : ""}<g>${fire}</g>${view === "side" ? mouth : ""}</g></g></svg>`;
  keep(`game/fire-${st}-${view}.svg`, sized(svg, vb, w), `the game's ${name}, ${VIEWS[view]}: fireSvg() at 0.0.392 with its heat and mouth (no friend), on the mock-up's dusk`, `${TAG}: dress-up/js/08-body.js fireSvg(), dress-up/style.css .fi-*`);
  const flames = count(game(`fireSvg(${JSON.stringify(st)}, ${JSON.stringify(view)}, false)`));   // (the fire alone: no heat, mouth or ground)
  Object.assign(LIST[LIST.length - 1], { fire: st, view, fire_shapes: flames.shapes, fire_animated: flames.animated });
}
fs.rmSync(G, { recursive: true, force: true });

// ---- the picture archive's run of 0.0.392, as it is ----
const ARCHIVED = [["costume/kind--dragon", "the dragon costume, facing us, its wings flapping (SMIL)"], ["costume/dragonWingsHow--open", "its wings open and still"],
  ["costume/dragonWingsHow--folded", "its wings folded"], ...["plate", "half", "tourney", "dragon", "toy", "parade"].map(k => [`body/horseArmour--${k}`, `the horse in ${k}, facing us, led (the friend not a knight: the halter's colours)`])];
for (const [p, what] of ARCHIVED) {
  const s = execFileSync("git", ["-C", ARCH, "show", `${RUN}:pictures/${p}.svg`]).toString();
  keep(`archive/${path.basename(p)}.svg`, s, what, `${RUN}:pictures/${p}.svg`);
}
const src = JSON.parse(execFileSync("git", ["-C", ARCH, "show", `${RUN}:pictures/source.json`]).toString());
out("source.json", JSON.stringify({
  mock: { from: ["mockups/dragon-fire.html", "mockups/horse-armour.html"], how: "each page's own script under node (drivers/pictures.mjs), its scene() drawing one picture, its animation CSS inside" },
  game: { tag: TAG, commit: execFileSync("git", ["-C", REPO, "rev-parse", TAG + "^{commit}"]).toString().trim(), version: version || "0.0.392", how: "the game's parts under node, horseSvg() and fireSvg()" },
  archive: { tag: RUN, ...src },
}, null, 1) + "\n");
fs.mkdirSync(path.join(HERE, "data"), { recursive: true });
fs.writeFileSync(path.join(HERE, "data", "pictures.json"), JSON.stringify({ about: "every picture in pictures/: its file, what it shows, where it came from, its size in bytes, its shapes (path, circle, ellipse, rect, polygon, polyline, line) and how many carry an animation (an animated class or a SMIL <animate>)", made_by: "drivers/pictures.mjs", heat_mockup: HEAT, pictures: LIST }, null, 1) + "\n");
console.log("wrote", LIST.length, "pictures,", LIST.reduce((a, p) => a + p.bytes, 0), "bytes");
