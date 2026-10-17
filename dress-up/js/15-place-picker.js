"use strict";
// (ticket 178) Part 15 of 26 of the game's script, run in order by index.html.

function backgroundSvg(kind, x0, y0, x1, y1, g, opts = {}) {
  const W = x1 - x0, H = y1 - y0, k = H / 700, pad = Math.max(W, H);
  // the same "random" every time, for a scene that holds still
  const R = (i, j = 0) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  const P = (x, y) => `${f1(x)} ${f1(y)}`;
  const grad = (id, a, b, ya, yb) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(ya)}" x2="0" y2="${f1(yb)}">` +
    `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const all = fill => `<rect x="${f1(x0 - pad)}" y="${f1(y0 - pad)}" width="${f1(W + 2 * pad)}" height="${f1(H + 2 * pad)}" fill="${fill}"/>`;
  // ground from y = at (a gentle wave) down past the frame
  // (landY finds its edge's height at any x, for WATER: keep the two alike)
  const land = (at, amp, fill, phase = 0) => {
    let d = `M${P(x0 - pad, at)}`;
    for (let i = 0; i <= 12; i++) {
      const x = x0 - pad + (W + 2 * pad) * i / 12;
      d += ` Q${P(x - (W + 2 * pad) / 24, at + amp * k * Math.sin(i * 1.7 + phase))} ${P(x, at)}`;
    }
    return `<path d="${d} L${P(x1 + pad, y1 + pad)} L${P(x0 - pad, y1 + pad)} Z" fill="${fill}"/>`;
  };
  const side = i => (i % 2 ? 1 : -1);
  let s = "";
  if (kind === "forest") {
    s += `<defs>${grad("bg-sky", "#a9dcf0", "#eef8e2", y0, g)}</defs>` + all("url(#bg-sky)");
    s += land(g - 150 * k, 30, "#b5dc98", 0.5);
    // the far wood: rows of pines
    s += `<defs>${pineDef("bg-wood-pine0", 51)}${pineDef("bg-wood-pine1", 53)}${leafyTreeDef("bg-wood-big0", 57, { wide: 1.25, h: 340 })}${leafyTreeDef("bg-wood-big1", 61, { wide: 1.2, h: 330 })}</defs>`;
    // (each row an object, standing at its trees' middle depth)
    for (const [row, base, col] of [[0, g - 110 * k, ["#4f8f5a", "#5c9c63"]], [1, g - 60 * k, ["#2f6b3a", "#3c7d45"]]]) {
      let t = "";
      for (let i = 0, x = x0 - 50 * k; x < x1 + 50 * k; i++, x += (row ? 52 : 40) * k) {
        const h = (row ? 210 : 150) * k * (0.8 + 0.4 * R(i, row)), b = base + 20 * k * R(i, row + 2);
        t += use(`bg-wood-pine${i % 2}`, x, b, h / 200 * (R(i, row + 4) < 0.5 ? -1 : 1), h / 200, ` color="${col[i % 2]}"`);
      }
      s += obj(row ? "pines, near row" : "pines, far row", base + 10 * k, t);
    }
    // sunbeams, slanting down through the trees onto the meadow: the sun is
    // far off and still, so they run parallel and keep their shapes; each
    // dims and brightens on its own as clouds go by the sun, now and then
    // nearly gone, brightest high up and fading toward the grass
    s += sunbeamsSvg("bg-shaft", x0, W, k, y0 - pad * 0.1, g + 20 * k, 7, 77, 0.42, opts);
    // the meadow, brightest in the middle where the figure stands
    s += land(g - 30 * k, 10, "#86c95f", 2.1) +
         `<ellipse cx="0" cy="${f1(g + 20 * k)}" rx="${f1(W * 0.42)}" ry="${f1(70 * k)}" fill="#a6e07a"/>`;
    for (let i = 0; i < 26; i++) {
      const x = x0 + W * R(i, 5), y = g - 20 * k + 110 * k * R(i, 6), c = ["#ff6fa5", "#ffd23f", "#ffffff", "#b388ff"][i % 4];
      s += [0, 72, 144, 216, 288].map(a => `<circle cx="${f1(x + 5 * k * Math.cos(a * Math.PI / 180))}" cy="${f1(y + 5 * k * Math.sin(a * Math.PI / 180))}" r="${f1(3.6 * k)}" fill="${c}"/>`).join("") +
           `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(2.6 * k)}" fill="#f2a900"/>`;
    }
    // the butterflies, flying over the meadow (at the depth of the ground under the nearest)
    s += obj("butterflies", g - 40 * k, butterfliesSvg({ k, o: opts }, [[x0 + W * 0.16, g - 70 * k, 1.1], [x1 - W * 0.18, g - 110 * k, 1], [x1 - W * 0.34, g - 40 * k, 1.2]]));
    // big leafy trees at the sides, nearest of all (the outer two nearer still)
    s += byDepth([0, 1, 2, 3].map(i => {
      const sd = side(i), x = sd * Math.max(W / 2 - (i < 2 ? 70 : 200) * k, 170 * k), b = g + (i < 2 ? 60 : 30) * k;
      const sc = i < 2 ? 1.15 : 0.9, z = 355 * k * sc / 330;
      return [`big tree, ${sd < 0 ? "left" : "right"}${i < 2 ? ", outer" : ", inner"}`, b, use(`bg-wood-big${i % 2}`, x, b, z * -sd, z)];
    }));
  } else if (kind === "underwater") {
    s += `<defs>${grad("bg-sea", "#6fd6f2", "#0b4f7a", y0, y1)}</defs>` + all("url(#bg-sea)");
    for (let j = 0; j < 5; j++) {
      const xt = x0 + W * (0.05 + 0.22 * j);
      s += `<polygon points="${P(xt, y0 - pad * 0.1)} ${P(xt + 60 * k, y0 - pad * 0.1)} ${P(xt + 10 * k + W * 0.08, g)} ${P(xt - 50 * k + W * 0.08, g)}" ` +
           `fill="#ffffff" opacity="0.1"/>`;
    }
    // far rocks, then the sandy bottom
    s += land(g - 70 * k, 40, "#2f6f8f", 1.2) + land(g - 18 * k, 8, "#e6d29a", 0.3);
    for (let i = 0; i < 30; i++)
      s += `<circle cx="${f1(x0 + W * R(i, 9))}" cy="${f1(g - 5 * k + 120 * k * R(i, 10))}" r="${f1(2.2 * k)}" fill="#c9b27a"/>`;
    // rocks on the bottom, at the sides, weed on some (each an object)
    for (let i = 0; i < 5; i++) { const x = side(i) * (W * 0.3 + W * 0.17 * R(i, 15)), y = g + (10 + 60 * R(i, 16)) * k;
      s += obj(`rock, ${side(i) < 0 ? "left" : "right"} ${(i >> 1) + 1}`, y, rockSvg(x, y, (16 + 16 * R(i, 17)) * k, 700 + i, ["#5f7f8f", "#6f8a94", "#577584"][i % 3])); }
    // seaweed swaying up from the bottom, along both sides (behind the
    // wreck and the table): two objects, a side's strands each, at their
    // middle depth
    const weed = ["", ""];
    for (let i = 0; i < 12; i++) {
      const x = side(i) * (W * 0.16 + W * 0.33 * R(i, 12)), b = g + 40 * k * R(i, 13), h = (140 + 110 * R(i, 14)) * k;
      let d = `M${P(x, b)}`;
      for (let j = 1; j <= 4; j++) d += ` Q${P(x + (j % 2 ? 1 : -1) * 22 * k, b - h * (j - 0.5) / 4)} ${P(x, b - h * j / 4)}`;
      weed[i % 2] += swaying(opts, `<path d="${d}" fill="none" stroke="${i % 2 ? "#2e8b57" : "#3cb371"}" stroke-width="${f1(8 * k)}" stroke-linecap="round"/>`, x, b, 6, R(i, 13), (4 + 2 * R(i, 14)).toFixed(1));
    }
    s += obj("seaweed, left", g + 20 * k, weed[0]) + obj("seaweed, right", g + 20 * k, weed[1]);
    // a shipwreck on the left, half sunk in the sand, its mast broken (an
    // object with the sand heaped over its keel, standing in the middle of
    // that heap)
    {
      const x = Math.min(x0 + W * 0.2, -230 * k), y = g - 10 * k, X = (a, b) => P(x + a * k, y + b * k);
      s += obj("shipwreck", y + 40 * k, `<g transform="rotate(-9 ${P(x, y)})">` +
           `<path d="M${X(-160, -40)} L${X(150, -64)} Q${X(150, 10)} ${X(110, 30)} L${X(-120, 40)} Q${X(-160, 10)} ${X(-160, -40)} Z" ` +
           `fill="#6d4c2f" stroke="#3e2a18" stroke-width="${f1(4 * k)}"/>` +
           [-20, 0, 20].map(d => `<path d="M${X(-150, -20 + d)} L${X(140, -42 + d)}" stroke="#4e3420" stroke-width="${f1(2.5 * k)}"/>`).join("") +
           [-90, -40, 10, 60].map(a => `<circle cx="${f1(x + a * k)}" cy="${f1(y - (16 + a * 0.08) * k)}" r="${f1(9 * k)}" fill="#1d3a4a" stroke="#c9a14a" stroke-width="${f1(2.5 * k)}"/>`).join("") +
           `<line x1="${f1(x + 10 * k)}" y1="${f1(y - 52 * k)}" x2="${f1(x + 30 * k)}" y2="${f1(y - 250 * k)}" stroke="#5a3d24" stroke-width="${f1(11 * k)}" stroke-linecap="round"/>` +
           `<polygon points="${X(32, -240)} ${X(110, -205)} ${X(70, -150)} ${X(90, -120)} ${X(26, -110)}" fill="#d8cfae" opacity="0.85"/>` +
           `<line x1="${f1(x + 25 * k)}" y1="${f1(y - 200 * k)}" x2="${f1(x + 95 * k)}" y2="${f1(y - 165 * k)}" stroke="#5a3d24" stroke-width="${f1(6 * k)}"/>` +
           `</g>` + `<ellipse cx="${f1(x - 20 * k)}" cy="${f1(y + 40 * k)}" rx="${f1(190 * k)}" ry="${f1(34 * k)}" fill="#e6d29a"/>`);
    }
    // a picnic table on the right, a shark sitting at each end (four
    // objects at the table's foot, in this order: the legs and bench, the
    // sharks on the bench, the table's top)
    {
      const x = Math.max(x1 - W * 0.22, 230 * k), y = g + 30 * k, X = (a, b) => P(x + a * k, y + b * k);
      const shark = sd => {
        // sitting up, facing the table (toward the middle, -sd): a grey
        // body with a white belly, a fin on its back, a tail at its feet,
        // an eye and a toothy grin, and a front fin holding up a fork
        const cx = x + sd * 128 * k, cy = y - 92 * k, T = (a, b) => P(cx - sd * a * k, cy + b * k);
        const steel = `stroke="#9aa4ad" stroke-width="${f1(3 * k)}" stroke-linecap="round"`;
        return `<path d="M${T(14, 64)} Q${T(-30, 92)} ${T(-56, 72)} L${T(-20, 58)} Z" fill="#7d8ea0" stroke="#4d5b69" stroke-width="${f1(2.5 * k)}"/>` +
          `<path d="M${T(-12, -70)} Q${T(30, -78)} ${T(30, -30)} Q${T(26, 30)} ${T(10, 66)} Q${T(-30, 60)} ${T(-34, 10)} Q${T(-40, -50)} ${T(-12, -70)} Z" ` +
          `fill="#8b9cad" stroke="#4d5b69" stroke-width="${f1(3 * k)}"/>` +
          `<path d="M${T(26, -40)} Q${T(22, 20)} ${T(8, 60)} Q${T(-4, 20)} ${T(4, -40)} Z" fill="#eef3f6"/>` +
          `<path d="M${T(-30, -10)} L${T(-62, -24)} L${T(-34, 18)} Z" fill="#7d8ea0" stroke="#4d5b69" stroke-width="${f1(2.5 * k)}"/>` +
          `<circle cx="${f1(cx - sd * 10 * k)}" cy="${f1(cy - 48 * k)}" r="${f1(6 * k)}" fill="#ffffff"/>` +
          `<circle cx="${f1(cx - sd * 12 * k)}" cy="${f1(cy - 48 * k)}" r="${f1(3 * k)}" fill="#111"/>` +
          `<path d="M${T(4, -30)} Q${T(18, -20)} ${T(28, -32)}" fill="#fff" stroke="#333" stroke-width="${f1(2 * k)}"/>` +
          [6, 13, 20].map(a => `<path d="M${T(a, -30 + (a - 4) * 0.1)} l${f1(-sd * 3 * k)} ${f1(5 * k)} l${f1(-sd * 3 * k)} ${f1(-5 * k)}" fill="#fff" stroke="#999" stroke-width="${f1(0.8 * k)}"/>`).join("") +
          // the fork, held up over the table: a handle, a crossbar, three tines
          `<line x1="${f1(cx - sd * 46 * k)}" y1="${f1(cy + 14 * k)}" x2="${f1(cx - sd * 46 * k)}" y2="${f1(cy - 34 * k)}" ${steel}/>` +
          `<line x1="${f1(cx - sd * 40 * k)}" y1="${f1(cy - 34 * k)}" x2="${f1(cx - sd * 52 * k)}" y2="${f1(cy - 34 * k)}" ${steel}/>` +
          [40, 46, 52].map(a => `<line x1="${f1(cx - sd * a * k)}" y1="${f1(cy - 34 * k)}" x2="${f1(cx - sd * a * k)}" y2="${f1(cy - 48 * k)}" ${steel}/>`).join("") +
          // ...in its front fin, wrapped round the handle
          `<path d="M${T(16, -2)} Q${T(36, -8)} ${T(52, 4)} Q${T(38, 14)} ${T(16, 10)} Z" fill="#7d8ea0" stroke="#4d5b69" stroke-width="${f1(2.5 * k)}"/>`;
      };
      s += obj("picnic bench", y, [-70, 70].map(a => `<line x1="${f1(x + a * k)}" y1="${f1(y - 60 * k)}" x2="${f1(x + a * 1.2 * k)}" y2="${f1(y)}" stroke="#7a5230" stroke-width="${f1(8 * k)}"/>`).join("") +
           `<rect x="${f1(x - 120 * k)}" y="${f1(y - 34 * k)}" width="${f1(240 * k)}" height="${f1(10 * k)}" fill="#8b5a2b"/>`) +
           obj("shark, left", y, shark(-1)) + obj("shark, right", y, shark(1));
      let top = `<rect x="${f1(x - 100 * k)}" y="${f1(y - 74 * k)}" width="${f1(200 * k)}" height="${f1(16 * k)}" fill="#8b5a2b" stroke="#5a3a1c" stroke-width="${f1(2 * k)}"/>`;
      for (let i = 0; i < 10; i++)
        top += `<rect x="${f1(x - 100 * k + i * 20 * k)}" y="${f1(y - 80 * k)}" width="${f1(20 * k)}" height="${f1(8 * k)}" fill="${i % 2 ? "#ffffff" : "#e53935"}"/>`;
      s += obj("picnic table", y, top + `<ellipse cx="${f1(x - 40 * k)}" cy="${f1(y - 84 * k)}" rx="${f1(18 * k)}" ry="${f1(5 * k)}" fill="#ffffff" stroke="#bbb" stroke-width="${f1(1.5 * k)}"/>` +
           `<path d="M${X(-52, -88)} Q${X(-40, -100)} ${X(-28, -88)} Z" fill="#f2b84b"/>` +
           `<ellipse cx="${f1(x + 40 * k)}" cy="${f1(y - 84 * k)}" rx="${f1(18 * k)}" ry="${f1(5 * k)}" fill="#ffffff" stroke="#bbb" stroke-width="${f1(1.5 * k)}"/>` +
           `<ellipse cx="${f1(x + 40 * k)}" cy="${f1(y - 90 * k)}" rx="${f1(12 * k)}" ry="${f1(6 * k)}" fill="#e57373"/>`);
    }
    // fish, and bubbles rising (each fish an object, swimming out over the
    // far rocks, the farthest bottom there is; the bubbles in front of
    // everything)
    for (let i = 0; i < 4; i++) {
      const x = x0 + W * (0.1 + 0.8 * R(i, 15)), y = y0 + (g - y0) * (0.15 + 0.4 * R(i, 16)), sd = side(i);
      s += obj(`${["orange", "yellow", "pink", "blue"][i]} fish`, g - 70 * k, `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(18 * k)}" ry="${f1(9 * k)}" fill="${["#ff9f1c", "#ffd23f", "#ff6f91", "#7bdff2"][i]}"/>` +
           `<g>${sceneLfo(opts, "fast", R(i, 15), "transform", (v, amp) => `${f1((10 + 30 * amp) * v)} ${f1(x - sd * 16 * k)} ${f1(y)}`,
             `<animateTransform attributeName="transform" type="rotate" values="-15 ${f1(x - sd * 16 * k)} ${f1(y)};15 ${f1(x - sd * 16 * k)} ${f1(y)};-15 ${f1(x - sd * 16 * k)} ${f1(y)}" dur="${(0.5 + 0.1 * i).toFixed(1)}s" repeatCount="indefinite"/>`)}` +
           `<polygon points="${P(x - sd * 16 * k, y)} ${P(x - sd * 30 * k, y - 9 * k)} ${P(x - sd * 30 * k, y + 9 * k)}" fill="${["#ff9f1c", "#ffd23f", "#ff6f91", "#7bdff2"][i]}"/></g>` +
           `<circle cx="${f1(x + sd * 9 * k)}" cy="${f1(y - 2 * k)}" r="${f1(2 * k)}" fill="#111"/>`);
    }
    let bubbles = "";
    for (let i = 0; i < 16; i++)
      bubbles += `<circle cx="${f1(x0 + W * R(i, 17))}" cy="${f1(y0 + (g - y0) * R(i, 18))}" r="${f1((3 + 6 * R(i, 19)) * k)}" fill="none" stroke="#ffffff" stroke-width="${f1(1.5 * k)}" opacity="0.7"/>`;
    s += obj("bubbles", Infinity, bubbles);
  } else if (kind === "cemetery") {
    // The stag's stone, below its cross: a slab, a tall tapered pedestal,
    // and on it a light shield with a stag's head, lettering above and
    // below.
    const stoneDeer = (x, b, h, sw, base, bw, c, ln, lt) => {
      const pt = b - base, sh = base * 0.42, sy = pt + base * 0.3, sx = sh * 0.42;
      return `<rect x="${f1(x - bw * 0.62)}" y="${f1(b - base * 0.14)}" width="${f1(bw * 1.24)}" height="${f1(base * 0.14)}" fill="#8a8b8e" stroke="${ln}" stroke-width="${f1(1.3 * k)}"/>` +
        `<path d="M${P(x - bw / 2, b - base * 0.14)} L${P(x - bw * 0.42, pt)} L${P(x + bw * 0.42, pt)} L${P(x + bw / 2, b - base * 0.14)} Z" fill="${c}" stroke="${ln}" stroke-width="${f1(1.3 * k)}"/>` +
        `<line x1="${f1(x - bw * 0.28)}" y1="${f1(pt + base * 0.16)}" x2="${f1(x + bw * 0.28)}" y2="${f1(pt + base * 0.16)}" stroke="${lt}" stroke-width="${f1(1.6 * k)}"/>` +
        `<line x1="${f1(x - bw * 0.22)}" y1="${f1(b - base * 0.22)}" x2="${f1(x + bw * 0.22)}" y2="${f1(b - base * 0.22)}" stroke="${lt}" stroke-width="${f1(1.3 * k)}"/>` +
        `<path d="M${P(x - sx, sy)} L${P(x + sx, sy)} L${P(x + sx, sy + sh * 0.55)} Q${P(x + sx, sy + sh * 0.9)} ${P(x, sy + sh)} Q${P(x - sx, sy + sh * 0.9)} ${P(x - sx, sy + sh * 0.55)} Z" fill="${lt}"/>` +
        // the stag: a long head pointing down, ears, and two branching antlers
        `<path d="M${P(x - sx * 0.22, sy + sh * 0.42)} L${P(x + sx * 0.22, sy + sh * 0.42)} L${P(x + sx * 0.1, sy + sh * 0.82)} L${P(x - sx * 0.1, sy + sh * 0.82)} Z" fill="${c}"/>` +
        [-1, 1].map(sd => `<path d="M${P(x + sd * sx * 0.2, sy + sh * 0.45)} L${P(x + sd * sx * 0.42, sy + sh * 0.38)} L${P(x + sd * sx * 0.24, sy + sh * 0.52)} Z" fill="${c}"/>` +
          `<path d="M${P(x + sd * sx * 0.12, sy + sh * 0.42)} Q${P(x + sd * sx * 0.55, sy + sh * 0.3)} ${P(x + sd * sx * 0.62, sy + sh * 0.06)} ` +
          `M${P(x + sd * sx * 0.32, sy + sh * 0.35)} L${P(x + sd * sx * 0.24, sy + sh * 0.16)} M${P(x + sd * sx * 0.5, sy + sh * 0.24)} L${P(x + sd * sx * 0.78, sy + sh * 0.14)} ` +
          `M${P(x + sd * sx * 0.58, sy + sh * 0.14)} L${P(x + sd * sx * 0.46, sy + sh * 0.04)}" fill="none" stroke="${c}" stroke-width="${f1(Math.max(1.2, sh * 0.05))}" stroke-linecap="round"/>`).join("");
    };
    // A peaceful old cemetery on a bright day: clouds, green hills, dark
    // yews, round trees and a weeping willow by a brook that winds down to
    // the front; Celtic crosses and rounded headstones in the grass, bushes,
    // and flowers everywhere.
    s += `<defs>${grad("bg-day", "#4fa8e8", "#cfeeff", y0, g - 60 * k)}${grad("bg-brook", "#7fd0f5", "#3a95d0", g - 70 * k, y1)}</defs>` + all("url(#bg-day)");
    s += `<circle cx="${f1(x1 - W * 0.12)}" cy="${f1(y0 + H * 0.12)}" r="${f1(36 * k)}" fill="#fff4b0" opacity="0.9"/>`;
    const cloud = (x, y, sc) => [[0, 0, 26], [-26, 6, 18], [26, 6, 20], [-12, -12, 18], [12, -14, 20], [40, 10, 14], [-40, 10, 12]]
      .map(([dx, dy, r]) => `<circle cx="${f1(x + dx * sc * k)}" cy="${f1(y + dy * sc * k)}" r="${f1(r * sc * k)}" fill="#ffffff"/>`).join("") +
      `<ellipse cx="${f1(x)}" cy="${f1(y + 16 * sc * k)}" rx="${f1(52 * sc * k)}" ry="${f1(8 * sc * k)}" fill="#e6eef6"/>`;
    for (let i = 0; i < 5; i++) s += drifting(cloud(x0 + W * (0.08 + 0.21 * i + 0.05 * R(i, 60)), y0 + H * (0.08 + 0.14 * R(i, 61)), 0.8 + 0.6 * R(i, 62)), i, 30 * k, opts);
    s += land(g - 150 * k, 26, "#8fcf7a", 0.3) + land(g - 105 * k, 18, "#76bd62", 1.7);
    // trees far off: dark yews, tall and narrow, and leafy ones (the shared
    // pines and leafy trees, as everywhere)
    // (one object, the row, at its trees' middle depth)
    s += `<defs>${pineDef("bg-yew", 71, { tiers: 6 })}${leafyTreeDef("bg-cem-oak", 73)}</defs>`;
    let farTrees = "";
    for (let i = 0; i < 9; i++) {
      const x = x0 + W * (i + 0.5 * R(i, 63)) / 9, b = g - 95 * k + 10 * k * R(i, 64);
      if (R(i, 65) < 0.5) { const h = (110 + 60 * R(i, 66)) * k;
        farTrees += use("bg-yew", x, b, h / 200 * 0.62, h / 200, ` color="#2f5d3a"`); }
      else { const r = (30 + 16 * R(i, 66)) * k;
        farTrees += use("bg-cem-oak", x, b, (r * 2.8 / 330) * (R(i, 68) < 0.5 ? -1 : 1), r * 2.8 / 330, ` color="#5aa04a"`); }
    }
    s += obj("far trees", g - 90 * k, farTrees);
    // the grass
    s += land(g - 62 * k, 6, "#7cc66a", 2.4);
    // a Celtic cross: a ring round the crossing, carved bosses and a little
    // knotwork, on a stepped base -- or a rounded headstone
    const stone = (x, b, h, kind, seed) => {
      const c = R(seed, 70) < 0.5 ? "#b4b8ba" : "#a3a8a6", ln = "#6b7072", dk = "#8a9092";
      if (kind === "head") {
        const w = h * 0.62;
        return `<path d="M${P(x - w / 2, b)} L${P(x - w / 2, b - h * 0.7)} Q${P(x - w / 2, b - h)} ${P(x, b - h)} Q${P(x + w / 2, b - h)} ${P(x + w / 2, b - h * 0.7)} L${P(x + w / 2, b)} Z" ` +
               `fill="${c}" stroke="${ln}" stroke-width="${f1(1.5 * k)}"/>` +
               `<path d="M${P(x - w * 0.3, b - h * 0.62)} L${P(x + w * 0.3, b - h * 0.62)} M${P(x - w * 0.24, b - h * 0.48)} L${P(x + w * 0.24, b - h * 0.48)} M${P(x - w * 0.27, b - h * 0.34)} L${P(x + w * 0.27, b - h * 0.34)}" stroke="${dk}" stroke-width="${f1(1.3 * k)}"/>` +
               `<ellipse cx="${f1(x)}" cy="${f1(b)}" rx="${f1(w * 0.7)}" ry="${f1(3 * k)}" fill="#5f9e52" opacity="0.6"/>`;
      }
      // (the stag's stone: dark granite, light knotwork, a tall pedestal
      // with a shield on it, a stag's head on the shield)
      const deer = kind === "deer";
      const c2 = deer ? "#3c3d42" : c, ln2 = deer ? "#1e1f22" : ln, dk2 = deer ? "#c9cacd" : dk;
      const sw = h * 0.13, base = h * (deer ? 0.32 : 0.16), top = b - h, cy = top + h * (deer ? 0.22 : 0.26), arm = h * 0.25, ring = h * 0.15, bw = sw * (deer ? 3.4 : 2.6);
      return (deer ? stoneDeer(x, b, h, sw, base, bw, c2, ln2, dk2) : "") + `<ellipse cx="${f1(x)}" cy="${f1(b)}" rx="${f1(bw * 0.9)}" ry="${f1(3.5 * k)}" fill="#5f9e52" opacity="0.6"/>` +
        (deer ? "" : `<rect x="${f1(x - bw / 2 - sw * 0.3)}" y="${f1(b - base * 0.45)}" width="${f1(bw + sw * 0.6)}" height="${f1(base * 0.45)}" fill="${dk}" stroke="${ln}" stroke-width="${f1(1.3 * k)}"/>` +
          `<path d="M${P(x - bw / 2, b - base * 0.45)} L${P(x - bw * 0.38, b - base)} L${P(x + bw * 0.38, b - base)} L${P(x + bw / 2, b - base * 0.45)} Z" fill="${c}" stroke="${ln}" stroke-width="${f1(1.3 * k)}"/>`) +
        `<circle cx="${f1(x)}" cy="${f1(cy)}" r="${f1(ring)}" fill="none" stroke="${ln2}" stroke-width="${f1(sw * 0.55 + 2.6 * k)}"/>` +
        `<circle cx="${f1(x)}" cy="${f1(cy)}" r="${f1(ring)}" fill="none" stroke="${c2}" stroke-width="${f1(sw * 0.55)}"/>` +
        `<path d="M${P(x - sw / 2, b - base)} L${P(x - sw / 2, cy + sw / 2)} L${P(x - arm, cy + sw / 2)} L${P(x - arm, cy - sw / 2)} L${P(x - sw / 2, cy - sw / 2)} ` +
        `L${P(x - sw / 2, top)} L${P(x + sw / 2, top)} L${P(x + sw / 2, cy - sw / 2)} L${P(x + arm, cy - sw / 2)} L${P(x + arm, cy + sw / 2)} ` +
        `L${P(x + sw / 2, cy + sw / 2)} L${P(x + sw / 2, b - base)} Z" fill="${c2}" stroke="${ln2}" stroke-width="${f1(1.5 * k)}" stroke-linejoin="round"/>` +
        [[0, 0, 0.45], [-arm + sw * 0.5, 0, 0.3], [arm - sw * 0.5, 0, 0.3], [0, -(cy - top) + sw * 0.5, 0.3]].map(([dx, dy, rr]) =>
          `<circle cx="${f1(x + dx)}" cy="${f1(cy + dy)}" r="${f1(sw * rr)}" fill="none" stroke="${dk2}" stroke-width="${f1(1.2 * k)}"/>`).join("") +
        // knotwork down the shaft: a little interlace of crossing curves
        [0, 1, 2, 3].map(j => { const y = cy + sw * 1.2 + j * (b - base - cy - sw * 1.6) / 4, d = (b - base - cy - sw * 1.6) / 8;
          return `<path d="M${P(x - sw * 0.3, y)} Q${P(x, y + d)} ${P(x + sw * 0.3, y + 2 * d)} M${P(x + sw * 0.3, y)} Q${P(x, y + d)} ${P(x - sw * 0.3, y + 2 * d)}" fill="none" stroke="${dk2}" stroke-width="${f1(deer ? 1.6 * k : 1.1 * k)}"/>`; }).join("") +
        (deer ? [-1, 1].map(sd => `<path d="M${P(x + sd * (arm - sw * 0.9), cy - sw * 0.3)} Q${P(x + sd * (arm - sw * 1.5), cy)} ${P(x + sd * (arm - sw * 0.9), cy + sw * 0.3)} ` +
                  `M${P(x + sd * sw * 0.9, cy - sw * 0.3)} Q${P(x + sd * sw * 1.5, cy)} ${P(x + sd * sw * 0.9, cy + sw * 0.3)}" fill="none" stroke="${dk2}" stroke-width="${f1(1.6 * k)}"/>`).join("")
              : `<circle cx="${f1(x - sw * 0.2)}" cy="${f1(b - base - h * 0.08)}" r="${f1(sw * 0.18)}" fill="#7fa36a" opacity="0.5"/>`);
    };
    // (ticket 99: the ground and what lies flat on it -- the grass, the
    // brook, the flowers -- comes first; then what stands, back to front:
    // the butterflies, the far stones, the willow, the near stones and
    // bushes, so nothing flat is drawn over a friend standing behind them)
    // the brook, winding down from the hills to the front on the right,
    // ripples on it, stones along it
    let willow = "";
    {
      const pts = brookAt({ W, g, k, y1 });
      let left = [], right = [];
      for (const [cx, y, w] of sampled(pts, 20)) { left.push([cx - w, y]); right.push([cx + w, y]); }
      const ring = [...left, ...right.reverse()];
      s += `<polygon points="${pts ? ring.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ") : ""}" fill="url(#bg-brook)" stroke="#5f9e52" stroke-width="${f1(4 * k)}" stroke-linejoin="round"/>`;
      // (ticket 42) its ripples flowing down it
      s += flowRipples(pts, [...Array(10)].map((_, i) => 0.08 + 0.09 * i), 2.8, w =>
        `<path d="M${f1(-w * 0.4)} 0 q${f1(w * 0.2)} ${f1(-w * 0.12)} ${f1(w * 0.4)} 0" fill="none" stroke="#e8f8ff" stroke-width="${f1(w * 0.06)}" opacity="0.85"/>`);
      for (let i = 0; i < 7; i++) {
        const [cx, y, w] = pts(0.25 + 0.1 * i), sd = i % 2 ? 1 : -1;
        s += `<ellipse cx="${f1(cx + sd * w * 1.05)}" cy="${f1(y)}" rx="${f1((5 + 4 * R(i, 72)) * k * (0.6 + i * 0.12))}" ry="${f1(3.5 * k * (0.6 + i * 0.12))}" fill="#9a9a94" stroke="#6b6b66" stroke-width="${f1(1 * k)}"/>`;
      }
      // and a weeping willow on its bank (an object, drawn after the flowers)
      const [wx, wy] = pts(0.18);
      const tx = wx + 70 * k, tb = wy + 4 * k, th = 150 * k;
      willow = obj("willow", tb, `<path d="M${P(tx - 7 * k, tb)} Q${P(tx - 2 * k, tb - th * 0.5)} ${P(tx + 6 * k, tb - th * 0.8)} L${P(tx + 12 * k, tb - th * 0.78)} Q${P(tx + 6 * k, tb - th * 0.5)} ${P(tx + 7 * k, tb)} Z" fill="#6b4a2b"/>` +
           `<ellipse cx="${f1(tx + 8 * k)}" cy="${f1(tb - th * 0.82)}" rx="${f1(62 * k)}" ry="${f1(30 * k)}" fill="#8cc06b"/>` +
           [...Array(15)].map((_, j) => { const sx = tx + 8 * k + (j - 7) * 8 * k, len = (60 + 35 * R(j, 73)) * k;
             return `<path d="M${P(sx, tb - th * 0.86)} Q${P(sx + (j - 7) * 2 * k, tb - th * 0.6)} ${P(sx + (j - 7) * 3 * k, tb - th * 0.86 + len)}" fill="none" stroke="${j % 2 ? "#7fb35e" : "#9ccc78"}" stroke-width="${f1(4 * k)}" stroke-linecap="round"/>`; }).join(""));
    }
    // flowers everywhere, in every color
    for (let i = 0; i < 46; i++) {
      const x = x0 + W * R(i, 74), y = g - 40 * k + 140 * k * R(i, 75), c = ["#ff6fa5", "#ffd23f", "#ffffff", "#b388ff", "#ff8c42", "#ff4d4d"][i % 6];
      s += [0, 72, 144, 216, 288].map(a => `<circle cx="${f1(x + 4.5 * k * Math.cos(a * Math.PI / 180))}" cy="${f1(y + 4.5 * k * Math.sin(a * Math.PI / 180))}" r="${f1(3.3 * k)}" fill="${c}"/>`).join("") +
           `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(2.3 * k)}" fill="#f2a900"/>`;
    }
    // the butterflies (at the depth of the ground under the nearest)
    s += obj("butterflies", g - 70 * k, butterfliesSvg({ k, o: opts }, [[x0 + W * 0.2, g - 120 * k, 0.9], [x1 - W * 0.22, g - 160 * k, 0.8], [x1 - W * 0.36, g - 70 * k, 1]], ["#f5f0e1", "#e8e0f0", "#d9d2c0"]));
    // the far stones, small, on the slope (one object, the row, at its
    // middle depth)
    s += obj("far stones", g - 52 * k, [[-0.3, -52, 46, "cross", 1], [-0.16, -56, 30, "head", 2], [0.06, -54, 34, "head", 3], [0.1, -50, 50, "cross", 4], [-0.42, -48, 32, "head", 5]]
      .map(([fx, dy, h, kd, seed]) => stone(W * fx, g + dy * k, h * k, kd, seed)).join(""));
    s += willow;
    // bushes, some in flower
    const bush = (x, b, r, fl) => bushSvg(x, b, r * 1.5, (x | 0) + 500, fl ? { flowers: [fl] } : {});
    // the near stones and bushes, at the sides (each an object)
    for (const [fx, dy, h, kd, seed, name] of [[-0.36, 30, 215, "deer", 6, "stag stone"], [-0.2, 4, 62, "head", 7, "headstone, left"], [0.26, 6, 120, "cross", 8, "cross"], [0.44, 26, 80, "head", 9, "headstone, right"]])
      s += obj(name, g + dy * k, stone(W * fx, g + dy * k, h * k, kd, seed));
    s += obj("pink bush", g + 30 * k, bush(-W * 0.47, g + 30 * k, 24 * k, "#ff7eb6")) + obj("green bush", g - 2 * k, bush(-W * 0.12, g - 2 * k, 16 * k, null)) +
         obj("white bush", g + 34 * k, bush(W * 0.36, g + 34 * k, 20 * k, "#ffffff")) + obj("yellow bush", g - 30 * k, bush(-W * 0.28, g - 30 * k, 14 * k, "#ffd23f"));
  } else if (kind === "witch") {
    // A witch's woods at dusk: a moon and bats, dark hills and trees; far
    // off, a hut (on giant clawed chicken legs, if chosen); a fence across
    // the middle with skulls on its posts; a giant tree on the left, its
    // roots humped out of the ground; her cauldron bubbling over a fire on
    // the right; skeletons reaching up out of the ground.
    s += `<defs>${grad("bg-dusk", "#2b1d4a", "#e0874a", y0, g - 40 * k)}</defs>` + all("url(#bg-dusk)");
    // The skulls' eyes: a red dot in each eye hole, growing and shrinking
    // so many times a minute (0: a steady glow), as big as the glow slider
    // says (a share of the hole). In sync, all together; out of sync, each
    // skull (its seed) at its own pace, from half to one and a half times
    // the rate's, from its own place in the blink. SVG's own animation, on
    // the picture's clock, so a redraw keeps them where they were.
    const blinks = opts.eyeRate ?? 30, glow = (opts.eyeGlow ?? 70) / 100, apart = !!opts.blinkApart;
    // the fence's skulls: each its own size, from the usual size up to the
    // biggest (a share of the usual), and their eyes' size
    const skullMax = Math.max(1, (opts.skullMax ?? 300) / 100), skullEye = (opts.skullEye ?? 100) / 100;
    const eyeDot = (cx, cy, hole, seed) => {
      if (glow <= 0) return "";
      const r = hole * glow, own = apart && seed !== undefined;
      const dur = (60 / blinks) * (own ? 0.5 + R(seed, 60) : 1), begin = own ? -R(seed, 61) * dur : 0;
      const anim = blinks > 0 ? `<animate attributeName="r" values="${f1(r * 0.08)};${f1(r)};${f1(r * 0.08)}" keyTimes="0;0.5;1" ` +
        `calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" dur="${dur.toFixed(3)}s" begin="${begin.toFixed(3)}s" repeatCount="indefinite"/>` : "";
      return `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="#ff2626">${anim}</circle>`;
    };
    const mx = x1 - W * 0.17, my = y0 + H * 0.15;
    s += `<circle cx="${f1(mx)}" cy="${f1(my)}" r="${f1(44 * k)}" fill="#fff3c4"/>` +
         `<circle cx="${f1(mx + 14 * k)}" cy="${f1(my - 8 * k)}" r="${f1(9 * k)}" fill="#efe0a8"/>` +
         `<circle cx="${f1(mx - 16 * k)}" cy="${f1(my + 12 * k)}" r="${f1(6 * k)}" fill="#efe0a8"/>`;
    for (let i = 0; i < 4; i++) {
      // a bat: two scalloped wings and a small body
      const bx = x0 + W * (0.12 + 0.2 * i + 0.06 * R(i, 30)), by = y0 + H * (0.08 + 0.18 * R(i, 31)), b = (14 + 6 * R(i, 32)) * k;
      s += `<g>${sceneLfo(opts, "slow", (i * 0.27) % 1, "transform", (v, amp) => `${f1(b * (1.5 + 4 * amp) * v)} ${f1(b * 0.6 * v)}`,
        `<animateTransform attributeName="transform" type="translate" values="0 0;${f1(b * 2.5)} ${f1(b * 0.6)};0 0" dur="${6 + i}s" repeatCount="indefinite"/>`, "translate")}` +
           `<path d="M${P(bx, by)} Q${P(bx - b * 0.5, by - b * 0.6)} ${P(bx - b * 1.2, by - b * 0.2)} Q${P(bx - b * 0.9, by + b * 0.05)} ${P(bx - b * 0.75, by + b * 0.25)} ` +
           `Q${P(bx - b * 0.5, by + 0.02 * b)} ${P(bx - b * 0.3, by + b * 0.3)} Q${P(bx - b * 0.15, by + b * 0.05)} ${P(bx, by + b * 0.2)} ` +
           `Q${P(bx + b * 0.15, by + b * 0.05)} ${P(bx + b * 0.3, by + b * 0.3)} Q${P(bx + b * 0.5, by + 0.02 * b)} ${P(bx + b * 0.75, by + b * 0.25)} ` +
           `Q${P(bx + b * 0.9, by + b * 0.05)} ${P(bx + b * 1.2, by - b * 0.2)} Q${P(bx + b * 0.5, by - b * 0.6)} ${P(bx, by)} Z" fill="#1a1426"/></g>`;
    }
    s += land(g - 150 * k, 30, "#3a2c4f", 0.7);
    // Dead trees, each grown from its own seed: a trunk, then limbs that
    // fork two or three ways, bending as they go, thinner each time. A
    // tree has its own lean, height, spread and twist; some droop like
    // weeping trees, some are snapped-off stumps.
    const deadTree = (seed, x, y, h, w, col, depth, droop = 0, wide = 1, lean0 = 0) => {
      const out = [], lean = lean0 + (R(seed, 1) - 0.5) * 0.35, twist = 0.3 + 0.6 * R(seed, 2), spread = (0.45 + 0.4 * R(seed, 3)) * wide;
      const grow = (x, y, a, len, wd, lvl, id) => {
        const bend = (R(seed, id * 7 + 1) - 0.5) * twist;
        const mx = x + Math.cos(a) * len * 0.5, my = y + Math.sin(a) * len * 0.5;
        const ex = mx + Math.cos(a + bend) * len * 0.5, ey = my + Math.sin(a + bend) * len * 0.5;
        out.push(`<path d="M${P(x, y)} Q${P(mx, my)} ${P(ex, ey)}" fill="none" stroke="${col}" stroke-width="${f1(Math.max(0.8 * k, wd))}" stroke-linecap="round"/>`);
        if (lvl === 0) return;
        const n = 2 + (R(seed, id * 7 + 2) > 0.55 ? 1 : 0);
        for (let c = 0; c < n; c++) {
          // (droop pulls limbs down, on either side, more the farther out)
          const a0 = a + bend + (c - (n - 1) / 2) * spread * (0.7 + 0.6 * R(seed, id * 7 + 3 + c)), dr = droop * 0.22 * (depth - lvl + 1);
          const na = Math.atan2(Math.sin(a0) + dr, Math.cos(a0));
          grow(ex, ey, na, len * (0.55 + 0.3 * R(seed, id * 11 + c)), wd * 0.6, lvl - 1, id * 3 + c + 1);
        }
      };
      grow(x, y, -Math.PI / 2 + lean, h * 0.38, w, depth, 1);
      return out.join("");
    };
    // two rows far off, the farther paler (each row an object, standing at
    // its trees' middle depth)
    for (const [row, base, col, n] of [[0, g - 130 * k, "#3b2c52", 9], [1, g - 92 * k, "#24192f", 8]]) {
      let t = "";
      for (let i = 0; i < n; i++) {
        const seed = 100 + row * 40 + i, x = x0 + W * (i + 0.2 + 0.6 * R(seed, 9)) / n;
        const kind = R(seed, 10), h = (row ? 200 : 150) * k * (0.65 + 0.6 * R(seed, 11));
        if (kind < 0.12)   // a snapped-off stump
          t += deadTree(seed, x, base, h * 0.45, (row ? 9 : 6) * k, col, 2);
        else
          t += deadTree(seed, x, base + 10 * k * R(seed, 12), h, (row ? 8 : 6) * k * (0.8 + 0.5 * R(seed, 13)), col,
                        kind < 0.45 ? 4 : 3, kind > 0.8 ? 1 : 0);
      }
      s += obj(row ? "dead trees, near row" : "dead trees, far row", base + 5 * k, t);
    }
    // behind the fence, up on a rise: a log hut, on its own or (chosen) on
    // giant chicken legs, red-orange and scaly, white feathers at the top,
    // three long splayed toes and a spur on each foot, every one clawed --
    // the legs as long as their slider says. Nearer, it comes down toward
    // the fence and grows, but stays behind it (drawn before it).
    // (ticket 99) The hut, its rise and its doorway are one object. It
    // stands up on the rise, which hides the near dead trees' feet, so it is
    // in front of them although its own feet are higher up: it meets the
    // ground where the dark earth in front is drawn over the rise's foot
    // (and, when near, over its own feet), whose top, with its tufts, is
    // about g - 48k. (At its feet, hutAt, the near row's middle tree would
    // stand in front of its door.)
    const legs = !!opts.chickenLegs, ls = (opts.legSize ?? 100) / 100, near = (opts.hutNear ?? 0) / 100;
    const hutBase = g - 112 * k, hutAt = hutBase + near * 76 * k, hutScale = 1 + 1.1 * near, hutX = W * 0.19;
    let hut = `<g class="portal" data-to="witchroom"><g transform="translate(${f1(hutX)} ${f1(hutAt)}) scale(${hutScale.toFixed(3)}) translate(${f1(-hutX)} ${f1(-hutBase)})">`;
    hut += `<path d="M${P(hutX - W * 0.17, g - 40 * k)} Q${P(hutX - W * 0.03, g - 140 * k)} ${P(hutX + W * 0.17, g - 40 * k)} Z" fill="#3b2f2a"/>`;
    {
      const hx = hutX, feet = hutBase, legH = legs ? 120 * k * ls : 0, hw = 120 * k, hh = 84 * k, top = feet - legH - hh;
      const lw = Math.sqrt(ls);   // (longer legs, a little thicker)
      const red = "#e0552b", dark = "#8f2a12";
      const leg = sd => {
        const hip = [hx + sd * 30 * k, feet - legH], knee = [hx + sd * 52 * k, feet - legH * 0.5], ankle = [hx + sd * 34 * k, feet];
        const limb = (w, c) => `<path d="M${P(...hip)} L${P(...knee)} L${P(...ankle)}" fill="none" stroke="${c}" stroke-width="${f1(w * k)}" stroke-linejoin="round" stroke-linecap="round"/>`;
        const toe = (dx, dy) => {
          const tx = ankle[0] + dx * k, ty = ankle[1] + dy * k, ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy);
          return `<line x1="${f1(ankle[0])}" y1="${f1(ankle[1])}" x2="${f1(tx)}" y2="${f1(ty)}" stroke="${dark}" stroke-width="${f1(10 * k)}" stroke-linecap="round"/>` +
                 `<line x1="${f1(ankle[0])}" y1="${f1(ankle[1])}" x2="${f1(tx)}" y2="${f1(ty)}" stroke="${red}" stroke-width="${f1(7 * k)}" stroke-linecap="round"/>` +
                 `<path d="M${P(tx - uy * 3 * k, ty + ux * 3 * k)} Q${P(tx + ux * 10 * k, ty + uy * 10 * k)} ${P(tx + ux * 14 * k + uy * 6 * k, ty + uy * 14 * k - ux * 6 * k)} ` +
                 `L${P(tx + uy * 3 * k, ty - ux * 3 * k)} Z" fill="#f2ead8" stroke="#3a2614" stroke-width="${f1(1.2 * k)}"/>`;
        };
        return limb(18 * lw, dark) + limb(13 * lw, red) +
          [0.15, 0.3, 0.6, 0.75, 0.88].map(t => { const a = t < 0.5 ? [hip, knee, t * 2] : [knee, ankle, (t - 0.5) * 2];
            const x = a[0][0] + (a[1][0] - a[0][0]) * a[2], y = a[0][1] + (a[1][1] - a[0][1]) * a[2];
            return `<line x1="${f1(x - 6 * k)}" y1="${f1(y)}" x2="${f1(x + 6 * k)}" y2="${f1(y + 2 * k)}" stroke="${dark}" stroke-width="${f1(1.6 * k)}"/>`; }).join("") +
          // white feathers where the leg meets the hut
          [-1, 0, 1].map(t => `<path d="M${P(hip[0] + t * 8 * k, hip[1] - 4 * k)} q${f1(-4 * k)} ${f1(14 * k)} ${f1(2 * k)} ${f1(22 * k)} q${f1(6 * k)} ${f1(-8 * k)} ${f1(4 * k)} ${f1(-22 * k)} Z" fill="#ffffff" stroke="#c9c9c9" stroke-width="${f1(1 * k)}"/>`).join("") +
          toe(sd * 44, 8) + toe(sd * 20, 16) + toe(-sd * 8, 14) + toe(-sd * 26, 4);
      };
      if (legs) hut += leg(-1) + leg(1);
      // the logs, a red door with a window either side, the roof
      for (let r = 0; r < 6; r++) {
        const y = top + r * hh / 6;
        hut += `<rect x="${f1(hx - hw / 2 - 6 * k)}" y="${f1(y)}" width="${f1(hw + 12 * k)}" height="${f1(hh / 6)}" rx="${f1(hh / 12)}" fill="${r % 2 ? "#8a5a32" : "#9b6a3c"}" stroke="#4a2c14" stroke-width="${f1(1.5 * k)}"/>`;
      }
      hut += `<rect x="${f1(hx - 14 * k)}" y="${f1(top + 20 * k)}" width="${f1(28 * k)}" height="${f1(hh - 20 * k)}" fill="#c0392b" stroke="#4a1410" stroke-width="${f1(2 * k)}"/>` +
           `<path d="M${P(hx - 9 * k, top + 34 * k)} l${f1(18 * k)} ${f1(18 * k)} M${P(hx + 9 * k, top + 34 * k)} l${f1(-18 * k)} ${f1(18 * k)}" stroke="#4a1410" stroke-width="${f1(2 * k)}"/>` +
           [-1, 1].map(sd => `<rect x="${f1(hx + sd * 38 * k - 11 * k)}" y="${f1(top + 18 * k)}" width="${f1(22 * k)}" height="${f1(24 * k)}" fill="#ffd166" stroke="#2a3a8a" stroke-width="${f1(3 * k)}"/>` +
             `<line x1="${f1(hx + sd * 38 * k)}" y1="${f1(top + 18 * k)}" x2="${f1(hx + sd * 38 * k)}" y2="${f1(top + 42 * k)}" stroke="#2a3a8a" stroke-width="${f1(2 * k)}"/>`).join("") +
           `<polygon points="${P(hx - hw / 2 - 20 * k, top + 4 * k)} ${P(hx, top - 52 * k)} ${P(hx + hw / 2 + 20 * k, top + 4 * k)}" fill="#6b4a2b" stroke="#3a2614" stroke-width="${f1(3 * k)}" stroke-linejoin="round"/>` +
           [1, 2, 3].map(j => `<line x1="${f1(hx - (hw / 2 + 20 * k) * (1 - j / 4))}" y1="${f1(top + 4 * k - 56 * k * (1 - j / 4) * 0 - 14 * k * j + 14 * k * 0)}" x2="${f1(hx + (hw / 2 + 20 * k) * (1 - j / 4))}" y2="${f1(top + 4 * k - 14 * k * j)}" stroke="#4a301a" stroke-width="${f1(1.5 * k)}"/>`).join("") +
           // a round window up in the gable
           `<circle cx="${f1(hx)}" cy="${f1(top - 17 * k)}" r="${f1(11 * k)}" fill="#ffd166" stroke="#2a3a8a" stroke-width="${f1(3 * k)}"/>` +
           `<path d="M${P(hx - 11 * k, top - 17 * k)} h${f1(22 * k)} M${P(hx, top - 28 * k)} v${f1(22 * k)}" stroke="#2a3a8a" stroke-width="${f1(1.5 * k)}"/>`;
    }
    hut += `</g></g>`;   // the hut, and its doorway
    s += obj("hut", g - 48 * k, hut);
    // the ground, dark earth, with tufts of grass
    s += land(g - 40 * k, 8, "#4a3a2a", 1.9);
    for (let i = 0; i < 22; i++) {
      const x = x0 + W * R(i, 41), y = g - 30 * k + 120 * k * R(i, 42);
      s += grassTuft(x, y, (12 + 8 * R(i, 43)) * k, 600 + i, "#3d5a2a", 1.8 * k);
    }
    // a palisade across the middle: pointed stakes side by side, a skull
    // on every fourth one (the skulls drawn after the whole fence, so a big
    // one is in front of the stakes beside it): the fence an object, the
    // skulls another just after it, both at the fence's foot
    {
      const fy = g - 26 * k, ph = 70 * k, step = 22 * k;
      let skulls = "", fence = "";
      fence += `<rect x="${f1(x0 - 10)}" y="${f1(fy - ph * 0.55)}" width="${f1(W + 20)}" height="${f1(6 * k)}" fill="#3a2a1a"/>`;
      for (let i = 0, x = x0 - step / 2; x < x1 + step; i++, x += step) {
        const h = ph * (0.9 + 0.2 * R(i, 50)), c = i % 2 ? "#6b5236" : "#7a5e3e";
        fence += `<polygon points="${P(x - step / 2 + 1, fy)} ${P(x - step / 2 + 1, fy - h)} ${P(x, fy - h - 12 * k)} ${P(x + step / 2 - 1, fy - h)} ${P(x + step / 2 - 1, fy)}" fill="${c}" stroke="#2f2216" stroke-width="${f1(1.4 * k)}"/>` +
             `<line x1="${f1(x - 3 * k)}" y1="${f1(fy - h * 0.8)}" x2="${f1(x - 2 * k)}" y2="${f1(fy - h * 0.3)}" stroke="#4a3622" stroke-width="${f1(1.2 * k)}"/>`;
        if (i % 4 !== 1) continue;
        // A skull on the stake, the tip in it: drawn in its own units (k at
        // the usual size; x across, y down, its eyes on the line y = -3),
        // then scaled about the tip. Bigger eyes keep their gap in the
        // middle and grow the skull to hold them, as a face's do: its sides
        // and its top out, its nose and jaw down.
        const u = k * (1 + (skullMax - 1) * R(i, 51)), tipX = x, tipY = fy - h - 12 * k;
        const r = 3.4 * skullEye, ex = 1.1 + r;
        const hw = Math.max(1, (ex + r + 3.1) / 11), up = Math.max(1, (r + 8.6) / 12), drop = Math.max(0, r - 3.4);
        const jw = 1 + (hw - 1) * 0.5;
        const L = (lx, ly) => P(tipX + lx * u, tipY + (ly - 2 - drop) * u);
        const Lx = lx => f1(tipX + lx * u), Ly = ly => f1(tipY + (ly - 2 - drop) * u);
        skulls += `<path d="M${L(-11 * hw, 2 + drop)} Q${L(-12 * hw, -3 - 11 * up)} ${L(0, -3 - 12 * up)} Q${L(12 * hw, -3 - 11 * up)} ${L(11 * hw, 2 + drop)} ` +
             `L${L(6 * jw, 4 + drop)} L${L(5 * jw, 10 + drop)} L${L(-5 * jw, 10 + drop)} L${L(-6 * jw, 4 + drop)} Z" fill="#efe8d8" stroke="#6b6355" stroke-width="${f1(1.2 * u)}"/>` +
             [-1, 1].map(sd => `<circle cx="${Lx(sd * ex)}" cy="${Ly(-3)}" r="${f1(r * u)}" fill="#1a1426"/>`).join("") +
             [-1, 1].map(sd => eyeDot(tipX + sd * ex * u, tipY + (-5 - drop) * u, r * u, i)).join("") +
             `<path d="M${L(-1.5, 3 + drop)} L${L(0, drop)} L${L(1.5, 3 + drop)} Z" fill="#1a1426"/>` +
             [-3, 0, 3].map(t => `<line x1="${Lx(t * jw)}" y1="${Ly(6 + drop)}" x2="${Lx(t * jw)}" y2="${Ly(10 + drop)}" stroke="#6b6355" stroke-width="${f1(1 * u)}"/>`).join("");
      }
      s += obj("fence", fy, fence) + obj("skulls", fy, skulls);
    }
    // and nearer: one giant on the left, its trunk massive and its limbs
    // sprawling wide toward the middle, its roots humped up out of the
    // ground and reaching far across it; and a middling one at the right
    // edge; roots spreading into the ground, a knot hole (each an object)
    for (const [seed, fx, h, w, roots, droop, wide, lean] of [[23, 0.1, 560, 64, 16, 0.45, 1.7, 0.22], [7, 0.98, 250, 16, 7, 0.1, 1, -0.1]]) {
      const x = x0 + W * fx, b = g + 40 * k, col = "#2a1f1a";
      s += obj(h > 400 ? "giant tree" : "tree, right", b, [-2, -1, 0, 1, 2].map(t => `<path d="M${P(x, b - 10 * k)} Q${P(x + t * 2 * roots * k, b - 2 * k)} ${P(x + t * 4 * roots * k, b + 8 * k)}" ` +
             `fill="none" stroke="${col}" stroke-width="${f1(roots * k)}" stroke-linecap="round"/>`).join("") +
           // (the giant's roots: thick, arching up out of the ground and
           // down again, far out to the right and a little to the left)
           (h > 400 ? [[30, 230, 30, 15], [18, 170, 46, 12], [24, 120, -6, 13], [10, 300, 62, 9], [-14, -60, 20, 11], [6, 70, 66, 8]].map(([dx, reach, dy, rw], r) => {
             const sx = x + dx * k, ex = x + reach * k, ey = b + dy * k, hump = (18 + 14 * R(r, 80)) * k;
             const m1 = sx + (ex - sx) * 0.35, m2 = sx + (ex - sx) * 0.7;
             return `<path d="M${P(sx, b - 14 * k)} C${P(m1, b - 14 * k - hump)} ${P(m2, ey - hump * 0.6)} ${P(ex, ey)}" fill="none" stroke="#1a130f" stroke-width="${f1((rw + 3) * k)}" stroke-linecap="round"/>` +
                    `<path d="M${P(sx, b - 14 * k)} C${P(m1, b - 14 * k - hump)} ${P(m2, ey - hump * 0.6)} ${P(ex, ey)}" fill="none" stroke="${col}" stroke-width="${f1(rw * k)}" stroke-linecap="round"/>` +
                    `<path d="M${P(m1, b - 10 * k - hump * 0.75)} C${P(m1 + 8 * k, b - 12 * k - hump * 0.8)} ${P(m2, ey - hump * 0.5)} ${P(m2 + 10 * k, ey - hump * 0.42)}" fill="none" stroke="#4a3a30" stroke-width="${f1(1.6 * k)}" opacity="0.7"/>`;
           }).join("") : "") +
           deadTree(seed, x, b, h * k, w * k, col, h > 400 ? 6 : 4, droop, wide, lean) +
           `<ellipse cx="${f1(x - w * 0.12 * k)}" cy="${f1(b - h * 0.2 * k)}" rx="${f1(w * 0.14 * k)}" ry="${f1(w * 0.26 * k)}" fill="#120c0a"/>`);
    }
    // skeletons reaching up out of the ground: a skull half buried, an arm
    // bone up to a bony hand (each an object, at its skull's foot)
    for (const [fx, fy, sd, name] of [[-0.14, 52, 1, "skeleton, left"], [0.12, 66, -1, "skeleton, right"], [-0.44, 74, -1, "skeleton, left edge"], [0.45, 70, 1, "skeleton, right edge"]]) {
      const x = W * fx, y = g + fy * k, bone = "#efe8d8", ln = "#6b6355", seed = 200 + Math.round(fx * 100);
      const ax = x + sd * 26 * k, ay = y - 4 * k, ex = ax + sd * 10 * k, ey = ay - 34 * k, hx = ex - sd * 4 * k, hy = ey - 26 * k;
      s += obj(name, y, `<path d="M${P(ax, ay)} L${P(ex, ey)} L${P(hx, hy)}" fill="none" stroke="${ln}" stroke-width="${f1(7 * k)}" stroke-linecap="round" stroke-linejoin="round"/>` +
           `<path d="M${P(ax, ay)} L${P(ex, ey)} L${P(hx, hy)}" fill="none" stroke="${bone}" stroke-width="${f1(4.5 * k)}" stroke-linecap="round" stroke-linejoin="round"/>` +
           [-2, -1, 0, 1, 2].map(t => { const a = (-90 + t * 22) * Math.PI / 180;
             return `<line x1="${f1(hx)}" y1="${f1(hy)}" x2="${f1(hx + 12 * k * Math.cos(a))}" y2="${f1(hy + 12 * k * Math.sin(a))}" stroke="${bone}" stroke-width="${f1(2.6 * k)}" stroke-linecap="round"/>`; }).join("") +
           `<path d="M${P(x - 13 * k, y)} Q${P(x - 14 * k, y - 20 * k)} ${P(x, y - 21 * k)} Q${P(x + 14 * k, y - 20 * k)} ${P(x + 13 * k, y)} Z" fill="${bone}" stroke="${ln}" stroke-width="${f1(1.2 * k)}"/>` +
           `<circle cx="${f1(x - 5 * k)}" cy="${f1(y - 9 * k)}" r="${f1(3.6 * k)}" fill="#1a1426"/><circle cx="${f1(x + 5 * k)}" cy="${f1(y - 9 * k)}" r="${f1(3.6 * k)}" fill="#1a1426"/>` +
           eyeDot(x - 5 * k, y - 9 * k, 3.6 * k, seed) + eyeDot(x + 5 * k, y - 9 * k, 3.6 * k, seed) +
           `<ellipse cx="${f1(x)}" cy="${f1(y + 1 * k)}" rx="${f1(26 * k)}" ry="${f1(5 * k)}" fill="#3a2c1e"/>`);
    }
    // her cauldron on the right, bubbling green over a fire (an object, its
    // fire and fumes in it)
    {
      const cx = Math.max(W * 0.32, 180 * k), b = g + 55 * k, r = 46 * k, cy = b - 26 * k - r * 0.7;
      // (the flames flicker, each at its own pace)
      const flame = (t, top) => `M${P(cx + t * 26 * k - 10 * k, b - 14 * k)} Q${P(cx + t * 26 * k - 6 * k, b - 46 * k)} ${P(cx + t * 26 * k, b - top * k)} ` +
                                `Q${P(cx + t * 26 * k + 6 * k, b - 46 * k)} ${P(cx + t * 26 * k + 10 * k, b - 14 * k)} Z`;
      s += obj("cauldron", b, [-1, 0, 1].map(t => `<path d="${flame(t, 60)}" fill="#ff8c1a">${lfoTimed(opts, "fast", (t + 1) / 3, `<animate attributeName="d" values="${flame(t, 60)};${flame(t, 44)};${flame(t, 66)};${flame(t, 60)}" dur="${(0.7 + 0.15 * (t + 1)).toFixed(2)}s" repeatCount="indefinite"/>`)}</path>` +
             `<path d="M${P(cx + t * 26 * k - 5 * k, b - 14 * k)} Q${P(cx + t * 26 * k - 3 * k, b - 32 * k)} ${P(cx + t * 26 * k, b - 40 * k)} ` +
             `Q${P(cx + t * 26 * k + 3 * k, b - 32 * k)} ${P(cx + t * 26 * k + 5 * k, b - 14 * k)} Z" fill="#ffd23f"/>`).join("") +
           [-30, -10, 10, 30].map(t => `<line x1="${f1(cx + t * k)}" y1="${f1(b - 6 * k)}" x2="${f1(cx + t * 1.4 * k)}" y2="${f1(b - 16 * k)}" stroke="#5a3a1c" stroke-width="${f1(6 * k)}" stroke-linecap="round"/>`).join("") +
           [-1, 1].map(sd => `<line x1="${f1(cx + sd * r * 0.7)}" y1="${f1(cy + r * 0.5)}" x2="${f1(cx + sd * r * 0.9)}" y2="${f1(b - 4 * k)}" stroke="#1b1b1f" stroke-width="${f1(6 * k)}" stroke-linecap="round"/>`).join("") +
           `<path d="M${P(cx - r, cy)} Q${P(cx - r * 1.1, cy + r * 1.05)} ${P(cx, cy + r * 1.05)} Q${P(cx + r * 1.1, cy + r * 1.05)} ${P(cx + r, cy)} Z" fill="#26262c" stroke="#0e0e12" stroke-width="${f1(3 * k)}"/>` +
           `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r * 1.06)}" ry="${f1(r * 0.24)}" fill="#1b1b1f"/>` +
           `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r * 0.92)}" ry="${f1(r * 0.17)}" fill="#7bd33a"/>` +
           // bubbles rising out of the brew and bursting, as inside her hut
           [[-0.4, 7, 0.9], [0.1, 9, 1.3], [0.45, 6, 1.1], [-0.1, 5, 0.7], [0.3, 4, 1.6]].map(([dx, rr, d]) =>
             `<circle cx="${f1(cx + dx * r)}" cy="${f1(cy)}" r="${f1(rr * k)}" fill="#a6e86a" stroke="#4f9a1f" stroke-width="${f1(1.5 * k)}">` +
             `<animate attributeName="cy" values="${f1(cy)};${f1(cy - 30 * k)};${f1(cy)}" dur="${d}s" repeatCount="indefinite"/>` +
             `<animate attributeName="r" values="${f1(rr * 0.4 * k)};${f1(rr * k)};0" dur="${d}s" repeatCount="indefinite"/></circle>`).join("") +
           // a skull on the pot, red-eyed
           `<path d="M${P(cx - 14 * k, cy + 30 * k)} Q${P(cx - 15 * k, cy + 12 * k)} ${P(cx, cy + 11 * k)} Q${P(cx + 15 * k, cy + 12 * k)} ${P(cx + 14 * k, cy + 30 * k)} ` +
           `L${P(cx + 7 * k, cy + 33 * k)} L${P(cx + 6 * k, cy + 39 * k)} L${P(cx - 6 * k, cy + 39 * k)} L${P(cx - 7 * k, cy + 33 * k)} Z" fill="#3b3b44" stroke="#55555f" stroke-width="${f1(1.2 * k)}"/>` +
           [-1, 1].map(sd => `<circle cx="${f1(cx + sd * 6 * k)}" cy="${f1(cy + 22 * k)}" r="${f1(3.6 * k)}" fill="#ff3b3b"/>`).join("") +
           // the fumes: one green, one blue, a double helix turning as it
           // rises, out past the top of the picture
           helixSvg(cx, cy - 6 * k, y0 - 80 * k, 12 * k, 46 * k, k));
    }
  } else if (kind === "beach") {
    const { sea, shore } = beachLines({ g, k });
    s += `<defs>${grad("bg-sky", "#5fbdf2", "#d6f0ff", y0, sea)}${grad("bg-ocean", "#1f86c4", "#4cc0e6", sea, shore)}</defs>` + all("url(#bg-sky)");
    // the sun, high on the right
    const sx = x1 - W * 0.16, sy = y0 + H * 0.14;
    s += [...Array(12)].map((_, i) => { const a = i * Math.PI / 6;
      return `<line x1="${f1(sx + 58 * k * Math.cos(a))}" y1="${f1(sy + 58 * k * Math.sin(a))}" x2="${f1(sx + 82 * k * Math.cos(a))}" y2="${f1(sy + 82 * k * Math.sin(a))}" ` +
             `stroke="#ffd23f" stroke-width="${f1(6 * k)}" stroke-linecap="round"/>`; }).join("") +
         `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${f1(46 * k)}" fill="#ffd23f"/>`;
    // the ocean next to the sand, waves on it and foam at its edge
    s += `<rect x="${f1(x0 - pad)}" y="${f1(sea)}" width="${f1(W + 2 * pad)}" height="${f1(shore - sea + 20 * k)}" fill="url(#bg-ocean)"/>`;
    for (let i = 0; i < 14; i++) {
      const x = x0 + W * R(i, 20), y = sea + (shore - sea) * (0.15 + 0.7 * R(i, 21));
      s += `<path d="M${P(x - 16 * k, y)} Q${P(x - 8 * k, y - 6 * k)} ${P(x, y)} Q${P(x + 8 * k, y - 6 * k)} ${P(x + 16 * k, y)}" fill="none" stroke="#ffffff" stroke-width="${f1(2.5 * k)}" opacity="0.8"/>`;
    }
    // (the sand's wave, 6 and 1.4, is WATER's too: the foam counts as sea)
    s += land(shore - 4 * k, 6, "#ffffff", 0.9) + land(shore + 4 * k, 6, "#f3dca5", 1.4);
    // blankets on the sand, striped (flat: drawn before what stands, ticket 99)
    for (const [sd, ca, cb, dy] of [[-1, "#8e44ad", "#ffd23f", 70], [1, "#2ecc71", "#ffffff", 95]]) {
      const x = sd * W * 0.2, y = g + dy * k, w = 150 * k, h = 42 * k;
      for (let j = 0; j < 6; j++)
        s += `<polygon points="${P(x - w / 2 + j * w / 6 + 14 * k, y - h)} ${P(x - w / 2 + (j + 1) * w / 6 + 14 * k, y - h)} ${P(x - w / 2 + (j + 1) * w / 6, y)} ${P(x - w / 2 + j * w / 6, y)}" fill="${j % 2 ? cb : ca}"/>`;
    }
    // palm trees at the sides (each an object, standing at its foot)
    for (const sd of [-1, 1]) {
      const bx = sd * Math.max(W / 2 - 60 * k, 200 * k), by = g + 40 * k, tx = bx - sd * 70 * k, ty = g - 340 * k;
      let palm = `<path d="M${P(bx, by)} Q${P(bx + sd * 10 * k, g - 180 * k)} ${P(tx, ty)}" fill="none" stroke="#9b6b3c" stroke-width="${f1(20 * k)}" stroke-linecap="round"/>`;
      for (let j = 1; j < 9; j++) {
        const t = j / 9, qx = (1 - t) * (1 - t) * bx + 2 * t * (1 - t) * (bx + sd * 10 * k) + t * t * tx,
              qy = (1 - t) * (1 - t) * by + 2 * t * (1 - t) * (g - 180 * k) + t * t * ty;
        palm += `<line x1="${f1(qx - 9 * k)}" y1="${f1(qy)}" x2="${f1(qx + 9 * k)}" y2="${f1(qy + 4 * k)}" stroke="#7a522c" stroke-width="${f1(2.5 * k)}"/>`;
      }
      // (the fronds sway together about the crown, with the slow LFO)
      let fronds = "";
      for (const a of [-160, -125, -90, -55, -20, 15, 160, 195]) {
        const r = a * Math.PI / 180, ex = tx + 120 * k * Math.cos(r), ey = ty + 80 * k * Math.sin(r) + 40 * k;
        fronds += `<path d="M${P(tx, ty)} Q${P(tx + 70 * k * Math.cos(r), ty + 60 * k * Math.sin(r) - 30 * k)} ${P(ex, ey)} ` +
             `Q${P(tx + 50 * k * Math.cos(r), ty + 40 * k * Math.sin(r) - 4 * k)} ${P(tx, ty)} Z" fill="#2e9d4a" stroke="#1f6e33" stroke-width="${f1(2 * k)}"/>`;
      }
      palm += swaying(opts, fronds, tx, ty, 4, sd < 0 ? 0.1 : 0.6, 6);
      palm += [[-8, 10], [8, 12], [0, 20]].map(([dx, dy]) => `<circle cx="${f1(tx + dx * k)}" cy="${f1(ty + dy * k)}" r="${f1(9 * k)}" fill="#6b4a2b"/>`).join("");
      s += obj(`palm tree, ${sd < 0 ? "left" : "right"}`, by, palm);
    }
    // a striped umbrella over a beach chair on each side (objects: the
    // umbrella at its pole's foot, the chair at its legs')
    for (const [sd, ca, cb] of [[-1, "#e53935", "#ffffff"], [1, "#1e88e5", "#ffd23f"]]) {
      const x = sd * Math.max(W / 2 - 210 * k, 150 * k), b = g + 20 * k, top = [x + sd * 16 * k, b - 230 * k], at = sd < 0 ? "left" : "right";
      let u = `<line x1="${f1(x)}" y1="${f1(b)}" x2="${P(...top).replace(" ", '" y2="')}" stroke="#d8d8d8" stroke-width="${f1(5 * k)}"/>`;
      for (let j = 0; j < 6; j++) {
        const a0 = Math.PI + j * Math.PI / 6, a1 = a0 + Math.PI / 6;
        const p0 = [top[0] + 120 * k * Math.cos(a0), top[1] + 26 * k + 40 * k * Math.sin(a0) * 0], p1 = [top[0] + 120 * k * Math.cos(a1), top[1] + 26 * k];
        u += `<path d="M${P(...top)} L${P(p0[0], top[1] + 26 * k)} Q${P((p0[0] + p1[0]) / 2, top[1] + 38 * k)} ${P(...p1)} Z" fill="${j % 2 ? cb : ca}" stroke="#555" stroke-width="${f1(1.2 * k)}"/>`;
      }
      s += obj(`umbrella, ${at}`, b, u);
      // the chair: a striped back leaning away, a seat, and its legs
      const cx = x + sd * 30 * k, cy = b - 10 * k;
      s += obj(`beach chair, ${at}`, cy, `<polygon points="${P(cx - 40 * k, cy - 34 * k)} ${P(cx + 40 * k, cy - 34 * k)} ${P(cx + 34 * k, cy - 18 * k)} ${P(cx - 34 * k, cy - 18 * k)}" fill="${ca}" stroke="#555" stroke-width="${f1(1.5 * k)}"/>` +
           `<polygon points="${P(cx - 34 * k, cy - 34 * k)} ${P(cx + 34 * k, cy - 34 * k)} ${P(cx + 40 * k, cy - 92 * k)} ${P(cx - 28 * k, cy - 92 * k)}" fill="${cb}" stroke="#555" stroke-width="${f1(1.5 * k)}"/>` +
           [-1, 0, 1].map(j => `<line x1="${f1(cx + j * 22 * k)}" y1="${f1(cy - 34 * k)}" x2="${f1(cx + j * 22 * k + 6 * k)}" y2="${f1(cy - 92 * k)}" stroke="${ca}" stroke-width="${f1(7 * k)}"/>`).join("") +
           [-36, 36].map(dx => `<line x1="${f1(cx + dx * k)}" y1="${f1(cy - 20 * k)}" x2="${f1(cx + dx * 1.1 * k)}" y2="${f1(cy)}" stroke="#777" stroke-width="${f1(3 * k)}"/>`).join(""));
    }
    // a sand castle on each side of the figure, towers, a door and a flag
    // (each an object, its flag in it)
    for (const sd of [-1, 1]) {
      const x = sd * Math.max(W * 0.3, 120 * k), y = g + 45 * k, c = "#e2bd6e", ln = "#b08a43";
      const tower = (tx, w, h) => `<rect x="${f1(tx - w / 2)}" y="${f1(y - h)}" width="${f1(w)}" height="${f1(h)}" fill="${c}" stroke="${ln}" stroke-width="${f1(2 * k)}"/>` +
        [-1, 0, 1].map(j => `<rect x="${f1(tx + j * w / 3 - w / 8)}" y="${f1(y - h - 8 * k)}" width="${f1(w / 4)}" height="${f1(9 * k)}" fill="${c}" stroke="${ln}" stroke-width="${f1(1.5 * k)}"/>`).join("");
      s += obj(`sand castle, ${sd < 0 ? "left" : "right"}`, y, tower(x, 80 * k, 46 * k) + tower(x - 34 * k, 26 * k, 74 * k) + tower(x + 34 * k, 26 * k, 74 * k) + tower(x, 30 * k, 92 * k) +
           `<path d="M${P(x - 9 * k, y)} L${P(x - 9 * k, y - 16 * k)} Q${P(x, y - 26 * k)} ${P(x + 9 * k, y - 16 * k)} L${P(x + 9 * k, y)} Z" fill="#9a7638"/>` +
           `<line x1="${f1(x)}" y1="${f1(y - 100 * k)}" x2="${f1(x)}" y2="${f1(y - 132 * k)}" stroke="#555" stroke-width="${f1(2 * k)}"/>` +
           // (its flag flutters with the quick LFO)
           `<g transform="translate(${f1(x)} ${f1(y - 132 * k)})"><g>${sceneLfo(opts, "fast", sd < 0 ? 0 : 0.5, "transform", (v, amp) => `${(1 - (0.15 + 0.45 * amp) * (1 + v) / 2).toFixed(2)} 1`,
             `<animateTransform attributeName="transform" type="scale" values="1 1;0.75 1;1 1" dur="0.7s" repeatCount="indefinite"/>`, "scale")}` +
           `<polygon points="0,0 ${f1(sd * 22 * k)},${f1(7 * k)} 0,${f1(14 * k)}" fill="#e53935"/></g></g>`);
    }
  } else if (SCENES[kind])
    s += SCENES[kind]({ x0, y0, x1, y1, g, W, H, k, pad, R, P, grad, all, land, side, o: opts, F: [x0, y0, x1, y1, g] });
  // (ticket 185) the things put here, in any place
  if (kind !== "none") s += thingsLayer({ o: opts, F: [x0, y0, x1, y1, g] });
  return s;
}

let faceFrame = { tx: 0, ty: 0, s: 1 };
const bgShown = { text: null, node: null, kept: new Map(), objs: [] };
// (ticket 99) the scene's objects as mounted, in order: name, depth, element
// (see obj); where the friend stands among them; which are hidden
let figShown = [];
// (the objects are put in order by depth, nearest last, in the places they
// held: a scene's later pieces, as a castle room's cats, drawn after the
// room, then stand among its furniture; what is between them stays put)
const objDepth = n => n.getAttribute("data-z") === "front" ? Infinity : Number(n.getAttribute("data-z"));
