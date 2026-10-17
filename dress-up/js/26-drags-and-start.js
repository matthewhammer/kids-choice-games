"use strict";
// (ticket 178) Part 26 of 26 of the game's script, run in order by index.html.

// ===================== DRAG THE MOUTH AND BROW =====================
// As in Kids' Choice: a press above the eyes grabs the brow, below them
// the mouth, and dragging down raises the value: a smile, or a glower.

let drag = null;
const pic = document.getElementById("pic");
// the pointer in the picture's units, then in the figure's (undoing its
// size and place in a scene), then in the face's
const picUnits = e => new DOMPoint(e.clientX, e.clientY).matrixTransform(pic.getScreenCTM().inverse());
function faceUnits(e) {
  const p = picUnits(e), T = figureT;
  const x = (p.x - T.dx) / T.k, y = (p.y - T.dy - T.sg) / T.k + T.g;
  return [(x - faceFrame.tx) / faceFrame.s, (y - faceFrame.ty) / faceFrame.s];
}
// in a scene, a press on the figure (not its face) picks it up
const onFigure = e => {
  if (state.background.kind === "none") return false;
  const t = document.elementFromPoint(e.clientX, e.clientY);
  return !!(t && t.closest && t.closest("#figure"));
};
const onFace = e => {
  const [x, y] = faceUnits(e);
  return (x - 100) ** 2 + (y - 110) ** 2 <= 90 ** 2;
};
// On a touch screen the picture pinches and pans like the rest of the
// page; only a one-finger touch that starts on the face is kept for the
// drag (the page used to opt the whole picture out of zooming). A second
// finger lets go of the face, so a pinch goes to the browser.
// in a scene, a press on a thing that moves (data-drag: the witch) picks it up
const onThing = e => {
  const t = document.elementFromPoint(e.clientX, e.clientY);
  return t && t.closest ? t.closest("#bg [data-drag]") : null;
};
// POSING (ticket 121), as in M's games on the iPad: a press on a hand, a
// foot, an elbow or a knee (the nearest within a fingertip, or within a
// big hand's or shoe's size) takes hold of it, and dragging poses that limb
// alone: a hand or a foot reaches for the finger, the elbow or knee bending
// the way it already bent; an elbow or a knee swings the whole arm or leg
// round its shoulder or hip. Each limb's turn and bend is kept on top of
// the sliders' (poseOf), so the sliders still move both alike.
const figUnits = (e, T = figureT) => { const p = picUnits(e); return [(p.x - T.dx) / T.k, (p.y - T.dy - T.sg) / T.k + T.g]; };
// (ticket 135) A press is on a joint only when it is really on it: a hand or
// a foot within its own size and a little more (8 screen pixels for a mouse
// or a pen, 18 for a finger), an elbow or a knee within its limb's width.
// Anywhere else on the friend the press moves them. (It was 30 pixels round
// every joint, and in a place, where the friend is small, the elbows' and
// hands' circles covered most of the torso: dragging the friend took an arm.)
function onJoint(e) {
  if (!poseJoints || entering) return null;
  const [x, y] = figUnits(e), px = 1 / (pic.getScreenCTM().a * figureT.k), slop = (e.pointerType === "touch" ? 18 : 8) * px;
  let best = null;
  const consider = (what, side, P, r) => { const d = Math.hypot(x - P[0], y - P[1]); if (d <= r && (!best || d < best.d)) best = { what, side, d, P, r }; };
  for (const a of poseJoints.arms) { consider("hand", a.side, a.H, Math.max(poseJoints.handR, 12 * px) + slop); consider("elbow", a.side, a.E, poseJoints.armW * 0.6 + 2 * px); }
  for (const l of poseJoints.legs) { consider("foot", l.side, l.F, Math.max(poseJoints.footR, 12 * px) + slop); consider("knee", l.side, l.K, poseJoints.legW * 0.6 + 2 * px); }
  return best;
}
// (ticket 135) Under a mouse or a pen, what a press would take glows: the
// orb of a hand, a foot, an elbow or a knee it would pose, or the friend's
// body when it would move them. Drawn over the picture, kept across
// drawings, changed only when what is under the pointer changes.
let hoverOn = null;
function hoverTarget(e) {
  if (drag || e.pointerType === "touch") return null;
  const joint = onJoint(e);
  if (joint) return { kind: "joint", what: joint.what, side: joint.side, key: "j" + joint.what + joint.side };
  if (onThing(e) && !onFigure(e)) return null;
  if (onFace(e)) return null;   // (a press on the face moves the brows or the smile)
  return onFigure(e) ? { kind: "figure", key: "f" } : null;
}
function hoverGlowSvg() {
  if (!hoverOn || !poseJoints) return "";
  const T = figureT, at = (x, y) => [T.dx + T.k * x, T.dy + T.sg + T.k * (y - T.g)], J = poseJoints;
  const ring = (cx, cy, r) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r + 7)}" fill="none" stroke="#fff6a0" stroke-opacity="0.45" stroke-width="7"/>` +
                              `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r + 3)}" fill="#fff6a0" fill-opacity="0.18" stroke="#fffbe0" stroke-width="2.5"/>`;
  if (hoverOn.kind === "joint") {
    const limb = hoverOn.what === "hand" || hoverOn.what === "elbow" ? J.arms.find(a => a.side === hoverOn.side) : J.legs.find(l => l.side === hoverOn.side);
    if (!limb) return "";
    const P = { hand: limb.H, elbow: limb.E, foot: limb.F, knee: limb.K }[hoverOn.what], r = { hand: J.handR, foot: J.footR, elbow: J.armW / 2, knee: J.legW / 2 }[hoverOn.what];
    const [cx, cy] = at(P[0], P[1]);
    return ring(cx, cy, Math.max(6, T.k * Math.min(r, 40)));
  }
  // the body: shoulders to hips, as wide as the wider of the two, rounded
  const xs = [...J.arms.map(a => a.A[0]), ...J.legs.map(l => l.H[0])], ys = [...J.arms.map(a => a.A[1]), ...J.legs.map(l => l.H[1])];
  const pad = Math.max(J.armW, 10), [x0, y0] = at(Math.min(...xs) - pad, Math.min(...ys) - pad), [x1, y1] = at(Math.max(...xs) + pad, Math.max(...ys) + pad);
  const rx = Math.min(x1 - x0, y1 - y0) * 0.3;
  return `<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1 - x0)}" height="${f1(y1 - y0)}" rx="${f1(rx)}" fill="#fff6a0" fill-opacity="0.12" stroke="#fff6a0" stroke-opacity="0.5" stroke-width="7"/>` +
         `<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1 - x0)}" height="${f1(y1 - y0)}" rx="${f1(rx)}" fill="none" stroke="#fffbe0" stroke-width="2.5"/>`;
}
function showHover() {
  const old = document.getElementById("hover-glow");
  if (old) old.remove();
  const svg = hoverGlowSvg();
  if (!svg) return;
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.id = "hover-glow"; g.setAttribute("pointer-events", "none"); g.innerHTML = svg;
  pic.append(g);
}
function hoverAt(e) {
  const t = hoverTarget(e), key = t ? t.key : null;
  if (key === (hoverOn ? hoverOn.key : null)) return;
  hoverOn = t; showHover();
}
// a limb's new turn (and, for a hand or foot, bend) for its joint at
// (x, y), in the figure's units
function poseTo({ what, side }, [x, y]) {
  const B = state.body, sk = side > 0 ? "L" : "R", J = poseJoints, deg = r => r * 180 / Math.PI, rad = d => d * Math.PI / 180;
  const norm = d => ((d % 360) + 540) % 360 - 180, r1 = v => Math.round(v * 10) / 10;
  // (two bones from the root R, the first `a` long and the second `b`: the
  // first's angle so the second's end is at the finger; of the two ways the
  // middle joint can go, the one nearer where it is now; then the second's)
  const reach = (R, M0, a, b, own, at) => {
    const dx = x - R[0], dy = y - R[1], d = Math.max(Math.abs(a - b) + 0.01, Math.min(Math.hypot(dx, dy), a + b - 0.01)), phi = own(dx, dy);
    const g = deg(Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d)))));
    const off = t => Math.hypot(at(t)[0] - M0[0], at(t)[1] - M0[1]), first = off(phi + g) <= off(phi - g) ? phi + g : phi - g, M = at(first);
    return [first, own(x - M[0], y - M[1])];
  };
  // (ticket 124: in profile the arms and legs point the way the friend
  // faces, `out`, and the far arm is held a little higher; sitting, the
  // legs start from the sitting angles, and facing us the thighs are short)
  const dir = facingOf(B), lean = side === dir ? -14 : dir ? 4 : 0;
  if (what === "hand" || what === "elbow") {
    // (angles as the arms slider measures them: from level, + down, mirrored for the side)
    const arm = J.arms.find(a => a.side === side), A = arm.A, half = J.armLen / 2, o = arm.out ?? side, own = (dx, dy) => deg(Math.atan2(dy, o * dx));
    const at = t => [A[0] + o * half * Math.cos(rad(t)), A[1] + half * Math.sin(rad(t))];
    if (what === "elbow") { B["poseArm" + sk] = r1(norm(own(x - A[0], y - A[1]) - B.arms - lean)); return; }
    const [up, fore] = reach(A, arm.E, half, half, own, at);
    B["poseArm" + sk] = r1(norm(up - B.arms - lean));
    B["poseElbow" + sk] = r1(norm(up - fore - (B.elbows ?? 0)));
  } else {
    // (angles from straight down, + out, mirrored for the side)
    const leg = J.legs.find(l => l.side === side), Hp = leg.H, half = J.LL / 2, o = leg.out ?? side, own = (dx, dy) => deg(Math.atan2(o * dx, dy));
    const base = J.legBase || { t0: (B.knees ?? 0) / 2, b0: B.knees ?? 0, thigh: 1 }, a = half * base.thigh;
    const at = t => [Hp[0] + o * a * Math.sin(rad(t)), Hp[1] + a * Math.cos(rad(t))];
    if (what === "knee") { B["poseLeg" + sk] = r1(norm(own(x - Hp[0], y - Hp[1]) - base.t0)); return; }
    const [thigh, shin] = reach(Hp, leg.K, a, half, own, at);
    B["poseLeg" + sk] = r1(norm(thigh - base.t0));
    B["poseKnee" + sk] = r1(norm(thigh - shin - base.b0));
  }
}
pic.addEventListener("touchstart", e => {
  if (e.touches.length === 1 && (onJoint(e.touches[0]) || onFace(e.touches[0]) || onFigure(e.touches[0]) || onThing(e.touches[0]))) e.preventDefault();
  else drag = null;
}, { passive: false });
pic.addEventListener("touchmove", e => {
  if (drag && e.touches.length === 1) e.preventDefault();
}, { passive: false });
pic.addEventListener("pointerleave", () => { if (hoverOn) { hoverOn = null; showHover(); } });
pic.addEventListener("pointerdown", e => {
  if (!e.isPrimary) return;
  if (hoverOn) { hoverOn = null; showHover(); }
  const joint = onJoint(e);
  if (joint) {
    drag = { pose: joint, T: { ...figureT } };
    poseHeld = { what: joint.what, side: joint.side, g: figureT.g };
    pic.setPointerCapture(e.pointerId); picDragging = true;   // (a drag: picGapNow waits for letGo)
    changed();   // (the ring)
    return;
  }
  const thing = onThing(e);
  if (thing && !onFigure(e)) {
    const p = picUnits(e), B = state.background, name = thing.dataset.drag;
    // (ticket 185: a thing put in a place, "thing:i", is things[i], its feet at depth z)
    const T = name.startsWith("thing:") ? (B.things || [])[+name.slice(6)] : null;
    if (name.startsWith("thing:") && !T) return;
    drag = T ? { thing: name, put: +name.slice(6), x0: T.x, y0: T.z - SCENE.ground, px: p.x, py: p.y }
             : { thing: name, x0: B[name + "X"] ?? +(thing.dataset.x ?? 0), y0: B[name + "Y"] ?? +(thing.dataset.y ?? 0), px: p.x, py: p.y };
    pic.setPointerCapture(e.pointerId); picDragging = true;
    return;
  }
  if (!onFace(e)) {
    if (!onFigure(e)) return;
    const p = picUnits(e);
    drag = { figure: true, x0: state.background.figX ?? 0, y0: state.background.figY ?? 0, px: p.x, py: p.y };
    pic.setPointerCapture(e.pointerId); picDragging = true;
    return;
  }
  const [x, y] = faceUnits(e);
  const feature = y < faceLayout(state.face).eyeY - 12 - browLift(state.face) ? "brow" : "smile";
  drag = { feature, v0: state.face[feature], y0: e.clientY };
  pic.setPointerCapture(e.pointerId); picDragging = true;
});
// (ticket 133) A drag's moves come faster than frames (a 125 Hz mouse, a
// 240 Hz pencil, and all of them while the page is busy): each move updates
// the friend at once, and the picture is drawn once a frame, for the newest
// move. A timer stands in where frames do not come.
let dragFrame = 0, dragTimer = 0;
function dragDraw(last = false) { cancelAnimationFrame(dragFrame); clearTimeout(dragTimer); dragFrame = dragTimer = 0; moved(last === true); }   // (ticket 163: a drag's frames only draw)
function dragChanged() {
  if (dragFrame || dragTimer) return;
  dragFrame = requestAnimationFrame(dragDraw); dragTimer = setTimeout(dragDraw, 50);
}
// One step per screen pixel, however big the picture is drawn.
pic.addEventListener("pointermove", e => {
  if (!drag) { hoverAt(e); return; }
  if (drag.pose) { poseTo(drag.pose, figUnits(e, drag.T)); dragChanged(); return; }
  if (drag.thing) {
    // kept in the scene, as the figure is
    const p = picUnits(e), F = sceneFrame, B = state.background;
    const x = Math.round(clamp(drag.x0 + p.x - drag.px, F.left, F.right)), y = Math.round(clamp(drag.y0 + p.y - drag.py, figYMin(F), F.bottom - F.ground));
    const T = drag.put !== undefined && (B.things || [])[drag.put];
    if (T) { T.x = x; T.z = SCENE.ground + y; }
    else { B[drag.thing + "X"] = x; B[drag.thing + "Y"] = y; }
    dragChanged();
    return;
  }
  if (drag.figure) {
    // kept in the scene: its feet within the frame, from the frame's top
    // half down to just below the ground
    const p = picUnits(e), F = sceneFrame, BG = state.background;
    // (ticket 149: walls and solids stop a dragged friend too, who slides along them)
    [BG.figX, BG.figY] = solidMove(BG.figX ?? 0, BG.figY ?? 0, Math.round(clamp(drag.x0 + p.x - drag.px, F.left, F.right)),
                                   Math.round(clamp(drag.y0 + p.y - drag.py, figYMin(F), F.bottom - F.ground)));
    dragChanged();
    return;
  }
  state.face[drag.feature] = clamp(Math.round(drag.v0 + (e.clientY - drag.y0)), -100, 200);
  dragChanged();
});
// (ticket 133) The picture's animations go on during a drag: the ducks keep
// paddling while you move the friend. (Since ticket 118 they held still
// during a drag, as drawing the witch's fumes was most of a frame; since
// 0.0.55 the fumes are cheap, and holding still bought nothing, measured.)
// (ticket 50) Sitting on a seat: the friend sits, facing a way the seat
// allows, across it where they were (or in its middle), and is moved up or
// down until their hips are on its top (their size changes with the depth,
// so a few rounds); kept by the seat's name. Standing up again puts their
// feet on the floor in front of it.
function sitOn(t) {
  const B = state.background, body = state.body;
  body.sit = true; body.pose = "sit"; B.seat = t.name;
  if (t.facing && t.facing.length && !t.facing.includes(body.facing || "front")) body.facing = t.facing[0];
  body.turn = "";   // (ticket 144: seated, not turned)
  const fx = B.figX ?? 0, m = Math.min(12, (t.x1 - t.x0) / 3);
  B.figX = Math.round(fx >= t.x0 + m && fx <= t.x1 - m ? fx : (t.x0 + t.x1) / 2);
  B.figY = Math.round(t.z - SCENE.ground);
  for (let i = 0; i < 4; i++) {
    draw();
    const T = figureT, hips = T.sg + T.dy + T.k * (poseJoints.legs[0].H[1] - T.g);
    B.figY = Math.round(B.figY + (t.y - hips));
  }
  changed();
}
function standUp() {
  const B = state.background, t = seatNow();
  state.body.sit = false; state.body.pose = "stand"; B.seat = null;
  if (t) B.figY = Math.round(t.z - SCENE.ground);
  changed();
}
// (a friend let go of over a seat, their feet between its top and the floor
// in front of it, sits on it; one sitting on a seat and let go of elsewhere
// stands up)
function dropOnSeat() {
  const B = state.background; if (B.kind === "none") return;
  const x = B.figX ?? 0, y = SCENE.ground + (B.figY ?? 0), was = seatNow();
  const t = seatsHere(B).find(t => x >= t.x0 && x <= t.x1 && y >= t.y - 10 && y <= t.z + 18);
  if (t && (!was || was.name !== t.name)) sitOn(t);
  else if (!t && was) { state.body.sit = false; B.seat = null; changed(); }
}
const letGo = () => {
  if (dragFrame || dragTimer) dragDraw(true);   // (the last move, drawn before letting go)
  picDragging = false;
  // (a joint let go: the friend settles on their lower foot, the frame round them)
  const posing = drag && drag.pose, placed = drag && drag.figure;
  drag = null;
  if (posing) { poseHeld = null; changed(); }
  if (placed) dropOnSeat();
  if (placed && state.body.anim === "climbup") { climb = null; climbAnywhere = false; changed(); }   // (ticket 137: a ladder within reach of where they were put)
};
pic.addEventListener("pointerup", letGo);
// (ticket 133: a touch the browser takes over, as a scroll or a gesture, ends
// the drag too, or the friend stays held)
pic.addEventListener("pointercancel", letGo);
pic.addEventListener("pointercancel", letGo);

// Through a doorway (a picture, a window, a tree house, a door: .portal in
// the scene) into its scene: the friend flies to it, shrinking to fit it
// and spinning, slowly and then fast, and lands in the new scene where a
// friend starts, at the size they had.
let entering = false;
// (ticket 199) the pointer over a passage, or near where a nav arrow would be: the bright one
pic.addEventListener("pointermove", e => {
  if (e.buttons || drag || entering) return;
  const h = passUnderPointer(e);
  if ((h && h.el) !== (hoverPass && hoverPass.el)) { hoverPass = h; showEnterGlow(); }
});
pic.parentNode.addEventListener("pointerleave", () => { if (hoverPass) { hoverPass = null; showEnterGlow(); } });
pic.addEventListener("click", e => {
  // (ticket 199: the one under the pointer, even far off: walked or swum to, and gone through)
  if (hoverPass && !entering && e.target.closest && !e.target.closest("#figure, [data-drag]")) {
    const h = marks.pics.find(q => q.el === hoverPass.el && q.el.isConnected);
    if (h) { enterAt = h; hoverPass = null; enterPicture(); return; }
  }
  // (ticket 173: a ladder clicked is climbed, whether or not it is in a doorway)
  const ladder = !entering && e.target.closest && e.target.closest("#bg [data-ladder]");
  if (ladder) { climbLadder(ladder); return; }
  const door = !entering && e.target.closest && e.target.closest("#bg .portal");
  if (door) { enterScene(door); return; }
  // (ticket 187) a passage behind something standing in front of it (a fence, a bush, a sign's post):
  // through it too; never one behind the friend or a thing put there, which are for dragging
  if (entering || !e.target.closest || e.target.closest("#figure, [data-drag], #ways") || marks.text !== bgShown.text) return;
  const q = picUnits(e), hit = marks.pics.filter(p => p.kind !== "nav" && p.el.isConnected && q.x >= p.x0 && q.x <= p.x1 && q.y >= p.y0 && q.y <= p.y1)
                                         .sort((a, b) => (a.x1 - a.x0) * (a.y1 - a.y0) - (b.x1 - b.x0) * (b.y1 - b.y0))[0];
  if (hit) { enterAt = hit; enterPicture(); }
});
// (ticket 187) Enter: through the passage that glows, as X
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || e.repeat || (e.target.closest && e.target.closest("input, textarea, select, button, [contenteditable]"))) return;
  if (enterAt) { e.preventDefault(); enterPicture(); }
});
// a nested <svg>'s own box on the screen, from its x, y, width and height
function svgBox(el) {
  const m = el.parentNode.getScreenCTM(), g = k => el[k].baseVal.value;
  const p = new DOMPoint(g("x"), g("y")).matrixTransform(m), q = new DOMPoint(g("x") + g("width"), g("y") + g("height")).matrixTransform(m);
  return { x: Math.min(p.x, q.x), y: Math.min(p.y, q.y), width: Math.abs(q.x - p.x), height: Math.abs(q.y - p.y) };
}
// The friend flies into a box on the screen (a doorway, or the back chip),
// shrinking to fit it and spinning, slowly and then fast; then the scene
// changes (arrive) and they land, spinning out, at their own size.
// (ticket 193, Matthew 2026-10-17: going into a picture, the friend froze
// in place and we waited; coming out, some limbs waited in their places,
// never spinning) The friend is drawn in pieces, the far arm apart among the
// scene's objects (figShown), and every drawing puts fresh pieces in: the
// spin turned one piece, in a group a drawing during it emptied, while a
// still friend was put back. So the spin turns a copy of all of them, on
// top of the picture, while the friend itself is hidden (figAway: every
// drawing hides its pieces again), going in and coming out. The copy's ids
// are its own, so its masks and patterns are its own, not the hidden ones'.
let figAway = false;
function figHide(on) { figAway = on; for (const n of figShown) if (n.style) n.style.visibility = on ? "hidden" : ""; }
function figCopy() {
  const NS = "http://www.w3.org/2000/svg", g = document.createElementNS(NS, "g"), P = pic.getScreenCTM().inverse();
  g.setAttribute("pointer-events", "none"); g.setAttribute("class", "fig-spin");
  for (const n of figShown) {
    if (n.nodeType !== 1) continue;
    let html = n.outerHTML;
    for (const id of new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1])))
      html = html.split(`"${id}"`).join(`"${id}-spin"`).split(`#${id})`).join(`#${id}-spin)`).split(`"#${id}"`).join(`"#${id}-spin"`);
    const holder = document.createElementNS(NS, "g"), par = n.parentNode, m = par && par.getScreenCTM ? P.multiply(par.getScreenCTM()) : null;
    if (m) holder.setAttribute("transform", `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map(v => +v.toFixed(4)).join(" ")})`);
    holder.innerHTML = html;
    for (const c of holder.children) { c.style.visibility = ""; c.style.opacity = ""; }
    g.append(holder);
  }
  pic.append(g);
  return g;
}
function flyInto(box, arrive) {
  if (!document.getElementById("figure")) return;
  entering = true;
  const inv = pic.getScreenCTM().inverse();
  const at = r => new DOMPoint(r.x + r.width / 2, r.y + r.height / 2).matrixTransform(inv);
  // (the friend's box: all their pieces)
  const rs = figShown.filter(n => n.getBoundingClientRect).map(n => n.getBoundingClientRect()).filter(r => r.width && r.height);
  if (!rs.length) { entering = false; arrive(); changed(); return; }
  const x0 = Math.min(...rs.map(r => r.left)), y0 = Math.min(...rs.map(r => r.top)), x1 = Math.max(...rs.map(r => r.right)), y1 = Math.max(...rs.map(r => r.bottom));
  const fr = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, f0 = at(fr), d0 = at(box);
  const s = Math.min(box.width / fr.width, box.height / fr.height) * 0.75, dx = d0.x - f0.x, dy = d0.y - f0.y;
  const wrap = figCopy();
  figHide(true);
  wrap.style.transformBox = "fill-box";
  wrap.style.transformOrigin = "center";
  const step = (u, turn, k, o = 1) => ({ transform: `translate(${f1(dx * u)}px, ${f1(dy * u)}px) rotate(${turn}deg) scale(${+k.toFixed(3)})`, opacity: o });
  const fly = wrap.animate([step(0, 0, 1), step(0.2, 45, 1 - (1 - s) * 0.2), step(0.55, 240, 1 - (1 - s) * 0.6),
                            step(0.85, 720, 1 - (1 - s) * 0.9), step(1, 1260, s), step(1, 1620, s * 0.2, 0)],
                           { duration: 2000, easing: "ease-in", fill: "forwards" });
  fly.onfinish = () => {
    wrap.remove();
    tripPhase = "arriving";
    arrive();
    entering = false; tripNext("spinning out");
    changed();   // (drawn in the new place, still hidden)
    // landing: a quick spin out, slowing, to the friend's own size: the copy, then the friend
    const land = figCopy();
    land.style.transformBox = "fill-box";
    land.style.transformOrigin = "center bottom";
    land.animate([{ transform: "rotate(-360deg) scale(0.2)", opacity: 0 }, { transform: "rotate(0deg) scale(1)", opacity: 1 }],
                 { duration: 600, easing: "ease-out" }).onfinish = () => {
      land.remove(); figHide(false);
      if (tripPhase === "spinning out") tripPhase = "arrived";
    };
  };
}
// (ticket 138, as actions since ticket 141) A game controller, through the
// browser's Gamepad API. Played as a video game is, not as a puppet: the
// arrows (buttons 12 to 15 on a "standard" pad), or the left stick, walk the
// friend that way, from standing or sitting (a seat too), the diagonals as
// well, deeper into the place at 0.6 of the pace; they face the way they go
// (up: away from us, down: toward us; a diagonal keeps the one of its two
// ways they faced, else the side one: no diagonal postures yet, ticket 144).
// Held with an arrow, 🏃 run runs; 🧎 crouch crouches down, or crawls with
// an arrow. In water, walking is swimming and running is swimming fast. The
// two jumps go on top of whatever they are doing, and two buttons go places
// (back, the nearest doorway). Which button does what: state.controls (an
// action's button number; -1 none), set in the 🎮 Controls tab, where "🎯 set"
// learns the next button pressed (padLearn). The pad changes the animation
// only when what it is told changes (padWant), so it never undoes a chip;
// nor while they are up a place's ladder. Polled each frame while a pad is
// connected, never without one.
const PAD_ACTIONS = [["jumpShort", "🐸 short, fast jump"], ["jumpHigh", "🦘 high, slow jump"], ["run", "🏃 run (held, with an arrow)"],
                     ["crouch", "🧎 crouch down (held); with an arrow, crawl"], ["crawlToggle", "🐛 crawling on or off (press)"],
                     ["back", "⬅️ back the way they came"], ["door", "🚪 through the nearest passage"], ["enter", "✨ through the passage that glows"]];
// (ticket 146) teaching a pad its buttons, by their SNES names: pressed in
// this order. Then A is the short jump, B the high one, X into the picture
// that glows (ticket 145), Y crouch, R crawling on or off, select back,
// start the nearest doorway; run stays on the button it had (Matthew:
// "perfect"), taking it from any other that also wanted it.
const PAD_TEACH = [["B", "B, the bottom button"], ["A", "A, the right one"], ["X", "X, the top one"], ["Y", "Y, the left one"],
                   ["L", "L, the left shoulder"], ["R", "R, the right shoulder"], ["select", "select"], ["start", "start"]];
let padId = "", padTeach = null, padCrawl = false;
const padLayouts = () => { try { return JSON.parse(localStorage.getItem("dress-up-pads") || "{}") || {}; } catch (e) { return {}; } };
function padKeep() {
  if (!padId) return;
  try { const all = padLayouts(); all[padId] = Object.fromEntries(PAD_ACTIONS.map(([a]) => [a, state.controls[a] ?? -1])); localStorage.setItem("dress-up-pads", JSON.stringify(all)); } catch (e) { /* (kept for this visit only) */ }
}
function padTaught() {
  const G = padTeach.got, C = state.controls, run = C.run, at = k => (Number.isInteger(G[k]) ? G[k] : -1);
  Object.assign(C, { jumpShort: at("A"), jumpHigh: at("B"), enter: at("X"), crouch: at("Y"), crawlToggle: at("R"), back: at("select"), door: at("start") });
  for (const [a] of PAD_ACTIONS) if (a !== "run" && C[a] === run && run >= 0) C[a] = -1;
  padTeach = { done: true, got: G, line: `${padId || padName} (${padMapping === "standard" ? "standard numbers" : "its own numbers"}): ` +
    PAD_TEACH.map(([k]) => `${k}=${at(k)}`).join(", ") + `, run=${run}` };
  padKeep();
}
const PAD_PLACES = ["bottom", "right", "left", "top", "left shoulder", "right shoulder", "left trigger", "right trigger", "select", "start", "left stick", "right stick", "up", "down", "left", "right", "home"];
const padButtonName = i => !(i >= 0) ? "—" : padMapping === "standard" && PAD_PLACES[i] ? `${PAD_PLACES[i]} (button ${i})` : `button ${i}`;
const PAD_SPEED = { none: 160, walk: 90, run: 230, crawl: 55, swim: 70, swimfast: 150, crouch: 0 };
// (ticket 188, Matthew: "slider to control max running speed, and an
// acceleration/deceleration speed slider -- the current behavior, which can
// be the default, is immediate") body.runSpeed scales running and fast
// swimming (100: as before); body.accel, 0 to 100, is how long the friend
// takes to get up to full running speed, and to stop from it (0: at once,
// as before; 100: PAD_RAMP seconds), coasting to a stop, legs still going,
// after the arrows are let go. padVel, their speed now, in stage units a second.
const PAD_RAMP = 1.2;
const padTop = key => (PAD_SPEED[key] ?? PAD_SPEED.none) * (key === "run" || key === "swimfast" ? (state.body.runSpeed ?? 100) / 100 : 1);
let padVel = [0, 0];
let padLoop = 0, padName = "", padMapping = "", padDown = new Set(), padMoving = false, padLast = 0, padWant = "none", padLearn = null;
function padPoll(t) {
  padLoop = 0;
  // (ticket 150: a real one first; else the on-screen one, if it is shown)
  const real = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(Boolean);
  touchShow(!real && touchPad.want, !real);
  const g = real || (touchPad.want ? touchPad.pad : null);
  if (!g) { padName = ""; padDown = new Set(); padLast = 0; if (padMoving) { padMoving = false; changed(); } return; }
  padName = (g.id || "").replace(/\s*\(.*$/, "").trim() || "a game controller";
  padMapping = g.mapping || "";
  // (and again when the settings are replaced: ↺ start over or 📂 load put
  // the usual buttons back, and the on-screen controller kept the standard
  // pad's layout, ✨ on L and crawling on R, instead of its own)
  if ((g.id || padName) !== padId || padFor !== state.controls) padUse(g.id || padName);
  if (g === touchPad.pad) touchLabels();
  const dt = padLast ? Math.min(0.1, (t - padLast) / 1000) : 0;
  padLast = t;
  const now = new Set(g.buttons.map((b, i) => (b.pressed ? i : -1)).filter(i => i >= 0));
  const arrows = padMapping === "standard" ? [12, 13, 14, 15] : [];
  const pressed = [...now].filter(i => !padDown.has(i) && !arrows.includes(i)), lit = now.size !== padDown.size || pressed.length > 0;
  padDown = now;
  const C = state.controls, B = state.body, BG = state.background;
  // learning a button: the next one pressed is the action's (and no other's)
  if (padLearn && pressed.length) {
    for (const [a] of PAD_ACTIONS) if (C[a] === pressed[0]) C[a] = -1;
    C[padLearn] = pressed[0]; padLearn = null; padKeep(); changed();
    padLoop = requestAnimationFrame(padPoll); return;
  }
  // (ticket 146) teaching the pad: each button pressed is the next one asked for
  if (padTeach && !padTeach.done && pressed.length) {
    padTeach.got[PAD_TEACH[padTeach.step][0]] = pressed[0];
    if (++padTeach.step >= PAD_TEACH.length) padTaught();
    changed();
    padLoop = requestAnimationFrame(padPoll); return;
  }
  const btn = a => Number.isInteger(C[a]) && C[a] >= 0 ? C[a] : -2, held = a => now.has(btn(a)), hit = a => pressed.includes(btn(a));
  if (hit("back")) { if (!backBtn.hidden) backBtn.click(); }
  if (hit("door")) padDoor();
  if (hit("crawlToggle")) { padCrawl = !padCrawl; padWant = null; }   // (ticket 146: on or off; arrows then crawl)
  // the arrows, or the left stick past its dead middle (at most one step a frame's worth, diagonals too)
  const stick = v => (Math.abs(v ?? 0) > 0.25 ? v : 0);
  let vx = clamp((now.has(15) ? 1 : 0) - (now.has(14) ? 1 : 0) + stick(g.axes[0]), -1, 1), vy = clamp((now.has(13) ? 1 : 0) - (now.has(12) ? 1 : 0) + stick(g.axes[1]), -1, 1);
  const len = Math.hypot(vx, vy);
  if (len > 1) { vx /= len; vy /= len; }
  const onLadder = B.anim === "climbup" && climb && !climb.none;
  // (ticket 145) a ladder by hand: at its foot, up gets on it; on it, up and
  // down climb (a chip's climb too, taken over), and down at its foot, or an
  // arrow to the side there, steps off
  const ud = Math.abs(vy) > 0.5 && Math.abs(vx) < 0.75 * Math.abs(vy) ? Math.sign(vy) : 0;
  if (!onLadder && ud < 0 && BG.kind !== "none" && !entering && !drag && !isJump(B.anim)) {
    const L = ladderNear();
    if (L) { mountLadder(L); padMoving = false; padWant = null; changed(); padLoop = requestAnimationFrame(padPoll); return; }
  }
  if (onLadder && ud && !climb.manual) Object.assign(climb, { manual: true, got: climb.at ?? 0 });
  if (onLadder && climb.manual && !entering && !climb.down) {
    if (climb.got <= 0 && (ud > 0 || (!ud && Math.abs(vx) > 0.5))) { B.anim = "none"; climb = null; padWant = null; changed(); }
    else if (ud) { climb.got = clamp(climb.got - ud * CLIMB_HAND * (held("run") ? 1.8 : 1) * figureT.k * dt, 0, climb.all ?? Infinity); moved(); }
  }
  const moving = !!(vx || vy) && BG.kind !== "none" && !entering && !drag && !onLadder;
  // (ticket 188: let go, still coasting to a stop, when speeding up and slowing down take time)
  const ramp = (state.body.accel ?? 0) / 100 * PAD_RAMP;
  const coasting = !moving && ramp > 0 && Math.hypot(padVel[0], padVel[1]) > 2 && BG.kind !== "none" && !entering && !drag && !onLadder;
  if (!moving && !coasting) padVel = [0, 0];
  const wet = BG.kind !== "none" && !SHALLOW_WATER[BG.kind] && inWater(BG, BG.figX ?? 0, SCENE.ground + (BG.figY ?? 0));
  const run = held("run"), low = held("crouch") || padCrawl;
  const want = moving ? (low ? (wet ? "swim" : "crawl") : wet ? (run ? "swimfast" : "swim") : run ? "run" : "walk") : coasting && padWant ? padWant : low && !wet ? "crouch" : "none";
  if (isJump(B.anim)) jumpPrev = want;   // (landing into what they are told now)
  else if (want !== padWant && !onLadder) {
    padWant = want;
    if (want !== "none" && BG.seat) standUp();
    // (as its chip would, but keeping the way they face: they turn as they go, below)
    if (B.anim !== want) {
      if (want !== "none" && want !== "swim" && want !== "swimfast" && B.pose !== "stand") strikePose("stand");
      B.anim = want; climb = null;
      changed();
    }
  }
  if (hit("jumpShort") && !onLadder) { startJump(B.anim, "jump"); changed(); }
  if (hit("jumpHigh") && !onLadder) { startJump(B.anim, "jumphigh"); changed(); }
  if (hit("enter")) enterPicture();   // (ticket 145)
  if (moving || coasting) {
    // (ticket 188: the speed they are told, reached at once, or over the ramp's time: a step toward it each frame)
    const top = padTop(isJump(B.anim) ? jumpPrev : B.anim), want = moving ? [vx * top, vy * top] : [0, 0];
    if (!ramp) padVel = want;
    else { const step = padTop("run") / ramp * dt, ex = want[0] - padVel[0], ey = want[1] - padVel[1], e = Math.hypot(ex, ey);
           padVel = e <= step ? want : [padVel[0] + ex / e * step, padVel[1] + ey / e * step]; }
    const F = sceneFrame;
    // (ticket 149: walls and solids stop them, and they slide along)
    const [mx, my] = solidMove(BG.figX ?? 0, BG.figY ?? 0, Math.round(10 * clamp((BG.figX ?? 0) + padVel[0] * dt, F.left, F.right)) / 10,
                               Math.round(10 * clamp((BG.figY ?? 0) + padVel[1] * dt * 0.6, figYMin(F), F.bottom - F.ground)) / 10);
    if (mx === (BG.figX ?? 0) && my === (BG.figY ?? 0) && !moving) padVel = [0, 0];   // (stopped by a wall while coasting)
    BG.figX = mx; BG.figY = my;
    // (ticket 162: walking onto a pit's hole, not jumping, falls in)
    if (!isJump(B.anim) && !entering) { const pit = pitAt(mx, SCENE.ground + my); if (pit) enterScene(pit); }   // (the poll goes on: it must schedule itself again)
    // (which way they face: a diagonal keeps the one of its two ways they faced, else the side one; coasting, as they were)
    const ax = Math.abs(vx), ay = Math.abs(vy), m = Math.max(ax, ay) || 1;
    const side = ax > 0.38 * m ? (vx < 0 ? "left" : "right") : null, depth = ay > 0.38 * m ? (vy < 0 ? "back" : "front") : null;
    // (ticket 144) a diagonal toward us: facing us, turned partway the side's way; away from us, as before
    if (!moving) { /* (coasting: facing as they were) */ }
    else if (side && depth === "front") { B.facing = "front"; B.turn = side; }
    else { B.facing = !side ? depth : !depth ? side : B.facing === side || B.facing === depth ? B.facing : side; B.turn = ""; }
    padMoving = true;
    moved();   // (ticket 163)
  } else if (padMoving) {
    // (stopped: on a seat if they were put down by one; up a ladder within reach, climbing)
    padMoving = false;
    dropOnSeat();
    if (B.anim === "climbup") { climb = null; climbAnywhere = false; }
    changed();
  } else if (lit) changed();   // (the Controls tab shows which buttons are down)
  padLoop = requestAnimationFrame(padPoll);
}
// (the passage nearest the friend, however far: walked to and gone through; ticket 187: every kind, measured as X's)
function padDoor() {
  if (entering || state.background.kind === "none") return;
  const all = passesNear(Infinity);
  if (all.length) { enterAt = all[0].p; enterPicture(); }
}
window.addEventListener("gamepadconnected", e => {
  padName = ((e.gamepad && e.gamepad.id) || "").replace(/\s*\(.*$/, "").trim() || "a game controller";
  padMapping = (e.gamepad && e.gamepad.mapping) || "";
  // (ticket 146: a pad taught its buttons gets its own layout back)
  padUse((e.gamepad && e.gamepad.id) || padName);
  if (!padLoop) padLoop = requestAnimationFrame(padPoll);
  changed();
});
window.addEventListener("gamepaddisconnected", () => { if (!padLoop) padLoop = requestAnimationFrame(padPoll); });
// (a pad's own layout, when the pad in use changes: the one kept by its id;
// else the on-screen controller's own to start with; else, coming from the
// on-screen one, the usual buttons)
let padFor = null;   // (the settings padUse last put a layout into)
function padUse(id) {
  const kept = padLayouts()[id], C = state.controls, like = L => Object.keys(L).every(a => C[a] === L[a]);
  const fresh = padFor !== C;
  padFor = C;
  if (kept) Object.assign(C, kept);
  else if (id === TOUCH_ID && (id !== padId || fresh)) Object.assign(C, TOUCH_CONTROLS);
  else if (id !== TOUCH_ID && (padId === TOUCH_ID || like(TOUCH_CONTROLS))) Object.assign(C, DEFAULTS.controls);
  // (an action newer than the layout kept, as ticket 145's ✨: on its usual
  // button, unless another action has that one)
  const usual = id === TOUCH_ID ? TOUCH_CONTROLS : DEFAULTS.controls;
  if (kept) for (const [a] of PAD_ACTIONS) if (!(a in kept)) C[a] = PAD_ACTIONS.some(([o]) => o !== a && C[o] === usual[a]) ? -1 : usual[a];
  padId = id;
}
// (ticket 150) The on-screen controller, for a tablet or a phone with no
// game controller (an iPad has no USB port for ours), or any screen without
// one: a SNES controller's layout in the screen's bottom corners, to touch
// or click (touchpad, built the first time it is shown). It is a pad like a
// real one (touchPad.pad, with the standard numbers), read by padPoll every
// frame while it is shown, so every action works as with a real controller
// and is set in the same 🎮 Controls tab. Its own layout is kept by its id
// (TOUCH_ID), as a real pad's is, and starts as TOUCH_CONTROLS: Matthew's
// taught one (A the short jump, B the high one, X into the picture that glows, Y crouch, select
// back, start the nearest doorway), with run on R and crawling on or off on
// L, so the right thumb holds run while the left one steers. Offered (🎮, at
// the picture's bottom right) while no game controller is connected, and
// hidden while one is. Whether it is shown is this browser's own
// (localStorage "dress-up-touchpad"), not the friend's.
const TOUCH_ID = "on-screen controller";
const TOUCH_CONTROLS = { jumpShort: 1, jumpHigh: 0, run: 5, crouch: 2, crawlToggle: 4, back: 8, door: 9, enter: 3 };
const touchPad = { want: false, shown: false, el: null, keys: "",
  pad: { id: TOUCH_ID, index: -1, connected: true, mapping: "standard", axes: [0, 0, 0, 0], timestamp: 0,
         buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0, at: 0, tok: 0 })) } };
try { touchPad.want = localStorage.getItem("dress-up-touchpad") === "1"; } catch (e) { /* (not shown to start) */ }
const padBtn = document.getElementById("pad-btn");
padBtn.addEventListener("click", () => touchWant(!touchPad.want));
function touchWant(on) {
  touchPad.want = on;
  try { localStorage.setItem("dress-up-touchpad", on ? "1" : "0"); } catch (e) { /* (for this visit only) */ }
  if (!padLoop) padLoop = requestAnimationFrame(padPoll);
  changed();
}
// (shown or not; and the 🎮 that offers it, only while no game controller is connected)
function touchShow(on, offer) {
  if (padBtn.hidden !== !offer) padBtn.hidden = !offer;   // (each frame: the page is changed only when this changes)
  if (on === touchPad.shown) return;
  padBtn.setAttribute("aria-pressed", on);
  padBtn.title = on ? "Hide the controller on the screen" : "A controller on the screen: arrows and buttons to touch or click";
  touchPad.shown = on;
  if (!touchPad.el) touchBuild();
  touchPad.el.hidden = !on;
  if (!on) for (const b of touchPad.pad.buttons) { b.pressed = false; b.value = 0; b.tok++; }
  if (!on) for (const x of touchPad.el.querySelectorAll(".down")) x.classList.remove("down");
}
// A press holds its button down until the finger (or the mouse) lets go,
// for at least 70 ms, so a tap shorter than a frame is still seen by padPoll
function touchSet(i, on, x) {
  const b = touchPad.pad.buttons[i], tok = ++b.tok;
  if (on) { b.pressed = true; b.value = 1; b.at = performance.now(); if (x) x.classList.add("down"); return; }
  if (!b.pressed) return;
  setTimeout(() => { if (b.tok !== tok) return; b.pressed = false; b.value = 0; if (x) x.classList.remove("down"); }, Math.max(0, b.at + 70 - performance.now()));
}
function touchBuild() {
  const hold = (x, i) => {
    x.addEventListener("pointerdown", e => { e.preventDefault(); try { x.setPointerCapture(e.pointerId); } catch (_) { /* (a synthetic press) */ } touchSet(i, true, x); });
    for (const k of ["pointerup", "pointercancel", "lostpointercapture"]) x.addEventListener(k, () => touchSet(i, false, x));
    x.addEventListener("contextmenu", e => e.preventDefault());
    return x;
  };
  const btn = (cls, i, name) => { const x = hold(el("button", { type: "button", class: cls, "aria-label": name }, [name, el("small")]), i); x.dataset.b = i; return x; };
  // the arrows: where a finger is on the cross, from its middle, is the
  // direction (a diagonal between two arms), and it slides from one to the next
  const arm = (cls, sign) => el("div", { class: "arm " + cls }, sign);
  const arms = { 12: arm("u", "▲"), 13: arm("d", "▼"), 14: arm("l", "◀"), 15: arm("r", "▶") };
  const dpad = el("div", { class: "dpad pad", role: "group", "aria-label": "arrows" }, [el("div", { class: "hub" }), ...Object.values(arms)]);
  let held = null;
  const aim = e => {
    const r = dpad.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width * 2 - 1, dy = (e.clientY - r.top) / r.height * 2 - 1;
    const far = Math.hypot(dx, dy) > 0.18, a = Math.atan2(dy, dx), c = Math.cos(a), s = Math.sin(a);
    const on = { 12: far && s < -0.38, 13: far && s > 0.38, 14: far && c < -0.38, 15: far && c > 0.38 };
    for (const i in on) if (on[i] !== touchPad.pad.buttons[i].pressed || on[i]) touchSet(+i, on[i], arms[i]);
  };
  dpad.addEventListener("pointerdown", e => { e.preventDefault(); held = e.pointerId; try { dpad.setPointerCapture(e.pointerId); } catch (_) { /* (a synthetic press) */ } aim(e); });
  dpad.addEventListener("pointermove", e => { if (e.pointerId === held) aim(e); });
  for (const k of ["pointerup", "pointercancel", "lostpointercapture"])
    dpad.addEventListener(k, e => { if (e.pointerId !== held) return; held = null; for (const i in arms) touchSet(+i, false, arms[i]); });
  dpad.addEventListener("contextmenu", e => e.preventDefault());
  const abxy = el("div", { class: "abxy pad", role: "group", "aria-label": "buttons" }, [btn("bx", 3, "X"), btn("by", 2, "Y"), btn("ba", 1, "A"), btn("bb", 0, "B")]);
  touchPad.el = el("div", { class: "touchpad", id: "touchpad", hidden: "" }, [
    el("div", { class: "half l" }, [btn("sh", 4, "L"), dpad, btn("sm", 8, "select")]),
    el("div", { class: "half r" }, [btn("sh", 5, "R"), btn("sm", 9, "start"), abxy])]);
  document.body.append(touchPad.el);
  touchPad.keys = "";
  touchLabels();
}
// (each button shows what it does: its action's emoji, from the 🎮 Controls tab's layout)
function touchLabels() {
  const C = state.controls, key = JSON.stringify(C);
  if (!touchPad.el || key === touchPad.keys) return;
  touchPad.keys = key;
  for (const x of touchPad.el.querySelectorAll("button[data-b]")) {
    const a = PAD_ACTIONS.find(([k]) => C[k] === +x.dataset.b);
    x.lastChild.textContent = a ? a[1].split(" ")[0] : "";
    x.title = `${x.firstChild.textContent}: ${a ? a[1] : "nothing yet (set one in the 🎮 Controls tab)"}`;
    x.classList.toggle("idle", !a);
  }
}
if (touchPad.want) padLoop = requestAnimationFrame(padPoll);
// Where a friend lands, arriving in a place, if not in its middle: on the
// ground, by the camp's fire and not in it, on the bank of the falls' pool
// and not in the water, and to one side of a doorway at the far end (a
// tent's door, the cave's mouth) rather than in front of it ([x, y] from
// the middle of the stage's ground).
const ARRIVE = { witchroom: [-170, 0], crossing: [0, -20], imagination: [0, 70], emptyroom: [0, 70], healerroom: [60, 40], fairyforest: [50, 40], campsite: [110, -10], waterfall: [-130, 40], tent: [-95, 25], cave: [-150, 25], castle: [-210, 30], castleroom: [0, 40] };
// Where each trip through a doorway began, the last on top: the back chip
// goes back through them, one at a time, while the friend is in the scene
// the last trip went to.
const trips = [];
function enterScene(door) {
  if (door.dataset.way) { worldWalk(door); return; }   // (ticket 185: a way out of a world square, to the one beside it)
  const to = door.dataset.to, house = door.dataset.house, tent = door.dataset.tent, room = door.dataset.room, B = state.background;
  if (!SCENES[to] && !PICTURE_CHOICES.some(([kd]) => kd === to)) return;
  // (a picture's own box: the scene inside it spills past it, hidden)
  const view = door.querySelector(":scope > svg, :scope > image");
  const from = { kind: B.kind, inside: B.inside, tent: B.tent, castleRoom: B.castleRoom, figX: B.figX ?? 0, figY: B.figY ?? 0, to };
  const arrive = () => {
    trips.push(from);
    const [figX, figY] = ARRIVE[to] || [0, 0];
    Object.assign(B, { kind: to, figX, figY });
    if (house) B.inside = +house;
    if (tent) B.tent = +tent;
    if (room) B.castleRoom = +room;
  };
  // (ticket 147, Matthew: the spin only for pictures and windows, "it's the most magical looking";
  // through any other way the friend walks, or, at a ladder's top, steps)
  // (ticket 173: a doorway reached by a ladder, a tree's house or a ladder's way up, is climbed to, unless the friend is through it already)
  const lad = !view && !(climb && climb.through) ? ladderOf(door) : null;
  if (lad) { climbLadder(lad); return; }
  tripStart(door, view ? "spin" : door.dataset.pit ? "fall" : "walk");   // (⏱️)
  // (ticket 199) a picture out of reach: walked (or swum) to first, under it, then flown into
  const far = view && !passesNear().some(q => q.p.el === door), pp = far && marks.pics.find(q => q.el === door);
  if (pp) walkTo((pp.x0 + pp.x1) / 2, clamp(pp.y1, SCENE.ground + figYMin(sceneFrame), sceneFrame.bottom), () => flyInto(svgBox(view), arrive));
  else if (view) flyInto(svgBox(view), arrive);
  else if (door.dataset.pit) walkInto(door, () => { arrive(); landFall = true; }, true, "fall");   // (ticket 162)
  else walkInto(door, arrive, !(climb && climb.through));
}
// (ticket 199) to a spot on the floor, walking (swimming in deep water) as
// walkInto does, a long way faster, 2.5 s at most; then on
function walkTo(x, y, then) {
  const BG = state.background, B = state.body, F = sceneFrame;
  const tx = clamp(x, F.left, F.right), ty = clamp(y - SCENE.ground, figYMin(F), F.bottom - F.ground);
  entering = true;
  if (BG.seat) standUp();
  if (B.pose !== "stand") strikePose("stand");
  const speed = Math.max(PAD_SPEED.walk, Math.hypot(tx - (BG.figX ?? 0), (ty - (BG.figY ?? 0)) / 0.6) / 2.5), t0 = performance.now();
  let last = 0;
  const step = t => {
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
    const dx = tx - (BG.figX ?? 0), dy = ty - (BG.figY ?? 0), d = Math.hypot(dx, dy / 0.6), sp = speed * dt;
    if (d <= sp + 0.5 || t - t0 > WALK_IN_MAX) { BG.figX = tx; BG.figY = ty; B.anim = "none"; entering = false; draw(); then(); return; }
    BG.figX = Math.round(10 * ((BG.figX ?? 0) + dx * sp / d)) / 10; BG.figY = Math.round(10 * ((BG.figY ?? 0) + dy * sp / d)) / 10;
    B.anim = deepHere() ? "swim" : "walk"; B.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "back" : "front"; B.turn = "";
    moved(); requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
// (ticket 162) A trap room's pits, from their [data-pit] (middle, half
// widths): the one whose hole (PIT_EDGE of it, so a foot on the rim does not
// fall) the friend's feet at (x, z) are over, or null. Walking onto one, not
// jumping, falls in (padPoll, endJump).
const PIT_EDGE = 0.8;
let pitMemo = { text: undefined, pits: [] };
function pitAt(x, z) {
  if (pitMemo.text !== bgShown.text) pitMemo = { text: bgShown.text, pits: bgShown.node ? [...bgShown.node.querySelectorAll(".portal[data-pit]")].map(el => {
    const [cx, cy, rx, ry] = el.dataset.pit.split(" ").map(Number); return { el, cx, cy, rx, ry }; }) : [] };
  return (pitMemo.pits.find(q => ((x - q.cx) / (PIT_EDGE * q.rx)) ** 2 + ((z - q.cy) / (PIT_EDGE * q.ry)) ** 2 < 1) || {}).el || null;
}
// (after a fall, in the place below: dropping in from above the picture, and landing on bent knees)
let landFall = false;
function fallLand() {
  landFall = false;
  const fig = document.getElementById("figure");
  if (!fig) return;
  const NS = "http://www.w3.org/2000/svg", w = document.createElementNS(NS, "g"), h = fig.getBBox().height || 300;
  fig.replaceWith(w); w.append(fig);
  // (nothing drawn while they drop in, or the drawing would put them down at once: the controller waits,
  // as on a trip, and its wish is "none" already, so it asks for no drawing)
  entering = true; padWant = "none"; tripNext("dropping in");
  w.animate([{ transform: `translate(0px, ${f1(-1.6 * h)}px)` }, { transform: "translate(0px, 0px)" }], { duration: FALL_DROP_MS * 0.8, easing: "ease-in" })
   .onfinish = () => {
    entering = false; tripPhase = "landing";
    // (the high jump's landing: its last part, the knees bending and straightening)
    const B = state.body, rate = Math.max(0.1, Number(B.jumpHighS ?? 75) || 100) / 100;
    startJump("none", "jumphigh"); jumpStart = performance.now() - JUMP_TIMES[1] / rate * 1000;
    changed();
  };
}
const FALL_TEETER_MS = 250, FALL_DROP_MS = 600;
// (ticket 147) Through a doorway on foot: the friend walks to the doorway's
// foot as the controller walks them (PAD_SPEED.walk, deeper at 0.6 of the
// pace), as near as the place lets them; a door swings open by itself as
// they come (its [data-leaf] to its data-open shape, by magic: no reaching
// for a handle yet); they step on into it, fading, and fade in where they
// arrive. walk false: from a ladder's top, the step and the fade only.
const WALK_IN_STEP = 30, WALK_IN_MS = 450, WALK_IN_MAX = 4000;
// (ticket 173) The ladder that leads to a doorway: one inside it (a dungeon's
// or a tree room's way up), or, for a tree's house, that tree's ladder
// ([data-ladder][data-house], drawn apart from the house)
function ladderOf(door) {
  const inside = door.querySelector("[data-ladder]");
  if (inside) return inside;
  const house = door.dataset.house, node = bgShown.node;
  return house && door.dataset.to === "treeroom" && node ? node.querySelector(`[data-ladder][data-house="${house}"]`) : null;
}
// (ticket 173, Matthew: clicking a ladder, the walk to it is good, "but we
// should also animate the climb upward") To a ladder's foot on foot, as
// through a doorway (walkInto), then up it as the 🧗 chip climbs (climb,
// going on in draw), through at its top if it is a way somewhere
// (climbThrough), else holding on up there.
function climbLadder(el) {
  if (entering || !el || !el.isConnected) return;
  const P = pic.getScreenCTM(), L = P ? ladderAt(el, P.inverse()) : null;
  if (!L) return;
  walkInto(el, null, true, "climb", L);
}
// (ticket 162) Falling into a pit (cx, cy, rx, ry, its hole): facing us,
// the arms flung up, a moment's teeter, then down into it, ever faster,
// hidden below the hole's near rim (a clip that stays as the friend drops)
function fallDown([cx, cy, rx, ry], then) {
  const B = state.body, NS = "http://www.w3.org/2000/svg";
  B.anim = "fall"; B.facing = "front"; B.turn = ""; tripPhase = "teetering"; draw();
  setTimeout(() => {
    tripPhase = "falling";
    draw();
    const fig = document.getElementById("figure");
    if (!fig) { then(); return; }
    const h = fig.getBBox().height || 300, clip = document.createElementNS(NS, "clipPath"), id = "fall-clip";
    clip.id = id; clip.setAttribute("clipPathUnits", "userSpaceOnUse");
    clip.innerHTML = `<path d="M${f1(cx - 4 * rx)} ${f1(cy - 4000)} H${f1(cx + 4 * rx)} V${f1(cy)} H${f1(cx + rx)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(cx - rx)} ${f1(cy)} H${f1(cx - 4 * rx)} Z"/>`;
    const outer = document.createElementNS(NS, "g"), inner = document.createElementNS(NS, "g");
    outer.setAttribute("clip-path", `url(#${id})`);
    fig.replaceWith(outer); outer.append(clip, inner); inner.append(fig);
    inner.animate([{ transform: "translate(0px, 0px)" }, { transform: `translate(0px, ${f1(1.3 * h)}px)` }], { duration: FALL_DROP_MS, easing: "ease-in", fill: "forwards" })
      .onfinish = then;
  }, FALL_TEETER_MS);
}
function walkInto(door, arrive, walk = true, how = "step", lad = null) {
  const P = pic.getScreenCTM(), BG = state.background, B = state.body, F = sceneFrame;
  if (!P) return;
  entering = true;
  const inv = P.inverse(), shape = door.querySelector("path, rect") || door, r = shape.getBoundingClientRect();
  // (a pit: its hole's middle; any other doorway: its foot)
  const pit = how === "fall" && door.dataset.pit ? door.dataset.pit.split(" ").map(Number) : null;
  // (a ladder (ticket 173): its foot, where a climb starts)
  const foot = lad ? { x: lad.x, y: lad.z + 2 } : pit ? { x: pit[0], y: pit[1] } : new DOMPoint(r.x + r.width / 2, r.y + r.height).matrixTransform(inv);
  const tx = clamp(foot.x, F.left, F.right), ty = clamp(foot.y - SCENE.ground, figYMin(F), F.bottom - F.ground);
  // (the way in: on toward the doorway from where they stop; deeper into the place if it is straight ahead)
  let ux = foot.x - tx, uy = foot.y - (SCENE.ground + ty);
  if (Math.hypot(ux, uy) < 12) { ux = 0; uy = -1; }
  const un = Math.hypot(ux, uy); ux /= un; uy /= un;
  const face = (vx, vy) => Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? "left" : "right") : vy < 0 ? "back" : "front";
  // the door, opening
  const leaf = door.querySelector("[data-leaf]"), undo = [];
  if (leaf) {
    const to = leaf.getAttribute("data-open");
    for (const p of leaf.querySelectorAll("path")) {
      const a = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      for (const [k, v] of [["attributeName", "d"], ["to", to], ["dur", "0.6s"], ["fill", "freeze"], ["begin", "indefinite"]]) a.setAttribute(k, v);
      p.append(a); undo.push(() => a.remove());
      try { a.beginElement(); } catch (e) { /* (an old browser: the door stays as it is) */ }
    }
    for (const n of leaf.querySelectorAll("line, ellipse")) { const o = n.style.opacity; n.style.opacity = "0"; undo.push(() => { n.style.opacity = o; }); }
  }
  if (BG.seat) standUp();
  if (B.pose !== "stand" && walk) strikePose("stand");
  const fade = o => { for (const n of figShown) if (n.style) n.style.opacity = o; };
  // (deeper counts 1 / 0.6 as far, as the controller walks; a long way is walked faster, to take 2.5 s at most)
  const dist = Math.hypot(tx - (BG.figX ?? 0), (ty - (BG.figY ?? 0)) / 0.6), speed = Math.max(PAD_SPEED.walk, dist / 2.5);
  let last = 0, phase = walk ? "walk" : "in", t0 = performance.now(), tIn = 0;
  const done = () => {
    for (const u of undo) u();
    tripPhase = "arriving";
    arrive();
    B.anim = "none"; B.facing = "front"; B.turn = "";   // (standing, in the place they came into, facing us)
    entering = false;
    changed();
    if (landFall) { fallLand(); return; }   // (ticket 162: from a pit, dropping in and landing; no fade)
    tripNext("fading in");
    // (fading in where they arrive)
    const t1 = performance.now(), f = t => { const u = Math.min(1, (t - t1) / WALK_IN_MS); if (!entering) fade(u < 1 ? u.toFixed(2) : ""); if (u < 1 && !entering) requestAnimationFrame(f); else if (tripPhase === "fading in") tripPhase = "arrived"; };
    fade("0"); requestAnimationFrame(f);
  };
  const step = t => {
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0; last = t;
    if (phase === "walk") {
      const dx = tx - (BG.figX ?? 0), dy = ty - (BG.figY ?? 0), d = Math.hypot(dx, dy / 0.6), sp = speed * dt;
      if (d <= sp + 0.5 || t - t0 > WALK_IN_MAX) { BG.figX = tx; BG.figY = ty; phase = "in"; tIn = t; }
      else {
        const k = sp / d;
        BG.figX = Math.round(10 * ((BG.figX ?? 0) + dx * k)) / 10; BG.figY = Math.round(10 * ((BG.figY ?? 0) + dy * k)) / 10;
        B.anim = deepHere() ? "swim" : "walk"; B.facing = face(dx, dy); B.turn = "";   // (ticket 199: swimming, in deep water)
        moved();
      }
    }
    if (phase === "in" && pit) { fallDown(pit, () => done()); return; }
    if (phase === "in" && lad && lad.down != null) {
      // (ticket 199) down a hatch's ladder: at its near edge, facing it, climbing down at ⬆'s pace,
      // out of sight below the edge (draw cuts them off there), then through to the room below
      for (const u of undo) u();
      BG.figX = Math.round(lad.x); BG.figY = Math.round(lad.down - 4 - SCENE.ground);
      B.facing = "back"; B.anim = "climbup"; padWant = null;
      climb = { place: climbPlace(BG), x: lad.x, z: lad.down - 4, top: lad.top, door: lad.door, hands: false, start: performance.now(), done: false, through: false, manual: true, got: 0, down: true, clip: lad.down };
      entering = false; tripPhase = "climbing down";
      let lastD = 0;
      const down = t2 => {
        const dt2 = lastD ? Math.min(0.1, (t2 - lastD) / 1000) : 0; lastD = t2;
        if (!climb || !climb.down || climb.going || state.body.anim !== "climbup") return;
        climb.got -= CLIMB_HAND * figureT.k * dt2; draw(); requestAnimationFrame(down);
      };
      changed(); requestAnimationFrame(down);
      return;
    }
    if (phase === "in" && lad) {
      // (ticket 173: at the ladder's foot, facing it, up it as the 🧗 chip climbs)
      for (const u of undo) u();
      BG.figX = Math.round(lad.x); BG.figY = Math.round(lad.z - SCENE.ground + 2);
      B.facing = "back"; B.anim = "climbup"; padWant = null;
      climb = { place: climbPlace(BG), x: lad.x, z: lad.z + 2, top: lad.top, door: lad.door, hands: lad.hands, start: performance.now(), done: false, through: false };
      entering = false; tripPhase = "climbing";
      changed();
      return;
    }
    if (phase === "in") {
      if (!tIn) { tIn = t; tripPhase = "stepping in"; }
      const u = Math.min(1, (t - tIn) / WALK_IN_MS);
      if (walk) { B.anim = deepHere() ? "swim" : "walk"; B.facing = face(ux, uy); B.turn = ""; }
      BG.figX = tx + ux * WALK_IN_STEP * u; BG.figY = ty + uy * WALK_IN_STEP * 0.6 * u;
      draw(); fade((1 - u).toFixed(2));   // (drawn now, not as moved() may, later: the fade goes on what is drawn)
      if (u >= 1) { done(); return; }
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const backBtn = document.getElementById("back");
const sceneName = kd => (TABS.find(t => t[1] === "background")[2][0][3].find(([v]) => v === kd) || [kd, kd])[1];
function backSync() {
  const last = trips[trips.length - 1], show = !!last && last.to === state.background.kind;
  backBtn.hidden = !show;
  if (show) {
    const name = sceneName(last.kind);
    backBtn.textContent = `⬅️ ${name.split(" ")[0]} back`;
    backBtn.title = "back to the " + name.replace(/^\S+\s/, "");
    backBtn.setAttribute("aria-label", backBtn.title);
  }
}
backBtn.addEventListener("click", () => {
  const last = trips[trips.length - 1];
  if (entering || !last) return;
  flyInto(backBtn.getBoundingClientRect(), () => {
    trips.pop();
    if (last.worldAt) worldEnter(last.worldAt, null, false);   // (ticket 185: back to the square left, its own things and paths)
    Object.assign(state.background, { kind: last.kind, figX: last.figX, figY: last.figY });
    if (last.inside) state.background.inside = last.inside;
    if (last.tent) state.background.tent = last.tent;
    if (last.castleRoom) state.background.castleRoom = last.castleRoom;
  });
});

showTab();
// (the divider's place again, now that the first picture is drawn and its shape known)
setSplit();
// (this version after the game's name, and a newer one offered when there is one: ticket 134)
showVersion();
