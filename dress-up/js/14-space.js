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
