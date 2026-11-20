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
  // (ticket 800) in the cat universe, cats crew the bridge, one in each chair
  if (catverse()) s += SEP + part("bridge-cats", [c.F], () => catverseCats(BRIDGE_CHAIRS.map(([x, dz, name], i) => [`a cat in ${name.replace(/^the /, "the ")}`, x * k, g + dz * k - 72 * k, k * 1.3, i, "sit"])));
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
  s += SEP + part("alien-things", [c.F, sky, aliens, animals, catverse(), sceneLfoKey(o, "fast")], () => {
    const things = [
      ["crystals, left", -0.38, -10, (x, y) => alienCrystalsSvg(x, y, k, 1.2, 0)], ["crystals, far right", 0.36, -70, (x, y) => alienCrystalsSvg(x, y, k, 0.8, 1)],
      ["stone mushroom", -0.18, -60, (x, y) => alienMushroomRockSvg(x, y, k, 1, "#9b6bd6")], ["stone mushroom, right", 0.44, 40, (x, y) => alienMushroomRockSvg(x, y, k, 0.8, "#4fb3a8")],
      ["curling fern", -0.45, 60, (x, y) => alienPlantSvg(x, y, k, 0, 0)], ["bulb plant", 0.22, -30, (x, y) => alienPlantSvg(x, y, k, 1, 1)],
      ["tube plant", 0.08, -115, (x, y) => alienPlantSvg(x, y, k, 2, 2)], ["bulb plant, left", -0.14, 100, (x, y) => alienPlantSvg(x, y, k, 1, 3)]];
    [[-0.3, 30, true], [0.3, -40, false], [0.12, 80, false], [-0.12, -80, false]].slice(0, aliens).forEach(([u, dz, wave], i) =>
      things.push(catverse() ? [`alien cat ${i + 1}`, u, dz, (x, y) => spaceCatSvg(x, y, k * (3.4 - 0.3 * i), ALIEN_CAT_COATS[i % 4], i % 2 ? "walk" : "sit", i, true)]   // (ticket 800: the cat universe's aliens)
        : [`grey alien ${i + 1}`, u, dz, (x, y) => greyAlienSvg(x, y, k, 1 - 0.1 * i, wave, i)]));
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

// ===================== THE SPACE STATION =====================
// (ticket 798, for N; Matthew: "space station, with various kinds of rooms: labs; greenhouse in space (lights, hydroponic
// planter shelves, etc); sleeping quarters, with bunk beds; kitchen; mess hall (for eating)") Five rooms, each seen from its
// back as the bridge is, in one shell: metal panels, a ceiling of lights, a round porthole looking out on the starfield (✨'s
// view, as the bridge's windshield), and a deck; each room its own things. Food stands on counters and tables, never the
// floor, and all of it is vegetarian (Matthew's rules for the game's food).
const STATION_ROOMS = { stationlab: "🧪 the space station's lab", stationgarden: "🌱 the space station's greenhouse", stationbunks: "🛏️ the space station's sleeping quarters",
                        stationkitchen: "🍳 the space station's kitchen", stationmess: "🍽️ the space station's mess hall" };
const stationFloor = c => c.g - 110 * c.k;
// the shell: walls, ceiling and its lights, a porthole at (px, py) of radius pr (none when pr is 0), the deck; tint, the
// walls' colour
function stationShellSvg(c, tint, px, py, pr, idp) {
  const { x0, y0, x1, y1, W, H, k, pad, all } = c, fl = stationFloor(c), ceil = y0 + H * 0.08;
  let t = `<defs><linearGradient id="${idp}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(tint, "#ffffff", 0.18)}"/><stop offset="1" stop-color="${tint}"/></linearGradient>` +
    (pr ? `<clipPath id="${idp}-port"><circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(pr)}"/></clipPath>` : "") + `</defs>` + all(`url(#${idp}-wall)`);
  for (let x = x0 - pad; x < x1 + pad; x += 90 * k) t += `<rect x="${f1(x + 4 * k)}" y="${f1(ceil + 8 * k)}" width="${f1(82 * k)}" height="${f1(fl - ceil - 16 * k)}" rx="${f1(6 * k)}" fill="none" stroke="${mix(tint, "#000000", 0.18)}" stroke-width="${f1(1.5 * k)}"/>` +
    `<circle cx="${f1(x + 10 * k)}" cy="${f1(ceil + 14 * k)}" r="${f1(1.8 * k)}" fill="${mix(tint, "#000000", 0.3)}"/>`;
  t += `<rect x="${f1(x0 - pad)}" y="${f1(y0 - pad)}" width="${f1(W + 2 * pad)}" height="${f1(ceil - y0 + pad)}" fill="${mix(tint, "#000000", 0.45)}"/>` +
    [-0.3, 0, 0.3].map(u => `<rect x="${f1(u * W - 70 * k)}" y="${f1(ceil - 11 * k)}" width="${f1(140 * k)}" height="${f1(6 * k)}" rx="${f1(3 * k)}" fill="#fffbe6" opacity="0.9"/>`).join("");
  if (pr) t += `<g clip-path="url(#${idp}-port)">${spaceViewSvg(c, px - pr, py - pr, px + pr, py + pr, `${idp}-view`)}</g>` +
    `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(pr)}" fill="none" stroke="#7b869e" stroke-width="${f1(12 * k)}"/>` +
    [...Array(8)].map((_, i) => { const a = i * Math.PI / 4; return `<circle cx="${f1(px + Math.cos(a) * pr)}" cy="${f1(py + Math.sin(a) * pr)}" r="${f1(3 * k)}" fill="#3b465f"/>`; }).join("");
  t += `<rect x="${f1(x0 - pad)}" y="${f1(fl)}" width="${f1(W + 2 * pad)}" height="${f1(y1 - fl + pad)}" fill="${mix(tint, "#000000", 0.5)}"/>` +
    [...Array(9)].map((_, i) => { const u = (i - 4) / 4; return `<line x1="${f1(u * W * 0.45)}" y1="${f1(fl)}" x2="${f1(u * W * 1.2)}" y2="${f1(y1 + pad)}" stroke="${mix(tint, "#000000", 0.62)}" stroke-width="${f1(1.5 * k)}"/>`; }).join("") +
    `<rect x="${f1(x0 - pad)}" y="${f1(fl - 4 * k)}" width="${f1(W + 2 * pad)}" height="${f1(8 * k)}" fill="#3b465f"/>`;
  return t;
}
// a counter or bench along the wall from xa to xb, its top at height h above y
const stationCounterSvg = (xa, xb, y, h, k, top = "#cfd6e4", body = "#5b6782") => `<rect x="${f1(xa)}" y="${f1(y - h)}" width="${f1(xb - xa)}" height="${f1(h)}" fill="${body}"/>` +
  `<rect x="${f1(xa - 6 * k)}" y="${f1(y - h - 8 * k)}" width="${f1(xb - xa + 12 * k)}" height="${f1(10 * k)}" rx="${f1(3 * k)}" fill="${top}"/>` +
  [...Array(Math.max(1, Math.floor((xb - xa) / (60 * k))))].map((_, i, a) => `<rect x="${f1(xa + 6 * k + i * (xb - xa) / a.length)}" y="${f1(y - h + 10 * k)}" width="${f1((xb - xa) / a.length - 12 * k)}" height="${f1(h - 18 * k)}" rx="${f1(3 * k)}" fill="none" stroke="${mix(body, "#000000", 0.25)}" stroke-width="${f1(1.5 * k)}"/>`).join("");
// a flask of glowing liquid at (x, y), its colour col
const stationFlaskSvg = (x, y, k, col, i) => `<path d="M${f1(x - 4 * k)} ${f1(y - 34 * k)} L${f1(x - 4 * k)} ${f1(y - 22 * k)} L${f1(x - 14 * k)} ${f1(y)} L${f1(x + 14 * k)} ${f1(y)} L${f1(x + 4 * k)} ${f1(y - 22 * k)} L${f1(x + 4 * k)} ${f1(y - 34 * k)} Z" fill="#e8f4ff" opacity="0.55" stroke="#9fb3c8" stroke-width="${f1(1.2 * k)}"/>` +
  `<path d="M${f1(x - 9 * k)} ${f1(y - 10 * k)} L${f1(x - 13 * k)} ${f1(y - 1 * k)} L${f1(x + 13 * k)} ${f1(y - 1 * k)} L${f1(x + 9 * k)} ${f1(y - 10 * k)} Z" fill="${col}"><animate attributeName="opacity" values="1;0.6;1" dur="${(2 + (i % 3) * 0.6).toFixed(1)}s" repeatCount="indefinite"/></path>`;
// a lettuce, a tomato plant, herbs: a small plant growing from a tray at (x, y), by kind
function stationPlantSvg(x, y, k, kind) {
  if (kind === 0) return [0, 1, 2, 3, 4].map(i => `<ellipse cx="${f1(x + (i - 2) * 5 * k)}" cy="${f1(y - 10 * k - (i % 2) * 4 * k)}" rx="${f1(9 * k)}" ry="${f1(7 * k)}" fill="${["#7ccf5a", "#5fb847", "#9ade6e"][i % 3]}"/>`).join("");
  if (kind === 1) return `<path d="M${f1(x)} ${f1(y)} L${f1(x)} ${f1(y - 30 * k)} M${f1(x)} ${f1(y - 14 * k)} L${f1(x - 10 * k)} ${f1(y - 22 * k)} M${f1(x)} ${f1(y - 20 * k)} L${f1(x + 10 * k)} ${f1(y - 28 * k)}" stroke="#3f8f3a" stroke-width="${f1(2.5 * k)}" fill="none"/>` +
    [[-10, -22], [10, -28], [2, -32]].map(([dx, dy]) => `<circle cx="${f1(x + dx * k)}" cy="${f1(y + dy * k + 5 * k)}" r="${f1(5 * k)}" fill="#e63b2e"/>`).join("");
  return [-6, 0, 6].map(dx => `<path d="M${f1(x + dx * k)} ${f1(y)} q${f1(dx * 0.4 * k)} ${f1(-14 * k)} ${f1(dx * 0.6 * k)} ${f1(-24 * k)}" stroke="#4caf50" stroke-width="${f1(2 * k)}" fill="none"/><ellipse cx="${f1(x + dx * 1.6 * k)}" cy="${f1(y - 22 * k)}" rx="${f1(4 * k)}" ry="${f1(2.5 * k)}" fill="#66bb6a"/>`).join("");
}
// a bunk bed: two beds, one over the other, a ladder, blankets and pillows, at x, its foot at y
function stationBunkSvg(x, y, k, i) {
  const w = 190 * k, frame = "#7b869e", blanket = [["#3b82f6", "#f59e0b"], ["#ec4899", "#10b981"]][i % 2];
  return [0, 1].map(lvl => { const by = y - 40 * k - lvl * 110 * k;
    return `<rect x="${f1(x - w / 2)}" y="${f1(by - 10 * k)}" width="${f1(w)}" height="${f1(16 * k)}" fill="${frame}"/>` +
      `<rect x="${f1(x - w / 2 + 6 * k)}" y="${f1(by - 26 * k)}" width="${f1(w - 12 * k)}" height="${f1(18 * k)}" rx="${f1(6 * k)}" fill="${blanket[lvl]}"/>` +
      `<rect x="${f1(x - w / 2 + 10 * k)}" y="${f1(by - 34 * k)}" width="${f1(40 * k)}" height="${f1(14 * k)}" rx="${f1(6 * k)}" fill="#f8fafc"/>`; }).join("") +
    [-1, 1].map(sd => `<rect x="${f1(x + sd * w / 2 - (sd > 0 ? 8 : 0) * k)}" y="${f1(y - 190 * k)}" width="${f1(8 * k)}" height="${f1(190 * k)}" fill="${frame}"/>`).join("") +
    `<g stroke="#a7b1c6" stroke-width="${f1(3 * k)}"><line x1="${f1(x + w / 2 - 34 * k)}" y1="${f1(y)}" x2="${f1(x + w / 2 - 34 * k)}" y2="${f1(y - 160 * k)}"/><line x1="${f1(x + w / 2 - 14 * k)}" y1="${f1(y)}" x2="${f1(x + w / 2 - 14 * k)}" y2="${f1(y - 160 * k)}"/>` +
    [...Array(6)].map((_, j) => `<line x1="${f1(x + w / 2 - 34 * k)}" y1="${f1(y - 20 * k - j * 26 * k)}" x2="${f1(x + w / 2 - 14 * k)}" y2="${f1(y - 20 * k - j * 26 * k)}"/>`).join("") + `</g>`;
}
// a stool at x, its foot at y (the mess hall's, to sit on)
const stationStoolSvg = (x, y, k) => `<rect x="${f1(x - 4 * k)}" y="${f1(y - 52 * k)}" width="${f1(8 * k)}" height="${f1(50 * k)}" fill="#5b6782"/><ellipse cx="${f1(x)}" cy="${f1(y - 2 * k)}" rx="${f1(18 * k)}" ry="${f1(4 * k)}" fill="#5b6782"/>` +
  `<ellipse cx="${f1(x)}" cy="${f1(y - 54 * k)}" rx="${f1(24 * k)}" ry="${f1(8 * k)}" fill="#f97316"/>`;
// a tray of food: a bowl of lentil soup, a slice of bread, an apple (all vegetarian), at (x, y)
const stationTraySvg = (x, y, k) => `<rect x="${f1(x - 30 * k)}" y="${f1(y - 6 * k)}" width="${f1(60 * k)}" height="${f1(6 * k)}" rx="${f1(2 * k)}" fill="#94a3b8"/>` +
  `<path d="M${f1(x - 22 * k)} ${f1(y - 6 * k)} Q${f1(x - 12 * k)} ${f1(y - 20 * k)} ${f1(x - 2 * k)} ${f1(y - 6 * k)} Z" fill="#c2802f"/><ellipse cx="${f1(x - 12 * k)}" cy="${f1(y - 12 * k)}" rx="${f1(9 * k)}" ry="${f1(2.5 * k)}" fill="#e0a64a"/>` +
  `<rect x="${f1(x + 2 * k)}" y="${f1(y - 14 * k)}" width="${f1(12 * k)}" height="${f1(8 * k)}" rx="${f1(3 * k)}" fill="#e7c27d"/><circle cx="${f1(x + 22 * k)}" cy="${f1(y - 12 * k)}" r="${f1(6 * k)}" fill="#e53935"/>`;
const MESS_STOOLS = [-210, -110, 110, 210];
SEATS.stationmess = c => { const { g, k } = c;
  return MESS_STOOLS.map((x, i) => ({ name: `stool ${i + 1}`, x0: (x - 22) * k, x1: (x + 22) * k, y: g + 50 * k - 56 * k, z: g + 50 * k + 1, facing: ["front", "left", "right"] })); };
SEATS.stationbunks = c => { const { g, k } = c;
  return [-200, 200].map((x, i) => ({ name: `bottom bunk ${i ? "on the right" : "on the left"}`, x0: (x - 80) * k, x1: (x + 40) * k, y: g - 20 * k - 58 * k, z: g - 20 * k + 1, facing: ["front", "left", "right"] })); };
function stationScene(c) {
  const { x0, y0, W, H, g, k, o } = c, kind = c.kind, fl = stationFloor(c);
  const view = [o.spaceSeed, o.spaceStars, o.spaceNebula, o.spacePlanet, o.spacePlanetSize, o.spacePlanetX, o.spaceMoons, o.starShape, o.starSize, o.starBright, o.starTwinkle, sceneLfoKey(o, "fast")];
  const tint = { stationlab: "#d7dee9", stationgarden: "#cfe3d4", stationbunks: "#d9d2e6", stationkitchen: "#e6ddd0", stationmess: "#d3dde6" }[kind];
  const port = { stationlab: [-0.33, 0.28, 80], stationgarden: [0, 0.24, 72], stationbunks: [0, 0.26, 78], stationkitchen: [0.33, 0.26, 74], stationmess: [0, 0.25, 90] }[kind];
  let s = SEP + part(kind + "-shell", [c.F, ...view], () => wallObj("the station's wall", stationShellSvg(c, tint, port[0] * W, y0 + H * port[1], port[2] * k, "bg-" + kind)));
  s += SEP + part(kind + "-things", [c.F], () => {
    let t = "";
    if (kind === "stationlab") {
      // benches with flasks, a microscope, a screen with a helix, a tank with an alien plant in it
      t += wallObj("the lab's bench", stationCounterSvg(-W * 0.15, W * 0.45, fl, 80 * k, k) +
        [0, 1, 2, 3].map(i => stationFlaskSvg(-W * 0.1 + i * 44 * k, fl - 88 * k, k, ["#7ef9ff", "#b6ff7a", "#ff9bf0", "#ffe600"][i], i)).join("") +
        `<g transform="translate(${f1(W * 0.33)} ${f1(fl - 88 * k)})"><rect x="${f1(-16 * k)}" y="${f1(-6 * k)}" width="${f1(32 * k)}" height="${f1(6 * k)}" fill="#334155"/><path d="M0 ${f1(-6 * k)} L${f1(-6 * k)} ${f1(-40 * k)} L${f1(4 * k)} ${f1(-46 * k)}" stroke="#334155" stroke-width="${f1(6 * k)}" fill="none" stroke-linecap="round"/><rect x="${f1(-2 * k)}" y="${f1(-62 * k)}" width="${f1(10 * k)}" height="${f1(20 * k)}" fill="#475569" transform="rotate(-20)"/></g>` +
        bridgeScreenSvg(W * 0.02, y0 + H * 0.16, 130 * k, 80 * k, k, 2, 1, o));
      t += obj("the tank with an alien plant", g - 20 * k, `<rect x="${f1(-W * 0.36)}" y="${f1(g - 20 * k - 150 * k)}" width="${f1(70 * k)}" height="${f1(150 * k)}" rx="${f1(8 * k)}" fill="#7ef9ff" opacity="0.25" stroke="#9fb3c8" stroke-width="${f1(3 * k)}"/>` + alienPlantSvg(-W * 0.36 + 35 * k, g - 26 * k, k * 0.8, 0, 0));
    } else if (kind === "stationgarden") {
      // grow lights over hydroponic shelves of plants, a water pipe running along them
      t += wallObj("the hydroponic shelves", [-1, 1].map(sd => { const xa = sd < 0 ? -W * 0.46 : W * 0.12, xb = sd < 0 ? -W * 0.12 : W * 0.46;
        return [0, 1, 2].map(lvl => { const y = fl - 20 * k - lvl * 90 * k;
          return `<rect x="${f1(xa)}" y="${f1(y - 70 * k)}" width="${f1(xb - xa)}" height="${f1(6 * k)}" rx="${f1(3 * k)}" fill="#e879f9" opacity="0.9"><animate attributeName="opacity" values="0.9;0.7;0.9" dur="3s" repeatCount="indefinite"/></rect>` +
            `<rect x="${f1(xa)}" y="${f1(y - 64 * k)}" width="${f1(xb - xa)}" height="${f1(64 * k)}" fill="#f0abfc" opacity="0.12"/>` +
            `<rect x="${f1(xa)}" y="${f1(y)}" width="${f1(xb - xa)}" height="${f1(10 * k)}" fill="#94a3b8"/><rect x="${f1(xa)}" y="${f1(y + 10 * k)}" width="${f1(xb - xa)}" height="${f1(4 * k)}" fill="#38bdf8"/>` +
            [...Array(Math.floor((xb - xa) / (34 * k)))].map((_, j) => stationPlantSvg(xa + 17 * k + j * 34 * k, y, k, (j + lvl) % 3)).join(""); }).join("") +
          [xa, xb].map(x => `<rect x="${f1(x - 4 * k)}" y="${f1(fl - 220 * k)}" width="${f1(8 * k)}" height="${f1(220 * k)}" fill="#64748b"/>`).join(""); }).join(""));
      t += obj("a watering can on a crate", g + 30 * k, `<rect x="${f1(-30 * k)}" y="${f1(g + 30 * k - 40 * k)}" width="${f1(60 * k)}" height="${f1(40 * k)}" fill="#a16207"/><path d="M${f1(-14 * k)} ${f1(g - 10 * k)} h${f1(28 * k)} v${f1(-24 * k)} h${f1(-28 * k)} Z M${f1(14 * k)} ${f1(g - 28 * k)} l${f1(18 * k)} ${f1(-12 * k)}" fill="#22c55e" stroke="#22c55e" stroke-width="${f1(4 * k)}"/>`);
    } else if (kind === "stationbunks") {
      // two bunk beds, lockers between them
      t += obj("bunk bed, left", g - 20 * k, stationBunkSvg(-200 * k, g - 20 * k, k, 0)) + obj("bunk bed, right", g - 20 * k, stationBunkSvg(200 * k, g - 20 * k, k, 1));
      t += wallObj("lockers", [0, 1].map(i => `<rect x="${f1((-50 + i * 52) * k)}" y="${f1(fl - 200 * k)}" width="${f1(48 * k)}" height="${f1(200 * k)}" rx="${f1(3 * k)}" fill="#94a3b8" stroke="#64748b" stroke-width="${f1(2 * k)}"/>` +
        [0, 1, 2].map(j => `<rect x="${f1((-42 + i * 52) * k)}" y="${f1(fl - 186 * k + j * 8 * k)}" width="${f1(30 * k)}" height="${f1(3 * k)}" fill="#64748b"/>`).join("") + `<circle cx="${f1((-10 + i * 52) * k)}" cy="${f1(fl - 100 * k)}" r="${f1(3 * k)}" fill="#334155"/>`).join(""));
    } else if (kind === "stationkitchen") {
      // counters, an oven and a food printer, a fridge, pots, and food on the counter
      t += wallObj("the kitchen's counter", stationCounterSvg(-W * 0.46, W * 0.15, fl, 84 * k, k, "#e5e7eb", "#64748b") +
        `<rect x="${f1(-W * 0.44)}" y="${f1(fl - 230 * k)}" width="${f1(80 * k)}" height="${f1(146 * k)}" rx="${f1(6 * k)}" fill="#cbd5e1" stroke="#94a3b8" stroke-width="${f1(2 * k)}"/><rect x="${f1(-W * 0.44 + 66 * k)}" y="${f1(fl - 200 * k)}" width="${f1(5 * k)}" height="${f1(40 * k)}" fill="#64748b"/>` +
        `<rect x="${f1(-W * 0.2)}" y="${f1(fl - 160 * k)}" width="${f1(90 * k)}" height="${f1(70 * k)}" rx="${f1(8 * k)}" fill="#334155"/><rect x="${f1(-W * 0.2 + 10 * k)}" y="${f1(fl - 150 * k)}" width="${f1(70 * k)}" height="${f1(36 * k)}" rx="${f1(4 * k)}" fill="#0ea5e9" opacity="0.6"/>` +
        `<text x="${f1(-W * 0.2 + 45 * k)}" y="${f1(fl - 102 * k)}" font-size="${f1(9 * k)}" text-anchor="middle" fill="#e2e8f0" font-family="system-ui,sans-serif">FOOD PRINTER</text>` +
        stationTraySvg(-W * 0.02, fl - 90 * k, k) + `<path d="M${f1(W * 0.06)} ${f1(fl - 92 * k)} h${f1(40 * k)} l${f1(-4 * k)} ${f1(-22 * k)} h${f1(-32 * k)} Z" fill="#475569"/><rect x="${f1(W * 0.06 - 8 * k)}" y="${f1(fl - 112 * k)}" width="${f1(8 * k)}" height="${f1(4 * k)}" fill="#475569"/>`);
    } else {
      // the mess hall: a long table, trays of food on it, stools round it
      t += obj("the long table", g + 20 * k, `<rect x="${f1(-W * 0.36)}" y="${f1(g + 20 * k - 70 * k)}" width="${f1(W * 0.72)}" height="${f1(12 * k)}" rx="${f1(4 * k)}" fill="#cbd5e1"/>` +
        [-1, 1].map(sd => `<rect x="${f1(sd * W * 0.3 - 6 * k)}" y="${f1(g + 20 * k - 58 * k)}" width="${f1(12 * k)}" height="${f1(58 * k)}" fill="#64748b"/>`).join("") +
        [-0.22, -0.07, 0.07, 0.22].map(u => stationTraySvg(u * W, g + 20 * k - 70 * k, k)).join(""));
      t += MESS_STOOLS.map((x, i) => obj(`stool ${i + 1}`, g + 50 * k, stationStoolSvg(x * k, g + 50 * k, k))).join("");
      t += wallObj("the menu screen", bridgeScreenSvg(W * 0.28, y0 + H * 0.16, 110 * k, 70 * k, k, 1, 3, o));
    }
    return t;
  });
  // (ticket 800) in the cat universe, cats live in every room of the station
  if (catverse()) s += SEP + part(kind + "-cats", [c.F], () => catverseCats({
    stationlab: [["a cat on the bench", W * 0.2, fl - 88 * k, k, 0, "sit"], ["a cat walking", -W * 0.12, g + 60 * k, k, 1, "walk"]],
    stationgarden: [["a cat asleep on the top shelf", W * 0.3, fl - 200 * k, k * 0.9, 3, "sleep"], ["a cat by the crate", 70 * k, g + 40 * k, k, 2, "sit"]],
    stationbunks: [["a cat asleep on the left bunk", -220 * k, g - 86 * k, k, 1, "sleep"], ["a cat asleep on the right top bunk", 190 * k, g - 196 * k, k, 0, "sleep"], ["a cat by the lockers", 0, g + 40 * k, k, 2, "sit"]],
    stationkitchen: [["a cat on the counter", -W * 0.3, fl - 92 * k, k, 3, "sit"], ["a cat walking", W * 0.22, g + 50 * k, k, 0, "walk"]],
    stationmess: MESS_STOOLS.map((x, i) => [`a cat on stool ${i + 1}`, x * k, g + 50 * k - 54 * k, k, i, "sit"]),
  }[kind]));
  return s;
}
Object.assign(SCENES, Object.fromEntries(Object.keys(STATION_ROOMS).map(kd => [kd, c => stationScene({ ...c, kind: kd })])));

// ===================== THE ROCKET =====================
// (ticket 799, for N; Matthew: "let's create a rocket, about the scale of the horse, that the friend can climb inside of. like
// the horse, we are either having it hover next to us (it hovers instead of walks), or we are hoving within it (like the
// horse's walking when we ride) ... please create 12 styles of spaceships, themed after different astrological signs,
// somehow. They are all the same size (about 1.5x the height of the friend, and big enough to plausibly contain them)")
// Twelve rockets, one for each sign of the zodiac, each the same shape underneath (a capsule body, a nose, two fins, a nozzle
// and its flame, a round window) and each its sign's own: its colours, its glyph, and a motif from its creature or emblem.
const ROCKET_STYLES = [["aries", "♈ Aries, the ram"], ["taurus", "♉ Taurus, the bull"], ["gemini", "♊ Gemini, the twins"], ["cancer", "♋ Cancer, the crab"],
  ["leo", "♌ Leo, the lion"], ["virgo", "♍ Virgo, the maiden of the harvest"], ["libra", "♎ Libra, the scales"], ["scorpio", "♏ Scorpio, the scorpion"],
  ["sagittarius", "♐ Sagittarius, the archer"], ["capricorn", "♑ Capricorn, the sea-goat"], ["aquarius", "♒ Aquarius, the water-bearer"], ["pisces", "♓ Pisces, the fishes"]];
const ROCKET_LOOKS = {
  aries: { body: "#e23b3b", trim: "#ffd166", fin: "#9b1c1c", glyph: "♈" }, taurus: { body: "#3f8f4f", trim: "#e9d8a6", fin: "#1f5130", glyph: "♉" },
  gemini: { body: "#ffd23f", trim: "#5b8def", fin: "#c99a00", glyph: "♊" }, cancer: { body: "#d9dee8", trim: "#7fc8f8", fin: "#e07a5f", glyph: "♋" },
  leo: { body: "#f59e0b", trim: "#fff1b8", fin: "#b45309", glyph: "♌" }, virgo: { body: "#a3c585", trim: "#f2e8cf", fin: "#6a8f4e", glyph: "♍" },
  libra: { body: "#f9a8d4", trim: "#5eead4", fin: "#be4b8f", glyph: "♎" }, scorpio: { body: "#7f1d3b", trim: "#111827", fin: "#4c0519", glyph: "♏" },
  sagittarius: { body: "#7c3aed", trim: "#fcd34d", fin: "#4c1d95", glyph: "♐" }, capricorn: { body: "#78716c", trim: "#a7f3d0", fin: "#44403c", glyph: "♑" },
  aquarius: { body: "#2f7fd9", trim: "#bae6fd", fin: "#1e40af", glyph: "♒" }, pisces: { body: "#14b8a6", trim: "#c4b5fd", fin: "#0f766e", glyph: "♓" },
};
// a rocket h tall, its nozzle's foot at (0, 0), its window's middle at (0, wy) of radius wr; open: the window a hole (the friend
// inside seen through it), else glass; the flame lit
function rocketSvg(style, h, wy, wr, open, id) {
  const L = ROCKET_LOOKS[style] || ROCKET_LOOKS.aries, r = h * 0.2, bodyTop = -h * 0.78, bodyBot = -h * 0.1, u = h / 100;
  const shell = `M${f1(-r)} ${f1(bodyBot)} L${f1(-r)} ${f1(bodyTop + r * 0.6)} Q${f1(-r)} ${f1(bodyTop - r * 0.3)} 0 ${f1(-h)} Q${f1(r)} ${f1(bodyTop - r * 0.3)} ${f1(r)} ${f1(bodyTop + r * 0.6)} L${f1(r)} ${f1(bodyBot)} Z`;
  const hole = `M${f1(-wr)} ${f1(wy)} a${f1(wr)} ${f1(wr)} 0 1 0 ${f1(2 * wr)} 0 a${f1(wr)} ${f1(wr)} 0 1 0 ${f1(-2 * wr)} 0 Z`;
  const fins = [-1, 1].map(sd => `<path d="M${f1(sd * r)} ${f1(bodyBot - h * 0.22)} Q${f1(sd * (r + h * 0.16))} ${f1(bodyBot - h * 0.06)} ${f1(sd * (r + h * 0.14))} ${f1(bodyBot + h * 0.06)} L${f1(sd * r)} ${f1(bodyBot)} Z" fill="${L.fin}"/>`).join("");
  // (each sign's own: a motif drawn on or about the body)
  const motif = {
    aries: [-1, 1].map(sd => `<path d="M${f1(sd * r * 0.3)} ${f1(-h * 0.86)} q${f1(sd * r * 1.4)} ${f1(-h * 0.06)} ${f1(sd * r * 0.9)} ${f1(h * 0.1)} q${f1(-sd * r * 0.4)} ${f1(h * 0.06)} ${f1(-sd * r * 0.5)} ${f1(-h * 0.03)}" fill="none" stroke="${L.trim}" stroke-width="${f1(3 * u)}" stroke-linecap="round"/>`).join(""),
    taurus: [-1, 1].map(sd => `<path d="M${f1(sd * r * 0.6)} ${f1(-h * 0.8)} q${f1(sd * r * 0.9)} ${f1(-h * 0.02)} ${f1(sd * r * 1.1)} ${f1(-h * 0.14)}" fill="none" stroke="${L.trim}" stroke-width="${f1(3.5 * u)}" stroke-linecap="round"/>`).join(""),
    gemini: [-1, 1].map(sd => `<rect x="${f1(sd * (r + 3 * u) - (sd < 0 ? 7 * u : 0))}" y="${f1(-h * 0.62)}" width="${f1(7 * u)}" height="${f1(h * 0.42)}" rx="${f1(3.5 * u)}" fill="${L.trim}"/>`).join(""),
    cancer: [-1, 1].map(sd => `<path d="M${f1(sd * r)} ${f1(-h * 0.5)} q${f1(sd * r * 0.9)} ${f1(-h * 0.06)} ${f1(sd * r * 0.8)} ${f1(-h * 0.16)} q${f1(-sd * r * 0.3)} ${f1(h * 0.02)} ${f1(-sd * r * 0.25)} ${f1(h * 0.08)}" fill="${L.fin}"/>`).join(""),
    leo: [...Array(14)].map((_, i) => { const a = i / 14 * 2 * Math.PI; return `<path d="M${f1(Math.cos(a) * wr * 1.15)} ${f1(wy + Math.sin(a) * wr * 1.15)} L${f1(Math.cos(a) * wr * 1.5)} ${f1(wy + Math.sin(a) * wr * 1.5)}" stroke="${L.trim}" stroke-width="${f1(3 * u)}" stroke-linecap="round"/>`; }).join(""),
    virgo: [-1, 1].map(sd => [0, 1, 2].map(j => `<ellipse cx="${f1(sd * (r + 4 * u))}" cy="${f1(-h * (0.4 + 0.07 * j))}" rx="${f1(2.5 * u)}" ry="${f1(5 * u)}" transform="rotate(${sd * 25} ${f1(sd * (r + 4 * u))} ${f1(-h * (0.4 + 0.07 * j))})" fill="#e9c46a"/>`).join("")).join(""),
    libra: `<line x1="${f1(-r * 1.3)}" y1="${f1(-h * 0.5)}" x2="${f1(r * 1.3)}" y2="${f1(-h * 0.5)}" stroke="${L.trim}" stroke-width="${f1(3 * u)}"/>` + [-1, 1].map(sd => `<path d="M${f1(sd * r * 1.3 - 6 * u)} ${f1(-h * 0.44)} q${f1(6 * u)} ${f1(6 * u)} ${f1(12 * u)} 0 Z" fill="${L.trim}"/>`).join(""),
    scorpio: `<path d="M${f1(r * 0.2)} ${f1(-h * 0.97)} q${f1(r * 1.4)} ${f1(-h * 0.02)} ${f1(r * 1.2)} ${f1(-h * 0.18)} q${f1(-r * 0.1)} ${f1(-h * 0.06)} ${f1(-r * 0.45)} ${f1(-h * 0.04)}" fill="none" stroke="${L.fin}" stroke-width="${f1(5 * u)}" stroke-linecap="round"/><path d="M${f1(r * 0.75)} ${f1(-h * 1.2)} l${f1(-6 * u)} ${f1(-5 * u)} l${f1(1 * u)} ${f1(8 * u)} Z" fill="${L.trim}"/>`,
    sagittarius: `<path d="M0 ${f1(-h * 1.06)} l${f1(-7 * u)} ${f1(10 * u)} h${f1(14 * u)} Z" fill="${L.trim}"/>` + [-1, 1].map(sd => `<path d="M${f1(sd * r)} ${f1(-h * 0.2)} l${f1(sd * 10 * u)} ${f1(-12 * u)} m${f1(-sd * 4 * u)} ${f1(14 * u)} l${f1(sd * 10 * u)} ${f1(-12 * u)}" stroke="${L.trim}" stroke-width="${f1(2.5 * u)}" fill="none"/>`).join(""),
    capricorn: [-1, 1].map(sd => `<path d="M${f1(sd * r * 0.4)} ${f1(-h * 0.88)} q${f1(sd * r * 0.2)} ${f1(-h * 0.14)} ${f1(sd * r * 1.0)} ${f1(-h * 0.18)}" fill="none" stroke="${L.trim}" stroke-width="${f1(3 * u)}" stroke-linecap="round"/>`).join("") +
      `<path d="M${f1(-r * 0.6)} ${f1(-h * 0.04)} q${f1(r * 0.6)} ${f1(h * 0.08)} ${f1(r * 1.2)} 0" fill="none" stroke="${L.trim}" stroke-width="${f1(3 * u)}"/>`,
    aquarius: [0, 1, 2].map(j => `<path d="M${f1(-r)} ${f1(-h * (0.3 + 0.06 * j))} q${f1(r * 0.25)} ${f1(-4 * u)} ${f1(r * 0.5)} 0 t${f1(r * 0.5)} 0 t${f1(r * 0.5)} 0 t${f1(r * 0.5)} 0" fill="none" stroke="${L.trim}" stroke-width="${f1(2.5 * u)}"/>`).join(""),
    pisces: [-1, 1].map(sd => `<path d="M${f1(sd * r)} ${f1(-h * 0.36)} l${f1(sd * 12 * u)} ${f1(-8 * u)} l0 ${f1(16 * u)} Z" fill="${L.trim}"/>`).join(""),
  }[style] || "";
  const flame = `<path d="M${f1(-r * 0.45)} ${f1(-h * 0.04)} Q0 ${f1(h * 0.26)} ${f1(r * 0.45)} ${f1(-h * 0.04)} Z" fill="#ff8a1f"><animate attributeName="d" values="M${f1(-r * 0.45)} ${f1(-h * 0.04)} Q0 ${f1(h * 0.26)} ${f1(r * 0.45)} ${f1(-h * 0.04)} Z;M${f1(-r * 0.4)} ${f1(-h * 0.04)} Q0 ${f1(h * 0.18)} ${f1(r * 0.4)} ${f1(-h * 0.04)} Z;M${f1(-r * 0.45)} ${f1(-h * 0.04)} Q0 ${f1(h * 0.26)} ${f1(r * 0.45)} ${f1(-h * 0.04)} Z" dur="0.25s" repeatCount="indefinite"/></path>` +
    `<path d="M${f1(-r * 0.22)} ${f1(-h * 0.04)} Q0 ${f1(h * 0.14)} ${f1(r * 0.22)} ${f1(-h * 0.04)} Z" fill="#fff3b0"/>`;
  return `<defs><linearGradient id="${id}-sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.25"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.25"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></linearGradient></defs>` +
    flame + `<path d="M${f1(-r * 0.55)} ${f1(bodyBot)} L${f1(-r * 0.45)} ${f1(-h * 0.04)} L${f1(r * 0.45)} ${f1(-h * 0.04)} L${f1(r * 0.55)} ${f1(bodyBot)} Z" fill="#4b5563"/>` + fins +
    `<path d="${shell} ${open ? hole : ""}" fill="${L.body}" fill-rule="evenodd"/><path d="${shell} ${open ? hole : ""}" fill="url(#${id}-sh)" fill-rule="evenodd"/>` +
    `<path d="M${f1(-r)} ${f1(bodyBot - 6 * u)} h${f1(2 * r)}" stroke="${L.trim}" stroke-width="${f1(4 * u)}"/>` + motif +
    `<circle cx="0" cy="${f1(wy)}" r="${f1(wr)}" fill="${open ? "#bfe9ff" : "#9fd8f5"}" opacity="${open ? 0.25 : 0.95}" stroke="${L.trim}" stroke-width="${f1(5 * u)}"/>` +
    `<text x="0" y="${f1(-h * 0.24)}" font-size="${f1(16 * u)}" text-anchor="middle" fill="${L.trim}" font-family="system-ui,'Segoe UI Symbol',sans-serif">${L.glyph}</text>`;
}

// (ticket 799: "using the rocket, we can traverse between start world and outer space, and within outer space, and onto the
// alien planet") a rocket trip: the friend, in their rocket, flies up out of the top of the picture and lands at `to`; ↩️ the
// back chip takes them back, as after a doorway's trip, and 🏡 takes them straight back to where their trips began
const ROCKET_TRIPS = [["starfield", "✨ the starfield"], ["bridge", "🛸 the starship's bridge"], ["alienplanet", "👽 the alien planet"], ["stationlab", "🧪 the station's lab"],
  ["stationgarden", "🌱 the station's greenhouse"], ["stationbunks", "🛏️ the station's quarters"], ["stationkitchen", "🍳 the station's kitchen"], ["stationmess", "🍽️ the station's mess hall"]];
function rocketTo(to, home = false) {
  const B = state.background, body = state.body;
  if (!SCENES[to] || B.kind === to || entering) return;
  if ((body.rocket || "none") === "none") body.rocket = "ride";   // (a trip is made inside it)
  if (body.horse && body.horse !== "none") body.horse = "none";
  body.sit = false; B.seat = null;
  const from = { kind: B.kind, inside: B.inside, tent: B.tent, castleRoom: B.castleRoom, figX: B.figX ?? 0, figY: B.figY ?? 0, to };
  changed();
  const r = document.getElementById("pic").getBoundingClientRect();
  flyInto({ x: r.left + r.width / 2 - 30, y: r.top - 60, width: 60, height: 60 }, () => {
    if (home) trips.length = 0; else trips.push(from);
    const [figX, figY] = ARRIVE[to] || [0, 0];
    Object.assign(B, { kind: to, figX, figY }); arriveSettle = true;
  });
}
// 🏡 home: where the trips began (the first trip's place), the stack cleared
function rocketHome() { if (!trips.length) return; const h = trips[0]; rocketTo(h.kind, true); }

// ===================== THE BLACK HOLE, AND THE CAT UNIVERSE =====================
// (ticket 800, for N; Matthew: "N wants there to be a space background with a black hole. entering this black hole is safe,
// but leads to a parallel space universe (another world) where: every human is a cat; all aliens are alien cats of some
// kind; all creatures on the space station are cats. in the parallel cat space world, there's also a black hole leading back
// to 'person universe' ... let's explore the idea of becoming certain animals by doing this first.") Which universe the
// friend is in is the background's `universe`, "people" or "cats", saved with it. In 🐱 the cat universe the friend is a cat
// (drawn in the cat's suit, drawNow, whatever they wear: their own clothes are kept), the alien planet's grey aliens are
// alien cats, cats crew the bridge, and cats live in every room of the station. 🕳️ The black hole: tap it, and the friend
// falls in, safely, and comes out of the other universe's black hole.
const catverse = () => state.background.universe === "cats";
// the cats of the cat universe's station, and its alien cats, as the castle's cat room draws its cats (shoulderCat sitting,
// sleepingCat, walkingCat), at (x, y), s their size (a castle cat is 0.85 k)
const CAT_COATS = [{ catFur: "#e8862a", catWhite: "#ffffff", catEyes: "#22c55e", catNose: "#f4a0b0" }, { catFur: "#1f1f22", catWhite: "#ffffff", catEyes: "#c6d43a", catNose: "#f4a0b0" },
  { catFur: "#6f6f7d", catWhite: "off", catEyes: "#e0a800", catNose: "#f4a0b0" }, { catFur: "#f3efe6", catWhite: "off", catEyes: "#3b82f6", catNose: "#f4a0b0" }];
const ALIEN_CAT_COATS = [{ catFur: "#5fd38d", catWhite: "#d8ffe0", catEyes: "#00e5ff", catNose: "#ff6fae" }, { catFur: "#a78bfa", catWhite: "#ede9fe", catEyes: "#fde047", catNose: "#f472b6" },
  { catFur: "#38bdf8", catWhite: "#e0f2fe", catEyes: "#ff6fae", catNose: "#fb7185" }, { catFur: "#f472b6", catWhite: "#fce7f3", catEyes: "#7ef9ff", catNose: "#a855f7" }];
function spaceCatSvg(x, y, s, WC, pose, i, antennae = false) {
  const W = catWag({}, i), inner = pose === "sleep" ? sleepingCat(WC, W, i) : pose === "walk" ? walkingCat(WC, W, i) : shoulderCat(4, WC, W, false);
  // (an alien cat's two antennae, glowing at their tips, over its ears)
  const ant = antennae ? [-1, 1].map(sd => `<path d="M${f1(sd * 6 + (pose === "sit" ? -2 : 18))} -50 q${f1(sd * 6)} -14 ${f1(sd * 12)} -20" fill="none" stroke="${WC.catFur}" stroke-width="2.5" stroke-linecap="round"/>` +
    `<circle cx="${f1(sd * 18 + (pose === "sit" ? -2 : 18))}" cy="-70" r="4" fill="${WC.catEyes}"><animate attributeName="opacity" values="1;0.4;1" dur="${(1.4 + 0.3 * i).toFixed(1)}s" repeatCount="indefinite"/></circle>`).join("") : "";
  return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(20 * s)}" ry="${f1(4 * s)}" fill="#000000" opacity="0.15"/><g transform="translate(${f1(x)} ${f1(y + (pose === "sit" ? 7 * s : 0))}) scale(${s.toFixed(3)})">${ant}${inner}</g>`;
}
// the cats in a place of the cat universe: [name, x, y (the foot's depth), size, coat, pose], drawn among its things
function catverseCats(list, alien = false) {
  return list.map(([name, x, y, s, coat, pose], i) => obj(name, y, spaceCatSvg(x, y, s, (alien ? ALIEN_CAT_COATS : CAT_COATS)[coat % 4], pose, i, alien))).join("");
}
// 🕳️ the black hole: deep space round it, the stars, a glow; its disk of hot gas going round (back half, then the hole, the
// light bent over its top, the front half); the hole itself, black, ringed with light. In the cat universe its gas is pink
// and teal, and it has a cat's ears and whiskers. Tap it to fall in (blackHoleEnter).
function blackholeScene(c) {
  const { x0, y0, x1, y1, W, H, k, pad, R, all, o } = c, cats = catverse();
  const cx = 0, cy = y0 + H * 0.36, rh = H * 0.13, disk = cats ? ["#ff6fae", "#7ef9ff", "#ffe0f0"] : ["#ff7a1a", "#ffd166", "#fff6e0"];
  let s = SEP + part("blackhole-sky", [c.F, cats, o.spaceSeed, o.spaceStars, o.spaceNebula, o.starShape, o.starSize, o.starBright, o.starTwinkle, sceneLfoKey(o, "fast")], () =>
    spaceViewSvg({ ...c, o: { ...o, spacePlanet: "none" } }, x0 - pad, y0 - pad, x1 + pad, y1 + pad, "bg-bh-view") +
    `<defs><radialGradient id="bg-bh-glow"><stop offset="0.3" stop-color="${disk[0]}" stop-opacity="0.35"/><stop offset="1" stop-color="${disk[0]}" stop-opacity="0"/></radialGradient></defs>` +
    `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rh * 3.6)}" fill="url(#bg-bh-glow)"/>`);
  s += SEP + part("blackhole-hole", [c.F, cats], () => {
    const ring = (rx, ry, col, w, dash, dur, half) => `<path d="M${f1(cx - rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 0 ${half} ${f1(cx + rx)} ${f1(cy)}" fill="none" stroke="${col}" stroke-width="${f1(w)}" stroke-dasharray="${dash}" stroke-linecap="round">` +
      `<animate attributeName="stroke-dashoffset" values="0;${f1(-rx * 3)}" dur="${dur}s" repeatCount="indefinite"/></path>`;
    const diskHalf = half => [[2.6, 0.5, disk[0], 0.2, 7], [2.15, 0.42, disk[1], 0.16, 5], [1.75, 0.34, disk[2], 0.1, 4]].map(([f, g2, col, w, dur]) =>
      ring(rh * f, rh * g2 * 1.0, col, rh * w, `${f1(rh * 0.9)} ${f1(rh * 0.25)}`, dur, half)).join("");
    const ears = cats ? [-1, 1].map(sd => `<path d="M${f1(cx + sd * rh * 0.3)} ${f1(cy - rh * 0.92)} L${f1(cx + sd * rh * 0.85)} ${f1(cy - rh * 1.6)} L${f1(cx + sd * rh * 0.95)} ${f1(cy - rh * 0.45)} Z" fill="#000000"/>` +
      `<path d="M${f1(cx + sd * rh * 0.48)} ${f1(cy - rh * 0.92)} L${f1(cx + sd * rh * 0.82)} ${f1(cy - rh * 1.38)} L${f1(cx + sd * rh * 0.86)} ${f1(cy - rh * 0.7)} Z" fill="#ff8fc8" opacity="0.8"/>`).join("") : "";
    const whiskers = cats ? [-1, 1].map(sd => [-0.18, 0, 0.18].map(t => `<path d="M${f1(cx + sd * rh * 0.7)} ${f1(cy + rh * (0.15 + t))} q${f1(sd * rh * 0.9)} ${f1(-rh * 0.12 + t * rh * 0.6)} ${f1(sd * rh * 1.9)} ${f1(t * rh * 1.4)}" fill="none" stroke="#7ef9ff" stroke-width="${f1(rh * 0.03)}" stroke-linecap="round" opacity="0.85"/>`).join("")).join("") : "";
    return diskHalf(1) +
      // (the light from the disk's far side, bent up and over the hole)
      `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rh * 1.32)}" ry="${f1(rh * 1.32)}" fill="none" stroke="${disk[1]}" stroke-width="${f1(rh * 0.12)}" opacity="0.6"/>` +
      ears + `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rh)}" fill="#000000"/>` +
      `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rh * 1.04)}" fill="none" stroke="${disk[2]}" stroke-width="${f1(rh * 0.05)}"/>` +
      diskHalf(0) + whiskers +
      // (the way in: the hole and a little round it, to tap)
      `<g class="portal" data-blackhole=""><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rh * 1.3)}" fill="#000000" opacity="0.001"/></g>`;
  });
  return s;
}
Object.assign(SCENES, { blackhole: blackholeScene });
// falling in: the friend flies into the hole, spinning, and comes out of the other universe's black hole
function blackHoleEnter(door) {
  if (entering) return;
  const B = state.background, body = state.body;
  body.sit = false; B.seat = null;
  const r = door.getBoundingClientRect();   // (its box on the screen: the way in is a group, not a picture's own <svg>)
  flyInto({ x: r.x, y: r.y, width: r.width, height: r.height }, () => { B.universe = catverse() ? "people" : "cats"; const [figX, figY] = ARRIVE.blackhole || [0, 0]; Object.assign(B, { figX, figY }); arriveSettle = true; });
}
