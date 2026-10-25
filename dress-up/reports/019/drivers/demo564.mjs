// ^du_report(19)'s pictures: A DEMONSTRATION, NOT THE GAME. The game's parts run in node (as tools/same_friend.mjs runs
// them), and this script calls the re-organised gem (gemSvg, gemSideSvg, js/02-helpers.js, ticket 564) beside drawings
// the game already has (crownSvg, throneSvg, seaChestSvg, swordSvg, shieldSvg), to show what Matthew's three scenarios
// would look like. Nothing here is in the game: the game's crown, throne, chest, sword and shield are unchanged. It also
// catches the friend as the game draws them (the ninja, with its gem) for the report's first picture.
//   node drivers/demo564.mjs <branch>/dress-up/index.html <out dir>
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path";
const [page, outDir] = process.argv.slice(2);
const base = path.dirname(page), html = fs.readFileSync(page, "utf8");
const parts = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]).filter(p => !/^https?:/.test(p));
const stub = () => { const f = function () { return P; }; const P = new Proxy(f, {
  get: (t, k) => k === Symbol.toPrimitive ? (() => 0) : k === "length" ? 0 : k === Symbol.iterator ? function* () {} : k === "then" ? undefined : P,
  set: () => true, apply: () => P, construct: () => P, has: () => true }); return P; };
const S = stub(), box = { caught: null };
const doc = new Proxy(S, { get: (t, k) => k === "createElementNS" ? ((ns, tag) => tag === "svg" ? new Proxy(S, {
  set: (o, kk, v) => { if (kk === "innerHTML") box.caught = v; return true; }, get: (o, kk) => kk === "childNodes" ? [] : kk === "firstChild" ? null : S[kk] }) : S) : S[k] });
const ctx = { console: Object.fromEntries(Object.keys(console).map(k => [k, () => {}])), Math, JSON, Date, Array, Object, String, Number, Boolean, Map, Set, WeakMap, WeakSet, Promise, RegExp, Error, TypeError, Symbol, Proxy, Reflect, Intl,
  parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, structuredClone, setTimeout: () => 0, clearTimeout: () => 0, setInterval: () => 0, clearInterval: () => 0,
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => 0, requestIdleCallback: () => 0, performance: { now: () => 0 }, document: doc, navigator: S, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: S, history: S, matchMedia: () => ({ matches: false, addEventListener() {} }), getComputedStyle: () => S, fetch: () => new Promise(() => {}), Image: function () { return S; },
  DOMPoint: function () { return S; }, AudioContext: function () { return S; }, ResizeObserver: function () { return S; }, MutationObserver: function () { return S; }, CSS: S, screen: S, devicePixelRatio: 1 };
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx; ctx.addEventListener = () => {}; ctx.removeEventListener = () => {}; ctx.dispatchEvent = () => true; ctx.innerWidth = 1600; ctx.innerHeight = 1000;
vm.createContext(ctx);
vm.runInContext(parts.map(p => fs.readFileSync(path.join(base, p), "utf8")).join("\n;\n"), ctx, { filename: page });
const run = src => vm.runInContext(src, ctx);
fs.mkdirSync(outDir, { recursive: true });
// each picture a whole SVG file, its own background, so it shows the same in a light page and a dark one
const svgFile = (name, vb, w, h, inner, bg = "#f4efe3") => {
  const [x, y, W, H] = vb;
  fs.writeFileSync(path.join(outDir, name), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}" width="${w}" height="${h}">` +
    `<rect x="${x}" y="${y}" width="${W}" height="${H}" fill="${bg}"/>${inner}</svg>\n`);
  console.log("wrote", name);
};
const label = (x, y, t, size = 11) => `<text x="${x}" y="${y}" font-family="system-ui, sans-serif" font-size="${size}" fill="#5b6470" text-anchor="middle">${t}</text>`;

// 1. THE CROWN: the king's crown as the game draws it (its three diamond jewels, crownSvg), and the same crown with the
// shared gem over each jewel and on each point (a demonstration)
const crown = run(`crownSvg({ crownJewel: "#d2382b" }, true, "#7a1f2b", false)`);
const crownGems = run(`[[72, "sapphire", "oval"], [100, "ruby", "round"], [128, "emerald", "oval"]].map(([x, g, s]) => gemSvg(g, s, x, 30, 6, { glimmer: true }, { mark: 'data-demo="gem"', ids: "demo-crown-" })).join("") +
  [40 + 120 * 0.5 / 5, 40 + 120 * 1.5 / 5, 40 + 120 * 2.5 / 5, 40 + 120 * 3.5 / 5, 40 + 120 * 4.5 / 5].map((x, i) => gemSvg("diamond", "rhombus", x, -18 + (i % 2 ? 10 : 0) - 2, 4.5, { stars: i === 2 }, { mark: 'data-demo="gem"', ids: "demo-point-", set: null })).join("")`);
svgFile("demo-crown.svg", [0, -45, 400, 125], 600, 188,
  `<g transform="translate(0 0)">${crown}</g>${label(100, 66, "today")}` +
  `<g transform="translate(200 0)">${crown}${crownGems}</g>${label(300, 66, "demonstration")}`);

// 2. THE CHEST: a treasure chest of gems as the game draws it (seaChestSvg, 💎 gems), and the chest of gold with loose cut
// stones heaped in it (gemSvg with set: null, no gold setting), the same seven places
const chest = run(`seaChestSvg(true, "gems", {})`);
const chestGold = run(`seaChestSvg(true, "gold", {})`);
const loose = run(`[...Array(7)].map((_, j) => gemSvg(["ruby", "sapphire", "emerald", "amethyst", "topaz", "diamond", "ruby"][j], ["round", "oval", "rhombus", "teardrop", "heart", "star", "oval"][j],
  -26 + 52 * seaR(j, 974), -50 - 8 * seaR(j, 975), 6, { glimmer: j % 2 === 0 }, { mark: 'data-demo="gem"', ids: "demo-chest-", set: null })).join("")`);
svgFile("demo-chest.svg", [-80, -95, 320, 130], 600, 244,
  `${chest}${label(0, 26, "today")}<g transform="translate(160 0)">${chestGold}${loose}</g>${label(160, 26, "demonstration")}`);

// 3. THE SWORD AND THE SHIELD: the trap room's sword (swordSvg) with a gem in its pommel and its crossguard, and the
// knight's shield (shieldSvg, his arms) with a gem at each top corner and one below the emblem
const sword = run(`swordSvg(0, 0, 220, 0, 1)`);
const swordGems = run(`gemSvg("ruby", "round", 6.6, 0, 5.2, { glimmer: true }, { mark: 'data-demo="gem"', ids: "demo-sword-" }) + gemSvg("sapphire", "rhombus", 45.3, 0, 4.2, {}, { mark: 'data-demo="gem"', ids: "demo-guard-" })`);
const shield = run(`shieldSvg([0, 0], { knightA: "#2f6db5", knightB: "#f4f1ea", tabardLayout: "quartered", emblem: "falcon" }, "demo-arms", false)`);
const shieldGems = run(`gemSvg("emerald", "round", -21, -29, 4.5, {}, { mark: 'data-demo="gem"', ids: "demo-sh1-" }) + gemSvg("emerald", "round", 21, -29, 4.5, {}, { mark: 'data-demo="gem"', ids: "demo-sh2-" }) +
  gemSvg("ruby", "heart", 0, 22, 5.5, { shine: true }, { mark: 'data-demo="gem"', ids: "demo-sh3-" })`);
svgFile("demo-sword-shield.svg", [-20, -60, 360, 125], 600, 208,
  `<g transform="translate(0 -10)">${sword}</g><g transform="translate(0 -10)">${swordGems}</g>${label(110, 56, "a sword")}` +
  `<g transform="translate(290 -8) scale(1.1)">${shield}${shieldGems}</g>${label(290, 56, "a shield")}`);

// 4. THE THRONE: one of the king's room's thrones (throneSvg, in its room's own units), its three jewels dots today; in the
// demonstration a cut gem on each, and a big one for its crest
const c = run(`({ k: 1, P: (x, y) => f1(x) + " " + f1(y), x0: -400, x1: 400, y0: -300, y1: 400, g: 400, W: 800, H: 700 })`);
ctx.__c = c;
const throne = run(`throneSvg(__c, "#a3122a", "#2f6db5")`);
const throneGems = run(`(() => { const ty = roomFrame(__c).floor - 42;
  return [-11, 0, 11].map((x, i) => gemSvg(["ruby", "sapphire", "emerald"][i], i === 1 ? "rhombus" : "round", x, ty - 230 + (x ? 4 : -6), 4.2, { glimmer: true }, { mark: 'data-demo="gem"', ids: "demo-th" + i + "-", set: null })).join("") +
    gemSvg("sapphire", "oval", 0, ty - 172, 11, { glimmer: true, stars: true }, { mark: 'data-demo="gem"', ids: "demo-crest-" }); })()`);
svgFile("demo-throne.svg", [-180, -10, 360, 320], 450, 400,
  `<g transform="translate(-85 0)">${throne}</g>${label(-85, 304, "today")}<g transform="translate(85 0)">${throne}${throneGems}</g>${label(85, 304, "demonstration")}`);

// 5. ONE GEM AT ANY SIZE: every stone in every shape, big, facing us and from the side (the widths in proportion since
// ticket 564; the ninja's own sizes, 10 and 11, draw exactly as before)
const shapes = run(`JSON.stringify(GEMSTONE_SHAPES.map(s => s[0]))`), stones = run(`JSON.stringify(Object.keys(GEMSTONES))`);
const cat = run(`(() => { const sh = ${shapes}, st = ${stones}; let t = "";
  sh.forEach((s, i) => st.forEach((g, j) => { t += gemSvg(g, s, 40 + j * 62, 40 + i * 70, 20, {}, { mark: 'data-demo="gem"', ids: "demo-cat-" }); }));
  sh.forEach((s, i) => { t += gemSideSvg("ruby", s, 412, 40 + i * 70, 22, 1, {}, { mark: 'data-demo="gem"', ids: "demo-side-" }); });
  return t; })()`);
svgFile("demo-catalogue.svg", [0, 0, 480, 440], 480, 440, cat + label(195, 432, "facing us") + label(412, 432, "from the side"), "#ece6d6");

// 6. THE NINJA, as the game draws them (drawNow, the defaults with the ninja on: a ruby, round, glimmering), facing us and
// in profile; and its gem from the shared code
run(`globalThis.__draw = steps => { state = clone(DEFAULTS); state.music.mute = true; for (const [p, k, v] of steps) set(p, k, v); drawNow(); }`);
const friend = steps => { box.caught = null; run(`__draw(${JSON.stringify(steps)})`); return box.caught; };
const front = friend([["costume", "kind", "ninja"]]), side = friend([["costume", "kind", "ninja"], ["body", "facing", "right"]]);
const wrap = (svg, id) => svg.replace(/id="([^"]+)"/g, (m, a) => `id="${id}-${a}"`).replace(/url\(#([^)]+)\)/g, (m, a) => `url(#${id}-${a})`).replace(/href="#([^"]+)"/g, (m, a) => `href="#${id}-${a}"`);
svgFile("ninja.svg", [-200, -170, 800, 520], 640, 416, `<g>${wrap(front, "f")}</g><g transform="translate(400 0)">${wrap(side, "s")}</g>`);
// and close up: the head band and its gem, facing us (the friend's head is at the top of the picture)
svgFile("ninja-gem.svg", [-60, -150, 120, 70], 480, 280, wrap(front, "z"));
