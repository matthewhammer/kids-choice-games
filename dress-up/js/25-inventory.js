"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 687, Matthew 2026-11-04: "in-game 'inventory' screen --- ... the player sees: their inventory; selects the active item
// (let's choose up to 2 at a time? not assume sword is always one of them)"; "a button for toggling back and forth from this
// inventory screen, which covers the game with either a black background, a white background, or a dimmed background (dimming
// what's on screen to mostly, but not entirely, hide it)"; "items for: creating bubbles, creating fire, other things we have
// special buttons for"; "so that these special buttons become something that can be changed from within the game, like selecting
// an item that gives that ability"; "going forward, we'll have use item A, use item B, and those can be tools, or abilities")
// (and then: "A and B is already in use on our game pad"; "two other symbols that are not letters, or numbers, or related to other
// game objects or events yet": 🔹 and 🔸, his pick, the two slots' marks, which nothing else in the game uses)
// 🎒 Your items: a screen over the game (the 🎒 button at the picture's corner, I on the keyboard, or start on the controller:
// Matthew's pick, 2026-11-04, 🚪 the nearest passage taken off it), the game's picture held still under it. On it, every item: the abilities, which anyone has
// (🫧 blowing bubbles, 🔥 breathing fire), and the tools, once found (in the 🎒 backpack; the sword also in the friend's own
// hand), the ones not found yet shown dim. Two of them are the active items, in the slots 🔹 and 🔸 (state.pack.a and .b;
// either may be empty, and no item is assumed): the controller's "🔹 use your 🔹 item" and "🔸 use your 🔸 item" (the left and right triggers,
// where 🫧 and 🔥 were), Z and X on the keyboard. A tool is used by a press (toolUse: swung, or the can tipped); an ability goes
// on while its button is held. The screen covers the game dimmed, black or white (state.pack.screen).
const ITEMS = [["bubbles", "🫧", "blow bubbles", "ability"], ["fire", "🔥", "breathe fire", "ability"],
               ["net", "🥅", "the bug net", "tool"], ["sword", "🗡️", "the sword", "tool"], ["can", "💧", "the watering can", "tool"]];
const ITEM = Object.fromEntries(ITEMS.map(([id, icon, name, kind]) => [id, { id, icon, name, kind }]));
const ITEM_SCREENS = [["dim", "🌗 dimmed"], ["black", "⬛ black"], ["white", "⬜ white"]];
// the slots: each its state.pack key, its controller action, its mark and its key on the keyboard
const SLOTS = [["a", "useA", "🔹", "Z"], ["b", "useB", "🔸", "X"]];
// a slot's mark in a line of text, drawn bigger (🔹 and 🔸 are small emoji; style.css .slot-mark)
const slotMark = m => el("span", { class: "slot-mark", "aria-hidden": "true" }, m);

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
// a tool, used from its slot: swung as "use tool" swings it, or the can tipped
function itemToolUse(id) {
  if (!ITEM[id] || ITEM[id].kind !== "tool" || !itemHas(id)) return false;
  return toolUse(undefined, id);
}
// (ticket 660, part 3, for M: the can in the hand at once) a tool just found goes in a slot: an empty one, or else in place of
// an ability (🔸's first: its hand, the right, is a tool's; an ability is always had, so nothing is lost), never of a tool
function itemFound(id) {
  if (!TOOLS[id] || itemIn("a") === id || itemIn("b") === id) return;
  const s = !itemIn("b") ? "b" : !itemIn("a") ? "a" : ITEM[itemIn("b")].kind === "ability" ? "b" : ITEM[itemIn("a")].kind === "ability" ? "a" : "";
  if (s) state.pack = { ...(state.pack || {}), [s]: id };
}
// (the 🎒 tab's 🔹 and 🔸, and older code's toolHold: in a slot as a found tool goes, or out of its slot again)
function toolHold(id) {
  const P = state.pack || {};
  if (P.a === id || P.b === id) state.pack = { ...P, ...(P.a === id ? { a: "" } : {}), ...(P.b === id ? { b: "" } : {}) };
  else itemFound(id);
  changed(); draw();
}

// ---- in the hands ----
// (Matthew: "let's have the L and R hands depict the two selected items") what each own hand holds, drawn: the costume's or a
// hold choice's thing (heldItems), else 🔹's item in the left hand and 🔸's in the right (a costume's own thing is never taken
// from it; an item already in the other hand is not drawn twice). slotL, slotR: the hand's thing came of a slot. Not while the
// people or the statue are drawn (personBusy): the slots are the friend's own.
function heldWithItems(base) {
  if (typeof personBusy !== "undefined" && personBusy) return base;
  const a = itemIn("a"), b = itemIn("b");
  const L = base.L || (a && a !== base.R ? a : null), R = base.R || (b && b !== L ? b : null);
  return { L, R, slotL: !base.L && !!L, slotR: !base.R && !!R };
}
// (Matthew: "if the selected items are bubbles or fire, can we render a cheap animation there on the hand for a 'simmering'
// ability that's just waiting, and idling a bit (a few bubbles ... limited ..., or a small flame, similarly limited in
// animation expense)") An item in the hand, at the hand (H, the friend's units), leaning the way the hand reaches (the way
// they face in profile): the net and the can as they are swung and tipped; 🫧 a bubble wand, three bubbles at a time rising
// off its ring; 🔥 a small flame on the open palm, flickering, an ember rising. Each moves by SMIL on the picture's own clock
// (begun at 0, or before it, so a friend drawn again picks up where it was, the drawing the same each time; held still with
// the picture): a fixed few shapes, nothing done a frame for them.
function itemHeldSvg(id, H, view, o) {
  const [hx, hy] = H, s = view === "side" ? (o.dir || 1) : (o.out || 1);
  const at = (x, y, inner, rot = 0) => `<g transform="translate(${f1(x)} ${f1(y)})${rot ? ` rotate(${rot})` : ""}">${inner}</g>`;
  const loop = (attr, values, dur, begin, extra = "") => `<animate${attr === "transform" ? "Transform" : ""} attributeName="${attr}" ${extra}values="${values}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>`;
  switch (id) {
    case "net": return at(hx, hy, `<g transform="scale(1.1)">${netSvg(1)}</g>`, s * 18);
    case "can": return at(hx, hy, `<g transform="scale(1.1)">${canSvg(s)}</g>`);
    case "bubbles": {
      // the wand: a stick up and out of the fist, its ring a soap film; and off the ring, three bubbles a third of a cycle apart
      const rx = s * 18, ry = -62;
      let b = `<path d="M0 8 L${f1(rx * 0.85)} ${f1(ry + 13)}" stroke="#7c3aed" stroke-width="4.5" stroke-linecap="round"/>` +
        `<circle cx="${f1(rx)}" cy="${ry}" r="13" fill="#dbeafe" fill-opacity="0.45" stroke="#7c3aed" stroke-width="3.5"/>` +
        `<path d="M${f1(rx - 6)} ${ry - 5} Q${f1(rx - 2)} ${ry - 9} ${f1(rx + 3)} ${ry - 8}" stroke="#fff" stroke-width="2" fill="none" opacity="0.8"/>`;
      for (let i = 0; i < 3; i++) {
        const r = 4 + i * 1.5, dx = s * (6 + 7 * i), begin = (-0.8 * i).toFixed(1);
        b += `<g opacity="0">${loop("opacity", "0;0.95;0.95;0", 2.4, begin, 'keyTimes="0;0.15;0.7;1" ')}` +
          `<circle cx="${f1(rx)}" cy="${ry - 12}" r="${r}" fill="#e0f2fe" fill-opacity="0.35" stroke="#60a5fa" stroke-width="1.6">` +
          `${loop("transform", `0 0;${f1(dx)} -50`, 2.4, begin, 'type="translate" ')}</circle></g>`;
      }
      return at(hx, hy, b);
    }
    case "fire": {
      // the flame on the palm, scaled about its foot: a flicker, never a frame's work; and one ember, up and out
      const flame = `<g>${loop("transform", "1 1;0.9 1.14;1.08 0.93;0.95 1.07;1 1", 0.9, 0, 'type="scale" ')}` +
        `<path d="M0 0 C-15 -3 -14 -24 -3 -44 C1 -31 11 -28 9 -15 C16 -20 15 -6 0 0 Z" fill="#f97316" stroke="#c2410c" stroke-width="1.5"/>` +
        `<path d="M0 -2 C-8 -4 -7 -15 -1 -27 C2 -18 7 -15 5 -9 C7 -10 7 -4 0 -2 Z" fill="#fde047"/></g>`;
      const ember = `<g opacity="0">${loop("opacity", "0;1;0", 1.6, -0.5)}<circle cx="0" cy="-34" r="2.2" fill="#fdba74">` +
        `${loop("transform", `0 0;${s * 7} -34`, 1.6, -0.5, 'type="translate" ')}</circle></g>`;
      return at(hx, hy - 12, flame + ember);
    }
    default: return "";
  }
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
        "aria-pressed": String(itemIn(s) === id), title: `${mark}: ${name}`, onclick: () => { itemsAt = i; itemSet(s, id); } }, slotMark(mark))))]);
  });
  const names = Object.fromEntries(CHEST_GIFTS), rest = packList().filter(o => !ITEM[o.id]);
  itemsEl.replaceChildren(
    el("div", { class: "items-top" }, [el("h2", {}, "🎒 Your items"),
      el("div", { class: "items-backs", role: "group", "aria-label": "behind your items" }, ITEM_SCREENS.map(([k, label]) =>
        el("button", { type: "button", "aria-pressed": String(screen === k), onclick: () => { state.pack = { ...(state.pack || {}), screen: k }; changed(); itemsRender(); } }, label))),
      el("button", { type: "button", class: "items-close", onclick: () => itemsShow(false) }, "✖ back to the game")]),
    el("div", { class: "items-slots" }, SLOTS.map(slot)),
    el("p", { class: "hint" }, ["Choose what ", slotMark("🔹"), " and ", slotMark("🔸"), " do: tap ", slotMark("🔹"), " or ", slotMark("🔸"),
      " under an item. With a controller, the arrows choose an item, and the button you want it on puts it there; start shuts this."]),
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
// the keyboard: I opens and shuts the screen (Escape shuts it); on it, the arrows choose and Z or X puts the item in 🔹 or 🔸;
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
