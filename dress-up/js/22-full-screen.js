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
const DESIGNERS = { music: { cls: "music-big", chip: "musicbig", words: MUSIC_BIG }, world: { cls: "world-big", chip: "worldbig", words: WORLD_BIG } };
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
  const box = picBoxEl, home = picHome, slot = document.querySelector(".world-view-pic");
  if (!box || !home) return;
  const into = document.body.classList.contains("world-big") && worldWide.matches && !worldViewHidden && slot ? slot : null;
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
  if (e.key === "Escape" && document.body.classList.contains("big")) setBig(false);
  if (e.key === "Escape" && document.body.classList.contains("music-big")) setMusicBig(false);
});
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && document.body.classList.contains("big")) setBig(false);
  if (!document.fullscreenElement && document.body.classList.contains("music-big")) setMusicBig(false, true);
  if (!document.fullscreenElement && document.body.classList.contains("world-big")) setWorldBig(false);
});
