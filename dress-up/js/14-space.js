"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 798) Part 14b of the game's script, run in order by index.html: 🚀 space, N's theme for a world.

// ===================== SPACE =====================
// (ticket 798, for N; Matthew: "N wants a new theme for a world --- space. Some backgrounds in space: starfield (controlled by
// a seed, plus other params); space ship (like a single room, inspired by star trek bridge ...); alien planet in the distance,
// as an object in the starfield, e.g., outside of the shapeship windshield; alien planet, with alien rocks, plants, and
// people ...; space station, with various kinds of rooms") The ✨ starfield first: deep space, a nebula's glow if chosen, the
// stars (starsSvg, as the camp site's night sky draws them, with its ⭐ settings, placed by 🎲 the space seed), a faint band
// of the galaxy, a few far galaxies, and a planet in the distance (alienPlanetSvg) with its moons. The friend floats.

// the nebulas: each two or three glows, as colors
const SPACE_NEBULAS = [["none", "⬛ none"], ["violet", "🟣 violet"], ["teal", "🩵 teal"], ["rose", "🌸 rose"], ["gold", "🟡 gold"], ["rainbow", "🌈 rainbow"]];
const NEBULA_COLORS = { violet: ["#7b3fd1", "#c04ac9", "#3a5bd6"], teal: ["#1aa6a0", "#2f7fd9", "#5bd6a6"], rose: ["#e0567f", "#ff8fb1", "#9a3fd1"],
                        gold: ["#e0a12a", "#ff6f3c", "#ffd36b"], rainbow: ["#ff3b6b", "#ffb22e", "#3ad16b", "#2fa8ff", "#a34bff"] };
// the planets one can see far off: each its colors and its kind of surface
const SPACE_PLANETS = [["none", "none"], ["ringed", "🪐 ringed, violet"], ["ocean", "🌊 ocean and islands"], ["lava", "🌋 lava"], ["ice", "🧊 ice"],
                       ["gas", "🟠 a banded giant"], ["rainbow", "🌈 rainbow-striped"], ["jungle", "🌿 jungle green"]];
const PLANET_LOOKS = {
  ringed: { base: "#8a5cd6", band: "#b48cf0", dark: "#3a1f6e", ring: "#e7c9ff", bands: 7 },
  ocean: { base: "#2a7fd0", land: "#3fae5a", cloud: "#ffffff", dark: "#0d2f5c" },
  lava: { base: "#3a1410", glow: "#ff6a1f", hot: "#ffd23f", dark: "#160605" },
  ice: { base: "#cfe9f7", band: "#a9d3ec", dark: "#4d7ea3", crater: "#9cc6e0" },
  gas: { base: "#e6a35a", band: "#f6dcae", band2: "#b9663a", spot: "#c7422d", dark: "#5a2c14", bands: 9 },
  rainbow: { base: "#ff3b6b", bandsOf: ["#ff3b6b", "#ff8a2e", "#ffd52e", "#3ad16b", "#2fa8ff", "#5b5bff", "#b24bff"], dark: "#2a1040" },
  jungle: { base: "#2f8f3a", land: "#1d6b2a", cloud: "#eafff0", water: "#2a9fb0", dark: "#0c3315" },
};

// a planet: a ball lit from the upper left, its surface its look's (bands, lands and clouds, cracks of lava, craters), its night
// side in shadow, and a ring if it has one, half behind it and half in front; cx, cy its middle, r its radius
function alienPlanetSvg(look, cx, cy, r, R, id) {
  const L = PLANET_LOOKS[look]; if (!L) return "";
  const clip = `${id}-clip`, ball = `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}"/>`;
  let surf = "";
  const bands = (cols, n, wav) => [...Array(n)].map((_, i) => { const y = cy - r + (2 * r) * (i + 0.5) / n, h = 2 * r / n * (0.55 + 0.5 * R(i, 9801));
    const w = wav * r * (R(i, 9802) - 0.5);
    return `<path d="M${f1(cx - r * 1.2)} ${f1(y - h / 2)} Q${f1(cx)} ${f1(y - h / 2 + w)} ${f1(cx + r * 1.2)} ${f1(y - h / 2)} L${f1(cx + r * 1.2)} ${f1(y + h / 2)} Q${f1(cx)} ${f1(y + h / 2 + w)} ${f1(cx - r * 1.2)} ${f1(y + h / 2)} Z" fill="${cols[i % cols.length]}" opacity="${(0.55 + 0.35 * R(i, 9803)).toFixed(2)}"/>`; }).join("");
  const blobs = (fill, n, s, seed, op = 1) => [...Array(n)].map((_, i) => { const a = R(i, seed) * 6.283, d = r * Math.sqrt(R(i, seed + 1)) * 0.9, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.85;
    const rx = r * s * (0.5 + R(i, seed + 2)), ry = rx * (0.45 + 0.4 * R(i, seed + 3));
    return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" transform="rotate(${Math.round(360 * R(i, seed + 4))} ${f1(x)} ${f1(y)})" fill="${fill}" opacity="${op}"/>`; }).join("");
  if (look === "ringed") surf = bands([L.band, L.base, "#a070e0"], L.bands, 0.3);
  else if (look === "gas") surf = bands([L.band, L.base, L.band2], L.bands, 0.25) + `<ellipse cx="${f1(cx + r * 0.3)}" cy="${f1(cy + r * 0.25)}" rx="${f1(r * 0.24)}" ry="${f1(r * 0.13)}" fill="${L.spot}" opacity="0.85"/>`;
  else if (look === "rainbow") surf = bands(L.bandsOf, 7, 0.35);
  else if (look === "ocean") surf = blobs(L.land, 7, 0.28, 9811) + blobs(L.cloud, 9, 0.22, 9821, 0.75);
  else if (look === "jungle") surf = blobs(L.water, 5, 0.22, 9831) + blobs(L.land, 9, 0.2, 9841) + blobs(L.cloud, 6, 0.18, 9851, 0.6);
  else if (look === "ice") surf = bands([L.band, L.base], 5, 0.2) + [...Array(7)].map((_, i) => { const a = R(i, 9861) * 6.283, d = r * 0.8 * Math.sqrt(R(i, 9862)), cr = r * (0.06 + 0.1 * R(i, 9863));
    return `<circle cx="${f1(cx + Math.cos(a) * d)}" cy="${f1(cy + Math.sin(a) * d)}" r="${f1(cr)}" fill="none" stroke="${L.crater}" stroke-width="${f1(cr * 0.35)}"/>`; }).join("");
  else if (look === "lava") surf = [...Array(11)].map((_, i) => { let x = cx - r + 2 * r * R(i, 9871), y = cy - r + 2 * r * R(i, 9872), d = `M${f1(x)} ${f1(y)}`;
    for (let j = 0; j < 4; j++) { x += r * 0.3 * (R(i * 7 + j, 9873) - 0.5); y += r * 0.3 * (R(i * 7 + j, 9874) - 0.3); d += ` L${f1(x)} ${f1(y)}`; }
    return `<path d="${d}" fill="none" stroke="${i % 3 ? L.glow : L.hot}" stroke-width="${f1(r * (0.03 + 0.03 * R(i, 9875)))}" stroke-linecap="round" stroke-linejoin="round"/>`; }).join("");
  // (the ring: its far half before the ball, its near half after it, a tilted ellipse, its gap)
  const ring = L.ring ? (half => `<path d="M${f1(cx - r * 2)} ${f1(cy)} A${f1(r * 2)} ${f1(r * 0.55)} 0 0 ${half} ${f1(cx + r * 2)} ${f1(cy)}" fill="none" stroke="${L.ring}" stroke-width="${f1(r * 0.22)}" opacity="0.75"/>` +
    `<path d="M${f1(cx - r * 1.62)} ${f1(cy)} A${f1(r * 1.62)} ${f1(r * 0.44)} 0 0 ${half} ${f1(cx + r * 1.62)} ${f1(cy)}" fill="none" stroke="${L.ring}" stroke-width="${f1(r * 0.08)}" opacity="0.5"/>`) : null;
  const tilt = `rotate(-14 ${f1(cx)} ${f1(cy)})`;
  return `<defs><clipPath id="${clip}">${ball}</clipPath>` +
    `<radialGradient id="${id}-lit" cx="0.32" cy="0.3" r="0.85"><stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/>` +
    `<stop offset="0.75" stop-color="${L.dark}" stop-opacity="0.45"/><stop offset="1" stop-color="#000000" stop-opacity="0.85"/></radialGradient>` +
    `<radialGradient id="${id}-air" r="0.5"><stop offset="0.82" stop-color="${L.base}" stop-opacity="0"/><stop offset="0.92" stop-color="${L.base}" stop-opacity="0.35"/><stop offset="1" stop-color="${L.base}" stop-opacity="0"/></radialGradient></defs>` +
    (ring ? `<g transform="${tilt}">${ring(1)}</g>` : "") +
    `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r * 1.1)}" fill="url(#${id}-air)"/>` +
    `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${L.base}"/><g clip-path="url(#${clip})">${surf}</g>` +
    `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="url(#${id}-lit)"/>` +
    (ring ? `<g transform="${tilt}">${ring(0)}</g>` : "");
}

// a few small moons round a planet, grey and cratered, lit as it is
function spaceMoonsSvg(n, cx, cy, r, R, id) {
  let t = `<defs><radialGradient id="${id}" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#f1f1f4"/><stop offset="0.6" stop-color="#a9abb6"/><stop offset="1" stop-color="#3b3d48"/></radialGradient></defs>`;
  for (let i = 0; i < n; i++) {
    const a = -0.4 + 2.3 * i + 0.8 * R(i, 9881), d = r * (1.7 + 0.9 * R(i, 9882)), mr = r * (0.1 + 0.1 * R(i, 9883));
    t += `<circle cx="${f1(cx + Math.cos(a) * d)}" cy="${f1(cy + Math.sin(a) * d * 0.7)}" r="${f1(mr)}" fill="url(#${id})"/>`;
  }
  return t;
}

// the ✨ starfield
function starfieldScene(c) {
  const { x0, y0, x1, y1, W, H, k, pad, R, all, o } = c;
  const seed = Math.max(1, Math.round(o.spaceSeed ?? 1)), Rs = (i, s) => R(i, s + 7919 * (seed % 9973));
  const nebula = NEBULA_COLORS[o.spaceNebula] ? o.spaceNebula : "none";
  // deep space, the galaxy's faint band across it, and the nebula's glows
  let s = SEP + part("starfield-sky", [c.F, nebula, seed], () => {
    const cols = NEBULA_COLORS[nebula] || [];
    const glows = cols.map((col, i) => { const x = x0 + W * (0.15 + 0.7 * Rs(i, 9701)), y = y0 + H * (0.15 + 0.55 * Rs(i, 9702)), rx = W * (0.22 + 0.2 * Rs(i, 9703)), ry = rx * (0.4 + 0.35 * Rs(i, 9704));
      return `<radialGradient id="bg-nebula-${i}"><stop offset="0" stop-color="${col}" stop-opacity="0.42"/><stop offset="0.55" stop-color="${col}" stop-opacity="0.14"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>` +
        `\u0002<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" transform="rotate(${Math.round(-30 + 60 * Rs(i, 9705))} ${f1(x)} ${f1(y)})" fill="url(#bg-nebula-${i})"/>`; });
    const band = `<radialGradient id="bg-milky"><stop offset="0" stop-color="#cfd8ff" stop-opacity="0.1"/><stop offset="0.6" stop-color="#cfd8ff" stop-opacity="0.04"/><stop offset="1" stop-color="#cfd8ff" stop-opacity="0"/></radialGradient>`;
    const galaxies = [0, 1, 2].map(i => { const x = x0 + W * Rs(i, 9711), y = y0 + H * 0.8 * Rs(i, 9712), gr = (6 + 8 * Rs(i, 9713)) * k;
      return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(gr)}" ry="${f1(gr * 0.38)}" transform="rotate(${Math.round(180 * Rs(i, 9714))} ${f1(x)} ${f1(y)})" fill="url(#bg-galaxy)"/>`; }).join("");
    return `<defs><radialGradient id="bg-space" cx="0.5" cy="0.4" r="0.8"><stop offset="0" stop-color="#121a3a"/><stop offset="1" stop-color="#03040c"/></radialGradient>${band}` +
      `<radialGradient id="bg-galaxy"><stop offset="0" stop-color="#fff6e0" stop-opacity="0.8"/><stop offset="0.4" stop-color="#c9c2ff" stop-opacity="0.35"/><stop offset="1" stop-color="#c9c2ff" stop-opacity="0"/></radialGradient>` +
      glows.map(g => g.split("\u0002")[0]).join("") + `</defs>` + all("url(#bg-space)") +
      // (the galaxy's band: a long soft glow across the sky, no edge to it)
      `<ellipse cx="${f1(x0 + W / 2)}" cy="${f1(y0 + H * 0.45)}" rx="${f1(W * 0.85)}" ry="${f1(H * 0.2)}" transform="rotate(${Math.round(-18 - 14 * Rs(0, 9706))} ${f1(x0 + W / 2)} ${f1(y0 + H * 0.45)})" fill="url(#bg-milky)"/>` +
      glows.map(g => g.split("\u0002")[1]).join("") + galaxies;
  });
  // the stars: how many as 🌟 says, placed by the seed, drawn as the camp site's (its ⭐ settings: shape, size, brightness,
  // twinkle with the quick LFO)
  const n = Math.max(20, Math.min(1500, Math.round(o.spaceStars ?? 700)));
  s += SEP + part("starfield-stars", [c.F, seed, n, o.starShape, o.starSize, o.starBright, o.starTwinkle, sceneLfoKey(o, "fast")], () =>
    starsSvg(o, n, x0 - pad, x1 + pad, y0 - pad, y1 + pad, k, Rs, 7101));
  // the planet in the distance, and its moons
  const look = PLANET_LOOKS[o.spacePlanet] ? o.spacePlanet : "none";
  if (look !== "none") {
    const size = Math.max(5, Math.min(100, o.spacePlanetSize ?? 34)) / 100, at = Math.max(0, Math.min(100, o.spacePlanetX ?? 72)) / 100;
    const moons = Math.max(0, Math.min(4, Math.round(o.spaceMoons ?? 2)));
    s += SEP + part("starfield-planet", [c.F, look, size, at, moons, seed], () => {
      const r = H * 0.3 * size, cx = x0 + W * (0.12 + 0.76 * at), cy = y0 + H * 0.3;
      return spaceMoonsSvg(moons, cx, cy, r, Rs, "bg-space-moon") + alienPlanetSvg(look, cx, cy, r, Rs, "bg-space-planet");
    });
  }
  return s;
}
Object.assign(SCENES, { starfield: starfieldScene });

// ===================== THE STARSHIP'S BRIDGE =====================
// (ticket 798, for N; Matthew: "space ship (like a single room, inspired by star trek bridge, with seats facing the 'back
// wall' of the room, which has a 'wind shield' looking out into space. Captains, chair, and consoles around with places for
// others to sit and monitor screens with buttons underneath"; "alien planet in the distance ... outside of the shapeship
// windshield") A room seen from its back, as the dining room is: the back wall mostly windshield, looking out on the
// starfield as ✨'s settings make it (its seed, stars, nebula, planet and moons, the same view as the starfield's); a monitor
// screen on each side of it, buttons under each; a console along the wall under the windshield; a ceiling of light strips;
// the deck. In front, facing the windshield: the captain's chair in the middle, and a console on each side with its chair.
// The three chairs are seats; the friend sits turned to one side, as in a chair that swivels (there is no sitting seen from
// behind). The buttons blink, and the screens' traces run, with the quick LFO.
const bridgeFloor = c => c.g - 120 * c.k;
const BRIDGE_CHAIRS = [[0, 30, "the captain's chair", 1.25], [-250, 8, "the left console's chair", 1], [250, 8, "the right console's chair", 1]];
SEATS.bridge = c => { const { g, k } = c;
  return BRIDGE_CHAIRS.map(([x, dz, name, s]) => ({ name, x0: (x - 30 * s) * k, x1: (x + 30 * s) * k, y: g + dz * k - 72 * k, z: g + dz * k + 1, facing: ["left", "right"] })); };
// the view out: deep space in a box, as the starfield draws it (its settings), for a window's clip
function spaceViewSvg(c, bx0, by0, bx1, by1, idp) {
  const { k, R, o } = c, w = bx1 - bx0, h = by1 - by0;
  const seed = Math.max(1, Math.round(o.spaceSeed ?? 1)), Rs = (i, s) => R(i, s + 7919 * (seed % 9973));
  const cols = NEBULA_COLORS[o.spaceNebula] || [];
  let t = `<defs><radialGradient id="${idp}-deep" cx="0.5" cy="0.4" r="0.8"><stop offset="0" stop-color="#121a3a"/><stop offset="1" stop-color="#03040c"/></radialGradient>` +
    cols.map((col, i) => `<radialGradient id="${idp}-neb${i}"><stop offset="0" stop-color="${col}" stop-opacity="0.42"/><stop offset="0.55" stop-color="${col}" stop-opacity="0.14"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`).join("") +
    `</defs><rect x="${f1(bx0)}" y="${f1(by0)}" width="${f1(w)}" height="${f1(h)}" fill="url(#${idp}-deep)"/>`;
  cols.forEach((_, i) => { const x = bx0 + w * (0.15 + 0.7 * Rs(i, 9701)), y = by0 + h * (0.15 + 0.6 * Rs(i, 9702)), rx = w * (0.22 + 0.2 * Rs(i, 9703)), ry = rx * (0.4 + 0.35 * Rs(i, 9704));
    t += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="url(#${idp}-neb${i})"/>`; });
  // (seen through a window, far off: the stars smaller, and fewer of them in the smaller box)
  const n = Math.round(Math.max(20, Math.min(1500, o.spaceStars ?? 700)) * 0.3);
  t += starsSvg(o, n, bx0, bx1, by0, by1, k * 0.45, Rs, 7101);
  if (PLANET_LOOKS[o.spacePlanet]) {
    const size = Math.max(5, Math.min(100, o.spacePlanetSize ?? 34)) / 100, at = Math.max(0, Math.min(100, o.spacePlanetX ?? 72)) / 100;
    const r = h * 0.42 * size, cx = bx0 + w * (0.12 + 0.76 * at), cy = by0 + h * 0.42;
    t += spaceMoonsSvg(Math.max(0, Math.min(4, Math.round(o.spaceMoons ?? 2))), cx, cy, r, Rs, `${idp}-moon`) + alienPlanetSvg(o.spacePlanet, cx, cy, r, Rs, `${idp}-planet`);
  }
  return t;
}
// a screen with traces on it, and a row of buttons under it (blinking), at (x, y), w by h
function bridgeScreenSvg(x, y, w, h, k, i, hue, o) {
  const col = ["#38e0ff", "#7dff8a", "#ffcf4a", "#ff6fae"][hue % 4];
  let t = `<rect x="${f1(x - 6 * k)}" y="${f1(y - 6 * k)}" width="${f1(w + 12 * k)}" height="${f1(h + 30 * k)}" rx="${f1(6 * k)}" fill="#1a2030" stroke="#3b465f" stroke-width="${f1(2 * k)}"/>` +
    `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(3 * k)}" fill="#06131f"/>`;
  // (its trace: a wave, or bars, or a ring, by its number)
  if (i % 3 === 0) t += `<path d="${[...Array(13)].map((_, j) => `${j ? "L" : "M"}${f1(x + 4 * k + (w - 8 * k) * j / 12)} ${f1(y + h / 2 + h * 0.3 * Math.sin(j * 1.1 + i))}`).join(" ")}" fill="none" stroke="${col}" stroke-width="${f1(1.6 * k)}"/>`;
  else if (i % 3 === 1) t += [...Array(6)].map((_, j) => { const bh = h * (0.2 + 0.6 * ((j * 7 + i * 3) % 5) / 4); return `<rect x="${f1(x + 5 * k + j * (w - 10 * k) / 6)}" y="${f1(y + h - 4 * k - bh)}" width="${f1((w - 10 * k) / 6 - 3 * k)}" height="${f1(bh)}" fill="${col}" opacity="0.8"/>`; }).join("");
  else t += `<circle cx="${f1(x + w / 2)}" cy="${f1(y + h / 2)}" r="${f1(h * 0.34)}" fill="none" stroke="${col}" stroke-width="${f1(1.4 * k)}"/><path d="M${f1(x + w / 2)} ${f1(y + h / 2)} L${f1(x + w / 2 + h * 0.34)} ${f1(y + h / 2)}" stroke="${col}" stroke-width="${f1(1.4 * k)}"><animateTransform attributeName="transform" type="rotate" values="0 ${f1(x + w / 2)} ${f1(y + h / 2)};360 ${f1(x + w / 2)} ${f1(y + h / 2)}" dur="${3 + i % 3}s" repeatCount="indefinite"/></path>`;
  // the buttons under it, a few of them blinking
  const nb = Math.max(3, Math.floor(w / (16 * k)));
  for (let j = 0; j < nb; j++) {
    const bc = ["#ff4d4d", "#ffd23f", "#3ddc84", "#38bdf8", "#c084fc"][(i + j) % 5], bx = x + (w - (nb - 1) * 14 * k) / 2 + j * 14 * k - 4 * k;
    t += `<rect x="${f1(bx)}" y="${f1(y + h + 9 * k)}" width="${f1(9 * k)}" height="${f1(7 * k)}" rx="${f1(2 * k)}" fill="${bc}">` +
      ((i + j) % 3 === 0 ? `<animate attributeName="opacity" values="1;0.25;1" dur="${(0.8 + ((i * 3 + j) % 5) * 0.3).toFixed(1)}s" repeatCount="indefinite"/>` : "") + `</rect>`;
  }
  return t;
}
// a chair seen from behind, facing the windshield: its pedestal, its seat, its back (taller for the captain), at x, its foot at y
function bridgeChairSvg(x, y, k, s, captain) {
  const w = 60 * s * k, seat = y - 72 * k, back = seat - (captain ? 92 : 62) * k;
  return `<rect x="${f1(x - 5 * k)}" y="${f1(seat + 8 * k)}" width="${f1(10 * k)}" height="${f1(y - seat - 12 * k)}" fill="#2b3245"/>` +
    `<ellipse cx="${f1(x)}" cy="${f1(y - 3 * k)}" rx="${f1(w * 0.42)}" ry="${f1(6 * k)}" fill="#2b3245"/>` +
    `<rect x="${f1(x - w / 2)}" y="${f1(seat - 4 * k)}" width="${f1(w)}" height="${f1(14 * k)}" rx="${f1(5 * k)}" fill="${captain ? "#7a1f2b" : "#2f4a7a"}"/>` +
    (captain ? [-1, 1].map(sd => `<rect x="${f1(x + sd * w * 0.62 - 7 * k)}" y="${f1(seat - 20 * k)}" width="${f1(14 * k)}" height="${f1(26 * k)}" rx="${f1(4 * k)}" fill="#3a4257"/>` +
      `<rect x="${f1(x + sd * w * 0.62 - 4 * k)}" y="${f1(seat - 18 * k)}" width="${f1(8 * k)}" height="${f1(5 * k)}" fill="${sd < 0 ? "#38e0ff" : "#ffd23f"}"/>`).join("") : "") +
    `<rect x="${f1(x - w * 0.46)}" y="${f1(back)}" width="${f1(w * 0.92)}" height="${f1(seat - back + 4 * k)}" rx="${f1(12 * k)}" fill="${captain ? "#9a2a38" : "#3a5a90"}" stroke="#1c2233" stroke-width="${f1(2 * k)}"/>` +
    (captain ? `<path d="${starPath("five", 11 * k)}" transform="translate(${f1(x)} ${f1(back + 22 * k)})" fill="#ffd23f"/>` : "");
}
// a console at x, its foot at y: a desk whose top tilts toward the windshield, a screen on it and buttons
function bridgeConsoleSvg(x, y, k, i, o) {
  const w = 130 * k, top = y - 84 * k;
  return `<path d="M${f1(x - w / 2)} ${f1(y)} L${f1(x - w / 2)} ${f1(top + 14 * k)} L${f1(x + w / 2)} ${f1(top + 14 * k)} L${f1(x + w / 2)} ${f1(y)} Z" fill="#283048"/>` +
    `<path d="M${f1(x - w / 2 - 6 * k)} ${f1(top + 16 * k)} L${f1(x - w / 2 + 6 * k)} ${f1(top - 6 * k)} L${f1(x + w / 2 - 6 * k)} ${f1(top - 6 * k)} L${f1(x + w / 2 + 6 * k)} ${f1(top + 16 * k)} Z" fill="#3b465f"/>` +
    bridgeScreenSvg(x - 34 * k, top - 56 * k, 68 * k, 40 * k, k, 7 + i, i + 1, o);
}
function bridgeScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, all, o } = c, fl = bridgeFloor(c), ceil = y0 + H * 0.07;
  const wx0 = -W * 0.3, wx1 = W * 0.3, wy0 = ceil + H * 0.05, wy1 = fl - 96 * k;
  // the room, and the view out of the windshield (✨'s settings: the starfield's own view)
  let s = SEP + part("bridge-room", [c.F, o.spaceSeed, o.spaceStars, o.spaceNebula, o.spacePlanet, o.spacePlanetSize, o.spacePlanetX, o.spaceMoons, o.starShape, o.starSize, o.starBright, o.starTwinkle, sceneLfoKey(o, "fast")], () => {
    const shield = `M${f1(wx0)} ${f1(wy1)} L${f1(wx0 - 30 * k)} ${f1(wy0 + 30 * k)} Q${f1(wx0 - 30 * k)} ${f1(wy0)} ${f1(wx0)} ${f1(wy0)} L${f1(wx1)} ${f1(wy0)} Q${f1(wx1 + 30 * k)} ${f1(wy0)} ${f1(wx1 + 30 * k)} ${f1(wy0 + 30 * k)} L${f1(wx1)} ${f1(wy1)} Z`;
    let t = `<defs><linearGradient id="bg-bridge-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3144"/><stop offset="1" stop-color="#1b2132"/></linearGradient>` +
      `<linearGradient id="bg-bridge-deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2232"/><stop offset="1" stop-color="#0f131d"/></linearGradient>` +
      `<clipPath id="bg-bridge-shield"><path d="${shield}"/></clipPath></defs>` + all("url(#bg-bridge-wall)");
    // the wall's panel seams
    for (let x = x0 - pad; x < x1 + pad; x += 70 * k) t += `<line x1="${f1(x)}" y1="${f1(ceil)}" x2="${f1(x)}" y2="${f1(fl)}" stroke="#151a27" stroke-width="${f1(1.5 * k)}"/>`;
    // the ceiling: dark, its light strips glowing
    t += `<rect x="${f1(x0 - pad)}" y="${f1(y0 - pad)}" width="${f1(W + 2 * pad)}" height="${f1(ceil - y0 + pad)}" fill="#141824"/>` +
      [-0.36, -0.12, 0.12, 0.36].map(u => `<rect x="${f1(u * W - 60 * k)}" y="${f1(ceil - 12 * k)}" width="${f1(120 * k)}" height="${f1(6 * k)}" rx="${f1(3 * k)}" fill="#bff3ff" opacity="0.85"/>`).join("") +
      `<rect x="${f1(x0 - pad)}" y="${f1(ceil - 2 * k)}" width="${f1(W + 2 * pad)}" height="${f1(4 * k)}" fill="#3b465f"/>`;
    // the windshield: the view out, its frame, two struts
    t += `<g clip-path="url(#bg-bridge-shield)">${spaceViewSvg(c, wx0 - 40 * k, wy0, wx1 + 40 * k, wy1, "bg-bridge-view")}` +
      `<path d="M${f1(wx0 - 30 * k)} ${f1(wy0)} L${f1(wx0 + 140 * k)} ${f1(wy0)} L${f1(wx0 - 30 * k)} ${f1(wy1)} Z" fill="#ffffff" opacity="0.05"/></g>` +
      `<path d="${shield}" fill="none" stroke="#5b6782" stroke-width="${f1(10 * k)}" stroke-linejoin="round"/>` +
      [-1, 1].map(sd => `<line x1="${f1(sd * W * 0.1)}" y1="${f1(wy0)}" x2="${f1(sd * W * 0.1)}" y2="${f1(wy1)}" stroke="#5b6782" stroke-width="${f1(7 * k)}"/>`).join("");
    // a monitor on each side of the windshield, buttons under each
    t += [-1, 1].map((sd, i) => bridgeScreenSvg(sd * W * 0.41 - 55 * k, wy0 + 20 * k, 110 * k, 72 * k, k, i, i * 2, o) + bridgeScreenSvg(sd * W * 0.41 - 55 * k, wy0 + 150 * k, 110 * k, 60 * k, k, i + 2, i * 2 + 1, o)).join("");
    // the console along the wall under the windshield: its top, and screens and buttons along it
    t += `<rect x="${f1(wx0 - 20 * k)}" y="${f1(wy1 + 8 * k)}" width="${f1(wx1 - wx0 + 40 * k)}" height="${f1(fl - wy1 - 8 * k)}" fill="#283048"/>` +
      `<rect x="${f1(wx0 - 26 * k)}" y="${f1(wy1 + 2 * k)}" width="${f1(wx1 - wx0 + 52 * k)}" height="${f1(12 * k)}" rx="${f1(4 * k)}" fill="#3b465f"/>` +
      [-0.22, 0, 0.22].map((u, i) => bridgeScreenSvg(u * W - 40 * k, wy1 + 22 * k, 80 * k, 30 * k, k, 4 + i, i + 2, o)).join("");
    // the deck: its lines running toward the windshield, a ring of light in the middle
    t += `<rect x="${f1(x0 - pad)}" y="${f1(fl)}" width="${f1(W + 2 * pad)}" height="${f1(y1 - fl + pad)}" fill="url(#bg-bridge-deck)"/>` +
      [...Array(11)].map((_, i) => { const u = (i - 5) / 5; return `<line x1="${f1(u * W * 0.4)}" y1="${f1(fl)}" x2="${f1(u * W * 1.3)}" y2="${f1(y1 + pad)}" stroke="#2c3550" stroke-width="${f1(1.5 * k)}"/>`; }).join("") +
      `<ellipse cx="0" cy="${f1(g + 30 * k)}" rx="${f1(150 * k)}" ry="${f1(26 * k)}" fill="none" stroke="#38e0ff" stroke-width="${f1(2 * k)}" opacity="0.45"/>`;
    return wallObj("windshield and the bridge's wall", t);
  });
  // the two consoles, and the three chairs facing the windshield
  s += SEP + part("bridge-things", [c.F], () =>
    obj("the left console", g - 40 * k, bridgeConsoleSvg(-250 * k, g - 40 * k, k, 0, o)) + obj("the right console", g - 40 * k, bridgeConsoleSvg(250 * k, g - 40 * k, k, 1, o)) +
    BRIDGE_CHAIRS.map(([x, dz, name, sc], i) => obj(name, g + dz * k, bridgeChairSvg(x * k, g + dz * k, k, sc, i === 0))).join(""));
  return s;
}
Object.assign(SCENES, { bridge: bridgeScene });

// ===================== THE ALIEN PLANET =====================
// (ticket 798, for N; Matthew: "alien planet, with alien rocks, plants, and people. Use grey aliens, and ideas about Bashar's
// planet with no predation among the plants and animals"; then "the alien planet can have animals too, like insects, birds,
// snakes, squirrels, etc but let's use intense, rainbow colors for them") A peaceful world: under its sky (👽 its sky:
// violet dusk, teal day or golden), two suns and a great ringed planet low over the hills; far spires; its ground, glowing
// here and there; crystal rocks and stone mushrooms; alien plants (curling ferns, glowing bulbs on stalks, tall tubes); grey
// aliens, as many as 👽 says, one waving; and its animals, all in rainbow colours, living side by side, none hunting
// another: a squirrel on a rock by a coiled snake, a beetle, butterflies bobbing (the quick LFO), birds gliding (the slow one).
const RAINBOW = ["#ff1e56", "#ff8c00", "#ffe600", "#00d26a", "#00b4ff", "#5a3cff", "#d23cff"];
const ALIEN_SKIES = [["dusk", "🟣 violet dusk"], ["teal", "🩵 teal day"], ["gold", "🟡 golden"]];
const ALIEN_SKY = { dusk: ["#2a1650", "#c04ac9", "#ffb0d8"], teal: ["#0b4a6e", "#29b3b0", "#c9fff2"], gold: ["#5a2a0c", "#e0861f", "#ffe7a3"] };
const ALIEN_GROUND = { dusk: ["#5b3f8f", "#3d2a6b", "#2a1d4d"], teal: ["#2f7f6f", "#22615a", "#174641"], gold: ["#a8662c", "#7d4a20", "#5a3416"] };
// a grey alien, feet at (x, y), s its size: thin legs and arms, a slim body, a great head, big dark eyes; waving, if wave
function greyAlienSvg(x, y, k, s, wave, i) {
  const u = k * s, skin = "#b9c2cc", dark = "#8c96a3";
  const arm = (sd, up) => up ? `<path d="M${f1(x + sd * 14 * u)} ${f1(y - 118 * u)} L${f1(x + sd * 30 * u)} ${f1(y - 150 * u)} L${f1(x + sd * 36 * u)} ${f1(y - 178 * u)}" fill="none" stroke="${skin}" stroke-width="${f1(6 * u)}" stroke-linecap="round" stroke-linejoin="round">` +
      `<animateTransform attributeName="transform" type="rotate" values="-12 ${f1(x + sd * 14 * u)} ${f1(y - 118 * u)};14 ${f1(x + sd * 14 * u)} ${f1(y - 118 * u)};-12 ${f1(x + sd * 14 * u)} ${f1(y - 118 * u)}" dur="${(1.2 + 0.2 * i).toFixed(1)}s" repeatCount="indefinite"/></path>`
    : `<path d="M${f1(x + sd * 14 * u)} ${f1(y - 118 * u)} Q${f1(x + sd * 24 * u)} ${f1(y - 90 * u)} ${f1(x + sd * 20 * u)} ${f1(y - 62 * u)}" fill="none" stroke="${skin}" stroke-width="${f1(6 * u)}" stroke-linecap="round"/>`;
  return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(26 * u)}" ry="${f1(5 * u)}" fill="#000" opacity="0.15"/>` +
    [-1, 1].map(sd => `<path d="M${f1(x + sd * 7 * u)} ${f1(y - 66 * u)} L${f1(x + sd * 9 * u)} ${f1(y)}" stroke="${skin}" stroke-width="${f1(7 * u)}" stroke-linecap="round"/>`).join("") +
    arm(-1, false) + arm(1, wave) +
    `<path d="M${f1(x - 16 * u)} ${f1(y - 122 * u)} Q${f1(x)} ${f1(y - 134 * u)} ${f1(x + 16 * u)} ${f1(y - 122 * u)} L${f1(x + 11 * u)} ${f1(y - 62 * u)} Q${f1(x)} ${f1(y - 56 * u)} ${f1(x - 11 * u)} ${f1(y - 62 * u)} Z" fill="${skin}" stroke="${dark}" stroke-width="${f1(1.2 * u)}"/>` +
    `<path d="M${f1(x)} ${f1(y - 128 * u)} C${f1(x - 44 * u)} ${f1(y - 132 * u)} ${f1(x - 48 * u)} ${f1(y - 214 * u)} ${f1(x)} ${f1(y - 214 * u)} C${f1(x + 48 * u)} ${f1(y - 214 * u)} ${f1(x + 44 * u)} ${f1(y - 132 * u)} ${f1(x)} ${f1(y - 128 * u)} Z" fill="${skin}" stroke="${dark}" stroke-width="${f1(1.5 * u)}"/>` +
    [-1, 1].map(sd => `<path d="M${f1(x + sd * 6 * u)} ${f1(y - 168 * u)} Q${f1(x + sd * 30 * u)} ${f1(y - 186 * u)} ${f1(x + sd * 28 * u)} ${f1(y - 164 * u)} Q${f1(x + sd * 22 * u)} ${f1(y - 150 * u)} ${f1(x + sd * 6 * u)} ${f1(y - 168 * u)} Z" fill="#101014"/>` +
      `<ellipse cx="${f1(x + sd * 20 * u)}" cy="${f1(y - 172 * u)}" rx="${f1(3 * u)}" ry="${f1(2 * u)}" fill="#ffffff" opacity="0.7"/>`).join("") +
    `<path d="M${f1(x - 5 * u)} ${f1(y - 142 * u)} Q${f1(x)} ${f1(y - 139 * u)} ${f1(x + 5 * u)} ${f1(y - 142 * u)}" fill="none" stroke="${dark}" stroke-width="${f1(1.5 * u)}" stroke-linecap="round"/>`;
}
// a rainbow squirrel sitting, its bushy tail striped, at (x, y), facing right
function rainbowSquirrelSvg(x, y, k) {
  const u = k * 0.9;
  return [...RAINBOW].reverse().map((col, i) => `<path d="M${f1(x - 8 * u)} ${f1(y - 6 * u)} C${f1(x - 44 * u + i * 3 * u)} ${f1(y - 14 * u)} ${f1(x - 46 * u + i * 3 * u)} ${f1(y - 62 * u + i * 3 * u)} ${f1(x - 20 * u + i * 2 * u)} ${f1(y - 70 * u + i * 4 * u)}" fill="none" stroke="${col}" stroke-width="${f1(16 * u - i * 1.4 * u)}" stroke-linecap="round"/>`).join("") +
    `<ellipse cx="${f1(x)}" cy="${f1(y - 16 * u)}" rx="${f1(12 * u)}" ry="${f1(17 * u)}" fill="#ff8c00"/><circle cx="${f1(x + 6 * u)}" cy="${f1(y - 36 * u)}" r="${f1(10 * u)}" fill="#ff8c00"/>` +
    `<path d="M${f1(x + 2 * u)} ${f1(y - 44 * u)} l${f1(-2 * u)} ${f1(-9 * u)} l${f1(6 * u)} ${f1(6 * u)} Z" fill="#d23cff"/><circle cx="${f1(x + 10 * u)}" cy="${f1(y - 38 * u)}" r="${f1(2.2 * u)}" fill="#111"/>` +
    `<ellipse cx="${f1(x + 3 * u)}" cy="${f1(y - 12 * u)}" rx="${f1(6 * u)}" ry="${f1(10 * u)}" fill="#ffe600"/><circle cx="${f1(x + 14 * u)}" cy="${f1(y - 22 * u)}" r="${f1(4 * u)}" fill="#00b4ff"/>`;
}
// a rainbow snake, coiled and resting, its head up, at (x, y)
function rainbowSnakeSvg(x, y, k, id) {
  const u = k, d = `M${f1(x - 46 * u)} ${f1(y - 4 * u)} C${f1(x - 30 * u)} ${f1(y + 8 * u)} ${f1(x + 30 * u)} ${f1(y + 8 * u)} ${f1(x + 40 * u)} ${f1(y - 4 * u)} C${f1(x + 48 * u)} ${f1(y - 14 * u)} ${f1(x - 30 * u)} ${f1(y - 22 * u)} ${f1(x - 24 * u)} ${f1(y - 10 * u)} C${f1(x - 18 * u)} ${f1(y)} ${f1(x + 18 * u)} ${f1(y - 2 * u)} ${f1(x + 16 * u)} ${f1(y - 14 * u)} L${f1(x + 22 * u)} ${f1(y - 34 * u)}`;
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${RAINBOW.map((c, i) => `<stop offset="${(i / 6).toFixed(2)}" stop-color="${c}"/>`).join("")}</linearGradient></defs>` +
    `<path d="${d}" fill="none" stroke="url(#${id})" stroke-width="${f1(11 * u)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="${f1(2 * u)}" stroke-dasharray="${f1(3 * u)} ${f1(9 * u)}" opacity="0.6"/>` +
    `<ellipse cx="${f1(x + 24 * u)}" cy="${f1(y - 38 * u)}" rx="${f1(9 * u)}" ry="${f1(6.5 * u)}" fill="#d23cff"/><circle cx="${f1(x + 28 * u)}" cy="${f1(y - 40 * u)}" r="${f1(1.8 * u)}" fill="#111"/>` +
    `<path d="M${f1(x + 33 * u)} ${f1(y - 37 * u)} l${f1(7 * u)} ${f1(1 * u)} m${f1(-2 * u)} 0 l${f1(3 * u)} ${f1(-3 * u)} m${f1(-3 * u)} ${f1(3 * u)} l${f1(3 * u)} ${f1(2 * u)}" stroke="#ff1e56" stroke-width="${f1(1.4 * u)}" fill="none"/>`;
}
// a butterfly, rainbow-winged, at (x, y), bobbing and flapping
function rainbowButterflySvg(x, y, k, i, o) {
  const u = k * 0.8, c1 = RAINBOW[i % 7], c2 = RAINBOW[(i + 3) % 7];
  const wings = `<path d="M0 0 C${f1(-18 * u)} ${f1(-20 * u)} ${f1(-24 * u)} ${f1(2 * u)} 0 0 C${f1(-20 * u)} ${f1(6 * u)} ${f1(-12 * u)} ${f1(18 * u)} 0 0" fill="${c1}"/><path d="M0 0 C${f1(18 * u)} ${f1(-20 * u)} ${f1(24 * u)} ${f1(2 * u)} 0 0 C${f1(20 * u)} ${f1(6 * u)} ${f1(12 * u)} ${f1(18 * u)} 0 0" fill="${c2}"/>`;
  return `<g transform="translate(${f1(x)} ${f1(y)})"><g>${sceneLfo(o, "fast", (i * 0.31) % 1, "transform", (v, amp) => `0 ${f1((4 + 10 * amp) * v * u)}`,
      `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${f1(-8 * u)};0 0" dur="${(1.4 + 0.3 * i).toFixed(1)}s" repeatCount="indefinite"/>`, "translate")}` +
    `<g>${wings}<animateTransform attributeName="transform" type="scale" values="1 1;0.3 1;1 1" dur="0.35s" repeatCount="indefinite"/></g>` +
    `<rect x="${f1(-1.5 * u)}" y="${f1(-8 * u)}" width="${f1(3 * u)}" height="${f1(14 * u)}" rx="${f1(1.5 * u)}" fill="#222"/></g></g>`;
}
// a rainbow bird gliding across the sky, on a long slow loop (the slow LFO's pace, as the desert's hawk)
function rainbowBirdSvg(x, y, k, i, W) {
  const u = k, c = RAINBOW[(i * 2) % 7], c2 = RAINBOW[(i * 2 + 3) % 7];
  return `<g><path d="M${f1(-22 * u)} 0 Q${f1(-10 * u)} ${f1(-14 * u)} 0 0 Q${f1(10 * u)} ${f1(-14 * u)} ${f1(22 * u)} 0" fill="none" stroke="${c}" stroke-width="${f1(5 * u)}" stroke-linecap="round">` +
    `<animate attributeName="d" values="M${f1(-22 * u)} 0 Q${f1(-10 * u)} ${f1(-14 * u)} 0 0 Q${f1(10 * u)} ${f1(-14 * u)} ${f1(22 * u)} 0;M${f1(-22 * u)} ${f1(-6 * u)} Q${f1(-10 * u)} ${f1(6 * u)} 0 0 Q${f1(10 * u)} ${f1(6 * u)} ${f1(22 * u)} ${f1(-6 * u)};M${f1(-22 * u)} 0 Q${f1(-10 * u)} ${f1(-14 * u)} 0 0 Q${f1(10 * u)} ${f1(-14 * u)} ${f1(22 * u)} 0" dur="${(0.8 + 0.15 * i).toFixed(2)}s" repeatCount="indefinite"/></path>` +
    `<ellipse cx="0" cy="${f1(1 * u)}" rx="${f1(7 * u)}" ry="${f1(4 * u)}" fill="${c2}"/>` +
    `<animateMotion path="M${f1(x - W * 0.7)} ${f1(y)} Q${f1(x)} ${f1(y - 40 * u)} ${f1(x + W * 0.7)} ${f1(y + 10 * u)}" dur="${(16 + 5 * i).toFixed(0)}s" repeatCount="indefinite"/></g>`;
}
// a cluster of crystals, at (x, y), s its size
function alienCrystalsSvg(x, y, k, s, i) {
  const cols = [["#7ef9ff", "#2bb8d6"], ["#ff9bf0", "#d24ac0"], ["#b6ff7a", "#5fc93a"]][i % 3];
  return [[-14, 60, -10], [0, 92, 2], [16, 70, 12], [28, 40, 22]].map(([dx, h, lean]) => {
    const bx = x + dx * k * s, hh = h * k * s, w = 12 * k * s;
    return `<path d="M${f1(bx - w)} ${f1(y)} L${f1(bx - w * 0.8 + lean * 0.3 * k)} ${f1(y - hh * 0.8)} L${f1(bx + lean * 0.4 * k)} ${f1(y - hh)} L${f1(bx + w * 0.8 + lean * 0.3 * k)} ${f1(y - hh * 0.8)} L${f1(bx + w)} ${f1(y)} Z" fill="${cols[0]}" stroke="${cols[1]}" stroke-width="${f1(1.5 * k)}"/>` +
      `<path d="M${f1(bx - w * 0.3)} ${f1(y - 4 * k)} L${f1(bx - w * 0.2 + lean * 0.35 * k)} ${f1(y - hh * 0.85)}" stroke="#ffffff" stroke-width="${f1(2 * k)}" opacity="0.6"/>`; }).join("");
}
// a stone mushroom: a wide cap on a narrow stem, at (x, y)
const alienMushroomRockSvg = (x, y, k, s, col) => `<path d="M${f1(x - 10 * k * s)} ${f1(y)} Q${f1(x - 6 * k * s)} ${f1(y - 50 * k * s)} ${f1(x - 8 * k * s)} ${f1(y - 70 * k * s)} L${f1(x + 8 * k * s)} ${f1(y - 70 * k * s)} Q${f1(x + 6 * k * s)} ${f1(y - 50 * k * s)} ${f1(x + 10 * k * s)} ${f1(y)} Z" fill="${mix(col, "#000000", 0.25)}"/>` +
  `<ellipse cx="${f1(x)}" cy="${f1(y - 74 * k * s)}" rx="${f1(46 * k * s)}" ry="${f1(16 * k * s)}" fill="${col}"/><ellipse cx="${f1(x - 10 * k * s)}" cy="${f1(y - 79 * k * s)}" rx="${f1(20 * k * s)}" ry="${f1(5 * k * s)}" fill="#ffffff" opacity="0.25"/>`;
// alien plants: a curling fern, glowing bulbs on stalks, tall tubes, by kind, at (x, y)
function alienPlantSvg(x, y, k, kind, i) {
  if (kind === 0) return [-1, 0, 1].map(j => { const a = j * 0.5, ex = x + Math.sin(a) * 70 * k, ey = y - Math.cos(a) * 90 * k;
    return `<path d="M${f1(x)} ${f1(y)} Q${f1(x + j * 20 * k)} ${f1(y - 60 * k)} ${f1(ex)} ${f1(ey)} q${f1(14 * k)} ${f1(-6 * k)} ${f1(10 * k)} ${f1(8 * k)} q${f1(-4 * k)} ${f1(8 * k)} ${f1(-10 * k)} ${f1(2 * k)}" fill="none" stroke="#2fe0a0" stroke-width="${f1(5 * k)}" stroke-linecap="round"/>`; }).join("");
  if (kind === 1) return [[-18, 110], [0, 140], [20, 96]].map(([dx, h], j) => `<path d="M${f1(x)} ${f1(y)} Q${f1(x + dx * k * 0.5)} ${f1(y - h * k * 0.5)} ${f1(x + dx * k)} ${f1(y - h * k)}" fill="none" stroke="#6b3fa0" stroke-width="${f1(4 * k)}"/>` +
    `<circle cx="${f1(x + dx * k)}" cy="${f1(y - h * k)}" r="${f1(11 * k)}" fill="${["#ffe600", "#7ef9ff", "#ff9bf0"][(i + j) % 3]}"><animate attributeName="opacity" values="1;0.55;1" dur="${(2 + j * 0.7).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join("");
  return [[-14, 120, "#ff6fae"], [0, 160, "#c084fc"], [14, 100, "#38bdf8"]].map(([dx, h, col]) => `<rect x="${f1(x + dx * k - 7 * k)}" y="${f1(y - h * k)}" width="${f1(14 * k)}" height="${f1(h * k)}" rx="${f1(7 * k)}" fill="${col}"/>` +
    `<ellipse cx="${f1(x + dx * k)}" cy="${f1(y - h * k + 3 * k)}" rx="${f1(5 * k)}" ry="${f1(3 * k)}" fill="${mix(col, "#000000", 0.4)}"/>`).join("");
}
function alienplanetScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, all, o } = c;
  const sky = ALIEN_SKY[o.alienSky] ? o.alienSky : "dusk", [gr0, gr1, gr2] = ALIEN_GROUND[sky], hz = g - 150 * k;
  const aliens = Math.max(0, Math.min(4, Math.round(o.alienPeople ?? 2))), animals = o.alienAnimals !== false;
  // the sky, its two suns, the great ringed planet low over the hills, faint stars
  let s = SEP + part("alien-sky", [c.F, sky], () => {
    const [a, b2, c3] = ALIEN_SKY[sky];
    return `<defs><linearGradient id="bg-alien-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="0.65" stop-color="${b2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>` +
      `<radialGradient id="bg-alien-sun"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#fff2c4"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></radialGradient></defs>` +
      all("url(#bg-alien-sky)") + starsSvg({ starShape: "dot", starSize: 70, starBright: 50, starTwinkle: 0 }, 40, x0, x1, y0, y0 + (hz - y0) * 0.45, k, R, 8801) +
      `<circle cx="${f1(x0 + W * 0.2)}" cy="${f1(y0 + H * 0.12)}" r="${f1(44 * k)}" fill="url(#bg-alien-sun)"/><circle cx="${f1(x0 + W * 0.3)}" cy="${f1(y0 + H * 0.2)}" r="${f1(24 * k)}" fill="url(#bg-alien-sun)" opacity="0.8"/>` +
      alienPlanetSvg("ringed", x0 + W * 0.7, hz - 40 * k, 120 * k, R, "bg-alien-giant");
  });
  // far off: tall spires and rolling hills, hazier the farther
  s += SEP + part("alien-far", [c.F, sky], () => {
    const haze = ALIEN_SKY[sky][2];
    let t = "";
    for (let i = 0; i < 9; i++) { const x = x0 - pad + (W + 2 * pad) * (i + 0.3 * R(i, 8811)) / 9, h = (90 + 140 * R(i, 8812)) * k, w = (20 + 26 * R(i, 8813)) * k;
      t += `<path d="M${f1(x - w)} ${f1(hz)} Q${f1(x - w * 0.3)} ${f1(hz - h * 0.6)} ${f1(x)} ${f1(hz - h)} Q${f1(x + w * 0.3)} ${f1(hz - h * 0.6)} ${f1(x + w)} ${f1(hz)} Z" fill="${mix(gr0, haze, 0.55)}"/>`; }
    t += `<path d="M${f1(x0 - pad)} ${f1(hz)} ${[...Array(7)].map((_, i) => `Q${f1(x0 + W * (i + 0.5) / 6)} ${f1(hz - (30 + 40 * R(i, 8814)) * k)} ${f1(x0 + W * (i + 1) / 6)} ${f1(hz)}`).join(" ")} L${f1(x1 + pad)} ${f1(y1 + pad)} L${f1(x0 - pad)} ${f1(y1 + pad)} Z" fill="${mix(gr0, haze, 0.3)}"/>`;
    return wallObj("the far hills and spires", t);
  });
  // the ground: its colours in bands, and glowing pools here and there
  s += SEP + part("alien-ground", [c.F, sky], () => wallObj("the ground", `<rect x="${f1(x0 - pad)}" y="${f1(hz + 10 * k)}" width="${f1(W + 2 * pad)}" height="${f1(y1 - hz + pad)}" fill="${gr0}"/>` +
    `<rect x="${f1(x0 - pad)}" y="${f1(g - 40 * k)}" width="${f1(W + 2 * pad)}" height="${f1(y1 - g + 40 * k + pad)}" fill="${gr1}"/>` +
    `<rect x="${f1(x0 - pad)}" y="${f1(g + 90 * k)}" width="${f1(W + 2 * pad)}" height="${f1(y1 - g + pad)}" fill="${gr2}"/>` +
    [0, 1, 2, 3].map(i => `<ellipse cx="${f1(x0 + W * (0.1 + 0.8 * R(i, 8821)))}" cy="${f1(hz + (40 + 160 * R(i, 8822)) * k)}" rx="${f1((30 + 40 * R(i, 8823)) * k)}" ry="${f1(8 * k)}" fill="#7ef9ff" opacity="0.35"><animate attributeName="opacity" values="0.35;0.15;0.35" dur="${3 + i}s" repeatCount="indefinite"/></ellipse>`).join("")));
  // what stands on it, each at its depth: crystals and stone mushrooms, plants, the aliens, the animals
  s += SEP + part("alien-things", [c.F, sky, aliens, animals, sceneLfoKey(o, "fast")], () => {
    const things = [
      ["crystals, left", -0.38, -10, (x, y) => alienCrystalsSvg(x, y, k, 1.2, 0)], ["crystals, far right", 0.36, -70, (x, y) => alienCrystalsSvg(x, y, k, 0.8, 1)],
      ["stone mushroom", -0.18, -60, (x, y) => alienMushroomRockSvg(x, y, k, 1, "#9b6bd6")], ["stone mushroom, right", 0.44, 40, (x, y) => alienMushroomRockSvg(x, y, k, 0.8, "#4fb3a8")],
      ["curling fern", -0.45, 60, (x, y) => alienPlantSvg(x, y, k, 0, 0)], ["bulb plant", 0.22, -30, (x, y) => alienPlantSvg(x, y, k, 1, 1)],
      ["tube plant", 0.08, -115, (x, y) => alienPlantSvg(x, y, k, 2, 2)], ["bulb plant, left", -0.14, 100, (x, y) => alienPlantSvg(x, y, k, 1, 3)]];
    [[-0.3, 30, true], [0.3, -40, false], [0.12, 80, false], [-0.12, -80, false]].slice(0, aliens).forEach(([u, dz, wave], i) =>
      things.push([`grey alien ${i + 1}`, u, dz, (x, y) => greyAlienSvg(x, y, k, 1 - 0.1 * i, wave, i)]));
    if (animals) things.push(["rainbow squirrel on a rock", 0.42, 40, (x, y) => rainbowSquirrelSvg(x + 6 * k, y - 82 * k * 0.8, k)],
      ["rainbow snake, resting", 0.3, 50, (x, y) => rainbowSnakeSvg(x, y, k, "bg-alien-snake")],
      ["rainbow beetle", -0.4, -5, (x, y) => `<ellipse cx="${f1(x + 2 * k)}" cy="${f1(y - 100 * k)}" rx="${f1(9 * k)}" ry="${f1(6 * k)}" fill="#00d26a" stroke="#5a3cff" stroke-width="${f1(2 * k)}"/><circle cx="${f1(x + 11 * k)}" cy="${f1(y - 100 * k)}" r="${f1(3.5 * k)}" fill="#ff1e56"/>`]);
    return things.map(([name, u, dz, f]) => { const x = u * W, y = g + dz * k; return obj(name, y, f(x, y)); }).join("") +
      (animals ? obj("rainbow butterflies", Infinity, [0, 1, 2].map(i => rainbowButterflySvg(x0 + W * [0.1, 0.6, 0.9][i], g - [110, 210, 160][i] * k, k, i, o)).join("")) : "");
  });
  if (animals) s += SEP + part("alien-birds", [c.F], () => [0, 1].map(i => rainbowBirdSvg(0, y0 + H * (0.18 + 0.1 * i), k, i, W)).join(""));
  return s;
}
Object.assign(SCENES, { alienplanet: alienplanetScene });
