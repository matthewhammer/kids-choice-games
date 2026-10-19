"use strict";
// (ticket 178) Part 22 of 26 of the game's script, run in order by index.html.

// ===================== FULL SCREEN =====================
// The picture fills the window, the controls hidden -- and the screen too,
// where the browser allows it (not an iPhone's); an X, Escape, or leaving
// the browser's full screen brings the controls back.
const maxBtn = document.getElementById("max");
// (keepScreen: the music's full screen takes over, and the screen stays full)
function setBig(on, keepScreen) {
  document.body.classList.toggle("big", on);
  if (!on) setHud(false);
  maxBtn.textContent = on ? "✕" : "⤢";
  maxBtn.title = on ? "Back to the controls" : "Full screen";
  maxBtn.setAttribute("aria-label", maxBtn.title);
  if (keepScreen) return;
  try {
    if (on && document.documentElement.requestFullscreen && !document.fullscreenElement)
      document.documentElement.requestFullscreen().catch(() => {});
    else if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch (e) { /* the window-filling picture is enough */ }
}
maxBtn.addEventListener("click", () => setBig(!document.body.classList.contains("big")));
// (ticket 159, Matthew) The 🎵 Music tab full screen: what is playing, where
// the tune is, the tunes and the mixing board take the whole window (the
// picture, the title and the other tabs hidden), and the screen where the
// browser allows; ✕, Escape or leaving the browser's full screen bring the
// game back.
// (ticket 170, Matthew) It opens from the game's full screen too (🎚️, next
// to the mute): then ✕ goes back there, the screen still full, the tab and
// the HUD as they were; leaving the browser's full screen (leaving) goes
// back to the game with its controls.
const MUSIC_BIG = ["⛶ the music, full screen", "✕ back to the game"];
let musicFrom = null;
function setMusicBig(on, leaving) {
  const musicTab = TABS.findIndex(t => t[1] === "music");
  if (on && document.body.classList.contains("big")) {
    musicFrom = { tab, hud: !hud.hidden };
    setBig(false, true);
    if (tab !== musicTab) { tab = musicTab; showTab(); }
  }
  designerShell("music", on);
  const from = on ? null : musicFrom;
  if (!on) musicFrom = null;
  if (from && from.tab !== tab) { tab = from.tab; showTab(); }
  if (from && !leaving) { setBig(true); if (from.hud) setHud(true); return; }
  designerScreen(on);
}
// (ticket 210, Matthew: "full screen mode for world designer, follow the music
// panel for a model") The 🗺️ World design tab full screen, as the music's:
// its controls take the whole window, the grid as big as it allows, and the
// screen where the browser allows; ✕, Escape or leaving the browser's full
// screen bring the game back.
const WORLD_BIG = ["⛶ the world designer, full screen", "✕ back to the game"];
// (ticket 285, ^du_report(5)'s step 1: "the designer's shell the two full screens share") A tab full screen as a designer:
// body.designer-big, with the designer's own class (music-big, world-big); its controls the whole window under a slim
// bar that names the tab, its chip there saying ✕ back; ✕, Escape or leaving the browser's full screen going back.
// DESIGNERS: each one's class, its chip's class (also designer-chip, which the bar's CSS keys on) and words.
// (ticket 285, ^du_report(5)'s step 2) and 🏞️ Background as a designer, made for one place (setBgBig)
const BG_BIG = ["⛶ the background designer, full screen", "✕ back to the game"];
const DESIGNERS = { music: { cls: "music-big", chip: "musicbig", words: MUSIC_BIG }, world: { cls: "world-big", chip: "worldbig", words: WORLD_BIG },
                    background: { cls: "bg-big", chip: "bgbig", words: BG_BIG } };
function designerShell(name, on) {
  const D = DESIGNERS[name];
  document.body.classList.toggle(D.cls, on);
  document.body.classList.toggle("designer-big", Object.values(DESIGNERS).some(x => document.body.classList.contains(x.cls)));
  for (const b of document.querySelectorAll("button." + D.chip)) b.textContent = D.words[on ? 1 : 0];
  if (on) document.querySelector(".side").scrollTop = 0;
}
// (the screen too, where the browser allows: the window-filling designer is enough where it does not)
function designerScreen(on) {
  try {
    if (on && document.documentElement.requestFullscreen && !document.fullscreenElement)
      document.documentElement.requestFullscreen().catch(() => {});
    else if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch (e) { /* the window-filling designer is enough */ }
}
function setWorldBig(on) {
  designerShell("world", on);
  placePic();
  designerScreen(on);
}
function setBgBig(on) {
  designerShell("background", on);
  placePic();
  designerScreen(on);
}
// (ticket 285) The Background tab's rows, once built, in the designer's two columns: its boxes (.bg-boxes), and beside them
// the game's card (.bg-viewcol); outside the full screen the two are display: contents, and the tab is as it always was
function bgLayout(panel) {
  const kids = [...panel.children], bar = kids.find(c => c.querySelector(":scope > button.designer-chip")), view = kids.find(c => c.querySelector(":scope > .bg-view"));
  const boxes = el("div", { class: "bg-boxes" }, kids.filter(c => c !== bar && c !== view));
  // (Matthew: "no drag between LHS and RHS -- that's a key feature of world designer": the same dragger, kept apart from the world's)
  const split = el("div", { class: "world-split bg-split", role: "separator", "aria-orientation": "vertical", title: "Drag: more room for the boxes, or for the game" });
  const layout = el("div", { class: "bg-layout" }, [boxes, split, el("div", { class: "bg-viewcol" }, view ? [view] : [])]);
  designerSplit(layout, split, "dress-up-bg-split");
  panel.replaceChildren(...(bar ? [bar] : []), layout);
}
// (ticket 375, Matthew: "redesign all panels in menu of dress up that are not following the guidance and insights outlined in the
// knowling report"; "does the non FS sub panel system look as well as the FS version? Are they each knowlled equally?") Every tab's
// rows, once built, in boxes, as ^du_report(5) has it: a box for each thing you can see (its name once, emoji first), the boxes in a
// grid (.boxes: one column in the side panel's width, more as it widens), a box hidden while every row in it is. TAB_BOXES: by tab
// name, its boxes, each [name, its rows' keys]; a row named in none goes in a last box named by the tab; a tab not listed is left
// as it is (its own layout: the designers, the controller, accessibility, advanced)
const TAB_BOXES = {
  "🧍 Body": [["🤸 the pose", ["pose", "lieHow", "lieHead", "hugLift"]], ["↔️ facing and moving", ["facing", "anim", "stairsWay"]],
              ["✋ the dominant hand", ["hand"]], ["🐸 the jumps", ["jumps"]]],
  "😀 Face": [["🙂 the head", ["color", "size", "faceW", "faceH", "alien", "eyeGap", "sides", "rays"], ["face"]], ["🤨 the brows", ["brow", "unibrow"]],
              ["👄 the mouth", ["smile", "mouthSize", "open", "teethStyle", "teeth", "tongue", "tongueLen", "tongueW", "tongueColor"]],
              ["👃 the nose", ["noseView", "nose", "noseFront", "noseH", "noseW", "witchDir", "witchLen"]], ["👂 the ears", ["ears", "earSize"]],
              ["💥 faces it makes", ["burst", "candy", "sick"]]],
  "👁 Eyes": [["👁 the eyes", ["eyes", "oval", "tilt", "whites"], ["eye"]], ["⚫ pupil and iris", ["pupil", "iris", "irisColor"]],
             ["✨ the shine", ["light", "shine", "shineMix", "shineSize"]], ["⭐ funny eyes", ["stars", "hearts", "xeyes", "closed"]]],
  "💇 Hair": [["💇 the hair", ["style", "length", "bangs", "color"]]],
  "🦒 Neck, arms & legs": [["🦒 the neck", ["neck", "neckW"]], ["💪 the arms", ["arms", "elbows", "armLen", "armW"]],
                          ["🦵 the legs", ["legLen", "legW", "knees", "feetTurn"]], ["🤸 posed", ["poseHow", "unpose"]]],
  "👕 Shirt": [["👕 the shirt", ["style", "collar", "color", "width", "length"]], ["🔷 its pattern", ["pattern", "patternSize", "patternColor"]]],
  "🖐 Hands": [["🖐 both hands", ["different", "style", "color", "size"]], ["🖐🖐 each hand", ["rightHand"]],
              ["🔢 how many", ["fingers", "alienFingers", "starPoints", "clawCount", "clawLen"], ["number of"]],
              ["🔄 the angle", ["starAngle", "mittenAngle", "clawAngle", "humanAngle", "alienAngle"]]],
  "👖 Pants": [["👖 the pants", ["style", "skirtLen", "color"]], ["🔷 its pattern", ["pattern", "patternSize", "patternColor"]]],
  "🩱 Swim & undies": [["🩱 the swimsuit", ["on", "style", "top", "color"]], ["🔷 its pattern", ["pattern", "patternSize", "patternColor"]]],
  "👟 Feet": [["👟 both feet", ["different", "style", "color", "size"]], ["👟👟 each foot", ["rightShoe"]],
             ["🔢 how many", ["toes", "alienToes", "talonCount"], ["number of"]]],
  "👻 Visibility": [["🧍 the whole friend", ["all"]], ["👻 each part", ["head", "eyes", "hair", "shirt", "pants", "feet", "hands"]]],
  "🐯 Costume": [["🐯 the costume", ["kind"]], ["🐾 the animal", ["fur", "furPattern", "marks", "spot", "belly", "eyes", "accent"]],
                ["🤿 the scuba suit", ["scubaColor", "scubaAccent"]], ["⚓ the old diving suit", ["diverMetal", "diverCloth", "diverHose", "hoseColor"]],
                ["🥽 diving gear", ["snorkel", "snorkelColor", "mask", "maskColor", "tank", "tankColor", "leaks"]],
                ["👻 the ghost", ["ghostRagged", "ghostEyes", "ghostHideEyes", "ghostColor", "visible"]],
                ["🧙 the witch", ["witchColor", "webColor", "webStyle", "trimColor", "bootColor"]],
                ["🐈‍⬛ her cat", ["witchCat", "catFur", "catWhite", "catEyes", "catNose", "catSize"]], ["🧹 her broom", ["broom", "broomSize"]],
                ["🧚 the fairy", ["wingStyle", "wingColor_butterfly", "wingColor_dragonfly", "wingColor_leaf", "wingColor_petal", "wingColor_sparkle",
                                  "wingFlutter", "wingLfo", "fairyOutfit", "tunicStyle", "tunicColor_petal", "tunicColor_leaf", "tunicColor_bluebell",
                                  "tunicColor_sparkle", "tunicColor_toadstool", "fairyShoes", "fairyShoeColor"]],
                ["🌸 the wreath", ["wreath", "wreathFlowers"]]],
};
function boxLayout(panel, tabName, ctls) {
  const plan = TAB_BOXES[tabName];
  if (!plan) return;
  const rows = [...panel.children], boxes = plan.map(([name]) => ({ name, rows: [] })), rest = { name: tabName, rows: [] };
  rows.forEach((r, i) => { const key = ctls[i] && typeof ctls[i][1] === "string" ? ctls[i][1] : null, j = key ? plan.findIndex(([, keys]) => keys.includes(key)) : -1;
    (j >= 0 ? boxes[j] : rest).rows.push(r); });
  const made = [...boxes, rest].filter(b => b.rows.length).map((b, j) => {
    // (the report's rule 1: nothing inside repeats the box's name: "mouth size" in 👄 the mouth is "size"; the words dropped are
    // the name's last and any the plan adds, at a label's start, after its emoji)
    const words = j < plan.length ? [b.name.split(" ").pop(), ...(plan[j][2] || [])] : [];
    for (const r of b.rows) for (const n of r.querySelectorAll(":scope > .lbl .name")) { const t = n.textContent;
      for (const w of words) { const m = t.match(new RegExp("^((?:[\\p{Extended_Pictographic}\\u200D\\uFE0F]\\s*)*)" + w.replace(/s$/, "") + "s?(?:'s)?\\s+(\\S.*)$", "u"));
        if (m) { n.textContent = m[1] + m[2]; break; } }
      // (and a row whose name is only the box's: "costume" in 🐯 the costume, "pattern" in 🔷 its pattern: the box names it)
      const bare = n.textContent.replace(/^[\p{Extended_Pictographic}\u200D\uFE0F\s]+/u, "").trim();
      if (words.length && bare && words.some(w => bare === w || bare === w.replace(/s$/, ""))) {
        // (a slider keeps a name: its hint, "dark ↔ bright" for ✨ the shine's shine, where it has one)
        if (r.querySelector(":scope > input[type=range]")) { if (n.title) { n.textContent = n.title; n.removeAttribute("title"); } continue; }
        n.hidden = true; const L = n.closest(".lbl"); if (L && !L.textContent.replace(n.textContent, "").trim()) L.hidden = true; } }
    const box = el("section", { class: "box tabbox" }, [el("h3", { class: "box-name" }, [b.name]), ...b.rows]);
    syncs.push(() => { const hide = b.rows.every(r => r.hidden); if (box.hidden !== hide) box.hidden = hide; });
    return box; });
  panel.replaceChildren(el("div", { class: "boxes tabboxes" }, made));
}
// (a place's picture, the picture archive's thumbnail of it with the friend; the castle's rooms by the room shown now, or the king's)
const PICTURES_SITE = "https://matthewhammer.org/dress-up-pictures/pictures/thumbs/backgrounds-with-friend/";
const placeThumb = id => PICTURES_SITE + (id === "castleroom" ? "castleroom--" + (state.background.kind === "castleroom" ? objPlace(state.background).split(":")[1] : "king") : id) + ".webp";
// (an object's picture, OBJECTS.md's, clipped from its place: dress-up/objects/<place>/<name>.webp)
const objPicture = (at, name) => `objects/${at.replace(":", "-")}/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.webp`;
// (ticket 231, Matthew: "show the in-game view as the first sub-panel, the full width of the RHS of the full screen
// view. Then a way to scroll the panels below and keep that in-game view fixed. An eye-ball to hide it ... off by
// default, so we are showing it by default") The world designer full screen, on a wide window: the picture itself
// (.pic-box: #pic with its arrows and buttons, live, to walk in and to drag things into) moves into the right side's
// first card (.world-view-pic), held under the bar as the cards below it scroll; ticket 224's dragger sizes it. The
// card's 👁️ folds it away to its name and back, kept in this browser. Leaving full screen, a narrow window, or the
// tab built again (showTab) puts the picture where it belongs again.
const WORLD_VIEW_KEY = "dress-up-world-view", worldWide = matchMedia("(min-width: 900px)");
// (held, not looked up: the tab built again takes the card, and the picture in it, out of the page until placed)
const picBoxEl = document.querySelector(".pic-box"), picHome = document.querySelector(".pic-area");
let worldViewHidden = false, picSlot = null;
try { worldViewHidden = localStorage.getItem(WORLD_VIEW_KEY) === "hidden"; } catch (e) { /* (shown) */ }
function placePic() {
  // (ticket 285: the world designer's card, or the background designer's)
  const bg = document.body.classList.contains("bg-big"), box = picBoxEl, home = picHome, slot = document.querySelector(bg ? ".bg-view-pic" : ".world-view-pic");
  if (!box || !home) return;
  const into = (bg || document.body.classList.contains("world-big")) && worldWide.matches && !worldViewHidden && slot ? slot : null;
  if (into !== picSlot && picAreaWatch) { if (picSlot) picAreaWatch.unobserve(picSlot); if (into) picAreaWatch.observe(into); }
  picSlot = into;
  if (into && box.parentNode !== into) into.append(box);
  if (!into && box.parentNode !== home) home.insertBefore(box, home.querySelector(".bar"));
  document.body.classList.toggle("pic-in-world", !!into);
  picAreaSize = null; fitPic();
}
// the card's 👁️, lit while the view shows (as the HUD's eyes)
function worldViewMark(card) {
  card.classList.toggle("folded", worldViewHidden);
  const eye = card.querySelector(".eye");
  eye.setAttribute("aria-pressed", String(!worldViewHidden));
  eye.title = worldViewHidden ? "Show the in-game view here" : "Hide the in-game view (more room for the controls)";
  eye.setAttribute("aria-label", eye.title);
}
function worldViewShow(on) {
  worldViewHidden = !on;
  try { if (on) localStorage.removeItem(WORLD_VIEW_KEY); else localStorage.setItem(WORLD_VIEW_KEY, "hidden"); } catch (e) { /* (for this visit) */ }
  for (const card of document.querySelectorAll(".world-view")) worldViewMark(card);
  placePic();
}
worldWide.addEventListener("change", placePic);
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && document.body.classList.contains("world-big")) setWorldBig(false);
  if (e.key === "Escape" && document.body.classList.contains("bg-big")) setBgBig(false);
  if (e.key === "Escape" && document.body.classList.contains("big")) setBig(false);
  if (e.key === "Escape" && document.body.classList.contains("music-big")) setMusicBig(false);
});
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && document.body.classList.contains("big")) setBig(false);
  if (!document.fullscreenElement && document.body.classList.contains("music-big")) setMusicBig(false, true);
  if (!document.fullscreenElement && document.body.classList.contains("world-big")) setWorldBig(false);
  if (!document.fullscreenElement && document.body.classList.contains("bg-big")) setBgBig(false);
});
