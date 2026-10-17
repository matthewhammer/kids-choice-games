"use strict";
// (ticket 178) Part 11 of 26 of the game's script, run in order by index.html.

function treehouseScene(c) {
  const { x0, y0, W, H, k, g, grad, all, land, o, R } = c;
  const n = Math.max(1, Math.min(6, o.houses ?? 4)), ts = (o.treeSize ?? 100) / 100;
  const bridges = o.bridges ?? 2, ladders = o.ladders ?? 3, leaves = o.leaves ?? 60;
  let s = SEP + part("tree-sky", c.F, () => `<defs>${grad("bg-sky", "#5eb6ee", "#e6f6ff", y0, g)}</defs>` + all("url(#bg-sky)") +
                                       land(g - 130 * k, 12, "#a5d48e", 0.3) + land(g - 30 * k, 5, "#79b956", 0.9));
  s += SEP + cloudsSvg(c, 3, 0.9, 110);
  // the forest round the great tree: far pines and round trees on the
  // hills, nearer ones, bushes, and flowers in the grass (an oak, a pine, a
  // tulip and a daisy, each drawn once)
  s += SEP + part("tree-woods", c.F, () => {
    const { x1, y1, P } = c, side = c.side;
    let t = `<defs>${oakDef("bg-woods-oak", 1)}${pineDef("bg-pine", 3)}${FLOWER_DEFS}</defs>`;
    const tree = (i, x, y, sc) => i % 3 === 1 ? use("bg-woods-oak", x, y, sc * (R(i, 211) < 0.5 ? -1 : 1), sc)
                                              : use("bg-pine", x, y, sc, sc, ` color="${["#2f6e3a", "#3a7d44", "#285e33"][i % 3]}"`);
    // (the far row one object, at its middle depth; the stream and the
    // flowers lie flat on the ground, so they come next, under all that
    // stands nearer: the nearer trees, a row each side, and each bush)
    let far = "";
    for (let i = 0; i < 30; i++)   // the far row, small, on the far hills
      far += tree(i, x0 - 30 * k + (W + 60 * k) * i / 29 + 14 * k * (R(i, 210) - 0.5), g - 128 * k + 10 * k * R(i, 212), k * (0.32 + 0.2 * R(i, 213)));
    t += obj("trees, far row", g - 123 * k, far);
    // a stream winding down from the hills, past the tree, out at the front
    const sp = streamAt(c), Lb = [], Rb = [];
    for (const [x, y, hw] of sampled(sp, 30)) { Lb.push(P(x - hw, y)); Rb.push(P(x + hw, y)); }
    t += `<defs><linearGradient id="bg-stream" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(g - 125 * k)}" x2="0" y2="${f1(y1)}">` +
         `<stop offset="0" stop-color="#9fdcf7"/><stop offset="1" stop-color="#2f86c6"/></linearGradient></defs>` +
         `<polygon points="${[...Lb, ...Rb.reverse()].join(" ")}" fill="url(#bg-stream)" stroke="#6f9b4a" stroke-width="${f1(3 * k)}" stroke-linejoin="round"/>`;
    // (ticket 42) its ripples flowing down it, a little faster than the brook's
    t += flowRipples(sp, [...Array(14)].map((_, i) => 0.12 + 0.83 * i / 13), 2.2, hw => { const l = hw * 0.5;
      return `<path d="M${f1(-l)} 0 Q0 ${f1(-l * 0.25)} ${f1(l)} 0" fill="none" stroke="#ffffff" stroke-width="${f1(hw * 0.045)}" opacity="0.7"/>`; });
    for (let i = 0; i < 48; i++) {  // flowers in the grass
      const d = R(i, 220), x = x0 + W * R(i, 221), y = g - 22 * k + (y1 - g + 10 * k) * d;
      if (inStream(sp, x, y, 8 * k)) continue;
      t += use(i % 2 ? "bg-daisy" : "bg-tulip", x, y, k * (0.8 + 0.7 * d), k * (0.8 + 0.7 * d), ` color="${FLOWER_COLORS[i % 6]}"`);
    }
    const near = ["", ""], stand = [];
    for (let i = 0; i < 12; i++)   // nearer ones, at the meadow's edge, left and right
      near[side(i) < 0 ? 0 : 1] += tree(i + 1, side(i) * (W * 0.2 + W * 0.32 * R(i, 214)), g - 42 * k + 8 * k * R(i, 215), k * (0.55 + 0.3 * R(i, 216)));
    stand.push(["trees, left", g - 38 * k, near[0]], ["trees, right", g - 38 * k, near[1]]);
    for (let i = 0; i < 16; i++) {  // bushes
      const x = side(i) * (W * 0.12 + W * 0.36 * R(i, 217)), y = g - 18 * k + 50 * k * R(i, 218), r = (16 + 14 * R(i, 219)) * k;
      if (inStream(sp, x, y, r * 1.4)) continue;   // (no bushes in the water)
      stand.push([`bush, ${side(i) < 0 ? "left" : "right"} ${Math.floor(i / 2) + 1}`, y, bushSvg(x, y, r * 1.4, 300 + i)]);
    }
    return t + byDepth(stand);
  });
  // the tree, its leaves, houses, bridges and ladders: built in the tree's
  // units, so its size slider builds none of them again
  // (the whole group one object, standing where its trunk meets the ground)
  s += obj("tree house", g, OPEN(`<g id="bg-tree" ${tf(0, g, ts * k)}>`) + treeInner(c) + CLOSE);
  // butterflies, fluttering with the quick LFO
  // (at the depth of the ground under the nearest)
  s += obj("butterflies", g - 60 * k, part("treehouse-butterflies", [c.F, sceneLfoKey(o, "fast"), sceneLfoKey(o, "wings")], () => butterfliesSvg(c, [[x0 + W * 0.12, g - 80 * k, 1], [x0 + W * 0.86, g - 60 * k, 1.1]])));
  return s;
}

// a picture on a wall: another scene, drawn at the stage's frame, painted
// back to front as far as its detail says (the sky first), and blurred
// the less detail it has; a picture of this room holds its own pictures
// once, not forever
const PICTURE_KINDS = ["lake", "beach", "livingroom", "forest", "treehouse", "underwater", "house", "witch", "cemetery", "treeroom"];
const SCENE_PARTS = new Map(), TRIMMED = new Map(), STILLS = new Map();
function pictureSvg(kind, detail, o, depth, x, y, w, h, still = false) {
  const opts = new Proxy({}, { get: (_, key) => (key === "depth" ? depth : o[key]) });
  const full = partByReads(`picture:${kind}:${depth}`, opts, oo =>
    prefixIds(unmarked(backgroundSvg(kind, SCENE.left, SCENE.top, -SCENE.left, SCENE.bottom, SCENE.ground, oo)), `p${depth}${kind}-`));
  let doc = SCENE_PARTS.get(full);
  if (!doc) {
    doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${full}</svg>`, "image/svg+xml").documentElement;
    sortObjects(doc);   // (painted in the place's order: see sceneObjects)
    if (SCENE_PARTS.size > 40) SCENE_PARTS.clear();
    SCENE_PARTS.set(full, doc);
  }
  // its drawings in the order they are painted, into its groups too
  // (kept by scene and detail: another slider in the room trims nothing)
  const trimmed = full + "\u0000" + detail;
  let body = TRIMMED.get(trimmed);
  if (body === undefined) {
    const root = doc.cloneNode(true), drawn = [];
    const walk = el => { for (const e of el.children) if (e.tagName === "g") walk(e); else if (e.tagName !== "defs") drawn.push(e); };
    walk(root);
    for (const e of drawn.slice(2 + Math.round((drawn.length - 2) * detail / 100))) e.remove();
    if (TRIMMED.size > 200) TRIMMED.clear();
    TRIMMED.set(trimmed, body = root.innerHTML);
  }
  // (the picture's own doorways are only paint: the picture as a whole is the way into its place)
  body = body.replaceAll('class="portal"', 'class="painted-portal"');
  const blur = PERF.blur ? (1 - detail / 100) * 14 : 0, fid = `bg-blur-${depth}-${Math.round(blur * 10)}`;   // (ticket 155: blurs off by default)
  const W = -2 * SCENE.left, H = SCENE.bottom - SCENE.top;
  const inner = blur > 0.2 ? `<defs><filter id="${fid}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${f1(blur)}"/></filter></defs><g filter="url(#${fid})">${body}</g>` : body;
  // (ticket 154) A still picture: the place drawn by its own code, as
  // always, but held still (its animations taken out) and shown as an
  // image, which the browser draws into pixels once and keeps. The
  // imagination's map holds 22 pictures, 7,700 shapes and 24 blurs; drawn
  // live, any move of the friend made the browser draw them again: 18
  // frames a second at 1920 wide on Matthew's laptop, far less on the black
  // laptop. Small and blurred, their animations hardly showed.
  if (still) {
    const key = `${trimmed}\u0001${f1(w)}x${f1(h)}`;
    let href = STILLS.get(key);
    if (href === undefined) {
      const doc = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${f1(w)}" height="${f1(h)}" viewBox="${SCENE.left} ${SCENE.top} ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
                  inner.replace(/<(animate|animateTransform|animateMotion|set)\b[^>]*?(\/>|>[\s\S]*?<\/\1>)/g, "") + `</svg>`;
      // (only what a data URL in an attribute must not hold as it is)
      href = "data:image/svg+xml;charset=utf-8," + doc.replace(/%/g, "%25").replace(/#/g, "%23").replace(/"/g, "%22").replace(/&/g, "%26");
      if (STILLS.size > 80) STILLS.clear();
      STILLS.set(key, href);
    }
    return `<image x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="xMidYMid slice" href="${href}"/>`;
  }
  return `<svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" viewBox="${SCENE.left} ${SCENE.top} ${W} ${H}" preserveAspectRatio="xMidYMid slice">` + inner + `</svg>`;
}
// a framed picture, its middle at (x, y), w wide
const framedSvg = (kind, detail, o, depth, x, y, w, still = false) => {
  const h = w * 0.74, fr = w * 0.07, mat = w * 0.04;
  return `<g class="portal" data-to="${kind}"><rect x="${f1(x - w / 2 + 4)}" y="${f1(y - h / 2 + 6)}" width="${f1(w)}" height="${f1(h)}" fill="#000000" opacity="0.18"/>` +
         `<rect x="${f1(x - w / 2)}" y="${f1(y - h / 2)}" width="${f1(w)}" height="${f1(h)}" fill="#b8862f" stroke="#7a5518" stroke-width="2"/>` +
         `<rect x="${f1(x - w / 2 + fr)}" y="${f1(y - h / 2 + fr)}" width="${f1(w - 2 * fr)}" height="${f1(h - 2 * fr)}" fill="#f7f2e6"/>` +
         pictureSvg(kind, detail, o, depth, x - w / 2 + fr + mat, y - h / 2 + fr + mat, w - 2 * fr - 2 * mat, h - 2 * fr - 2 * mat, still) + `</g>`;
};
// (each picture's scene is a choice of its own: pic1, pic2, ...)
const PICTURE_CHOICES = [["forest", "🌲 forest"], ["underwater", "🐠 underwater"], ["beach", "🏖️ beach"], ["witch", "🧙 witch's woods"],
  ["cemetery", "🌿 cemetery"], ["lake", "🦆 lake"], ["house", "🏠 house and yard"], ["treehouse", "🌳 tree house"],
  ["treeroom", "🪜 inside the tree house"], ["livingroom", "🛋️ living room"], ["witchroom", "🧙 inside the witch's hut"],
  ["clearing", "🌲 forest clearing"], ["mountains", "⛰️ mountain trail"], ["waterfall", "💦 jungle waterfall"], ["campsite", "🏕️ camp site"]];
const picturesSvg = (o, here, slots, scale, keyOf = i => "pic" + (i + 1)) => {
  const depth = (o.depth ?? 0) + 1, count = depth > 2 ? 0 : Math.min(slots.length, o.pictures ?? 3), detail = o.picDetail ?? 70;
  return slots.slice(0, count).map(([x, y, w], i) => {
    const chosen = o[keyOf(i)], kind = SCENES[chosen] || PICTURE_CHOICES.some(([kd]) => kd === chosen) ? chosen : PICTURE_KINDS[i];
    return framedSvg(kind, detail, o, depth, x, y, w * scale, !PERF.livePictures);   // (ticket 158: held still unless moving pictures are on)
  }).join(SEP);
};

// a living room: a couch in the middle, pillows on it, pictures on the wall
// (ticket 50) the couch: its three cushions' tops, in its own units, across
// -232 to 236 and at 112 above its feet, as livingroomScene draws it
SEATS.livingroom = (c, B) => { const cs = (B.couchSize ?? 100) / 100, k = c.k, base = c.g - 40 * k;
  return [{ name: "couch", x0: -232 * cs * k, x1: 236 * cs * k, y: base - 112 * cs * k, z: base + 1, facing: ["front", "left", "right"] }]; };
function livingroomScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, all, o } = c;
  const cs = (o.couchSize ?? 100) / 100, pillows = o.pillows ?? 4, ps = (o.picSize ?? 100) / 100;
  const floor = g - 120 * k;
  // (the room's part is two: its walls and floor, and what stands on the
  // floor, which comes after the window and the pictures on the wall)
  const [room, things] = part("living-room", [c.F, sceneLfoKey(o, "fast"), sceneLfoKey(o, "slow")], () => {
    let t = `<defs><pattern id="bg-paper" patternUnits="userSpaceOnUse" width="${f1(36 * k)}" height="${f1(36 * k)}">` +
            `<rect width="${f1(36 * k)}" height="${f1(36 * k)}" fill="#efe1c6"/><rect width="${f1(14 * k)}" height="${f1(36 * k)}" fill="#e7d5b4"/>` +
            `<circle cx="${f1(25 * k)}" cy="${f1(18 * k)}" r="${f1(2.5 * k)}" fill="#d9b98a"/></pattern></defs>` + all("url(#bg-paper)");
    // the floor: boards, a baseboard, a round rug
    t += `<rect x="${f1(x0 - pad)}" y="${f1(floor)}" width="${f1(W + 2 * pad)}" height="${f1(y1 - floor + pad)}" fill="#a8743f"/>`;
    for (let i = -14; i <= 14; i++)
      t += `<line x1="${f1(i * W / 22)}" y1="${f1(floor)}" x2="${f1(i * W / 7)}" y2="${f1(y1 + pad)}" stroke="#8a5d30" stroke-width="${f1(1.5 * k)}"/>`;
    t += `<rect x="${f1(x0 - pad)}" y="${f1(floor - 14 * k)}" width="${f1(W + 2 * pad)}" height="${f1(16 * k)}" fill="#ffffff" stroke="#d8cdb8" stroke-width="${f1(1.5 * k)}"/>` +
         [1, 0.78, 0.56, 0.34].map((u, i) => `<ellipse cx="0" cy="${f1(g + 6 * k)}" rx="${f1(W * 0.42 * u)}" ry="${f1(70 * k * u)}" fill="${["#3d6e8f", "#e8c870", "#c0504d", "#3d6e8f"][i]}"/>`).join("");
    // a lamp on a little table on the right, a plant on the left
    // (each an object, where it stands on the floor)
    const lx = x1 - W * 0.1, ly = floor + 30 * k;
    const lamp = obj("lamp", ly, `<rect x="${f1(lx - 40 * k)}" y="${f1(ly - 110 * k)}" width="${f1(80 * k)}" height="${f1(10 * k)}" fill="#6b4423"/>` +
         [-32, 32].map(dx => `<line x1="${f1(lx + dx * k)}" y1="${f1(ly - 100 * k)}" x2="${f1(lx + dx * 1.1 * k)}" y2="${f1(ly)}" stroke="#6b4423" stroke-width="${f1(6 * k)}"/>`).join("") +
         `<rect x="${f1(lx - 6 * k)}" y="${f1(ly - 200 * k)}" width="${f1(12 * k)}" height="${f1(90 * k)}" fill="#c9a94a"/>` +
         `<polygon points="${P(lx - 30 * k, ly - 200 * k)} ${P(lx + 30 * k, ly - 200 * k)} ${P(lx + 44 * k, ly - 150 * k)} ${P(lx - 44 * k, ly - 150 * k)}" fill="#f6e7b5" transform="translate(0 ${f1(-50 * k)})"/>` +
         `<ellipse cx="${f1(lx)}" cy="${f1(ly - 190 * k)}" rx="${f1(60 * k)}" ry="${f1(30 * k)}" fill="#fff6c8" opacity="0.35">` +
           sceneLfo(o, "slow", 0.2, "opacity", (v, amp) => (0.35 * (1 + (0.25 + 0.6 * amp) * v)).toFixed(3)) + `</ellipse>`);
    // a little wall clock high on the right (above the pictures, as the small one on the left is), its pendulum swinging with the quick LFO
    { const cx = x1 - W * 0.217, cy = y0 + H * 0.075, r = 15 * k;
      t += `<rect x="${f1(cx - r - 6 * k)}" y="${f1(cy - r - 8 * k)}" width="${f1(2 * r + 12 * k)}" height="${f1(2 * r + 50 * k)}" rx="${f1(8 * k)}" fill="#7a4a26" stroke="#4a2c14" stroke-width="${f1(2 * k)}"/>` +
           `<path d="M${P(cx - r - 10 * k, cy - r - 8 * k)} L${P(cx, cy - r - 30 * k)} L${P(cx + r + 10 * k, cy - r - 8 * k)} Z" fill="#6b4423"/>` +
           `<rect x="${f1(cx - r + 2 * k)}" y="${f1(cy + r + 6 * k)}" width="${f1(2 * r - 4 * k)}" height="${f1(34 * k)}" rx="${f1(4 * k)}" fill="#3a2414"/>` +
           `<g>${sceneLfo(o, "fast", 0, "transform", (v, amp) => `${f1((10 + 18 * amp) * v)} ${f1(cx)} ${f1(cy + r + 8 * k)}`,
             `<animateTransform attributeName="transform" type="rotate" values="-14 ${f1(cx)} ${f1(cy + r + 8 * k)};14 ${f1(cx)} ${f1(cy + r + 8 * k)};-14 ${f1(cx)} ${f1(cy + r + 8 * k)}" dur="1.2s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/>`)}` +
           `<line x1="${f1(cx)}" y1="${f1(cy + r + 8 * k)}" x2="${f1(cx)}" y2="${f1(cy + r + 30 * k)}" stroke="#c9a227" stroke-width="${f1(2 * k)}"/><circle cx="${f1(cx)}" cy="${f1(cy + r + 32 * k)}" r="${f1(5.5 * k)}" fill="#e8b923" stroke="#9a7a12" stroke-width="${f1(1.2 * k)}"/></g>` +
           `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="#fff8e7" stroke="#c9a227" stroke-width="${f1(2.5 * k)}"/>` +
           [...Array(12)].map((_, j) => { const a = j * Math.PI / 6; return `<circle cx="${f1(cx + Math.cos(a) * r * 0.78)}" cy="${f1(cy + Math.sin(a) * r * 0.78)}" r="${f1(1.3 * k)}" fill="#3a2414"/>`; }).join("") +
           `<line x1="${f1(cx)}" y1="${f1(cy)}" x2="${f1(cx)}" y2="${f1(cy - r * 0.6)}" stroke="#3a2414" stroke-width="${f1(2 * k)}" stroke-linecap="round"/>` +
           `<line x1="${f1(cx)}" y1="${f1(cy)}" x2="${f1(cx + r * 0.45)}" y2="${f1(cy + r * 0.2)}" stroke="#3a2414" stroke-width="${f1(2 * k)}" stroke-linecap="round"/>`; }
    const px = x0 + W * 0.08, py = floor + 50 * k;
    let plant = `<path d="M${P(px - 30 * k, py - 60 * k)} H${f1(px + 30 * k)} L${P(px + 22 * k, py)} H${f1(px - 22 * k)} Z" fill="#c0663a"/>`;
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.3, l = (90 + 40 * R(i, 130)) * k;
      plant += `<path d="M${P(px, py - 60 * k)} Q${P(px + Math.cos(a) * l * 0.4 - 20 * k, py - 60 * k + Math.sin(a) * l * 0.6)} ${P(px + Math.cos(a) * l, py - 60 * k + Math.sin(a) * l)} Q${P(px + Math.cos(a) * l * 0.5 + 20 * k, py - 60 * k + Math.sin(a) * l * 0.5)} ${P(px, py - 60 * k)} Z" fill="${i % 2 ? "#2f8a3a" : "#3fa34a"}"/>`;
    }
    return [t, lamp + obj("plant", py, plant)];
  });
  let s = SEP + room;
  // the window above the couch, and what is outside it: a scene of its
  // own, at its own detail (a window in a picture of the room shows it too,
  // once, not forever)
  const wx = 170 * k, wy0 = y0 + H * 0.05, wy1 = y0 + H * 0.36, depth = (o.depth ?? 0) + 1;
  if (depth <= 2) {
    const view = PICTURE_CHOICES.some(([kd]) => kd === o.view) ? o.view : "lake";
    s += SEP + `<g class="portal" data-to="${view}">` + pictureSvg(view, o.viewDetail ?? 80, o, depth, -wx, wy0, 2 * wx, wy1 - wy0) + `</g>`;
  }
  s += SEP + part("living-window", c.F, () => {
    const fw = 10 * k;
    let t = `<rect x="${f1(-wx)}" y="${f1(wy0)}" width="${f1(2 * wx)}" height="${f1(wy1 - wy0)}" fill="#ffffff" opacity="0.06"/>` +
            `<path d="M${P(-wx * 0.7, wy0)} L${P(-wx * 0.2, wy0)} L${P(-wx * 0.6, wy1)} L${P(-wx * 0.95, wy1)} Z" fill="#ffffff" opacity="0.1"/>` +
            `<rect x="${f1(-wx)}" y="${f1(wy0)}" width="${f1(2 * wx)}" height="${f1(wy1 - wy0)}" fill="none" stroke="#ffffff" stroke-width="${f1(fw)}"/>` +
            `<path d="M${P(-wx / 3, wy0)} V${f1(wy1)} M${P(wx / 3, wy0)} V${f1(wy1)} M${P(-wx, (wy0 + wy1) / 2)} H${f1(wx)}" stroke="#ffffff" stroke-width="${f1(fw * 0.6)}"/>` +
            `<rect x="${f1(-wx - 14 * k)}" y="${f1(wy1)}" width="${f1(2 * wx + 28 * k)}" height="${f1(9 * k)}" fill="#f4efe6" stroke="#d8cdb8" stroke-width="${f1(k)}"/>`;
    // curtains, tied back, and their rod
    for (const sd of [-1, 1]) {
      const ex = sd * (wx + 34 * k), ix = sd * (wx - 26 * k), tie = wy0 + (wy1 - wy0) * 0.62;
      t += `<path d="M${P(ex, wy0 - 16 * k)} L${P(ix, wy0 - 16 * k)} Q${P(ix + sd * 10 * k, tie - 30 * k)} ${P(sd * (wx + 6 * k), tie)} ` +
           `Q${P(ix + sd * 4 * k, tie + 40 * k)} ${P(sd * (wx - 4 * k), wy1 + 50 * k)} L${P(ex, wy1 + 50 * k)} Z" fill="#b8434f"/>` +
           `<path d="M${P(sd * (wx + 6 * k), tie)} L${P(ex, tie + 4 * k)}" stroke="#e8c870" stroke-width="${f1(4 * k)}"/>`;
    }
    return `<g pointer-events="none">` + t + `<rect x="${f1(-wx - 50 * k)}" y="${f1(wy0 - 22 * k)}" width="${f1(2 * wx + 100 * k)}" height="${f1(7 * k)}" rx="${f1(3 * k)}" fill="#6b4423"/></g>`;
  });
  // the pictures, either side of the window
  s += SEP + picturesSvg(o, "livingroom", [[-255, y0 + H * 0.27, 210 * k], [255, y0 + H * 0.27, 210 * k], [-230, y0 + H * 0.07, 95 * k],
                                     [230, y0 + H * 0.07, 95 * k], [-350, y0 + H * 0.07, 80 * k], [350, y0 + H * 0.07, 80 * k]], ps);
  // the lamp and the plant, in front of the wall
  s += SEP + things;
  // the couch and its pillows, in the couch's own units
  // (the whole group one object, standing on its feet)
  s += obj("couch", g - 40 * k, OPEN(`<g id="bg-couch" ${tf(0, g - 40 * k, cs * k)}>`) + part("living-couch", [], () =>
    `<rect x="-300" y="-6" width="600" height="12" rx="6" fill="#000000" opacity="0.15"/>` +
    [-270, 270].map(x => `<rect x="${x - 8}" y="-20" width="16" height="22" fill="#4a2e1a"/>`).join("") +
    `<rect x="-260" y="-250" width="520" height="160" rx="40" fill="#2f6f86"/>` +
    `<rect x="-250" y="-120" width="500" height="100" rx="18" fill="#2a6377"/>` +
    [-1, 1].map(sd => `<rect x="${sd < 0 ? -300 : 230}" y="-170" width="70" height="160" rx="30" fill="#337a93"/>`).join("") +
    [-1, 0, 1].map(i => `<rect x="${-232 + (i + 1) * 156}" y="-130" width="152" height="46" rx="16" fill="#3a8aa6" stroke="#2a6377" stroke-width="2"/>`).join("")) +
    SEP + part("living-pillows", [pillows], () => `<defs><g id="bg-pillow"><path d="M-36 -34 Q0 -44 36 -34 Q44 0 36 34 Q0 44 -36 34 Q-44 0 -36 -34 Z" fill="currentColor" stroke="#00000033" stroke-width="2"/>` +
      `<circle cx="0" cy="0" r="5" fill="#00000022"/></g></defs>` +
      [...Array(pillows)].map((_, i) => use("bg-pillow", -195 + (i % 5) * 97 + (i >= 5 ? 48 : 0), -165 + (i >= 5 ? 22 : 0), 1, 1, ` color="${["#f2c12e", "#e85d75", "#ffffff", "#8bc34a", "#ff8c42", "#9b59b6", "#00b894", "#e53935"][i % 8]}"`)).join("")) +
    CLOSE);
  // (a door behind us, at the bottom of the picture, where it leads somewhere: out to the house and yard
  // at first, Matthew 2026-10-17) (its ▼, toward us, in front of everything)
  const back = behindSign(c, o.livingOut);
  if (back) s += obj("sign", Infinity, back);
  return s;
}

// inside a tree house: a real room under a sloped roof, a window onto the
// leaves, pictures on the plank wall, and the things that room keeps
// the colors a house of each colored kind can take
const HOUSE_COLOR_CTLS = [
  ["catFur", "🐱 cat's fur", ["#1f1f22", "#6f6f7d", "#e8862a", "#6b4226", "#ffffff", "#8b5cf6"]],
  ["catWhite", "🐱 tuxedo white (muzzle and bib)", ["#ffffff", "off", "#f7ead8", "#ffd1dc", "#c0c0c0", "#1f1f22"]],
  ["catEyes", "🐱 cat's eyes", ["#c6d43a", "#e0a800", "#3b82f6", "#22c55e", "#f28c28"]],
  ["fancyWalls", "🎀 walls", ["#d9c3e6", "#bcd7ea", "#f7d6e0", "#fff1b8", "#c8e6c9", "#ffffff"]],
  ["fancyRoof", "🎀 roof", ["#6a4c93", "#2e5a88", "#b03a5b", "#3f7f3a", "#5a5a66", "#e8762c"]],
  ["fancyTrim", "🎀 trim", ["#ffffff", "#f2c12e", "#f7a8c8", "#bfe3f5", "#1f1f22"]],
  ["craftWalls", "🔨 walls", ["#9aa982", "#c9a66b", "#8a9bb0", "#b5674d", "#d8cfb8", "#6f7f5a"]],
  ["craftRoof", "🔨 roof", ["#5a3e2b", "#3a3a40", "#6b2f2a", "#2f4a3a", "#7a6a55"]],
  ["craftTrim", "🔨 trim (posts, window)", ["#f4efe6", "#c9b27a", "#2f4a3a", "#7a2f2a", "#1f1f22"]],
  ["craftGable", "🔨 gable", ["#c9b27a", "#f4efe6", "#8a9bb0", "#b5674d", "#5a3e2b"]],
];
const ROOM_CHOICES = [["bunks", "🛏️ bunk room"], ["kitchen", "🍳 kitchen"], ["books", "📚 reading nook"], ["lookout", "🔭 lookout"],
                      ["art", "🎨 art studio"], ["music", "🥁 music room"]];
const HOUSE_ANIMALS = [["fox", "🦊 fox"], ["owl", "🦉 owl"], ["frog", "🐸 frog"], ["bunny", "🐰 bunny"], ["bear", "🐻 bear"], ["cat", "🐱 cat"],
                       ["cabin", "🪵 cabin"], ["fancy", "🎀 fancy house"], ["craftsman", "🔨 craftsman"]];
// each room its own: its wood, its floor, its window, where the tree's
// trunk comes up through it, and where branches poke through its walls
// ([x, y, size, flip, turn], from a hole in the wall or the trunk)
const ROOM_LOOK = {
  art: { planks: ["#e9d8c4", "#e2cfb8", "#efdfcc", "#dcc8ae"], floor: "#a87a4f", window: "wide", trunk: -372,
         branches: [[-70, -150, 1, 1, -8], [120, -178, 0.85, -1, 12]] },
  music: { planks: ["#8a4b3a", "#7d4334", "#94523f", "#83473a"], floor: "#5e3d22", window: "round", trunk: 372,
           branches: [[-80, -172, 0.9, 1, -15], [60, -175, 0.8, -1, 8]] },
  bunks: { planks: ["#b9824c", "#c08a52", "#ad7742", "#b47e48"], floor: "#9a6a3d", window: "square", trunk: -372,
           branches: [[-70, -150, 1, 1, -8], [120, -178, 0.85, -1, 12]] },
  kitchen: { planks: ["#e8dcc8", "#e0d2bb", "#ede3d2", "#d9cbb2"], floor: "#8a5d36", window: "wide", trunk: 260,
             branches: [[-40, -168, 0.9, -1, 0], [235, -60, 0.8, -1, -25]] },
  books: { planks: ["#7a5232", "#6e4a2c", "#845a37", "#734d2f"], floor: "#5e3d22", window: "arch", trunk: 0,
           branches: [[-34, -120, 1.15, -1, -12], [34, -140, 1.15, 1, 8]] },
  lookout: { planks: ["#9aa5ad", "#8e99a1", "#a3adb4", "#949fa7"], floor: "#7d6a55", window: "round", trunk: 372,
             branches: [[-80, -172, 0.9, 1, -15], [345, -90, 1, -1, 10]] },
};
// a trunk of several strands, apart where they come up through the floor,
// crossing as they rise and merging into one above (a fig's, a banyan's)
function braidSvg(cx, top, bottom, w, k, { strands = 3, taper = 0, base = "#2a1a0e" } = {}) {
  let t = `<ellipse cx="${f1(cx)}" cy="${f1(bottom)}" rx="${f1(w * 0.9)}" ry="${f1(14 * k)}" fill="${base}"/>`;
  // a darker core behind the strands, so they read as one tree
  const core = [0, 1].map(u => [w * (0.34 - 0.14 * u), bottom + (top - bottom) * u]);
  t += `<polygon points="${f1(cx - core[0][0])},${f1(core[0][1])} ${f1(cx - core[1][0])},${f1(core[1][1])} ${f1(cx + core[1][0])},${f1(core[1][1])} ${f1(cx + core[0][0])},${f1(core[0][1])}" fill="#3f2716"/>`;
  for (let j = 0; j < strands; j++) {
    const L = [], Rt = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24, y = bottom + (top - bottom) * u, spread = 1 - 0.75 * u;
      const x = cx + w * 0.5 * spread * Math.sin(u * 5 + j * 2.1) + (j - (strands - 1) / 2) * w * 0.7 / (strands - 1) * spread;
      const half = w * (0.6 / strands) * (1 + 0.25 * Math.sin(u * 9 + j)) * (1 - taper * u);
      L.push([x - half, y]); Rt.push([x + half, y]);
    }
    const mid = L.map(([x, y], i) => [(x + Rt[i][0]) / 2 + 3 * k * Math.sin(i * 1.7 + j), y]);
    t += `<polygon points="${[...L, ...Rt.reverse()].map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ")}" fill="${["#6e4a2c", "#7a5232", "#5e3d22"][j % 3]}" stroke="#3a2414" stroke-width="${f1(2 * k)}"/>` +
         `<polyline points="${mid.map(([x, y]) => `${f1(x)},${f1(y)}`).join(" ")}" fill="none" stroke="#3a2414" stroke-width="${f1(1.5 * k)}" opacity="0.5"/>`;
  }
  return t;
}
const ROOMS = { bunks: "bunk room", kitchen: "kitchen", books: "reading nook", lookout: "lookout", art: "art studio", music: "music room" };
// where each room's wall is free for pictures (in the stage's units)
const ROOM_PICTURES = { bunks: [[-255, 115, 110], [95, -105, 85]], kitchen: [[95, -125, 80], [-60, -150, 60]],
                        books: [[175, -25, 120], [305, 10, 70]], lookout: [[175, -20, 120], [-335, 140, 80]],
                        art: [[95, -125, 80], [-60, -150, 60]], music: [[-60, -150, 60], [95, -125, 60]] };
// what joins a tree house (0-based) to the others, outside: a rope bridge
// (on its left or right), its ladder down (to the house below, or the
// ground: to -1), the ladder up from the house above; and their emoji
function houseLinks(o, i) {
  const n = Math.max(1, Math.min(6, o.houses ?? 4)), bridges = o.bridges ?? 2, ladders = o.ladders ?? 3, out = [];
  if (i >= n) return out;
  for (const [a, b] of TREE_BRIDGES.filter(([a, b]) => a < n && b < n).slice(0, bridges))
    if (a === i || b === i) { const j = a === i ? b : a; out.push({ to: j, way: TREE_SLOTS[j][0] > TREE_SLOTS[i][0] ? "right" : "left" }); }
  const has = j => j < Math.min(n, ladders), down = j => (LADDER_TO[j] >= 0 && LADDER_TO[j] < n ? LADDER_TO[j] : -1);
  if (has(i)) out.push({ to: down(i), way: "down" });
  for (let j = 0; j < n; j++) if (has(j) && down(j) === i) out.push({ to: j, way: "up" });
  return out.map(L => ({ ...L, label: L.to < 0 ? "🌳" : houseEmoji(o, L.to + 1) }));
}
const houseEmoji = (o, n) => {
  const kind = o["house" + n], e = HOUSE_ANIMALS.find(([v]) => v === kind) || HOUSE_ANIMALS.find(([v]) => v === TREE_SLOTS[n - 1][2]);
  return e[1].split(" ")[0];
};
// a wooden sign, its words in the middle at (x, y)
const plankSign = (x, y, k, text) => `<rect x="${f1(x - 52 * k)}" y="${f1(y - 18 * k)}" width="${f1(104 * k)}" height="${f1(36 * k)}" rx="${f1(5 * k)}" fill="#a0703f" stroke="#5e3d22" stroke-width="${f1(2.5 * k)}"/>` +
  `<text x="${f1(x)}" y="${f1(y + 7 * k)}" text-anchor="middle" font-size="${f1(20 * k)}" font-weight="bold" fill="#fff8e7" font-family="sans-serif">${text}</text>`;
function waysSvg({ x0, x1, y0, W, H, k, P }, floor, links) {
  let t = "";
  const sides = { left: 0, right: 0 };
  for (const L of links) {
    const go = L.to < 0 ? `data-to="treehouse"` : `data-to="treeroom" data-house="${L.to + 1}"`, name = L.to < 0 ? "🌳 out" : `${L.label} ${L.to + 1}`;
    t += `<g class="portal" ${go}${L.way === "left" || L.way === "right" ? ` data-door=""` : ""}>`;
    if (L.way === "left" || L.way === "right") {
      // a door in the side wall, the rope bridge going out through it
      const sd = L.way === "left" ? -1 : 1, j = sides[L.way]++, cx = sd < 0 ? x0 + (60 + 120 * j) * k : x1 - (60 + 120 * j) * k;
      const w = 84 * k, top = floor - 172 * k;
      t += `<rect x="${f1(cx - w / 2)}" y="${f1(top)}" width="${f1(w)}" height="${f1(floor - top)}" fill="#a8dcf5"/>` +
           `<circle cx="${f1(cx - 18 * k)}" cy="${f1(top + 26 * k)}" r="${f1(24 * k)}" fill="#4fb04f"/><circle cx="${f1(cx + 22 * k)}" cy="${f1(top + 16 * k)}" r="${f1(20 * k)}" fill="#3c9a40"/>` +
           `<polygon points="${P(cx - w / 2, floor)} ${P(cx + w / 2, floor)} ${P(cx + sd * w * 0.2 + w * 0.12, floor - 70 * k)} ${P(cx + sd * w * 0.2 - w * 0.12, floor - 70 * k)}" fill="#8b5e34"/>` +
           [0.25, 0.5, 0.75].map(u => `<line x1="${f1(cx - w / 2 + (sd * w * 0.2 + w * 0.38) * u)}" y1="${f1(floor - 70 * k * u)}" x2="${f1(cx + w / 2 + (sd * w * 0.2 - w * 0.38) * u)}" y2="${f1(floor - 70 * k * u)}" stroke="#5e3d22" stroke-width="${f1(2 * k)}"/>`).join("") +
           [-1, 1].map(e => `<line x1="${f1(cx + e * w / 2)}" y1="${f1(floor - 45 * k)}" x2="${f1(cx + sd * w * 0.2 + e * w * 0.12)}" y2="${f1(floor - 100 * k)}" stroke="#d8c49a" stroke-width="${f1(2.5 * k)}"/>`).join("") +
           // (ticket 216, Matthew: "let's show doors on the treehouse ... they open like the castle doors when we trigger them
           // as a passage way, and we walk through them") a plank door, hinged on its outer side: it swings open as the
           // passage is taken (walkInto: [data-leaf] to its data-open shape, the same commands; its planks and knob fade),
           // the bridge behind it; shut again on coming back
           (() => { const fx = cx - sd * w / 2, hx = cx + sd * w / 2, ox = hx - sd * w * 0.2;
             const shut = `M${P(fx, floor)} L${P(fx, top)} L${P(hx, top)} L${P(hx, floor)} Z`, open = `M${P(ox, floor + 8 * k)} L${P(ox, top - 8 * k)} L${P(hx, top)} L${P(hx, floor)} Z`;
             return `<g data-leaf="" data-open="${open}"><path d="${shut}" fill="#9a6838" stroke="#5e3d22" stroke-width="${f1(3 * k)}" stroke-linejoin="round"/>` +
               [0.25, 0.5, 0.75].map(u => `<line x1="${f1(cx - w / 2 + w * u)}" y1="${f1(top + 4 * k)}" x2="${f1(cx - w / 2 + w * u)}" y2="${f1(floor - 2 * k)}" stroke="#6b4423" stroke-width="${f1(2 * k)}"/>`).join("") +
               `<ellipse cx="${f1(fx + sd * 13 * k)}" cy="${f1(floor - 82 * k)}" rx="${f1(4.5 * k)}" ry="${f1(4.5 * k)}" fill="#e2c26a" stroke="#5e3d22" stroke-width="${f1(1.5 * k)}"/></g>`; })() +
           `<rect x="${f1(cx - w / 2)}" y="${f1(top)}" width="${f1(w)}" height="${f1(floor - top)}" fill="none" stroke="#5e3d22" stroke-width="${f1(9 * k)}"/>` +
           plankSign(cx, top - 26 * k, k, `${name} ${sd < 0 ? "⬅️" : "➡️"}`);
    } else if (L.way === "down") {
      // a hatch in the floor, its lid up, the ladder's top poking out
      const hx = x0 + W * 0.26, hy = floor + 72 * k;
      t += `<polygon points="${P(hx - 60 * k, hy - 18 * k)} ${P(hx + 60 * k, hy - 18 * k)} ${P(hx + 55 * k, hy - 74 * k)} ${P(hx - 55 * k, hy - 74 * k)}" fill="#8b5e34" stroke="#5e3d22" stroke-width="${f1(3 * k)}"/>` +
           `<polygon points="${P(hx - 60 * k, hy - 18 * k)} ${P(hx + 60 * k, hy - 18 * k)} ${P(hx + 76 * k, hy + 20 * k)} ${P(hx - 76 * k, hy + 20 * k)}" fill="#2a1a0e" stroke="#5e3d22" stroke-width="${f1(4 * k)}"/>` +
           // (ticket 199, Matthew: "some ladders don't animate (ones going down trap doors in tree house) ... let's make them all
           // animate") the ladder a ladder too, climbed down: data-down, the hole's near edge, below which the friend goes out of sight
           `<g data-ladder="1" data-down="${f1(hy + 20 * k)}">` +
           [-22, 22].map(e => `<line x1="${f1(hx + e * k)}" y1="${f1(hy + 14 * k)}" x2="${f1(hx + e * 0.9 * k)}" y2="${f1(hy - 50 * k)}" stroke="#a0703f" stroke-width="${f1(5 * k)}"/>`).join("") +
           [-36, -14, 8].map(dy => `<line x1="${f1(hx - 21 * k)}" y1="${f1(hy + dy * k)}" x2="${f1(hx + 21 * k)}" y2="${f1(hy + dy * k)}" stroke="#c08a52" stroke-width="${f1(4 * k)}"/>`).join("") + `</g>` +
           plankSign(hx + 120 * k, hy - 30 * k, k, `${name} ⬇️`);
    } else {
      // a ladder up through a hole in the ceiling
      const lx = x1 - W * 0.4;
      t += `<ellipse cx="${f1(lx)}" cy="${f1(y0 + 6 * k)}" rx="${f1(40 * k)}" ry="${f1(12 * k)}" fill="#2a1a0e"/>` +
           `<g data-ladder="1">` + [-22, 22].map(e => `<line x1="${f1(lx + e * k)}" y1="${f1(floor + 14 * k)}" x2="${f1(lx + e * 0.85 * k)}" y2="${f1(y0 + 2 * k)}" stroke="#a0703f" stroke-width="${f1(5 * k)}"/>`).join("") +
           [...Array(Math.floor((floor + 14 * k - y0) / (30 * k)))].map((_, r) => `<line x1="${f1(lx - 20 * k)}" y1="${f1(floor - r * 30 * k)}" x2="${f1(lx + 20 * k)}" y2="${f1(floor - r * 30 * k)}" stroke="#c08a52" stroke-width="${f1(4 * k)}"/>`).join("") + `</g>` +
           plankSign(lx, y0 + H * 0.24, k, `${name} ⬆️`);
    }
    t += `</g>`;
  }
  return t;
}
// (ticket 50) a tree house room's seats, by which room it is (picked as
// treeroomScene picks it): the bunk room's bottom bunk, the top of its
// mattress (at floor - 170) between the posts at its ends, facing us; the
// reading nook's beanbag, across the top of it (its peak at floor - 60),
// sunk 10 into it, as one sinks into a beanbag
SEATS.treeroom = (c, B) => {
  const { x0, x1, g, W, k } = c, inside = Math.max(1, Math.min(6, B.houses ?? 4, Math.round(B.inside ?? 1))), chosen = B["room" + inside];
  const room = ROOMS[chosen] ? chosen : HOUSE_ROOMS[inside - 1], floor = g - 110 * k;
  // (no seat on the bottom bunk: at their size there, a sitter's head went
  // through the top bunk)
  if (room === "books") { const gx = x0 + W * 0.2;
    return [{ name: "beanbag", x0: gx - 36 * k, x1: gx + 36 * k, y: floor - 50 * k, z: floor + 60 * k + 1, facing: ["front", "left", "right"] }]; }
  return [];
};
function treeroomScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, all, o } = c;
  const inside = Math.max(1, Math.min(6, o.houses ?? 4, Math.round(o.inside ?? 1))), chosen = o["room" + inside];
  const room = ROOMS[chosen] ? chosen : HOUSE_ROOMS[inside - 1], ws = (o.windowSize ?? 100) / 100, things = o.toys ?? 10;
  const floor = g - 110 * k;
  const look = ROOM_LOOK[room];
  let s = SEP + part("room-shell", [c.F, room], () => {
    let t = all(look.planks[0]);
    for (let i = 0; i < 22; i++) {   // the plank wall, a knot here and there
      const x = x0 - 10 * k + i * W / 20;
      t += `<rect x="${f1(x)}" y="${f1(y0 - pad)}" width="${f1(W / 20 - 3 * k)}" height="${f1(floor - y0 + pad)}" fill="${look.planks[i % 4]}"/>`;
      if (R(i, 140) < 0.5) t += `<ellipse cx="${f1(x + W / 40)}" cy="${f1(y0 + H * R(i, 141) * 0.7)}" rx="${f1(5 * k)}" ry="${f1(8 * k)}" fill="#7a4f2a"/>`;
    }
    // the roof slopes down over the corners, its rafters showing
    for (const sd of [-1, 1]) {
      const ex = sd < 0 ? x0 - pad : x1 + pad, cx = sd < 0 ? x0 + W * 0.3 : x1 - W * 0.3;
      t += `<polygon points="${P(ex, y0 + H * 0.36)} ${P(ex, y0 - pad)} ${P(cx, y0 - pad)} ${P(cx, y0)}" fill="#7a4f2a"/>`;
      for (let j = 1; j < 5; j++) {
        const u = j / 5;
        t += `<line x1="${f1(ex + (cx - ex) * u)}" y1="${f1(y0 - pad)}" x2="${f1(ex + (cx - ex) * u)}" y2="${f1(y0 + H * 0.36 * (1 - u))}" stroke="#5e3d22" stroke-width="${f1(6 * k)}"/>`;
      }
      t += `<line x1="${f1(ex)}" y1="${f1(y0 + H * 0.36)}" x2="${f1(cx)}" y2="${f1(y0)}" stroke="#4a2e1a" stroke-width="${f1(12 * k)}"/>`;
    }
    // floor boards toward the back wall
    t += `<rect x="${f1(x0 - pad)}" y="${f1(floor)}" width="${f1(W + 2 * pad)}" height="${f1(y1 - floor + pad)}" fill="${look.floor}"/>`;
    for (let i = -14; i <= 14; i++)
      t += `<line x1="${f1(i * W / 20)}" y1="${f1(floor)}" x2="${f1(i * W / 6)}" y2="${f1(y1 + pad)}" stroke="#7a4f2a" stroke-width="${f1(2 * k)}"/>`;
    t += `<rect x="${f1(x0 - pad)}" y="${f1(floor - 6 * k)}" width="${f1(W + 2 * pad)}" height="${f1(10 * k)}" fill="#6b4423"/>`;
    return t;
  });
  // the window: its view and its frame, in its own units, sized by its group
  s += OPEN(`<g ${tf(x0 + W * 0.27, y0 + H * 0.3, ws * k)}>`) + part("room-window", [look.window, sceneLfoKey(o, "fast"), sceneLfoKey(o, "slow")], () => {
    const round = look.window === "round";
    const shape = { round: `<circle cx="0" cy="0" r="80"/>`, square: `<rect x="-80" y="-70" width="160" height="140"/>`,
                    wide: `<rect x="-120" y="-55" width="240" height="110"/>`, arch: `<path d="M-60 70 V-20 A60 60 0 0 1 60 -20 V70 Z"/>` }[look.window];
    return `<defs><clipPath id="bg-win">${shape}</clipPath><linearGradient id="bg-view" x1="0" y1="-80" x2="0" y2="80" gradientUnits="userSpaceOnUse">` +
           `<stop offset="0" stop-color="#7cc7f2"/><stop offset="1" stop-color="#d9f1ff"/></linearGradient></defs>` +
           `<g class="portal" data-to="treehouse" clip-path="url(#bg-win)"><rect x="-100" y="-100" width="200" height="200" fill="url(#bg-view)"/>` +
           // (outside: one of the tree's limbs, forking into branches, a leaf pad on each tip, as on the
           // tree outside; the limb sways in the wind with the slow LFO, each pad flutters with the quick one;
           // it runs on straight along its own tangent at both ends, so no end shows in even the widest window)
           swaying(o, `<path d="M-170 67 L-110 46 Q-20 14 104 -12 L160 -24" stroke="#6e4a2c" stroke-width="13" fill="none" stroke-linecap="round"/>` +
             // (the branches leave the limb on its curve; the pads sit at their tips and on the limb itself,
             // all within the smallest window's view, about ±70 across and ±45 up and down)
             `<path d="M-12 16 Q-30 0 -40 -18 M38 3 Q50 -10 48 -24" stroke="#6e4a2c" stroke-width="6" fill="none" stroke-linecap="round"/>` +
             [[-40, -20, 0.34, 1, "#4fb04f"], [48, -26, 0.3, 3, "#3c9a40"], [-62, 26, 0.28, 5, "#58b050"], [79, -12, 0.28, 6, "#3c9a40"]].map(([x, y, z, j, col], i) =>
               `<g>${sceneLfo(o, "fast", (i * 0.29) % 1, "transform", (v, amp) => `${f1((2 + 6 * amp) * v)} ${x} ${y}`,
                 `<animateTransform attributeName="transform" type="rotate" values="-2 ${x} ${y};2 ${x} ${y};-2 ${x} ${y}" dur="${(0.8 + 0.15 * i).toFixed(2)}s" repeatCount="indefinite"/>`)}` +
               padSvg(j, x, y, z * (i % 2 ? -1 : 1), z, col) + `</g>`).join(""), -170, 67, 3, 0.2, 6) + `</g>` +
           ({ round: `<circle cx="0" cy="0" r="80" fill="none" stroke="#5e3d22" stroke-width="14"/><path d="M-80 0 H80 M0 -80 V80" stroke="#5e3d22" stroke-width="6"/>`,
              square: `<rect x="-80" y="-70" width="160" height="140" fill="none" stroke="#5e3d22" stroke-width="14"/><path d="M0 -70 V70 M-80 0 H80" stroke="#5e3d22" stroke-width="6"/>` +
                      `<rect x="-96" y="70" width="192" height="12" fill="#5e3d22"/>`,
              wide: `<rect x="-120" y="-55" width="240" height="110" fill="none" stroke="#f4efe6" stroke-width="12"/><path d="M-40 -55 V55 M40 -55 V55 M-120 0 H120" stroke="#f4efe6" stroke-width="6"/>` +
                    `<rect x="-134" y="55" width="268" height="12" fill="#f4efe6"/>`,
              arch: `<path d="M-60 70 V-20 A60 60 0 0 1 60 -20 V70 Z" fill="none" stroke="#3a2414" stroke-width="14"/><path d="M0 -80 V70 M-60 10 H60" stroke="#3a2414" stroke-width="6"/>` }[look.window]);
  }) + CLOSE;
  // the tree, up through the floor and out through the roof; its branches
  // poke through the walls, a few pale leaves on them (it is dim in here)
  // (the tree's big limbs pass through the room, bare and still: leaves grow outside, in the
  // sun, and the wind is out there too; see the window)
  // (the trunk an object, standing where it comes up through the floor, with the limbs
  // that leave it; a limb out of the wall, far from it, is the wall's, drawn first,
  // behind everything: it crosses no trunk, and the ways drawn over it stay over it)
  const limb = ([x, y, sc, fl, a]) => `<use href="#bg-wallbranch" transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${+(sc * k * fl).toFixed(3)} ${+(sc * k).toFixed(3)})"/>`;
  const onTrunk = ([x]) => Math.abs(x - look.trunk) < 100 * k;
  s += SEP + part("room-tree", [c.F, room], () =>
    `<defs><g id="bg-wallbranch"><ellipse cx="0" cy="0" rx="11" ry="15" fill="#2a1a0e"/>` +
    `<path d="M-2 -8 Q60 -24 140 -52 L142 -44 Q64 -10 -2 8 Z" fill="#6e4a2c" stroke="#3a2414" stroke-width="1.5"/>` +
    `</g></defs>` + look.branches.filter(b => !onTrunk(b)).map(limb).join("") +
    obj("tree trunk", floor + 40 * k, braidSvg(look.trunk, y0 - pad, floor + 40 * k, 100 * k, k) + look.branches.filter(onTrunk).map(limb).join("")));
  // pictures on the far side of the wall from the window
  s += SEP + picturesSvg(o, "treeroom", ROOM_PICTURES[room].map(([x, y, w]) => [x, y, w * k]), 1, i => `r${inside}pic${i + 1}`);
  // the room's furniture and its things
  s += SEP + part("room-" + room, [c.F, things], () => {
    let t = "";
    if (room === "bunks") {
      const bx = x1 - W * 0.2, top = floor - 330 * k, mid = floor - 170 * k, w = 210 * k;
      // (the bunks and their ladder an object, standing on their posts, floor + 10k; the
      // chest another; each toy is drawn with the one it sits on)
      let bed = [-1, 1].map(sd => `<rect x="${f1(bx + sd * w / 2 - 7 * k)}" y="${f1(top - 20 * k)}" width="${f1(14 * k)}" height="${f1(floor + 30 * k - top)}" fill="#6e4a2c"/>`).join("");
      for (const [y, q] of [[top, "#3b7dd8"], [mid, "#d64545"]])
        bed += `<rect x="${f1(bx - w / 2)}" y="${f1(y)}" width="${f1(w)}" height="${f1(22 * k)}" fill="#f3efe6"/>` +
             `<rect x="${f1(bx - w / 2 + 50 * k)}" y="${f1(y - 4 * k)}" width="${f1(w - 50 * k)}" height="${f1(30 * k)}" fill="${q}"/>` +
             [0, 1, 2, 3].map(j => `<rect x="${f1(bx - w / 2 + 60 * k + j * 36 * k)}" y="${f1(y + 4 * k)}" width="${f1(14 * k)}" height="${f1(14 * k)}" fill="#ffffff" opacity="0.5"/>`).join("") +
             `<rect x="${f1(bx - w / 2 + 6 * k)}" y="${f1(y - 16 * k)}" width="${f1(42 * k)}" height="${f1(18 * k)}" rx="${f1(8 * k)}" fill="#ffffff"/>` +
             `<rect x="${f1(bx - w / 2)}" y="${f1(y + 22 * k)}" width="${f1(w)}" height="${f1(12 * k)}" fill="#6e4a2c"/>`;
      const lx = bx - w / 2 - 34 * k;
      bed += `<line x1="${f1(lx)}" y1="${f1(top)}" x2="${f1(lx)}" y2="${f1(floor + 20 * k)}" stroke="#8b5e34" stroke-width="${f1(6 * k)}"/><line x1="${f1(lx + 26 * k)}" y1="${f1(top)}" x2="${f1(lx + 26 * k)}" y2="${f1(floor + 20 * k)}" stroke="#8b5e34" stroke-width="${f1(6 * k)}"/>` +
           [...Array(8)].map((_, j) => `<line x1="${f1(lx)}" y1="${f1(top + 20 * k + j * 42 * k)}" x2="${f1(lx + 26 * k)}" y2="${f1(top + 20 * k + j * 42 * k)}" stroke="#a0703f" stroke-width="${f1(5 * k)}"/>`).join("");
      // stuffed toys on the beds, the rest on a chest by the window
      let chest = `<rect x="${f1(x0 + W * 0.12)}" y="${f1(floor - 70 * k)}" width="${f1(150 * k)}" height="${f1(90 * k)}" fill="#8b5e34" stroke="#5e3d22" stroke-width="${f1(3 * k)}"/>`;
      [...Array(things)].forEach((_, i) => {
        const on = Math.floor(i / 4) % 3, at = [[bx + w / 2 - 30 * k - (i % 4) * 40 * k, top - 2 * k], [bx + w / 2 - 30 * k - (i % 4) * 40 * k, mid - 2 * k], [x0 + W * 0.12 + 20 * k + (i % 4) * 36 * k, floor - 70 * k]][on];
        const toy = use(`bg-toy-${["teddy", "ball", "blocks", "teddy"][i % 4]}`, at[0], at[1] - Math.floor(i / 12) * 30 * k, k * 0.9);
        if (on < 2) bed += toy; else chest += toy;
      });
      t += `<defs>${toyDefs}</defs>` + obj("bunk beds", floor + 10 * k, bed) + obj("toy chest", floor + 20 * k, chest);
    } else if (room === "kitchen") {
      const cx = x0 + W * 0.05, top = floor - 120 * k;
      // shelves of jars above the counter
      // (on the wall: drawn before the objects, which they cross none of)
      const sy = [y0 + H * 0.52, y0 + H * 0.36], jx = x1 - W * 0.36;
      t += sy.map(y => `<rect x="${f1(jx)}" y="${f1(y)}" width="${f1(W * 0.3)}" height="${f1(8 * k)}" fill="#6e4a2c"/>`).join("") +
           [...Array(things)].map((_, i) => {
             const row = Math.floor(i / 9) % 2, x = jx + 14 * k + (i % 9) * W * 0.032, y = sy[row], h = (26 + 14 * R(i, 150)) * k;
             return `<rect x="${f1(x)}" y="${f1(y - h)}" width="${f1(20 * k)}" height="${f1(h)}" rx="${f1(4 * k)}" fill="${["#e8c870", "#c0504d", "#7cb342", "#f2a65a", "#8e6bbf"][i % 5]}" opacity="0.9" stroke="#ffffff" stroke-width="${f1(1.5 * k)}"/>` +
                    `<rect x="${f1(x - 1 * k)}" y="${f1(y - h - 6 * k)}" width="${f1(22 * k)}" height="${f1(7 * k)}" fill="#8b5e34"/>`;
           }).join("");
      // (the counter and the stove each an object, both down to top + 130k, floor + 10k)
      t += obj("counter", floor + 10 * k, `<rect x="${f1(cx)}" y="${f1(top)}" width="${f1(W * 0.34)}" height="${f1(130 * k)}" fill="#7a4f2a"/>` +
           `<rect x="${f1(cx - 8 * k)}" y="${f1(top - 12 * k)}" width="${f1(W * 0.34 + 16 * k)}" height="${f1(14 * k)}" fill="#d9c7a8"/>` +
           [0, 1, 2].map(j => `<rect x="${f1(cx + 12 * k + j * W * 0.11)}" y="${f1(top + 14 * k)}" width="${f1(W * 0.1)}" height="${f1(96 * k)}" fill="#8b5e34" stroke="#5e3d22" stroke-width="${f1(2 * k)}"/><circle cx="${f1(cx + 12 * k + j * W * 0.11 + W * 0.085)}" cy="${f1(top + 60 * k)}" r="${f1(3.5 * k)}" fill="#f2c12e"/>`).join("")) +
           // a little stove, a kettle on it
           obj("stove", floor + 10 * k, `<rect x="${f1(cx + W * 0.36)}" y="${f1(top - 30 * k)}" width="${f1(110 * k)}" height="${f1(160 * k)}" fill="#3a3a3a"/><rect x="${f1(cx + W * 0.36 + 14 * k)}" y="${f1(top + 30 * k)}" width="${f1(82 * k)}" height="${f1(60 * k)}" fill="#e8762c" opacity="0.8"/>` +
           `<ellipse cx="${f1(cx + W * 0.36 + 55 * k)}" cy="${f1(top - 50 * k)}" rx="${f1(30 * k)}" ry="${f1(22 * k)}" fill="#c0392b"/><path d="M${P(cx + W * 0.36 + 82 * k, top - 54 * k)} L${P(cx + W * 0.36 + 104 * k, top - 70 * k)}" stroke="#c0392b" stroke-width="${f1(7 * k)}"/>`);
      // a table and two stools on the right
      // (an object, its legs down to floor + 84k)
      const tx = x1 - W * 0.18;
      t += obj("table", floor + 84 * k, `<rect x="${f1(tx - 90 * k)}" y="${f1(floor - 40 * k)}" width="${f1(180 * k)}" height="${f1(14 * k)}" fill="#8b5e34"/>` +
           [-70, 70].map(dx => `<rect x="${f1(tx + dx * k - 6 * k)}" y="${f1(floor - 26 * k)}" width="${f1(12 * k)}" height="${f1(110 * k)}" fill="#6e4a2c"/>`).join("") +
           `<circle cx="${f1(tx)}" cy="${f1(floor - 58 * k)}" r="${f1(18 * k)}" fill="#e53935"/>`);
    } else if (room === "books") {
      const bx = x1 - W * 0.36, w = W * 0.32, top = y0 + H * 0.5;
      t += `<rect x="${f1(bx)}" y="${f1(top)}" width="${f1(w)}" height="${f1(floor + 20 * k - top)}" fill="#6e4a2c"/>`;
      const shelves = 4, sh = (floor + 20 * k - top) / shelves;
      for (let j = 0; j < shelves; j++) t += `<rect x="${f1(bx + 8 * k)}" y="${f1(top + j * sh + 8 * k)}" width="${f1(w - 16 * k)}" height="${f1(sh - 14 * k)}" fill="#4a2e1a"/>`;
      let shelf = 0, at = bx + 12 * k;
      t += [...Array(things * 2)].map((_, i) => {
        const bw = (10 + 8 * R(i, 160)) * k, bh = (sh - 24 * k) * (0.7 + 0.28 * R(i, 161));
        if (at + bw > bx + w - 12 * k) { shelf++; at = bx + 12 * k; }
        if (shelf >= shelves) return "";
        const x = at; at += bw + 2 * k;
        return `<rect x="${f1(x)}" y="${f1(top + (shelf + 1) * sh - 6 * k - bh)}" width="${f1(bw)}" height="${f1(bh)}" fill="${["#c0392b", "#2e86de", "#27ae60", "#f2c12e", "#8e44ad", "#e67e22", "#16a085"][i % 7]}"/>`;
      }).join("");
      // a beanbag and a lantern
      // (the lantern hangs on a cord from the roof itself: the roof's edge, at the cord, is
      // where the slope above, from x0 - pad to x0 + 0.3 W, crosses it)
      // (the bookcase and its books an object, standing on the floor at floor + 20k; the
      // beanbag another, at its foot, floor + 60k; the lantern hangs at the wall, from the
      // roof's edge there, and is not one: it is drawn first, crossing neither)
      const gx = x0 + W * 0.2, lx = x0 + W * 0.1, ly = y0 + H * 0.36 * (1 - W * 0.1 / (W * 0.3)) + 60 * k;
      const roofAt = y0 + H * 0.36 * (1 - (lx - (x0 - pad)) / (x0 + W * 0.3 - (x0 - pad)));
      t = `<line x1="${f1(lx)}" y1="${f1(roofAt - 4 * k)}" x2="${f1(lx)}" y2="${f1(ly)}" stroke="#333" stroke-width="${f1(2 * k)}"/>` +
          `<path d="M${P(lx - 5 * k, roofAt - 2 * k)} q${f1(5 * k)} ${f1(-7 * k)} ${f1(10 * k)} 0" fill="none" stroke="#333" stroke-width="${f1(2.5 * k)}"/>` +
          `<rect x="${f1(lx - 16 * k)}" y="${f1(ly)}" width="${f1(32 * k)}" height="${f1(42 * k)}" rx="${f1(6 * k)}" fill="#ffe08a" stroke="#333" stroke-width="${f1(3 * k)}"/>` +
          obj("bookcase", floor + 20 * k, t) +
          obj("beanbag", floor + 60 * k, `<path d="M${P(gx - 90 * k, floor + 60 * k)} Q${P(gx - 100 * k, floor - 70 * k)} ${P(gx, floor - 60 * k)} Q${P(gx + 100 * k, floor - 70 * k)} ${P(gx + 90 * k, floor + 60 * k)} Z" fill="#e85d75"/>`);
    } else if (room === "art") {
      // an easel with a child's painting, a table of paint jars, paint on the
      // floor, and drawings pinned up (the things: jars, then drawings)
      const ex = x1 - W * 0.22, top = floor - 270 * k, cols = ["#e53935", "#3b7dd8", "#f2c12e", "#27ae60", "#8e44ad", "#ff8c42"];
      t += [[-60, 30], [-30, 50], [40, 20], [70, 60], [10, 80]].map(([dx, dy], i) =>
             `<ellipse cx="${f1(dx * k)}" cy="${f1(floor + dy * k)}" rx="${f1(16 * k)}" ry="${f1(6 * k)}" fill="${cols[i]}" opacity="0.8"/>`).join("") +
           // (the easel an object, at its splayed legs' feet, floor + 30k; the paint on the floor is not)
           obj("easel", floor + 30 * k, [-1, 1].map(sd => `<line x1="${f1(ex)}" y1="${f1(top)}" x2="${f1(ex + sd * 60 * k)}" y2="${f1(floor + 30 * k)}" stroke="#8b5e34" stroke-width="${f1(7 * k)}"/>`).join("") +
           `<line x1="${f1(ex)}" y1="${f1(top)}" x2="${f1(ex)}" y2="${f1(floor + 20 * k)}" stroke="#6e4a2c" stroke-width="${f1(6 * k)}"/>` +
           `<rect x="${f1(ex - 80 * k)}" y="${f1(top + 20 * k)}" width="${f1(160 * k)}" height="${f1(120 * k)}" fill="#fffdf6" stroke="#8b5e34" stroke-width="${f1(4 * k)}"/>` +
           `<circle cx="${f1(ex + 45 * k)}" cy="${f1(top + 50 * k)}" r="${f1(14 * k)}" fill="#ffd23f"/>` +
           `<path d="M${P(ex - 78 * k, top + 138 * k)} Q${P(ex, top + 80 * k)} ${P(ex + 78 * k, top + 138 * k)} Z" fill="#7cc25a"/>` +
           `<rect x="${f1(ex - 40 * k)}" y="${f1(top + 82 * k)}" width="${f1(36 * k)}" height="${f1(30 * k)}" fill="#e85d75"/>` +
           `<polygon points="${P(ex - 46 * k, top + 82 * k)} ${P(ex - 22 * k, top + 62 * k)} ${P(ex + 2 * k, top + 82 * k)}" fill="#3b7dd8"/>` +
           `<rect x="${f1(ex - 90 * k)}" y="${f1(top + 140 * k)}" width="${f1(180 * k)}" height="${f1(8 * k)}" fill="#6e4a2c"/>`);
      // (the table and its jars an object, its legs down to ty + 92k)
      const tx = x0 + W * 0.2, ty = floor - 70 * k;
      t += obj("paint table", ty + 92 * k, `<rect x="${f1(tx - 110 * k)}" y="${f1(ty)}" width="${f1(220 * k)}" height="${f1(12 * k)}" fill="#8b5e34"/>` +
           [-95, 95].map(dx => `<rect x="${f1(tx + dx * k - 5 * k)}" y="${f1(ty + 12 * k)}" width="${f1(10 * k)}" height="${f1(80 * k)}" fill="#6e4a2c"/>`).join("") +
           [...Array(Math.min(things, 10))].map((_, i) => { const x = tx - 98 * k + i * 21 * k;
             return `<rect x="${f1(x)}" y="${f1(ty - 26 * k)}" width="${f1(16 * k)}" height="${f1(26 * k)}" rx="${f1(3 * k)}" fill="${cols[i % 6]}" stroke="#ffffff" stroke-width="${f1(1.5 * k)}"/>` +
                    (i % 2 ? `<line x1="${f1(x + 8 * k)}" y1="${f1(ty - 24 * k)}" x2="${f1(x + 14 * k)}" y2="${f1(ty - 52 * k)}" stroke="#c9a66b" stroke-width="${f1(2.5 * k)}"/>` : ""); }).join(""));
      t += [...Array(Math.max(0, things - 10))].map((_, i) => {
        const x = 150 + (i % 6) * 34 * k, y = y0 + H * 0.12 + Math.floor(i / 6) * 46 * k, c = cols[i % 6];
        return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(28 * k)}" height="${f1(36 * k)}" fill="#ffffff" stroke="#d8cdb8" stroke-width="${f1(k)}" transform="rotate(${(i % 3 - 1) * 5} ${f1(x + 14 * k)} ${f1(y)})"/>` +
               `<circle cx="${f1(x + 14 * k)}" cy="${f1(y + 15 * k)}" r="${f1(7 * k)}" fill="${c}"/><circle cx="${f1(x + 14 * k)}" cy="${f1(y + 2 * k)}" r="${f1(2.5 * k)}" fill="#e53935"/>`;
      }).join("");
    } else if (room === "music") {
      // a drum kit, a keyboard on its stand, records on the wall (the
      // things), and notes in the air
      // (the records, on the wall: drawn before the objects, which they cross none of)
      t += [...Array(things)].map((_, i) => {
        const x = 150 + (i % 6) * 40 * k, y = y0 + H * 0.14 + Math.floor(i / 6) * 42 * k;
        return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(17 * k)}" fill="#1f1f22"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(11 * k)}" fill="none" stroke="#333" stroke-width="${f1(k)}"/>` +
               `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(5.5 * k)}" fill="${["#e53935", "#f2c12e", "#3b7dd8", "#27ae60", "#ff8c42", "#e85d75"][i % 6]}"/>`;
      }).join("");
      // (the drum kit an object, its stands and drum down to dy; the keyboard another, its
      // stand down to floor + 20k, the notes over it with it)
      const dx = x1 - W * 0.26, dy = floor + 14 * k;
      t += obj("drum kit", dy, [[-110, -150, 30], [105, -160, 34]].map(([ox, oy, r]) => `<line x1="${f1(dx + ox * k)}" y1="${f1(dy + oy * k)}" x2="${f1(dx + ox * 0.8 * k)}" y2="${f1(dy)}" stroke="#555" stroke-width="${f1(3 * k)}"/>` +
             `<ellipse cx="${f1(dx + ox * k)}" cy="${f1(dy + oy * k)}" rx="${f1(r * k)}" ry="${f1(5 * k)}" fill="#e2b73c" stroke="#a8862a" stroke-width="${f1(1.5 * k)}"/>`).join("") +
           [-42, 42].map(ox => `<ellipse cx="${f1(dx + ox * k)}" cy="${f1(dy - 112 * k)}" rx="${f1(24 * k)}" ry="${f1(14 * k)}" fill="#c0392b" stroke="#7a1f1f" stroke-width="${f1(2 * k)}"/>` +
             `<ellipse cx="${f1(dx + ox * k)}" cy="${f1(dy - 118 * k)}" rx="${f1(22 * k)}" ry="${f1(7 * k)}" fill="#f4efe6"/>`).join("") +
           `<circle cx="${f1(dx)}" cy="${f1(dy - 52 * k)}" r="${f1(52 * k)}" fill="#c0392b" stroke="#7a1f1f" stroke-width="${f1(3 * k)}"/>` +
           `<circle cx="${f1(dx)}" cy="${f1(dy - 52 * k)}" r="${f1(40 * k)}" fill="#f4efe6"/><text x="${f1(dx)}" y="${f1(dy - 44 * k)}" text-anchor="middle" font-size="${f1(24 * k)}">⭐</text>` +
           `<line x1="${f1(dx - 88 * k)}" y1="${f1(dy - 70 * k)}" x2="${f1(dx - 92 * k)}" y2="${f1(dy)}" stroke="#555" stroke-width="${f1(3 * k)}"/>` +
           `<ellipse cx="${f1(dx - 88 * k)}" cy="${f1(dy - 72 * k)}" rx="${f1(28 * k)}" ry="${f1(10 * k)}" fill="#d8d8d8" stroke="#888" stroke-width="${f1(2 * k)}"/>`);
      const kx = x0 + W * 0.22, ky = floor - 95 * k;
      t += obj("keyboard", floor + 20 * k, [-1, 1].map(sd => `<line x1="${f1(kx - 70 * k)}" y1="${f1(ky + 30 * k)}" x2="${f1(kx + 70 * k)}" y2="${f1(floor + 20 * k)}" stroke="#333" stroke-width="${f1(5 * k)}" transform="scale(${sd} 1)" transform-origin="${f1(kx)} 0"/>`).join("") +
           `<rect x="${f1(kx - 115 * k)}" y="${f1(ky)}" width="${f1(230 * k)}" height="${f1(34 * k)}" rx="${f1(4 * k)}" fill="#222"/>` +
           `<rect x="${f1(kx - 108 * k)}" y="${f1(ky + 10 * k)}" width="${f1(216 * k)}" height="${f1(20 * k)}" fill="#ffffff"/>` +
           [...Array(15)].map((_, i) => [1, 2, 4, 5, 6].includes(i % 7) ? `<rect x="${f1(kx - 108 * k + (i + 0.65) * 14.4 * k)}" y="${f1(ky + 10 * k)}" width="${f1(7 * k)}" height="${f1(12 * k)}" fill="#222"/>` : "").join("") +
           [[-60, -150, "♪"], [-10, -190, "♫"], [40, -160, "♪"]].map(([nx, ny, ch]) => `<text x="${f1(kx + nx * k)}" y="${f1(ky + ny * k)}" font-size="${f1(30 * k)}" fill="#f2c12e">${ch}</text>`).join(""));
    } else {
      // the lookout: a telescope at the window, a map, and pennants overhead
      // (the map and the pennants, on the wall: drawn before the telescope, which they do not cross)
      const mx = x1 - W * 0.3, my = y0 + H * 0.55;
      t += `<rect x="${f1(mx)}" y="${f1(my)}" width="${f1(170 * k)}" height="${f1(120 * k)}" fill="#f3e3b8" stroke="#a0703f" stroke-width="${f1(3 * k)}"/>` +
           `<path d="M${P(mx + 20 * k, my + 90 * k)} Q${P(mx + 60 * k, my + 30 * k)} ${P(mx + 100 * k, my + 70 * k)} T${P(mx + 150 * k, my + 30 * k)}" fill="none" stroke="#c0392b" stroke-width="${f1(3 * k)}" stroke-dasharray="${f1(6 * k)} ${f1(5 * k)}"/>` +
           `<text x="${f1(mx + 140 * k)}" y="${f1(my + 40 * k)}" font-size="${f1(26 * k)}" fill="#c0392b" font-weight="bold">X</text>`;
      const n = Math.max(things, 1), a = x0 + W * 0.04, b = x1 - W * 0.04, top = y0 + H * 0.06;
      t += `<path d="M${P(a, top)} Q${P(0, top + 60 * k)} ${P(b, top)}" fill="none" stroke="#555" stroke-width="${f1(2 * k)}"/>` +
           [...Array(things)].map((_, i) => {
             const u = (i + 0.5) / n, x = a + (b - a) * u, y = (1 - u) * (1 - u) * top + 2 * u * (1 - u) * (top + 60 * k) + u * u * top;
             return `<polygon points="${P(x - 14 * k, y)} ${P(x + 14 * k, y)} ${P(x, y + 34 * k)}" fill="${["#e53935", "#f2c12e", "#2e86de", "#27ae60", "#8e44ad"][i % 5]}"/>`;
           }).join("");
      // (the telescope an object, its tripod's feet at floor + 20k (its mirroring group
      // keeps every y); the map is on the wall, and the pennants are strung along it)
      const tx = x0 + W * 0.3, ty = floor - 150 * k;
      t += obj("telescope", floor + 20 * k, `<g transform="translate(${f1(2 * tx)} 0) scale(-1 1)">` + [-1, 0, 1].map(sd => `<line x1="${f1(tx)}" y1="${f1(ty)}" x2="${f1(tx + sd * 50 * k)}" y2="${f1(floor + 20 * k)}" stroke="#5e3d22" stroke-width="${f1(6 * k)}"/>`).join("") +
           `<g transform="rotate(-28 ${f1(tx)} ${f1(ty)})"><rect x="${f1(tx - 90 * k)}" y="${f1(ty - 14 * k)}" width="${f1(150 * k)}" height="${f1(28 * k)}" rx="${f1(8 * k)}" fill="#c9a94a" stroke="#7a5518" stroke-width="${f1(3 * k)}"/>` +
           `<rect x="${f1(tx - 110 * k)}" y="${f1(ty - 18 * k)}" width="${f1(26 * k)}" height="${f1(36 * k)}" rx="${f1(5 * k)}" fill="#8a6a1a"/></g></g>`);
    }
    return t;
  });
  // the ways out: a door to each house a rope bridge joins this one to, a
  // hatch down its ladder, a ladder up to the house above; each a doorway
  // (the doors are one object, at the back wall's foot, floor (ticket 192, Matthew: drawn as
  // scenery after the room's objects, they covered the friend standing in front of them); the
  // hatch is one, at its hole's front edge, hy + 20k = floor + 92k in waysSvg, and the ladder up
  // another, at its foot, floor + 14k: each drawn by itself, in the order waysSvg draws them all)
  const links = houseLinks(o, inside - 1), ways = way => links.filter(L => way.includes(L.way));
  s += SEP + part("room-ways", [c.F, links], () => {
    const down = ways(["down"]), up = ways(["up"]);
    const doors = ways(["left", "right"]);
    return (doors.length ? obj("side doors", floor, waysSvg(c, floor, doors)) : "") + (down.length ? obj("hatch", floor + 92 * k, waysSvg(c, floor, down)) : "") +
           (up.length ? obj("ladder up", floor + 14 * k, waysSvg(c, floor, up)) : "");
  });
  // which house this is: a sign hanging from the rafters
  // (drawn after the room's objects, so it is in front of everything, an object at
  // Infinity, as the dark and the sign below are: the friend is always under it)
  s += SEP + obj("house sign", Infinity, part("room-sign", [c.F, inside, houseEmoji(o, inside)], () => {
    const sx = x1 - W * 0.14, sy = y0 + H * 0.12;
    // (hanging still on its ropes: no wind indoors)
    return (`<path d="M${P(sx - 30 * k, sy - 60 * k)} L${P(sx - 30 * k, sy)} M${P(sx + 30 * k, sy - 60 * k)} L${P(sx + 30 * k, sy)}" stroke="#d8c49a" stroke-width="${f1(2 * k)}"/>` +
           `<rect x="${f1(sx - 46 * k)}" y="${f1(sy - 4 * k)}" width="${f1(92 * k)}" height="${f1(40 * k)}" rx="${f1(5 * k)}" fill="#a0703f" stroke="#5e3d22" stroke-width="${f1(2.5 * k)}"/>` +
           `<text x="${f1(sx)}" y="${f1(sy + 25 * k)}" text-anchor="middle" font-size="${f1(24 * k)}" font-weight="bold" fill="#fff8e7" font-family="sans-serif">${houseEmoji(o, inside)} ${inside}</text>`);
  }));
  // dim in here: darker toward the corners
  // (over everything, the friend too: in front, at Infinity)
  s += SEP + obj("dark", Infinity, part("room-dim", c.F, () => `<defs><radialGradient id="bg-dim" gradientUnits="userSpaceOnUse" cx="${f1((x0 + x1) / 2)}" cy="${f1(y0 + H * 0.42)}" r="${f1(0.62 * Math.hypot(W, H))}">` +
    `<stop offset="0.5" stop-color="#1a0f05" stop-opacity="0"/><stop offset="1" stop-color="#1a0f05" stop-opacity="0.5"/></radialGradient></defs>` +
    all("url(#bg-dim)").replace("<rect ", `<rect pointer-events="none" `)));
  // (a door behind us, at the bottom of the picture, where it leads somewhere)
  // (its sign in front of everything, at Infinity, as the living room's is)
  const back = behindSign(c, o["treeBack" + inside]);
  s += SEP + (back && obj("sign", Infinity, back));
  return s;
}
// Inside the witch's hut: log walls, herbs and a crooked shelf of potions,
// a cauldron bubbling over its fire, crows in hanging cages, frogs in jars,
// snakes in a glass tank, and the witch herself, who can be dragged about
// (data-drag: her place is the scene's witchX, witchY). Her door goes back
// out to her woods.
const WITCH_DEFS = `<g id="bg-crow"><path d="M-14 4 Q-4 -12 12 -6 L20 -9 L14 -2 Q8 10 -6 10 Z" fill="#1f1f22"/>` +
  `<circle cx="11" cy="-10" r="7" fill="#1f1f22"/><path d="M17 -12 L27 -9 L17 -7 Z" fill="#e0a800"/><circle cx="12" cy="-12" r="1.6" fill="#ffffff"/>` +
  `<path d="M-14 4 L-24 10 L-14 9 Z" fill="#1f1f22"/><path d="M-2 10 L-2 18 M4 10 L4 18" stroke="#e0a800" stroke-width="1.6"/></g>` +
  `<g id="bg-cage"><path d="M-26 30 V-6 Q-26 -34 0 -38 Q26 -34 26 -6 V30" fill="none" stroke="#b08a43" stroke-width="2"/>` +
  [-16, -6, 4, 14].map(x => `<path d="M${x} 30 V-6 Q${x} -30 0 -38" fill="none" stroke="#b08a43" stroke-width="1.5"/>`).join("") +
  `<ellipse cx="0" cy="30" rx="28" ry="6" fill="#6b4a2b"/><circle cx="0" cy="-42" r="5" fill="none" stroke="#b08a43" stroke-width="2"/></g>` +
  `<g id="bg-frogjar"><rect x="-17" y="-40" width="34" height="40" rx="6" fill="#cfe8f0" opacity="0.45" stroke="#e8f6fa" stroke-width="1.5"/>` +
  `<ellipse cx="0" cy="-10" rx="11" ry="8" fill="#4f9a3a"/><circle cx="-6" cy="-18" r="4" fill="#4f9a3a"/><circle cx="6" cy="-18" r="4" fill="#4f9a3a"/>` +
  `<circle cx="-6" cy="-19" r="1.8" fill="#111"/><circle cx="6" cy="-19" r="1.8" fill="#111"/><path d="M-5 -9 Q0 -6 5 -9" stroke="#2a5e22" stroke-width="1.2" fill="none"/>` +
  `<rect x="-19" y="-46" width="38" height="8" rx="2" fill="#7a4b28"/></g>`;
// the witch, in her own units, standing at (0, 0), about 300 tall
const WITCH_SVG = `<path d="M-10 -40 L-70 -230" stroke="#8b5e34" stroke-width="6" stroke-linecap="round"/>` +
  `<path d="M-76 -246 L-58 -236 L-90 -200 Z" fill="#c9a66b"/>` +
  `<ellipse cx="-18" cy="-4" rx="16" ry="7" fill="#1f1f22"/><ellipse cx="18" cy="-4" rx="16" ry="7" fill="#1f1f22"/>` +
  `<path d="M-30 -150 L-55 -8 L55 -8 L30 -150 Z" fill="#6a2c91"/><path d="M-55 -8 L-45 -18 L-35 -8 L-25 -18 L-15 -8 L-5 -18 L5 -8 L15 -18 L25 -8 L35 -18 L45 -8 L55 -8 Z" fill="#4a1d66"/>` +
  `<rect x="-30" y="-100" width="60" height="9" fill="#1f1f22"/><rect x="-7" y="-102" width="14" height="13" fill="none" stroke="#f2c230" stroke-width="3"/>` +
  `<path d="M-28 -146 Q-60 -120 -48 -80" fill="none" stroke="#6a2c91" stroke-width="18" stroke-linecap="round"/>` +
  `<path d="M28 -146 Q60 -150 72 -180" fill="none" stroke="#6a2c91" stroke-width="18" stroke-linecap="round"/>` +
  `<circle cx="-48" cy="-76" r="10" fill="#7cc25a"/><circle cx="76" cy="-186" r="10" fill="#7cc25a"/>` +
  `<path d="M-30 -200 Q-44 -150 -38 -120 M30 -200 Q44 -150 38 -120" stroke="#2b2b2b" stroke-width="12" stroke-linecap="round" fill="none"/>` +
  `<circle cx="0" cy="-185" r="30" fill="#7cc25a"/>` +
  `<path d="M2 -188 L34 -170 L4 -176 Z" fill="#6aa84a"/><circle cx="24" cy="-174" r="3" fill="#5a8a3a"/>` +
  `<ellipse cx="-12" cy="-194" rx="5" ry="6" fill="#ffffff"/><ellipse cx="12" cy="-196" rx="5" ry="6" fill="#ffffff"/>` +
  `<circle cx="-11" cy="-193" r="2.5" fill="#c0392b"/><circle cx="13" cy="-195" r="2.5" fill="#c0392b"/>` +
  `<path d="M-14 -168 Q0 -160 14 -170" stroke="#2a3a1a" stroke-width="3" fill="none"/>` +
  `<ellipse cx="0" cy="-212" rx="58" ry="11" fill="#1f1f22"/>` +
  `<path d="M-30 -214 Q-14 -260 8 -300 Q14 -290 34 -276 Q20 -268 28 -214 Z" fill="#1f1f22"/>` +
  `<rect x="-30" y="-232" width="58" height="10" fill="#6a2c91" transform="rotate(-3 0 -227)"/>`;
function witchroomScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, all, o } = c;
  const floor = g - 100 * k, cz = (o.cauldronSize ?? 100) / 100, wz = (o.witchSize ?? 100) / 100;
  const crows = o.crows ?? 3, frogs = o.frogs ?? 4, snakes = o.snakes ?? 2;
  // the hut: log walls, a beam with herbs, cobwebs, a round window with the moon
  let s = SEP + part("wroom-shell", c.F, () => {
    let t = all("#3a2a3a");
    for (let i = 0; i < 16; i++) {
      const y = y0 - 10 * k + i * 30 * k;
      if (y > floor) break;
      t += `<rect x="${f1(x0 - pad)}" y="${f1(y)}" width="${f1(W + 2 * pad)}" height="${f1(27 * k)}" rx="${f1(13 * k)}" fill="${["#5a4048", "#4e3740", "#634850"][i % 3]}"/>`;
    }
    t += `<rect x="${f1(x0 - pad)}" y="${f1(floor)}" width="${f1(W + 2 * pad)}" height="${f1(y1 - floor + pad)}" fill="#3b2a22"/>`;
    for (let i = -14; i <= 14; i++)
      t += `<line x1="${f1(i * W / 20)}" y1="${f1(floor)}" x2="${f1(i * W / 6)}" y2="${f1(y1 + pad)}" stroke="#2a1d17" stroke-width="${f1(2 * k)}"/>`;
    // the round window, the moon in it
    const wx = 0, wy = y0 + H * 0.14;
    t += `<circle cx="${f1(wx)}" cy="${f1(wy)}" r="${f1(48 * k)}" fill="#1c2340"/><circle cx="${f1(wx + 14 * k)}" cy="${f1(wy - 10 * k)}" r="${f1(18 * k)}" fill="#f4e7b0"/>` +
         `<circle cx="${f1(wx)}" cy="${f1(wy)}" r="${f1(48 * k)}" fill="none" stroke="#2a3a8a" stroke-width="${f1(9 * k)}"/><path d="M${P(wx - 48 * k, wy)} H${f1(wx + 48 * k)} M${P(wx, wy - 48 * k)} V${f1(wy + 48 * k)}" stroke="#2a3a8a" stroke-width="${f1(4 * k)}"/>`;
    // a window either side of the door, as outside: blue frames, the dark woods beyond
    for (const sd of [-1, 1]) {
      const cx = sd * W * 0.24, top = y0 + H * 0.25, w = 92 * k, h = 104 * k;
      t += `<rect x="${f1(cx - w / 2)}" y="${f1(top)}" width="${f1(w)}" height="${f1(h)}" fill="#3a2a5a"/>` +
           `<rect x="${f1(cx - w / 2)}" y="${f1(top + h * 0.55)}" width="${f1(w)}" height="${f1(h * 0.45)}" fill="#24304a"/>` +
           [-0.3, 0.05, 0.35].map((u, j) => `<polygon points="${P(cx + u * w - 12 * k, top + h)} ${P(cx + u * w, top + h * (0.2 + 0.12 * j))} ${P(cx + u * w + 12 * k, top + h)}" fill="#162418"/>`).join("") +
           `<circle cx="${f1(cx + sd * 22 * k)}" cy="${f1(top + 20 * k)}" r="${f1(2 * k)}" fill="#ffffff"/>` +
           `<rect x="${f1(cx - w / 2)}" y="${f1(top)}" width="${f1(w)}" height="${f1(h)}" fill="none" stroke="#2a3a8a" stroke-width="${f1(7 * k)}"/>` +
           `<path d="M${P(cx, top)} V${f1(top + h)}" stroke="#2a3a8a" stroke-width="${f1(4 * k)}"/>`;
    }
    // the beam across, herbs hanging from it, cobwebs in the corners
    const by = y0 + H * 0.02;
    t += `<rect x="${f1(x0 - pad)}" y="${f1(by)}" width="${f1(W + 2 * pad)}" height="${f1(16 * k)}" fill="#2a1a12"/>`;
    for (let i = 0; i < 9; i++) {
      const hx = x0 + W * (0.06 + 0.11 * i) + 10 * k * R(i, 300);
      if (Math.abs(hx) < 70 * k) continue;
      t += `<line x1="${f1(hx)}" y1="${f1(by + 14 * k)}" x2="${f1(hx)}" y2="${f1(by + 40 * k)}" stroke="#c9b27a" stroke-width="${f1(1.5 * k)}"/>` +
           [-8, 0, 8].map(dx => `<path d="M${P(hx, by + 40 * k)} Q${P(hx + dx * k, by + 60 * k)} ${P(hx + dx * 1.4 * k, by + 78 * k)}" stroke="${["#5f8a3a", "#7a6a3a", "#4a7a5a"][i % 3]}" stroke-width="${f1(4 * k)}" fill="none" stroke-linecap="round"/>`).join("");
    }
    for (const [cx, sd] of [[x0, 1], [x1, -1]])
      t += [20, 40, 60].map(r => `<path d="M${P(cx, by + 16 * k + r * k)} Q${P(cx + sd * r * 0.5 * k, by + 16 * k + r * 0.5 * k)} ${P(cx + sd * r * k, by + 16 * k)}" fill="none" stroke="#d8d8e0" stroke-width="${f1(1.2 * k)}" opacity="0.7"/>`).join("") +
           [0.3, 0.6, 0.9].map(a => `<line x1="${f1(cx)}" y1="${f1(by + 16 * k)}" x2="${f1(cx + sd * 64 * k * Math.cos(a * Math.PI / 2))}" y2="${f1(by + 16 * k + 64 * k * Math.sin(a * Math.PI / 2))}" stroke="#d8d8e0" stroke-width="${f1(1.2 * k)}" opacity="0.7"/>`).join("");
    // the crooked shelf of potions, high on the right
    const sx = W * 0.11, sy = y0 + H * 0.47;
    t += `<polygon points="${P(sx, sy)} ${P(sx + W * 0.26, sy - 8 * k)} ${P(sx + W * 0.26, sy)} ${P(sx, sy + 8 * k)}" fill="#2a1a12"/>`;
    for (let i = 0; i < 7; i++) {
      const bx = sx + 14 * k + i * W * 0.035, h = (26 + 20 * R(i, 301)) * k, cc = ["#7cc25a", "#c0392b", "#8e44ad", "#3fd0e0", "#f2c12e", "#e85d75", "#27ae60"][i];
      t += `<rect x="${f1(bx)}" y="${f1(sy - 2 * k - i * 1.1 * k - h)}" width="${f1(16 * k)}" height="${f1(h)}" rx="${f1(6 * k)}" fill="${cc}" opacity="0.85" stroke="#ffffff" stroke-width="${f1(k)}"/>` +
           `<rect x="${f1(bx + 4 * k)}" y="${f1(sy - 2 * k - i * 1.1 * k - h - 7 * k)}" width="${f1(8 * k)}" height="${f1(8 * k)}" fill="#7a4b28"/>`;
    }
    return t;
  });
  // the door back out to the woods, in the middle, as outside: red, braced
  s += SEP + part("wroom-door", c.F, () => {
    const w = 96 * k, top = floor - 196 * k;
    // (0.0.114, Matthew: her door no longer glowed or worked: the friend arrived in front of it, and took
    // the pointer; they arrive to one side now, ARRIVE.witchroom; and a door, data-door, so X glows it too)
    return `<g class="portal" data-to="witch" data-door="1"><rect x="${f1(-w / 2 - 8 * k)}" y="${f1(top - 8 * k)}" width="${f1(w + 16 * k)}" height="${f1(floor - top + 8 * k)}" fill="#2a1a12"/>` +
           `<rect x="${f1(-w / 2)}" y="${f1(top)}" width="${f1(w)}" height="${f1(floor - top)}" fill="#c0392b" stroke="#4a1410" stroke-width="${f1(3 * k)}"/>` +
           `<path d="M${P(-w / 2 + 10 * k, top + 12 * k)} L${P(w / 2 - 10 * k, floor - 12 * k)} M${P(w / 2 - 10 * k, top + 12 * k)} L${P(-w / 2 + 10 * k, floor - 12 * k)}" stroke="#4a1410" stroke-width="${f1(6 * k)}"/>` +
           `<circle cx="${f1(w / 2 - 16 * k)}" cy="${f1(floor - 92 * k)}" r="${f1(5 * k)}" fill="#f2c230"/>` +
           plankSign(0, top - 30 * k, k, "🌲 out") + `</g>`;
  });
  // frogs in jars on a shelf on the left
  s += SEP + part("wroom-frogs", [c.F, frogs], () => {
    const fx = -W * 0.37, fy = y0 + H * 0.47, n = Math.min(frogs, 8);
    return `<defs>${WITCH_DEFS}</defs><rect x="${f1(fx - 16 * k)}" y="${f1(fy)}" width="${f1(W * 0.26)}" height="${f1(9 * k)}" fill="#2a1a12"/>` +
           [...Array(n)].map((_, i) => use("bg-frogjar", fx + 8 * k + i * 26 * k, fy, k * 0.8)).join("");
  });
  // crows in cages, hanging from the beam
  // (the beam runs along the top of the back wall, as the herbs on it do: the cages hang
  // at the wall, and are not objects; drawn before the objects, so always behind the
  // friend; they cross none of them, the snake tank they once came after included)
  s += SEP + part("wroom-crows", [c.F, crows, sceneLfoKey(o, "slow")], () => {
    const by = y0 + H * 0.02 + 16 * k, spots = [-0.36, 0.3, -0.22, 0.18, -0.44, 0.42];
    return `<defs>${WITCH_DEFS}</defs>` + spots.slice(0, Math.min(crows, 6)).map((u, i) => {
      const x = W * u, hang = (60 + 30 * R(i, 302)) * k;
      // (each cage swinging on its chain with the slow LFO, its own way in)
      return swaying(o, `<line x1="${f1(x)}" y1="${f1(by)}" x2="${f1(x)}" y2="${f1(by + hang)}" stroke="#555" stroke-width="${f1(1.5 * k)}"/>` +
             use("bg-crow", x, by + hang + 50 * k, k * 0.9 * (i % 2 ? -1 : 1), k * 0.9) + use("bg-cage", x, by + hang + 40 * k, k * 0.9), x, by, 4, R(i, 302), 5);
    }).join("");
  });
  // snakes in a glass tank on a table on the right
  // (the table and its tank an object, the table's legs down to ty + 82k, floor + 22k)
  s += SEP + obj("snake tank", floor + 22 * k, part("wroom-snakes", [c.F, snakes], () => {
    const tx = x1 - W * 0.12, ty = floor - 60 * k, tw = 130 * k, th = 80 * k;
    let t = `<rect x="${f1(tx - 90 * k)}" y="${f1(ty)}" width="${f1(180 * k)}" height="${f1(12 * k)}" fill="#3a2418"/>` +
            [-80, 80].map(dx => `<rect x="${f1(tx + dx * k - 5 * k)}" y="${f1(ty + 12 * k)}" width="${f1(10 * k)}" height="${f1(70 * k)}" fill="#2a1a12"/>`).join("") +
            `<rect x="${f1(tx - tw / 2)}" y="${f1(ty - th)}" width="${f1(tw)}" height="${f1(th)}" fill="#7a6a3a" opacity="0.35"/>`;
    for (let i = 0; i < Math.min(snakes, 6); i++) {
      const yy = ty - 12 * k - i * 11 * k, ph = i * 1.3, cc = ["#4f9a3a", "#c0392b", "#f2c12e", "#8e44ad", "#27ae60", "#e8762c"][i];
      let d = `M${P(tx - tw / 2 + 10 * k, yy)}`;
      for (let j = 1; j <= 12; j++) d += ` L${P(tx - tw / 2 + 10 * k + j * (tw - 30 * k) / 12, yy - 8 * k * Math.sin(j * 0.9 + ph))}`;
      t += `<path d="${d}" fill="none" stroke="${cc}" stroke-width="${f1(7 * k)}" stroke-linecap="round" stroke-linejoin="round"/>` +
           `<path d="${d}" fill="none" stroke="#1f1f22" stroke-width="${f1(2 * k)}" stroke-dasharray="${f1(3 * k)} ${f1(8 * k)}"/>` +
           `<circle cx="${f1(tx + tw / 2 - 20 * k)}" cy="${f1(yy - 8 * k * Math.sin(12 * 0.9 + ph))}" r="${f1(6 * k)}" fill="${cc}"/>`;
    }
    return t + `<rect x="${f1(tx - tw / 2)}" y="${f1(ty - th)}" width="${f1(tw)}" height="${f1(th)}" fill="#cfe8f0" opacity="0.18" stroke="#e8f6fa" stroke-width="${f1(2.5 * k)}"/>` +
               `<rect x="${f1(tx - tw / 2 - 4 * k)}" y="${f1(ty - th - 6 * k)}" width="${f1(tw + 8 * k)}" height="${f1(7 * k)}" fill="#3a2418"/>`;
  }));
  // the cauldron over its fire, bubbling, its size its group's
  // (an object with its fumes, standing where its group stands its fire, floor + 50k)
  s += obj("cauldron", floor + 50 * k, OPEN(`<g ${tf(-W * 0.22, floor + 50 * k, cz * k)}>`) + part("wroom-cauldron", [sceneLfoKey(o, "fast")], () =>
    `<path d="M-60 0 L60 0 M-50 -6 L50 6 M-50 6 L50 -6" stroke="#5a3a1a" stroke-width="10" stroke-linecap="round"/>` +
    [[-30, 0], [0, 6], [30, -4]].map(([fx, ph]) => `<path d="M${fx - 16} -4 Q${fx} -${46 + ph} ${fx + 16} -4 Z" fill="#ff8c1a">${lfoTimed(o, "fast", (fx + 30) / 90, `<animate attributeName="d" dur="${(0.6 + ph / 30).toFixed(2)}s" repeatCount="indefinite" ` +
      `values="M${fx - 16} -4 Q${fx} -${46 + ph} ${fx + 16} -4 Z;M${fx - 16} -4 Q${fx + 6} -${30 + ph} ${fx + 16} -4 Z;M${fx - 16} -4 Q${fx} -${46 + ph} ${fx + 16} -4 Z"/>`)}</path>` +
      `<path d="M${fx - 8} -4 Q${fx} -${26 + ph} ${fx + 8} -4 Z" fill="#ffd23f"/>`).join("") +
    `<path d="M-70 -40 Q-80 -130 0 -136 Q80 -130 70 -40 Q60 -20 0 -18 Q-60 -20 -70 -40 Z" fill="#1f1f22"/>` +
    `<path d="M-60 -24 L-70 -6 M60 -24 L70 -6" stroke="#1f1f22" stroke-width="8"/>` +
    `<ellipse cx="0" cy="-124" rx="74" ry="16" fill="#2b2b30"/><ellipse cx="0" cy="-122" rx="64" ry="11" fill="#7cfc3a"/>` +
    [[-30, 0.9], [-5, 1.3], [22, 1.1], [40, 0.7]].map(([bx, d]) => `<circle cx="${bx}" cy="-124" r="6" fill="#b6ff7a" opacity="0.9">` +
      `<animate attributeName="cy" values="-120;-150;-120" dur="${d}s" repeatCount="indefinite"/><animate attributeName="r" values="3;8;0" dur="${d}s" repeatCount="indefinite"/></circle>`).join("") +
    "") + CLOSE +
    // (ticket 206: simple unless upgraded in 🏞️ Background)
    SEP + part("wroom-fumes", [c.F, cz, o.cauldronFumes === "fancy"], () => (o.cauldronFumes === "fancy" ? helixSvg : helixCheapSvg)(-W * 0.22, floor + 50 * k - 128 * cz * k, y0 - 80 * k, 14 * cz * k, 50 * cz * k, k)));
  // the witch: dragged anywhere (her place), her size her group's
  // (an object at her feet, where her place puts them)
  s += obj("witch", g + (o.witchY ?? 0), OPEN(`<g data-drag="witch" style="cursor: grab" ${tf(o.witchX ?? 150, g + (o.witchY ?? 0), wz * k)}>`) + part("wroom-witch", [], () => WITCH_SVG) + CLOSE);
  // dim and glowing: darker toward the corners, a green glow over the cauldron
  // (over everything, the friend too: in front, at Infinity; the whole room's, so not the cauldron's)
  s += SEP + obj("dark", Infinity, part("wroom-dim", c.F, () => `<defs><radialGradient id="bg-wdim" gradientUnits="userSpaceOnUse" cx="${f1(-W * 0.2)}" cy="${f1(floor - 40 * k)}" r="${f1(0.75 * Math.hypot(W, H))}">` +
    `<stop offset="0" stop-color="#7cfc3a" stop-opacity="0.12"/><stop offset="0.35" stop-color="#140a14" stop-opacity="0"/><stop offset="1" stop-color="#140a14" stop-opacity="0.55"/></radialGradient></defs>` +
    all("url(#bg-wdim)").replace("<rect ", `<rect pointer-events="none" `)));
  return s;
}
// The healer: a friendly woman in a green dress and a cream apron, a red
// heart on its pocket (the heart on her hut's sign), long auburn hair with
// flowers in it by her ears, rosy cheeks, smiling. She sways gently from
// side to side, and stirs her soup with a long wooden spoon in her right
// hand (on the picture's left), its end at (-110, -48), in the pot. In her
// own units, her feet at (0, 0); drawn 1.3 times as big (HEALER_Z).
// (her sway, timed by the scene's slow LFO in the healer's hut: lfoTimed)
const HEALER_SWAY = `<animateTransform attributeName="transform" type="rotate" values="-2.5 0 0;2.5 0 0;-2.5 0 0" dur="4.6s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" repeatCount="indefinite"/>`;
const HEALER_SVG = (() => {
  const skin = "#e2a67c", hair = "#8a4a2a", dress = "#5f9e6e", apron = "#f6eedd", dk = darker(dress), sk = darker(skin);
  const flower = (x, y, petal) => [0, 72, 144, 216, 288].map(a => { const r = a * Math.PI / 180;
      return `<ellipse cx="${f1(x + 4.6 * Math.cos(r))}" cy="${f1(y + 4.6 * Math.sin(r))}" rx="4.6" ry="3.4" transform="rotate(${a} ${f1(x + 4.6 * Math.cos(r))} ${f1(y + 4.6 * Math.sin(r))})" fill="${petal}" stroke="${darker(petal)}" stroke-width="0.8"/>`; }).join("") +
    `<circle cx="${x}" cy="${y}" r="2.8" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>`;
  const leaf = (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="2.6" transform="rotate(${a} ${x} ${y})" fill="#4a9a52" stroke="#2f6e3a" stroke-width="0.8"/>`;
  const limb = (pts, w, c) => `<path d="M${pts.map(p => p.join(" ")).join(" L")}" fill="none" stroke="${darker(c)}" stroke-width="${w + 3}" stroke-linecap="round" stroke-linejoin="round"/>` +
                              `<path d="M${pts.map(p => p.join(" ")).join(" L")}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const body =
    // her long hair, behind her
    `<path d="M-34 -205 Q-48 -160 -45 -112 Q-32 -102 -20 -110 L20 -110 Q32 -102 45 -112 Q48 -160 34 -205 Q0 -234 -34 -205 Z" fill="${hair}" stroke="${darker(hair)}" stroke-width="2"/>` +
    // her shoes, her dress, her apron with its pocket and heart
    `<ellipse cx="-16" cy="-4" rx="13" ry="6" fill="#6b4226"/><ellipse cx="16" cy="-4" rx="13" ry="6" fill="#6b4226"/>` +
    `<path d="M-26 -150 Q-30 -120 -40 -80 Q-52 -40 -60 -12 Q-30 -4 0 -7 Q30 -4 60 -12 Q52 -40 40 -80 Q30 -120 26 -150 Q0 -158 -26 -150 Z" fill="${dress}" stroke="${dk}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M-22 -112 Q-27 -70 -35 -30 Q0 -23 35 -30 Q27 -70 22 -112 Q0 -116 -22 -112 Z" fill="${apron}" stroke="#d9cbb0" stroke-width="2"/>` +
    `<rect x="-28" y="-117" width="56" height="7" rx="3" fill="${apron}" stroke="#d9cbb0" stroke-width="1.5"/>` +
    `<rect x="-13" y="-74" width="26" height="20" rx="4" fill="none" stroke="#d9cbb0" stroke-width="2"/>` +
    `<path d="M0 -58 L-7 -65 A3.6 3.6 0 0 1 0 -69.5 A3.6 3.6 0 0 1 7 -65 Z" fill="#e53935"/>` +
    // her left arm (the picture's right), its hand on her apron
    limb([[24, -146], [38, -114]], 12, dress) + limb([[38, -114], [20, -97]], 9, skin) + `<circle cx="19" cy="-96" r="7" fill="${skin}" stroke="${sk}" stroke-width="1.5"/>` +
    // her neck and head, her face: kind eyes, rosy cheeks, a smile
    `<rect x="-7" y="-166" width="14" height="18" fill="${skin}"/>` +
    `<circle cx="0" cy="-188" r="30" fill="${skin}" stroke="${sk}" stroke-width="2"/>` +
    [-1, 1].map(e => `<ellipse cx="${e * 11}" cy="-191" rx="4" ry="5" fill="#2b1d14"/><circle cx="${e * 11 + 1.5}" cy="-193" r="1.5" fill="#ffffff"/>` +
      `<path d="M${e * 17} -202 Q${e * 11} -207 ${e * 5} -203" fill="none" stroke="${darker(hair)}" stroke-width="2.5" stroke-linecap="round"/>` +
      `<circle cx="${e * 18}" cy="-179" r="6" fill="#f28b8b" opacity="0.45"/>`).join("") +
    `<path d="M-2 -185 Q0 -182 2 -185" fill="none" stroke="${sk}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="M-12 -176 Q0 -162 12 -176 Q0 -169 -12 -176 Z" fill="#9b3b3b" stroke="#6b2b2b" stroke-width="1.5" stroke-linejoin="round"/>` +
    // her hair over her head: a side-swept fringe, locks down past her cheeks
    `<path d="M-31 -192 Q-35 -224 0 -223 Q35 -224 31 -192 Q26 -206 12 -209 Q2 -201 -8 -210 Q-24 -207 -31 -192 Z" fill="${hair}" stroke="${darker(hair)}" stroke-width="1.5"/>` +
    [-1, 1].map(e => `<path d="M${e * 30} -197 Q${e * 38} -162 ${e * 35} -128" fill="none" stroke="${hair}" stroke-width="9" stroke-linecap="round"/>`).join("") +
    // flowers in her hair, by her ears, with leaves
    leaf(-36, -172, 30) + leaf(-28, -170, -40) + flower(-31, -178, "#f472b6") +
    leaf(36, -174, -30) + leaf(28, -171, 40) + flower(31, -180, "#ffffff") + flower(36, -190, "#c4b5fd");
  // her right arm (the picture's left), stirring: the arm and the spoon
  // turn a little about her shoulder, back and forth
  const stir = `<g><animateTransform attributeName="transform" type="rotate" values="0 -24 -146;-6 -24 -146;0 -24 -146;5 -24 -146;0 -24 -146" dur="2.6s" repeatCount="indefinite"/>` +
    `<line x1="-56" y1="-120" x2="-110" y2="-48" stroke="#7a5228" stroke-width="7" stroke-linecap="round"/>` +
    `<line x1="-56" y1="-120" x2="-110" y2="-48" stroke="#c08a50" stroke-width="4" stroke-linecap="round"/>` +
    limb([[-24, -146], [-44, -118]], 12, dress) + limb([[-44, -118], [-64, -106]], 9, skin) +
    `<circle cx="-65" cy="-105" r="7.5" fill="${skin}" stroke="${sk}" stroke-width="1.5"/></g>`;
  // and the whole of her sways, slowly, about her feet
  return `<g>${HEALER_SWAY}${body}${stir}</g>`;
})();
const HEALER_Z = 1.3;
// Bottles of potions, neatly kept: each shelf one kind of bottle, their
// colors in rainbow order along it, each corked and labelled
const POTION_COLORS = ["#e53935", "#f57c00", "#fbc02d", "#7cb342", "#26a69a", "#1e88e5", "#5e35b1", "#d81b60"];
function potionSvg(kind, x, y, k, color) {
  const cork = `fill="#9a6b3f" stroke="#6e4a28" stroke-width="${f1(0.8 * k)}"`, glass = `fill="${color}" fill-opacity="0.85" stroke="${darker(color)}" stroke-width="${f1(1.2 * k)}"`;
  const shine = (x0, y0, h) => `<line x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x0)}" y2="${f1(y0 + h)}" stroke="#ffffff" stroke-opacity="0.55" stroke-width="${f1(2 * k)}" stroke-linecap="round"/>`;
  const label = (cy, w) => `<rect x="${f1(x - w / 2)}" y="${f1(cy - 4 * k)}" width="${f1(w)}" height="${f1(8 * k)}" rx="${f1(1.5 * k)}" fill="#f6eedd"/>` +
                           `<line x1="${f1(x - w / 3)}" y1="${f1(cy)}" x2="${f1(x + w / 3)}" y2="${f1(cy)}" stroke="#8a7a5a" stroke-width="${f1(0.9 * k)}"/>`;
  if (kind === "flask")   // a round flask with a long neck
    return `<rect x="${f1(x - 3 * k)}" y="${f1(y - 34 * k)}" width="${f1(6 * k)}" height="${f1(14 * k)}" ${glass}/><circle cx="${f1(x)}" cy="${f1(y - 11 * k)}" r="${f1(11 * k)}" ${glass}/>` +
           `<rect x="${f1(x - 3.5 * k)}" y="${f1(y - 39 * k)}" width="${f1(7 * k)}" height="${f1(6 * k)}" rx="${f1(1.5 * k)}" ${cork}/>` + shine(x - 5 * k, y - 17 * k, 7 * k);
  if (kind === "tall")    // a tall slim bottle
    return `<path d="M${f1(x - 6 * k)} ${f1(y)} V${f1(y - 30 * k)} Q${f1(x - 6 * k)} ${f1(y - 36 * k)} ${f1(x - 2.5 * k)} ${f1(y - 38 * k)} V${f1(y - 44 * k)} H${f1(x + 2.5 * k)} V${f1(y - 38 * k)} Q${f1(x + 6 * k)} ${f1(y - 36 * k)} ${f1(x + 6 * k)} ${f1(y - 30 * k)} V${f1(y)} Z" ${glass}/>` +
           `<rect x="${f1(x - 3 * k)}" y="${f1(y - 49 * k)}" width="${f1(6 * k)}" height="${f1(6 * k)}" rx="${f1(1.5 * k)}" ${cork}/>` + label(y - 16 * k, 10 * k) + shine(x - 3.5 * k, y - 30 * k, 10 * k);
  if (kind === "jar")     // a square jar, a wide cork, a label
    return `<rect x="${f1(x - 9 * k)}" y="${f1(y - 26 * k)}" width="${f1(18 * k)}" height="${f1(26 * k)}" rx="${f1(3 * k)}" ${glass}/>` +
           `<rect x="${f1(x - 7 * k)}" y="${f1(y - 31 * k)}" width="${f1(14 * k)}" height="${f1(6 * k)}" rx="${f1(1.5 * k)}" ${cork}/>` + label(y - 13 * k, 14 * k) + shine(x - 6 * k, y - 23 * k, 8 * k);
  // a small vial
  return `<rect x="${f1(x - 4 * k)}" y="${f1(y - 20 * k)}" width="${f1(8 * k)}" height="${f1(20 * k)}" rx="${f1(4 * k)}" ${glass}/>` +
         `<rect x="${f1(x - 3 * k)}" y="${f1(y - 24 * k)}" width="${f1(6 * k)}" height="${f1(5 * k)}" rx="${f1(1.2 * k)}" ${cork}/>` + shine(x - 1.5 * k, y - 17 * k, 6 * k);
}
// Inside the healer's hut: warm. Round cream walls under a thatched roof,
// herbs drying from the beam, a round window full of sun; a stone hearth
// with a fire, and on it a big pot of soup, steaming, that the healer
// stirs; shelves and shelves of potions, neatly kept, her cat up on the top
// one, its tail hanging down and slowly swinging; a worktable of tools,
// herbs and bowls; a little table with two chairs and tea, to sit and
// talk; a braided rug; and the door back out to the clearing. She can be
// dragged anywhere (her place is the scene's healerX, healerY), at her size.
// (ticket 50) the tea table's two chairs: each seat's top, 52 across at ty + 4
// (the chairs at the table's sides, 92 out, ty = g + 34, as healerroomScene
// draws them), each facing the table, its back on the far side
SEATS.healerroom = c => { const { W, g, k } = c, tx = W * 0.13, ty = g + 34 * k;
  return [[-1, "chair, left", "right"], [1, "chair, right", "left"]].map(([sd, name, way]) => { const x = tx + sd * 92 * k;
    return { name, x0: x - 26 * k, x1: x + 26 * k, y: ty + 4 * k, z: ty + 44 * k + 1, facing: [way] }; }); };
function healerroomScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, all, o } = c;
  const floor = g - 100 * k, hz = (o.healerSize ?? 100) / 100, potX = -W * 0.24, wallTop = y0 + H * 0.06;
  // the room: thatch above, cream walls, posts, a beam with herbs, the floor and its rug
  let s = SEP + part("hroom-shell", c.F, () => {
    let t = all("#ecd9b4");
    // the thatch: straw, its rafters running up to the roof's peak, high above
    t += `<rect x="${f1(x0 - pad)}" y="${f1(y0 - pad)}" width="${f1(W + 2 * pad)}" height="${f1(wallTop - y0 + pad)}" fill="#c9a35a"/>`;
    for (let i = -12; i <= 12; i++)
      t += `<line x1="${f1(i * W / 40)}" y1="${f1(y0 - H * 0.6)}" x2="${f1(i * W / 10)}" y2="${f1(wallTop)}" stroke="${i % 3 ? "#a8823a" : "#7a5a2a"}" stroke-width="${f1((i % 3 ? 1.5 : 5) * k)}"/>`;
    // the walls: daub, a little uneven, posts at intervals
    for (let i = 0; i < 26; i++)
      t += `<ellipse cx="${f1(x0 + W * R(i, 1101))}" cy="${f1(wallTop + (floor - wallTop) * R(i, 1102))}" rx="${f1((30 + 40 * R(i, 1103)) * k)}" ry="${f1((10 + 12 * R(i, 1104)) * k)}" fill="#e2cca2" opacity="0.5"/>`;
    for (const u of [-0.5, -0.36, 0.5, 0.36])
      t += `<rect x="${f1(W * u - 9 * k)}" y="${f1(wallTop)}" width="${f1(18 * k)}" height="${f1(floor - wallTop)}" fill="#8b5e34" stroke="#6e4a28" stroke-width="${f1(1.5 * k)}"/>`;
    t += `<rect x="${f1(x0 - pad)}" y="${f1(wallTop - 4 * k)}" width="${f1(W + 2 * pad)}" height="${f1(16 * k)}" fill="#6e4a28"/>`;
    // the floor: warm boards, and a round braided rug
    t += `<rect x="${f1(x0 - pad)}" y="${f1(floor)}" width="${f1(W + 2 * pad)}" height="${f1(y1 - floor + pad)}" fill="#a8743f"/>`;
    for (let i = -14; i <= 14; i++)
      t += `<line x1="${f1(i * W / 20)}" y1="${f1(floor)}" x2="${f1(i * W / 6)}" y2="${f1(y1 + pad)}" stroke="#8a5a2e" stroke-width="${f1(2 * k)}"/>`;
    t += [["#c0392b", 1], ["#e8a33a", 0.82], ["#f3d27a", 0.66], ["#7a9a3a", 0.5], ["#c0392b", 0.34], ["#f3d27a", 0.18]].map(([cc, u]) =>
      `<ellipse cx="${f1(W * 0.02)}" cy="${f1(g + 46 * k)}" rx="${f1(200 * k * u)}" ry="${f1(44 * k * u)}" fill="${cc}"/>`).join("");
    // the round window, high in the middle: sun, a green hill, flowers; its beam on the floor
    const wx = 0, wy = y0 + H * 0.17, wr = 46 * k;
    t += `<polygon points="${P(wx - 40 * k, wy + 20 * k)} ${P(wx + 40 * k, wy + 20 * k)} ${P(wx + 230 * k, g + 60 * k)} ${P(wx + 30 * k, g + 70 * k)}" fill="#fff3c4" opacity="0.2"/>` +
         `<defs><clipPath id="bg-hwin"><circle cx="${f1(wx)}" cy="${f1(wy)}" r="${f1(wr)}"/></clipPath></defs>` +
         `<g clip-path="url(#bg-hwin)"><rect x="${f1(wx - wr)}" y="${f1(wy - wr)}" width="${f1(2 * wr)}" height="${f1(2 * wr)}" fill="#bfe6ff"/>` +
         `<circle cx="${f1(wx + 20 * k)}" cy="${f1(wy - 22 * k)}" r="${f1(12 * k)}" fill="#ffd23f"/>` +
         `<ellipse cx="${f1(wx - 10 * k)}" cy="${f1(wy + 46 * k)}" rx="${f1(80 * k)}" ry="${f1(36 * k)}" fill="#7cc25a"/>` +
         [[-24, 18, "#f472b6"], [-6, 24, "#facc15"], [14, 16, "#ffffff"], [28, 26, "#c4b5fd"]].map(([dx, dy, cc]) => `<circle cx="${f1(wx + dx * k)}" cy="${f1(wy + dy * k)}" r="${f1(3 * k)}" fill="${cc}"/>`).join("") + `</g>` +
         `<circle cx="${f1(wx)}" cy="${f1(wy)}" r="${f1(wr)}" fill="none" stroke="#8b5e34" stroke-width="${f1(9 * k)}"/>` +
         `<path d="M${P(wx - wr, wy)} H${f1(wx + wr)} M${P(wx, wy - wr)} V${f1(wy + wr)}" stroke="#8b5e34" stroke-width="${f1(4 * k)}"/>`;
    // herbs drying in bundles from the beam (not across the window)
    for (let i = 0; i < 12; i++) {
      const hx = x0 + W * (0.04 + 0.08 * i) + 8 * k * R(i, 1105), by = wallTop + 12 * k;
      if (Math.abs(hx) < 70 * k) continue;
      const cc = ["#5f8a3a", "#a78bfa", "#7a9a3a", "#f2c12e", "#4a8a4a"][i % 5], len = (50 + 24 * R(i, 1106)) * k;
      t += `<line x1="${f1(hx)}" y1="${f1(by)}" x2="${f1(hx)}" y2="${f1(by + 18 * k)}" stroke="#c9b27a" stroke-width="${f1(1.5 * k)}"/>` +
           `<rect x="${f1(hx - 4 * k)}" y="${f1(by + 16 * k)}" width="${f1(8 * k)}" height="${f1(5 * k)}" fill="#c9b27a"/>` +
           [-10, -5, 0, 5, 10].map(dx => `<path d="M${P(hx, by + 20 * k)} Q${P(hx + dx * 0.6 * k, by + 20 * k + len * 0.5)} ${P(hx + dx * k, by + 20 * k + len)}" stroke="${cc}" stroke-width="${f1(3.5 * k)}" fill="none" stroke-linecap="round"/>`).join("") +
           (i % 2 ? [-8, 0, 8].map(dx => `<circle cx="${f1(hx + dx * k)}" cy="${f1(by + 20 * k + len)}" r="${f1(3 * k)}" fill="${cc === "#a78bfa" ? "#c4b5fd" : "#f7f2c4"}"/>`).join("") : "");
    }
    return t;
  });
  // the hearth: a stone fireplace in the wall, its mantel with candles and jars
  s += SEP + part("hroom-hearth", c.F, () => {
    const hw = 130 * k, top = floor - 190 * k;
    let t = `<rect x="${f1(potX - hw * 0.55)}" y="${f1(wallTop)}" width="${f1(hw * 1.1)}" height="${f1(top - wallTop)}" fill="#a39a8c"/>`;
    // (its stones, row on row all the way down to the mantel, each row half a stone along
    // from the last, kept on the breast)
    t += `<clipPath id="bg-hbreast"><rect x="${f1(potX - hw * 0.55)}" y="${f1(wallTop)}" width="${f1(hw * 1.1)}" height="${f1(top - wallTop)}"/></clipPath><g clip-path="url(#bg-hbreast)">`;
    for (let row = 0, sy = wallTop; sy < top; row++, sy += 22 * k)
      for (let col = -1; col < 5; col++) { const i = row * 5 + col + 5, sx = potX - hw * 0.55 + (col + (row % 2) * 0.5) * hw * 0.22;
        t += `<rect x="${f1(sx)}" y="${f1(sy)}" width="${f1(hw * 0.2)}" height="${f1(19 * k)}" rx="${f1(4 * k)}" fill="${["#b8afa0", "#a8a090", "#c2b9aa"][(i * 7) % 3]}"/>`; }
    t += `</g>`;
    t += `<path d="M${P(potX - hw, floor)} V${f1(top + 30 * k)} Q${P(potX - hw, top)} ${P(potX - hw + 30 * k, top)} H${f1(potX + hw - 30 * k)} Q${P(potX + hw, top)} ${P(potX + hw, top + 30 * k)} V${f1(floor)} Z" fill="#b8afa0" stroke="#8a8274" stroke-width="${f1(3 * k)}"/>` +
         `<path d="M${P(potX - hw * 0.68, floor)} V${f1(top + 80 * k)} A${f1(hw * 0.68)} ${f1(hw * 0.55)} 0 0 1 ${P(potX + hw * 0.68, top + 80 * k)} V${f1(floor)} Z" fill="#3a2418"/>` +
         `<ellipse cx="${f1(potX)}" cy="${f1(floor - 20 * k)}" rx="${f1(hw * 0.6)}" ry="${f1(50 * k)}" fill="#ff9a3c" opacity="0.35"/>` +
         `<rect x="${f1(potX - hw - 14 * k)}" y="${f1(top - 12 * k)}" width="${f1(2 * hw + 28 * k)}" height="${f1(14 * k)}" rx="${f1(3 * k)}" fill="#6e4a28"/>`;
    // on the mantel: two candles, three jars of herbs, a little heart
    for (const [dx, kind] of [[-0.85, "candle"], [-0.5, "jar"], [-0.2, "jar"], [0.15, "heart"], [0.45, "jar"], [0.82, "candle"]]) {
      const x = potX + dx * hw, b = top - 12 * k;
      t += kind === "candle"
        ? `<rect x="${f1(x - 5 * k)}" y="${f1(b - 30 * k)}" width="${f1(10 * k)}" height="${f1(30 * k)}" fill="#f6eedd"/><ellipse cx="${f1(x)}" cy="${f1(b - 37 * k)}" rx="${f1(3.5 * k)}" ry="${f1(7 * k)}" fill="#ffb53b"/><circle cx="${f1(x)}" cy="${f1(b - 34 * k)}" r="${f1(16 * k)}" fill="#ffcf6b" opacity="0.25"/>`
        : kind === "heart" ? `<path d="M${P(x, b - 4 * k)} L${P(x - 12 * k, b - 16 * k)} A${f1(6 * k)} ${f1(6 * k)} 0 0 1 ${P(x, b - 24 * k)} A${f1(6 * k)} ${f1(6 * k)} 0 0 1 ${P(x + 12 * k, b - 16 * k)} Z" fill="#e53935"/>`
        : `<rect x="${f1(x - 10 * k)}" y="${f1(b - 26 * k)}" width="${f1(20 * k)}" height="${f1(26 * k)}" rx="${f1(4 * k)}" fill="#cfe8d0" fill-opacity="0.7" stroke="#8aa88a" stroke-width="${f1(1.2 * k)}"/>` +
          `<path d="M${P(x - 6 * k, b - 4 * k)} Q${P(x, b - 20 * k)} ${P(x + 6 * k, b - 4 * k)}" fill="#5f8a3a"/><rect x="${f1(x - 8 * k)}" y="${f1(b - 31 * k)}" width="${f1(16 * k)}" height="${f1(6 * k)}" fill="#9a6b3f"/>`;
    }
    return t;
  });
  // the door back out to the clearing, in the middle: an arched brown door, as outside
  // (drawn before the objects, in the wall behind them all: it crosses none, the pot it
  // once came after included)
  s += SEP + part("hroom-door", c.F, () => {
    const w = 100 * k, top = floor - 200 * k;
    return `<g class="portal" data-to="clearing"><path d="M${P(-w / 2 - 10 * k, floor)} V${f1(top + w / 2)} A${f1(w / 2 + 10 * k)} ${f1(w / 2 + 10 * k)} 0 0 1 ${P(w / 2 + 10 * k, top + w / 2)} V${f1(floor)} Z" fill="#6e4a28"/>` +
           `<path d="M${P(-w / 2, floor)} V${f1(top + w / 2)} A${f1(w / 2)} ${f1(w / 2)} 0 0 1 ${P(w / 2, top + w / 2)} V${f1(floor)} Z" fill="#7a5a3a" stroke="#4a3220" stroke-width="${f1(3 * k)}"/>` +
           [-0.25, 0, 0.25].map(u => `<line x1="${f1(u * w)}" y1="${f1(top + (u ? 8 : 0) * k)}" x2="${f1(u * w)}" y2="${f1(floor)}" stroke="#5a3e26" stroke-width="${f1(2.5 * k)}"/>`).join("") +
           `<circle cx="${f1(w / 2 - 16 * k)}" cy="${f1(floor - 90 * k)}" r="${f1(5 * k)}" fill="#f2c230"/>` +
           `<path d="M${P(0, top + 56 * k)} L${P(-12 * k, top + 44 * k)} A${f1(6 * k)} ${f1(6 * k)} 0 0 1 ${P(0, top + 36 * k)} A${f1(6 * k)} ${f1(6 * k)} 0 0 1 ${P(12 * k, top + 44 * k)} Z" fill="#e53935"/>` +
           plankSign(0, top - 28 * k, k, "🌲 out") + `</g>`;
  });
  // the big pot of soup on its fire, in front of the hearth: flames, the
  // pot on three legs, golden soup with carrots and herbs in it, steam
  // (an object, with its fire and the stones round it, at g: where the healer stands
  // at first, beside it, stirring; its legs reach g + 4k, but she stirs it from in front
  // of its side, her spoon in the soup, so it stands no nearer than her feet)
  s += SEP + obj("soup pot", g, part("hroom-pot", [c.F, sceneLfoKey(o, "fast")], () => {
    const py = g - 62 * k, rx = 74 * k;
    let t = `<ellipse cx="${f1(potX)}" cy="${f1(g + 12 * k)}" rx="${f1(92 * k)}" ry="${f1(18 * k)}" fill="#6b625a"/>` +
            [...Array(10)].map((_, i) => { const a = i / 10 * 2 * Math.PI; return `<ellipse cx="${f1(potX + Math.cos(a) * 88 * k)}" cy="${f1(g + 12 * k + Math.sin(a) * 16 * k)}" rx="${f1(14 * k)}" ry="${f1(8 * k)}" fill="${i % 2 ? "#8a8274" : "#a39a8c"}"/>`; }).join("") +
            [-1, 1].map(e => `<line x1="${f1(potX - 50 * k)}" y1="${f1(g + 10 * k + e * 4 * k)}" x2="${f1(potX + 50 * k)}" y2="${f1(g + 10 * k - e * 4 * k)}" stroke="#5a3a1a" stroke-width="${f1(9 * k)}" stroke-linecap="round"/>`).join("");
    t += [[-34, 0], [-6, 6], [24, -4], [44, 3]].map(([fx, ph]) => { const x = potX + fx * k, b = g + 6 * k, h = (40 + ph) * k;
      return `<path d="M${f1(x - 14 * k)} ${f1(b)} Q${f1(x)} ${f1(b - h)} ${f1(x + 14 * k)} ${f1(b)} Z" fill="#ff8c1a">${lfoTimed(o, "fast", (fx + 34) / 80, `<animate attributeName="d" dur="${(0.6 + ph / 30).toFixed(2)}s" repeatCount="indefinite" ` +
        `values="M${f1(x - 14 * k)} ${f1(b)} Q${f1(x)} ${f1(b - h)} ${f1(x + 14 * k)} ${f1(b)} Z;M${f1(x - 14 * k)} ${f1(b)} Q${f1(x + 5 * k)} ${f1(b - h * 0.7)} ${f1(x + 14 * k)} ${f1(b)} Z;M${f1(x - 14 * k)} ${f1(b)} Q${f1(x)} ${f1(b - h)} ${f1(x + 14 * k)} ${f1(b)} Z"/>`)}</path>` +
        `<path d="M${f1(x - 7 * k)} ${f1(b)} Q${f1(x)} ${f1(b - h * 0.55)} ${f1(x + 7 * k)} ${f1(b)} Z" fill="#ffd23f"/>`; }).join("");
    // the pot
    t += [-0.7, 0, 0.7].map(u => `<line x1="${f1(potX + u * 50 * k)}" y1="${f1(g - 20 * k)}" x2="${f1(potX + u * 62 * k)}" y2="${f1(g + 4 * k)}" stroke="#2a2a30" stroke-width="${f1(7 * k)}" stroke-linecap="round"/>`).join("") +
         `<path d="M${P(potX - rx, py)} Q${P(potX - rx * 1.12, g - 30 * k)} ${P(potX - rx * 0.62, g - 14 * k)} Q${P(potX, g - 6 * k)} ${P(potX + rx * 0.62, g - 14 * k)} Q${P(potX + rx * 1.12, g - 30 * k)} ${P(potX + rx, py)} Z" fill="#2b2b30" stroke="#18181c" stroke-width="${f1(3 * k)}"/>` +
         `<path d="M${P(potX - rx * 0.8, g - 46 * k)} Q${P(potX - rx * 0.5, g - 22 * k)} ${P(potX - rx * 0.1, g - 18 * k)}" fill="none" stroke="#ff9a3c" stroke-opacity="0.35" stroke-width="${f1(5 * k)}" stroke-linecap="round"/>` +
         [-1, 1].map(e => `<path d="M${P(potX + e * rx * 0.95, py + 8 * k)} q${f1(e * 16 * k)} ${f1(-4 * k)} ${f1(e * 14 * k)} ${f1(14 * k)}" fill="none" stroke="#2b2b30" stroke-width="${f1(6 * k)}"/>`).join("") +
         `<ellipse cx="${f1(potX)}" cy="${f1(py)}" rx="${f1(rx + 4 * k)}" ry="${f1(19 * k)}" fill="#3a3a42" stroke="#18181c" stroke-width="${f1(3 * k)}"/>` +
         `<ellipse cx="${f1(potX)}" cy="${f1(py + 2 * k)}" rx="${f1(rx - 4 * k)}" ry="${f1(14 * k)}" fill="#f0a032"/>` +
         `<ellipse cx="${f1(potX - 10 * k)}" cy="${f1(py)}" rx="${f1(rx * 0.5)}" ry="${f1(6 * k)}" fill="#f7c062" opacity="0.7"/>` +
         [[-40, 4, "#e8762c"], [-14, -2, "#e8762c"], [22, 6, "#e8762c"], [44, 0, "#e8762c"], [-28, -6, "#4a9a52"], [6, 8, "#4a9a52"], [36, -6, "#4a9a52"], [0, -4, "#f6eedd"]].map(([dx, dy, cc]) =>
           `<ellipse cx="${f1(potX + dx * k)}" cy="${f1(py + 2 * k + dy * k)}" rx="${f1(5 * k)}" ry="${f1(2.6 * k)}" fill="${cc}"/>`).join("");
    // steam, rising and fading, in turn
    t += [-30, 6, 38].map((dx, i) => `<path d="M${f1(potX + dx * k)} ${f1(py - 6 * k)} q${f1(10 * k)} ${f1(-14 * k)} 0 ${f1(-28 * k)} q${f1(-10 * k)} ${f1(-14 * k)} 0 ${f1(-28 * k)}" fill="none" stroke="#ffffff" stroke-width="${f1(5 * k)}" stroke-linecap="round" opacity="0">` +
      `<animate attributeName="opacity" values="0;0.55;0" dur="3.2s" begin="${(i * 1.05).toFixed(2)}s" repeatCount="indefinite"/>` +
      `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${f1(-40 * k)}" dur="3.2s" begin="${(i * 1.05).toFixed(2)}s" repeatCount="indefinite"/></path>`).join("");
    return t;
  }));
  // the shelves of potions, floor to beam on the right, neatly kept; her
  // cat sits up on the top one, at its left end, its tail hanging down
  const cat = { catFur: o.healerCatFur ?? "#e8862a", catWhite: o.healerCatWhite ?? "#ffffff", catEyes: o.healerCatEyes ?? "#22c55e", catNose: "#f4a0b0" };
  // (the shelves and their potions an object, standing on the floor at the wall, at
  // floor; the cat on them another, at the floor under her, the same)
  s += SEP + part("hroom-shelves", [c.F, cat.catFur, cat.catWhite, cat.catEyes], () => {
    const sx0 = W * 0.13, sx1 = W * 0.47, top = wallTop + 70 * k, n = 5, gap = (floor - 20 * k - top) / (n - 0.3);
    let t = [sx0, sx1].map(x => `<rect x="${f1(x - 7 * k)}" y="${f1(top - 50 * k)}" width="${f1(14 * k)}" height="${f1(floor - top + 50 * k)}" fill="#8b5e34" stroke="#6e4a28" stroke-width="${f1(1.5 * k)}"/>`).join("");
    const kinds = ["flask", "tall", "jar", "vial", "jar"];
    for (let r = 0; r < n; r++) {
      const sy = top + r * gap;
      t += `<rect x="${f1(sx0 - 10 * k)}" y="${f1(sy)}" width="${f1(sx1 - sx0 + 20 * k)}" height="${f1(9 * k)}" fill="#a0703f" stroke="#6e4a28" stroke-width="${f1(1.5 * k)}"/>`;
      // (the top shelf keeps room at its left end for the cat)
      const from = sx0 + (r === 0 ? 70 : 20) * k, to = sx1 - 18 * k, kind = kinds[r], step = kind === "vial" ? 18 * k : kind === "tall" ? 22 * k : 28 * k;
      const m = Math.floor((to - from) / step) + 1;
      for (let i = 0; i < m; i++) t += potionSvg(kind, from + i * (to - from) / Math.max(1, m - 1), sy, k * (kind === "jar" && r === 4 ? 1.25 : 1), POTION_COLORS[Math.floor(i * POTION_COLORS.length / m)]);
    }
    return obj("potion shelves", floor, t) +
           obj("cat", floor, `<g transform="translate(${f1(sx0 + 32 * k)} ${f1(top)}) scale(${(1.15 * k).toFixed(3)})">${shoulderCat(4, cat, true)}</g>`);
  });
  // a little round table with two chairs and tea, to sit and talk
  s += SEP + part("hroom-tea", c.F, () => {
    const tx = W * 0.13, ty = g + 34 * k;
    const chair = (x, sd) => `<path d="M${P(x + sd * 22 * k, ty - 66 * k)} V${f1(ty + 40 * k)}" stroke="#7a4b28" stroke-width="${f1(6 * k)}" stroke-linecap="round"/>` +
      [0.2, 0.45].map(u => `<line x1="${f1(x + sd * 22 * k)}" y1="${f1(ty - 66 * k + u * 60 * k)}" x2="${f1(x + sd * 22 * k)}" y2="${f1(ty - 66 * k + u * 60 * k)}" stroke="#7a4b28"/>`).join("") +
      `<rect x="${f1(x - 26 * k)}" y="${f1(ty + 4 * k)}" width="${f1(52 * k)}" height="${f1(8 * k)}" rx="${f1(3 * k)}" fill="#a0703f" stroke="#6e4a28" stroke-width="${f1(1.5 * k)}"/>` +
      `<rect x="${f1(x + sd * 22 * k - (sd > 0 ? 6 : 0) * k)}" y="${f1(ty - 64 * k)}" width="${f1(6 * k)}" height="${f1(70 * k)}" fill="#8b5e34"/>` +
      [[-22, 1], [22, 1]].map(([dx]) => `<line x1="${f1(x + dx * k)}" y1="${f1(ty + 12 * k)}" x2="${f1(x + dx * k)}" y2="${f1(ty + 44 * k)}" stroke="#6e4a28" stroke-width="${f1(5 * k)}"/>`).join("") +
      `<rect x="${f1(x + sd * 22 * k - (sd > 0 ? 9 : -3) * k)}" y="${f1(ty - 70 * k)}" width="${f1(6 * k)}" height="${f1(4 * k)}" fill="#6e4a28"/>`;
    // (each chair an object, its legs down to ty + 44k; the table and its tea another, its
    // foot at ty + 42k)
    return obj("chair, left", ty + 44 * k, chair(tx - 92 * k, -1)) + obj("chair, right", ty + 44 * k, chair(tx + 92 * k, 1)) + obj("tea table", ty + 42 * k,
      `<rect x="${f1(tx - 5 * k)}" y="${f1(ty - 10 * k)}" width="${f1(10 * k)}" height="${f1(52 * k)}" fill="#6e4a28"/><ellipse cx="${f1(tx)}" cy="${f1(ty + 42 * k)}" rx="${f1(24 * k)}" ry="${f1(6 * k)}" fill="#6e4a28"/>` +
      `<ellipse cx="${f1(tx)}" cy="${f1(ty - 10 * k)}" rx="${f1(62 * k)}" ry="${f1(14 * k)}" fill="#a0703f" stroke="#6e4a28" stroke-width="${f1(2 * k)}"/>` +
      // a teapot, two cups on saucers, a little vase of flowers
      `<ellipse cx="${f1(tx - 6 * k)}" cy="${f1(ty - 26 * k)}" rx="${f1(16 * k)}" ry="${f1(13 * k)}" fill="#5f9e6e" stroke="#3f7a4e" stroke-width="${f1(1.5 * k)}"/>` +
      `<path d="M${P(tx + 9 * k, ty - 28 * k)} q${f1(12 * k)} ${f1(-2 * k)} ${f1(16 * k)} ${f1(-12 * k)}" fill="none" stroke="#5f9e6e" stroke-width="${f1(4 * k)}" stroke-linecap="round"/>` +
      `<path d="M${P(tx - 21 * k, ty - 32 * k)} q${f1(-9 * k)} ${f1(4 * k)} 0 ${f1(12 * k)}" fill="none" stroke="#5f9e6e" stroke-width="${f1(3 * k)}"/><circle cx="${f1(tx - 6 * k)}" cy="${f1(ty - 40 * k)}" r="${f1(3 * k)}" fill="#3f7a4e"/>` +
      [-40, 34].map(dx => `<ellipse cx="${f1(tx + dx * k)}" cy="${f1(ty - 14 * k)}" rx="${f1(10 * k)}" ry="${f1(3 * k)}" fill="#f6eedd" stroke="#d9cbb0" stroke-width="${f1(k)}"/>` +
        `<path d="M${P(tx + dx * k - 6 * k, ty - 24 * k)} V${f1(ty - 16 * k)} Q${P(tx + dx * k, ty - 13 * k)} ${P(tx + dx * k + 6 * k, ty - 16 * k)} V${f1(ty - 24 * k)} Z" fill="#ffffff" stroke="#d9cbb0" stroke-width="${f1(k)}"/>` +
        `<ellipse cx="${f1(tx + dx * k)}" cy="${f1(ty - 24 * k)}" rx="${f1(6 * k)}" ry="${f1(2 * k)}" fill="#b5834a"/>`).join("") +
      `<rect x="${f1(tx + 14 * k)}" y="${f1(ty - 30 * k)}" width="${f1(8 * k)}" height="${f1(16 * k)}" rx="${f1(3 * k)}" fill="#9ccfe0" stroke="#6aa8c0" stroke-width="${f1(k)}"/>` +
      [[-4, -42, "#f472b6"], [3, -46, "#facc15"], [8, -40, "#ffffff"]].map(([dx, dy, cc]) => `<line x1="${f1(tx + 18 * k)}" y1="${f1(ty - 30 * k)}" x2="${f1(tx + 18 * k + dx * k)}" y2="${f1(ty + dy * k + 2 * k)}" stroke="#4a9a52" stroke-width="${f1(1.5 * k)}"/><circle cx="${f1(tx + 18 * k + dx * k)}" cy="${f1(ty + dy * k)}" r="${f1(4 * k)}" fill="${cc}"/>`).join(""));
  });
  // her worktable at the front on the right: a mortar and pestle, bowls of
  // powders, bundles of herbs, scissors, a knife, a little brass balance
  s += SEP + part("hroom-work", c.F, () => {
    const tx = W * 0.37, ty = g + 20 * k, tw = 190 * k;
    let t = [-0.42, 0.42].map(u => `<rect x="${f1(tx + u * tw - 6 * k)}" y="${f1(ty)}" width="${f1(12 * k)}" height="${f1(64 * k)}" fill="#6e4a28"/>`).join("") +
            `<rect x="${f1(tx - tw / 2)}" y="${f1(ty - 12 * k)}" width="${f1(tw)}" height="${f1(14 * k)}" rx="${f1(3 * k)}" fill="#a0703f" stroke="#6e4a28" stroke-width="${f1(2 * k)}"/>`;
    const at = u => tx + u * tw / 2, b = ty - 12 * k;
    // the mortar and pestle
    t += `<path d="M${P(at(-0.8) - 18 * k, b - 22 * k)} Q${P(at(-0.8), b + 4 * k)} ${P(at(-0.8) + 18 * k, b - 22 * k)} Z" fill="#9a9488" stroke="#6b665c" stroke-width="${f1(1.5 * k)}"/>` +
         `<ellipse cx="${f1(at(-0.8))}" cy="${f1(b - 22 * k)}" rx="${f1(18 * k)}" ry="${f1(5 * k)}" fill="#7a756a"/>` +
         `<line x1="${f1(at(-0.8) + 4 * k)}" y1="${f1(b - 22 * k)}" x2="${f1(at(-0.8) + 16 * k)}" y2="${f1(b - 46 * k)}" stroke="#b0aa9c" stroke-width="${f1(6 * k)}" stroke-linecap="round"/>`;
    // bowls of powders and petals
    t += [[-0.45, "#f2c12e"], [-0.18, "#c0392b"], [0.12, "#7cb342"]].map(([u, cc]) =>
      `<path d="M${P(at(u) - 16 * k, b - 12 * k)} Q${P(at(u), b + 2 * k)} ${P(at(u) + 16 * k, b - 12 * k)} Z" fill="#f6eedd" stroke="#c9b48a" stroke-width="${f1(1.2 * k)}"/>` +
      `<ellipse cx="${f1(at(u))}" cy="${f1(b - 12 * k)}" rx="${f1(14 * k)}" ry="${f1(4 * k)}" fill="${cc}"/>`).join("");
    // herb bundles lying on it
    t += [[0.36, "#5f8a3a"], [0.52, "#a78bfa"]].map(([u, cc]) => [-6, -2, 2, 6].map(d =>
      `<line x1="${f1(at(u) - 22 * k)}" y1="${f1(b - 4 * k + d * 0.3 * k)}" x2="${f1(at(u) + 18 * k)}" y2="${f1(b - 6 * k + d * k)}" stroke="${cc}" stroke-width="${f1(3 * k)}" stroke-linecap="round"/>`).join("") +
      `<rect x="${f1(at(u) - 16 * k)}" y="${f1(b - 8 * k)}" width="${f1(5 * k)}" height="${f1(7 * k)}" fill="#c9b27a"/>`).join("");
    // scissors and a knife
    t += [-1, 1].map(e => `<circle cx="${f1(at(0.74) - 8 * k)}" cy="${f1(b - 4 * k + e * 4 * k)}" r="${f1(4 * k)}" fill="none" stroke="#c0392b" stroke-width="${f1(2 * k)}"/>`).join("") +
         `<path d="M${P(at(0.74) - 4 * k, b - 6 * k)} L${P(at(0.74) + 16 * k, b - 3 * k)} M${P(at(0.74) - 4 * k, b - 2 * k)} L${P(at(0.74) + 16 * k, b - 5 * k)}" stroke="#9aa0aa" stroke-width="${f1(2 * k)}"/>` +
         `<line x1="${f1(at(0.9) - 14 * k)}" y1="${f1(b - 3 * k)}" x2="${f1(at(0.9) - 2 * k)}" y2="${f1(b - 3 * k)}" stroke="#6e4a28" stroke-width="${f1(4 * k)}" stroke-linecap="round"/>` +
         `<path d="M${P(at(0.9) - 2 * k, b - 5 * k)} L${P(at(0.9) + 18 * k, b - 3 * k)} L${P(at(0.9) - 2 * k, b - 1 * k)} Z" fill="#c9ced6"/>`;
    // a little brass balance, high at the back
    const bx = at(-0.02), bb = b - 2 * k;
    t += `<line x1="${f1(bx)}" y1="${f1(bb)}" x2="${f1(bx)}" y2="${f1(bb - 44 * k)}" stroke="#c99a2e" stroke-width="${f1(3 * k)}"/>` +
         `<line x1="${f1(bx - 26 * k)}" y1="${f1(bb - 44 * k)}" x2="${f1(bx + 26 * k)}" y2="${f1(bb - 44 * k)}" stroke="#c99a2e" stroke-width="${f1(3 * k)}"/>` +
         [-1, 1].map(e => `<line x1="${f1(bx + e * 26 * k)}" y1="${f1(bb - 44 * k)}" x2="${f1(bx + e * 26 * k)}" y2="${f1(bb - 26 * k)}" stroke="#c99a2e" stroke-width="${f1(1 * k)}"/>` +
           `<path d="M${P(bx + e * 26 * k - 10 * k, bb - 26 * k)} Q${P(bx + e * 26 * k, bb - 18 * k)} ${P(bx + e * 26 * k + 10 * k, bb - 26 * k)} Z" fill="#e0b84a" stroke="#a87a1e" stroke-width="${f1(k)}"/>`).join("") +
         `<ellipse cx="${f1(bx)}" cy="${f1(bb)}" rx="${f1(10 * k)}" ry="${f1(3 * k)}" fill="#c99a2e"/>`;
    // (the worktable and all on it an object, its legs down to ty + 64k)
    return obj("worktable", ty + 64 * k, t);
  });
  // the healer: dragged anywhere (her place), her size her group's; at
  // first by the pot, her spoon in it
  // (data-x, data-y: where she is, for a drag to start from before she has a place of her own)
  // (her spoon's end, (-110, -48) in her units, at the soup's middle, g - 62k)
  // (her feet on the ground: at her usual size, the spoon's end is in the soup)
  // (an object at her feet, g + hy)
  const hx = o.healerX ?? potX + 110 * HEALER_Z * hz * k, hy = o.healerY ?? 0;
  s += obj("healer", g + hy, OPEN(`<g data-drag="healer" data-x="${f1(hx)}" data-y="${f1(hy)}" style="cursor: grab" ${tf(hx, g + hy, HEALER_Z * hz * k)}>`) + part("hroom-healer", [sceneLfoKey(o, "slow")], () => HEALER_SVG.replace(HEALER_SWAY, lfoTimed(o, "slow", 0.1, HEALER_SWAY))) + CLOSE);
  // warm: the fire's glow over the room, a little darker toward the corners
  // (over everything, the friend too: in front, at Infinity; the whole room's, so not the pot's)
  s += SEP + obj("warm light", Infinity, part("hroom-warm", c.F, () => `<defs><radialGradient id="bg-hwarm" gradientUnits="userSpaceOnUse" cx="${f1(potX)}" cy="${f1(g - 40 * k)}" r="${f1(0.8 * Math.hypot(W, H))}">` +
    `<stop offset="0" stop-color="#ffb347" stop-opacity="0.2"/><stop offset="0.4" stop-color="#ffb347" stop-opacity="0.05"/><stop offset="1" stop-color="#5a2a0a" stop-opacity="0.3"/></radialGradient></defs>` +
    all("url(#bg-hwarm)").replace("<rect ", `<rect pointer-events="none" `)));
  return s;
}
// The fairy forest: a glade in the woods at the time of day its chips say,
// a ring of toadstools in the grass, and a great old tree with a fairy
// house in it: a round door between its roots, lit windows, shelf-fungus
// steps up to a little balcony, lanterns, a chimney. The house shows as
// much as its slider says, and can fade in and out with one of the three
// LFOs, in time with the music. Fireflies at sunset and at night, the
// night's stars as the camp site's settings say; a sign back to the
// clearing.
const FAIRY_TIMES = [["day", "☀️ day"], ["sunrise", "🌅 sunrise"], ["sunset", "🌇 sunset"], ["night", "🌙 night"]];
const FAIRY_SKY = { day: ["#7cc4f0", "#e6f6ff"], sunrise: ["#f0a0c4", "#ffe6b0"], sunset: ["#5a3a8a", "#ff9a5a"], night: ["#0b1030", "#283066"] };
// the light's tint over the greens and the bark, and how much of it
const FAIRY_TINT = { day: ["#ffffff", 0], sunrise: ["#f4a6c4", 0.18], sunset: ["#5a2a4a", 0.3], night: ["#0b1030", 0.62] };
// the fairy house's see-through-ness, and its fade with an LFO: an
// animation of its opacity begun so the wave is where the music's is (its
// start rounded, so the scene's text stays the same from draw to draw)
function fairyHouseFade(o) {
  void o["lfo:" + o.fairyHouseLfo];   // (so a change to its LFO draws the scene again: sceneOpts)
  const a = Math.max(0, Math.min(1, (o.fairyHouseSeen ?? 100) / 100)), lf = lfoNow(o.fairyHouseLfo);
  if (!lf) return { a, key: "", anim: "" };
  // (too fast to show: its average, the wave's being 0 for every shape)
  if (lf.dur < LFO_BLUR) return { a: a * (1 - lf.amp / 2), key: "blur", anim: "" };
  const begin = lfoBegin(lf, 0).toFixed(4), N = 16, vals = [], kt = [];
  for (let i = 0; i <= N; i++) { const u = i / N; vals.push((a * (1 - lf.amp * (1 - lfoWave(lf.shape, u)) / 2)).toFixed(3)); kt.push(u.toFixed(4)); }
  return { a, key: [lf.dur.toFixed(4), lf.shape, lf.amp.toFixed(2), begin].join(),
           anim: `<animate attributeName="opacity" values="${vals.join(";")}" keyTimes="${kt.join(";")}" dur="${lf.dur.toFixed(4)}s" begin="${begin}s" repeatCount="indefinite"/>` };
}
// a toadstool: a cream stem, a red cap with white spots, (x, y) its foot
const toadstool = (x, y, s, cap = "#d62828", glow = false) =>
  (glow ? `<ellipse cx="${f1(x)}" cy="${f1(y - 22 * s)}" rx="${f1(30 * s)}" ry="${f1(22 * s)}" fill="#fff3a8" opacity="0.22"/>` : "") +
  `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(11 * s)}" ry="${f1(3 * s)}" fill="#000000" opacity="0.2"/>` +
  `<path d="M${f1(x - 6 * s)} ${f1(y)} Q${f1(x - 7 * s)} ${f1(y - 12 * s)} ${f1(x - 4 * s)} ${f1(y - 20 * s)} L${f1(x + 4 * s)} ${f1(y - 20 * s)} Q${f1(x + 7 * s)} ${f1(y - 12 * s)} ${f1(x + 6 * s)} ${f1(y)} Z" fill="#f6eedd" stroke="#c9b48a" stroke-width="${f1(1.2 * s)}"/>` +
  `<path d="M${f1(x - 20 * s)} ${f1(y - 18 * s)} Q${f1(x - 20 * s)} ${f1(y - 40 * s)} ${f1(x)} ${f1(y - 41 * s)} Q${f1(x + 20 * s)} ${f1(y - 40 * s)} ${f1(x + 20 * s)} ${f1(y - 18 * s)} Q${f1(x)} ${f1(y - 13 * s)} ${f1(x - 20 * s)} ${f1(y - 18 * s)} Z" fill="${cap}" stroke="${darker(cap)}" stroke-width="${f1(1.5 * s)}"/>` +
  [[-11, -26, 3], [-2, -34, 3.4], [9, -27, 2.8], [13, -21, 2], [-15, -21, 2]].map(([dx, dy, r]) => `<circle cx="${f1(x + dx * s)}" cy="${f1(y + dy * s)}" r="${f1(r * s)}" fill="#ffffff"/>`).join("");
// (ticket 50) the three biggest toadstools in the ring: the top of each
// one's cap (41 of its units up at the crown; within 12 each side of it the
// dome is still nearly as high), placed and sized as fairyforestScene's
// "fairy-ring" places them, and named as it names them
SEATS.fairyforest = (c, B) => { const { W, g, k } = c, n = Math.max(4, Math.min(30, Math.round(B.mushrooms ?? 14)));
  const rx0 = W * 0.06, ry0 = g + 40 * k, rrx = 190 * k, rry = 44 * k;
  return [...Array(n)].map((_, i) => { const a = (i + 0.3 * sceneR(i, 1330)) / n * 2 * Math.PI, x = rx0 + Math.cos(a) * rrx, y = ry0 + Math.sin(a) * rry;
      return { i, x, y, s: k * (0.75 + 0.5 * (y - (ry0 - rry)) / (2 * rry)) * (0.85 + 0.3 * sceneR(i, 1331)) }; })
    .sort((p, q) => q.s - p.s).slice(0, 3)
    .map(({ i, x, y, s }) => ({ name: `toadstool ${i + 1}`, x0: x - 12 * s, x1: x + 12 * s, y: y - 41 * s, z: y + 1, facing: ["front", "left", "right"] })); };
function fairyforestScene(c) {
  const { x0, y0, x1, y1, g, W, H, k, pad, R, P, grad, all, land, o } = c;
  const time = FAIRY_SKY[o.fairyTime] ? o.fairyTime : "day", night = time === "night", dusk = time === "sunset" || night;
  const [tint, ta] = FAIRY_TINT[time], tn = col => ta ? mix(col, tint, ta) : col;
  const starKeys = night ? [o.starShape, o.starSize, o.starBright, o.starTwinkle] : [];
  // the sky: its sun low or high, or the moon and stars
  let s = SEP + part("fairy-sky", [c.F, time, ...starKeys, sceneLfoKey(o, "fast")], () => {
    const [a, b] = FAIRY_SKY[time];
    let t = `<defs>${grad("bg-sky", a, b, y0, g - 150 * k)}</defs>` + all("url(#bg-sky)");
    if (time === "day") t += sunSvg(x1 - W * 0.14, y0 + H * 0.12, 30 * k, true, o);
    if (time === "sunrise") t += `<circle cx="${f1(x0 + W * 0.2)}" cy="${f1(g - 170 * k)}" r="${f1(44 * k)}" fill="#ffd27a" opacity="0.95"/>`;
    if (time === "sunset") t += `<circle cx="${f1(x1 - W * 0.22)}" cy="${f1(g - 165 * k)}" r="${f1(48 * k)}" fill="#ff8c42" opacity="0.95"/>`;
    if (night) t += starsSvg(o, 70, x0, x1, y0, g - 170 * k, k, R, 1300) +
      `<circle cx="${f1(x1 - W * 0.18)}" cy="${f1(y0 + H * 0.14)}" r="${f1(28 * k)}" fill="#f4eebc"/><circle cx="${f1(x1 - W * 0.18 + 12 * k)}" cy="${f1(y0 + H * 0.14 - 8 * k)}" r="${f1(24 * k)}" fill="${FAIRY_SKY.night[0]}"/>`;
    return t;
  });
  if (!night) s += SEP + cloudsSvg(c, 3, 0.7, 150);
  // the woods round the glade: rows of pines and leafy trees, paler far off
  s += SEP + part("fairy-woods", [c.F, time], () => {
    let t = `<defs>${pineDef("bg-fpine", 7)}${leafyTreeDef("bg-foak", 23, { greens: ["#285e2a", "#2f7d32", "#3a8a3c", "#47a047", "#58b050"].map(tn), bark: tn("#6b4a2b") })}</defs>` +
            land(g - 160 * k, 8, tn("#a9d48e"), 0.4);
    // (each row an object, standing at its trees' middle depth, base + 6k)
    for (const [row, base, cols] of [[0, g - 150 * k, ["#4f8f5a", "#5c9c63"]], [1, g - 110 * k, ["#2f6b3a", "#3c7d45"]]]) {
      let r = "";
      for (let i = 0, x = x0 - 50 * k; x < x1 + 50 * k; i++, x += (row ? 52 : 36) * k) {
        const h = (row ? 150 : 100) * k * (0.8 + 0.4 * R(i, 1310 + row)), b = base + 12 * k * R(i, 1312 + row);
        r += R(i, 1314 + row) < 0.6 ? use("bg-fpine", x, b, h / 200, h / 200, ` color="${tn(cols[i % 2])}"`)
                                    : use("bg-foak", x, b, (h / 330) * (R(i, 1316) < 0.5 ? -1 : 1), h / 330);
      }
      t += obj(row ? "trees, near row" : "trees, far row", base + 6 * k, r);
    }
    return t + land(g - 70 * k, 6, tn("#8bc56a"), 1.1) + land(g - 20 * k, 3, tn("#7cc25a"), 0.6);
  });
  // the great old tree, on the left: its crown, then a thick trunk with roots
  const tx = -W * 0.3, tb = g + 20 * k;
  // two branches reaching out from its trunk, a lantern hanging from each (in
  // the house's part, below): each a curve from inside the trunk out to its
  // leafy end, and where on it the lantern's string is tied
  const fairyBranches = [[[-40, -300], [-110, -322], [-168, -392], -120], [[40, -268], [100, -284], [168, -352], 118]].map(([a, q, b, lx]) => {
    const A = [tx + a[0] * k, tb + a[1] * k], Q = [tx + q[0] * k, tb + q[1] * k], B = [tx + b[0] * k, tb + b[1] * k];
    const pt = u => [0, 1].map(d => (1 - u) * (1 - u) * A[d] + 2 * u * (1 - u) * Q[d] + u * u * B[d]);
    let u = 0.5; for (let it = 0; it < 30; it++) { const x = pt(u)[0]; u += (tx + lx * k - x) / (B[0] - A[0]) * 0.8; u = Math.max(0, Math.min(1, u)); }
    return { A, Q, B, pt, tie: pt(u), u };
  });
  // (an object, standing at its trunk's foot, tb)
  s += SEP + obj("great tree", tb, part("fairy-tree", [c.F, time], () => {
    const bark = tn("#6b4a2b"), dk = mix(bark, "#000000", 0.35);
    let t = `<defs>${leafyTreeDef("bg-fbig", 41, { wide: 1.5, greens: ["#285e2a", "#2f7d32", "#3a8a3c", "#47a047", "#58b050"].map(tn), bark })}</defs>` +
            use("bg-fbig", tx, tb - 120 * k, 2.2 * k);
    // (its two branches, out of the trunk: thick near it, thinner out to a tuft of leaves)
    for (const { A, Q, B, pt } of fairyBranches) {
      const M = pt(0.5), Q2 = [(Q[0] + B[0]) / 2, (Q[1] + B[1]) / 2], Q1 = [(A[0] + Q[0]) / 2, (A[1] + Q[1]) / 2];
      t += `<path d="M${P(...A)} Q${P(...Q1)} ${P(...M)}" fill="none" stroke="${bark}" stroke-width="${f1(22 * k)}" stroke-linecap="round"/>` +
           `<path d="M${P(...M)} Q${P(...Q2)} ${P(...B)}" fill="none" stroke="${bark}" stroke-width="${f1(12 * k)}" stroke-linecap="round"/>` +
           `<path d="M${P(...A)} Q${P(...Q1)} ${P(...M)} Q${P(...Q2)} ${P(...B)}" fill="none" stroke="${dk}" stroke-width="${f1(1.6 * k)}" opacity="0.6" transform="translate(0 ${f1(4 * k)})"/>` +
           [[0, 0, 26, 15], [-14, -12, 20, 12], [14, -10, 20, 12], [6, 10, 18, 11], [-10, 8, 17, 10]].map(([dx, dy, rx, ry], j) =>
             `<ellipse cx="${f1(B[0] + dx * k)}" cy="${f1(B[1] + dy * k)}" rx="${f1(rx * k)}" ry="${f1(ry * k)}" fill="${tn(["#2f7d32", "#3a8a3c", "#47a047", "#285e2a", "#58b050"][j])}"/>`).join("");
    }
    // the trunk: wide, flaring into roots, bark lines up it
    t += `<path d="M${P(tx - 120 * k, tb)} Q${P(tx - 70 * k, tb - 30 * k)} ${P(tx - 62 * k, tb - 110 * k)} L${P(tx - 46 * k, tb - 380 * k)} L${P(tx + 46 * k, tb - 380 * k)} L${P(tx + 62 * k, tb - 110 * k)} Q${P(tx + 70 * k, tb - 30 * k)} ${P(tx + 120 * k, tb)} Z" fill="${bark}" stroke="${dk}" stroke-width="${f1(3 * k)}"/>` +
         [[-150, -40], [-90, -55], [100, -50], [160, -38]].map(([dx, h]) => `<path d="M${P(tx + dx * 0.4 * k, tb - 40 * k)} Q${P(tx + dx * 0.8 * k, tb + h * 0.2 * k)} ${P(tx + dx * k, tb + 6 * k)}" fill="none" stroke="${bark}" stroke-width="${f1(18 * k)}" stroke-linecap="round"/>`).join("") +
         [...Array(9)].map((_, i) => { const x = tx + (-40 + 10 * i) * k; return `<path d="M${P(x, tb - 20 * k)} Q${P(x + (R(i, 1320) - 0.5) * 16 * k, tb - 200 * k)} ${P(x * 0.98 + tx * 0.02, tb - 370 * k)}" fill="none" stroke="${dk}" stroke-width="${f1(1.8 * k)}" opacity="0.6"/>`; }).join("");
    return t;
  }));
  // the fairy house in it (its own see-through, and its LFO)
  // (an object with its lanterns, at the tree's foot, tb, as the tree is: drawn just after
  // it, in its trunk; when it is all faded away, it is not there)
  const fade = fairyHouseFade(o);
  const house = part("fairy-house", [c.F, time, fade.a, fade.key, sceneLfoKey(o, "slow")], () => {
    if (fade.a <= 0 && !fade.anim) return "";
    const warm = dusk ? "#ffd27a" : "#ffe9a8", lit = dusk ? 0.9 : 0.6;
    let t = `<g opacity="${fade.a.toFixed(2)}">${fade.anim}`;
    // the round door between the roots, its step a little toadstool
    const dy = tb - 6 * k, dw = 58 * k, dh = 92 * k;
    t += `<path d="M${P(tx - dw / 2, dy)} V${f1(dy - dh + dw / 2)} A${f1(dw / 2)} ${f1(dw / 2)} 0 0 1 ${P(tx + dw / 2, dy - dh + dw / 2)} V${f1(dy)} Z" fill="#3a8a4a" stroke="#22562c" stroke-width="${f1(3 * k)}"/>` +
         [-0.18, 0.18].map(u => `<line x1="${f1(tx + u * dw)}" y1="${f1(dy - dh + 10 * k)}" x2="${f1(tx + u * dw)}" y2="${f1(dy)}" stroke="#22562c" stroke-width="${f1(2 * k)}"/>`).join("") +
         `<circle cx="${f1(tx + dw * 0.32)}" cy="${f1(dy - dh * 0.42)}" r="${f1(4 * k)}" fill="#f2c230"/>` +
         `<circle cx="${f1(tx)}" cy="${f1(dy - dh + 24 * k)}" r="${f1(9 * k)}" fill="${warm}" opacity="${lit}" stroke="#22562c" stroke-width="${f1(2 * k)}"/>` +
         toadstool(tx + dw * 0.75, tb + 8 * k, 0.8 * k, "#d62828", night);
    // round windows up the trunk, lit, flower boxes under them
    for (const [wx, wy, wr] of [[tx - 22 * k, tb - 180 * k, 18 * k], [tx + 20 * k, tb - 270 * k, 15 * k]]) {
      t += `<circle cx="${f1(wx)}" cy="${f1(wy)}" r="${f1(wr + 5 * k)}" fill="#4a3220"/>` +
           `<circle cx="${f1(wx)}" cy="${f1(wy)}" r="${f1(wr)}" fill="${warm}" opacity="${lit}"/>` +
           `<path d="M${P(wx - wr, wy)} H${f1(wx + wr)} M${P(wx, wy - wr)} V${f1(wy + wr)}" stroke="#4a3220" stroke-width="${f1(2.5 * k)}"/>` +
           (dusk ? `<circle cx="${f1(wx)}" cy="${f1(wy)}" r="${f1(wr * 2.4)}" fill="#ffd27a" opacity="0.18"/>` : "") +
           `<rect x="${f1(wx - wr - 4 * k)}" y="${f1(wy + wr + 3 * k)}" width="${f1(2 * wr + 8 * k)}" height="${f1(8 * k)}" rx="${f1(2 * k)}" fill="#8b5e34"/>` +
           [-0.6, -0.2, 0.2, 0.6].map((u, j) => `<circle cx="${f1(wx + u * wr)}" cy="${f1(wy + wr + 2 * k)}" r="${f1(3.5 * k)}" fill="${["#f472b6", "#facc15", "#ffffff", "#c4b5fd"][j]}"/>`).join("");
    }
    // shelf-fungus steps winding up the trunk to a little balcony
    for (const [sx, sy, sd] of [[-52, -60, -1], [52, -110, 1], [-54, -160, -1], [54, -215, 1], [-50, -268, -1], [50, -320, 1]])
      t += `<path d="M${P(tx + sx * k, tb + sy * k)} Q${P(tx + (sx + sd * 26) * k, tb + (sy - 8) * k)} ${P(tx + (sx + sd * 34) * k, tb + (sy + 3) * k)} Q${P(tx + (sx + sd * 16) * k, tb + (sy + 8) * k)} ${P(tx + sx * k, tb + (sy + 5) * k)} Z" fill="#e8c88a" stroke="#a8823a" stroke-width="${f1(1.5 * k)}"/>`;
    const by = tb - 360 * k;
    t += `<rect x="${f1(tx - 70 * k)}" y="${f1(by)}" width="${f1(140 * k)}" height="${f1(9 * k)}" rx="${f1(3 * k)}" fill="#8b5e34"/>` +
         [...Array(9)].map((_, i) => `<line x1="${f1(tx - 66 * k + i * 16.5 * k)}" y1="${f1(by)}" x2="${f1(tx - 66 * k + i * 16.5 * k)}" y2="${f1(by - 24 * k)}" stroke="#8b5e34" stroke-width="${f1(3 * k)}"/>`).join("") +
         `<line x1="${f1(tx - 70 * k)}" y1="${f1(by - 24 * k)}" x2="${f1(tx + 70 * k)}" y2="${f1(by - 24 * k)}" stroke="#8b5e34" stroke-width="${f1(4 * k)}"/>`;
    // lanterns hanging from the branches either side, glowing at dusk: each
    // string tied round its branch (its underside, the branch's half-width below its middle)
    for (const { tie } of fairyBranches) {
      const lx = tie[0], top = tie[1] + 5 * k, ly = top + 34 * k;
      t += swaying(o, `<line x1="${f1(lx)}" y1="${f1(top)}" x2="${f1(lx)}" y2="${f1(ly)}" stroke="#4a3220" stroke-width="${f1(1.5 * k)}"/>` +
           `<ellipse cx="${f1(lx)}" cy="${f1(top)}" rx="${f1(3 * k)}" ry="${f1(1.6 * k)}" fill="none" stroke="#4a3220" stroke-width="${f1(1.2 * k)}"/>` +
           (dusk ? `<circle cx="${f1(lx)}" cy="${f1(ly + 12 * k)}" r="${f1(30 * k)}" fill="#ffd27a" opacity="0.25"/>` : "") +
           `<rect x="${f1(lx - 8 * k)}" y="${f1(ly)}" width="${f1(16 * k)}" height="${f1(22 * k)}" rx="${f1(4 * k)}" fill="${warm}" opacity="${dusk ? 1 : 0.8}" stroke="#4a3220" stroke-width="${f1(2 * k)}"/>` +
           `<path d="M${P(lx - 10 * k, ly)} L${P(lx, ly - 8 * k)} L${P(lx + 10 * k, ly)} Z" fill="#4a3220"/>`, lx, top, 7, lx > tx ? 0.55 : 0.1, 4);
    }
    // a little chimney out of the trunk, smoke curling up
    const cx = tx + 40 * k, cy = tb - 200 * k;
    t += `<rect x="${f1(cx)}" y="${f1(cy - 6 * k)}" width="${f1(34 * k)}" height="${f1(10 * k)}" fill="#7a756a"/><rect x="${f1(cx + 24 * k)}" y="${f1(cy - 40 * k)}" width="${f1(12 * k)}" height="${f1(40 * k)}" fill="#7a756a"/>` +
         [0, 1].map(i => `<path d="M${f1(cx + 30 * k)} ${f1(cy - 44 * k)} q${f1(10 * k)} ${f1(-12 * k)} 0 ${f1(-24 * k)} q${f1(-10 * k)} ${f1(-12 * k)} 0 ${f1(-24 * k)}" fill="none" stroke="#e8e8f0" stroke-width="${f1(5 * k)}" stroke-linecap="round" opacity="0">` +
           `<animate attributeName="opacity" values="0;0.5;0" dur="4s" begin="${i * 2}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 ${f1(-36 * k)}" dur="4s" begin="${i * 2}s" repeatCount="indefinite"/></path>`).join("");
    return t + `</g>`;
  });
  s += SEP + (house && obj("fairy house", tb, house));
  // the ring of toadstools in the grass, on the right of the middle: the
  // far ones smaller, the near ones bigger; glowing a little at night
  // (each toadstool an object at its foot, numbered round the ring, so one can stand
  // in the ring, behind its near side and in front of its far side; the grass in it is flat)
  const n = Math.max(4, Math.min(30, Math.round(o.mushrooms ?? 14)));
  const rx0 = W * 0.06, ry0 = g + 40 * k, rrx = 190 * k, rry = 44 * k;
  s += SEP + part("fairy-ring", [c.F, n, night], () => {
    const ms = [...Array(n)].map((_, i) => { const a = (i + 0.3 * R(i, 1330)) / n * 2 * Math.PI; return [rx0 + Math.cos(a) * rrx, ry0 + Math.sin(a) * rry, i]; })
      .sort((p, q) => p[1] - q[1]);
    return `<ellipse cx="${f1(rx0)}" cy="${f1(ry0)}" rx="${f1(rrx * 0.9)}" ry="${f1(rry * 0.8)}" fill="${night ? "#2a5a3a" : "#9fd27e"}" opacity="0.5"/>` +
      ms.map(([x, y, i]) => obj(`toadstool ${i + 1}`, y, toadstool(x, y, k * (0.75 + 0.5 * (y - (ry0 - rry)) / (2 * rry)) * (0.85 + 0.3 * R(i, 1331)), ["#d62828", "#e85d04", "#d62828", "#c1121f"][i % 4], night))).join("");
  });
  // flowers, tufts, bushes and stones in the near grass
  s += SEP + part("fairy-near", [c.F, time], () => {
    let t = `<defs>${FLOWER_DEFS}</defs>`;
    for (let i = 0; i < 34; i++) {
      const d = R(i, 1340), x = x0 + W * R(i, 1341), y = g + 10 * k + (y1 - g) * d;
      if (Math.abs(x - rx0) < rrx * 1.05 && Math.abs(y - ry0) < rry * 1.3) continue;
      t += i % 3 === 0 ? grassTuft(x, y, (14 + 10 * d) * k, i + 1340, tn("#4f9a3a"), 2 * k)
                       : use(i % 2 ? "bg-daisy" : "bg-tulip", x, y, k * (0.8 + 0.6 * d), k * (0.8 + 0.6 * d), ` color="${tn(FLOWER_COLORS[i % 6])}"`);
    }
    // (the flowers and tufts are flat; the bush and the stones are objects, each at its foot)
    t += obj("bush", g + 6 * k, bushSvg(x1 - W * 0.08, g + 6 * k, 70 * k, 1350, { greens: ["#285e2a", "#2f7d32", "#3a8a3c", "#4a9a46", "#5aad52"].map(tn) })) +
         obj("stone, left", g + 60 * k, rockSvg(x0 + W * 0.1, g + 60 * k, 26 * k, 1351, tn("#9a9488"))) + obj("stone, right", g + 90 * k, rockSvg(x1 - W * 0.3, g + 90 * k, 18 * k, 1352, tn("#9a9488")));
    return t;
  });
  // fireflies at sunset and at night, drifting and blinking; sparkles by day
  // (drawn after the objects, flying all over: in front of everything, at Infinity)
  s += SEP + obj(dusk ? "fireflies" : "sparkles", Infinity, part("fairy-lights", [c.F, time, sceneLfoKey(o, "fast")], () => [...Array(dusk ? 18 : 10)].map((_, i) => {
    const x = x0 + W * (0.08 + 0.84 * R(i, 1360)), y = g - 260 * k + 300 * k * R(i, 1361), dx = (R(i, 1362) - 0.5) * 60 * k, dyy = (R(i, 1363) - 0.5) * 40 * k, d = (5 + 5 * R(i, 1364)).toFixed(1);
    return dusk
      ? `<g><animateTransform attributeName="transform" type="translate" values="0 0;${f1(dx)} ${f1(dyy)};0 0" dur="${d}s" repeatCount="indefinite"/>` +
        `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(9 * k)}" fill="#fff3a8" opacity="0.25"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(3 * k)}" fill="#fffbd0">` +
        lfoTimed(o, "fast", R(i, 1366), `<animate attributeName="opacity" values="1;0.15;1" dur="${(1.4 + R(i, 1365) * 1.6).toFixed(2)}s" repeatCount="indefinite"/>`) + `</circle></g>`
      : `<path d="${starPath("four", 6 * k)}" transform="translate(${f1(x)} ${f1(y)})" fill="#ffffff" opacity="0">` +
        lfoTimed(o, "fast", R(i, 1366), `<animate attributeName="opacity" values="0;0.9;0" dur="${(2 + R(i, 1365) * 2).toFixed(2)}s" begin="${(R(i, 1366) * 3).toFixed(2)}s" repeatCount="indefinite"/>`) + `</path>`;
  }).join("")));
  // the way back to the clearing: a sign on a post, a doorway
  // (a sign at the bottom, in front of everything, at Infinity, the doorway wrapped whole)
  s += SEP + obj("sign", Infinity, part("fairy-back", c.F, () => `<g class="portal" data-to="clearing">` +
    `<rect x="${f1(x1 - W * 0.07 - 4 * k)}" y="${f1(y1 - 40 * k)}" width="${f1(8 * k)}" height="${f1(60 * k + pad)}" fill="#6e4a2c"/>` +
    plankSign(x1 - W * 0.07, y1 - 44 * k, k, "🌲 clearing ➡️") + `</g>`));
  // the light: a dusk glow, or the night's blue over everything
  // (over everything, the friend too: in front, at Infinity, named for its time)
  if (time !== "day") s += SEP + obj(night ? "dark" : time + " light", Infinity, part("fairy-light", [c.F, time], () =>
    all(night ? "#0b1030" : time === "sunset" ? "#5a2a4a" : "#f4a6c4").replace("<rect ", `<rect pointer-events="none" opacity="${night ? 0.22 : 0.1}" `)));
  return s;
}
// A clearing in the forest, and far off down its paths, things to see,
// each shown or not by its own switch: the family house, the tree house,
// the witch's hut, a castle, a healer's hut. The ones with a scene of their
// own close up are doorways into it.
// the witch's hut from afar: dark pines round a log hut on chicken legs,
// its window glowing, smoke curling from its crooked chimney
function farWitchSvg(o) {
  // (on chicken legs, as long as hers, or sat on the ground: as in her woods)
  const ls = (o.legSize ?? 100) / 100, legH = o.chickenLegs ? 46 * ls : 0, dy = 42 - legH;
  // (dark pines round it: the shared pine, in her woods' dusk greens)
  let t = `<defs>${pineDef("bg-far-witch-pine", 91)}</defs>` + [-120, -70, 80, 130, 30].map((x, i) => {
    const h = 110 + 40 * (i % 2); return use("bg-far-witch-pine", x, 90, h / 200, h / 200, ` color="${["#1f3a2a", "#24402e", "#18301f"][i % 3]}"`); }).join("");
  if (legH) t += [-1, 1].map(sd => `<path d="M${sd * 18} ${f1(44 + dy)} L${sd * 22} ${f1(86 - legH * 0.35)} L${sd * 34} 84 M${sd * 22} ${f1(86 - legH * 0.35)} L${sd * 14} 86" stroke="#e0552b" stroke-width="${f1(7 * Math.sqrt(ls))}" stroke-linecap="round" fill="none"/>`).join("");
  t += `<g transform="translate(0 ${f1(dy)})">` +
       `<rect x="-50" y="-26" width="100" height="70" fill="#5a3a2a" stroke="#2a1a12" stroke-width="3"/>` +
       [-12, 2, 16, 30].map(y => `<line x1="-50" y1="${y}" x2="50" y2="${y}" stroke="#2a1a12" stroke-width="2"/>`).join("") +
       `<polygon points="-64,-24 0,-78 66,-22" fill="#3b2f2a" stroke="#1d1410" stroke-width="3"/>` +
       `<rect x="-14" y="-6" width="26" height="22" fill="#ffd23f"/><path d="M-14 5 H12 M-1 -6 V16" stroke="#5a3a2a" stroke-width="3"/>` +
       `<polygon points="28,-60 44,-64 46,-30 30,-34" fill="#2a1a12"/>` +
       `<path d="M38 -66 Q26 -96 46 -116 Q62 -136 48 -160" fill="none" stroke="#c9c9d6" stroke-width="10" stroke-linecap="round" opacity="0.6"/></g>`;
  // her fence: crooked pickets either side of the gate, rails across
  t += [-1, 1].map(sd => `<path d="M${sd * 22} 84 H${sd * 130} M${sd * 22} 100 H${sd * 130}" stroke="#4a3626" stroke-width="5"/>` +
         [...Array(8)].map((_, i) => { const x = sd * (28 + i * 14), lean = ((i * 7) % 5 - 2) * 2;
           return `<polygon points="${x - 5},108 ${x + 5},108 ${x + 5 + lean},${72 - (i % 3) * 4} ${x + lean},${62 - (i % 3) * 4} ${x - 5 + lean},${72 - (i % 3) * 4}" fill="#5a4432" stroke="#2a1d14" stroke-width="1.5"/>`; }).join("")).join("") +
       `<path d="M-20 108 L-18 74 M20 108 L18 74" stroke="#2a1d14" stroke-width="5"/>`;
  // skulls on her fence posts, as big as her woods' skulls (the biggest
  // grow with their slider), their eyes as big and as glowing
  const big = Math.min(4, (o.skullMax ?? 300) / 100), eye = (o.skullEye ?? 100) / 100, glow = (o.eyeGlow ?? 70) / 100;
  t += [-112, -56, 56, 112].map((x, i) => {
    const r = 9 * (1 + (big - 1) * (i % 2 ? 0.5 : 0.2)), y = 58 - r * 0.6, er = 2.6 * eye * r / 9;
    return `<circle cx="${x}" cy="${f1(y)}" r="${f1(r)}" fill="#ece6d6" stroke="#8a8476" stroke-width="1.2"/>` +
           `<rect x="${f1(x - r * 0.5)}" y="${f1(y + r * 0.55)}" width="${f1(r)}" height="${f1(r * 0.5)}" fill="#ece6d6"/>` +
           [-1, 1].map(sd => (glow > 0 ? `<circle cx="${f1(x + sd * r * 0.38)}" cy="${f1(y)}" r="${f1(er * (1.4 + 2 * glow))}" fill="#ff2a2a" opacity="${(0.25 + 0.3 * glow).toFixed(2)}"/>` : "") +
             `<circle cx="${f1(x + sd * r * 0.38)}" cy="${f1(y)}" r="${f1(er)}" fill="#ff3b3b"/>`).join("");
  }).join("");
  return t;
}
// a castle's moat, in the castle's own units (its walls' foot at y = 0), as
// wide as its setting m: an ellipse, and the drawbridge's length across it;
// and the drawbridge's half width, l down from the gate (for its drawing,
// and for a friend wading in the moat: WATER, ticket 122)
const moatOf = m => ({ rx: 187 + 45 * m, ry: 14 + 22 * m, cy: 12, len: 26 + 24 * m });
const bridgeHalf = l => 34 + l * 0.16;
// where a castle stands up close, on the stage: its walls' foot, and its size there
const castleAt = ({ g, k, y0 }, K) => { const foot = g - 34 * k; return { foot, z: Math.min(1.25 * k, (foot - y0 - 20 * k) / (226 + 38 * K.levels)) }; };
// a castle on its hill: towers with pointed roofs and flags, a gate
function castleSvg(K = castleOf({})) {
  const stone = K.stone, dark = darker(stone), L = K.levels, m = K.moat;
  // (each level adds to the walls, the towers and the keep; at 3 levels it
  // is the castle the clearing always had)
  const wallH = 66 + 18 * L, towerH = 60 + 40 * L, keepTop = -(wallH + 50 + 20 * L);
  const teeth = (x, w, y) => [...Array(Math.floor(w / 16))].map((_, i) => `<rect x="${x + i * 16}" y="${y - 10}" width="10" height="10" fill="${stone}"/>`).join("");
  const r = (i, sd) => { const v = Math.sin(i * 12.9898 + sd * 78.233) * 43758.5453; return v - Math.floor(v); };
  // the moat round the castle's foot (its far side hidden by the walls), as
  // wide as the castle's own setting: none, or out to very wide
  const { rx, ry, cy, len } = moatOf(m);
  const moat = m <= 0 ? "" : `<ellipse cx="0" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="#3f8fc8" stroke="#2c6e9e" stroke-width="3"/>` +
    `<ellipse cx="0" cy="${f1(cy + 6)}" rx="${f1(rx - 32)}" ry="${f1(Math.max(4, ry - 14))}" fill="#62b0e0" opacity="0.6"/>`;
  // the drawbridge, down across the moat from the gate, its chains up to the wall
  const sp = bridgeHalf;
  const bridge = m <= 0 ? "" : `<polygon points="-34,0 34,0 ${f1(sp(len))},${f1(len)} ${f1(-sp(len))},${f1(len)}" fill="#8b5e34" stroke="#5e3d22" stroke-width="2"/>` +
    [...Array(Math.floor(len / 10))].map((_, j) => { const y = 10 * (j + 1); return `<line x1="${f1(-sp(y))}" y1="${y}" x2="${f1(sp(y))}" y2="${y}" stroke="#5e3d22" stroke-width="2"/>`; }).join("") +
    `<path d="M-30 -70 L${f1(-sp(len) + 2)} ${f1(len - 2)} M30 -70 L${f1(sp(len) - 2)} ${f1(len - 2)}" stroke="#555" stroke-width="2.5" stroke-dasharray="5 3"/>`;
  // a low fence outside the moat, round its near side, open at the bridge
  const fx = (m <= 0 ? 230 : rx + 38), fy = (m <= 0 ? 30 : ry + 14);
  const posts = [...Array(23)].map((_, i) => { const a = Math.PI * (i + 0.5) / 23; return [fx * Math.cos(a), 16 + fy * Math.sin(a)]; }).filter(([x]) => Math.abs(x) > 50);
  const fence = [-1, 1].map(sd => { const side = posts.filter(([x]) => Math.sign(x) === sd).sort((p, q) => p[0] - q[0]);
      return `<polyline points="${side.map(([x, y]) => `${f1(x)},${f1(y - 14)}`).join(" ")}" fill="none" stroke="#6e4a2c" stroke-width="4"/>`; }).join("") +
    posts.map(([x, y]) => `<rect x="${f1(x - 3)}" y="${f1(y - 22)}" width="6" height="24" fill="#7a5232" stroke="#4a2e1a" stroke-width="1"/>`).join("");
  // trees round it, behind and beside the walls: the more, the further out
  const trees = (K.trees ? `<defs>${leafyTreeDef("bg-ctree0", 11)}${leafyTreeDef("bg-ctree1", 23)}${pineDef("bg-cpine", 7)}</defs>` : "") +
    [...Array(K.trees)].map((_, i) => {
      const sd = i % 2 ? 1 : -1, j = Math.floor(i / 2), x = sd * (175 + 52 * j + 18 * r(i, 1)), y = -24 - 26 * r(i, 2) - (j % 2) * 18, h = 0.75 + 0.45 * r(i, 3);
      return r(i, 4) < 0.5 ? use("bg-cpine", x, y, 0.85 * h, 0.85 * h, ` color="${["#2f6e3a", "#3a7d44", "#285e33"][i % 3]}"`)
                           : use(`bg-ctree${i % 2}`, x, y, 0.44 * h * (r(i, 5) < 0.5 ? -1 : 1), 0.44 * h);
    }).join("");
  const mound = `<path d="M${f1(-fx - 40)} 70 Q-120 -40 0 -30 Q130 -40 ${f1(fx + 40)} 70 Z" fill="#7cb85a"/>`;
  // the stonework: courses of blocks on a tower or the keep, its shaded side
  const courses = (x, y, w, h) => [...Array(Math.floor(h / 16))].map((_, j) => `<line x1="${x}" y1="${f1(y + 16 * (j + 1))}" x2="${x + w}" y2="${f1(y + 16 * (j + 1))}" stroke="${dark}" stroke-width="1" opacity="0.45"/>` +
      [...Array(Math.floor(w / 20))].map((_, i) => `<line x1="${x + 10 + i * 20 + (j % 2) * 10}" y1="${f1(y + 16 * j)}" x2="${x + 10 + i * 20 + (j % 2) * 10}" y2="${f1(y + 16 * (j + 1))}" stroke="${dark}" stroke-width="1" opacity="0.35"/>`).join("")).join("") +
    `<rect x="${x + w * 0.62}" y="${y}" width="${f1(w * 0.38)}" height="${h}" fill="#000000" opacity="0.1"/>`;
  // a cone roof's tiles and its sunny side
  const tiles = (cx, base, hw, h) => [0.3, 0.55, 0.78].map(u => `<line x1="${f1(cx - hw * (1 - u))}" y1="${f1(base - h * u)}" x2="${f1(cx + hw * (1 - u))}" y2="${f1(base - h * u)}" stroke="${darker(K.roof)}" stroke-width="2"/>`).join("") +
    `<polygon points="${f1(cx - hw)},${base} ${cx},${base - h} ${f1(cx - hw * 0.35)},${base}" fill="#ffffff" opacity="0.12"/>`;
  // ivy climbing a corner
  const ivy = (x, y, h, sd) => [...Array(Math.floor(h / 9))].map((_, j) => `<circle cx="${f1(x + sd * (4 + 6 * r(j, 7 + sd)))}" cy="${f1(y - j * 9)}" r="${f1(5 + 3 * r(j, 9))}" fill="${["#3c8a3e", "#2f7d32", "#4a9a46"][j % 3]}"/>`).join("");
  // lily pads and reeds on the moat
  const pads = m <= 0 ? "" : [...Array(7)].map((_, i) => { const a = Math.PI * (0.15 + 0.7 * r(i, 11)), x = Math.cos(a) * rx * 0.86 * (r(i, 12) < 0.5 ? -1 : 1), y = cy + Math.sin(a) * ry * 0.7;
      if (Math.abs(x) < 50) return "";
      return `<path d="M${f1(x)} ${f1(y)} m-9 0 a9 4 0 1 0 18 0 l-9 0 Z" fill="#4f9a3a"/>` + (i % 3 === 0 ? `<circle cx="${f1(x + 3)}" cy="${f1(y - 3)}" r="3" fill="#f9a8d4"/>` : ""); }).join("") +
    [-1, 1].map(sd => [...Array(6)].map((_, j) => { const x = sd * (rx - 6 - j * 7); return `<path d="M${f1(x)} ${f1(cy + 2)} q${f1(sd * 3)} -16 ${f1(sd * 2)} -26" fill="none" stroke="#5a8a3a" stroke-width="2"/>` +
      (j % 2 ? `<ellipse cx="${f1(x + sd * 2)}" cy="${f1(cy - 22)}" rx="2.5" ry="6" fill="#6b4423"/>` : ""); }).join("")).join("");
  // the moat's reflection of the walls, wavering
  const shine = m <= 0 ? "" : `<rect x="-110" y="${f1(cy - ry + 6)}" width="220" height="${f1(Math.min(30, ry))}" fill="${stone}" opacity="0.25"/>` +
    [...Array(5)].map((_, j) => `<line x1="${f1(-90 + j * 40)}" y1="${f1(cy - ry + 12 + j * 3)}" x2="${f1(-70 + j * 40)}" y2="${f1(cy - ry + 12 + j * 3)}" stroke="#ffffff" stroke-width="2" opacity="0.5"/>`).join("");
  return castleFlagDefs(K, 4) + trees + mound + moat + shine + pads +
    `<rect x="-120" y="${-wallH}" width="240" height="${wallH}" fill="${stone}" stroke="${dark}" stroke-width="3"/>` +
    // (its blocks, under everything on the wall, kept on the wall)
    `<clipPath id="castle-wall-${K.id}-${L}"><rect x="-120" y="${-wallH}" width="240" height="${wallH}"/></clipPath><g clip-path="url(#castle-wall-${K.id}-${L})">` +
    [...Array(18)].map((_, i) => `<rect x="${-110 + (i % 6) * 38 + (Math.floor(i / 6) % 2) * 19}" y="${-wallH + 10 + Math.floor(i / 6) * 34}" width="30" height="14" fill="none" stroke="${dark}" stroke-width="1" opacity="0.6"/>`).join("") + `</g>` +
    teeth(-120, 240, -wallH) +
    [-1, 1].map(sd => `<rect x="${sd * 150 - 30}" y="${-towerH}" width="60" height="${towerH}" fill="${stone}" stroke="${dark}" stroke-width="3"/>` +
      courses(sd * 150 - 30, -towerH, 60, towerH) + teeth(sd * 150 - 34, 68, -towerH + 2) +
      `<polygon points="${sd * 150 - 38},${-towerH} ${sd * 150},${-towerH - 70} ${sd * 150 + 38},${-towerH}" fill="${K.roof}"/>` + tiles(sd * 150, -towerH, 38, 70) +
      `<line x1="${sd * 150}" y1="${-towerH - 70}" x2="${sd * 150}" y2="${-towerH - 100}" stroke="#555" stroke-width="3"/><polygon points="${sd * 150},${-towerH - 100} ${sd * 150 + 26},${-towerH - 92} ${sd * 150},${-towerH - 84}" fill="${castleFlagFill(K, 1, 4)}"/>` +
      [...Array(L)].map((_, j) => `<rect x="${sd * 150 - 8}" y="${-towerH + 40 + 40 * j}" width="16" height="26" rx="8" fill="${j % 2 ? "#3a3a48" : "#ffd66b"}"/>`).join("") +
      ivy(sd * 150 - sd * 30, 0, Math.min(towerH * 0.6, 120), -sd)).join("") +
    `<rect x="-40" y="${keepTop}" width="80" height="${-keepTop - wallH}" fill="${stone}" stroke="${dark}" stroke-width="3"/>` + teeth(-40, 80, keepTop) +
    courses(-40, keepTop, 80, -keepTop - wallH) +
    [...Array(Math.max(0, L - 1))].map((_, j) => `<rect x="-8" y="${keepTop + 24 + 34 * j}" width="16" height="22" rx="8" fill="#3a3a48"/>`).join("") +
    // (the keep's banner: its owner's letter, in its owner's color)
    `<polygon points="-48,${keepTop} 0,${keepTop - 70} 48,${keepTop}" fill="${K.roof}"/>` + tiles(0, keepTop, 48, 70) + `<line x1="0" y1="${keepTop - 70}" x2="0" y2="${keepTop - 120}" stroke="#555" stroke-width="3"/>` +
    `<polygon points="0,${keepTop - 120} 46,${keepTop - 108} 0,${keepTop - 96}" fill="${castleFlagFill(K, 0, 4)}"/>` +
    castleLetter(K, 0, 15, keepTop - 102, 16) +
    // (the gate's arch, and its portcullis: bars from the arch down, and bars across, all inside the arch)
    `<path d="M-34 0 V-56 A34 34 0 0 1 34 -56 V0 Z" fill="#3a2a1a"/>` +
    `<clipPath id="castle-gate-${K.id}-${L}"><path d="M-34 0 V-56 A34 34 0 0 1 34 -56 V0 Z"/></clipPath><g clip-path="url(#castle-gate-${K.id}-${L})">` +
    [-20, -7, 7, 20].map(x => `<line x1="${x}" y1="-92" x2="${x}" y2="0" stroke="#6a5a4a" stroke-width="3"/>`).join("") +
    [-70, -46, -22].map(y => `<line x1="-36" y1="${y}" x2="36" y2="${y}" stroke="#6a5a4a" stroke-width="2.5"/>`).join("") + `</g>` +
    [-80, 80].map(x => `<rect x="${x - 8}" y="${-wallH + 30}" width="16" height="24" rx="8" fill="#3a3a48"/>`).join("") +
    // banners hanging from the wall, in the owner's color, the owner's letter on them
    // (from just under the battlements, as long as the wall is tall, and
    // never down to the ground or the moat)
    (() => { const bl = Math.min(wallH * 0.55, wallH - 22), bt = -wallH + 4;
      return [-1, 1].map((sd, i) => `<path d="M${sd * 102 - 13} ${bt} h26 v${f1(bl)} l-13 -9 l-13 9 Z" fill="${castleFlagFill(K, i, 4)}" stroke="#e8b923" stroke-width="1.5"/>` +
        castleLetter(K, i, sd * 102, bt + Math.min(bl * 0.55, 34) + 6, 16, "serif")).join(""); })() +
    // torches either side of the gate
    [-1, 1].map(sd => `<rect x="${sd * 46 - 2}" y="-62" width="4" height="12" fill="#3a3a44"/><circle cx="${sd * 46}" cy="-68" r="12" fill="#ffcf6b" opacity="0.35"/>` +
      `<path d="M${sd * 46} -76 q5 6 0 10 q-5 -4 0 -10 Z" fill="#ffb53b"/>`).join("") +
    bridge + fence;
}
// a healer's hut: round, thatched, a heart on its sign, herbs growing by it
function healerSvg() {
  // a grove round it: trees behind and either side, their trunks in the ground at y = 40
  // (leafy trees, as everywhere: their feet in the ground at y = 40)
  const grove = `<defs>${leafyTreeDef("bg-htree0", 31)}${leafyTreeDef("bg-htree1", 37)}</defs>` +
    [[-150, 10, 52], [-105, -5, 62], [120, -10, 66], [165, 15, 50], [-40, -40, 58], [55, -45, 54]].map(([x, y, r], i) => {
      const z = ((40 - y) + 1.7 * r) / 330;
      return use(`bg-htree${i % 2}`, x, 40, z * (i % 3 ? 1 : -1), z);
    }).join("");
  return grove + [-90, -70, -50, 60, 80, 100].map((x, i) => `<path d="M${x} 40 Q${x - 6} 20 ${x - 10} 6 M${x} 40 Q${x + 4} 18 ${x + 10} 8" stroke="${["#5f8a3a", "#7a9a3a", "#4a8a4a"][i % 3]}" stroke-width="4" fill="none"/>` +
      `<circle cx="${x - 10}" cy="6" r="4" fill="${["#c39bd3", "#f7a8c8", "#f2c12e"][i % 3]}"/>`).join("") +
    `<path d="M-60 40 V-20 Q0 -40 60 -20 V40 Z" fill="#e8d5b0" stroke="#a88a5a" stroke-width="3"/>` +
    // (the thatched roof, peaking at -96, where its thatch meets and its smoke comes out;
    // each line of thatch from just inside its lower edge, -14 - 44 t (1 - t), up to the peak)
    `<path d="M-80 -14 Q0 -178 80 -14 Q0 -36 -80 -14 Z" fill="#c9a35a" stroke="#8a6a2a" stroke-width="3"/>` +
    [-50, -25, 0, 25, 50].map(x => { const t = (x * 1.4 + 80) / 160;
      return `<path d="M${x * 1.4} ${f1(-16 - 44 * t * (1 - t))} Q${x} -60 ${x * 0.3} -94" stroke="#a8823a" stroke-width="2" fill="none"/>`; }).join("") +
    `<path d="M-16 40 V4 Q0 -10 16 4 V40 Z" fill="#7a5a3a"/>` +
    `<rect x="24" y="-10" width="34" height="26" rx="4" fill="#ffffff" stroke="#a88a5a" stroke-width="2"/>` +
    `<path d="M41 12 L31 2 A5 5 0 0 1 41 -4 A5 5 0 0 1 51 2 Z" fill="#e53935"/>` +
    `<path d="M10 -96 Q2 -120 16 -140" fill="none" stroke="#d8d8e0" stroke-width="8" stroke-linecap="round" opacity="0.6"/>`;
}
// what is far off in the clearing, where (x as a share of the width, how
// far up from the clearing's near edge), its size, and its doorway
const CLEARING_THINGS = [
  // (each as its own scene has it: the tree house is that scene's very tree,
  // its houses, bridges and ladders; the house its size; the witch's hut its
  // legs and its skulls)
  { key: "seeCastle", at: [0.1, 120], size: 0.42, foot: 62, draw: o => { const K = castleOf(o);
      return part("far-castle", [K.id, K.levels, K.stone, K.trees, K.moat, K.flagA, K.flagB, K.flagStyle, K.roof], () => castleSvg(K)); }, to: "castle" },
  { key: "seeTree", at: [-0.2, 95], size: 0.25, foot: 6, grow: o => (o.treeSize ?? 100) / 100, draw: (o, c) => unmarked(treeInner(c)), to: "treehouse" },
  { key: "seeHouse", at: [-0.36, 70], size: 0.3, foot: 4, grow: o => (o.houseSize ?? 100) / 100, draw: () => part("house-building", [], houseBuildingSvg), to: "house" },
  { key: "seeWitch", at: [0.25, 95], size: 0.52, foot: 108, draw: o => part("far-witch", [!!o.chickenLegs, o.legSize ?? 100, o.skullMax ?? 300, o.skullEye ?? 100, o.eyeGlow ?? 70], () => farWitchSvg(o)), to: "witch" },
  { key: "seeHealer", at: [0.36, 40], size: 0.58, foot: 40, draw: () => part("far-healer", [], healerSvg), to: "healerroom" },
];
