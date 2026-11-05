"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 687, Matthew 2026-11-04: "in-game 'inventory' screen --- ... the player sees: their inventory; selects the active item
// (let's choose up to 2 at a time? not assume sword is always one of them)"; "a button for toggling back and forth from this
// inventory screen, which covers the game with either a black background, a white background, or a dimmed background (dimming
// what's on screen to mostly, but not entirely, hide it)"; "items for: creating bubbles, creating fire, other things we have
// special buttons for"; "so that these special buttons become something that can be changed from within the game, like selecting
// an item that gives that ability"; "going forward, we'll have use item A, use item B, and those can be tools, or abilities")
// 🎒 Your items: a screen over the game (the 🎒 button at the picture's corner, I on the keyboard, or start on the controller:
// Matthew's pick, 2026-11-04, 🚪 the nearest passage taken off it), the game's picture held still under it. On it, every item: the abilities, which anyone has
// (🫧 blowing bubbles, 🔥 breathing fire), and the tools, once found (in the 🎒 backpack; the sword also in the friend's own
// hand), the ones not found yet shown dim. Two of them are the active items, in the slots 🅰️ and 🅱️ (state.pack.a and .b;
// either may be empty, and no item is assumed): the controller's "use item A" and "use item B" (the left and right triggers,
// where 🫧 and 🔥 were), Z and X on the keyboard. A tool is used by a press (toolUse: swung, or the can tipped); an ability goes
// on while its button is held. The screen covers the game dimmed, black or white (state.pack.screen).
const ITEMS = [["bubbles", "🫧", "blow bubbles", "ability"], ["fire", "🔥", "breathe fire", "ability"],
               ["net", "🥅", "the bug net", "tool"], ["sword", "🗡️", "the sword", "tool"], ["can", "💧", "the watering can", "tool"]];
const ITEM = Object.fromEntries(ITEMS.map(([id, icon, name, kind]) => [id, { id, icon, name, kind }]));
const ITEM_SCREENS = [["dim", "🌗 dimmed"], ["black", "⬛ black"], ["white", "⬜ white"]];
// the slots: each its state.pack key, its controller action, its mark and its key on the keyboard
const SLOTS = [["a", "useA", "🅰️", "Z"], ["b", "useB", "🅱️", "X"]];

// the friend has it: an ability always; a tool in the backpack, or (the sword) in their own hand
function itemHas(id) {
  const it = ITEM[id];
  if (!it) return false;
  if (it.kind === "ability") return true;
  if (packList().some(o => o.id === id)) return true;
  if (id !== "sword") return false;
  const h = heldItems(state.body, state.costume.kind, state.costume);
  return h.L === "sword" || h.R === "sword";
}
// the item in a slot ("a" or "b"): "" when it is empty, or holds a tool no longer had
const itemIn = s => { const id = (state.pack || {})[s] || ""; return id && itemHas(id) ? id : ""; };
// a slot given an item: taken from the other slot if it was there (the two swap); the same one again empties the slot
function itemSet(s, id) {
  const P = { ...(state.pack || {}) }, o = s === "a" ? "b" : "a";
  if (P[s] === id) P[s] = "";
  else { if (P[o] === id) P[o] = P[s] || ""; P[s] = id; }
  state.pack = P;
  itemLetGo();
  changed();
  itemsRender();
}
// a tool, used from its slot: held first (put in the hand from the backpack, or, for a sword in the friend's own hand, the
// backpack's tool put away), then swung as "use tool" swings it
function itemToolUse(id) {
  if (!ITEM[id] || ITEM[id].kind !== "tool" || !itemHas(id)) return false;
  const want = packList().some(o => o.id === id) ? id : "";
  if (toolHeld() !== want) { state.pack = { ...(state.pack || {}), tool: want }; changed(); }
  return toolUse();
}
// Z and X held: each its slot's (blowTick and fireTick read itemKeyHolds, as they read B's and F's own flags)
const itemKeys = { a: false, b: false };
const itemKeyHolds = ability => SLOTS.some(([s]) => itemKeys[s] && itemIn(s) === ability);
function itemKey(s, down) {
  if (itemKeys[s] === down) return;   // (a key's repeats)
  itemKeys[s] = down;
  if (!down) return;
  const id = itemIn(s);
  if (!id) return;
  if (ITEM[id].kind === "tool") itemToolUse(id);
  else if (id === "bubbles") blowGo();
  else if (id === "fire") fireGo();
}
// what the slots' buttons were holding, let go (a slot changed, or the screen opened)
function itemLetGo() { itemKeys.a = itemKeys.b = false; blowPad = false; firePad = false; }

// ---- the screen ----
let itemsOpen = false, itemsAt = 0, itemsStick = [0, 0], itemsPaused = false;   // (open; the item the arrows are on; the stick's last push; the picture held by us)
const itemsBtn = document.getElementById("items-btn"), itemsEl = document.getElementById("items-screen");
const ITEM_MOVES = new Set(["walk", "run", "crawl", "swim", "swimfast"]);
function itemsShow(on) {
  if (on === itemsOpen) return;
  itemsOpen = on;
  setPressed(itemsBtn, on);
  itemsEl.hidden = !on;
  document.body.classList.toggle("items-open", on);
  const p = document.getElementById("pic");
  if (on) {
    itemLetGo();
    // (the game held still: a walk or a swim the controller was making stops where it is)
    if (ITEM_MOVES.has(state.body.anim)) { state.body.anim = "none"; padWant = null; padVel = [0, 0]; changed(); }
    itemsPaused = !!(p && p.pauseAnimations && !p.animationsPaused() && stillAt == null);
    if (itemsPaused) p.pauseAnimations();
    itemsAt = Math.max(0, ITEMS.findIndex(([id]) => id === itemIn("a")));
    itemsRender();
  } else {
    if (itemsPaused && p) p.unpauseAnimations();
    itemsPaused = false;
    itemsEl.replaceChildren();
  }
}
itemsBtn.addEventListener("click", () => itemsShow(!itemsOpen));
const itemsKeyName = a => {
  const b = state.controls[a], pad = padName && Number.isInteger(b) && b >= 0 ? `🎮 ${padButtonName(b)} · ` : "";
  return pad + "⌨️ " + SLOTS.find(([, k]) => k === a)[3];
};
function itemsRender() {
  if (!itemsOpen) return;
  const P = state.pack || {}, screen = ITEM_SCREENS.some(([k]) => k === P.screen) ? P.screen : "dim";
  itemsEl.className = "items-screen " + screen;
  const slot = ([s, a, mark]) => { const it = ITEM[itemIn(s)];
    return el("div", { class: "items-slot" + (it ? "" : " empty") }, [el("span", { class: "items-mark" }, mark),
      el("span", { class: "items-slot-icon", "aria-hidden": "true" }, it ? it.icon : "·"),
      el("span", { class: "items-slot-name" }, [it ? it.name : "empty", el("span", { class: "hint" }, itemsKeyName(a))])]); };
  const tiles = ITEMS.map(([id, icon, name, kind], i) => {
    const has = itemHas(id);
    return el("div", { class: "items-tile" + (has ? "" : " missing") + (i === itemsAt ? " at" : ""), "data-item": id }, [
      el("div", { class: "items-icon", "aria-hidden": "true" }, icon),
      el("div", { class: "items-name" }, name),
      el("div", { class: "hint" }, !has ? "not found yet" : kind === "tool" ? "a tool: press to use" : "hold to use"),
      el("div", { class: "items-pick" }, SLOTS.map(([s, , mark]) => el("button", { type: "button", ...(has ? {} : { disabled: "" }),
        "aria-pressed": String(itemIn(s) === id), title: `${mark}: ${name}`, onclick: () => { itemsAt = i; itemSet(s, id); } }, mark)))]);
  });
  const names = Object.fromEntries(CHEST_GIFTS), rest = packList().filter(o => !ITEM[o.id]);
  itemsEl.replaceChildren(
    el("div", { class: "items-top" }, [el("h2", {}, "🎒 Your items"),
      el("div", { class: "items-backs", role: "group", "aria-label": "behind your items" }, ITEM_SCREENS.map(([k, label]) =>
        el("button", { type: "button", "aria-pressed": String(screen === k), onclick: () => { state.pack = { ...(state.pack || {}), screen: k }; changed(); itemsRender(); } }, label))),
      el("button", { type: "button", class: "items-close", onclick: () => itemsShow(false) }, "✖ back to the game")]),
    el("div", { class: "items-slots" }, SLOTS.map(slot)),
    el("p", { class: "hint" }, "Choose what 🅰️ and 🅱️ do: tap 🅰️ or 🅱️ under an item. With a controller, the arrows choose an item, and the button you want it on puts it there; start shuts this."),
    el("div", { class: "items-grid" }, tiles),
    ...(rest.length ? [el("div", { class: "items-rest" }, [el("span", { class: "hint" }, "🎒 also in your backpack:"),
      ...rest.map(o => el("span", { class: "items-thing" }, names[o.id] || o.id))])] : []));
}
// the arrows (a controller's or the keyboard's) move along the items, a row at a time up and down
function itemsMove(dx, dy) {
  const tiles = [...itemsEl.querySelectorAll(".items-tile")];
  if (!tiles.length) return;
  const top = tiles[0].offsetTop, cols = Math.max(1, tiles.filter(t => t.offsetTop === top).length);
  itemsAt = clamp(itemsAt + dx + dy * cols, 0, tiles.length - 1);
  itemsRender();
}
// a slot given the item the arrows are on, if it is had (already there, it stays: only a tap on its pressed chip empties a slot)
function itemsPick(s) { const [id] = ITEMS[itemsAt] || []; if (id && itemHas(id) && itemIn(s) !== id) itemSet(s, id); }
// (padPoll, while the screen is open: the buttons pressed since the last frame, arrows too; the controller's own numbers)
function itemsPad(fresh, g, btn) {
  const has = i => fresh.includes(i), push = v => (Math.abs(v ?? 0) > 0.5 ? Math.sign(v) : 0);
  const sx = push(g.axes[0]), sy = push(g.axes[1]), ex = sx !== itemsStick[0] ? sx : 0, ey = sy !== itemsStick[1] ? sy : 0;
  itemsStick = [sx, sy];
  const dx = (has(15) ? 1 : 0) - (has(14) ? 1 : 0) + ex, dy = (has(13) ? 1 : 0) - (has(12) ? 1 : 0) + ey;
  if (dx || dy) itemsMove(Math.sign(dx), Math.sign(dy));
  for (const [s, a] of SLOTS) if (has(btn(a))) itemsPick(s);
  if (has(btn("items")) || has(btn("back"))) itemsShow(false);
}
// the keyboard: I opens and shuts the screen (Escape shuts it); on it, the arrows choose and Z or X puts the item in 🅰️ or 🅱️;
// in the game, Z and X use the items in them. (Before the game's own keys: under the screen, they do nothing.)
document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey || (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"))) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (itemsOpen) {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
    if (k === "Escape" || k === "i") { itemsShow(false); }
    else if (d) itemsMove(...d);
    else if (k === "z" || k === "x") { if (!e.repeat) itemsPick(k === "z" ? "a" : "b"); }
    else if (!["b", "f", "u", "t", "Enter"].includes(k)) return;
    else if (k === "Enter") { e.stopPropagation(); return; }   // (a button on the screen, focused, still clicks)
    e.preventDefault(); e.stopPropagation();
    return;
  }
  if (k === "i") { if (!e.repeat) { e.preventDefault(); itemsShow(true); } return; }
  if (k === "z" || k === "x") { e.preventDefault(); itemKey(k === "z" ? "a" : "b", true); }
}, true);
document.addEventListener("keyup", e => { const k = e.key.toLowerCase(); if (k === "z") itemKey("a", false); if (k === "x") itemKey("b", false); });
window.addEventListener("blur", () => { itemKeys.a = itemKeys.b = false; });
