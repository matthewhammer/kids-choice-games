"use strict";
// (ticket 178) Part 6 of 26 of the game's script, run in order by index.html.

// ===================== COSTUMES =====================
// An animal costume: a hood with the animal's face on its brim, above the
// wearer's own face, and either a full-body suit -- fur, paws, a belly and
// a tail -- or, for the falcon, wings worn on the back and a barred tail.
// Choosing an animal dresses it in its natural colors (see set()).
const ANIMALS = {
  tiger:  { suit: true,  fur: "#e8862a", marks: "#1f1a17", belly: "#f7ead8", eyes: "#e0a800", accent: "#e89aa0", furPattern: "stripes" },
  cat:    { suit: true,  fur: "#1f1f22", marks: "#3a3a40", belly: "#2e2e33", eyes: "#c6d43a", accent: "#f4a0b0", furPattern: "none" },
  lion:   { suit: true,  fur: "#d9a441", marks: "#8a4b1c", belly: "#f1d9a8", eyes: "#c88a1e", accent: "#5a3a2a", furPattern: "none" },
  bear:   { suit: true,  fur: "#6b4226", marks: "#4a2c17", belly: "#b08458", eyes: "#2b1a10", accent: "#1d1410", furPattern: "none" },
  falcon: { suit: false, fur: "#55616d", marks: "#23282e", belly: "#f2ece0", eyes: "#1a1410", accent: "#f2c230", furPattern: "none" },
  raccoon: { suit: true, fur: "#8d9096", marks: "#26262a", belly: "#e4e1da", eyes: "#3b2a1a", accent: "#26262a", furPattern: "none" },
  bobcat: { suit: true,  fur: "#c79a68", marks: "#4b3020", belly: "#f3e6cf", eyes: "#d9a520", accent: "#d98a8a", furPattern: "spots" },
  leopard: { suit: true, fur: "#e3b04b", marks: "#2b1d12", belly: "#f7ecd3", eyes: "#9bbf3a", accent: "#c97a7a", furPattern: "rosettes", spot: "auto" },
  eagle:  { suit: false, fur: "#4a3222", marks: "#2a1a10", belly: "#ffffff", eyes: "#f2c230", accent: "#f2b705", furPattern: "none" },
  // a black jaguar: nearly black, its rosettes just showing
  jaguar: { suit: true, fur: "#1e1c22", marks: "#3d3944", belly: "#2b2830", eyes: "#d4c23a", accent: "#3a363f", furPattern: "rosettes", spot: "auto" },
  cheetah: { suit: true, fur: "#e8b54a", marks: "#1c1410", belly: "#f8eed8", eyes: "#c88a1e", accent: "#2a1d14", furPattern: "spots" },
  // a grey wolf: tall pointed ears, a bushy tail with a dark tip, claws
  wolf: { suit: true, fur: "#8b8f97", marks: "#3f4249", belly: "#e8e6e1", eyes: "#e0a020", accent: "#1d1d1f", furPattern: "none" },
  // a deer, spotted like a fawn: antlers, long ears, a short white tail,
  // hooves
  deer: { suit: true, fur: "#a8682f", marks: "#fbf3e4", belly: "#f3e3c3", eyes: "#3b2414", accent: "#2a1a10", furPattern: "spots" },
  // a whole falcon suit: feathers all over, wings on the arms, talons
  falconsuit: { suit: true, fur: "#55616d", marks: "#23282e", belly: "#f2ece0", eyes: "#1a1410", accent: "#f2c230", furPattern: "none" },
  // and a bald eagle's: dark brown feathers, white head and tail
  eaglesuit: { suit: true, fur: "#4a3222", marks: "#2a1a10", belly: "#ffffff", eyes: "#f2c230", accent: "#f2b705", furPattern: "none" },
};
// cats (pointed ears, a triangle nose) and birds (no suit: wings and a tail)
const FELINE = { cat: 1, tiger: 1, bobcat: 1, leopard: 1, cheetah: 1, jaguar: 1 };
const BIRDS = { falcon: 1, eagle: 1, falconsuit: 1, eaglesuit: 1 };
// the bird suits: feathers all over, wings on the arms, talons
const BIRD_SUIT = { falconsuit: 1, eaglesuit: 1 };
// the bald eagle's head (hat or suit): white, with its beak
const eagleHead = kind => kind === "eagle" || kind === "eaglesuit";
const isBird = kind => !!BIRDS[kind];
// the falcon's head (hat or suit): its hood, moustache and face
const falconHead = kind => kind === "falcon" || kind === "falconsuit";
const lookOf = kind => { const { suit, ...look } = ANIMALS[kind]; return look; };
const costumeOn = () => (ANIMALS[state.costume.kind] ? state.costume : null);
// (ticket 433, Matthew: "monk/dryad costume with hooded cloak, and a staff (optional, like how the witch has an optional
// broom)") A CLOTH HOOD, its colour, while one is up (the monk's or the dryad's cloak): over the hair, framing the face. In the
// round head's units (stretched with the head, as hair is), on the animal hood's frame (hoodGeom): its back, behind the head,
// a cowl with a peak at the top and its drape down onto the shoulders; its front, the same shape with the face's opening cut
// out (from the forehead, at 64, to below the chin; in profile toward the face), drawn over the face but under its features;
// from behind, closed over the head.
const clothHood = () => state.costume.kind === "monk" && state.costume.hoodUp !== false ? (state.costume.monkCloak || "#6b4a2b") : null;
// (ticket 435) the knight's helmet: the trap room's great helm, worn (helmetSvg in js/13-castle-rooms-and-map.js)
// The knight's arms, as a tabard, a shield and the emblem show them: its two colours laid out (quartered, halves, plain) in a
// shape, clipped to it, and the emblem in its middle; HERALDRY's emblems in a unit box about (0, 0), 30 across.
const EMBLEMS = {
  none: () => "",
  cross: c => `<path d="M-4 -15 H4 V-4 H15 V4 H4 V15 H-4 V4 H-15 V-4 H-4 Z" fill="${c}"/>`,
  chevron: c => `<path d="M-16 8 L0 -8 L16 8 L16 16 L0 0 L-16 16 Z" fill="${c}"/>`,
  falcon: c => `<path d="M0 -6 Q-8 -14 -18 -10 Q-12 -6 -10 0 Q-6 2 -3 0 L-5 12 L0 8 L5 12 L3 0 Q6 2 10 0 Q12 -6 18 -10 Q8 -14 0 -6 Z" fill="${c}"/><circle cx="0" cy="-9" r="3" fill="${c}"/>`,
  crown: c => `<path d="M-14 10 L-14 -6 L-7 2 L0 -12 L7 2 L14 -6 L14 10 Z" fill="${c}"/>`,
};
// (the fields only as big as the shape, about its middle [cx, cy] and `half` out: a clip does not shrink what is measured)
function armsFill(id, shape, WC, mirror = false, emblemAt = null, k = 1, mid = emblemAt || [0, 0], half = 160) {
  const A = WC.knightA || "#2f6db5", B = WC.knightB || "#f4f1ea", lay = WC.tabardLayout || "quartered";
  const [l, r] = mirror ? [B, A] : [A, B], [cx, cy] = mid, x0 = cx - half, y0 = cy - half, H = 2 * half;
  const R = (x, y, w, h, c) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${c}"/>`;
  const fields = lay === "plain" ? R(x0, y0, H, H, A)
    : lay === "halves" ? R(x0, y0, half, H, l) + R(cx, y0, half, H, r)
    : R(x0, y0, half, half, l) + R(cx, y0, half, half, r) + R(x0, cy, half, half, r) + R(cx, cy, half, half, l);
  const em = emblemAt && EMBLEMS[WC.emblem] ? `<g transform="translate(${f1(emblemAt[0])} ${f1(emblemAt[1])}) scale(${k.toFixed(3)})"><circle r="19" fill="${lay === "plain" ? B : "#e0b030"}" opacity="0.95"/>${EMBLEMS[WC.emblem](lay === "plain" ? A : "#7a1f2b")}</g>` : "";
  return `<clipPath id="${id}"><path d="${shape}"/></clipPath><g clip-path="url(#${id})">${fields}</g>${WC.emblem && WC.emblem !== "none" ? em : ""}<path d="${shape}" fill="none" stroke="#3b3b44" stroke-width="2.5" stroke-linejoin="round"/>`;
}
// (ticket 447, Matthew: "the monk/druid hood doesn't read that way in L and R poses --- due to the placement of the point -- it
// should come out like a larger triangle, sticking away from the face, not in the middle of the crown, on top") In profile its
// peak is a larger triangle out behind the head, pointing away from the face, the cowl round the crown and down the back.
function clothHoodPath(F, dir = 0) {
  const { cy, ry } = hoodGeom(F), top = cy - ry, bot = cy + ry, b = dir ? -dir * 14 : 0, p = dir ? -dir * 10 : 0;
  if (dir) { const X = d => f1(100 + dir * d);
    return `M${X(112)} ${f1(cy)} Q${X(116)} ${f1(top + 4)} ${X(40)} ${f1(top - 8)} Q${X(-40)} ${f1(top - 12)} ${X(-84)} ${f1(top + 6)} ` +
           `L${X(-168)} ${f1(top + 62)} L${X(-104)} ${f1(top + 70)} Q${X(-118)} ${f1(cy + 20)} ${X(-124)} ${f1(bot)} L${X(-140)} ${f1(bot + 36)} ` +
           `L${X(126)} ${f1(bot + 36)} Q${X(118)} ${f1(bot)} ${X(112)} ${f1(cy)} Z`; }
  return `M${f1(100 + b - 110)} ${f1(cy)} Q${f1(100 + b - 112)} ${f1(top + 8)} ${f1(100 + b - 40)} ${f1(top - 8)} Q${f1(100 + p - 6)} ${f1(top - 16)} ${f1(100 + p)} ${f1(top - 36)} ` +
         `Q${f1(100 + p + 6)} ${f1(top - 16)} ${f1(100 + b + 40)} ${f1(top - 8)} Q${f1(100 + b + 112)} ${f1(top + 8)} ${f1(100 + b + 110)} ${f1(cy)} ` +
         `Q${f1(100 + b + 116)} ${f1(bot)} ${f1(100 + b + 136)} ${f1(bot + 36)} L${f1(100 + b - 136)} ${f1(bot + 36)} Q${f1(100 + b - 116)} ${f1(bot)} ${f1(100 + b - 110)} ${f1(cy)} Z`;
}
function clothHoodOpening(F, dir = 0) {
  const top = 64, bot = headChin(F) + 12, cy = (top + bot) / 2, ry = (bot - top) / 2, cx = 100 + dir * 40, rx = dir ? 62 : 72;
  return `M${f1(cx - rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx + rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 1 0 ${f1(cx - rx)} ${f1(cy)} Z`;
}
const clothHoodBack = (F, c, dir = 0) => `<path d="${clothHoodPath(F, dir)}" fill="${darker(c)}" stroke="${darker(darker(c))}" stroke-width="4" stroke-linejoin="round"/>`;
const clothHoodFront = (F, c, dir = 0) => `<path d="${clothHoodPath(F, dir)} ${clothHoodOpening(F, dir)}" fill="${c}" fill-rule="evenodd" stroke="${darker(c)}" stroke-width="4" stroke-linejoin="round"/>` +
  `<path d="${clothHoodOpening(F, dir)}" fill="none" stroke="${darker(darker(c))}" stroke-width="3" opacity="0.6"/>`;
// (ticket 447, Matthew: "the away facing view also looks wrong, like L and R --- the peak should come toward us now that the face
// is facing away") From behind, the hood's top is round and its peak comes toward us: a pointed flap over the back of the head,
// its tip down over the shoulders, shaded on one side.
function clothHoodAway(F, c) {
  const { cy, ry } = hoodGeom(F), top = cy - ry, bot = cy + ry, ln = darker(c);
  const round = `M-10 ${f1(cy)} Q-12 ${f1(top + 8)} 60 ${f1(top - 8)} Q100 ${f1(top - 16)} 140 ${f1(top - 8)} Q212 ${f1(top + 8)} 210 ${f1(cy)} ` +
                `Q216 ${f1(bot)} 236 ${f1(bot + 36)} L-36 ${f1(bot + 36)} Q-16 ${f1(bot)} -10 ${f1(cy)} Z`;
  const flap = `M54 ${f1(top + 18)} Q100 ${f1(top + 2)} 146 ${f1(top + 18)} L108 ${f1(bot + 52)} Q100 ${f1(bot + 62)} 92 ${f1(bot + 52)} Z`;
  return `<path d="${round}" fill="${c}" stroke="${ln}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path data-hood="closed" d="${flap}" fill="${mix(c, "#000000", 0.08)}" stroke="${ln}" stroke-width="3.5" stroke-linejoin="round"/>` +
    `<path d="M100 ${f1(top + 10)} L100 ${f1(bot + 54)} L146 ${f1(top + 18)} Z" fill="#000000" opacity="0.1"/>`;
}

// Fur: the fur color with little tufts, and stripes, spots or patches in
// the markings color. Feathers: the feather color with curved bars.
// A rosette's middle: "auto" is a warm brown mixed into the fur, "off"
// leaves the fur showing through (just the broken ring), or any color.
const rosetteMiddle = C =>
  !C.spot || C.spot === "auto" ? mix(C.fur, "#7a4a10", 0.35) : C.spot === "off" ? "none" : C.spot;
function furDefs(C, kind) {
  if (BIRD_SUIT[kind])   // feathers: the color with curved bars, all over
    return `<pattern id="pat-fur" width="24" height="12" patternUnits="userSpaceOnUse">` +
      `<rect width="24" height="12" fill="${C.fur}"/>` +
      `<path d="M0 9 Q6 6 12 9 Q18 12 24 9" stroke="${C.marks}" stroke-width="2.5" fill="none"/></pattern>` +
      `<pattern id="pat-bars" width="24" height="12" patternUnits="userSpaceOnUse">` +
      `<rect width="24" height="12" fill="${C.fur}"/>` +
      `<path d="M0 9 Q6 6 12 9 Q18 12 24 9" stroke="${C.marks}" stroke-width="2.5" fill="none"/></pattern>`;
  const tuft = mix(C.fur, "#000000", 0.3), m = C.marks;
  const marks = {
    // (stripes are not tiled: wrapStripes draws them on each part)
    spots:   `<circle cx="10" cy="10" r="4.5" fill="${m}"/><circle cx="30" cy="28" r="4" fill="${m}"/><circle cx="28" cy="8" r="2.5" fill="${m}"/>`,
    patches: `<ellipse cx="12" cy="14" rx="11" ry="8" fill="${m}"/><ellipse cx="34" cy="34" rx="9" ry="7" fill="${m}"/>`,
    // a leopard's rosettes: broken rings with a darker middle
    rosettes: [[11, 12, 5.5], [31, 30, 5]].map(([x, y, r]) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${rosetteMiddle(C)}" stroke="${m}" stroke-width="2.4" stroke-dasharray="5 2.6"/>`).join("") +
      `<circle cx="31" cy="9" r="2.2" fill="${m}"/><circle cx="9" cy="31" r="2" fill="${m}"/>`,
  }[C.furPattern] || "";
  return `<pattern id="pat-fur" width="40" height="40" patternUnits="userSpaceOnUse">` +
    `<rect width="40" height="40" fill="${C.fur}"/>${marks}` +
    `<path d="M5 22 q2 -4 4 0 M24 16 q2 -4 4 0 M14 36 q2 -4 4 0 M33 5 q2 -4 4 0" stroke="${tuft}" ` +
    `stroke-width="1.3" fill="none" opacity="0.7"/></pattern>` +
    `<pattern id="pat-bars" width="24" height="12" patternUnits="userSpaceOnUse">` +
    `<rect width="24" height="12" fill="${C.fur}"/>` +
    `<path d="M0 9 Q6 6 12 9 Q18 12 24 9" stroke="${m}" stroke-width="2.5" fill="none"/></pattern>`;
}

// WRAPPED STRIPES, a striped suit's (a tiger's, as Daniel Tiger wears
// them): each stripe comes round from the back, over a part's outline,
// and tapers to a point before the part's middle -- never across it.
const wrapStripes = C => C && C.furPattern === "stripes" && ANIMALS[state.costume.kind].suit &&
                         !BIRD_SUIT[state.costume.kind];
// One stripe from b (on or past the outline) to its tip t, w wide where it
// starts, bowed a little.
function stripe(b, t, w, color) {
  const dx = t[0] - b[0], dy = t[1] - b[1], d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d * w / 2, ny = dx / d * w / 2, mx = (b[0] + t[0]) / 2, my = (b[1] + t[1]) / 2;
  return `<path d="M${f1(b[0] + nx)} ${f1(b[1] + ny)} Q${f1(mx + nx * 0.9)} ${f1(my + ny * 0.9)} ${f1(t[0])} ${f1(t[1])} ` +
         `Q${f1(mx - nx * 0.4)} ${f1(my - ny * 0.4)} ${f1(b[0] - nx)} ${f1(b[1] - ny)} Z" fill="${color}"/>`;
}
// Stripes on a limb, a band W wide from A to E: in from both edges every
// so often, from `from` along it, each ending short of the middle line by
// 15% of the half-width (a limb is narrow: shorter, they barely showed),
// and a little further along than it starts, so the two sides make a
// shallow V pointing down the limb.
function limbStripes(A, E, W, color, id, from = 0) {
  const dx = E[0] - A[0], dy = E[1] - A[1], len = Math.hypot(dx, dy);
  if (len < 1) return "";
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux, h = W / 2, gap = Math.max(18, W * 0.9);
  const at = (t, k) => [A[0] + ux * t + nx * k, A[1] + uy * t + ny * k];
  const band = [at(0, h), at(len, h), at(len, -h), at(0, -h)];
  let s = `<clipPath id="${id}"><polygon points="${pts(band)}"/></clipPath><g clip-path="url(#${id})">`;
  for (let t = from + gap * 0.6; t < len - gap * 0.4; t += gap)
    for (const side of [1, -1]) s += stripe(at(t, side * (h + 4)), at(t + gap * 0.2, side * h * 0.15), gap * 0.5, color);
  return s + `</g>`;
}
// Stripes on the body, in from both sides, every 24 down it, sloping a
// little down toward the middle; the belly, drawn over them, hides their
// tips, so they end before the middle.
function torsoStripes(outline, w, L, color) {
  let s = `<clipPath id="torso-stripes"><polygon points="${pts(outline)}"/></clipPath><g clip-path="url(#torso-stripes)">`;
  for (let y = 14; y < L - 10; y += 24)
    for (const side of [1, -1]) s += stripe([side * (w + 10), y], [side * w * 0.42, y + 7], 10, color);
  return s + `</g>`;
}
// Stripes on the legs (the suit's legs, one shape from the waist): on
// each leg, in from its outer edge and, below the crotch, its inner one,
// each ending short of the leg's middle line by 30% of the way.
function legStripes(outline, hw, fx, half, L, LL, crotch, color) {
  let s = `<clipPath id="leg-stripes"><polygon points="${pts(outline)}"/></clipPath><g clip-path="url(#leg-stripes)">`;
  for (let y = L + 14; y < L + LL - 8; y += 24)
    for (const side of [1, -1]) {
      const xo = hw + (fx + half - hw) * (y - (L - 10)) / (LL + 10);
      const xi = y > L + crotch ? (fx - half) * (y - (L + crotch)) / (LL - crotch) : null;
      const c = xi === null ? xo * 0.5 : (xo + xi) / 2;
      s += stripe([side * (xo + 8), y], [side * (c + (xo - c) * 0.3), y + 6], 10, color);
      // (starting in the gap between the legs, never in the other leg)
      if (xi !== null && c - xi > 8)
        s += stripe([side * Math.max(xi - 8, xi * 0.5), y], [side * (c - (c - xi) * 0.3), y + 6], 10, color);
    }
  return s + `</g>`;
}

// THE HOOD, in the round head's units (it stretches with the face, as hair
// does): behind the head, the hood and its ears (and a lion's mane); over
// the forehead, the brim, with the animal's face on it.
// It hugs the head as drawn: 32.6 above the crown and 27.4 below the chin
// (which an open mouth moves down), at any height. Drawn inside the
// face's stretch, so its ends are placed where they land once stretched.
function hoodGeom(F) {
  const H = F.faceH / 100, Hs = headH(F);
  const top = HEAD_C - 80 - 32.6 / Hs, bottom = HEAD_C + (80 * H + headDrop(F) + 27.4) / Hs;
  return { cy: (top + bottom) / 2, rx: 106, ry: (bottom - top) / 2 };
}
function hoodEllipse(F) {
  const { cy, rx, ry } = hoodGeom(F);
  return `cx="100" cy="${f1(cy)}" rx="${rx}" ry="${f1(ry)}"`;
}
function hoodBack(C, kind, F) {
  const HOOD = hoodEllipse(F);
  // a bald eagle's head is white
  const line = darker(C.fur), fill = eagleHead(kind) ? C.belly : ANIMALS[kind].suit ? "url(#pat-fur)" : C.fur;
  let s = "";
  if (kind === "lion") {
    const pts = [];
    for (let i = 0; i < 48; i++) {
      // the head's outline plus the mane's own 50-70, however tall the
      // head (placed where it lands once stretched)
      const t = i * Math.PI / 24, r = i % 2 ? 130 : 150, H = F.faceH / 100, Hs = headH(F);
      const grown = Math.sin(t) > 0 ? headDrop(F) : eyeLift(F);
      pts.push([100 + r * Math.cos(t), HEAD_C + ((80 * H + grown) * Math.sin(t) + (r - 80) * Math.sin(t)) / Hs]);
    }
    s += poly(pts, C.marks, darker(C.marks), 3);
  }
  for (const side of [-1, 1]) {
    const x = 100 + side * 68;
    if (kind === "wolf") {
      // tall pointed ears, pale inside
      s += poly([[100 + side * 30, 22], [100 + side * 80, -78], [100 + side * 96, 34]], C.fur, line, 3) +
           poly([[100 + side * 46, 16], [100 + side * 78, -54], [100 + side * 88, 24]], C.belly, "none", 0);
    } else if (kind === "deer") {
      // antlers first, their bases under the hood, then long ears out to
      // the side, pale inside
      const beam = `M${100 + side * 38} 14 Q${100 + side * 52} -50 ${100 + side * 96} -104 ` +
                   `M${100 + side * 48} -34 Q${100 + side * 30} -64 ${100 + side * 34} -94 ` +
                   `M${100 + side * 68} -66 Q${100 + side * 60} -100 ${100 + side * 66} -126 ` +
                   `M${100 + side * 84} -88 Q${100 + side * 104} -96 ${100 + side * 118} -86`;
      s += `<path d="${beam}" fill="none" stroke="#7a5a36" stroke-width="12" stroke-linecap="round"/>` +
           `<path d="${beam}" fill="none" stroke="#d9c29a" stroke-width="7" stroke-linecap="round"/>`;
      for (const [rx, ry, fill, w] of [[36, 15, C.fur, 3], [24, 8, C.belly, 0]])
        s += `<ellipse cx="${100 + side * 100}" cy="34" rx="${rx}" ry="${ry}" transform="rotate(${side * -22} ${100 + side * 100} 34)" ` +
             `fill="${fill}"${w ? ` stroke="${line}" stroke-width="${w}"` : ""}/>`;
    } else if (kind === "cat" || kind === "bobcat") {
      s += poly([[100 + side * 36, 16], [100 + side * 92, -46], [100 + side * 96, 40]], C.fur, line, 3) +
           poly([[100 + side * 50, 12], [100 + side * 86, -30], [100 + side * 88, 26]],
                kind === "bobcat" ? C.belly : C.accent, "none", 0);
      if (kind === "bobcat")  // the black tufts on a bobcat's ear tips
        s += poly([[100 + side * 88, -38], [100 + side * 96, -74], [100 + side * 95, -36]], C.marks, C.marks, 2);
    } else if (kind === "raccoon")
      // smaller, rounder ears with pale rims
      s += `<ellipse cx="${100 + side * 70}" cy="2" rx="22" ry="28" transform="rotate(${side * 25} ${100 + side * 70} 2)" ` +
           `fill="${C.belly}" stroke="${line}" stroke-width="3"/>` +
           `<ellipse cx="${100 + side * 70}" cy="6" rx="13" ry="18" transform="rotate(${side * 25} ${100 + side * 70} 6)" fill="${C.fur}"/>`;
    else if (!isBird(kind)) {
      const r = kind === "lion" ? 20 : 25;
      s += `<circle cx="${x}" cy="20" r="${r}" fill="${C.fur}" stroke="${line}" stroke-width="3"/>` +
           `<circle cx="${x}" cy="22" r="${r * 0.5}" fill="${kind === "tiger" ? "#ffffff" : C.belly}"/>`;
    }
  }
  s += `<ellipse ${HOOD} fill="${fill}" stroke="${line}" stroke-width="4"/>`;
  // wrapped stripes on the hood's sides, below the brim: in from the
  // edge toward the face, which covers their tips
  if (wrapStripes(C)) {
    const { cy, rx, ry } = hoodGeom(F);
    s += `<clipPath id="hood-stripes"><ellipse ${HOOD}/></clipPath><g clip-path="url(#hood-stripes)">`;
    for (const deg of [-12, 12, 36, 60])
      for (const side of [1, -1]) {
        const t = deg * Math.PI / 180, c = Math.cos(t) * side, sn = Math.sin(t);
        s += stripe([100 + (rx + 6) * c, cy + (ry + 6) * sn], [100 + (rx - 26) * c, cy + (ry - 26) * sn], 11, C.marks);
      }
    s += `</g>`;
  }
  if (falconHead(kind))  // the peregrine's dark "moustache" down each cheek
    for (const side of [-1, 1])
      s += `<path d="M${100 + side * 84} 52 Q${100 + side * 96} 96 ${100 + side * 84} 132 ` +
           `Q${100 + side * 72} 96 ${100 + side * 72} 52 Z" fill="${C.marks}"/>`;
  return s;
}
// (ticket 124) A hood in profile, in its own units, over the head: the fur
// over the top (the brim, down to its line at 54) and over the back of the
// head behind the face (from 18 behind its middle), the face showing in
// front of that; on the brim, the animal's face on our side only, carried
// to the front as the friend's own features are.
function hoodSide(C, kind, F, dir) {
  const { cy, rx, ry } = hoodGeom(F), line = darker(C.fur), HOOD = hoodEllipse(F);
  const fill = falconHead(kind) ? C.marks : eagleHead(kind) ? C.belly : ANIMALS[kind].suit ? "url(#pat-fur)" : C.fur;
  // (the face's opening: an oval at the front, from under the brim's line
  // down past the chin, and from behind the ear out past the hood's front,
  // so the hood is open there; its edge outlined where it crosses the hood)
  const fx = 100 + dir * 0.48 * rx, fcy = (54 + cy + ry) / 2 + 4, frx = 0.8 * rx, fry = (cy + ry - 54) / 2 + 6;
  const hole = `cx="${f1(fx)}" cy="${f1(fcy)}" rx="${f1(frx)}" ry="${f1(fry)}"`;
  // (ticket 151: a clip, the mask's white square with the oval cut out, not
  // a mask, which the browser draws again offscreen on every frame)
  const cap = `<defs><clipPath id="hood-open"><path clip-rule="evenodd" d="M-500 -500 H700 V700 H-500 Z M${f1(fx - frx)} ${f1(fcy)} a${f1(frx)} ${f1(fry)} 0 1 0 ${f1(2 * frx)} 0 a${f1(frx)} ${f1(fry)} 0 1 0 ${f1(-2 * frx)} 0 Z"/></clipPath>` +
              `<clipPath id="hood-whole"><ellipse ${HOOD}/></clipPath></defs>` +
              `<ellipse ${HOOD} fill="${fill}" stroke="${line}" stroke-width="4" clip-path="url(#hood-open)"/>` +
              `<ellipse ${hole} fill="none" stroke="${line}" stroke-width="4" clip-path="url(#hood-whole)"/>`;
  // (on the brim, the animal's face on our side only, a little to the front)
  const all = hoodFront(C, kind, F), cut = all.indexOf("/>", all.indexOf("<line ")) + 2, features = all.slice(cut);
  return cap + `<defs><clipPath id="hood-near"><rect x="${dir > 0 ? 100 : -4000}" y="-4000" width="4100" height="8000"/></clipPath></defs>` +
         `<g transform="translate(${f1(dir * 12)} 0)"><g clip-path="url(#hood-near)">${features}</g></g>`;
}
function hoodFront(C, kind, F) {
  const HOOD = hoodEllipse(F);
  const brimFill = falconHead(kind) ? C.marks : eagleHead(kind) ? C.belly : ANIMALS[kind].suit ? "url(#pat-fur)" : C.fur;
  let s = `<ellipse ${HOOD} fill="${brimFill}" stroke="${darker(C.fur)}" stroke-width="4" clip-path="url(#hood-brim)"/>` +
          `<line x1="0" y1="54" x2="200" y2="54" stroke="${darker(C.fur)}" stroke-width="4" clip-path="url(#hood-inside)"/>`;
  const shine = (x, y, r) => `<circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="#ffffff"/>`;
  if (falconHead(kind)) {
    for (const x of [76, 124])
      s += `<circle cx="${x}" cy="26" r="12" fill="${C.accent}"/>` +
           `<circle cx="${x}" cy="26" r="8" fill="${C.eyes}"/>` + shine(x, 26, 8);
    s += `<path d="M92 31 Q100 26 108 31 L107 36 L93 36 Z" fill="${C.accent}"/>` +
         `<path d="M93 36 L107 36 Q109 47 100 58 Q101 47 93 36 Z" fill="#59636e" stroke="#2a2f35" stroke-width="1.5"/>`;
    return s;
  }
  if (eagleHead(kind)) {
    // a stern brow, yellow eyes, and a big hooked yellow beak
    for (const [x, side] of [[78, -1], [122, 1]])
      s += `<circle cx="${x}" cy="26" r="9" fill="${C.eyes}" stroke="#4a3a20" stroke-width="2"/>` +
           `<circle cx="${x}" cy="26" r="4" fill="#111"/>` + shine(x, 26, 6) +
           `<path d="M${x - side * 14} 14 L${x + side * 10} 19" stroke="#8a7a60" stroke-width="3" stroke-linecap="round"/>`;
    s += `<path d="M86 34 Q100 26 114 34 Q116 50 104 62 Q100 64 98 58 Q104 52 100 46 Q93 44 86 34 Z" ` +
         `fill="${C.accent}" stroke="${darker(C.accent)}" stroke-width="2" stroke-linejoin="round"/>`;
    return s;
  }
  if (kind === "raccoon")  // the bandit mask
    s += `<path d="M58 22 Q66 10 86 16 Q100 22 114 16 Q134 10 142 22 Q138 38 120 36 Q106 34 100 30 ` +
         `Q94 34 80 36 Q62 38 58 22 Z" fill="${C.marks}"/>`;
  if (kind === "cheetah")  // the cheetah's black "tear" lines, eyes to mouth
    s += `<path d="M84 31 Q83 40 89 48 M116 31 Q117 40 111 48" stroke="${C.marks}" stroke-width="3.2" ` +
         `fill="none" stroke-linecap="round"/>`;
  if (kind === "leopard")  // a few small spots on the brow
    s += [[86, 6, 2.6], [100, 2, 3], [114, 6, 2.6], [70, 12, 2.2], [130, 12, 2.2]].map(([x, y, r]) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.marks}"/>`).join("");
  if (kind === "tiger")
    s += `<path d="M90 2 L100 14 L110 2 M66 10 L80 18 M134 10 L120 18 M60 24 L74 28 M140 24 L126 28" ` +
         `stroke="${C.marks}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  for (const x of [78, 122]) {
    s += `<ellipse cx="${x}" cy="24" rx="9" ry="8" fill="${C.eyes}" stroke="${kind === "raccoon" ? "#cfcfcf" : "#111"}" stroke-width="2"/>`;
    s += kind === "cat" ? `<ellipse cx="${x}" cy="24" rx="2.2" ry="7" fill="#111"/>`
                        : `<circle cx="${x}" cy="24" r="3.6" fill="#111"/>`;
    s += shine(x, 24, 8);
  }
  if (kind === "bear")
    s += `<ellipse cx="100" cy="42" rx="18" ry="11" fill="${C.belly}"/>`;
  else
    s += `<circle cx="92" cy="44" r="8" fill="${C.belly}"/><circle cx="108" cy="44" r="8" fill="${C.belly}"/>`;
  s += FELINE[kind]
    ? `<path d="M94 35 L106 35 L100 42 Z" fill="${C.accent}"/>`
    : `<path d="M91 34 Q100 31 109 34 Q105 43 100 44 Q95 43 91 34 Z" fill="${C.accent}"/>`;
  if (kind !== "bear" && kind !== "deer") {
    const wc = kind === "cat" || kind === "raccoon" || kind === "jaguar" ? "#e8e8e8" : "#222";
    s += `<path d="M86 44 L60 40 M86 47 L60 50 M114 44 L140 40 M114 47 L140 50" stroke="${wc}" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  return s;
}

// THE SUIT'S EXTRAS, in body units: a tail out to the side (drawn behind
// the body), and the falcon's wings and fanned tail.
function tailSvg(C, kind, hw, L) {
  const line = darker(C.fur), x0 = hw * 0.55, y0 = L + 5;
  if (kind === "bear")
    return `<circle cx="${f1(hw + 4)}" cy="${f1(L - 14)}" r="17" fill="url(#pat-fur)" stroke="${line}" stroke-width="3"/>`;
  if (kind === "deer")  // a short white tail, flicked up
    return `<ellipse cx="${f1(hw + 8)}" cy="${f1(L - 16)}" rx="11" ry="17" transform="rotate(35 ${f1(hw + 8)} ${f1(L - 16)})" ` +
           `fill="${C.belly}" stroke="${line}" stroke-width="3"/>`;
  if (kind === "bobcat")  // a short stubby tail with a black tip
    return `<ellipse cx="${f1(hw + 10)}" cy="${f1(L - 12)}" rx="13" ry="20" transform="rotate(30 ${f1(hw + 10)} ${f1(L - 12)})" ` +
           `fill="url(#pat-fur)" stroke="${line}" stroke-width="3"/>` +
           `<ellipse cx="${f1(hw + 19)}" cy="${f1(L - 27)}" rx="7" ry="8" transform="rotate(30 ${f1(hw + 19)} ${f1(L - 27)})" fill="${C.marks}"/>`;
  const d = kind === "cat" || kind === "leopard" || kind === "cheetah" || kind === "jaguar"
    ? `M${f1(x0)} ${f1(y0)} C${f1(hw + 80)} ${f1(L + 30)} ${f1(hw + 110)} ${f1(L - 30)} ${f1(hw + 70)} ${f1(L - 110)}`
    : `M${f1(x0)} ${f1(y0)} C${f1(hw + 70)} ${f1(L + 20)} ${f1(hw + 95)} ${f1(L + 90)} ${f1(hw + 60)} ${f1(L + 150)}`;
  const wd = { tiger: 16, cat: 11, lion: 10, raccoon: 22, leopard: 13, cheetah: 12, jaguar: 14, wolf: 26 }[kind];
  const path = (stroke, width, extra = "") =>
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
  let s = path(line, wd + 5) + path(C.fur, wd);
  if (kind === "tiger") s += path(C.marks, wd, `stroke-dasharray="7 11"`);
  if (kind === "raccoon") s += path(C.marks, wd, `stroke-dasharray="11 11"`);   // the rings
  if (kind === "leopard" || kind === "cheetah" || kind === "jaguar") s += path(C.marks, wd * 0.45, `stroke-dasharray="1 13"`);  // spots
  if (kind === "lion")
    s += `<circle cx="${f1(hw + 60)}" cy="${f1(L + 156)}" r="14" fill="${C.marks}" stroke="${darker(C.marks)}" stroke-width="2"/>`;
  if (kind === "wolf")  // the bushy tail's dark tip
    s += `<path d="${d}" fill="none" stroke="${C.marks}" stroke-width="${wd}" stroke-linecap="round" pathLength="100" ` +
         `stroke-dasharray="0 78 22"/>`;
  return s;
}
// A falcon suit's wing, built on one arm: the arm runs along its leading
// edge, from the shoulder A to the hand H, and flight feathers trail on
// the side that faces down, longest in the middle, with long primaries
// past the hand. It moves with the arm, as the arms slider moves it.
function armWing(C, { A, H, side }, armW, edge = 1) {
  const len = Math.hypot(H[0] - A[0], H[1] - A[1]) || 1;
  const ux = (H[0] - A[0]) / len, uy = (H[1] - A[1]) / len;
  // the trailing side: whichever perpendicular points more downward (or,
  // for a level arm, away from the body)
  let nx = -uy, ny = ux;
  if (ny < -0.15 || (Math.abs(ny) <= 0.15 && nx * side < 0)) { nx = -nx; ny = -ny; }
  const Q = (t, d) => [A[0] + ux * t + nx * d, A[1] + uy * t + ny * d];
  // (ticket 124: seen from the side, `edge` below 1, the wing is turned
  // nearly edge on: its feathers' depth and its reach past the hand less)
  const lead = armW / 2 + 6, ext = len * 0.75 * (edge < 1 ? 0.55 : 1), total = len + ext, D = (len * 0.55 + 26) * edge;
  const depth = t => 12 * Math.max(edge, 0.5) + D * Math.pow(Math.sin(Math.PI * Math.min(1, t / total)), 0.8);
  const k = 8, feathers = [];
  for (let i = 0; i <= k; i++) {
    const t = total * (1 - i / k) * 0.97;
    feathers.push(Q(t, depth(t)), Q(Math.max(0, t - total / k / 2), depth(t) * 0.78));
  }
  const outline = [Q(-4, -lead), Q(len * 0.55, -lead - 4), Q(len, -lead + 1), Q(total, 2), ...feathers, Q(0, lead + 8)];
  let s = poly(outline, "url(#pat-fur)", darker(C.fur), 3);
  // the coverts along the arm, darker, and the flight feathers' shafts
  s += poly([Q(-2, -lead + 2), Q(len * 0.55, -lead - 1), Q(len, -lead + 3), Q(len + ext * 0.35, 4), Q(len, lead + 6),
             Q(0, lead + 6)], mix(C.fur, C.marks, 0.45), "none", 0);
  for (let i = 0; i < k; i++) {
    const t = total * (1 - i / k) * 0.97;
    const [x1, y1] = Q(Math.min(t, len), lead + 4), [x2, y2] = Q(t, depth(t) * 0.92);
    s += `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${C.marks}" stroke-width="2" stroke-linecap="round"/>`;
  }
  return s;
}
function falconWings(C, w, fill = "url(#pat-bars)") {
  let s = "";
  for (const side of [-1, 1]) {
    const P = [[18, -2], [w + 20, -62], [w + 95, -88], [w + 175, -70], [w + 140, -40], [w + 120, -8],
               [w + 92, 16], [w + 60, 34], [w + 28, 46], [20, 44]].map(([x, y]) => [side * x, y]);
    s += poly(P, fill, darker(C.fur), 3);
    for (const [x1, y1, x2, y2] of [[w + 60, -40, w + 168, -68], [w + 50, -25, w + 138, -40],
                                    [w + 42, -10, w + 118, -8], [w + 34, 6, w + 90, 16], [w + 26, 20, w + 58, 34]])
      s += `<line x1="${side * x1}" y1="${y1}" x2="${side * x2}" y2="${y2}" stroke="${C.marks}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  return s;
}
function falconTail(C, hw, L, LL, fill = "url(#pat-bars)") {
  const tl = L + LL * 0.62;
  const fan = [[-hw * 0.45, L - 20], [-(hw + 28), tl - 10], [-hw * 0.5, tl + 8], [0, tl + 12],
               [hw * 0.5, tl + 8], [hw + 28, tl - 10], [hw * 0.45, L - 20]];
  return poly(fan, fill, darker(fill.startsWith("url") ? C.fur : fill), 3) +
    `<polyline points="${pts(fan.slice(1, 6))}" fill="none" stroke="${C.belly}" stroke-width="6" stroke-linejoin="round"/>`;
}

// (ticket 431) THE GNOMES (inspired by the gnome man and woman of Huygen and Poortvliet's book, 1977, drawn in the game's own
// plain way: shapes and patterns, no illustration). The man: a long-sleeved tunic over trousers, belted, its skirt below the
// belt; felt boots; a beard and a moustache. The woman: a white blouse, a laced bodice, an apron, and a skirt of upright
// stripes. Both: the tall pointed hat (gnomeHat). GNOME_STRIPES: the skirt's stripes after its own color.
const GNOME_STRIPES = ["#d2382b", "#2e7d32", "#e3b72f", "#7b3f8c", "#2f6db5"];
const GNOME_CLOTH = "#f7f4ec";
// (the man's beard and the wizard's: the friend's own, from 💇 Hair since ticket 442: beardSvg in js/04-hair.js)
// The woman's bodice, in body units: over the blouse from the chest down to the waist, its sides the torso's, laced up the
// front (white cross-lacing; edge on in profile, at the front); from behind, its back, plain.
function gnomeBodice(WC, w, L, dir, away) {
  const c = WC.gnomeBodice || "#d2382b", ln = darker(c), top = 0.3 * L;
  const body = `<path d="M${f1(-(w - 2))} ${f1(top)} Q0 ${f1(top + 10)} ${f1(w - 2)} ${f1(top)} L${f1(w + 2)} ${f1(L)} L${f1(-(w + 2))} ${f1(L)} Z" fill="${c}" stroke="${ln}" stroke-width="2.5" stroke-linejoin="round"/>`;
  if (away) return body;
  const x = dir ? dir * (w - 8) : 0, n = 4, lace = [];
  for (let i = 0; i < n; i++) { const y0 = top + 10 + i * (L - top - 18) / n, y1 = y0 + (L - top - 18) / n;
    lace.push(dir ? `M${f1(x)} ${f1(y0)} L${f1(x)} ${f1(y1)}` : `M-9 ${f1(y0)} L9 ${f1(y1)} M9 ${f1(y0)} L-9 ${f1(y1)}`); }
  return body + `<path d="${lace.join(" ")}" fill="none" stroke="${GNOME_CLOTH}" stroke-width="2.5" stroke-linecap="round"/>`;
}
// Her apron, in body units: from the waist down the front of the skirt, a little narrower than the hips and not so long as
// the skirt, with its band round the waist; in profile, a strip at the front; from behind, only the band and its bow.
function gnomeApron(w, L, hem, dir, away) {
  const ln = "#cfc8b8", band = `<rect x="${f1(-(w + 3))}" y="${f1(L - 8)}" width="${f1(2 * w + 6)}" height="9" fill="${GNOME_CLOTH}" stroke="${ln}" stroke-width="2"/>`;
  if (away) return band + `<path d="M0 ${f1(L - 4)} q-16 -12 -22 2 q8 10 22 -2 q16 -12 22 2 q-8 10 -22 -2 M-2 ${f1(L - 2)} l-8 22 M2 ${f1(L - 2)} l8 22" fill="${GNOME_CLOTH}" stroke="${ln}" stroke-width="2"/>`;
  const a = dir ? [dir * (w - 18), dir * (w + 6)] : [-(w - 6), w - 6], b = L + 0.82 * (hem - L);
  const [x0, x1] = [Math.min(...a), Math.max(...a)];
  return `<path d="M${f1(x0)} ${f1(L)} L${f1(x1)} ${f1(L)} L${f1(x1 + (dir ? 0 : 6))} ${f1(b)} Q${f1((x0 + x1) / 2)} ${f1(b + 6)} ${f1(x0 - (dir ? 0 : 6))} ${f1(b)} Z" fill="${GNOME_CLOTH}" stroke="${ln}" stroke-width="2.5" stroke-linejoin="round"/>` + band;
}
// (ticket 288, Matthew: "new costumes for the ocean and the deep sea. A snorkel, the most minimal change to the friend's
// appearance. An air tank and a face mask, for scuba, separate from the scuba suit. A scuba suit, modern and stylish.
// An antique deep-sea diving suit, made of metal and glass, with an air hose reaching up to the top of the scene") The
// two suits are costumes (state.costume.kind "scuba", "diver"); the snorkel, the mask and the tank are gear, worn with
// any of them but the diver's helmet (costume.snorkel, .mask, .tank). What goes on the head is in the face's units (x
// 100 the middle; facing us, from behind, or in profile, dir -1 or 1); the rest in the friend's own.
const DIVE_GLASS = "#cfeefc";
const ellD = (x, y, a, b) => `M${f1(x - a)} ${f1(y)} a${f1(a)} ${f1(b)} 0 1 0 ${f1(2 * a)} 0 a${f1(a)} ${f1(b)} 0 1 0 ${f1(-2 * a)} 0 Z`;
const diveHead = F => { const top = headCrown(F), chin = headChin(F); return { LY: faceLayout(F), hw: 80 * headWidth(F), top, chin, cy: (top + chin) / 2, ry: (chin - top) / 2 }; };
// the antique helmet: a round brass (or copper, or steel) bell round the whole head, the front port's glass over the face
// (a hole in the metal, so the face shows through, faintly blue, its rim bolted), a small port at each side, a shine,
// and the air hose's fitting on top toward the back; from behind, all metal. fitting: where the hose goes in
function diverHelmet(F, WC, dir, away) {
  const H = diveHead(F), m = WC.diverMetal || "#c9a227", dk = darker(m), lt = mix(m, "#ffffff", 0.45);
  const rx = H.hw * 1.2 + 10, ry = H.ry * 1.16 + 10, cx = 100, cy = H.cy;
  // (in profile, the port over the face's front, which the face's features are drawn toward, seen at a slant)
  const pr = 0.62 * H.hw + 6, pa = dir ? 0.4 * pr : pr, px = dir ? cx + dir * 0.6 * H.hw : cx, py = H.LY.eyeY + 14;
  let t = `<path data-dive="helmet" d="${ellD(cx, cy, rx, ry)} ${away ? "" : ellD(px, py, pa, pr)}" fill="${m}" fill-rule="evenodd" stroke="${dk}" stroke-width="5"/>` +
          `<path d="M${f1(cx - 0.78 * rx)} ${f1(cy - 0.3 * ry)} Q${f1(cx - 0.6 * rx)} ${f1(cy - 0.84 * ry)} ${f1(cx - 0.05 * rx)} ${f1(cy - 0.93 * ry)}" fill="none" stroke="${lt}" stroke-width="8" stroke-linecap="round" opacity="0.8"/>`;
  if (!away) {
    t += `<path d="${ellD(px, py, pa, pr)}" fill="${DIVE_GLASS}" fill-opacity="0.2" stroke="${dk}" stroke-width="10"/><path d="${ellD(px, py, pa, pr)}" fill="none" stroke="${m}" stroke-width="4"/>`;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; t += `<circle cx="${f1(px + Math.cos(a) * (pa + 3))}" cy="${f1(py + Math.sin(a) * (pr + 3))}" r="3.4" fill="${lt}" stroke="${dk}" stroke-width="1.5"/>`; }
  }
  // (Matthew: "Adding more details -- like rivits and seams in the metal") its seams, riveted: one over the crown (down
  // to the port facing us; down the back from behind; down the side in profile), and the raised neck ring round its foot
  const rivet = (x, y, r = 2.6) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${lt}" stroke="${dk}" stroke-width="1.2"/>`;
  const along = (P, n) => Array.from({ length: n }, (_, i) => { const u = (i + 0.5) / n, [a, b, c] = P;
    return rivet((1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * b[0] + u * u * c[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * b[1] + u * u * c[1]); }).join("");
  const seam = (P, n) => `<path data-dive="seam" d="M${f1(P[0][0])} ${f1(P[0][1])} Q${f1(P[1][0])} ${f1(P[1][1])} ${f1(P[2][0])} ${f1(P[2][1])}" fill="none" stroke="${dk}" stroke-width="2.5"/>` + along(P, n);
  const crown = dir ? [[cx + dir * 0.15 * rx, cy - ry], [cx - dir * 0.55 * rx, cy - 0.2 * ry], [cx - dir * 0.45 * rx, cy + 0.62 * ry]]
              : away ? [[cx, cy - ry], [cx, cy], [cx, cy + 0.66 * ry]] : [[cx, cy - ry], [cx, (cy - ry + py - pr) / 2], [cx, py - pr - 9]];
  t += seam(crown, away ? 6 : dir ? 5 : 3);
  const ring = [[cx - 0.93 * rx, cy + 0.5 * ry], [cx, cy + 1.02 * ry], [cx + 0.93 * rx, cy + 0.5 * ry]];
  t += `<path data-dive="ring" d="M${f1(ring[0][0])} ${f1(ring[0][1])} Q${f1(ring[1][0])} ${f1(ring[1][1])} ${f1(ring[2][0])} ${f1(ring[2][1])}" fill="none" stroke="${dk}" stroke-width="12" stroke-linecap="round"/>` +
       `<path d="M${f1(ring[0][0])} ${f1(ring[0][1])} Q${f1(ring[1][0])} ${f1(ring[1][1])} ${f1(ring[2][0])} ${f1(ring[2][1])}" fill="none" stroke="${m}" stroke-width="7" stroke-linecap="round"/>` + along(ring, 9);
  const port = (x, y, a, b) => `<path d="${ellD(x, y, a, b)}" fill="${DIVE_GLASS}" fill-opacity="0.55" stroke="${dk}" stroke-width="6"/>` +
    Array.from({ length: 6 }, (_, i) => rivet(x + Math.cos(i * Math.PI / 3) * (a + 5), y + Math.sin(i * Math.PI / 3) * (b + 5), 2)).join("");
  if (dir) t += port(cx - dir * 0.15 * rx, cy - 0.05 * ry, 0.22 * rx, 0.22 * rx);
  else if (!away) t += port(cx - 0.9 * rx, cy, 0.1 * rx, 0.22 * ry) + port(cx + 0.9 * rx, cy, 0.1 * rx, 0.22 * ry);
  const fx = cx - (dir || 0) * 0.4 * rx, fy = cy - ry + 6;
  t += `<rect x="${f1(fx - 11)}" y="${f1(fy - 20)}" width="22" height="24" rx="4" fill="${m}" stroke="${dk}" stroke-width="3"/>`;
  // (where it leaks, when it does: the fitting, and its side, the exhaust valve)
  return { svg: t, fitting: [fx, fy - 20], exhaust: [cx + (dir ? -dir * 0.92 : 0.92) * rx, cy + 0.1 * ry] };
}
// its corselet: the brass collar on the shoulders the helmet sits on, a bolt at each side and the middle, in the friend's units
function diverCorselet(WC, w, dir) {
  const m = WC.diverMetal || "#c9a227", dk = darker(m), lt = mix(m, "#ffffff", 0.45), x = dir ? 0.95 * w : w + 8;
  // (a seam set in from its edge, studded with rivets all along the edge, and a wing nut at each shoulder)
  const edge = u => [u * x, 30 + 16 * (1 - u * u)];
  return `<path data-dive="corselet" d="M${f1(-x)} 30 Q${f1(-x)} -26 0 -32 Q${f1(x)} -26 ${f1(x)} 30 Q0 46 ${f1(-x)} 30 Z" fill="${m}" stroke="${dk}" stroke-width="4"/>` +
    `<path d="M${f1(-x + 9)} 26 Q${f1(-x + 9)} -16 0 -22 Q${f1(x - 9)} -16 ${f1(x - 9)} 26" fill="none" stroke="${dk}" stroke-width="2" opacity="0.7"/>` +
    Array.from({ length: 9 }, (_, i) => { const [ex, ey] = edge(-0.9 + 1.8 * i / 8); return `<circle cx="${f1(ex)}" cy="${f1(ey - 7)}" r="3" fill="${lt}" stroke="${dk}" stroke-width="1.2"/>`; }).join("") +
    [-1, 1].map(sd => `<path d="M${f1(sd * 0.62 * x - 7)} -6 L${f1(sd * 0.62 * x + 7)} -6 L${f1(sd * 0.62 * x + 3)} 0 L${f1(sd * 0.62 * x - 3)} 0 Z" fill="${lt}" stroke="${dk}" stroke-width="1.5"/>`).join("");
}
// its air hose: one path from the helmet's fitting (a) up to the top of the scene (b), swaying slowly (a single path, as
// the cauldron's light fumes are, and still on a slow computer)
function diverHose(WC, a, b, still) {
  const c = WC.hoseColor || "#4b5563", [ax, ay] = a, [bx, by] = b, h = ay - by;
  const d = k => `M${f1(ax)} ${f1(ay)} C${f1(ax - 40 * k)} ${f1(ay - 0.35 * h)} ${f1(bx + 60 * k)} ${f1(by + 0.45 * h)} ${f1(bx)} ${f1(by)}`;
  return `<path data-hose="1" d="${d(1)}" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round">` +
    (still ? "" : `<animate attributeName="d" values="${d(1)};${d(-0.7)};${d(1)}" dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>`) + `</path>`;
}
// a face mask: its lens over the eyes and the top of the nose, its frame and nose pocket, and the strap round the head;
// in profile, the lens at the face's front and the strap back over the head; from behind, the strap
function maskSvg(F, WC, dir, away) {
  const H = diveHead(F), c = WC.maskColor || "#0ea5e9", dk = darker(c), y = H.LY.eyeY, [xl, xr] = acrossAt(headPoints(F), y);
  const strap = (x0, x1) => `<line x1="${f1(x0)}" y1="${f1(y)}" x2="${f1(x1)}" y2="${f1(y)}" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`;
  if (away) return `<path data-dive="mask" d="M${f1(xl - 3)} ${f1(y)} Q100 ${f1(y + 10)} ${f1(xr + 3)} ${f1(y)}" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`;
  const top = y - eyeHalfH(F) - 14, bot = y + eyeHalfH(F) + 20;
  if (dir) { const x0 = 100 + dir * (profileEdge(F) + 6), x1 = x0 - dir * 38;
    return strap(x1, 100 - dir * H.hw) + `<rect data-dive="mask" x="${f1(Math.min(x0, x1))}" y="${f1(top)}" width="38" height="${f1(bot - top)}" rx="12" fill="${DIVE_GLASS}" fill-opacity="0.45" stroke="${c}" stroke-width="7"/>`; }
  const hx = H.LY.eyeDX + eyeHalfW(F) + 12;
  return strap(xl - 2, 100 - hx) + strap(100 + hx, xr + 2) +
    `<rect data-dive="mask" x="${f1(100 - hx)}" y="${f1(top)}" width="${f1(2 * hx)}" height="${f1(bot - top)}" rx="18" fill="${DIVE_GLASS}" fill-opacity="0.35" stroke="${c}" stroke-width="7"/>` +
    `<path d="M${f1(100 - 15)} ${f1(bot - 3)} L${f1(100 - 10)} ${f1(bot + 16)} L${f1(100 + 10)} ${f1(bot + 16)} L${f1(100 + 15)} ${f1(bot - 3)} Z" fill="${c}" stroke="${dk}" stroke-width="2"/>`;
}
// a snorkel: a J of tube from the mouth, round to the side of the head and up past its top, a band at its tip; on the
// friend's left (our right, facing us), on our side in profile
function snorkelSvg(F, WC, dir, away) {
  const H = diveHead(F), c = WC.snorkelColor || "#facc15", dk = darker(c), mY = H.LY.mouthY, up = H.top - 36;
  const d = away ? `M${f1(100 - H.hw - 8)} ${f1(mY - 20)} L${f1(100 - H.hw - 8)} ${f1(up)}`
          : dir ? `M${f1(100 + dir * (profileEdge(F) - 4))} ${f1(mY + 4)} Q${f1(100 + dir * 0.1 * H.hw)} ${f1(mY + 18)} ${f1(100 - dir * 0.05 * H.hw)} ${f1(mY - 30)} L${f1(100 - dir * 0.1 * H.hw)} ${f1(up)}`
          : `M${f1(100 + 16)} ${f1(mY + 4)} Q${f1(100 + H.hw + 12)} ${f1(mY + 16)} ${f1(100 + H.hw + 12)} ${f1(mY - 26)} L${f1(100 + H.hw + 12)} ${f1(up)}`;
  const tip = away ? [100 - H.hw - 8, up] : dir ? [100 - dir * 0.1 * H.hw, up] : [100 + H.hw + 12, up];
  return `<path d="${d}" fill="none" stroke="${dk}" stroke-width="16" stroke-linecap="round"/><path data-dive="snorkel" d="${d}" fill="none" stroke="${c}" stroke-width="11" stroke-linecap="round"/>` +
    `<rect x="${f1(tip[0] - 9)}" y="${f1(tip[1] - 6)}" width="18" height="10" rx="3" fill="${dk}"/>` +
    (away ? "" : `<ellipse cx="${f1(dir ? 100 + dir * (profileEdge(F) - 2) : 100 + 10)}" cy="${f1(mY + 4)}" rx="9" ry="7" fill="#1f2937"/>`);
}
// an air tank on the back: a cylinder down from the shoulders, its valve on top; facing us, behind them (its straps over
// the shirt: tankStraps); in profile, behind the back; from behind, over it
function tankSvg(WC, w, L, dir) {
  const c = WC.tankColor || "#facc15", dk = darker(c), lt = mix(c, "#ffffff", 0.5), tw = Math.max(24, 0.4 * w), x = dir ? -dir * (0.5 * w + 0.9 * tw) : 0;
  const top = -12, bot = Math.max(top + 3 * tw, 0.78 * L);
  return `<rect data-dive="tank" x="${f1(x - tw)}" y="${f1(top)}" width="${f1(2 * tw)}" height="${f1(bot - top)}" rx="${f1(tw)}" fill="${c}" stroke="${dk}" stroke-width="3"/>` +
    `<line x1="${f1(x - 0.45 * tw)}" y1="${f1(top + 0.8 * tw)}" x2="${f1(x - 0.45 * tw)}" y2="${f1(bot - 0.8 * tw)}" stroke="${lt}" stroke-width="5" stroke-linecap="round"/>` +
    `<rect x="${f1(x - 7)}" y="${f1(top - 20)}" width="14" height="22" rx="3" fill="#374151"/><circle cx="${f1(x + (dir || 1) * 10)}" cy="${f1(top - 12)}" r="6" fill="#111827"/>`;
}
function tankStraps(w, L, dir, away) {
  // (grey webbing, edged darker: it shows on a dark suit as on a light shirt)
  const s = "#9ca3af", band = `<rect x="${f1(-(w + 3))}" y="${f1(0.7 * L - 6)}" width="${f1(2 * w + 6)}" height="12" fill="${s}" stroke="#4b5563" stroke-width="2"/>`;
  if (away) return band;
  if (dir) return `<line x1="${f1(-dir * 0.15 * w)}" y1="-16" x2="${f1(-dir * 0.15 * w)}" y2="${f1(0.7 * L)}" stroke="${s}" stroke-width="10"/>` + band;
  return [1, -1].map(sd => `<line x1="${f1(sd * 0.55 * w)}" y1="-18" x2="${f1(sd * 0.45 * w)}" y2="${f1(0.7 * L)}" stroke="${s}" stroke-width="10"/>`).join("") + band +
    `<rect x="-9" y="${f1(0.7 * L - 9)}" width="18" height="18" rx="3" fill="#e5e7eb" stroke="#4b5563" stroke-width="2"/>`;
}
// a scuba suit's stripes: a bright yoke over the shoulders and chest (or back), a zip down the back, and a stripe down
// the outside of each leg (scubaLegs)
function scubaYoke(WC, w, nw, L, dir, away) {
  const a = WC.scubaAccent || "#14b8a6", x = w + 3;
  return `<path data-dive="yoke" d="M${f1(-x)} -8 L${f1(-nw)} -20 L${f1(nw)} -20 L${f1(x)} -8 L${f1(w)} 24 L0 ${f1(dir ? 24 : 46)} L${f1(-w)} 24 Z" fill="${a}" stroke="${darker(a)}" stroke-width="2"/>` +
    (away ? `<line x1="0" y1="-18" x2="0" y2="${f1(L - 6)}" stroke="#9ca3af" stroke-width="3" stroke-dasharray="4 3"/>` : "");
}

// (ticket 288, Matthew: "we should have a param for \"leaks\" -- the default is fine (zero) and up to 100, it should be
// more and more bubbly, like the bubble machine we added earlier tonight") A diving suit's leaks: bubbles streaming out
// of where it leaks (leakPts, from the drawing: the old helmet's fitting and exhaust and its collar's edges; a scuba
// suit's shoulders and knees, its tank's valve and mouthpiece, a snorkel's tip), "🫧 leaks" of 100 at most a second
// eighteen, the bigger the more it leaks; each rising, wobbling, and fading after a few seconds or past the top. In a
// layer of their own over the scene (#leak-bubbles), as the bubble makers' are; still while the picture is held still.
let leakPts = null;
const leakSim = { list: [], acc: 0, raf: 0, last: 0, n: 0, layer: null };
function leakRun() {
  if (!leakPts) { if (leakSim.raf) cancelAnimationFrame(leakSim.raf); leakSim.raf = 0; for (const b of leakSim.list) b.el.remove(); leakSim.list = []; if (leakSim.layer) { leakSim.layer.remove(); leakSim.layer = null; } return; }
  let L = leakSim.layer;
  if (!L) { L = leakSim.layer = document.createElementNS("http://www.w3.org/2000/svg", "g"); L.id = "leak-bubbles"; L.setAttribute("pointer-events", "none"); leakSim.list = []; }
  if (L.parentNode !== pic || pic.lastChild !== L) pic.append(L);
  if (!leakSim.raf) { leakSim.last = 0; leakSim.raf = requestAnimationFrame(leakTick); }
}
function leakTick(t) {
  leakSim.raf = 0;
  const P = leakPts, layer = leakSim.layer, F = sceneFrame;
  if (!P || !layer) return;
  const dt = leakSim.last ? Math.min(0.05, Math.max(0, (t - leakSim.last) / 1000)) : 0; leakSim.last = t;
  if (stillAt !== null) { leakSim.raf = requestAnimationFrame(leakTick); return; }
  const L = leakSim.list, k = P.k, rnd = () => { const v = Math.sin(++leakSim.n * 12.9898) * 43758.5453; return v - Math.floor(v); };
  leakSim.acc += 18 * P.amt * dt;
  while (leakSim.acc >= 1) {
    leakSim.acc -= 1;
    const [x, y] = P.pts[Math.floor(rnd() * P.pts.length)], r = Math.max(1.5, k * (5 + (6 + 16 * P.amt) * rnd()));
    const el = document.createElementNS("http://www.w3.org/2000/svg", "g");
    el.innerHTML = bubbleSvg(0, 0, r, { color: "#dff6ff", shine: 0.85 }); layer.append(el);
    L.push({ x, y, vx: (rnd() - 0.5) * 60 * k, vy: -(60 + 90 * rnd()) * k, r, el, born: t, life: 2000 + 2600 * rnd(), ph: rnd() * 6.28 });
    if (L.length > 90) { const o = L.shift(); o.el.remove(); }
  }
  for (let j = L.length - 1; j >= 0; j--) {
    const b = L[j], age = t - b.born;
    if (age > b.life || b.y < F.top - 30) { b.el.remove(); L.splice(j, 1); continue; }
    b.vy -= 70 * k * dt; b.vx *= Math.pow(0.4, dt); b.x += (b.vx + Math.sin(t / 1000 * 4 + b.ph) * 26 * k) * dt; b.y += b.vy * dt;
    b.el.setAttribute("transform", `translate(${f1(b.x)} ${f1(b.y)})`); b.el.setAttribute("opacity", Math.min(1, (b.life - age) / 500, age / 120).toFixed(2));
  }
  leakSim.raf = requestAnimationFrame(leakTick);
}
