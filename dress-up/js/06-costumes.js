"use strict";
// (ticket 178) Part 6 of 25 of the game's script, run in order by index.html.

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
