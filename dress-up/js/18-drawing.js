"use strict";
// (ticket 178) Part 18 of 26 of the game's script, run in order by index.html.

function draw() {
  const t = performance.now(), text = bgShown.text;
  drawNow();
  if (tripTimer) tripWork("drawing", t);   // (⏱️ a trip being timed)
  if (bgShown.text !== text) return;
  const ms = performance.now() - t;
  slowAvg = slowN ? 0.9 * slowAvg + 0.1 * ms : ms;
  if (++slowN < 30) return;
  const was = slowFlag;
  if (!slowFlag && slowAvg > SLOW_IN) slowFlag = true;
  else if (slowFlag && slowAvg < SLOW_OUT) slowFlag = false;
  if (slowFlag !== was) { try { localStorage.setItem("dress-up-slow", slowFlag ? "1" : "0"); } catch (e) { /* (for this visit) */ } setTimeout(changed, 0); }
}
// (the scene's drawing held still: its animations taken out, once for each text)
const ANIMS_RE = /<(animate|animateTransform|animateMotion|set)\b[^>]*?(\/>|>[\s\S]*?<\/\1>)/g;
let stillMemo = { in: null, out: null };
const stillScene = text => { if (text !== stillMemo.in) stillMemo = { in: text, out: text.replace(ANIMS_RE, "") }; return stillMemo.out; };
function drawNow() {
  const { face: F, body: B } = state;
  // (ticket 123) treading water: the strokes for now, on top of any pose
  // (ticket 132: any animation from the Body tab, the same way; `tread` is only treading in water)
  const move = moveNow(), tread = move && move.water ? move : null;
  const poseT = (what, side) => poseOf(B, what, side) + (move ? move[what + (side > 0 ? "L" : "R")] || 0 : 0);
  // (ticket 124) which way they face (0 toward us; -1, 1 in profile to our
  // left or right), and whether they sit. In profile the friend is narrower,
  // their arms and legs come from under the shoulder and hip, and point the
  // way they face; the side nearer us is their -dir side (facing our right,
  // their right shoulder is toward us)
  const dir = facingOf(B), sitting = !!B.sit || B.pose === "hug";   // (ticket 136: a hug's legs are a sitter's)
  const q = dir ? 0 : turnOf(B);   // (ticket 144: turned partway, the far side's sign)
  // (ticket 138) facing away from us: drawn as facing us (dir 0), but the
  // back of the head is hair, with no face on it, and what is on their back
  // (wings, a tail) is in front of them
  const away = B.facing === "back";
  let { shirt: SH, pants: P } = state;
  const skin = F.color, skinLine = darker(skin);
  // A costume: a suit is fur over everything below the hood; a falcon is
  // wings and a tail over the clothes.
  const C = costumeOn(), kind = state.costume.kind, suit = C && ANIMALS[kind].suit;
  const limb = suit ? C.fur : skin, limbLine = suit ? darker(C.fur) : skinLine;
  // A witch: a long dress -- long sleeves, a long skirt with a ragged hem
  // -- in the hat's color with a spider web on it; striped stockings; a
  // pointed hat; and, if chosen, a cat on her shoulder and a broom in her
  // hand. Her own hair and face show.
  const witch = kind === "witch", WC = state.costume, fairy = kind === "fairy";
  // (a fairy: her tunic in its style's color, and the style's pattern)
  const fTunic = FAIRY_TUNICS[WC.tunicStyle] ? WC.tunicStyle : "petal", fCol = WC["tunicColor_" + fTunic] ?? FAIRY_TUNICS[fTunic].colors[0];
  const fWing = FAIRY_WINGS[WC.wingStyle] ? WC.wingStyle : "butterfly", fWingCol = WC["wingColor_" + fWing] ?? FAIRY_WINGS[fWing].colors[0];
  // (her brim covers her hair: as wide as its widest reach and 14 more,
  // up to 300; and the hair above the brim is inside the hat, unseen)
  const brimRx = witch ? Math.min(300, Math.max(128, hairReach(state.hair).half + 14)) : 128;
  // (y: the brim's line where the hair is drawn: 40 in the hair's own
  // units, stretched with the head; the bangs give it in the face's)
  const tucked = (inner, id, y = 40) => witch ? `<clipPath id="${id}"><rect x="-4000" y="${f1(y)}" width="8200" height="8000"/></clipPath>` +
                                        `<g clip-path="url(#${id})">${inner}</g>` : inner;
  // (her web is tiled all over the dress, or "a few" separate webs on it,
  // as the Hazel slide draws them)
  const fewWebs = witch && WC.webStyle === "few", webPat = fewWebs ? "plain" : "web";
  if (witch) {
    SH = { ...SH, style: "long", color: WC.witchColor, pattern: webPat, patternSize: 96, patternColor: WC.webColor };
    P = { ...P, style: "dress", skirtLen: 72, color: WC.witchColor, pattern: webPat, patternSize: 96, patternColor: WC.webColor };
  }
  if (fairy) {
    const pat = fTunic === "toadstool" ? { pattern: "dots", patternSize: 34, patternColor: "#ffffff" } : fTunic === "sparkle" ? { pattern: "stars", patternSize: 26, patternColor: "#fde047" } : { pattern: "plain" };
    SH = { ...SH, style: "tank", color: fCol, ...pat };
    // (in a dress; or a shirt and pants: her tunic top over pants a shade
    // deeper, its hem a short frill at her hips, see below)
    P = WC.fairyOutfit === "pants" ? { ...P, style: "pants", color: mix(fCol, "#000000", 0.28), pattern: "plain" }
                                   : { ...P, style: "dress", skirtLen: 58, color: fCol, ...pat };
  }
  const w = dir ? SH.width * 0.62 : q ? SH.width * 0.84 : SH.width, L = SH.length;
  const nw = Math.max(22, B.neckW / 2 + 6);           // the collar fits the neck

  // ARMS: from each shoulder, at the arms angle, to a hand. (ticket 99)
  // Each bends at its elbow, halfway: the forearm turned from the upper
  // arm by the elbows' bend (+ up, - down; both arms alike, mirrored), the
  // hand at the forearm's angle. Unbent (0), an arm is one straight line.
  // (ticket 121) An arm posed on its own turns and bends by its own pose
  // on top of the sliders' (poseOf), and is always drawn through its elbow.
  const a = B.arms * Math.PI / 180, armLen = B.armLen, armW = B.armW, elbow = B.elbows ?? 0, eb = elbow * Math.PI / 180;
  // (in profile, both from the shoulder and to the front, `out`, the far one
  // held a little higher so both show)
  const arms = [1, -1].map(side => {
    // (turned partway, the far shoulder a little in: ticket 144)
    const A = dir ? [-dir * 3, 8] : [side * (w - (side === q ? 14 : 6)), 8], out = dir || side;
    const turn = B.arms + poseT("Arm", side) + (dir ? (side === dir ? -14 : 4) : 0), bend = elbow + poseT("Elbow", side);
    if (!dir && turn === B.arms && bend === elbow) {
      if (!eb) return { side, out, A, H: [A[0] + side * armLen * Math.cos(a), A[1] + armLen * Math.sin(a)],
                        angle: side > 0 ? B.arms : 180 - B.arms, joints: null };
      const E = [A[0] + side * armLen / 2 * Math.cos(a), A[1] + armLen / 2 * Math.sin(a)];
      const H = [E[0] + side * armLen / 2 * Math.cos(a - eb), E[1] + armLen / 2 * Math.sin(a - eb)];
      return { side, out, A, E, H, angle: side > 0 ? B.arms - elbow : 180 - B.arms + elbow, joints: [A, E, H] };
    }
    const ta = turn * Math.PI / 180, fa = (turn - bend) * Math.PI / 180;
    const E = [A[0] + out * armLen / 2 * Math.cos(ta), A[1] + armLen / 2 * Math.sin(ta)];
    const H = [E[0] + out * armLen / 2 * Math.cos(fa), E[1] + armLen / 2 * Math.sin(fa)];
    return { side, out, A, E, H, angle: out > 0 ? turn - bend : 180 - turn + bend, joints: [A, E, H] };
  });
  // (in profile, the arm on our side is in front of the body, the other behind)
  // (turned partway, as in profile: the far arm wholly behind, the near one in front: ticket 144)
  const back = dir || q;
  const farArms = back ? arms.filter(x => x.side === back) : arms, nearArms = back ? arms.filter(x => x.side === -back) : arms;
  // an arm's joints (shoulder, elbow, hand; or shoulder and hand), and its
  // sleeve's: the share `f` of the arm's length from the shoulder, round the elbow
  const armJoints = arm => arm.joints || [arm.A, arm.H];
  const alongArm = (arm, f) => {
    if (!arm.joints) return [arm.A, [arm.A[0] + (arm.H[0] - arm.A[0]) * f, arm.A[1] + (arm.H[1] - arm.A[1]) * f]];
    const { A, E, H } = arm;
    return f <= 0.5 ? [A, [A[0] + (E[0] - A[0]) * 2 * f, A[1] + (E[1] - A[1]) * 2 * f]] : [A, E, [E[0] + (H[0] - E[0]) * (2 * f - 1), E[1] + (H[1] - E[1]) * (2 * f - 1)]];
  };
  // no clothes: underwear or a swimsuit instead of the shirt and pants
  // (a full animal suit still covers everything)
  const U = state.undies, undies = U.on && !suit && !witch && !fairy;
  const sleeve = suit ? 0.97 : undies ? 0 : { tee: 0.38, long: 0.95, tank: 0 }[SH.style];

  // PANTS: their hips under the shirt's hem, their feet under the legs.
  // (ticket 99) Each leg bends at its knee, halfway: bent, the knees go out
  // and the feet stay under the hips, the thigh and the shin each leaning
  // half the knees' bend, so the legs reach less far down and the friend
  // crouches (lower on the ground by as much). Unbent (0), a leg is straight.
  // (ticket 121) A leg posed on its own: its thigh turned out from straight
  // down by half the knees' bend and its own turn, its shin back in by the
  // knees' bend and its own; then the feet need not be level, and the
  // friend stands on the lower (feetY).
  const knee = (B.knees ?? 0) * Math.PI / 360;
  const hw = w - 2, LL = B.legLen, fx = dir ? 3 : hw / 2 + 6;
  // (the legs by a pose: posed or not, and each leg's joints)
  // (ticket 124) Sitting: facing us, the thighs come toward us, so they are
  // drawn short (`thigh`), the knees a little apart and the shins straight
  // down; in profile the thighs go forward, level, and the shins hang down.
  // In profile a knee bends forward, the way the friend faces.
  const legBase = { t0: sitting ? (dir ? 88 : 10) : (B.knees ?? 0) / 2, b0: sitting ? (dir ? 88 : 10) : (B.knees ?? 0), thigh: sitting && !dir ? 0.3 : 1 };
  // (ticket 140: a step toward us or away shortens the leg from the hip, as seen)
  const stepOf = (pose, side) => (dir ? 0 : Math.max(0, Math.min(0.6, pose("Step", side) || 0)));
  const foreshort = (joints, k) => (k ? joints.map(([x, y], i) => (i ? [x, L + (y - L) * (1 - k)] : [x, y])) : joints);
  const bonesBy = pose => { const posed = !!dir || sitting || [1, -1].some(side => pose("Leg", side) || pose("Knee", side) || stepOf(pose, side));
    return { posed, bones: [1, -1].map(side => {
      const Hp = [side * fx, L], out = dir || side;
      if (!posed) { const fy = knee ? L + LL * Math.cos(knee) : L + LL;
        return { side, out, joints: knee ? [Hp, [side * (fx + LL / 2 * Math.sin(knee)), L + LL / 2 * Math.cos(knee)], [side * fx, fy]] : [Hp, [side * fx, fy]] }; }
      const tt = (legBase.t0 + pose("Leg", side)) * Math.PI / 180, st = tt - (legBase.b0 + pose("Knee", side)) * Math.PI / 180;
      const K = [Hp[0] + out * LL / 2 * legBase.thigh * Math.sin(tt), Hp[1] + LL / 2 * legBase.thigh * Math.cos(tt)];
      return { side, out, joints: foreshort([Hp, K, [K[0] + out * LL / 2 * Math.sin(st), K[1] + LL / 2 * Math.cos(st)]], stepOf(pose, side)) };
    }) }; };
  const { posed: legPosed, bones: legBones } = bonesBy(poseT);
  const legOf = side => legBones[side > 0 ? 0 : 1];
  const footAt = side => legOf(side).joints[legOf(side).joints.length - 1];
  const feetY = Math.max(footAt(1)[1], footAt(-1)[1]);
  const kneeAt = side => { const J = legOf(side).joints; return J.length > 2 ? J[1] : [(J[0][0] + J[1][0]) / 2, (J[0][1] + J[1][1]) / 2]; };
  const legJoints = side => legOf(side).joints;
  // each pants leg is wide enough for the leg inside it
  const half = Math.max(hw / 2, B.legW / 2 + 6);
  const shoeSc = state.shoes.size / 100;
  const standOn = (fy, kneeY) => Math.max(fy + (state.shoes.style === "bare" ? 18 : 30) * shoeSc, kneeY);
  // (treading, they float where they would stand: the ground of their legs
  // as posed, not as they kick, or every kick would jolt them up and down)
  // (ticket 141: a crouch and a jump stand on their feet as bent: grounded)
  const still = move && !move.rot && !move.grounded && bonesBy((what, side) => poseOf(B, what, side));
  const ground = still ? standOn(Math.max(...still.bones.map(l => l.joints[l.joints.length - 1][1])), still.posed ? Math.max(...still.bones.map(l => l.joints[1][1])) + B.legW / 2 : -Infinity)
                       : standOn(feetY, legPosed ? Math.max(kneeAt(1)[1], kneeAt(-1)[1]) + B.legW / 2 : -Infinity);   // (or kneels, a knee lowest)
  poseJoints = { armLen, LL, armW, legW: B.legW, legBase,
                 arms: arms.map(x => ({ side: x.side, out: x.out, A: x.A, H: x.H, E: x.E || [(x.A[0] + x.H[0]) / 2, (x.A[1] + x.H[1]) / 2] })),
                 legs: legBones.map(l => ({ side: l.side, out: l.out, H: l.joints[0], K: kneeAt(l.side), F: footAt(l.side) })),
                 handR: Math.min(80, 0.7 * Math.max(handReach(state.hands), handReach(rightHandOf(state.hands)))),
                 footR: Math.min(90, 0.7 * Math.max(footReach(state.shoes), footReach(rightShoeOf(state.shoes))) * shoeSc) };

  // HEAD: its chin on the top of the neck.
  const neckTop = -20 - B.neck;
  const s = F.size / 80;
  const ty = neckTop + 6 - (headChin(F) - 4) * s, tx = -100 * s;
  faceFrame = { tx, ty, s };
  // (ticket 124: in profile the hair sits toward the back of the head, in the face's units)
  const side = dir && !C ? sideHair(state.hair, F, dir) : null;

  // The picture's frame grows to hold everything.
  const handYs = arms.map(x => x.H[1]);
  // each hand's own reach past the end of its arm: big mittens and long
  // fingers stuck out of the frame (and out of the saved picture)
  // (a falcon suit's wing reaches past the hand by about an arm's length)
  // (either hand's: the left may wear its own style)
  const reach = BIRD_SUIT[kind] ? B.armLen * 1.4 + 50
    : (suit ? handReach(suitHands(C, kind))
            : Math.max(handReach(state.hands), handReach(rightHandOf(state.hands)))) + 12;
  // room for big hair on a tall head, a lid blown far off, and candy
  // and hair, stretched with the head (it hangs and spreads in face units)
  const hr = C ? { top: 0, bottom: 0, half: 0 } : hairReach(state.hair);
  const hairY = y => HEAD_C + (y - HEAD_C) * headH(F);
  const flying = F.burst > 0 ? idiv(F.burst * 7, 10) + idiv(F.burst * 4, 10) + 40 : 0;   // see topFlies
  const faceTop = Math.min(-90, HEAD_C - 175 * headH(F), headCrown(F) + 50.6 - 1.4 * F.burst - 40,
                           hairY(hr.top) - 40 - flying, (C ? (kind === "deer" ? -140 : -90) : 0) - flying,
                           witch ? hairY(-130) - 20 - flying : 0);
  // (a broom stands 120 above the hand that holds it, its bristles 66 below)
  const broomH = witch && WC.broom ? arms[0].H : null;
  // (and a cat on the shoulder, 64 above where it sits and 42 below, its
  // tail out 34 to the side, all times its size)
  const kb = (state.costume.broomSize ?? 100) / 100, catK = witch && WC.witchCat ? (WC.catSize ?? 100) / 100 : 0;
  // (posed limbs: room for their elbows, knees and feet wherever they went)
  const armPosed = [1, -1].some(side => poseT("Arm", side) || poseT("Elbow", side));
  const posedYs = [...(armPosed ? arms.filter(x => x.E).map(x => x.E[1] - armW - 20) : []), ...(legPosed ? legBones.flatMap(l => l.joints.slice(1)).map(([, y]) => y - B.legW - 40) : [])];
  let top = Math.min(ty + faceTop * s, ...handYs.map(y => y - Math.max(40, reach)), broomH ? broomH[1] - 140 * kb : 0, ...posedYs,
                       catK ? -9 - 70 * catK : 0);
  const pileP = F.sick > 100 ? 100 + (F.sick - 100) / 2 : F.sick > 30 ? (F.sick - 30) * 100 / 70 : 0;
  const pileRx = (6 + pileP * 84 / 100) * 1.6 * s;
  // and a long skirt or dress, which can reach past the feet
  const skirtHem = !suit && !undies && (P.style === "skirt" || P.style === "dress")
    ? L + (feetY - L) * (P.skirtLen ?? 50) / 100 + 30 : 0;
  const toesDown = suit || witch ? 0 : feetY + Math.max(footDown(state.shoes), footDown(rightShoeOf(state.shoes))) * shoeSc + 12;
  let bottom = Math.max(ground + 24, toesDown, ty + hairY(hr.bottom) * s + 16, ...handYs.map(y => y + reach), skirtHem,
                          broomH ? broomH[1] + 140 * kb : 0, catK ? -9 + 46 * catK : 0);
  const hairHalf = hr.half * headWidth(F) * (1 + 0.12 * F.alien / 100) * s;
  let left = Math.min(-200, C ? -(w + 185) : -200, fairy ? -(w + 270) : -200, ...arms.map(x => x.H[0] - Math.max(40, reach)), ...arms.map(x => -x.H[0] - Math.max(40, reach)),
                        ...arms.filter(x => x.E).map(x => -Math.abs(x.E[0]) - armW - 20), knee ? -Math.abs(kneeAt(1)[0]) - B.legW - 30 : 0,
                        ...(legPosed ? legBones.flatMap(l => [-Math.abs(l.joints[1][0]) - B.legW - 30, -Math.abs(l.joints[2][0]) - 60 - Math.max(footReach(state.shoes), footReach(rightShoeOf(state.shoes))) * shoeSc]) : []),
                        -(fx + half + 70), -(fx + (witch ? FOOT_REACH.witchboot : Math.max(footReach(state.shoes), footReach(rightShoeOf(state.shoes)))) * shoeSc + 20), -(w + 40), -(pileRx + 20), -(B.neckW / 2 + 40), -(hairHalf + 20),
                        -((80 + (C ? (kind === "deer" ? 60 : 30) : witch ? brimRx - 80 : 0)) * headWidth(F) * (1 + 0.12 * F.alien / 100) * s + 20),
                        broomH ? -(Math.abs(broomH[0]) + 60 * kb) : 0,
                        catK ? -(w - 4) - 24 * catK : 0, catK ? -(-(w - 4) + 40 * catK) : 0);
  // A background is a stage of its own, the same whatever the figure
  // (SCENE): the frame the usual figure gets in a scene. The figure stands
  // on its ground by its feet, at its size and where it was dragged, so
  // changing the figure never moves it or the scenery (fitting the scene
  // to the figure did: a taller face slid the figure sideways). A figure
  // grown past the stage's edges is cut off there; its size slider brings
  // it back.
  const scened = state.background.kind !== "none";
  naturalFrame = { left, top, ground };
  if (scened) ({ left, top, bottom } = SCENE);
  const width = -2 * left;

  // VISIBILITY: each part of the body as see-through as its slider says
  // (100 all there, 0 gone). A part is drawn in layers between other
  // parts' (the shirt's arms under the hair, and again over the face):
  // each layer is see-through on its own, and masked where a later layer
  // of the same part covers it (see unveil), so a ghost's arm is no less
  // see-through where its two layers overlap. A layer is added from where
  // the picture's text was (`at`) to its end.
  const seen = visibility(), layers = {};
  // (a part following an LFO fades with its wave, never past its slider;
  // the animation picks up where the wave is now, so a redraw keeps time)
  const pic0 = document.getElementById("pic"), tNow = pic0 && pic0.getCurrentTime ? pic0.getCurrentTime() : 0;
  const veil = (g, inner) => {
    const a = seen[g], lf = visLfo(g);
    if ((a >= 1 && !lf) || !inner) return inner;
    if (a <= 0) return "";
    const n = layers[g] = (layers[g] ?? 0) + 1;
    let anim = "", shown = a;
    // (an LFO too fast to show: the part held at its average, LFO_BLUR)
    if (lf && lf.dur < LFO_BLUR) shown = a * (1 - lf.amp / 2);
    else if (lf) {
      const N = 16, vals = [], kt = [];
      for (let i = 0; i <= N; i++) { const u = i / N; vals.push((a * (1 - lf.amp * (1 - lfoWave(lf.shape, u)) / 2)).toFixed(3)); kt.push(u.toFixed(4)); }
      anim = `<animate attributeName="opacity" values="${vals.join(";")}" keyTimes="${kt.join(";")}" dur="${lf.dur.toFixed(4)}s" begin="${(tNow - lf.phase * lf.dur).toFixed(4)}s" repeatCount="indefinite"/>`;
    }
    return `<g opacity="${shown.toFixed(2)}" data-veil="${g} ${n}">${anim}<g id="veil-${g}-${n}">${inner}</g></g>`;
  };
  const veilFrom = (g, at) => { svg = svg.slice(0, at) + veil(g, svg.slice(at)); };
  const meanSeen = Object.values(seen).reduce((x, y) => x + y, 0) / VISIBLE_PARTS.length;

  let svg = `<defs>${patternDef("pat-shirt", SH.color, SH.pattern, SH.patternSize, SH.patternColor)}${patternDef("pat-pants", P.color, P.pattern, P.patternSize, P.patternColor)}` +
            `${patternDef("pat-undies", U.color, U.pattern, U.patternSize, U.patternColor)}${C ? furDefs(C, kind) : ""}</defs>`;
  // the background first, behind everything, its ground at the feet
  const BG = state.background;
  // (kept under the scene's own options, read as it was drawn: the
  // figure's sliders draw no scenery again; see part above)
  // (ticket 185) after the place, its things and the world square's ways out,
  // each a piece cached on what it holds: outside the place's own cache,
  // which compares the settings it read by identity, so a thing changed in
  // place (moved, turned, its leaves) would draw nothing new inside it
  const bgFull = scened ? partByReads(`scene:${BG.kind}`, sceneOpts(BG), o => backgroundSvg(BG.kind, left, top, -left, bottom, SCENE.ground, o)) +
                          thingsLayer({ o: BG, F: [left, top, -left, bottom, SCENE.ground] }) + worldWaysSvg(BG, left, top, -left, bottom, SCENE.ground) : null;
  const sceneStill = sceneryStill(), bgText = bgFull && sceneStill ? stillScene(bgFull) : bgFull;   // (ticket 164: held still on a slow computer)
  if (document.body.classList.contains("still-scenery") !== sceneStill) document.body.classList.toggle("still-scenery", sceneStill);
  // and in a scene, the figure's feet (its ground, g) on the stage's
  // ground (sg), at its own size about them, where it was dragged
  // (a joint held: the ground the friend stood on when it was grabbed)
  // (in water, the friend is in it: their waterline, the waist or in a
  // stream the knees, is where they stand on the water's surface, and what
  // is below it sinks into the water, see-through (wading, below))
  // (treading, they are in deeper: the water up to half an arm below the
  // shoulders, so even short arms sweep under it, never above the
  // shoulders, never below the waist; Matthew: the arms should be in the water)
  // (ticket 245: on a rope bridge, outside the tree house, high over the stream: never in it)
  if (scened) bridgeKeep();
  // (ticket 269: on a house's platform, on the way in from its ladder, as on a bridge)
  const onBr = scened ? bridgeNow() || platformNow() : null;
  const wet = scened && !onBr && inWater(BG, BG.figX ?? 0, SCENE.ground + (BG.figY ?? 0)),
        wl = SHALLOW_WATER[BG.kind] ? (L + feetY) / 2 : tread ? Math.max(12, Math.min(L, 8 + 0.5 * armLen)) : L;
  const gStand = poseHeld && scened ? poseHeld.g : wet ? wl : ground;
  // (ticket 132) an animation lifts the friend (a step, a bound, a pull up
  // the ladder); crawling turns them about the hips (rot), and they rest on
  // the lowest of their hands, knees and feet as turned
  const rot = move && move.rot ? move.rot : 0;
  let gFig = gStand;
  if (rot) {
    const a = rot * Math.PI / 180, turned = ([x, y]) => L + x * Math.sin(a) + (y - L) * Math.cos(a);
    gFig = Math.max(...arms.map(x => turned(x.H) + 10), ...[1, -1].map(sd => turned(kneeAt(sd)) + B.legW / 2), ...[1, -1].map(sd => turned(footAt(sd)) + 8));
  } else if (move && move.lift && !wet && !poseHeld) gFig = gStand + move.lift;
  // (ticket 136) jumping up into a hug, they are held up off the ground
  // (their shadow stays on it); not in water, nor while a joint is held,
  // whose ground was kept as it was
  const hugLift = B.pose === "hug" && !rot && !wet ? LL * Math.max(0, Number(B.hugLift ?? 50) || 0) / 100 : 0;
  if (hugLift && !poseHeld) gFig += hugLift;
  const rotTf = rot ? ` rotate(${rot} 0 ${f1(L)})` : "";
  // (seated, sized by the seat's depth, not by where their feet hang: ticket 50)
  const sizeSeat = scened ? seatNow() : null;
  // (ticket 245) on a rope bridge: their feet on its deck, as tall as BRIDGE_TALL of the tree's units (times their
  // slider's share), whatever their shape
  figureT = onBr ? { k: (BG.figSize ?? 100) / 100 * BRIDGE_TALL * (onBr.W ? onBr.W.s * onBr.W.hz : onBr.s * onBr.hz) / Math.max(1, ground - neckTop + 90), dx: onBr.x, dy: onBr.y - SCENE.ground, g: gFig, sg: SCENE.ground }
          // (ticket 270: up the spiral staircase, their size the floor's straight below their step, not the screen's height)
          : scened ? { k: (BG.figSize ?? 100) / 100 * sceneFig(BG.kind) * depthSize(BG, sizeSeat ? sizeSeat.z - SCENE.ground : (BG.kind === "castleroom" && castleWallsOf(BG).stairs ? spiralFloorY(BG.figX ?? 0, BG.figY ?? 0) : null) ?? BG.figY ?? 0), dx: BG.figX ?? 0, dy: BG.figY ?? 0, g: gFig, sg: SCENE.ground }
                   : { k: 1, dx: 0, dy: 0, g: gFig === gStand ? ground : gFig + ground - gStand, sg: ground };
  sceneFrame = { left, top, right: -left, bottom, ground: figureT.sg, back: scened && SCENE_BACK[BG.kind] ? SCENE_BACK[BG.kind](top, bottom) : -Infinity };
  // (ticket 137) climbing a place's ladder: up it as time goes by (not while
  // dragged), at its depth (their feet are sorted there still), their
  // shadow left at its foot; to the top, or, up a doorway, till their head
  // is through. A new place ends a climb (and climbing, if it went through)
  if (climb && climb.place !== climbPlace(BG)) { if (climb.through) B.anim = "none"; climb = null; }
  let climbUp = 0;
  if (climb && !climb.none && B.anim === "climbup" && scened && !poseHeld && !drag) {
    const tall = (ground - neckTop + 90) * figureT.k, all0 = Math.max(0.4 * (climb.z - climb.top), climb.z - climb.top - (climb.door ? 0.55 * tall : climb.hands ? 0.85 * tall : 0));
    // (ticket 252: up through a ceiling's opening, on till the feet are past it, cut off above it as they go: no fade)
    const all = climb.clipUp != null && climb.door ? Math.max(all0, climb.z - climb.clipUp + 6) : all0;
    // (ticket 145: by hand, as far as the controller has taken them; through a doorway at its top)
    // (ticket 199: down a hatch's ladder, the lift goes below where they started, till they are out of sight, then through)
    const got = climb.down ? Math.min(0, climb.got) : climb.manual ? clamp(climb.got, 0, all) : Math.min(all, (performance.now() - climb.start) / 1000 * CLIMB_SPEED * figureT.k);
    climb.all = all; climb.at = got;
    if (climb.down) { if (got <= -tall && climb.door && !climb.going) { climb.going = true; setTimeout(climbThrough, 100); } }
    else if (climb.manual) { if (got >= all && climb.door && !climb.going) { climb.going = true; setTimeout(climbThrough, 250); } }
    else if (got >= all && !climb.done) { climb.done = true; if (climb.door) setTimeout(climbThrough, 250); }
    climbUp = got / figureT.k;
    figureT.g += climbUp;
  }
  svg += `<g id="figure" transform="translate(${f1(figureT.dx)} ${f1(figureT.dy + figureT.sg)}) scale(${figureT.k.toFixed(3)}) translate(0 ${f1(-figureT.g)})${rotTf}">`;
  // (ticket 42) on the tree house's swing they swing with its seat: the same
  // rotation about the same hook, at the same time, added to where they are
  // (the hook in their own units); not while a joint is held
  if (sizeSeat && sizeSeat.name === "swing" && BG.kind === "treehouse" && !poseHeld) {
    const ts = sizeSeat.x0 / 358, hx = 395 * ts, hy = sizeSeat.y - 274 * ts;
    const lx = (hx - figureT.dx) / figureT.k, ly = (hy - figureT.dy - figureT.sg) / figureT.k + figureT.g, at = `${f1(lx)} ${f1(ly)}`;
    svg += lfoTimed(BG, "slow", 0.15, `<animateTransform attributeName="transform" type="rotate" additive="sum" values="-14 ${at};14 ${at};-14 ${at}" dur="2.6s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>`);
  }
  if (meanSeen > 0 && !wet && !rot) svg += `<ellipse cx="0" cy="${f1(ground + hugLift + climbUp + (move && move.jump && !wet ? move.lift : 0))}" rx="${f1(hw + 70)}" ry="12" fill="#000" opacity="${(0.08 * meanSeen).toFixed(3)}"/>`;
  // (ticket 132) climbing: a ladder behind the friend, its rungs going down two a stride
  // (ticket 137: seen from the side, the ladder stands in front of them,
  // side on: its two rails nearly one behind the other, the far one a
  // little farther on and darker, and each rung seen end on, a short stub
  // between them)
  if (move && move.ladder != null && dir) {
    const x = dir * (hw + 20), x2 = x + dir * 9, top = -380, gap = 48, off = (move.ladder * 2 * gap) % gap;
    let t = `<g class="ladder"><line x1="${f1(x2)}" y1="${top}" x2="${f1(x2)}" y2="${f1(ground + 6)}" stroke="#5e3f24" stroke-width="7" stroke-linecap="round"/>`;
    for (let y = top + off; y < ground; y += gap) t += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x2)}" y2="${f1(y)}" stroke="#9c6b3d" stroke-width="7" stroke-linecap="round"/>`;
    svg += t + `<line x1="${f1(x)}" y1="${top}" x2="${f1(x)}" y2="${f1(ground + 6)}" stroke="#7a5230" stroke-width="9" stroke-linecap="round"/></g>`;
  } else if (move && move.ladder != null) {
    const x = hw + 26, top = -380, gap = 48, off = (move.ladder * 2 * gap) % gap;
    let t = `<g class="ladder"><line x1="${f1(-x)}" y1="${top}" x2="${f1(-x)}" y2="${f1(ground + 6)}" stroke="#7a5230" stroke-width="9" stroke-linecap="round"/>` +
            `<line x1="${f1(x)}" y1="${top}" x2="${f1(x)}" y2="${f1(ground + 6)}" stroke="#7a5230" stroke-width="9" stroke-linecap="round"/>`;
    for (let y = top + off; y < ground; y += gap) t += `<line x1="${f1(-x)}" y1="${f1(y)}" x2="${f1(x)}" y2="${f1(y)}" stroke="#9c6b3d" stroke-width="7" stroke-linecap="round"/>`;
    svg += t + "</g>";
  }
  const figAt = svg.length;
  // behind everything: long hair's back layer, in the face's frame
  if (!C && !dir && !away) svg += veil("hair", `<g transform="translate(${f1(tx)} ${f1(ty)}) scale(${s.toFixed(4)})">` +
                 `<g transform="${topFlies(F)}"><g transform="${hairStretch(F)}">${tucked(hairBackSvg(state.hair), "under-hat-back")}</g></g></g>`);

  // behind everything: a falcon's wings and tail, or a suit's tail
  // (a bald eagle's: plain dark brown wings and a white tail)
  // (wings go with the shirt, the body; a tail with the pants, the hips)
  // (ticket 124: in profile, wings on the back are seen turned away from us,
  // in perspective: the near wing, the half that spreads behind them,
  // narrowed to under half, out from the back of the shoulders, and the far
  // one a little behind and above it, shaded; the half that spread toward
  // the face is hidden)
  const turnedAway = t => {
    if (!dir) return t;
    const half = `<clipPath id="wings-back"><rect x="${dir > 0 ? -4000 : 0}" y="-4000" width="4000" height="8000"/></clipPath><g clip-path="url(#wings-back)">${t}</g>`;
    return `<g transform="translate(${f1(-dir * (w * 0.55 + 10))} -10) scale(0.42 1)" opacity="0.8">${half.replace('id="wings-back"', 'id="wings-back-far"').replace("url(#wings-back)", "url(#wings-back-far)")}</g>` +
           `<g transform="translate(${f1(-dir * w * 0.55)} 0) scale(0.42 1)">${half}</g>`;
  };
  const backAt = svg.length;
  if (kind === "falcon") svg += veil("shirt", turnedAway(falconWings(C, w))) + veil("pants", falconTail(C, hw, L, LL));
  else if (kind === "eagle") svg += veil("shirt", turnedAway(falconWings(C, w, C.fur))) + veil("pants", falconTail(C, hw, L, LL, C.belly));
  else if (kind === "falconsuit") svg += veil("pants", falconTail(C, hw, L, LL, "url(#pat-fur)"));
  else if (kind === "eaglesuit") svg += veil("pants", falconTail(C, hw, L, LL, C.belly));
  // (a suit's tail swings out to our right; in profile, out behind them)
  else if (suit) svg += veil("pants", dir > 0 ? `<g transform="scale(-1 1)">${tailSvg(C, kind, hw, L)}</g>` : tailSvg(C, kind, hw, L));
  else if (fairy) svg += veil("shirt", turnedAway(fairyWingsSvg(fWing, fWingCol, w, L, WC.wingFlutter !== false, WC.wingLfo)));
  // (ticket 138: facing away, the wings and the tail are drawn last, over them)
  const onBack = away ? svg.slice(backAt) : "";
  if (away) svg = svg.slice(0, backAt);

  // legs, then shoes, then pants over both: long pants cover a boot's top
  // (the legs are the pants' to see through: invisible pants are
  // invisible legs, never bare ones)
  const legsAt = svg.length;
  // (in profile, the far leg first, then the one on our side)
  const legOrder = dir ? [dir, -dir] : [1, -1];
  // (ticket 136, a hug) in a place, turned sideways and not in water, the
  // far leg (its skin, stocking, shoe and pants leg) is drawn apart with the
  // far arm (farDeep, below), a body's depth behind their feet: so a leg can
  // go behind someone they hug while the near one is in front. Otherwise
  // both legs are drawn here, exactly as before
  const feetOver = legPosed && [1, -1].some(side => footAt(side)[1] <= kneeAt(side)[1] + 12);
  const legApart = scened && dir && !wet && !feetOver;
  const legSides = legApart ? [-dir] : legOrder, farLeg = { skin: "", shoe: "", pants: "" };
  const legSkin = side => limbThrough(legJoints(side), B.legW, limb, limbLine);
  // (striped stockings)
  const stocking = side => legJoints(side).length > 2 ? `<path d="M${legJoints(side).map(([x, y]) => f1(x) + " " + f1(y)).join(" L")}" fill="none" stroke="${WC.trimColor}" stroke-width="${f1(B.legW)}" stroke-dasharray="9 9"/>`
                  : `<line x1="${f1(side * fx)}" y1="${f1(L)}" x2="${f1(side * fx)}" y2="${f1(feetY)}" stroke="${WC.trimColor}" ` +
             `stroke-width="${f1(B.legW)}" stroke-dasharray="9 9"/>`;
  for (const side of legSides) svg += legSkin(side);
  if (witch) for (const side of legSides) svg += stocking(side);
  if (legApart) farLeg.skin = legSkin(dir) + (witch ? stocking(dir) : "");
  veilFrom("pants", legsAt);
  const feet = BIRD_SUIT[kind] ? { style: "talons", size: state.shoes.size }
             : kind === "deer" ? { style: "hoof", size: state.shoes.size }
             : witch ? { style: "witchboot", size: state.shoes.size, color: WC.bootColor ?? "#1f1f22" }
             : fairy ? { style: "fairy-" + (FAIRY_SHOES.some(([v]) => v === WC.fairyShoes) ? WC.fairyShoes : "slipper"), size: state.shoes.size, color: WC.fairyShoeColor || FAIRY_SHOE_COLORS[0] }
             : suit ? { style: "paw", size: state.shoes.size, color: C.fur, pad: C.accent } : state.shoes;
  // (a falcon suit's talons are yellow, like a falcon's feet)
  // (with different feet, the friend's right foot, on our left, wears its own)
  const feetAt = svg.length;
  // (ticket 129) each foot turns about its ankle, as a hand does: both by
  // "👣 feet turn" (toes up +), and each by the pose's own turn, by side
  const shoeOf = side => {
    const [ax, ay] = footAt(side), turn = -(dir || side) * ((Number(B.feetTurn) || 0) + poseT("Foot", side));   // (an animation's too: ticket 132)
    const own = feet === state.shoes && side < 0 ? rightShoeOf(feet) : feet;
    // (ticket 140: walking toward us or away, the friend's own sneakers or bare feet seen front on, or from behind)
    if (move && move.frontFeet && !dir && feet === state.shoes && FRONT_FEET[own.style])
      return footFront(ax, ay, side, own, skin, away, Math.min(1, poseT("Step", side) / move.frontFeet));
    const shoe = shoeSvg(ax, ay, dir || side, own, BIRD_SUIT[kind] ? C.accent : skin);
    return turn ? `<g transform="rotate(${f1(turn)} ${f1(ax)} ${f1(ay)})">${shoe}</g>` : shoe;
  };
  for (const side of legSides) svg += shoeOf(side);
  if (legApart) farLeg.shoe = shoeOf(dir);
  veilFrom("feet", feetAt);
  // (ticket 129) a foot resting up on the other leg, as cross-legged, is
  // drawn over the pants, after them (feetOver, above)
  const feetLater = feetOver ? svg.slice(feetAt) : "";
  if (feetOver) svg = svg.slice(0, feetAt);
  const pf = suit ? "url(#pat-fur)" : fillOf("pat-pants", P.color, P.pattern);
  const ps = suit ? darker(C.fur) : darker(P.color);
  const pantsAt = svg.length;
  if (undies) {
    // no clothes: plain skin from the waist to the tops of the legs, and
    // over it the underwear or swimsuit bottom
    // (ticket 128: on posed or bent legs, both follow each thigh, as pants
    // do; straight, they are drawn exactly as before)
    const fitted = legPosed || knee;
    // a point t down a leg from its hip (no farther than its knee), and the
    // way out across the thigh there
    const legFrame = (side, t) => {
      const J = legJoints(side), K = kneeAt(side), u = Math.min(t, LL / 2) / (LL / 2);
      const dx = K[0] - J[0][0], dy = K[1] - J[0][1], l = Math.hypot(dx, dy) || 1;
      return { p: [J[0][0] + dx * u, J[0][1] + dy * u], n: [side * dy / l, -side * dx / l] };
    };
    // facing us: an outline from the waist down each thigh to len, w half
    // as wide there, up to the crotch (rising as the thighs turn up)
    const shortLegs = (len, crotch, w, top, waist, wIn = w, lenIn = len) => {
      const td = Math.max(0.2, Math.min(...[1, -1].map(side => (kneeAt(side)[1] - L) / (LL / 2))));
      const edge = (side, t, ww) => { const { p, n } = legFrame(side, t); return [p[0] + n[0] * ww, p[1] + n[1] * ww]; };
      return [[-waist, top], [waist, top], edge(1, len, w), edge(1, lenIn, -wIn), [0, L + crotch * td], edge(-1, lenIn, -wIn), edge(-1, len, w)];
    };
    // in profile: the hips, rounded at the seat, and a band down each thigh
    // to len, the far one first, as profile pants are drawn
    const hipsSide = (fill, line, tall = half * 1.4) => `<rect x="${f1(-hw - 2)}" y="${f1(L - 10)}" width="${f1(2 * hw + 4)}" height="${f1(10 + tall)}" rx="${f1(Math.min(half * 0.7, (10 + tall) / 2))}" fill="${fill}"` +
                                                       (line ? ` stroke="${line}" stroke-width="2.5"/>` : `/>`);
    const sideLegs = (len, w, fill, line) => { const band = side => { const { p } = legFrame(side, len), H = legJoints(side)[0];
        const d = `M${f1(H[0])} ${f1(H[1])} L${f1(p[0])} ${f1(p[1])}`;
        return `<path d="${d}" fill="none" stroke="${line}" stroke-width="${f1(2 * w + 5)}"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${f1(2 * w)}"/>`; };
      if (legApart) farLeg.pants += band(dir);   // (ticket 136: the far one apart)
      return legSides.map(band).join(""); };
    svg += !fitted ? poly([[-hw, L - 10], [hw, L - 10], [fx + half, L + 34], [fx - half, L + 34], [0, L + 14],
                           [-(fx - half), L + 34], [-(fx + half), L + 34]], limb, limbLine)
         : dir ? hipsSide(limb, limbLine)
         : poly(shortLegs(34, 14, half, L - 10, hw), limb, limbLine);
    svg += undiesBottom(U, hw, fx, half, L, LL, fitted ? { dir, shortLegs, hipsSide, sideLegs } : null);
  } else if (!suit && (P.style === "skirt" || P.style === "dress")) {
    // a skirt flares a little; a dress flares more as it gets longer and
    // has a scalloped hem. The length is a share of the legs' length.
    const sl = (feetY - L) * (P.skirtLen ?? 50) / 100;
    if (P.style === "skirt")
      svg += `<path d="M${-hw} ${L - 10} L${hw} ${L - 10} L${f1(hw + 30)} ${f1(L + sl)} Q0 ${f1(L + sl + 14)} ${f1(-hw - 30)} ${f1(L + sl)} Z" ` +
             `fill="${pf}" stroke="${ps}" stroke-width="2.5" stroke-linejoin="round"/>`;
    else {
      const fl = hw + 26 + sl * 0.25, n = witch ? 9 : fairy ? 7 : 6;
      // (a toadstool's white frill peeps out under its hem)
      if (fairy && fTunic === "toadstool") {
        let fr = `M${f1(-fl - 6)} ${f1(L + sl - 6)}`;
        for (let i = 0; i < 12; i++) { const xa = -fl - 6 + (2 * fl + 12) * i / 12, xb = -fl - 6 + (2 * fl + 12) * (i + 1) / 12; fr += ` Q${f1((xa + xb) / 2)} ${f1(L + sl + 26)} ${f1(xb)} ${f1(L + sl - 6)}`; }
        svg += `<path d="${fr} Z" fill="#fffaf0" stroke="#d6cfc0" stroke-width="2"/>`;
      }
      let d = `M${-hw} ${L - 10} L${hw} ${L - 10} L${f1(fl)} ${f1(L + sl)}`;
      for (let i = 1; i <= n; i++) {
        const x0 = fl - (i - 1) * 2 * fl / n, x1 = fl - i * 2 * fl / n;
        // (a witch's hem is ragged: points, not scallops; a fairy's is her
        // tunic's: petals, leaves, bells, a sparkly zigzag, a toadstool's)
        d += witch ? ` L${f1((x0 + x1) / 2)} ${f1(L + sl + 18)} L${f1(x1)} ${f1(L + sl)}`
           : fairy ? fairyHem(fTunic, x0, x1, L + sl)
                   : ` Q${f1((x0 + x1) / 2)} ${f1(L + sl + 16)} ${f1(x1)} ${f1(L + sl)}`;
      }
      svg += `<path d="${d} Z" fill="${pf}" stroke="${ps}" stroke-width="2.5" stroke-linejoin="round"/>`;
      // a few webs on the skirt: two side by side, a smaller one below
      if (fewWebs)
        svg += spiderWeb(-0.5 * fl, L + 0.42 * sl, 0.24 * fl, WC.webColor) + spiderWeb(0.5 * fl, L + 0.42 * sl, 0.24 * fl, WC.webColor) +
               spiderWeb(0, L + 0.8 * sl, 0.18 * fl, WC.webColor);
    }
  } else {
    const len = !suit && P.style === "shorts" ? LL * 0.38 : LL;
    // (bent legs: each pants leg follows its thigh and, past the knee, its
    // shin, as wide across as it is when straight)
    const crotch = Math.min(len * 0.3, 40) * Math.cos(knee), wd = half / Math.cos(knee);
    const legEdge = (side, t) => { const [hx, hy] = [side * fx, L], [kx, ky] = kneeAt(side);
      return t <= LL / 2 ? [hx + (kx - hx) * t / (LL / 2), hy + (ky - hy) * t / (LL / 2)] : [kx + (side * fx - kx) * (t - LL / 2) / (LL / 2), ky + (feetY - ky) * (t - LL / 2) / (LL / 2)]; };
    const legSide = side => { const end = legEdge(side, len), mid = len > LL / 2 ? [kneeAt(side)] : [];
      return { out: [...mid.map(([x, y]) => [x + side * wd, y]), [end[0] + side * wd, end[1]]], in: [[end[0] - side * wd, end[1]], ...mid.map(([x, y]) => [x - side * wd, y])] }; };
    // (ticket 121: legs posed on their own, each pants leg along its own
    // thigh and shin, as wide across them as when straight, mitred round
    // the knee; the crotch rises as the thighs turn up)
    const along = (J, t) => t <= LL / 2 ? [J[0][0] + (J[1][0] - J[0][0]) * t / (LL / 2), J[0][1] + (J[1][1] - J[0][1]) * t / (LL / 2)]
                                        : [J[1][0] + (J[2][0] - J[1][0]) * (t - LL / 2) / (LL / 2), J[1][1] + (J[2][1] - J[1][1]) * (t - LL / 2) / (LL / 2)];
    const outward = (side, P0, P1) => { const dx = P1[0] - P0[0], dy = P1[1] - P0[1], l = Math.hypot(dx, dy) || 1; return [side * dy / l, -side * dx / l]; };
    const posedSide = side => { const J = legJoints(side), end = along(J, len), n1 = outward(side, J[0], J[1]), n2 = outward(side, J[1], J[2]);
      const bentOn = len > LL / 2, d = Math.max(0.3, 1 + n1[0] * n2[0] + n1[1] * n2[1]), m = [(n1[0] + n2[0]) * half / d, (n1[1] + n2[1]) * half / d], ne = bentOn ? n2 : n1;
      return { out: [...(bentOn ? [[J[1][0] + m[0], J[1][1] + m[1]]] : []), [end[0] + ne[0] * half, end[1] + ne[1] * half]],
               in: [[end[0] - ne[0] * half, end[1] - ne[1] * half], ...(bentOn ? [[J[1][0] - m[0], J[1][1] - m[1]]] : [])] }; };
    const thighsDown = Math.max(0.2, Math.min(...[1, -1].map(side => (legJoints(side)[1][1] - L) / (LL / 2))));
    const legs = legPosed ? [[-hw, L - 10], [hw, L - 10], ...posedSide(1).out, ...posedSide(1).in, [0, L + Math.min(len * 0.3, 40) * thighsDown],
                             ...posedSide(-1).in.slice().reverse(), ...posedSide(-1).out.slice().reverse()]
      : !knee ? [[-hw, L - 10], [hw, L - 10], [fx + half, L + len], [fx - half, L + len],
                          [0, L + Math.min(len * 0.3, 40)], [-(fx - half), L + len], [-(fx + half), L + len]]
      : [[-hw, L - 10], [hw, L - 10], ...legSide(1).out, ...legSide(1).in, [0, L + crotch],
         ...legSide(-1).in.slice().reverse(), ...legSide(-1).out.slice().reverse()];
    if (dir) {
      // (ticket 124) in profile: a pants leg along each thigh and shin, as
      // wide across as when straight, the far one first; then the hips over
      // their tops, rounded at the seat, and the hips again without their
      // outline, so no seam shows where the legs come out
      const hips = (line) => `<rect x="${f1(-hw - 2)}" y="${f1(L - 10)}" width="${f1(2 * hw + 4)}" height="${f1(10 + half * 1.4)}" rx="${f1(half * 0.7)}" fill="${pf}"` +
                             (line ? ` stroke="${ps}" stroke-width="2.5"/>` : `/>`);
      let t = hips(true);
      const pantsLeg = side => { const J = legJoints(side), end = along(J, len), Q = len > LL / 2 ? [J[0], J[1], end] : [J[0], end];
        const d = "M" + Q.map(([x, y]) => f1(x) + " " + f1(y)).join(" L");
        return `<path d="${d}" fill="none" stroke="${ps}" stroke-width="${f1(2 * half + 5)}" stroke-linejoin="round"/>` +
               `<path d="${d}" fill="none" stroke="${pf}" stroke-width="${f1(2 * half)}" stroke-linejoin="round"/>`; };
      for (const side of legSides) t += pantsLeg(side);
      if (legApart) farLeg.pants += pantsLeg(dir);   // (ticket 136: the far one apart)
      svg += t + `<g transform="translate(0 1.5)">${hips(false).replace(/x="([^"]+)"/, (_, x) => `x="${f1(Number(x) + 1.5)}"`).replace(/width="([^"]+)"/, (_, w) => `width="${f1(Number(w) - 3)}"`)}</g>`;
    } else svg += poly(legs, pf, ps);
    if (wrapStripes(C) && legPosed)   // (along each thigh and shin, as an arm's are)
      for (const side of [1, -1]) { const J = legJoints(side), end = along(J, len);
        const marks = len > LL / 2 ? limbStripes(J[0], J[1], 2 * half, C.marks, `leg-stripes${side}`, 14) + limbStripes(J[1], end, 2 * half, C.marks, `leg-stripes${side}b`, 0)
                                   : limbStripes(J[0], end, 2 * half, C.marks, `leg-stripes${side}`, 14);
        if (legApart && side === dir) farLeg.pants += marks; else svg += marks; }
    else if (wrapStripes(C)) svg += legStripes(legs, hw, fx, half, L, len, Math.min(len * 0.3, 40), C.marks);
  }
  // (ticket 124) sitting, facing us: the knees toward us, round, in the
  // pants or bare (none under a skirt or dress, which hides them)
  // (a crease across each pants knee; a bare knee, round. Two round knees
  // in pants looked like a seat, Matthew said)
  if (sitting && !dir && !away && (suit || undies || !(P.style === "skirt" || P.style === "dress"))) {
    const longPants = suit || (!undies && P.style !== "shorts");
    for (const side of [1, -1]) { const [kx, ky] = kneeAt(side);
      svg += longPants ? `<path d="M${f1(kx - half * 0.7)} ${f1(ky + 4)} Q${f1(kx)} ${f1(ky + 13)} ${f1(kx + half * 0.7)} ${f1(ky + 4)}" fill="none" stroke="${ps}" stroke-width="3" stroke-linecap="round"/>`
                       : `<ellipse cx="${f1(kx)}" cy="${f1(ky + 3)}" rx="${f1(B.legW / 2 + 1)}" ry="${f1((B.legW / 2 + 1) * 0.75)}" fill="${limb}" stroke="${limbLine}" stroke-width="2"/>`; }
  }
  veilFrom("pants", pantsAt);
  svg += feetLater;
  // a fairy in a shirt and pants: her tunic's hem, a short frill at her
  // hips over the pants, in her tunic's style (the shirt's to see through)
  if (fairy && WC.fairyOutfit === "pants" && !undies) {
    const sl = LL * 0.17, fl = hw + 14 + sl * 0.25, n = 7, tf0 = fillOf("pat-shirt", SH.color, SH.pattern), ts = darker(SH.color);
    let fr = "";
    if (fTunic === "toadstool") {
      let u = `M${f1(-fl - 5)} ${f1(L + sl - 5)}`;
      for (let i = 0; i < 12; i++) { const xa = -fl - 5 + (2 * fl + 10) * i / 12, xb = -fl - 5 + (2 * fl + 10) * (i + 1) / 12; u += ` Q${f1((xa + xb) / 2)} ${f1(L + sl + 20)} ${f1(xb)} ${f1(L + sl - 5)}`; }
      fr += `<path d="${u} Z" fill="#fffaf0" stroke="#d6cfc0" stroke-width="2"/>`;
    }
    let d = `M${-hw} ${L - 10} L${hw} ${L - 10} L${f1(fl)} ${f1(L + sl)}`;
    for (let i = 1; i <= n; i++) d += fairyHem(fTunic, fl - (i - 1) * 2 * fl / n, fl - i * 2 * fl / n, L + sl);
    svg += veil("shirt", fr + `<path d="${d} Z" fill="${tf0}" stroke="${ts}" stroke-width="2.5" stroke-linejoin="round"/>`);
  }

  // neck, behind the shirt so it shows in the collar
  // (the neck, the arms and the body are the shirt's to see through: an
  // invisible shirt is an invisible body, never a bare one)
  const bodyAt = svg.length;
  svg += `<rect x="${-B.neckW / 2}" y="${neckTop}" width="${B.neckW}" height="${B.neck + 44}" rx="4" ` +
         `fill="${limb}" stroke="${limbLine}" stroke-width="2.5"/>`;

  // arms, sleeves and shirt
  const sf = suit ? "url(#pat-fur)" : fillOf("pat-shirt", SH.color, SH.pattern);
  const ss = suit ? darker(C.fur) : darker(SH.color);
  // (a falcon suit's arms are inside its wings, drawn after the body)
  const winged = !!BIRD_SUIT[kind];
  const farAt = svg.length;
  if (!winged) for (const arm of farArms) svg += limbThrough(armJoints(arm), armW, limb, limbLine);
  // (a sleeve: the shirt's share of the arm, round the elbow)
  const sleeveOf = arm => alongArm(arm, sleeve);
  if (sleeve > 0 && !winged) for (const arm of farArms) svg += limbThrough(sleeveOf(arm), armW + 14, ss);
  // (a hand: with different hands, the friend's right hand, on our left when
  // they face us, wears its own style; one holding the broom is closed round
  // it, a round fist)
  const handOf = ({ side, out, H, angle }) => { const hands = suit ? suitHands(C, kind) : state.hands, own = !suit && side < 0 ? rightHandOf(hands) : hands;
    return handSvg(H[0], H[1], angle, out, broomH && side > 0 ? { ...own, style: "round" } : own, skin); };
  // (in profile, or turned partway, the far arm's sleeve over it, and its hand, behind the body)
  if ((dir || q) && !winged) {
    if (sleeve > 0) for (const arm of farArms) svg += limbThrough(sleeveOf(arm), armW + 9, sf);
    const farHandsAt = svg.length;
    for (const arm of farArms) svg += handOf(arm);
    veilFrom("hands", farHandsAt);
  }
  // (ticket 130) in a place, turned sideways and not in water, the far arm,
  // its sleeve and its hand are drawn apart from the rest of the friend, a
  // body's depth behind them among the place's things (draw, below): so an
  // arm can reach round someone they stand just in front of, for a hug
  const farDeep = scened && dir && !winged && !wet ? svg.slice(farAt) : "";
  if (farDeep) svg = svg.slice(0, farAt);
  // (ticket 138: from behind, a shirt's neckline is a shallow round one)
  const collar = { v: [[0, 18]], round: [[-nw * 0.7, -6], [0, -1], [nw * 0.7, -6]], flat: [] }[away && SH.collar === "v" ? "round" : SH.collar];
  const shoulder = !suit && SH.style === "tank" ? [[nw + 12, -20], [w, 30]] : [[w + 4, -6], [w, 44]];
  const torso = [[-nw, -20], ...collar, [nw, -20], ...shoulder, [w + 2, L], [-(w + 2), L],
                 ...shoulder.map(([x, y]) => [-x, y]).reverse()];
  const bareBody = [[-(w + 2), L + 2], [-w, 44], [-(w + 4), -6], [-nw, -20], [nw, -20], [w + 4, -6], [w, 44], [w + 2, L + 2]];
  if (undies) {
    // a plain body shape in skin, no collar, then the swimsuit or top on it
    // (outlined on every side but the bottom, so it runs on into the hips
    // without a line at the waist)
    const body = bareBody;
    svg += poly(body, limb, "none", 0) +
           `<polyline points="${pts(body)}" fill="none" stroke="${limbLine}" stroke-width="2.5" stroke-linejoin="round"/>`;
    svg += undiesTop(U, w, nw, hw, fx, L);
  } else svg += poly(torso, sf, ss);
  // a few webs on the bodice, side by side
  if (fewWebs && !undies)
    svg += spiderWeb(-0.42 * hw, -20 + 0.48 * (L + 20), 0.3 * hw, WC.webColor) + spiderWeb(0.42 * hw, -20 + 0.48 * (L + 20), 0.3 * hw, WC.webColor);
  // a witch's belt round her waist, its buckle in the middle
  if (witch) {
    const bc = WC.bootColor ?? "#1f1f22";
    svg += `<rect x="${f1(-(w + 3))}" y="${f1(L - 16)}" width="${f1(2 * w + 6)}" height="12" fill="${bc}" stroke="${darker(bc)}" stroke-width="2"/>` +
           (dir ? `<rect x="${f1(dir * (w + 3) - (dir > 0 ? 8 : 0))}" y="${f1(L - 19)}" width="8" height="18" rx="2" fill="none" stroke="#f2c230" stroke-width="3"/>`   // (in profile, edge on, at her front)
                : `<rect x="-11" y="${f1(L - 19)}" width="22" height="18" rx="2.5" fill="none" stroke="#f2c230" stroke-width="4"/>` +
                  `<line x1="-3" y1="${f1(L - 10)}" x2="9" y2="${f1(L - 10)}" stroke="#f2c230" stroke-width="2.5" stroke-linecap="round"/>`);
  }
  if (wrapStripes(C) && !undies) svg += torsoStripes(torso, w, L, C.marks);
  if (suit && kind !== "eaglesuit" && !away)  // the suit's belly (a bald eagle is brown all over; none on its back: ticket 138)
    svg += `<ellipse cx="0" cy="${f1(L * 0.58)}" rx="${f1(w * 0.55)}" ry="${f1(L * 0.36)}" fill="${C.belly}"/>`;
  veilFrom("shirt", bodyAt);
  // (ticket 125) the ears, facing us: out at the sides of the head at the
  // eyes' height, behind the head; under long hair, which covers them, but
  // over shorter hair, and an elf's poke out through any hair
  const earsOn = F.ears && F.ears !== "none" && !C, earK = (F.earSize ?? 100) / 100;
  const earsFront = () => { const ey = faceLayout(F).eyeY + 10, [xl, xr] = acrossAt(headPoints(F), ey);
    return veil("head", `<g transform="translate(${f1(tx)} ${f1(ty)}) scale(${s.toFixed(4)})">` +
                        earSvg(F.ears, earK, F.color, xl + 6, ey, -1) + earSvg(F.ears, earK, F.color, xr - 6, ey, 1) + `</g>`); };
  const longHair = state.hair.style === "long" || (state.hair.style === "curly" && hairLen(state.hair) > 1.05);
  if (earsOn && !dir && longHair && F.ears !== "elf") svg += earsFront();
  // the hair, in the face's frame: over the body and shirt, but under the
  // arms, which are drawn again over it (long or curly hair hangs beside
  // them), and behind the head (its front, the bangs, comes again over the
  // face: see bangsSvg)
  // (in profile, what hangs behind the head, on the head as drawn)
  if (!C)
    svg += veil("hair", `<g transform="translate(${f1(tx)} ${f1(ty)}) scale(${s.toFixed(4)})">` +
           (side ? `<g transform="${topFlies(F)}">${tucked(side.back, "under-hat")}</g></g>`
                 : `<g transform="${topFlies(F)}"><g transform="${hairStretch(F)}">${tucked(hairSvg(state.hair), "under-hat")}</g></g></g>`));

  if (earsOn && !dir && !(longHair && F.ears !== "elf")) svg += earsFront();
  if (winged) svg += veil("shirt", arms.map(arm => dir ? armWing(C, arm, armW, 0.3) : armWing(C, arm, armW)).join(""));

  // the face, in its own units
  const groundInFace = (ground - ty) / s;
  // (the eyes see-through on their own: an invisible head can keep its
  // eyes, floating)
  const face = faceSvg(F, groundInFace, true, dir, q);
  const inFace = t => `<g transform="translate(${f1(tx)} ${f1(ty)}) scale(${s.toFixed(4)})">${t}</g>`;
  // (ticket 138: from behind, the head and its hair, no face)
  // (in a costume, the hood's back closed over the head: its ears, mane or
  // horns, and no face on its brim)
  if (away && C) {
    const fill = falconHead(kind) ? C.marks : eagleHead(kind) ? C.belly : ANIMALS[kind].suit ? "url(#pat-fur)" : C.fur;
    svg += veil("head", inFace(`<g transform="${topFlies(F)}"><g transform="${hairStretch(F)}">${hoodBack(C, kind, F)}` +
                               `<ellipse ${hoodEllipse(F)} fill="${fill}" stroke="${darker(C.fur)}" stroke-width="4"/></g></g>`));
  } else if (away) svg += veil("head", inFace(face.under)) + veil("hair", inFace(`<g transform="${topFlies(F)}">${backHair(state.hair, F)}</g>`));
  else if (!dir) svg += veil("head", inFace(face.under)) + veil("eyes", inFace(face.eyes)) + veil("head", inFace(face.over));
  else {
    // (ticket 124) in profile: the face's features on our side only (one
    // eye and brow, half the mouth), moved toward the front of the head; a
    // nose, if they have one, seen from the side at its front edge,
    // pointing the way they face
    const sh = 24 * headWidth(F), edge = profileEdge(F);
    const near = t => `<defs><clipPath id="face-near"><rect x="${dir > 0 ? 100 : -4000}" y="-4000" width="4100" height="8000"/></clipPath></defs>` +
                      `<g transform="translate(${f1(dir * sh)} 0)"><g clip-path="url(#face-near)">${t}</g></g>`;
    // (the nose, from the side: a bump out of the face's front edge, as tall
    // and as long as its sliders say; a witch's, her long side nose there)
    const noseOn = F.noseView && F.noseView !== "none", NL = faceLayout(F), witchNose = F.noseView === "witch" || F.nose === "witch";
    const ex = acrossAt(headPoints(F), NL.noseTop + NL.uh / 2)[dir > 0 ? 1 : 0];
    const nose = !noseOn ? "" : witchNose
      ? `<g transform="translate(${f1(ex - 100 - dir * 6)} 0)">${noseSvg({ ...F, noseView: dir > 0 ? "right" : "left", nose: "witch" })}</g>`
      : `<path d="M${f1(ex - dir * 3)} ${f1(NL.noseTop)} Q${f1(ex + dir * NL.uw * 0.55)} ${f1(NL.noseTop + NL.uh * 0.55)} ${f1(ex + dir * NL.uw * 0.5)} ${f1(NL.noseTop + NL.uh * 0.85)} ` +
        `Q${f1(ex + dir * NL.uw * 0.2)} ${f1(NL.noseTop + NL.uh * 1.05)} ${f1(ex - dir * 3)} ${f1(NL.noseTop + NL.uh * 0.95)} Z" fill="${F.color}" stroke="black" stroke-width="3" stroke-linejoin="round"/>` +
        `<rect x="${f1(ex - 3)}" y="${f1(NL.noseTop + 3)}" width="6" height="${f1(NL.uh * 0.85)}" fill="${F.color}"/>`;
    // (the mouth: its far half, carried to the front, so the lips meet the
    // face's front edge and a smile turns up toward the cheek, not the
    // front, which read as a frown; and an ear, where the hair leaves it)
    const rest = face.over.slice(noseSvg(F).length), mi = rest.indexOf('<g transform="translate(100 ');
    const brows = mi < 0 ? rest : rest.slice(0, mi), mouth = mi < 0 ? "" : rest.slice(mi);
    const lips = `<defs><clipPath id="face-far"><rect x="${dir > 0 ? -4000 : 100}" y="-4000" width="4100" height="8000"/></clipPath></defs>` +
                 `<g transform="translate(${f1(dir * (edge - 4))} 0)"><g clip-path="url(#face-far)">${mouth}</g></g>`;
    // (the ear, as chosen, seen whole: its front edge toward the face, its rim toward the back)
    const earAt = !earsOn ? null : side ? side.ear : [100 - dir * 0.12 * 80 * headWidth(F), HEAD_C + 5];
    const earSide = earAt ? earSvg(F.ears, earK, F.color, earAt[0] + dir * 8 * earK, earAt[1], -dir) : "";
    svg += veil("head", inFace(face.under + earSide)) + veil("eyes", inFace(near(face.eyes).replace('id="face-near"', 'id="face-near-e"').replace("url(#face-near)", "url(#face-near-e)"))) +
           veil("head", inFace(near(brows) + lips + face.sick + nose));
  }
  // and the front of the hair over them all: the bangs (on the lid, when
  // the head explodes)
  // (under a witch's hat, from its brim down: the brim's line as the hat is
  // stretched with the head, which big eyes make taller)
  // (in profile, the hair on the head itself, over its top and back)
  if (!C && !away) svg += veil("hair", inFace(side ? `<g transform="${topFlies(F)}">${tucked(side.cap, "under-hat-bangs", HEAD_C + (40 - HEAD_C) * headH(F))}</g>`
                                          : tucked(bangsSvg(state.hair, F), "under-hat-bangs", HEAD_C + (40 - HEAD_C) * headH(F))));
  // a fairy's wreath of flowers, over her hair
  if (fairy && WC.wreath !== false) svg += veil("hair", inFace(wreathSvg(F, WC.wreathFlowers)));
  // a witch's hat over it, stretched with the head as hair is (and flying
  // off with the lid); her cat on her shoulder
  if (witch) {
    svg += veil("head", `<g transform="translate(${f1(tx)} ${f1(ty)}) scale(${s.toFixed(4)})"><g transform="${topFlies(F)}">` +
           `<g transform="${hairStretch(F)}">${witchHat(WC, brimRx, dir)}</g></g></g>`);
    // (the cat grows or shrinks about where it sits)
    if (WC.witchCat)
      svg += `<g transform="translate(${f1(-(w - 4))} -9) scale(${((WC.catSize ?? 100) / 100).toFixed(3)}) translate(${f1(w - 4)} 9)">` +
             `${shoulderCat(w, WC)}</g>`;
  }

  svg += onBack;   // (ticket 138: wings and a tail, seen from behind)
  // then the arms again, over the hair and the face: raised arms cross
  // the chin and cheeks in front of the head, not behind it
  // (only outside the body, where they showed before: the body still
  // covers their tops, outline and all)
  // (a bird suit's wings stay behind the face, or they would hide it)
  const armsAt = svg.length;
  if (!winged && (dir || q)) {
    // (in profile, or turned partway, the arm on our side wholly in front of the body)
    for (const arm of nearArms) svg += limbThrough(armJoints(arm), armW, limb, limbLine);
    if (sleeve > 0) for (const arm of nearArms) svg += limbThrough(sleeveOf(arm), armW + 14, ss) + limbThrough(sleeveOf(arm), armW + 9, sf);
    if (wrapStripes(C))
      for (const arm of nearArms) { const P = sleeveOf(arm);
        svg += limbStripes(P[0], P[1], armW + 9, C.marks, `arm-stripes${arm.side}`, 22) + (P.length > 2 ? limbStripes(P[1], P[2], armW + 9, C.marks, `arm-stripes${arm.side}b`, 0) : ""); }
  } else if (!winged) {
    // (ticket 151: a clip, everywhere but the body grown by 1.5, as the
    // mask with its black body stroked 3 wide was; the mask was drawn again
    // offscreen on every frame: dragging the friend round the castle at 1920
    // wide held 44 frames a second, 60 without it)
    svg += `<clipPath id="off-body"><path clip-rule="evenodd" d="M-5000 -5000 H5000 V5000 H-5000 Z M${pts(growPoly(undies ? bareBody : torso, 1.5)).replace(/ /g, " L")} Z"/></clipPath>` +
           `<g clip-path="url(#off-body)">`;
    for (const arm of arms) svg += limbThrough(armJoints(arm), armW, limb, limbLine);
    if (sleeve > 0) for (const arm of arms) svg += limbThrough(sleeveOf(arm), armW + 14, ss);
    svg += `</g>`;
    if (sleeve > 0) for (const arm of arms) svg += limbThrough(sleeveOf(arm), armW + 9, sf);
    // (from past the shoulder, where the fur sleeve joins the body)
    if (wrapStripes(C))
      for (const arm of arms) { const P = sleeveOf(arm);   // (round a bent elbow: the upper arm's, then the forearm's)
        svg += P.length === 2 ? limbStripes(P[0], P[1], armW + 9, C.marks, `arm-stripes${arm.side}`, 22)
                              : limbStripes(P[0], P[1], armW + 9, C.marks, `arm-stripes${arm.side}`, 22) + limbStripes(P[1], P[2], armW + 9, C.marks, `arm-stripes${arm.side}b`, 0); }
  }
  veilFrom("shirt", armsAt);

  // a witch's broom, held in her right hand (on the picture's right)
  // (it grows or shrinks about the hand)
  if (broomH)
    svg += `<g transform="translate(${f1(broomH[0])} ${f1(broomH[1])}) scale(${kb.toFixed(3)}) translate(${f1(-broomH[0])} ${f1(-broomH[1])})">` +
           `${broomSvg(broomH, WC.trimColor)}</g>`;

  // and the hands last, in front of everything, the face too: raised
  // arms put them by the cheeks or over the eyes, not behind the head
  const handsAt = svg.length;
  if (!winged) {
    for (const arm of nearArms) svg += handOf(arm);
  }
  veilFrom("hands", handsAt);
  // a ghost: the sheet over all of the friend instead (what was drawn of
  // them is dropped, and its see-through layers with it)
  if (kind === "ghost") {
    svg = svg.slice(0, figAt);
    for (const g of Object.keys(layers)) delete layers[g];
    const gh = ghostSvg(WC, { F, tx, ty, s, w, L, feetY, arms, armW });
    svg += veil("shirt", gh.sheet) + (away ? "" : veil("head", gh.mouth) + veil("eyes", gh.eyes));   // (from behind, no face: ticket 138)
  }
  // standing in water: see-through below the waist, a wake round them (ticket 122)
  // (in a stream, to the knees; the wake out to the nearer bank at most)
  if (wet) {
    // (the water's shape round where they stand, from a little above it, for
    // the rings' far halves, down past their feet; in their own units)
    const T = figureT, sx = T.dx, sy = T.sg + T.dy, wake = Math.max(0, Number(BG.waterWake ?? 100) || 0) / 100;
    const most = waterAcross(BG, sx, sy, 400) / T.k;
    const R = Math.min(420, (hw + 80 + Math.min(220 * wake, most)) * T.k), down = (Math.max(ground, feetY + 40) - wl + 30) * T.k;
    const water = waterRuns(BG, bgText, Math.round(sx - R), Math.round(sx + R), Math.round(sy - 0.2 * R - 12), Math.round(sy + down))
      .map(([x, y, w]) => `<rect x="${f1((x - sx) / T.k)}" y="${f1((y - sy) / T.k + T.g)}" width="${f1(w / T.k)}" height="${f1(2 / T.k + 0.6)}"/>`).join("");
    svg = svg.slice(0, figAt) + wading(BG, svg.slice(figAt), wl, hw, most, tread ? tread.bob : 0, water);
    // (ticket 143) a splash where a jump leaves the water or comes back in:
    // drops thrown up and out in a crown, falling and fading
    if (tread && tread.splash) {
      const { x, p } = tread.splash, r = hw + 10;
      for (let i = 0; i < 9; i++) { const a = Math.PI * (0.1 + 0.8 * i / 8), sp = 40 + 50 * Math.abs(Math.sin(i * 1.7));
        svg += `<circle cx="${f1(x + Math.cos(a) * (r * 0.6 + sp * p) * 1.3)}" cy="${f1(wl - Math.sin(a) * sp * 1.6 * p + 160 * p * p)}" r="${f1(6 - 3 * p)}" fill="#ffffff" opacity="${(0.9 * (1 - p)).toFixed(2)}"/>`; }
      svg += `<ellipse cx="${f1(x)}" cy="${f1(wl)}" rx="${f1(r * (0.8 + 0.8 * p))}" ry="${f1(r * 0.16 * (0.8 + 0.8 * p))}" fill="none" stroke="#ffffff" stroke-width="5" opacity="${(0.9 * (1 - p)).toFixed(2)}"/>`;
    }
  }
  svg += `</g>`;   // the figure
  // (ticket 136: the far leg first, see-through with the pants and the feet,
  // then the far arm, see-through with the shirt, as it was)
  const farLegSvg = legApart ? veil("pants", farLeg.skin) + veil("feet", farLeg.shoe) + veil("pants", farLeg.pants) : "";
  if (farDeep || farLegSvg) svg += `<g id="figure-far" transform="translate(${f1(figureT.dx)} ${f1(figureT.dy + figureT.sg)}) scale(${figureT.k.toFixed(3)}) translate(0 ${f1(-figureT.g)})${rotTf}">${farLegSvg}${veil("shirt", farDeep)}</g>`;
  svg = unveil(svg, layers);
  // a held joint: a ring round it, where the finger is
  if (poseHeld && poseJoints) {
    const J = poseHeld.what === "hand" || poseHeld.what === "elbow" ? poseJoints.arms.find(x => x.side === poseHeld.side) : poseJoints.legs.find(x => x.side === poseHeld.side);
    const [jx, jy] = { hand: J.H, elbow: J.E, foot: J.F, knee: J.K }[poseHeld.what], T = figureT;
    svg += `<circle cx="${f1(T.dx + T.k * jx)}" cy="${f1(T.dy + T.sg + T.k * (jy - T.g))}" r="${f1(28 * T.k + 6)}" fill="#ffffff" fill-opacity="0.3" stroke="#ffffff" stroke-width="2.5" pointer-events="none"/>`;
  }

  const pic = document.getElementById("pic");
  // (kept as it was while a joint is held: the picture's frame growing
  // round a reaching hand would slide it out from under the finger)
  // (ticket 151: only when it changes. Setting it, even to what it was,
  // makes the browser paint the whole picture again, every drawing: walking
  // in the castle at 1920 wide held 56 frames a second, 60 without)
  const vb = `${f1(left)} ${f1(top)} ${f1(width)} ${f1(bottom - top)}`;
  if (!poseHeld && pic.getAttribute("viewBox") !== vb) pic.setAttribute("viewBox", vb);
  // the scenery: the node parsed from it last time, if it has not changed
  // (a figure's slider redraws the figure, not the scene), and left where
  // it is: the rest is replaced around it. Taking it out and putting it
  // back on every redraw restarted all of its animations and re-rendered
  // all of it, so dragging the friend past a cauldron's fumes crawled.
  const fresh = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  fresh.innerHTML = svg;
  if (scened && bgText !== bgShown.text) { bgShown.node = mountScene(bgText); bgShown.text = bgText; bgShown.objs = sceneObjects(bgShown.node); bgShown.helix = true; }
  if (!scened) bgShown.objs = [];
  const scenery = scened ? SPEED_TEST.holder || bgShown.node : null;   // (🧪's test passes: SPEED_TEST)
  for (const c of [...pic.childNodes]) if (c !== scenery && !(c.classList && c.classList.contains("fig-spin"))) c.remove();   // (ticket 193: a spin's copy stays)
  for (const n of figShown) n.remove();   // (last time's friend, who may have stood inside the scene)
  for (const w of pic.querySelectorAll("g.fig-clip")) w.remove();   // (ticket 199: and their clip, climbing down)
  if (scenery) {
    if (scenery.parentNode !== pic) pic.append(scenery);
    if (fresh.firstChild) pic.insertBefore(fresh.firstChild, scenery);   // the defs, before the scene
  }
  // (ticket 184: arrived inside something, out of it, once the place is on the screen to measure)
  // (not on a bridge or a platform, sitting or climbing: those stand where they stand)
  if (arriveSettle && scened) { arriveSettle = false;
    if (!state.body.sit && !BG.onBridge && !BG.onPlatform && !climb) { const was = BG.figX; solidUnstick(400); if (BG.figX !== was) setTimeout(changed, 0); } }
  // the friend, among the scene's objects by depth (ticket 99): just before
  // the first standing nearer than their feet, or in front of everything
  figShown = [...fresh.childNodes];
  // (seated, they are sorted at the seat's own depth: ticket 50)
  const onSeat = scenery && !poseHeld ? seatNow() : null;
  // (ticket 245: on a bridge, just in front of the tree house, all of them: the far arm too)
  const feetZ = onSeat ? onSeat.z : onBr ? SCENE.ground + 0.5 : figureT.sg + figureT.dy;
  // (ticket 130: the far arm, when it is apart, a body's depth farther back:
  // before the first thing standing nearer than that, so behind the rest)
  const farNode = figShown.find(n => n.id === "figure-far"), rest = figShown.filter(n => n !== farNode);
  const behind = farNode && scenery && !SPEED_TEST.holder ? objectAhead(onBr ? feetZ : feetZ - 26 * figureT.k) : null;
  const ahead = scenery && !SPEED_TEST.holder ? objectAhead(feetZ) : null;
  // (ticket 164: on a slow computer, while the friend moves, the scene as
  // still pictures at its end, cut where the friend goes, the friend between)
  const stills = scened && scenery === bgShown.node ? stillLayers(farNode, behind, ahead) : null;
  if (stills) {
    const B = stills[1] && stills[1].img, C = stills[2] && stills[2].img;
    if (farNode) scenery.insertBefore(farNode, B || C || null);
    for (const n of rest) scenery.insertBefore(n, C || null);
  } else {
    if (behind) behind.parentNode.insertBefore(farNode, behind);
    else if (farNode) pic.append(farNode);
    if (ahead) for (const n of rest) ahead.parentNode.insertBefore(n, ahead);
    else pic.append(...rest);
  }
  showObjects();
  // (ticket 268) the spiral staircase's steps in front of the friend: each one that covers them seen through, while it does
  if (scened && BG.kind === "castleroom" && scenery) { const steps = scenery.querySelectorAll("[data-front-step]"), f = steps.length && document.getElementById("figure");
    if (f) { const r = f.getBoundingClientRect(); for (const st of steps) { const q = st.getBoundingClientRect(), over = q.right > r.left && q.left < r.right && q.bottom > r.top && q.top < r.bottom;
      if (st.classList.contains("seen-through") !== over) st.classList.toggle("seen-through", over); } } }
  if (scened && BG.kind === "treeroom") treeBusyMeasure();   // (ticket 242: where its pictures can hang, measured once a room is drawn)
  if (hoverOn) showHover();   // (the hover glow, over the new drawing: ticket 135)
  if (scened) showEnterGlow();   // (the passage X, Enter or a tap would take, and the others within reach: tickets 145, 187)
  // (the fumes' Web Animations, for the segments the new scene brought: ticket 118)
  if (bgShown.helix && scenery) { bgShown.helix = false; if (!sceneryStill()) startHelix(scenery); }   // (ticket 164: the fumes held still on a slow computer)
  if (stills || stillPic.on) showStillPic(stills);   // (ticket 164: the still pictures on, or off again)
  if (figAway) for (const n of figShown) if (n.style) n.style.visibility = "hidden";   // (ticket 193: a spin's copy is shown instead)
  // (ticket 199) climbing down a hatch: every piece of the friend cut off below its near edge, in the picture's own units
  // (ticket 252) and climbing up through a ceiling's opening: cut off above it
  const clipDown = climb && climb.down && climb.clip != null, clipUp = climb && !climb.down && climb.clipUp != null && climb.door;
  // (ticket 264, Matthew: "we should clip the animation of walking through it, in the planned motion -- the trap doors and
  // pits all look great, BTW -- that's the standard now") walking through a door in a side wall (doorClip, walkInto):
  // every piece of the friend cut off past the wall's line there, on the room's side only
  const clipSide = !!doorClip && entering, clipRect = figClipRect && entering ? figClipRect : null;   // (ticket 269: in through a house's door, only its opening seen)
  // (ticket 274) each clip named by its shape and its turn, not by chance (Math.random), so the drawing is the same every time
  let clipN = 0;
  if (((clipDown || clipUp) && B.anim === "climbup") || clipSide || clipRect) for (const n of figShown) {
    if (n.nodeType !== 1 || !n.parentNode) continue;
    const NS = "http://www.w3.org/2000/svg", w = document.createElementNS(NS, "g"), shape = (clipRect ? `<rect x="${f1(clipRect.x0)}" y="${f1(clipRect.y0)}" width="${f1(clipRect.x1 - clipRect.x0)}" height="${f1(clipRect.y1 - clipRect.y0)}"/>` : clipSide ? (doorClip.side < 0 ? `<rect x="${f1(doorClip.x)}" y="-4000" width="8000" height="8000"/>` : `<rect x="-8000" y="-4000" width="${f1(8000 + doorClip.x)}" height="8000"/>`)
      : clipDown ? `<rect x="-4000" y="-4000" width="8000" height="${f1(4000 + climb.clip)}"/>`
      : `<rect x="-4000" y="${f1(climb.clipUp)}" width="8000" height="8000"/>`);
    let hx = 2166136261; for (let i = 0; i < shape.length; i++) hx = Math.imul(hx ^ shape.charCodeAt(i), 16777619);
    const id = "fig-clip-" + (hx >>> 0).toString(36) + "-" + clipN++;
    w.setAttribute("class", "fig-clip"); w.setAttribute("clip-path", `url(#${id})`);
    w.innerHTML = `<clipPath id="${id}" clipPathUnits="userSpaceOnUse">` + shape + `</clipPath>`;
    n.replaceWith(w); w.append(n);
  }
  worldWaysHud(); pathHud(); solidsHud(); madeOfHud(); accessApply(); bubbleRun();   // (0.0.145: the arrows placed again on every drawing too)   // (ticket 220: bubble space's bubbles, moving while it is shown)   // (ticket 217: the planned path and the collision boxes, when ♿ shows them; the words' size)
  if (scened) { stillPic.draws++; if (stills) stillPic.drawsOn++; }   // (for 🧪)
  // a blown lid tilts about the crack, and on a tall head its top (and
  // long hair or a hood's back below it) swings far out: frame what was
  // drawn, kept centred
  if (F.burst > 0 && !scened && !poseHeld) {
    const b = pic.getBBox(), l = Math.min(left, b.x - 12, -(b.x + b.width + 12));
    const t = Math.min(top, b.y - 12), btm = Math.max(bottom, b.y + b.height + 12);
    if (l < left || t < top || btm > bottom)
      pic.setAttribute("viewBox", `${f1(l)} ${f1(t)} ${f1(-2 * l)} ${f1(btm - t)}`);
  }
  // the feeling, and where, as each place takes it (PLACE_PHRASE)
  const BGK = state.background.kind, where = PLACE_PHRASE[BGK];
  const place = typeof where === "function" ? where(state.background) : where || "";
  document.getElementById("mood").textContent = "feeling " + mood(family(F.color), F.brow, F.smile) + (place ? " " + place : "") +
    (B.anim === "climbup" && (!scened || (climb && climb.none)) ? (climb && climb.far ? " (🧗 put them by a ladder to climb it)" : " (🧗 no ladder here to climb)") : "");
  fitPic();
  if (move && !move.held && !treadLoop) treadLoop = requestAnimationFrame(treadTick);
  if (B.anim === "climbup" && scened && !climb && !drag && !entering && !climbLook) climbLook = setTimeout(startClimb, 0);   // (ticket 137)
  if (scened && marks.text !== bgShown.text && !marksLook) marksLook = setTimeout(measureMarks, 0);   // (tickets 145, 187: with any input, not only a controller)
}
// (ticket 123) While the friend treads water they are drawn again about 30
// times a second: not while a drag draws them anyway, nor while the page is
// hidden. Only the friend is drawn; the scene is kept (see draw).
function treadTick(t) {
  treadLoop = 0;
  if (!moveNow()) return;
  if (!drag && !padMoving && !document.hidden && t - treadLast >= 32) { treadLast = t; draw(); feedMusic(); return; }
  treadLoop = requestAnimationFrame(treadTick);
}

// Where the friend is, after their feeling ("feeling happy in the forest"):
// each place with the word it takes, in, at, on, near or outside of; a
// castle room by its own name and number; a castle by its owner.
const PLACE_PHRASE = { sea: "swimming in 🌊 open water", deepsea: "swimming in the 🪸 deep sea", bubblespace: "in 🫧 bubble space", imagination: "in 💭 our imagination", emptyroom: "in the 🔲 empty room", forest: "in the 🌲 forest", underwater: "🐠 under the sea", beach: "at the 🏖️ beach", witch: "in the 🧙 witch's woods",
  cemetery: "in the 🌿 cemetery", lake: "at the 🦆 lake", house: "outside of the 🏠 house", treehouse: "near the 🌳 tree house",
  treeroom: "in the 🪜 tree house", livingroom: "in the 🛋️ living room", witchroom: "in the 🧙 witch's hut", clearing: "in the 🌲 forest clearing",
  hut: "outside the 🛖 grass hut", hutroom: "in the 🛖 grass hut's living room", hutbed: "in the 🛖 grass hut's bedroom", hutpotion: "in the 🛖 grass hut's potion room", hutcenter: "in the 🛖 grass hut's 🔥 center",
  healerroom: "in the 🌿 healer's hut", fairyforest: "in the 🧚 fairy forest", mountains: "on the ⛰️ mountain trail", waterfall: "at the 💦 jungle waterfall",
  campsite: "at the 🏕️ camp site", tent: "in a ⛺ tent", cave: "in the 🪨 cave behind the falls", woodpath: "on the 🥾 path through the woods", crossing: "at the 🛤️ forest crossing",
  castle: b => `outside of ${castleOf(b).id}'s 🏰 castle`,
  castleroom: b => { const K = castleOf(b), n = Math.max(1, Math.min(K.rooms.length, Math.round(b.castleRoom ?? 1)));
    return `in the ${roomLabel(K.rooms[n - 1])} (room ${n} of ${K.id}'s castle)`; } };
