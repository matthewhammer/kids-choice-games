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
               ["net", "🥅", "the bug net", "tool"], ["sword", "🗡️", "the sword", "tool"], ["can", "💧", "the watering can", "tool"],
               // (ticket 691: the crafts, which anyone has, as the abilities: used, the friend takes off, and flies over the world seen
               // from above; used again, lands: js/25-flight.js)
               ["balloon", "🎈", "the hot-air balloon", "craft"], ["bubbleride", "🫧", "a big bubble to ride", "craft"],
               // (Matthew: "costume props [to] appear in the backpack when we add the costume": itemsDressed) a costume's own things, held
               // in the hand (drawn as HOLDABLES draws them), nothing done by their button: shown on the screen once had
               ["broom", "🧹", "a broom", "prop"], ["staff", "🪄", "a staff", "prop"], ["scepter", "👑", "a scepter", "prop"],
               ["shield", "🛡️", "a shield", "prop"], ["bow", "🏹", "a bow", "prop"], ["lasso", "➿", "a lasso", "prop"]];
const ITEM = Object.fromEntries(ITEMS.map(([id, icon, name, kind]) => [id, { id, icon, name, kind }]));
// (Matthew: "some items are not treated like 'holdable' items: gold coins, chocolate bar. every item should have equal status as
// 'holdable' (assignable to the two active slots, for controller) and shown in our hands, when selected that way") Every
// thing the 🎒 can hold is an item too, of kind "thing": in a slot it is held in that hand (itemHeldSvg: its 🎒 picture, held
// still), and its button does nothing yet. itemOf: an item by id, ITEMS's or a thing's (named as the 🎒 names it, giftName)
function itemOf(id) {
  if (!id) return null;
  if (ITEM[id]) return ITEM[id];
  const full = String(giftName(id) || id), m = full.match(/^(\S+)\s+(.+)$/);
  return { id, icon: m ? m[1] : "🎁", name: m ? m[2] : full, kind: "thing" };
}
const ITEM_SCREENS = [["dim", "🌗 dimmed"], ["black", "⬛ black"], ["white", "⬜ white"]];
// the slots: each its state.pack key, its controller action, its mark and its key on the keyboard
const SLOTS = [["a", "useA", "🔹", "Z"], ["b", "useB", "🔸", "X"]];
// a slot's mark in a line of text, drawn bigger (🔹 and 🔸 are small emoji; style.css .slot-mark)
const slotMark = m => el("span", { class: "slot-mark", "aria-hidden": "true" }, m);

// the friend has it: an ability always; a tool in the backpack, or (the sword) in their own hand
function itemHas(id) {
  const it = itemOf(id);
  if (!it) return false;
  if (it.kind === "ability" || it.kind === "craft") return true;
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
  const s = !itemIn("b") ? "b" : !itemIn("a") ? "a" : itemOf(itemIn("b")).kind === "ability" ? "b" : itemOf(itemIn("a")).kind === "ability" ? "a" : "";
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
// (Matthew: "let's have the L and R hands depict the two selected items"; asked whether a costume's own things or the items win
// a hand: "Show my items") What each own hand holds, drawn: a choice made for that hand in 🧍 Body's 🫴 holding ("✋ nothing"
// too) first; else 🔹's item in the left hand and 🔸's in the right; else the costume's own thing (heldItems). One thing is
// not drawn in two hands: of two the same, the hand's own choice is kept, then the slot's, then the costume's. slotL, slotR:
// the hand's thing came of its slot. Not while the people or the statue are drawn (personBusy): the slots are the friend's own.
function heldWithItems(base, body = state.body) {
  if (typeof personBusy !== "undefined" && personBusy) return base;
  const chose = h => (body["hold" + h] || "auto") !== "auto", a = itemIn("a"), b = itemIn("b");
  const sL = !chose("L") && !!a, sR = !chose("R") && !!b;
  let L = sL ? a : base.L || null, R = sR ? b : base.R || null;
  if (L && L === R) { const rank = h => chose(h) ? 2 : (h === "L" ? sL : sR) ? 1 : 0; if (rank("L") >= rank("R")) R = null; else L = null; }
  return { L, R, slotL: sL && L === a, slotR: sR && R === b };
}
// (Matthew, 2026-11-04: "costume props [should] appear in the backpack when we add the costume. Let's have an 'add but do not
// remove' policy for adding a new costume so items from that costume appear in the backpack, and when we take off the costume
// or switch to another, those items stay there") The costume's own things (heldAuto), each time they change (state.pack.dressed:
// the costume and its own things, as last given): a thing it puts in a hand goes into the 🎒 (once) and into that hand's slot
// (the left's 🔹, the right's 🔸), so the friend looks as the costume does. Taken off, or another put on, nothing is taken out
// of the 🎒 or the hands. Only a thing turned off in the same costume's box (the cowgirl's ➿ lasso off) leaves its slot, if it
// is still there; it stays in the 🎒. A friend saved before this gets its costume's things once. (changed() calls it, first.)
function itemsDressed() {
  const C = state.costume || {}, kind = C.kind || "none", auto = heldAuto(kind, C), P = state.pack || {};
  const key = `${kind}|${auto.L || ""}|${auto.R || ""}`;
  if (P.dressed === key) return;
  const [was, wasL, wasR] = String(P.dressed || "none||").split("|"), next = { ...P, dressed: key }, add = [];
  for (const [own, s, before] of [["L", "a", wasL], ["R", "b", wasR]]) {
    const id = auto[own];
    if (id && ITEM[id] && (was !== kind || id !== before)) { if (!packList().some(o => o.id === id) && !add.includes(id)) add.push(id); next[s] = id; }
    else if (!id && before && was === kind && next[s] === before) next[s] = "";
  }
  if (add.length) state.backpack = [...packList(), ...add.map(id => ({ id, got: Date.now(), from: "costume" }))];
  state.pack = next;
}
// a costume's thing in the 🎒 and on the floor (giftSvg): drawn as in the hand, the hand's point raised so it stands on the ground
function propGiftSvg(id) {
  const [, down] = HOLDABLES[id].ext;
  return `<g transform="scale(0.6)">${heldSvg(id, [0, -Math.max(down, 10)], "front", { WC: state.costume || {}, kb: 1, own: "L", out: 1, dir: 1 })}</g>`;
}
// (Matthew: "if the selected items are bubbles or fire, can we render a cheap animation there on the hand for a 'simmering'
// ability that's just waiting, and idling a bit (a few bubbles ... limited ..., or a small flame, similarly limited in
// animation expense)") An item in the hand, at the hand (H, the friend's units), leaning the way the hand reaches (the way
// they face in profile): the net and the can as they are swung and tipped; 🫧 a bubble wand, two bubbles at a time rising
// off its ring; 🔥 a small flame on the open palm, flickering. Each moves by a CSS animation (style.css:
// simmer-…), begun by fairyPhase where the picture's clock is, as a fairy's wings flap, so a friend drawn again goes on where
// it was: no SMIL in the friend (the speed run's checks count it costly), a fixed few shapes, nothing done a frame for them.
function itemHeldSvg(id, H, view, o) {
  const [hx, hy] = H, s = view === "side" ? (o.dir || 1) : (o.out || 1);
  const at = (x, y, inner, rot = 0) => `<g transform="translate(${f1(x)} ${f1(y)})${rot ? ` rotate(${rot})` : ""}">${inner}</g>`;
  const css = (name, dur, begin, more = "") => `style="${more}animation: ${name} ${dur}s linear ${fairyPhase(dur, begin)}s infinite"`;
  switch (id) {
    case "net": return at(hx, hy, `<g transform="scale(1.1)">${netSvg(1)}</g>`, s * 18);
    case "can": return at(hx, hy, `<g transform="scale(1.1)">${canSvg(s)}</g>`);
    // (ticket 691) the crafts, held: the balloon a little one on its string, up from the fist; the bubble one big bubble on the palm
    case "balloon": return at(hx, hy, `<path d="M0 0 Q${f1(s * 10)} -30 ${f1(s * 4)} -58" fill="none" stroke="#5e3d22" stroke-width="2"/><ellipse cx="${f1(s * 4)}" cy="-76" rx="15" ry="18" fill="#e84a3a" stroke="#a8322a" stroke-width="2"/>`);
    case "bubbleride": return at(hx, hy - 22, `<circle r="20" fill="#e0f2fe" fill-opacity="0.35" stroke="#60a5fa" stroke-width="2"/>`);
    case "bubbles": {
      // the wand, one path: a stick up and out of the fist and its ring, a soap film; and off the ring, two bubbles half a cycle
      // apart (the held items' budget: at most 5 shapes for 🫧 and 🔥 together, ticket 687's check)
      const rx = s * 18, ry = -62;
      let b = `<path d="M0 8 L${f1(rx * 0.85)} ${f1(ry + 13)} M${f1(rx - 13)} ${ry} a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0" fill="#dbeafe" fill-opacity="0.45" stroke="#7c3aed" stroke-width="3.5" stroke-linecap="round"/>`;
      for (let i = 0; i < 2; i++)
        b += `<g transform="translate(${f1(rx)} ${ry - 12})"><circle r="${4.5 + i * 1.5}" fill="#e0f2fe" fill-opacity="0.35" stroke="#60a5fa" stroke-width="1.6" opacity="0" ` +
          `${css("simmer-rise", 2.4, 1.2 * i, `--dx: ${s * (7 + 8 * i)}px; `)}/></g>`;
      return at(hx, hy, b);
    }
    case "fire": {
      // the flame on the palm, its yellow heart in it, scaled about its foot: a flicker
      const flame = `<g ${css("simmer-flicker", 0.9, 0, "transform-origin: 0 0; ")}>` +
        `<path d="M0 0 C-15 -3 -14 -24 -3 -44 C1 -31 11 -28 9 -15 C16 -20 15 -6 0 0 Z" fill="#f97316" stroke="#c2410c" stroke-width="1.5"/>` +
        `<path d="M0 -2 C-8 -4 -7 -15 -1 -27 C2 -18 7 -15 5 -9 C7 -10 7 -4 0 -2 Z" fill="#fde047"/></g>`;
      return at(hx, hy - 12, flame);
    }
    // (any other 🎒 thing: its 🎒 picture, on the open palm, standing on it; held still: its SMIL taken out (ANIMS_RE), as the
    // scenery's is on a slow computer, for no SMIL is drawn in the friend; giftSvg's held version: no glow's gradient, the
    // statue plain; at most 22 shapes, the helmet's 21: items687)
    default: return at(hx, hy - 6, `<g transform="scale(0.75)">${giftSvg(id, { held: true }).replace(ANIMS_RE, "")}</g>`);
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
  if (itemOf(id).kind === "craft") flightToggle(id);   // (ticket 691)
  else if (flight) return;   // (flying, only a craft's button does anything: landing)
  else if (itemOf(id).kind === "tool") itemToolUse(id);
  else if (id === "bubbles") blowGo();
  else if (id === "fire") fireGo();
}
// what the slots' buttons were holding, let go (a slot changed, or the screen opened)
function itemLetGo() { itemKeys.a = itemKeys.b = false; blowPad = false; firePad = false; }

// ---- the screen ----
// (the items on the screen: every ability and tool, a costume's thing once had)
const itemsShown = () => [...ITEMS.filter(([id, , , kind]) => kind !== "prop" || itemHas(id)),
  ...[...new Set(packList().map(o => o.id))].filter(id => !ITEM[id]).map(id => { const it = itemOf(id); return [id, it.icon, it.name, it.kind]; })];   // (and every other thing in the 🎒, once each)
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
    itemsAt = Math.max(0, itemsShown().findIndex(([id]) => id === itemIn("a")));
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
  const slot = ([s, a, mark]) => { const it = itemOf(itemIn(s));
    return el("div", { class: "items-slot" + (it ? "" : " empty") }, [el("span", { class: "items-mark" }, mark),
      el("span", { class: "items-slot-icon", "aria-hidden": "true" }, it ? it.icon : "·"),
      el("span", { class: "items-slot-name" }, [it ? it.name : "empty", el("span", { class: "hint" }, itemsKeyName(a))])]); };
  const tiles = itemsShown().map(([id, icon, name, kind], i) => {
    const has = itemHas(id);
    return el("div", { class: "items-tile" + (has ? "" : " missing") + (i === itemsAt ? " at" : ""), "data-item": id }, [
      el("div", { class: "items-icon", "aria-hidden": "true" }, icon),
      el("div", { class: "items-name" }, name),
      el("div", { class: "hint" }, !has ? "not found yet" : kind === "tool" ? "a tool: press to use" : kind === "craft" ? "press to fly, again to land" : kind === "prop" || kind === "thing" ? "held in the hand" : "hold to use"),
      el("div", { class: "items-pick" }, [...SLOTS.map(([s, , mark]) => el("button", { type: "button", ...(has ? {} : { disabled: "" }),
        "aria-pressed": String(itemIn(s) === id), title: `${mark}: ${name}`, onclick: () => { itemsAt = i; itemSet(s, id); } }, slotMark(mark))),
        // (ticket 691: a craft flown at once, from here)
        ...(kind === "craft" ? [el("button", { type: "button", class: "items-fly", title: `fly ${name}`, onclick: () => flightStart(id) }, "🛫 fly")] : [])])]);
  });
  itemsEl.replaceChildren(
    el("div", { class: "items-top" }, [el("h2", {}, "🎒 Your items"),
      el("div", { class: "items-backs", role: "group", "aria-label": "behind your items" }, ITEM_SCREENS.map(([k, label]) =>
        el("button", { type: "button", "aria-pressed": String(screen === k), onclick: () => { state.pack = { ...(state.pack || {}), screen: k }; changed(); itemsRender(); } }, label))),
      el("button", { type: "button", class: "items-close", onclick: () => itemsShow(false) }, "✖ back to the game")]),
    el("div", { class: "items-slots" }, SLOTS.map(slot)),
    el("p", { class: "hint" }, ["Choose what ", slotMark("🔹"), " and ", slotMark("🔸"), " do: tap ", slotMark("🔹"), " or ", slotMark("🔸"),
      " under an item. With a controller, the arrows choose an item, and the button you want it on puts it there; start shuts this."]),
    el("div", { class: "items-grid" }, tiles));
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
function itemsPick(s) { const [id] = itemsShown()[itemsAt] || []; if (id && itemHas(id) && itemIn(s) !== id) itemSet(s, id); }
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
