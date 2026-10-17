"use strict";
// (ticket 178) Part 22 of 25 of the game's script, run in order by index.html.

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
  document.body.classList.toggle("music-big", on);
  for (const b of document.querySelectorAll("button.musicbig")) b.textContent = MUSIC_BIG[on ? 1 : 0];
  if (on) document.querySelector(".side").scrollTop = 0;
  const from = on ? null : musicFrom;
  if (!on) musicFrom = null;
  if (from && from.tab !== tab) { tab = from.tab; showTab(); }
  if (from && !leaving) { setBig(true); if (from.hud) setHud(true); return; }
  try {
    if (on && document.documentElement.requestFullscreen && !document.fullscreenElement)
      document.documentElement.requestFullscreen().catch(() => {});
    else if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  } catch (e) { /* the window-filling controls are enough */ }
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && document.body.classList.contains("big")) setBig(false);
  if (e.key === "Escape" && document.body.classList.contains("music-big")) setMusicBig(false);
});
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && document.body.classList.contains("big")) setBig(false);
  if (!document.fullscreenElement && document.body.classList.contains("music-big")) setMusicBig(false, true);
});
