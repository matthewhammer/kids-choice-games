"use strict";
// (ticket 178) Part 20 of 26 of the game's script, run in order by index.html.

// ===================== CONTROLS =====================

// a witch's green skin
const WITCH_SKIN = "#6fa34a";
// the skin swatches that mean something, marked so: what they mean
const SKIN_MARKS = { "#cfa000": ["😀", "smiley yellow"], "#aab2ba": ["👽", "alien grey"], "#dc143c": ["😡", "mad red"], "#8cbe32": ["🤢", "sick green"],
                     [WITCH_SKIN]: ["🧙", "witch green"] };
const SKINS = ["#cfa000", "#dc143c", "#8cbe32", "#aab2ba", "#ffdbac", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", WITCH_SKIN];
const BRIGHT = ["#e74c3c", "#ff69b4", "#f39c12", "#f1c40f", "#2ecc71", "#5b8bd0", "#34495e", "#8e44ad", "#ffffff", "#2b2b2b"];
const HAIRS = ["#2b2b2b", "#6f4e37", "#e8c35a", "#b5562b", "#ff69b4", "#3b82f6", "#22c55e", "#8b5cf6"];
const PATTERN_COLORS = ["auto", "#ffffff", "#ff69b4", "#f1c40f", "#e74c3c", "#2ecc71", "#5b8bd0", "#2b2b2b"];
const FURS = ["#e8862a", "#1f1f22", "#d9a441", "#6b4226", "#55616d", "#ffffff", "#9ca3af", "#ff69b4", "#8b5cf6"];
const MARKS = ["#1f1a17", "#3a3a40", "#8a4b1c", "#4a2c17", "#23282e", "#ffffff", "#ff69b4"];
const BELLIES = ["#f7ead8", "#2e2e33", "#f1d9a8", "#b08458", "#f2ece0", "#ffffff", "#ffd1dc"];
const ANIMAL_EYES = ["#e0a800", "#c6d43a", "#c88a1e", "#2b1a10", "#1a1410", "#3b82f6", "#22c55e"];
const ACCENTS = ["#e89aa0", "#f4a0b0", "#5a3a2a", "#1d1410", "#f2c230", "#ff69b4"];
const PATTERNS = [["plain", "plain"], ["stripes", "stripes"], ["dots", "dots"], ["hearts", "♥ hearts"], ["stars", "★ stars"]];

// the friend's right hand: its own style and settings, or the same as the
// other's (the color and the size are always both hands')
const rightHandOf = h => (h.different ? { ...h, ...state.rightHand } : h);
// and the friend's right foot
const rightShoeOf = sh => (sh.different ? { ...sh, ...state.rightShoe } : sh);
const FOOT_STYLES = [["sneaker", "sneakers"], ["boot", "boots"], ["clown", "clown shoes"], ["bare", "bare feet"],
                     ["human", "🦶 toes"], ["alien", "👽 alien toes"], ["talons", "🦅 talons"]];
// one foot's own controls: its style, and the toe counts
const SHOE_CTLS = [
  ["choice", "style", "style", FOOT_STYLES],
  ["range", "toes", "🦶 number of toes", 1, 100, 4, 6],
  ["range", "alienToes", "👽 number of alien toes", 1, 100, 2, 6],
  ["range", "talonCount", "🦅 number of talons", 1, 100, 3, 6],
];
const FOOT_SLIDER_STYLE = { toes: "human", alienToes: "alien", talonCount: "talons" };
const HAND_STYLES = [["round", "round"], ["mitten", "mittens"], ["star", "stars"], ["claw", "claws"],
                     ["human", "✋ human"], ["alien", "👽 alien"]];
// one hand's own controls: its style, and the sliders for each style
const HAND_CTLS = [
  ["choice", "style", "style", HAND_STYLES],
  ["range", "fingers", "✋ number of fingers", 1, 100, 5, 7],
  ["range", "alienFingers", "👽 number of alien fingers", 1, 100, 2, 6],
  ["range", "starPoints", "⭐ number of star points", 1, 100, 4, 8],
  ["range", "clawCount", "🐾 number of claws", 1, 100, 3, 6],
  ["range", "clawLen", "🐾 claw length", 20, 900, 70, 140],
  ["turn", "starAngle", "⭐ star angle (radians)", handPeriod],
  ["turn", "mittenAngle", "🧤 mitten angle (radians)", handPeriod],
  ["turn", "clawAngle", "🐾 claw angle (radians)", handPeriod],
  ["turn", "humanAngle", "✋ human hand angle (radians)", handPeriod],
  ["turn", "alienAngle", "👽 alien hand angle (radians)", handPeriod],
];
// the style each of a hand's sliders is for
const SLIDER_STYLE = { fingers: "human", alienFingers: "alien", starPoints: "star", clawCount: "claw", clawLen: "claw",
                       starAngle: "star", mittenAngle: "mitten", clawAngle: "claw", humanAngle: "human", alienAngle: "alien" };
// a cat costume's paws have claws, set with the claw sliders
const clawedSuit = () => !!CLAWED[state.costume.kind] && !!costumeOn();
// a hand's slider shows when the hand wears its style
const handSliderShown = (key, h) => h.style === SLIDER_STYLE[key] || ((key === "clawLen" || key === "clawCount") && clawedSuit());
// The places, and the kinds of place they are, for the Background tab's
// two rows (as the music's): every place is of exactly one kind.
const PLACES = [["none", "none"], ["emptyroom", "🔲 empty room"], ["imagination", "💭 our imagination"], ["forest", "🌲 forest"], ["underwater", "🐠 underwater"],
  ["beach", "🏖️ beach"], ["witch", "🧙 witch's woods"],
  ["cemetery", "🌿 cemetery"], ["lake", "🦆 lake"], ["house", "🏠 house and yard"],
  ["treehouse", "🌳 tree house"], ["treeroom", "🪜 inside the tree house"],
  ["livingroom", "🛋️ living room"], ["witchroom", "🧙 inside the witch's hut"],
  ["clearing", "🌲 forest clearing"], ["healerroom", "🌿 inside the healer's hut"], ["fairyforest", "🧚 fairy forest"], ["mountains", "⛰️ mountain trail"],
  ["waterfall", "💦 jungle waterfall"], ["campsite", "🏕️ camp site"],
  ["tent", "⛺ inside a tent"], ["cave", "🪨 cave behind the falls"],
  ["woodpath", "🥾 path through the woods"], ["crossing", "🛤️ forest crossing"], ["castle", "🏰 castle"], ["castleroom", "🚪 inside the castle"]];
// (where a door behind us can lead from a room outside the castle: any place but those found by a number of their own)
const BEHIND_PLACES = [["none", "🧱 nowhere"], ...PLACES.filter(([kd]) => !["none", "castleroom", "treeroom"].includes(kd))];
const behindSign = (c, to) => { const P = to && to !== "none" && PLACES.find(p => p[0] === to); return P ? bottomSign(c, c.W * 0.4, P[1], `data-to="${to}"`) : ""; };
const PLACE_GROUPS = [
  ["imagination", "💭 imagination", ["emptyroom", "imagination"]],
  ["woods", "🌲 woods", ["forest", "clearing", "healerroom", "fairyforest", "woodpath", "crossing", "mountains"]],
  ["water", "💧 water", ["lake", "beach", "underwater", "waterfall"]],
  ["camping", "🏕️ camping", ["campsite", "tent", "cave"]],
  ["home", "🏠 home", ["house", "livingroom", "treehouse", "treeroom"]],
  ["witch", "🧙 the witch's", ["witch", "witchroom", "cemetery"]],
  ["castles", "🏰 castles", ["castle", "castleroom"]],
];
const groupOfPlace = v => v === "none" ? "none" : (PLACE_GROUPS.find(g => g[2].includes(v)) || [null])[0];
console.assert(PLACES.every(([v]) => groupOfPlace(v)) && PLACE_GROUPS.flatMap(g => g[2]).length === PLACES.length - 1,
               "every place is of exactly one kind");

const TABS = [
  // (ticket 129) whole poses, first (Matthew: top level, before the face)
  // (ticket 132: "Body", with poses, the way they face, and animations)
  ["🧍 Body", "body", [
    ["choice", "pose", "🤸 poses", [["stand", "🧍 standing"], ["sit", "🪑 sitting"], ["meditate", "🧘 cross-legged, meditating"], ["dance", "💃 dancing (a new dance each time)"], ["hug", "🤗 jumping up into a hug"]]],
    ["range", "hugLift", "🙌 held up (100 = a leg's length)", 0, 300, 40, 90],
    ["choice", "facing", "↔️ facing", [["front", "🧍 toward us"], ["left", "⬅️ to the left"], ["right", "➡️ to the right"], ["back", "⬆️ away from us"]]],
    ["choice", "anim", "🎬 animations", ANIMS],
    ["group", "jumps", "🐸🦘 the two jumps", [
      ["range", "jumpShortH", "🐸 short jump: how high (100 = a leg's length)", 5, 200, 20, 45],
      ["range", "jumpShortS", "🐸 short jump: how fast (100 = steady)", 25, 400, 120, 180],
      ["range", "jumpHighH", "🦘 high jump: how high (100 = a leg's length)", 5, 300, 70, 130],
      ["range", "jumpHighS", "🦘 high jump: how fast (100 = steady)", 25, 400, 60, 90],
    ]],
  ]],
  ["😀 Face", "face", [
    ["color", "color", "skin & head color", SKINS],
    ["range", "size", "head size", 8, 750, 36, 64],
    ["range", "faceW", "face width", 40, 600, 85, 115],
    ["range", "faceH", "face height", 40, 600, 85, 115],
    ["range", "alien", "face shape (round ↔ alien)", 0, 100, 0, 0],
    ["range", "eyeGap", "eye gap", 0, 600, 25, 55],
    ["range", "smile", "smile", -100, 200, 0, 100],
    ["range", "mouthSize", "👄 mouth size", 20, 400, 70, 140],
    ["range", "brow", "eyebrows", -100, 200, 0, 100],
    ["toggle", "unibrow", "one big eyebrow"],
    ["choice", "noseView", "👃 nose", [["none", "none"], ["right", "side, L →"], ["left", "side, ← backwards L"], ["front", "front"], ["witch", "🧙 witch, warts"]]],
    ["choice", "nose", "side shape", [["L", "L"], ["angle", "<"], ["soft", "soft"], ["hook", "bulbous"]]],
    ["choice", "noseFront", "front shape", [["pointed", "pointed"], ["round", "round"]]],
    ["choice", "ears", "👂 ears", [["none", "none"], ["free", "lobe hanging free"], ["attached", "lobe attached"], ["elf", "🧝 elf or fairy, pointy"]]],
    ["range", "earSize", "👂 ear size", 30, 250, 70, 140],
    ["choice", "witchDir", "🧙 witch nose points", [["left", "L ←"], ["center", "C"], ["right", "R →"]]],
    ["range", "witchLen", "🧙 witch nose length", 30, 400, 70, 200],
    ["range", "noseH", "nose height", 20, 300, 70, 150],
    ["range", "noseW", "nose width", 20, 300, 70, 150],
    ["range", "open", "mouth open", 0, 300, 0, 100],
    ["choice", "teethStyle", "🦷 teeth", [["normal", "normal"], ["spikes", "spiky"], ["none", "none"]]],
    ["range", "teeth", "spiky teeth", 0, 15, 0, 5],
    ["choice", "tongue", "👅 tongue", [["in", "in"], ["out", "sticking out"], ["none", "none"]]],
    ["range", "tongueLen", "tongue length", 10, 300, 60, 160],
    ["range", "tongueW", "tongue width", 30, 250, 70, 140],
    ["color", "tongueColor", "tongue color", ["#e75480", "#ff6f91", "#d62f4b", "#c71585", "#8e44ad", "#2ecc71", "#3b82f6"]],
    ["range", "sides", "side lines", 0, 300, 0, 100],
    ["range", "burst", "💥 explode", 0, 300, 0, 100],
    ["range", "candy", "🍬 candy", 0, 300, 0, 100],
    ["range", "rays", "head rays", 0, 300, 0, 100],
    ["range", "sick", "🤢 sickness", 0, 300, 0, 100],
  ]],
  ["👁 Eyes", "face", [
    ["range", "eyes", "eye size", -35, 300, 0, 100],
    ["range", "oval", "eye shape (round ↔ narrow)", 0, 100, 0, 60],
    ["range", "tilt", "eye angle (flat ↔ slanted)", -60, 60, 0, 0],
    ["pad", "light", "✨ where the light comes from"],
    ["color", "shine", "shine color", ["#ffffff", "#fff3b0", "#ffd1dc", "#aee6ff", "#c8ffc8", "#ffb347"]],
    ["range", "shineMix", "shine (dark ↔ bright)", 0, 100, 60, 100],
    ["range", "shineSize", "shine size", 0, 450, 25, 70],
    ["color", "pupil", "pupil color", ["#000000", "#3b2314", "#1e3a8a", "#14532d", "#7f1d1d", "#4c1d95"]],
    ["range", "iris", "iris size (0 = no iris)", 0, 150, 0, 0],
    ["color", "irisColor", "iris color", ["#3b82f6", "#22c55e", "#8b5a2b", "#a0782c", "#9ca3af", "#8b5cf6", "#ef4444"]],
    ["range", "whites", "eye white size (0 = none)", 0, 150, 0, 0],
    ["toggle", "stars", "⭐ star eyes"],
    ["toggle", "hearts", "❤️ heart eyes"],
    ["toggle", "xeyes", "✖ x eyes"],
    ["toggle", "closed", "😌 eyes closed"],
  ]],
  ["💇 Hair", "hair", [
    ["choice", "style", "style", [["none", "none"], ["short", "short"], ["long", "long"], ["curly", "curly"],
                                  ["spiky", "spiky"], ["afro", "afro"], ["pigtails", "pigtails"]]],
    ["range", "length", "📏 length", 30, 400, 70, 180],
    ["range", "bangs", "✂️ bangs (0 = none, 100 = down to the brows)", 0, 300, 40, 140],
    ["color", "color", "color", HAIRS],
  ]],
  ["🦒 Neck, arms & legs", "body", [
    ["range", "neck", "neck length", 0, 420, 4, 60],
    ["range", "neckW", "neck width", 2, 120, 12, 40],
    ["range", "arms", "arms (up ↔ down)", -180, 180, -75, 85],
    ["range", "elbows", "💪 elbows bend (− down, + up)", -150, 150, 0, 45],
    ["range", "armLen", "arm length", 10, 600, 60, 130],
    ["range", "armW", "arm width", 3, 60, 10, 24],
    ["range", "legLen", "leg length", 20, 420, 70, 200],
    ["range", "feetTurn", "👣 feet turn (toes down ↔ up)", -90, 180, -30, 60],
    ["range", "legW", "leg width", 4, 70, 14, 28],
    ["range", "knees", "🦵 knees bend (out, so the friend crouches)", 0, 150, 0, 25],
    ["note", "poseHow", () => posed(state.body) ? "🤸 Posed: each arm and leg as you dragged it." : "🤸 To pose the friend, drag a hand, a foot, an elbow or a knee in the picture."],
    ["action", "unpose", "🧍 stand straight again", () => { for (const k of POSE_KEYS) state.body[k] = 0; if (state.body.pose === "meditate" || state.body.pose === "dance" || state.body.pose === "hug") state.body.pose = state.body.sit ? "sit" : "stand"; }],
  ]],
  ["👕 Shirt", "shirt", [
    ["choice", "style", "style", [["tee", "t-shirt"], ["long", "long sleeves"], ["tank", "tank top"]]],
    ["choice", "collar", "collar", [["v", "V"], ["round", "round"], ["flat", "flat"]]],
    ["color", "color", "color", BRIGHT],
    ["choice", "pattern", "pattern", PATTERNS],
    ["range", "patternSize", "pattern size", 4, 60, 10, 24],
    ["color", "patternColor", "pattern color", PATTERN_COLORS],
    ["range", "width", "width", 10, 120, 40, 80],
    ["range", "length", "length", 20, 300, 100, 190],
  ]],
  ["🖐 Hands", "hands", [
    ["flip", "different", ["🖐️🖐️ hands are the same", "🖐️✊ hands are different"]],
    // different hands get a column each, placed as the hands are in the
    // picture (the friend faces us, so their right hand is on our left),
    // each with its own style and that style's sliders
    ["pair", "rightHand", ["⬅️ right hand", "left hand ➡️"], "hands", HAND_CTLS],
    // the same hands: one style, and its sliders after the color
    HAND_CTLS[0],
    ["color", "color", "color", ["skin", ...BRIGHT]],
    ...HAND_CTLS.slice(1),
    ["range", "size", "size", 2, 80, 6, 28],
  ]],
  ["👖 Pants", "pants", [
    ["choice", "style", "style", [["long", "long"], ["shorts", "shorts"], ["skirt", "skirt"], ["dress", "dress"]]],
    ["range", "skirtLen", "skirt length", 10, 140, 30, 100],
    ["color", "color", "color", BRIGHT],
    ["choice", "pattern", "pattern", PATTERNS],
    ["range", "patternSize", "pattern size", 4, 60, 10, 24],
    ["color", "patternColor", "pattern color", PATTERN_COLORS],
  ]],
  ["🩱 Swim & undies", "undies", [
    ["toggle", "on", "🩱 no clothes: just underwear or a swimsuit"],
    ["choice", "style", "style", [["trunks", "swim trunks"], ["briefs", "briefs"], ["bikini", "bikini"],
                                  ["onepiece", "one-piece"]]],
    ["toggle", "top", "with a top (bra / bikini top)"],
    ["color", "color", "color", BRIGHT],
    ["choice", "pattern", "pattern", PATTERNS],
    ["range", "patternSize", "pattern size", 4, 60, 10, 24],
    ["color", "patternColor", "pattern color", PATTERN_COLORS],
  ]],
  ["👟 Feet", "shoes", [
    ["flip", "different", ["👟👟 feet are the same", "👟🦶 feet are different"]],
    // different feet get a column each, as the hands do: the friend's
    // right foot on our left
    ["pair", "rightShoe", ["⬅️ right foot", "left foot ➡️"], "shoes", SHOE_CTLS, FOOT_SLIDER_STYLE],
    SHOE_CTLS[0],
    ["color", "color", "color", BRIGHT],
    ...SHOE_CTLS.slice(1),
    ["range", "size", "size", 20, 310, 60, 170],
  ]],
  // how see-through each part is: the shirt the body under it, never a
  // bare one, and the pants the legs
  ["👻 Visibility", "visible", [
    ["every", "all", "every part at once", [["🙂 visible", 100], ["👻 ghost", 50], ["🫥 invisible", 0]]],
    ["master", "all", "🧍 full body: moves every part", 0, 100],
    ["range", "head", "🙂 head", 0, 100],
    ["range", "eyes", "👀 eyes", 0, 100],
    ["range", "hair", "💇 hair", 0, 100],
    ["range", "shirt", "👕 shirt: the body, neck & arms", 0, 100],
    ["range", "pants", "👖 pants: the hips & legs", 0, 100],
    ["range", "feet", "👟 feet", 0, 100],
    ["range", "hands", "🖐 hands", 0, 100],
  ]],
  ["🐯 Costume", "costume", [
    ["choice", "kind", "costume", [["none", "none"], ["tiger", "🐯 tiger"], ["cat", "🐈‍⬛ black cat"],
                                   ["lion", "🦁 lion"], ["bear", "🐻 bear"], ["falcon", "🦅 peregrine falcon"],
                                   ["raccoon", "🦝 raccoon"], ["bobcat", "🐈 bobcat"], ["leopard", "🐆 leopard"],
                                   ["eagle", "🦅 bald eagle"], ["cheetah", "🐆 cheetah"], ["jaguar", "🐈‍⬛ black jaguar"],
                                   ["falconsuit", "🦅 falcon suit"], ["eaglesuit", "🦅 bald eagle suit"],
                                   ["wolf", "🐺 wolf"], ["deer", "🦌 deer"], ["witch", "🧙 witch"], ["fairy", "🧚 fairy"], ["ghost", "👻 ghost"]]],
    // the ghost: its sheet, its eyes, and how see-through it is (the
    // visibility panel's all-at-once controls, and their LFO)
    ["range", "ghostRagged", "👻 how ragged (0 = smooth)", 0, 100, 0, 70],
    ["choice", "ghostEyes", "👀 eyes", [["0", "none"], ["1", "one"], ["2", "two"], ["3", "three"]]],
    ["toggle", "ghostHideEyes", "🕳️ hide eyes (black holes)"],
    ["color", "ghostColor", "👻 the sheet's color", GHOST_COLORS],
    ["of", "visible", ["every", "all", "👻 see-through: every part at once", [["🙂 visible", 100], ["👻 ghost", 50], ["🫥 invisible", 0]]], c => c.kind === "ghost"],
    ["of", "visible", ["master", "all", "🧍 full body: moves every part", 0, 100], c => c.kind === "ghost"],
    ["color", "fur", "fur / feather color", FURS],
    ["choice", "furPattern", "fur pattern", [["none", "plain"], ["stripes", "stripes"], ["spots", "spots"],
                                             ["rosettes", "rosettes"], ["patches", "patches"]]],
    ["color", "marks", "markings color (stripes, mane, bars)", MARKS],
    ["color", "spot", "rosette middle color", ["auto", "off", "#7a4a10", "#c8892e", "#5a3a1a", "#1c1410", "#ffffff", "#ff69b4", "#8b5cf6"]],
    ["color", "belly", "belly & muzzle color", BELLIES],
    ["color", "eyes", "animal eye color", ANIMAL_EYES],
    ["color", "accent", "nose, ear & beak color", ACCENTS],
    ["color", "witchColor", "🧙 hat & dress color", ["#6a2c91", "#1f1f22", "#2e7d32", "#1e3a8a", "#b71c1c", "#f28c28", "#ff69b4"]],
    ["color", "webColor", "🕸️ spider web color", ["#3fae4a", "#ffffff", "#c0c0c0", "#f28c28", "#1f1f22", "#b38bff"]],
    ["choice", "webStyle", "🕸️ spider web", [["tiled", "all over"], ["few", "a few webs"]]],
    ["color", "trimColor", "hat band & stocking color", ["#f28c28", "#3fae4a", "#6a2c91", "#1f1f22", "#ffffff", "#e53935"]],
    ["toggle", "witchCat", "🐈‍⬛ cat on the shoulder"],
    ["color", "catFur", "🐈‍⬛ cat's fur", ["#1f1f22", "#6b4226", "#e8862a", "#9ca3af", "#ffffff", "#8b5cf6"]],
    ["color", "catWhite", "🐈‍⬛ cat's tuxedo (nose, chest, paws)", ["#ffffff", "off", "#f7ead8", "#ffd1dc", "#c0c0c0", "#1f1f22"]],
    ["color", "catEyes", "🐈‍⬛ cat's eyes", ["#c6d43a", "#e0a800", "#3b82f6", "#22c55e", "#f28c28"]],
    ["color", "catNose", "🐈‍⬛ cat's nose", ["#f4a0b0", "#ff69b4", "#1f1f22", "#8a4b1c"]],
    ["range", "catSize", "🐈‍⬛ cat's size", 10, 1000, 70, 160],
    ["toggle", "broom", "🧹 broom"],
    ["range", "broomSize", "🧹 broom's size", 10, 1000, 70, 160],
    ["color", "bootColor", "👢 boots & belt color", ["#1f1f22", "#6a2c91", "#4a2c17", "#b71c1c", "#2e7d32", "#ffffff"]],
    // the fairy: wings and tunic, each in a style with its own colors; shoes
    ["choice", "wingStyle", "🧚 wings", Object.entries(FAIRY_WINGS).map(([id, w]) => [id, w.name])],
    ...Object.entries(FAIRY_WINGS).map(([id, w]) => ["color", "wingColor_" + id, "🧚 wings' color", w.colors]),
    ["toggle", "wingFlutter", "🧚 wings flutter"],
    ["choice", "wingLfo", "〰️ wings flap with", [["none", "no LFO"], ...LFO_NAMES.map(L => [L, "LFO " + L])]],
    ["choice", "fairyOutfit", "🧚 wears", [["dress", "👗 dress"], ["pants", "👕 shirt + pants"]]],
    ["choice", "tunicStyle", "🧚 tunic", Object.entries(FAIRY_TUNICS).map(([id, t]) => [id, t.name])],
    ...Object.entries(FAIRY_TUNICS).map(([id, t]) => ["color", "tunicColor_" + id, "🧚 tunic's color", t.colors]),
    ["toggle", "wreath", "🌸 a wreath of flowers"],
    ["choice", "wreathFlowers", "🌸 the wreath's flowers", Object.entries(WREATH_SETS).map(([id, w]) => [id, w.name])],
    ["choice", "fairyShoes", "🧚 shoes", FAIRY_SHOES],
    ["color", "fairyShoeColor", "🧚 shoes' color", FAIRY_SHOE_COLORS],
  ]],
  ["🏞️ Background", "background", [
    ["places", "kind", "background", PLACES],
    ["range", "figSize", "🧍 size in the scene", 10, 1000, 100, 100],
    ["place", "figPos", "🧍 place in the scene (or drag the figure)"],
    ["objects", "objectsOff", "👁️ what stands in the scene, back to front (tap to hide or show)"],
    ["seats", "seat", "🪑 sit on (or drag the friend onto a seat)"],
    // the friend standing in water, where a place has water to stand in (WATER, ticket 122)
    ["range", "waterSee", "🌊 see-through under the water (0 = not at all)", 0, 100, 50, 90],
    ["range", "waterWake", "💧 a wake round the friend in the water (0 = none)", 0, 250, 60, 160],
    ["range", "waterTread", "🏊 treading water where it's deep (0 = standing still)", 0, 200, 60, 140],
    // what in the scene moves with the music: its quick things and its slow things (SCENE_LFO_THINGS)
    ["choice", "lfoFast", "〰️ quick things in the scene move with", [["none", "their own pace"], ...LFO_NAMES.map(L => [L, "LFO " + L])]],
    ["choice", "lfoSlow", "〰️ slow things in the scene move with", [["none", "their own pace"], ...LFO_NAMES.map(L => [L, "LFO " + L])]],
    ["choice", "lfoWings", "〰️ wings in the scene beat with", [["none", "their own pace"], ...LFO_NAMES.map(L => [L, "LFO " + L])]],
    // the witch's woods: the hut behind the fence, on chicken legs or not
    ["toggle", "chickenLegs", "🐔 chicken legs on the hut"],
    ["range", "legSize", "🐔 leg size", 20, 300, 80, 140],
    ["range", "hutNear", "🛖 hut: far ↔ near (behind the fence)", 0, 100, 0, 60],
    ["range", "eyeRate", "💀 skull eyes: blinks a minute (0 = steady)", 0, 240, 20, 60],
    ["flip", "blinkApart", ["💀 skull eyes blink in sync", "💀 skull eyes blink out of sync"]],
    ["range", "skullMax", "💀 skulls: biggest size (% of the usual; the smallest is the usual)", 100, 3000, 200, 500],
    ["range", "skullEye", "💀 skull eye size (the skulls grow to hold them)", 50, 500, 80, 200],
    ["range", "eyeGlow", "💀 skull eyes: red glow size", 0, 100, 40, 90],
    // the lake
    ["range", "ducks", "🦆 ducks", 0, 16, 2, 9],
    ["range", "duckSize", "🦆 duck size", 30, 300, 70, 160],
    ["range", "cattails", "🌾 cattails", 0, 40, 6, 24],
    ["range", "clouds", "☁️ clouds", 0, 10, 1, 7],
    ["range", "cloudSize", "☁️ cloud size", 40, 250, 70, 170],
    // the house and yard
    ["range", "houseSize", "🏠 house size", 50, 130, 80, 115],
    ["range", "treeSize", "🌳 tree size", 40, 200, 70, 150],
    ["range", "treeHouseSize", "🏡 tree house size", 50, 250, 80, 160],
    ["range", "toys", "🧸 toys on the lawn", 0, 16, 2, 10],
    ["range", "flowers", "🌷 flowers", 0, 48, 6, 36],
    // the tree house
    ["range", "houses", "🏡 houses in the tree", 1, 6, 2, 6],
    ["range", "bridges", "🌉 rope bridges", 0, 5, 0, 5],
    ["range", "ladders", "🪜 ladders", 0, 6, 1, 6],
    ["range", "leaves", "🍃 leaves", 0, 100, 30, 100],
    // each house's kind, and then its own colors, for the kinds with colors
    ...[1, 2, 3, 4, 5, 6].flatMap(n => [["choice", "house" + n, "🏡 house " + n, HOUSE_ANIMALS],
      ...HOUSE_COLOR_CTLS.map(([k, label, colors]) => ["color", k + n, `🏡 house ${n}: ${label}`, colors])]),
    // inside the tree house
    ["choice", "inside", "🏡 which tree house", [1, 2, 3, 4, 5, 6].map(n => [n, "🏡 " + n])],
    ...[1, 2, 3, 4, 5, 6].flatMap(n => [["choice", "room" + n, `🏡 ${n}: its room`, ROOM_CHOICES],
      ...[1, 2].map(i => ["choice", `r${n}pic${i}`, `🏡 ${n}: picture ${i} on its wall`, PICTURE_CHOICES]),
      ["choice", "treeBack" + n, `🏡 ${n}: ⬇️ behind you (a door we can't see) leads to`, BEHIND_PLACES]]),
    ["range", "windowSize", "🪟 window size", 40, 220, 70, 160],
    ["range", "things", "🧸 things in the room", 0, 24, 4, 20],
    // the mountain trail
    ["range", "peakHeight", "🏔️ how high the peaks are", 50, 170, 70, 140],
    ["range", "mtClouds", "☁️ clouds", 0, 10, 2, 8],
    ["range", "birds", "🦅 birds circling", 0, 8, 1, 5],
    ["toggle", "farLake", "🏞️ the lake and village far below"],
    // the jungle waterfall
    ["range", "fallWidth", "💦 waterfall width", 40, 250, 70, 160],
    ["range", "vines", "🌿 vines", 0, 20, 4, 14],
    ["range", "mist", "🌫️ mist", 0, 100, 30, 90],
    ["range", "parrots", "🦜 parrots", 0, 6, 1, 4],
    ["range", "fallRate", "💦 how fast it falls (100 = the usual)", 25, 400, 50, 250],
    ["choice", "fallTime", "🌗 time of day (outside the cave too)", [["day", "☀️ day"], ["sunset", "🌇 sunset"], ["night", "🌙 night"]]],
    // the cave behind the falls: gems on its walls, sparkling
    ["range", "caveGems", "💎 gems on the walls", 0, 40, 6, 30],
    ["choice", "gemShape", "✨ sparkles: shape", STAR_SHAPES],
    ["range", "gemSize", "✨ sparkles: size (100 = the usual, up to huge)", 25, 2000, 60, 600],
    ["range", "gemBright", "✨ sparkles: brightness", 5, 100, 50, 100],
    ["range", "gemTwinkle", "✨ sparkles: twinkle (the big bright ones turn, grow and shrink, and glimmer)", 0, 100, 20, 100],
    // the camp site
    ["choice", "campTime", "🌗 time of day", [["day", "☀️ day"], ["sunset", "🌇 sunset"], ["night", "🌙 night"]]],
    ["choice", "starShape", "⭐ stars: shape", STAR_SHAPES],
    ["range", "starSize", "⭐ stars: size (100 = the usual, up to huge)", 25, 2000, 60, 600],
    ["range", "starBright", "⭐ stars: brightness", 5, 100, 50, 100],
    ["range", "starTwinkle", "✨ stars: twinkle (the big bright ones turn, grow and shrink, and glimmer)", 0, 100, 20, 100],
    ["toggle", "fireOn", "🔥 the campfire is lit"],
    ["range", "flameSize", "🔥 flame size", 20, 250, 60, 160],
    ["choice", "campFood", "🍲 on the fire", [["none", "nothing"], ["sausages", "🌭 veggie sausages on sticks"], ["soup", "🍲 a pot of soup"]]],
    ["range", "tents", "⛺ tents", 0, 3, 1, 3],
    ["choice", "tent", "⛺ which tent", CAMP_TENTS.map((T, i) => [i + 1, `⛺ ${i + 1}: ${T.name}`])],
    // (ticket 185) the things put in any place; and the forest crossing: which paths meet, its floor
    ["things", "things", "🪨 things to put here, then drag them where they go"],
    ["group", "crossPaths", "🛤️ the paths that meet here", CROSS_DIRS.map(([d, label]) => ["toggle", "cross" + d, label])],
    ["color", "crossFloor", "🌿 the forest floor", CROSS_FLOORS],
    ["choice", "crossBack", "🌄 off in the distance", CROSS_BACKS],
    // the forest clearing: what is far off down its paths
    ["toggle", "seeHouse", "🏠 see the family house"],
    ["toggle", "seeTree", "🌳 see the tree house"],
    ["toggle", "seeWitch", "🧙 see the witch's hut"],
    ["toggle", "seeCastle", "🏰 see the castle"],
    // the castles: which one stands in the clearing, and each one's own
    // settings (only the one picked shows its sliders)
    ["choice", "castle", "🏰 whose castle", CASTLES.map(([id, label]) => [id, label])],
    ...CASTLES.flatMap(([id]) => [
      ["group", "castleLook" + id, `🏰 ${id}'s castle`, [
        ["range", "castleLevels" + id, "🏰 levels", 1, 5, 1, 5],
        ["color", "castleStone" + id, "🪨 stone", CASTLE_STONES],
        ["range", "castleTrees" + id, "🌳 trees nearby", 0, 16, 0, 12],
        ["range", "castleMoat" + id, "🌊 moat and drawbridge", 0, 250, 0, 200],
        ["color", "castleRoof" + id, "🔺 roofs", CASTLE_ROOFS]]],
      ["group", "castleThemes" + id, `🎨 ${id}'s castle: its color themes`, [
        ["group", "castleThemeA" + id, "🎨 theme A (and the castle's own flags)", [
          ["color", "castleFlagA" + id, "🚩 color 1", CASTLE_FLAG_COLORS],
          ["color", "castleFlagB" + id, "🚩 color 2", CASTLE_FLAG_COLORS],
          ["choice", "castleFlagStyle" + id, "🚩 the two colors", CASTLE_FLAG_STYLES],
          ["color", "castleCarpet" + id, "🟥 carpet", CARPET_COLORS]]],
        ["group", "castleThemeB" + id, "🎨 theme B", [
          ["color", "castleFlagA_B" + id, "🚩 color 1", CASTLE_FLAG_COLORS],
          ["color", "castleFlagB_B" + id, "🚩 color 2", CASTLE_FLAG_COLORS],
          ["choice", "castleFlagStyle_B" + id, "🚩 the two colors", CASTLE_FLAG_STYLES],
          ["color", "castleCarpet_B" + id, "🟥 carpet", CARPET_COLORS]]]]],
      ["group", "castleRoomList" + id, `🚪 ${id}'s castle: its rooms`, [
        ["castlejump", "castleGo" + id, "🚶 go straight to"],
        ["range", "castleRooms" + id, "🚪 how many rooms", 1, ROOM_MAX, 1, 6],
        ["castledesigner", "castleDesign" + id, "🗺️ castle designer"]]],
      ...ROOM_NS.map(n => ["group", "castleRoomBox" + n + id, `🚪 ${id}'s castle: room ${n}`, [
        ["choice", "castleRoom" + n + id, `🚪 room ${n} is`, CASTLE_ROOM_CHOICES],
        ["choice", "castleRoomTheme" + n + id, "🎨 its colors", THEMES],
        ...Object.entries(ROOM_BONES).map(([st, most]) => ["range", roomBonesKey(id, n, st), "💀 skeletons (0 = none)", 0, most, 0, 0]),
        ["range", "castlePlaces" + n + id, "🍽️ places at table", 4, 18, 4, 18],
        ["range", "castleHallDoors" + n + id, "🚪 doors in its walls", 0, DOOR_MAX, 0, 4, b => roomDoorMax(castleOf({ ...b, castle: id }).rooms[n - 1] ?? "king")],
        ...DOOR_JS.map(k => ["choice", hallDoorKey(id, n, k), `🚪 door ${k} leads to`, hallDoorDests(id)]),
        ["choice", "castleFar" + n + id, "🚪 the door in its far wall leads to", backDests(id)],
        ["choice", "castleHallEnd" + n + id, "🌀 the stairs at its end lead to", hallEnds(id)],
        ["choice", "castleOut" + n + id, "↩️ its way out leads to", wayOutDests(id)],
        ["choice", "castleBack" + n + id, "⬇️ behind you (a door we can't see) leads to", backDests(id)]],
        b => b.kind === "castleroom" && (b.castle ?? "N") === id && Math.round(b.castleRoom ?? 1) === n]),
      // (its residents, each kind in a box of its own, each one in its own box in that: RESIDENTS)
      ...Object.values(RESIDENTS).map(R => ["group", R.group[0] + id, R.group[1](id), [
        ["range", R.count[0] + id, R.group[2], 0, R.count[1], 0, R.count[1]],
        ...R.list.map((_, i) => ["group", R.box[0] + (i + 1) + id, R.box[1](i + 1), R.fields.map(([what, kind, label, opts]) => {
          const key = R.key + (i + 1) + what + id;
          return kind === "range" ? ["range", key, label, ...opts] : kind === "lfo" ? ["choice", key, label, [["none", opts], ...LFO_NAMES.map(L => [L, "LFO " + L])]] : [kind, key, label, opts];
        })])]])]),
    ["toggle", "seeHealer", "🌿 see the healer's hut"],
    // inside the witch's hut (the witch herself: drag her)
    ["range", "witchSize", "🧙 the witch's size (drag her to move her)", 30, 250, 70, 150],
    ["range", "cauldronSize", "🫕 cauldron size", 40, 250, 70, 160],
    ["range", "crows", "🐦‍⬛ crows in cages", 0, 6, 1, 6],
    ["range", "frogs", "🐸 frogs in jars", 0, 8, 2, 8],
    ["range", "snakes", "🐍 snakes in the tank", 0, 6, 1, 5],
    // the fairy forest: its time of day, its ring of toadstools, its fairy house
    ["choice", "fairyTime", "🌗 time of day", FAIRY_TIMES],
    ["range", "mushrooms", "🍄 toadstools in the ring", 4, 30, 8, 24],
    ["range", "fairyHouseSeen", "🏡 the fairy house: how much it shows (0 = hidden)", 0, 100, 40, 100],
    ["choice", "fairyHouseLfo", "〰️ the fairy house fades with", [["none", "no LFO"], ...LFO_NAMES.map(L => [L, "LFO " + L])]],
    // inside the healer's hut (the healer herself: drag her)
    ["range", "healerSize", "🌿 the healer's size (drag her to move her)", 30, 250, 70, 150],
    ["color", "healerCatFur", "🐈 the healer's cat: fur", ["#e8862a", "#1f1f22", "#6b4226", "#9ca3af", "#ffffff", "#8b5cf6"]],
    ["color", "healerCatWhite", "🐈 the healer's cat: tuxedo (nose, chest, paws)", ["#ffffff", "off", "#f7ead8", "#ffd1dc", "#c0c0c0", "#1f1f22"]],
    ["color", "healerCatEyes", "🐈 the healer's cat: eyes", ["#22c55e", "#c6d43a", "#e0a800", "#3b82f6", "#f28c28"]],
    // the living room
    ["choice", "view", "🪟 outside the window", PICTURE_CHOICES],
    ["choice", "livingBack", "⬇️ behind you (a door we can't see) leads to", BEHIND_PLACES],
    ["range", "viewDetail", "🪟 outside the window: detail (0 = a blur, 100 = all of it)", 0, 100, 30, 100],
    ["range", "couchSize", "🛋️ couch size", 60, 140, 80, 120],
    ["range", "pillows", "🛋️ pillows", 0, 8, 2, 7],
    // pictures on the walls, of the other scenes
    ["range", "pictures", "🖼️ pictures on the wall", 0, 6, 1, 6],
    ["range", "picDetail", "🖼️ picture detail (0 = a blur, 100 = all of it)", 0, 100, 20, 100],
    ["range", "picSize", "🖼️ picture size", 50, 150, 70, 130],
    ["choice", "pic1", "🖼️ picture 1", PICTURE_CHOICES],
    ["choice", "pic2", "🖼️ picture 2", PICTURE_CHOICES],
    ["choice", "pic3", "🖼️ picture 3", PICTURE_CHOICES],
    ["choice", "pic4", "🖼️ picture 4", PICTURE_CHOICES],
    ["choice", "pic5", "🖼️ picture 5", PICTURE_CHOICES],
    ["choice", "pic6", "🖼️ picture 6", PICTURE_CHOICES],
  ]],
  ["🎮 Controls", "controls", [
    ["padmap", "map", "🎮 game controller"],
  ]],
  ["🎵 Music", "music", [
    ["musicbig", "big", "⛶ full screen"],
    ["flip", "mute", ["🔊 sound on: tap to mute", "🔇 muted: tap for sound"]],
    ["note", "now", nowPlaying],
    ["transport", "where", "⏯️ where the tune is"],
    ["tunes", "track", "🎶 the kind of music, then the tune"],
    ["range", "volume", "🔊 volume", 0, 100, 40, 80],
    ["range", "tempo", "🏃 tempo (% of the tune's own speed)", 25, 300, 80, 130],
    ["range", "transpose", "🎹 transpose (half steps: + higher, − lower)", -24, 24, -5, 5],
    ["nudge", "transpose", "🎹 move the tune by an interval", -24, 24, "interval"],
    ["mixer", "mix", "🎚️ mixing board"],
  ]],
  // (ticket 185, Matthew) after the music, before Advanced: the world designer
  ["🗺️ World design", "world", [
    ["world", "grid", "🗺️ world design"],
  ]],
  // (ticket 155) last, where the GitHub chip was
  ["⚙️ Advanced", "advanced", [
    ["advanced", "perf", "⚙️ advanced"],
  ]],
];

let tab = 0;
let syncs = [];   // each control's refresh, run after every change
let hudSyncs = [];   // ...and the full-screen controls'

function set(part, key, value) {
  if (part === "background" && key === "kind" && value !== state.background.kind) worldChoose(value);   // (ticket 185: a place is its square)
  const wasBare = state.background.kind === "none";
  state[part][key] = value;
  // (ticket 132) the Body tab: a pose, from scratch; an animation seen from
  // the side turns a friend who faces us to our right
  if (part === "body" && key === "pose") strikePose(value);
  if (part === "body" && key === "anim" && ANIM_SIDEWAYS[value] && state.body.facing === "front") state.body.facing = "right";   // (away from us, they step in place: ticket 138)
  if (part === "body" && key === "anim" && value === "climb") { state.body.facing = "front"; state.body.turn = ""; }   // (the ladder is behind them, facing us)
  if (part === "body" && key === "facing") state.body.turn = "";   // (ticket 144: a chip's way, not turned)
  if (part === "body" && key === "anim" && value === "climbup") state.body.facing = "back";   // (up a place's ladder, facing it: ticket 138)
  if (part === "body" && key === "anim") climb = null;   // (ticket 137: a climb starts afresh)
  if (part === "body" && key === "anim" && isJump(value)) startJump("none", value);   // (ticket 138: once, then still)
  // (walking, running, crawling and climbing start from standing: sitting
  // or cross-legged, they had nothing to move with)
  if (part === "body" && key === "anim" && value !== "none" && value !== "swim" && state.body.pose !== "stand") strikePose("stand");
  // choosing an animal dresses it in its natural colors
  if (part === "costume" && key === "kind" && ANIMALS[value]) Object.assign(state.costume, lookOf(value));
  // a skirt starts at skirt length and a dress at dress length
  if (part === "pants" && key === "style" && value === "skirt") state.pants.skirtLen = 50;
  if (part === "pants" && key === "style" && value === "dress") state.pants.skirtLen = 95;
  if (part === "background" && key === "kind") trips.length = 0;
  // you are always inside a house the tree has: going into house 6 grows
  // the tree to six houses, and fewer houses take you to the last one left
  if (part === "background" && key === "inside" && value > (state.background.houses ?? 4)) state.background.houses = value;
  if (part === "background" && key === "houses" && (state.background.inside ?? 1) > value) state.background.inside = value;
  // the same for the tents: going into tent 3 puts up three
  if (part === "background" && key === "tent" && value > (state.background.tents ?? 2)) state.background.tents = value;
  if (part === "background" && key === "tents" && value > 0 && (state.background.tent ?? 1) > value) state.background.tent = value;
  // arriving at a place lands the friend on its ground (not in the fire)
  if (part === "background" && key === "kind") [state.background.figX, state.background.figY] = ARRIVE[value] || [0, 0];
  // different hands start alike; then each changes on its own
  if (part === "hands" && key === "different" && value)
    for (const k of HAND_OWN) state.rightHand[k] = state.hands[k];
  if (part === "shoes" && key === "different" && value)
    for (const k of SHOE_OWN) state.rightShoe[k] = state.shoes[k];
  // a bikini comes with its top; trunks and briefs start without one
  if (part === "undies" && key === "style") state.undies.top = value === "bikini";
  // a figure too big for the stage, once a background is chosen, shrinks
  // to fit it (once: after that its size is the slider's)
  if (part === "background" && key === "kind" && value !== "none" && wasBare) {
    // (the usual figure, at its usual size, stands well inside the stage:
    // only a much bigger one shrinks)
    const n = naturalFrame, fit = Math.min((SCENE.ground - SCENE.top) / (n.ground - n.top), SCENE.left / n.left);
    if (fit < 0.98 * (state.background.figSize ?? 100) / 100 * sceneFig(value))
      state.background.figSize = Math.max(10, Math.floor(100 * fit / sceneFig(value)));
  }
  changed();
}
// (ticket 163) A frame of movement (the controller walking or climbing, a
// drag) does what an animation with no background does: it draws, and
// feeds the music. The rest of changed() (every control's refresh, the
// full-screen controls, the save to localStorage, the music's and the back
// chip's state) waits for settle(), a few times a second while it goes on,
// and once when it stops: on a slow computer (the black laptop) those, every
// frame, were what a walk in a place had and an animation with no
// background did not.
// And on a computer where a drawing costs more than a frame can spare
// (DRAW_SLOW ms, on average), the friend is drawn at most every MOVE_EVERY
// ms while they move: as an animation with no background is (treadTick),
// which looked fine on the black laptop when every place did not. The
// picture's own frames stay at 60; the friend's place and pose catch up
// 30 times a second. The last move is always drawn (force).
const DRAW_SLOW = 6, MOVE_EVERY = 30;
let settleTimer = 0, drawAvg = 0, movedLast = 0, movedTrail = 0, movedDraws = 0, movedMs = 0;
function moved(force = false) {
  const t = performance.now();
  if (!force) noteMoveFrame(t);   // (ticket 164: frames dropping while moving)
  stillPicMoved(t);   // (ticket 164: the place a still picture while moving, on a slow computer)
  if (!force && drawAvg > DRAW_SLOW && t - movedLast < MOVE_EVERY) {
    // (the latest move drawn soon even if no other comes: a held-still drag, a stop)
    if (!movedTrail) movedTrail = setTimeout(() => { movedTrail = 0; moved(true); }, MOVE_EVERY - (t - movedLast));
    if (!settleTimer) settleTimer = setTimeout(settle, 250);
    return;
  }
  clearTimeout(movedTrail); movedTrail = 0;
  movedLast = t;
  draw();
  const ms = performance.now() - t;
  drawAvg = drawAvg ? 0.85 * drawAvg + 0.15 * ms : ms;
  perfMeter.ms += ms; perfMeter.draws++; movedDraws++; movedMs += ms;
  feedMusic();
  if (!settleTimer) settleTimer = setTimeout(settle, 250);
}
function settle() {
  clearTimeout(settleTimer); settleTimer = 0;
  worldKeep();   // (ticket 185: a forest crossing edited in its square, kept there, before it is saved)
  for (const f of syncs) f(); for (const f of hudSyncs) f(); persist(); musicSync(); backSync();
  if (!hud.hidden && hudKey() !== hudShown) renderHud();
}
function changed() {
  worldKeep();   // (ticket 185, as in settle: before the drawing, which reads a crossing's live paths from it)
  const t0 = performance.now(); draw(); perfMeter.ms += performance.now() - t0; perfMeter.draws++;   // (ticket 155: for the ⚙️ advanced tab's meter)
  for (const f of syncs) f(); for (const f of hudSyncs) f(); persist(); musicSync(); backSync(); feedMusic();
  // a new friend (loaded, started over, surprised) or a scene turned on or
  // off rebuilds the HUD; a slider moving in it does not
  if (!hud.hidden && hudKey() !== hudShown) renderHud();
}

function el(tag, attrs = {}, kids = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
  }
  for (const k of [].concat(kids)) e.append(k);
  return e;
}

// Iris color and eye whites only mean something once there is an iris.
const SHOWN_WHEN = {
  "body.unpose": posed,
  "body.hugLift": b => b.pose === "hug",
  "face.irisColor": f => f.iris > 0,
  "face.earSize": f => !!f.ears && f.ears !== "none",
  "face.nose": f => f.noseView === "right" || f.noseView === "left",
  "face.noseFront": f => f.noseView === "front",
  "face.witchDir": f => f.noseView === "witch",
  "face.witchLen": f => f.noseView === "witch",
  "face.teeth": f => f.teethStyle === "spikes",
  "face.tongueLen": f => f.tongue === "out",
  "face.tongueW": f => f.tongue === "out",
  "face.tongueColor": f => f.tongue !== "none",
  "face.noseH": f => f.noseView !== "none",
  "face.noseW": f => f.noseView !== "none",
  "face.whites": f => f.iris > 0,
  "costume.fur": c => !!ANIMALS[c.kind],
  "costume.furPattern": c => !!(ANIMALS[c.kind] && ANIMALS[c.kind].suit),
  "costume.witchColor": c => c.kind === "witch",
  ...Object.fromEntries(["wingStyle", "wingFlutter", "fairyOutfit", "tunicStyle", "fairyShoes", "fairyShoeColor"].map(k => ["costume." + k, c => c.kind === "fairy"])),
  "costume.wingLfo": c => c.kind === "fairy" && c.wingFlutter !== false,
  "costume.wreath": c => c.kind === "fairy",
  ...Object.fromEntries(["ghostRagged", "ghostEyes", "ghostHideEyes", "ghostColor"].map(k => ["costume." + k, c => c.kind === "ghost"])),
  "costume.wreathFlowers": c => c.kind === "fairy" && c.wreath !== false,
  ...Object.fromEntries(Object.keys(FAIRY_WINGS).map(id => ["costume.wingColor_" + id, c => c.kind === "fairy" && (c.wingStyle ?? "butterfly") === id])),
  ...Object.fromEntries(Object.keys(FAIRY_TUNICS).map(id => ["costume.tunicColor_" + id, c => c.kind === "fairy" && (c.tunicStyle ?? "petal") === id])),
  "costume.webColor": c => c.kind === "witch",
  "costume.webStyle": c => c.kind === "witch",
  "costume.trimColor": c => c.kind === "witch",
  "costume.witchCat": c => c.kind === "witch",
  "costume.catFur": c => c.kind === "witch" && c.witchCat,
  "costume.catWhite": c => c.kind === "witch" && c.witchCat,
  "costume.catEyes": c => c.kind === "witch" && c.witchCat,
  "costume.catNose": c => c.kind === "witch" && c.witchCat,
  "costume.broom": c => c.kind === "witch",
  "costume.catSize": c => c.kind === "witch" && c.witchCat,
  "costume.broomSize": c => c.kind === "witch" && c.broom,
  "costume.bootColor": c => c.kind === "witch",
  "background.figSize": b => b.kind !== "none",
  "background.lfoFast": b => !!sceneLfoThings(b).fast, "background.lfoSlow": b => !!sceneLfoThings(b).slow, "background.lfoWings": b => !!sceneLfoThings(b).wings,
  "background.figPos": b => b.kind !== "none",
  "background.objectsOff": b => b.kind !== "none",
  "background.waterSee": b => !!waterHere(b), "background.waterWake": b => !!waterHere(b),
  "background.waterTread": b => !!waterHere(b) && !SHALLOW_WATER[b.kind],
  "background.chickenLegs": b => b.kind === "witch",
  "background.legSize": b => b.kind === "witch" && b.chickenLegs,
  "background.hutNear": b => b.kind === "witch",
  "background.eyeRate": b => b.kind === "witch",
  "background.eyeGlow": b => b.kind === "witch",
  "background.skullMax": b => b.kind === "witch",
  "background.blinkApart": b => b.kind === "witch" && b.eyeRate > 0 && b.eyeGlow > 0,
  "background.skullEye": b => b.kind === "witch",
  "background.ducks": b => b.kind === "lake",
  "background.duckSize": b => b.kind === "lake",
  "background.cattails": b => b.kind === "lake",
  "background.clouds": b => b.kind === "lake",
  "background.cloudSize": b => b.kind === "lake",
  "background.houseSize": b => b.kind === "house",
  "background.treeSize": b => b.kind === "house" || b.kind === "treehouse",
  "background.treeHouseSize": b => b.kind === "treehouse",
  "background.toys": b => b.kind === "house",
  "background.flowers": b => b.kind === "house",
  "background.houses": b => b.kind === "treehouse",
  "background.bridges": b => b.kind === "treehouse",
  "background.ladders": b => b.kind === "treehouse",
  "background.leaves": b => b.kind === "treehouse",
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].flatMap(n => Object.entries(HOUSE_COLOR_DEFAULTS).flatMap(([kind, d]) =>
    Object.keys(d).map(k => ["background." + k + n, b => b.kind === "treehouse" && b.houses >= n && b["house" + n] === kind])))),
  "background.house1": b => b.kind === "treehouse" && b.houses >= 1,
  "background.house2": b => b.kind === "treehouse" && b.houses >= 2,
  "background.house3": b => b.kind === "treehouse" && b.houses >= 3,
  "background.house4": b => b.kind === "treehouse" && b.houses >= 4,
  "background.house5": b => b.kind === "treehouse" && b.houses >= 5,
  "background.house6": b => b.kind === "treehouse" && b.houses >= 6,
  "background.inside": b => b.kind === "treeroom",
  ...Object.fromEntries(["peakHeight", "mtClouds", "birds", "farLake"].map(key => ["background." + key, b => b.kind === "mountains"])),
  ...Object.fromEntries(["vines", "parrots"].map(key => ["background." + key, b => b.kind === "waterfall"])),
  // (the cave sees the falls from behind: their width and mist)
  ...Object.fromEntries(["fallWidth", "mist", "fallRate", "fallTime"].map(key => ["background." + key, b => b.kind === "waterfall" || b.kind === "cave"])),
  ...Object.fromEntries(["caveGems", "gemShape", "gemSize", "gemBright", "gemTwinkle"].map(key => ["background." + key, b => b.kind === "cave"])),
  ...Object.fromEntries(["campFood", "tents"].map(key => ["background." + key, b => b.kind === "campsite"])),
  ...Object.fromEntries(["crossPaths", "crossFloor", "crossBack"].map(key => ["background." + key, b => b.kind === "crossing"])),
  "background.things": b => b.kind !== "none",
  // (a tent's door looks out on the camp: its time of day and its fire)
  ...Object.fromEntries(["campTime", "fireOn"].map(key => ["background." + key, b => b.kind === "campsite" || b.kind === "tent"])),
  ...Object.fromEntries(["starShape", "starSize", "starBright", "starTwinkle"].map(key =>
    ["background." + key, b => ((b.kind === "campsite" || b.kind === "tent") && b.campTime === "night") || (b.kind === "fairyforest" && b.fairyTime === "night")])),
  "background.tent": b => b.kind === "tent",
  "background.flameSize": b => b.kind === "campsite" && b.fireOn,
  ...Object.fromEntries(["seeHouse", "seeTree", "seeWitch", "seeCastle", "seeHealer"].map(key => ["background." + key, b => b.kind === "clearing"])),
  "background.castle": b => b.kind === "clearing" || b.kind === "castle" || b.kind === "castleroom",
  ...Object.fromEntries(CASTLES.flatMap(([id]) => ["castleLevels", "castleStone", "castleTrees", "castleMoat", "castleRoof"].map(key =>
    ["background." + key + id, b => (b.kind === "clearing" || b.kind === "castle") && (b.castle ?? "N") === id]))),
  // (the flags show in the king's room too: its banners and shields)
  ...Object.fromEntries(CASTLES.flatMap(([id]) => ["castleFlagA", "castleFlagB", "castleFlagStyle"].map(key =>
    ["background." + key + id, b => (b.kind === "clearing" || b.kind === "castle" || b.kind === "castleroom") && (b.castle ?? "N") === id]))),
  // (the carpet, when the castle has a hallway among its rooms)
  ...Object.fromEntries(CASTLES.map(([id]) => ["background.castleCarpet" + id, b => (b.kind === "castle" || b.kind === "castleroom") && (b.castle ?? "N") === id])),
  // (the castle's groups: its look where it is seen, its rooms and each room's own at the castle and inside it)
  ...Object.fromEntries(CASTLES.flatMap(([id]) => {
    const atCastle = b => (b.kind === "castle" || b.kind === "castleroom") && (b.castle ?? "N") === id;
    const nRooms = b => Math.max(1, Math.min(ROOM_MAX, Math.round(b["castleRooms" + id] ?? CASTLE_ROOMS[id].length)));
    const typeOf = (b, n) => b["castleRoom" + n + id] ?? CASTLE_ROOMS[id][n - 1];
    const isHall = (b, n) => typeOf(b, n) === "hallway", hasDoors = (b, n) => OWN_EXIT_ROOMS.includes(typeOf(b, n));
    // (its cats: in a cat room of its, and at the castle when it has one)
    const livesHere = st => b => atCastle(b) && (b.kind === "castle" ? ROOM_NS.some(n => n <= nRooms(b) && typeOf(b, n) === st)
                                                                      : typeOf(b, Math.round(b.castleRoom ?? 1)) === st);

    return [["background.castleLook" + id, b => (b.kind === "clearing" || atCastle(b)) && (b.castle ?? "N") === id],
            ["background.castleThemes" + id, b => (b.kind === "clearing" || atCastle(b)) && (b.castle ?? "N") === id], ["background.castleThemeB" + id, atCastle],
            ...ROOM_NS.map(n => ["background.castleRoomTheme" + n + id, b => OWN_EXIT_ROOMS.includes(typeOf(b, n))]),
            // (its residents: where they live, and as many as there are)
            ...Object.values(RESIDENTS).flatMap(R => [["background." + R.group[0] + id, livesHere(R.room)],
              ...R.list.map((_, i) => ["background." + R.box[0] + (i + 1) + id, b => livesHere(R.room)(b) && i + 1 <= Math.round(b[R.count[0] + id] ?? R.count[2])])]),
            ["background.castleRoomList" + id, atCastle], ["background.castleGo" + id, atCastle], ["background.castleDesign" + id, atCastle],
            ...ROOM_NS.flatMap(n => [["background.castleRoomBox" + n + id, b => atCastle(b) && n <= nRooms(b) && (b.kind === "castle" || Math.round(b.castleRoom ?? 1) === n)],
              ["background.castleHallDoors" + n + id, b => hasDoors(b, n)], ["background.castleHallEnd" + n + id, b => isHall(b, n)],
              ["background.castleOut" + n + id, b => !isHall(b, n)], ["background.castleFar" + n + id, b => typeOf(b, n) === "dining"],
              // (the door behind us: where a room has no sign at the bottom already; never a dungeon, a pit with no way in but from above)
              ["background.castleBack" + n + id, b => ["hall", "trap", "all"].includes(ROOM_KINDS[typeOf(b, n)]?.exits)], ["background.castlePlaces" + n + id, b => typeOf(b, n) === "dining"],
              ...DOOR_JS.map(k => ["background." + hallDoorKey(id, n, k), b => hasDoors(b, n) && k <= Math.min(roomDoorMax(typeOf(b, n)), Math.round(b["castleHallDoors" + n + id] ?? 3))])])];
  })),
  ...Object.fromEntries(CASTLES.flatMap(([id]) => [["background.castleRooms" + id, b => (b.kind === "castle" || b.kind === "castleroom") && (b.castle ?? "N") === id],
    ...ROOM_NS.map(n => ["background.castleRoom" + n + id,
      b => (b.kind === "castle" || b.kind === "castleroom") && (b.castle ?? "N") === id && n <= (b["castleRooms" + id] ?? CASTLE_ROOMS[id].length)]),
    ...ROOM_NS.flatMap(n => Object.keys(ROOM_BONES).map(st => ["background." + roomBonesKey(id, n, st),
      b => (b.kind === "castle" || b.kind === "castleroom") && (b.castle ?? "N") === id && n <= (b["castleRooms" + id] ?? CASTLE_ROOMS[id].length) &&
           (b["castleRoom" + n + id] ?? CASTLE_ROOMS[id][n - 1] ?? "king") === st]))])),
  ...Object.fromEntries(["witchSize", "cauldronSize", "crows", "frogs", "snakes"].map(key => ["background." + key, b => b.kind === "witchroom"])),
  ...Object.fromEntries(["healerSize", "healerCatFur", "healerCatWhite", "healerCatEyes"].map(key => ["background." + key, b => b.kind === "healerroom"])),
  ...Object.fromEntries(["fairyTime", "mushrooms", "fairyHouseSeen", "fairyHouseLfo"].map(key => ["background." + key, b => b.kind === "fairyforest"])),
  "background.livingBack": b => b.kind === "livingroom",
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map(n => ["background.treeBack" + n, b => b.kind === "treeroom" && (b.inside ?? 1) === n])),
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].flatMap(n => [["background.room" + n, b => b.kind === "treeroom" && (b.inside ?? 1) === n],
    ...[1, 2].map(i => [`background.r${n}pic${i}`, b => b.kind === "treeroom" && (b.inside ?? 1) === n && b.pictures >= i])])),
  "background.windowSize": b => b.kind === "treeroom",
  "background.things": b => b.kind === "treeroom",
  "background.couchSize": b => b.kind === "livingroom",
  "background.view": b => b.kind === "livingroom",
  "background.viewDetail": b => b.kind === "livingroom",
  "background.pillows": b => b.kind === "livingroom",
  "background.pictures": b => b.kind === "livingroom" || b.kind === "treeroom",
  "background.picDetail": b => (b.kind === "livingroom" || b.kind === "treeroom") && b.pictures > 0,
  "background.picSize": b => b.kind === "livingroom" && b.pictures > 0,
  "background.pic1": b => b.kind === "livingroom" && b.pictures >= 1,
  "background.pic2": b => b.kind === "livingroom" && b.pictures >= 2,
  "background.pic3": b => b.kind === "livingroom" && b.pictures >= 3,
  "background.pic4": b => b.kind === "livingroom" && b.pictures >= 4,
  "background.pic5": b => b.kind === "livingroom" && b.pictures >= 5,
  "background.pic6": b => b.kind === "livingroom" && b.pictures >= 6,
  "costume.marks": c => !!ANIMALS[c.kind],
  "costume.spot": c => c.furPattern === "rosettes" && !!(ANIMALS[c.kind] && ANIMALS[c.kind].suit),
  "costume.belly": c => !!ANIMALS[c.kind],
  "costume.eyes": c => !!ANIMALS[c.kind],
  "costume.accent": c => !!ANIMALS[c.kind],
  "hair.length": h => ["long", "curly", "pigtails", "spiky", "afro"].includes(h.style),
  "hair.bangs": h => !!BANG_LOCKS[h.style],
  "pants.skirtLen": p => p.style === "skirt" || p.style === "dress",
  // the same hands: one style menu, and its sliders below the color;
  // different hands: a column each (claws: also a cat costume's paws)
  "hands.style": h => !h.different,
  "hands.rightHand": h => !!h.different,
  ...Object.fromEntries(Object.keys(SLIDER_STYLE).map(k =>
    ["hands." + k, h => (!h.different && handSliderShown(k, h)) || ((k === "clawLen" || k === "clawCount") && clawedSuit())])),
  // the feet as the hands: one style menu and its toe slider, or a column each
  "shoes.style": sh => !sh.different,
  "shoes.rightShoe": sh => !!sh.different,
  "shoes.toes": sh => !sh.different && sh.style === "human",
  "shoes.alienToes": sh => !sh.different && sh.style === "alien",
  "shoes.talonCount": sh => !sh.different && sh.style === "talons",
  "undies.style": u => u.on,
  "undies.top": u => u.on && u.style !== "onepiece",
  "undies.color": u => u.on,
  "undies.pattern": u => u.on,
  "undies.patternSize": u => u.on && u.pattern !== "plain",
  "undies.patternColor": u => u.on && u.pattern !== "plain",
  "shirt.patternSize": c => c.pattern !== "plain",
  "shirt.patternColor": c => c.pattern !== "plain",
  "pants.patternSize": c => c.pattern !== "plain",
  "pants.patternColor": c => c.pattern !== "plain",
};

// Pinning a slider puts it in the full-screen controls (the HUD); the
// pins are part of the friend, saved and loaded with it.
const pinned = id => (state.hud.pins || []).includes(id);
// a HUD slider folded away to its name: part of the friend too
const folded = id => (state.hud.min || []).includes(id);
function toggleMin(id) {
  const min = state.hud.min || [];
  state.hud.min = folded(id) ? min.filter(x => x !== id) : [...min, id];
  changed();
}
function togglePin(id) {
  const pins = state.hud.pins || [];
  state.hud.pins = pinned(id) ? pins.filter(x => x !== id) : [...pins, id];
  changed(); renderHud();
}
// (while the HUD is built: its sliders have no pins -- pinning is for
// the editor, not the performance)
let buildingHud = false;
// The castle designer, in its rooms' box: the castle as a map (Cytoscape.js,
// loaded from a CDN the first time it is opened), each room a node and each
// way between rooms an arrow, the room you are in ringed. Tap a way to set
// where it leads, a room to see its ways (or go there); below the map, what
// looks wrong, each with a fix. Doors are two-way to start with: setting
// where a way leads gives the room it leads to a door back, where it has
// space for one.
const CYTOSCAPE = { src: "https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.4/cytoscape.min.js",
                    sri: "sha512-xpXUCbrkyJCwC5noJXZqec9rSXdRgFfDoL7Q9/pCPe54Y04OlqwPobMcNuA5NPJ7DRR51OIr6xcOH2wUspyKDQ==" };
let cytoscapeLoad = null;
const loadCytoscape = () => cytoscapeLoad ||= new Promise((res, rej) => {
  if (window.cytoscape) return res(window.cytoscape);
  document.head.append(el("script", { src: CYTOSCAPE.src, integrity: CYTOSCAPE.sri, crossorigin: "anonymous", referrerpolicy: "no-referrer",
    onload: () => res(window.cytoscape), onerror: () => { cytoscapeLoad = null; rej(new Error("the map didn't load")); } }));
});
const MAP_STYLE = [
  { selector: "node", style: { label: "data(label)", "text-valign": "center", "text-halign": "center", "text-wrap": "wrap", "font-size": 13, "line-height": 1.1,
                               shape: "round-rectangle", width: 50, height: 46, "background-color": "#efe6d2", "border-width": 2, "border-color": "#8a6d3b", color: "#2a1d0e" } },
  { selector: "node.outside", style: { width: 76, "background-color": "#cfe8c4", "border-color": "#4f7a43" } },
  { selector: "node.here", style: { "border-color": "#7c5cff", "border-width": 5 } },
  { selector: "node.picked", style: { "border-color": "#e8b923", "border-width": 5 } },
  { selector: "edge", style: { width: 2.5, "curve-style": "bezier", "line-color": "#b9a98f", "target-arrow-color": "#b9a98f", "target-arrow-shape": "triangle",
                               label: "data(label)", "font-size": 12, "text-background-color": "#f6f0e2", "text-background-opacity": 0.9, "text-background-padding": 1, "text-background-shape": "roundrectangle" } },
  { selector: "edge.pit, edge.ladder", style: { "line-style": "dashed" } },
  { selector: "edge.fixed", style: { "line-color": "#8c8579", "target-arrow-color": "#8c8579" } },
  { selector: "edge.bad", style: { "line-color": "#e0533b", "target-arrow-color": "#e0533b", width: 3.5 } },
  { selector: "edge.picked", style: { "line-color": "#e8b923", "target-arrow-color": "#e8b923", width: 5 } },
];
const MAP_LAYOUT = n => n <= 6 ? { name: "breadthfirst", roots: ["r0"], directed: false, spacingFactor: 1.1, padding: 14, animate: false }
                             : { name: "circle", startAngle: -Math.PI / 2, padding: 14, animate: false, sort: (a, b) => +a.id().slice(1) - +b.id().slice(1) };
const MAP_FIXED = { pit: "A trap room's pits drop into the castle's dungeons (the first, then the deep one); a dungeon's ladder climbs back.",
                    arch: "The greenhouse has an archway to every room but the dungeons (they are fallen into).",
                    gate: "The castle's gate always leads into room 1." };
function castleDesigner(part, key, box, syncs) {
  const id = key.replace("castleDesign", ""), B = () => state[part];
  let open = false, cy = null, sig = "", picked = null, twoWay = true;
  const toggle = el("button", { onclick: () => { open = !open; picked = null; draw(); } });
  const map = el("div", { class: "map" }), note = el("p", { class: "note" }), rooms = el("div", { class: "row" }), edit = el("div", { class: "row" }),
        tools = el("div", { class: "row" }), probs = el("div"), panel = el("div", { class: "designer" }, [map, note, rooms, edit, tools, probs]);
  box.append(toggle, panel);
  const eid = e => `e${e.from}-${e.kind}${e.j ?? e.i ?? ""}${e.way ? "w" : ""}`;
  const pickOf = e => e.key || eid(e);
  const go = n => { const b = B(); if (n) { b.kind = "castleroom"; b.castleRoom = n; } else b.kind = "castle"; [b.figX, b.figY] = ARRIVE[b.kind] || [0, 0]; changed(); };
  const setWay = (e, v) => {
    const b = B(); b[e.key] = v;
    if (twoWay) { const K = castleOf({ ...b, castle: id }), x = roomExits(K, e.from).find(x => x.key === e.key); if (x && x.to) mapWayBack(b, id, e.from, x.to); }
    changed();
  };
  const draw = () => {
    toggle.textContent = open ? "🗺️ close the castle designer" : "🗺️ open the castle designer";
    toggle.setAttribute("aria-pressed", open);
    panel.style.display = open ? "" : "none";
    if (!open) return;
    const b = { ...B(), castle: id }, K = castleOf(b), E = castleGraph(K), P = castleProblems(K);
    const here = b.kind === "castleroom" ? Math.max(1, Math.min(K.rooms.length, Math.round(b.castleRoom ?? 1))) : 0;
    const bad = new Set(P.filter(p => p.e).map(p => eid(p.e)));
    // the rooms, as chips too (the map's nodes, for a small screen or when the map can't load)
    rooms.replaceChildren(el("span", { class: "note" }, "rooms:"), ...[0, ...K.rooms.map((_, i) => i + 1)].map(r =>
      el("button", { "aria-pressed": picked?.room === r, onclick: () => { picked = { room: r }; draw(); } }, r ? `${roomLabel(K.rooms[r - 1]).split(" ")[0]} ${r}` : "🏰 outside")));
    // what is picked: a way, and where it can lead; or a room, and its ways
    const e = picked?.way && E.find(x => pickOf(x) === picked.way);
    if (e) {
      const opts = !e.key ? [] : e.key.startsWith("castleOut") ? wayOutDests(id) : e.key.startsWith("castleBack") || e.key.startsWith("castleFar") ? backDests(id) : e.key.startsWith("castleHallEnd") ? hallEnds(id) : hallDoorDests(id);
      edit.replaceChildren(el("span", {}, `${mapExitName(K, e)} leads to:`), ...(e.key ? opts.filter(([, , vis]) => !vis || vis(b)).map(([v, lab]) =>
        el("button", { "aria-pressed": String(B()[e.key]) === String(v), onclick: () => setWay(e, v) }, typeof lab === "function" ? lab(b) : lab))
        : [el("span", { class: "note" }, MAP_FIXED[e.kind] || "This way is fixed.")]));
    } else if (picked && picked.room !== undefined) {
      const r = picked.room, X = E.filter(x => x.from === r);
      edit.replaceChildren(el("span", {}, `${mapRoomName(K, r)}:`), ...X.map(x => el("button", { onclick: () => { picked = { way: pickOf(x) }; draw(); } },
        `${EXIT_ICONS[x.kind]} ${x.kind === "door" ? "door " + x.j : x.way ? "way out" : EXIT_WORDS[x.kind]} → ${x.to === null ? (x.nowhere ? "🧱 nowhere" : "❓") : mapRoomName(K, x.to)}`)),
        el("button", { onclick: () => go(r) }, "🚶 go there"));
    } else edit.replaceChildren(el("span", { class: "note" }, "Tap a room or an arrow on the map (or a room above) to see where its ways lead, and change them."));
    // two-way doors, and putting everything right at once
    const fixable = P.filter(p => mapCanFix(B(), id, p));
    const fixAll = el("button", { onclick: () => {
      for (let i = 0; i < 40; i++) { const Q = castleProblems(castleOf({ ...B(), castle: id })), p = Q.find(p => mapCanFix(B(), id, p)); if (!p) break; mapFix(B(), id, p); }
      changed(); } }, `🔧 fix everything (${fixable.length})`);
    fixAll.disabled = !fixable.length;
    tools.replaceChildren(
      el("button", { "aria-pressed": twoWay, title: "Setting where a way leads also gives the room it leads to a door back, where it has space", onclick: () => { twoWay = !twoWay; draw(); } }, "↔️ two-way doors"), fixAll);
    // what looks wrong
    probs.replaceChildren(P.length ? el("ul", { class: "problems" }, P.map(p => el("li", {}, [el("span", {}, (p.kind === "oneway" ? "↗️ " : p.kind === "missing" ? "❓ " : "⚠️ ") + p.text),
        (plan => plan ? el("button", { onclick: () => { plan.apply(B()); changed(); } }, plan.text) : el("span", { class: "note" }, "(can't be changed here: it's fixed)"))(mapPlan(B(), id, p))])))
      : el("p", { class: "note" }, "✅ Nothing looks wrong: every room can be reached from outside, and has a way back out."));
    // the map itself
    if (!window.cytoscape) {
      note.textContent = "Loading the map…";
      loadCytoscape().then(() => draw(), () => { note.textContent = "The map couldn't load (it needs the internet the first time it opens). The rooms and their ways still work above and below."; });
      return;
    }
    note.textContent = "🟣 the room you're in · 🔴 a way with no way back · dashed: a pit or a ladder";
    const nodes = [{ data: { id: "r0", label: "🏰\noutside" }, classes: "outside" + (b.kind === "castle" ? " here" : "") + (picked?.room === 0 ? " picked" : "") },
      ...K.rooms.map((st, i) => ({ data: { id: "r" + (i + 1), label: `${roomLabel(st).split(" ")[0]}\n${i + 1}` },
                                   classes: (here === i + 1 ? "here" : "") + (picked?.room === i + 1 ? " picked" : "") }))];
    const edges = E.filter(x => x.to !== null).map(x => ({ data: { id: eid(x), source: "r" + x.from, target: "r" + x.to, label: EXIT_ICONS[x.kind] },
      classes: [x.kind, x.key ? "set" : "fixed", bad.has(eid(x)) ? "bad" : "", picked?.way === pickOf(x) ? "picked" : ""].join(" ") }));
    const now = K.rooms.join();
    map.style.height = (K.rooms.length > 6 ? 460 : 340) + "px";
    if (!cy) {
      cy = window.cytoscape({ container: map, elements: [...nodes, ...edges], style: MAP_STYLE, layout: MAP_LAYOUT(K.rooms.length), minZoom: 0.3, maxZoom: 2.5, wheelSensitivity: 0.3 });
      cy.on("tap", "edge", ev => { const x = castleGraph(castleOf({ ...B(), castle: id })).find(x => eid(x) === ev.target.id()); picked = x ? { way: pickOf(x) } : null; setTimeout(draw); });
      cy.on("tap", "node", ev => { picked = { room: +ev.target.id().slice(1) }; setTimeout(draw); });
      cy.on("tap", ev => { if (ev.target === cy) { picked = null; setTimeout(draw); } });
      sig = now;
    } else if (now !== sig) { cy.elements().remove(); cy.add([...nodes, ...edges]); cy.layout(MAP_LAYOUT(K.rooms.length)).run(); sig = now; }
    else { cy.edges().remove(); cy.add(edges); for (const nd of nodes) cy.getElementById(nd.data.id).classes(nd.classes); }
    cy.resize(); if (now !== sig || !cy.__fitted) { cy.fit(undefined, 14); cy.__fitted = true; }
  };
  syncs.push(draw);
}
function control(part, [kind, key, label, ...rest], opts = {}) {
  // another tab's control, shown here when this tab's settings say (its
  // settings are that tab's: the ghost's see-through-ness is the
  // visibility panel's)
  if (kind === "of") return control(key, label, { when: rest[0] ? () => rest[0](state[part]) : null });
  // a group: its controls in a dashed box with its name, shown or hidden together
  // (and, with a test, marked when it holds: the castle room you are in)
  if (kind === "group") {
    const g = el("div", { class: "chipset ctlgroup" }, [el("div", { class: "cap" }, [label]), ...rest[0].map(c => control(part, c))]);
    const when = SHOWN_WHEN[part + "." + key], here = rest[1];
    if (when || here) syncs.push(() => { if (when) g.hidden = !when(state[part]); if (here) g.classList.toggle("here", !!here(state[part])); });
    return g;
  }
  const val = el("span", { class: "val" });
  const name = el("span", { class: "name" }, [label]);
  const lbl = el("div", { class: "lbl" }, [el("span", {}, [name]), val]);
  const box = el("div", { class: "ctl" }, [lbl]);
  if ((kind === "range" || kind === "turn" || kind === "place" || kind === "master") && buildingHud) {
    const id = part + "." + key, eye = el("button", { class: "eye", title: "Fold this slider away, or open it (it stays pinned)",
                                                       onclick: () => { toggleMin(id); } }, "👁️");
    name.before(eye);
    syncs.push(() => { eye.setAttribute("aria-pressed", !folded(id)); box.classList.toggle("min", folded(id)); });
  }
  if ((kind === "range" || kind === "turn" || kind === "master") && !(part === "background" && key === "figSize") && !buildingHud) {
    // the pin, left of the name (the figure's size is always in the HUD:
    // no pin)
    const id = part + "." + key, pin = el("button", { class: "pin", title: "Pin to the full-screen controls",
                                                       onclick: () => togglePin(id) }, "📌");
    name.before(pin);
    syncs.push(() => pin.setAttribute("aria-pressed", pinned(id)));
  }
  // chips to go straight to the castle or into one of its rooms, by number (to try a castle out)
  if (kind === "castlejump") {
    const row = el("div", { class: "row" });
    box.append(row);
    syncs.push(() => {
      const B = state[part], K = castleOf(B), here = B.kind === "castle" ? 0 : B.kind === "castleroom" ? Math.round(B.castleRoom ?? 1) : -1;
      row.replaceChildren(...[0, ...K.rooms.map((_, i) => i + 1)].map(n => el("button", { "aria-pressed": n === here, onclick: () => {
        if (n) { B.kind = "castleroom"; B.castleRoom = n; } else B.kind = "castle";
        [B.figX, B.figY] = ARRIVE[B.kind] || [0, 0];
        changed();
      } }, n ? `${roomLabel(K.rooms[n - 1]).split(" ")[0]} ${n}` : "🏰 outside")));
    });
  }
  if (kind === "castledesigner" && !buildingHud) castleDesigner(part, key, box, syncs);
  // (ticket 99) the scene's objects, back to front, as small chips: a tap
  // hides one (🙈) or shows it again (👁️); the friend's chip (🧍) stands
  // among them where the friend stands, so a drag moves it along the list
  if (kind === "objects") {
    const row = el("div", { class: "row objs" }), me = el("span", { class: "me", title: "where the friend stands: in front of every object to the left, behind every one to the right" }, "🧍");
    box.append(row);
    let shown = "", chips = [];
    syncs.push(() => {
      const B = state[part], list = bgShown.objs, off = objectsOff(B), at = objPlace(B);
      const sig = at + "|" + list.map(o => o.name + "@" + o.z).join("|");
      if (sig !== shown) {
        shown = sig;
        chips = list.map(o => [o, el("button", { class: "obj", title: `${o.name}: stands at depth ${Number.isFinite(o.z) ? Math.round(o.z) : "in front of everything"} (the friend's feet are at ${Math.round(SCENE.ground)} on the ground line)`,
          onclick: () => { const all = { ...(B.objectsOff || {}) }, now = new Set(all[at] || []);
                           if (now.has(o.name)) now.delete(o.name); else now.add(o.name);
                           if (now.size) all[at] = [...now]; else delete all[at];
                           B.objectsOff = all; changed(); } }, [el("span", { class: "eye" }), " " + o.name])]);
        row.replaceChildren(...chips.map(([, b]) => b));
      }
      for (const [o, b] of chips) { const hid = off.has(o.name); b.querySelector(".eye").textContent = hid ? "🙈" : "👁️"; b.classList.toggle("off", hid); b.setAttribute("aria-pressed", !hid); }
      const feet = SCENE.ground + (B.figY ?? 0), i = list.findIndex(o => o.z > feet);
      row.insertBefore(me, i < 0 ? null : chips[i][1]);
      box.hidden = !list.length;
    });
  }
  if (kind === "seats") {
    // (ticket 50) a chip for each seat here, and one to stand up again
    const row = el("div", { class: "row objs" });
    box.append(row);
    let shown = "";
    syncs.push(() => {
      const list = seatsHere(state.background), now = seatNow(), sig = state.background.kind + "|" + list.map(t => t.name).join("|") + "|" + (now ? now.name : "");
      if (sig !== shown) {
        shown = sig;
        row.replaceChildren(...list.map(t => el("button", { class: "obj" + (now && now.name === t.name ? " on" : ""), "aria-pressed": !!(now && now.name === t.name),
                                                             onclick: () => sitOn(t) }, "🪑 " + t.name)),
                            ...(state.body.sit ? [el("button", { class: "obj", onclick: () => standUp() }, "🧍 stand up")] : []));
      }
      box.hidden = !list.length;
    });
  }
  // (ticket 159, Matthew) the music, full screen: this tab's controls take
  // the whole window, and the screen where the browser allows (setMusicBig)
  if (kind === "musicbig") box.append(el("button", { class: "musicbig", onclick: () => setMusicBig(!document.body.classList.contains("music-big")) },
                                         document.body.classList.contains("music-big") ? MUSIC_BIG[1] : MUSIC_BIG[0]));
  // (ticket 185) the forest crossing's things: a button for each kind puts
  // one in, at a free spot near the meeting place; drag it from there in
  // the picture; one more takes them all away. Under them, a row for each
  // thing: its own parameters (thingParams: ↔️ mirror for all, a rock's
  // colours as swatches), and ✖ to take it away.
  if (kind === "things") {
    const n = el("span", { class: "hint" }), list = el("div", { class: "cross-list" });
    let shown = null;
    const rows = () => {
      const T = state.background.things || [], sig = JSON.stringify(T.map(t => [t.kind, thingParams(t.kind).map(([p]) => t[p] ?? null)]));
      if (sig === shown) return;
      shown = sig;
      list.replaceChildren(...T.map((t, i) => el("div", { class: "row" }, [
        el("span", { class: "name" }, `${(THING_KINDS[t.kind] || { label: t.kind }).label} ${i + 1}`),
        ...thingParams(t.kind).flatMap(([p, label, how, opts]) => {
          const now = t[p] ?? (THING_DEFAULTS[t.kind] || {})[p], set = v => () => { t[p] = v; changed(); };
          if (how === "color") return [el("span", { class: "hint" }, label), ...opts.map(col => el("button", { title: col, "aria-pressed": String((now ?? opts[0]) === col),
            style: col === "none" ? "width: 1.6em; height: 1.6em; padding: 0; border-radius: 50%;" : `background: ${col}; width: 1.6em; height: 1.6em; padding: 0; border-radius: 50%;`,
            onclick: set(col) }, col === "none" ? "∅" : ""))];
          if (how === "choice") return [el("span", { class: "hint" }, label), ...opts.map(([v, name]) => el("button", { "aria-pressed": String(now === v), onclick: set(v) }, name))];
          if (how === "action") return [el("button", { onclick: () => { t[p] = opts(t); changed(); } }, label)];
          return [el("button", { "aria-pressed": String(!!t[p]), onclick: () => { t[p] = !t[p]; changed(); } }, label)];
        }),
        el("button", { onclick: () => { T.splice(i, 1); changed(); } }, "✖")])));
    };
    // (v2: dragged onto the picture, it stands where it was let go, kept within
    // the ground the friend can stand on; tapped, near the middle, a little
    // apart from the last)
    const add = (kd, at = null) => {
      const B = state.background, T = B.things || (B.things = []), i = T.length, F = sceneFrame;
      const x = at ? Math.round(clamp(at.x, F.left, F.right)) : Math.round((((i * 0.37) % 1) - 0.5) * 520);
      const z = at ? Math.round(SCENE.ground + clamp(at.y - SCENE.ground, figYMin(F), F.bottom - F.ground)) : Math.round(SCENE.ground + 10 + (i * 29) % 70);
      T.push({ kind: kd, x, z, seed: 900 + Math.floor(Math.random() * 9000), size: 100, mirror: false, ...structuredClone(THING_DEFAULTS[kd] || {}), ...(kd === "rock" ? { tone: ROCK_TONES[i % ROCK_TONES.length] } : {}) });
      changed();
    };
    const addButton = (kd, T) => {
      const b = el("button", { title: "Drag into the picture, or tap" }, "+ " + T.label);
      pressDrag(b, () => T.label.split(" ")[0], { onTap: () => add(kd), onDrop: (under, ev) => { if (under && under.closest && under.closest("#pic")) add(kd, picUnits(ev)); } });
      return b;
    };
    box.append(el("div", { class: "row" }, [...Object.entries(THING_KINDS).map(([kd, T]) => addButton(kd, T)),
                                           el("button", { onclick: () => { state.background.things = []; changed(); } }, "🧹 take them all away"), n]), list);
    syncs.push(() => { const m = (state.background.things || []).length, t = m ? `${m} here: drag one to move it` : ""; if (n.textContent !== t) n.textContent = t; rows(); });
  }
  // (ticket 185, Matthew) 🗺️ World design: places laid out on a big grid,
  // each joined to its neighbours by the doors on their shared side (no door
  // wired by hand; a door with no place beside it, or one that does not line
  // up with its partner, is a mistake to fix), and each filled from a library
  // of things. Its first piece is coming; for now the tab says what it will be.
  if (kind === "world") {
    // (v2) a palette of places to drag onto squares (a tap puts one in the
    // first empty square); the grid, a square per cell: its place, its ways
    // out as marks on its edges, a mark when a mistake is about it, where the
    // friend is; a tap goes there, a drag moves it (onto another square:
    // they swap) or takes it away (onto 🗑️); buttons for the grid's size;
    // then the square the friend is in: its ways out, the start, its
    // things; then the mistakes, and the places off the grid with their ids.
    const palette = el("div", { class: "world-palette row" }), grid = el("div", { class: "world-grid" }), trash = el("div", { class: "world-trash hint" }, "🗑️ drop a square here to take it away");
    const sizes = el("div", { class: "row" }, [...[["＋ column", 1, 0], ["－ column", -1, 0], ["＋ row", 0, 1], ["－ row", 0, -1]].map(([t, dc, dr]) => el("button", { onclick: () => worldResize(dc, dr) }, t)),
      el("button", { title: "The world as the game first lays it out: every square, and the things put in them, as they were", onclick: () => { if (confirm("Start the world over, as the game first lays it out? The squares and the things put in them go back as they were.")) { state.world = clone(DEFAULTS.world); changed(); } } }, "🌍 the first world again")]);
    const here = el("div", { class: "world-here" }), probs = el("div", { class: "world-probs" }), off = el("div", { class: "world-off hint" });
    const emojiOf = kind => placeName(kind).split(" ")[0];
    for (const kd of worldPalette()) {
      const chip = el("button", { class: "world-chip", title: "Drag " + placeName(kd) + " onto a square (or tap: the first empty square)" }, placeName(kd));
      pressDrag(chip, () => emojiOf(kd), { onDrop: under => { const sq = under && under.closest && under.closest("[data-square]"); if (sq) worldPut(sq.dataset.square, kd); },
        onTap: () => { const W = state.world; for (let r = 0; r < W.rows; r++) for (let c = 0; c < W.cols; c++) if (!W.cells[c + "," + r]) { worldPut(c + "," + r, kd); return; } } });
      palette.append(chip);
    }
    let shown = null;
    const render = () => {
      const W = state.world, P = worldProblems(W), at = W.at && W.cells[W.at];
      const sig = JSON.stringify([W.cols, W.rows, W.start, W.at, Object.entries(W.cells).map(([k, c]) => [k, c.kind, worldWays(c)]), P.length]);
      if (sig === shown) return;
      shown = sig;
      const bad = new Set(P.map(p => p.key));
      grid.style.gridTemplateColumns = `repeat(${W.cols}, 1fr)`;
      grid.replaceChildren(...Array.from({ length: W.cols * W.rows }, (_, i) => {
        const key = (i % W.cols) + "," + Math.floor(i / W.cols), cell = W.cells[key];
        if (!cell) return el("div", { class: "world-cell empty", title: squareName(key) + ": empty: drag a place here", "data-square": key }, squareName(key));
        const name = placeName(cell.kind), [emoji, ...words] = name.split(" "), ways = worldLiveWays(W, key);
        const b = el("button", { class: "world-cell" + (bad.has(key) ? " bad" : "") + (W.at === key ? " here" : "") + (W.start === key ? " start" : ""), "data-square": key,
                                 title: `${squareName(key)}: ${name}` + (ways.length ? ", ways out " + ways.map(d => WORLD_ARROWS[d]).join(" ") : "") + ". Tap to go there; drag to move it.",
                                 onclick: () => worldEnter(key) },
                     [el("span", { class: "world-emoji" }, emoji), el("span", { class: "world-name" }, words.join(" ")), ...ways.map(d => el("span", { class: "world-way w-" + d }, ""))]);
        pressDrag(b, () => emoji, { onDrop: under => { if (!under || !under.closest) return; if (under.closest(".world-trash")) worldRemove(key); else { const sq = under.closest("[data-square]"); if (sq) worldMove(key, sq.dataset.square); } } });
        return b;
      }));
      // the square the friend is in: its ways out (a forest crossing's are its paths), the start
      if (at && at.kind === state.background.kind) {
        const ways = worldWays(at), toggle = d => () => {
          if (at.kind === "crossing") state.background["cross" + d] = !state.background["cross" + d];   // (its paths, which worldKeep keeps in its square)
          else at.ways = ways.includes(d) ? ways.filter(x => x !== d) : [...ways, d].sort((x, y) => Object.keys(WORLD_DIRS).indexOf(x) - Object.keys(WORLD_DIRS).indexOf(y));
          changed();
        };
        here.replaceChildren(el("div", { class: "cap" }, `📍 ${squareName(W.at)}: ${placeName(at.kind)}`),
          el("div", { class: "row" }, [el("span", { class: "hint" }, "ways out:"), ...Object.keys(WORLD_DIRS).map(d => el("button", { "aria-pressed": String(ways.includes(d)), title: d, onclick: toggle(d) }, WORLD_ARROWS[d]))]),
          el("div", { class: "row" }, [el("button", { "aria-pressed": String(W.start === W.at), onclick: () => { W.start = W.at; changed(); } }, W.start === W.at ? "🏁 the friend starts here" : "🏁 start here")]));
      } else here.replaceChildren(el("div", { class: "hint" }, "Tap a square to go there and change it."));
      probs.replaceChildren(P.length ? el("div", { class: "cap" }, `⚠️ ${P.length} to put right`) : el("div", { class: "hint" }, "✅ Every way out meets a way back, and every place can be reached."),
                            ...P.map(p => el("div", { class: "world-prob" }, p.text)));
      off.replaceChildren("Off the grid: ", ...worldOffGrid(W).flatMap((o, i) => [i ? " · " : "", `${o.id}: ${placeName(o.kind)}` + (o.from ? ` (through ${placeName(W.cells[o.from].kind)}, ${squareName(o.from)})` : "")]));
    };
    box.append(el("div", { class: "hint" }, "🗺️ The world: a place in each square, joined to the squares beside it through the ways out on their shared sides. Drag places onto squares; tap a square to go there and change it."),
               palette, grid, el("div", { class: "row" }, [trash]), sizes, here, control("background", ["things", "things", "🪨 things here: drag one into the picture, then about"]), probs, off);
    syncs.push(render);
  }
  // (ticket 155, Matthew) ⚙️ Advanced: the game's code on GitHub; its
  // version, and a newer one to change to (a phone hides the title, where
  // they are otherwise); the frame rate now; and the background features
  // kept off until they are fast (PERF_FEATURES), each with how many there
  // are in this place, and a measure of what it costs on this computer.
  if (kind === "advanced") {
    // (syncs run on every frame of a walk: the page is changed only when a value changes)
    const put = (node, text) => { if (node.textContent !== text) node.textContent = text; };
    const ver = el("span", { class: "hint" }), up = el("button", { class: "newer", hidden: "", onclick: () => document.getElementById("newer").click() });
    const meter = el("div", { class: "hint" });
    box.append(el("div", { class: "row" }, [el("a", { href: "https://github.com/matthewhammer/kids-choice-games", target: "_blank", rel: "noopener" }, "💻 this game's code, on GitHub ↗")]),
               el("div", { class: "row" }, [ver, up]), meter,
               el("div", { class: "hint" }, "🚀 Kept off until they are fast: 60 frames a second, for everything the controller does, comes first. Switched on, each says how many it draws in this place; 📏 walks the friend here with it off, then on, and says what it costs on this computer."));
    perfMeter.node = meter;
    // (ticket 163) 🧪 this computer's speed, a line to copy and compare
    const speedOut = el("input", { type: "text", readonly: "", class: "padline", placeholder: "🧪 the result shows here", onfocus: e => e.target.select() });
    const speedBtn = el("button", { onclick: () => { speedCopy.textContent = "📋 copy"; speedCheck(t => { speedOut.value = t; }); } }, "🧪 this computer's speed");
    const speedCopy = el("button", { onclick: () => { speedOut.select(); try { navigator.clipboard.writeText(speedOut.value).then(() => { speedCopy.textContent = "📋 copied"; }, () => document.execCommand("copy")); } catch (e) { document.execCommand("copy"); } } }, "📋 copy");
    // (ticket 166: for now, a shared page to paste the line into, readable from anywhere, until a
    // Fumola canister of our own takes its place; the black laptop has no easy way to send it)
    const speedPad = el("a", { href: SPEED_PAD, target: "_blank", rel: "noopener", title: "A shared page anyone with its address can read and write: paste the line there" }, "📝 then paste it here");
    // (ticket 166: with the canister's log deployed, a press sends the line there instead)
    const speedSend = el("button", { title: "Sends the line to Matthew's log, where he reads it", onclick: () => sendSpeedLine("speed", speedOut.value, speedSend) }, "📮 send it to Matthew");
    box.append(el("div", { class: "perfrow" }, [el("div", { class: "row" }, [speedBtn, speedCopy, ...(SPEED_LOG ? [speedSend] : []), speedPad]), speedOut,
      el("div", { class: "hint" }, "About 40 seconds, in the empty room and then swimming in the duck pond (moving, held still, then without one part at a time: the scenery, the friend's part under the water, the rings; its scenery as a still picture; with its music), then the empty room again, with the friend as they start, the same on every computer; then your friend and everything back as it was. Run it on two computers and compare the lines: the drawing times' ratio is how much slower one is.")]));
    // (⏱️ time the next trip: a line to copy and paste, as 🧪's)
    const tripOut = el("input", { type: "text", readonly: "", class: "padline", placeholder: "⏱️ the trip's timing shows here", onfocus: e => e.target.select() });
    const tripCopy = el("button", { onclick: () => { tripOut.select(); try { navigator.clipboard.writeText(tripOut.value).then(() => { tripCopy.textContent = "📋 copied"; }, () => document.execCommand("copy")); } catch (e) { document.execCommand("copy"); } } }, "📋 copy");
    const tripBtn = el("button", { onclick: () => { tripCopy.textContent = "📋 copy"; tripArm(t => { tripOut.value = t; }); } }, "⏱️ time the next trip");
    const tripPad = el("a", { href: SPEED_PAD, target: "_blank", rel: "noopener", title: "A shared page anyone with its address can read and write: paste the line there" }, "📝 then paste it here");
    const tripSend = el("button", { title: "Sends the line to Matthew's log, where he reads it", onclick: () => sendSpeedLine("trip", tripOut.value, tripSend) }, "📮 send it to Matthew");
    box.append(el("div", { class: "perfrow" }, [el("div", { class: "row" }, [tripBtn, tripCopy, ...(SPEED_LOG ? [tripSend] : []), tripPad]), tripOut,
      el("div", { class: "hint" }, "Press it, then go through a doorway: click a castle door or a pit, press X or 🚪, or walk onto a pit. Every frame is timed from the start of the trip until the friend has arrived and stood still a moment; the line says which frames were long, in which part of the trip (walking, stepping in, falling, arriving, landing), and how much of each was the game's own work.")]));
    if (!perfMeter.loop) perfMeter.loop = requestAnimationFrame(perfMeterTick);
    const rows = PERF_FEATURES.map(f => {
      const chip = el("button", { onclick: () => perfSet(f.id, !PERF[f.id]) }), here = el("div", { class: "hint" }), result = el("div", { class: "hint" });
      const measure = el("button", { onclick: () => perfMeasure(f, t => { result.textContent = t; }) }, "📏 measure here");
      box.append(el("div", { class: "perfrow" }, [el("div", { class: "row" }, [chip, measure]), el("div", { class: "hint" }, f.what), here, result]));
      return [f, chip, here];
    });
    let counted = "";
    syncs.push(() => {
      put(ver, `🏷️ version ${VERSION.number}, out ${VERSION.released}`);
      if (up.hidden !== !offered) up.hidden = !offered;
      if (offered) put(up, "🆕 change to " + offered.number);
      // (counted again only when the place is drawn anew)
      const key = `${bgShown.text ? bgShown.text.length : 0}:${state.background.kind}:${JSON.stringify(PERF)}`;
      for (const [f, chip, here] of rows) {
        put(chip, `${f.label}: ${PERF[f.id] ? "on" : "off"}`);
        if (chip.getAttribute("aria-pressed") !== String(PERF[f.id])) chip.setAttribute("aria-pressed", PERF[f.id]);
        if (f.status) put(here, f.status());
        else if (key !== counted) { const n = PERF[f.id] ? f.count() : 0; put(here, PERF[f.id] ? `here: ${n} ${n === 1 ? f.unit[0] : f.unit[1]}` : "off (as it starts): none drawn"); }
      }
      counted = key;
    });
  }
  // (ticket 138) the game controller: whether one is there, then each of its
  // buttons with a menu of what it does (lit while held), and the usual layout
  if (kind === "padmap") {
    const status = el("div", { class: "hint" }), rows = el("div", { class: "padmap" }), down = el("div", { class: "hint" });
    const how = el("div", { class: "hint" }, ["Its arrows (or its left stick) walk the friend that way, diagonals too, from standing or sitting: ⬆️ away from us, into the place, ⬇️ toward us. " +
                                             "Hold 🏃 run with an arrow to run; hold 🧎 crouch to crouch down, or crawl with an arrow. In water they swim, and run swims fast. " +
                                             "To change a button, click 🎯 set, then press the button you want."]);
    const rowsOf = PAD_ACTIONS.map(([a, name]) => {
      const which = el("span", { class: "pwhich" }), learn = el("button", { onclick: () => { padLearn = padLearn === a ? null : a; changed(); } }, "🎯 set");
      const row = el("div", { class: "padrow" }, [el("span", { class: "pbtn" }, name), which, learn]);
      rows.append(row);
      return [a, which, learn, row];
    });
    // (ticket 146) 🎓 teach me your controller: press each button as asked
    const ask = el("div", { class: "padteach" }), line = el("input", { type: "text", readonly: "", class: "padline", onfocus: e => e.target.select() });
    const copy = el("button", { onclick: () => { line.select(); try { navigator.clipboard.writeText(line.value).then(() => { copy.textContent = "📋 copied"; }, () => document.execCommand("copy")); } catch (e) { document.execCommand("copy"); } } }, "📋 copy");
    const teach = el("button", { onclick: () => { padLearn = null; padTeach = { step: 0, got: {} }; copy.textContent = "📋 copy"; changed(); } }, "🎓 teach me your controller");
    const skip = el("button", { onclick: () => { if (padTeach && !padTeach.done) { if (++padTeach.step >= PAD_TEACH.length) padTaught(); changed(); } } }, "skip: it has none");
    const stop = el("button", { onclick: () => { padTeach = null; changed(); } }, "stop");
    const askText = el("span", { class: "padask" }), done = el("div", { class: "hint" }, [line, copy]);
    ask.append(askText, skip, stop);
    // (ticket 150) the on-screen controller, for anyone, with or without a real one
    const onscreen = el("button", { onclick: () => touchWant(!touchPad.want) });
    box.append(status, onscreen, how, teach, ask, done, rows, down, el("button", { onclick: () => { padLearn = null; padTeach = null; Object.assign(state[part], padId === TOUCH_ID ? TOUCH_CONTROLS : DEFAULTS.controls); padKeep(); changed(); } }, "↺ the usual buttons"));
    syncs.push(() => {
      for (const [a, which, learn, row] of rowsOf) {
        const i = state[part][a];
        which.textContent = padLearn === a ? "press a button…" : padButtonName(i);
        learn.setAttribute("aria-pressed", padLearn === a);
        row.classList.toggle("down", i >= 0 && padDown.has(i));
      }
      status.textContent = padName ? `🎮 ${padName}: ready${padMapping === "standard" ? "" : " (its buttons are numbered its own way: set them with 🎯 if they are not where you want)"}.`
                                   : "🎮 No game controller yet: plug one in (USB) or pair it, then press one of its buttons. Or use the one on the screen.";
      onscreen.textContent = touchPad.want ? "🎮 hide the controller on the screen" : "🎮 a controller on the screen, to touch or click";
      onscreen.setAttribute("aria-pressed", touchPad.want);
      down.textContent = padName ? "held now: " + ([...padDown].map(padButtonName).join(", ") || "nothing") + (padCrawl ? " · 🐛 crawling is on" : "") : "";
      const teaching = !!padTeach && !padTeach.done;
      teach.hidden = !padName || teaching;
      ask.hidden = !teaching;
      if (teaching) askText.textContent = `🎓 ${padTeach.step + 1} of ${PAD_TEACH.length}: press ${PAD_TEACH[padTeach.step][1]}`;
      done.hidden = !(padTeach && padTeach.done);
      if (padTeach && padTeach.done) line.value = padTeach.line;
    });
  }
  if (kind === "action") {
    const b = el("button", { onclick: () => { rest[0](); changed(); } }, label);
    lbl.replaceChildren();
    box.append(b);
  }
  if (kind === "range") {
    const [lo, hi, , , limit] = rest;
    const input = el("input", { type: "range", min: lo, max: hi,
                                oninput: e => set(part, key, Number(e.target.value)) });
    box.append(input);
    // (with a limit of its own, from the settings, as a room's doors are: the slider stops there, and shows no more)
    syncs.push(() => { const most = typeof limit === "function" ? limit(state[part]) : hi; input.max = most;
                       input.value = Math.min(most, state[part][key]); val.textContent = Math.min(most, state[part][key]); });
    // a part's see-through-ness can follow one of the mixer's LFOs: a chip
    // beside its name, a tap for the next (none, A, B, C)
    if (part === "visible" && VISIBLE_PARTS.includes(key) && !buildingHud) {
      const lk = "lfo_" + key, now = () => LFO_NAMES.includes(state.visible[lk]) ? state.visible[lk] : "none";
      const chip = el("button", { class: "ms lfo-chip", title: "Fade in and out with an LFO (the music's): tap for the next",
        onclick: () => { const all = ["none", ...LFO_NAMES]; state.visible[lk] = all[(all.indexOf(now()) + 1) % all.length]; changed(); } });
      lbl.insertBefore(chip, val);
      syncs.push(() => { chip.textContent = now() === "none" ? "〰️ no LFO" : "〰️ LFO " + now(); chip.setAttribute("aria-pressed", now() !== "none"); });
    }
  } else if (kind === "turn") {
    // an angle in radians, from 0 to a period that the other settings
    // decide (a star's turn to its next point), in hundredths shown; past
    // the period (fewer points made it shorter) it shows, as it draws,
    // the same turn within the period
    const period = () => rest[0](state[part]);
    const input = el("input", { type: "range", min: 0, step: "any",
                                oninput: e => set(part, key, Number(e.target.value)) });
    box.append(input);
    syncs.push(() => {
      const p = period(), v = state[part][key] ?? 0, w = v > p ? v % p : v;
      input.max = p; input.value = w; val.textContent = w.toFixed(2);
    });
  } else if (kind === "toggle") {
    const b = el("button", { onclick: () => set(part, key, !state[part][key]) });
    box.querySelector(".lbl").textContent = "";
    box.append(b);
    syncs.push(() => { b.textContent = label + (state[part][key] ? ": on" : ": off");
                       b.setAttribute("aria-pressed", state[part][key]); });
  } else if (kind === "tunes") {
    // two rows of chips: the kind of music (or the scene's own tune), then
    // that kind's tunes; picking a kind plays its first tune, unless the
    // tune playing is already of that kind
    // (each row in a dashed box with its name, so the kinds and the tunes
    // read apart)
    const kinds = el("div", { class: "row" }), tunes = el("div", { class: "row" });
    const tuneCap = el("div", { class: "cap" });
    const kindBox = el("div", { class: "chipset" }, [el("div", { class: "cap" }, "kind of music"), kinds]);
    const tuneBox = el("div", { class: "chipset" }, [tuneCap, tunes]);
    const kindBtns = [["scene", "🏞️ the scene's own"], ...TUNE_GROUPS.map(([g, text]) => [g, text])].map(([g, text]) => {
      const b = el("button", { onclick: () => {
        if (g === "scene") return set(part, key, "scene");
        const list = TUNE_GROUPS.find(x => x[0] === g)[2];
        if (!list.includes(state[part][key])) set(part, key, list[0]);
      } }, text);
      kinds.append(b); return [g, b];
    });
    box.append(kindBox, tuneBox);
    let shownKind, tuneBtns = [];
    syncs.push(() => {
      const now = state[part][key], g = groupOfTune(now);
      for (const [v, b] of kindBtns) b.setAttribute("aria-pressed", v === g);
      if (g !== shownKind) {
        shownKind = g;
        const list = g && g !== "scene" ? TUNE_GROUPS.find(x => x[0] === g)[2] : [];
        tuneBtns = list.map(id => [id, el("button", { onclick: () => set(part, key, id) }, TUNES[id].name)]);
        tunes.replaceChildren(...tuneBtns.map(([, b]) => b));
        tuneBox.hidden = !tuneBtns.length;
        tuneCap.textContent = tuneBtns.length ? `tunes: ${TUNE_GROUPS.find(x => x[0] === g)[1]}` : "";
      }
      for (const [v, b] of tuneBtns) b.setAttribute("aria-pressed", v === now);
    });
  } else if (kind === "every") {
    // chips that set every slider of the part at once (visibility's
    // invisible, visible and ghost), each pressed while all are at it
    const row = el("div", { class: "row" });
    const keys = () => TABS.find(t => t[1] === part)[2].filter(c => c[0] === "range").map(c => c[1]);
    const bs = rest[0].map(([text, v]) => {
      const b = el("button", { onclick: () => { for (const k of keys()) state[part][k] = v; state[part][key] = v; changed(); } }, text);
      row.append(b); return [v, b];
    });
    box.append(row);
    syncs.push(() => { for (const [v, b] of bs) b.setAttribute("aria-pressed", keys().every(k => state[part][k] === v)); });
  } else if (kind === "master") {
    // one slider for every slider of the part: moving it sets each of them
    // to its value, wherever they were. It keeps its own value; once a part
    // is moved on its own, the parts no longer all match it, and it dims
    // ("mixed") until it is moved again.
    const [lo, hi] = rest;
    const keys = () => TABS.find(t => t[1] === part)[2].filter(c => c[0] === "range").map(c => c[1]);
    const own = () => state[part][key] ?? hi;
    const input = el("input", { type: "range", min: lo, max: hi,
      oninput: e => {
        const v = Number(e.target.value);
        state[part][key] = v;
        for (const k of keys()) state[part][k] = v;
        changed();
      } });
    box.classList.add("master");
    box.append(input);
    // and one LFO for them all: a tap sets every part to follow the next one
    // (none, A, B, C); "mixed" when they follow different ones
    if (part === "visible" && !buildingHud) {
      const lfoNow = () => { const ls = keys().map(k => LFO_NAMES.includes(state[part]["lfo_" + k]) ? state[part]["lfo_" + k] : "none"); return ls.every(l => l === ls[0]) ? ls[0] : "mixed"; };
      const chip = el("button", { class: "ms lfo-chip", title: "Every part fades in and out with one LFO (the music's): tap for the next",
        onclick: () => { const all = ["none", ...LFO_NAMES], cur = lfoNow(), next = all[(all.indexOf(cur === "mixed" ? "none" : cur) + 1) % all.length];
          for (const k of keys()) state[part]["lfo_" + k] = next; changed(); } });
      lbl.insertBefore(chip, val);
      syncs.push(() => { const l = lfoNow(); chip.textContent = l === "none" ? "〰️ no LFO" : l === "mixed" ? "〰️ mixed LFOs" : "〰️ LFO " + l; chip.setAttribute("aria-pressed", l !== "none"); });
    }
    syncs.push(() => {
      const v = own(), mixed = keys().some(k => (state[part][k] ?? hi) !== v);
      input.value = v; val.textContent = mixed ? `${v} · mixed` : v;
      box.classList.toggle("mixed", mixed);
      box.title = mixed ? "Some parts were moved on their own; move this to set them all again" : "";
    });
  } else if (kind === "nudge") {
    // three chips for the slider above: down by the interval, the interval
    // (a tap goes to the next, a half step up to the octave), up by it
    const [lo, hi, ikey] = rest, iv = () => state[part][ikey] || 12;
    const down = el("button", { title: "down by the interval", onclick: () => set(part, key, Math.max(lo, (state[part][key] || 0) - iv())) }, "➖");
    const ivBtn = el("button", { title: "the interval: tap for the next", onclick: () => set(part, ikey, nextInterval(iv())) });
    const up = el("button", { title: "up by the interval", onclick: () => set(part, key, Math.min(hi, (state[part][key] || 0) + iv())) }, "➕");
    box.append(el("div", { class: "row" }, [down, ivBtn, up]));
    syncs.push(() => { ivBtn.textContent = "🎵 " + INTERVALS[iv()]; val.textContent = INTERVALS[iv()] + ` (${iv()} half step${iv() === 1 ? "" : "s"})`; });
  } else if (kind === "mixer") {
    box.classList.add("mixctl");   // (its strips carry their own colours)
    mixerBox(box);
  } else if (kind === "transport") {
    transportBox(box);
  } else if (kind === "note") {
    // a line of words that says how things are: the label is a function
    const p = el("p", { class: "now" });
    lbl.remove();
    box.append(p);
    syncs.push(() => { p.textContent = label(); });
  } else if (kind === "flip") {
    // one chip that says which way it is now; a tap turns it the other way
    const b = el("button", { class: "flip", onclick: () => set(part, key, !state[part][key]) });
    lbl.remove();
    box.append(b);
    syncs.push(() => { b.textContent = label[state[part][key] ? 1 : 0];
                       b.setAttribute("aria-pressed", !!state[part][key]); });
  } else if (kind === "pair") {
    // two columns side by side, mirrored about the middle: the first part's
    // on the left, each with its name, then its controls, a slider showing
    // when its own part wears the slider's style
    const [otherPart, ctls, styleOf = SLIDER_STYLE] = rest;
    box.classList.add("pair");
    box.replaceChildren(...[[key, label[0]], [otherPart, label[1]]].map(([p, text]) =>
      el("div", { class: "side" }, [el("div", { class: "lbl" }, [text]), ...ctls.map(c => {
        const b = control(p, c, { when: styleOf[c[1]] ? h => h.style === styleOf[c[1]] : null });
        // (the column's name says whose style it is)
        if (c[0] === "choice") b.querySelector(".lbl").remove();
        return b;
      })])));
  } else if (kind === "choice") {
    const row = el("div", { class: "row" });
    // (an option may come with a test of the settings: shown only when it holds, as a room the castle has)
    // (and its text may follow the settings too: a castle room's emoji, its type's)
    const bs = rest[0].map(([v, text, ok]) => {
      const b = el("button", { onclick: () => set(part, key, v) }, typeof text === "function" ? "" : text);
      row.append(b); return [v, b, ok, text];
    });
    box.append(row);
    syncs.push(() => { for (const [v, b, ok, text] of bs) { b.setAttribute("aria-pressed", state[part][key] === v); if (ok) b.hidden = !ok(state[part]); if (typeof text === "function") b.textContent = text(state[part]); } });
  } else if (kind === "places") {
    // two rows, as the music's: the kind of place (or none), then that
    // kind's places, each in a dashed box with its name; picking a kind goes
    // to its first place, unless the place now is already of that kind
    const kinds = el("div", { class: "row" }), places = el("div", { class: "row" });
    const placeCap = el("div", { class: "cap" });
    const kindBox = el("div", { class: "chipset" }, [el("div", { class: "cap" }, "kind of place"), kinds]);
    const placeBox = el("div", { class: "chipset" }, [placeCap, places]);
    const label = v => (rest[0].find(([x]) => x === v) || [v, v])[1];
    const kindBtns = [["none", "⬜ no background"], ...PLACE_GROUPS.map(([g, text]) => [g, text])].map(([g, text]) => {
      const b = el("button", { onclick: () => {
        if (g === "none") return set(part, key, "none");
        const list = PLACE_GROUPS.find(x => x[0] === g)[2];
        if (!list.includes(state[part][key])) set(part, key, list[0]);
      } }, text);
      kinds.append(b); return [g, b];
    });
    box.append(kindBox, placeBox);
    let shownKind, placeBtns = [];
    syncs.push(() => {
      const now = state[part][key], g = groupOfPlace(now);
      for (const [v, b] of kindBtns) b.setAttribute("aria-pressed", v === g);
      if (g !== shownKind) {
        shownKind = g;
        const list = g && g !== "none" ? PLACE_GROUPS.find(x => x[0] === g)[2] : [];
        placeBtns = list.map(id => [id, el("button", { onclick: () => set(part, key, id) }, label(id))]);
        places.replaceChildren(...placeBtns.map(([, b]) => b));
        placeBox.hidden = !placeBtns.length;
        placeCap.textContent = placeBtns.length ? `places: ${PLACE_GROUPS.find(x => x[0] === g)[1]}` : "";
      }
      for (const [v, b] of placeBtns) b.setAttribute("aria-pressed", v === now);
    });
  } else if (kind === "color") {
    const row = el("div", { class: "row" });
    const bs = rest[0].map(c => {
      const b = c === "skin" || c === "auto" || c === "off"
        ? el("button", { class: "swatch skin",
                         title: c === "skin" ? "same as skin" : c === "off" ? "none: the fur shows through"
                              : key === "spot" ? "a warm brown" : "a lighter shade",
                         onclick: () => set(part, key, c) }, c)
        : key === "color" && part === "face" && SKIN_MARKS[c]
        ? el("button", { class: "swatch", title: SKIN_MARKS[c][1], "aria-label": SKIN_MARKS[c][1],
                         style: `background:${c};font-size:18px;line-height:1`, onclick: () => set(part, key, c) }, SKIN_MARKS[c][0])
        : el("button", { class: "swatch", title: c, style: `background:${c}`, onclick: () => set(part, key, c) });
      row.append(b); return [c, b];
    });
    const pick = el("input", { type: "color", title: "any color",
                               oninput: e => set(part, key, e.target.value) });
    row.append(pick);
    box.append(row);
    syncs.push(() => {
      for (const [c, b] of bs) b.setAttribute("aria-pressed", state[part][key] === c);
      if (state[part][key].startsWith("#")) pick.value = state[part][key];
    });
  } else if (kind === "place") {
    // The stage in small, its sky and its ground, and the figure a box as
    // tall as it stands, its feet where they are: tap or drag to put the
    // feet there (near the middle, exactly the middle).
    const NS = "http://www.w3.org/2000/svg", W = -2 * SCENE.left, H = SCENE.bottom - SCENE.top;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `${SCENE.left} ${SCENE.top} ${W} ${H}`);
    svg.setAttribute("class", "place");
    svg.innerHTML = `<rect x="${SCENE.left}" y="${SCENE.top}" width="${W}" height="${SCENE.ground - SCENE.top}" fill="#9fd8f5"/>` +
      `<rect x="${SCENE.left}" y="${SCENE.ground}" width="${W}" height="${SCENE.bottom - SCENE.ground}" fill="#e8d39a"/>` +
      `<line x1="0" y1="${SCENE.top}" x2="0" y2="${SCENE.bottom}" stroke="#ffffff" stroke-width="3" stroke-dasharray="12 10" opacity="0.8"/>` +
      `<rect id="fig" rx="14" fill="#7c3aed" fill-opacity="0.75" stroke="#ffffff" stroke-width="5"/>`;
    const fig = svg.querySelector("#fig");
    const at = e => {
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse()), F = sceneFrame;
      let x = clamp(p.x, F.left, F.right), y = clamp(p.y - F.ground, figYMin(F), F.bottom - F.ground);
      if (Math.abs(x) < W * 0.03) x = 0;
      if (Math.abs(y) < H * 0.03) y = 0;
      state.background.figX = Math.round(x); state.background.figY = Math.round(y); changed();
    };
    let held = false;
    svg.addEventListener("pointerdown", e => { held = true; svg.setPointerCapture(e.pointerId); at(e); });
    svg.addEventListener("pointermove", e => { if (held) at(e); });
    svg.addEventListener("pointerup", () => { held = false; });
    svg.addEventListener("pointercancel", () => { held = false; });
    box.append(svg);
    syncs.push(() => {
      const B = state.background, k = (B.figSize ?? 100) / 100 * sceneFig(B.kind);
      const h = Math.max(30, (naturalFrame.ground - naturalFrame.top) * k), w = Math.max(16, h * 0.4);
      const fx = B.figX ?? 0, fy = SCENE.ground + (B.figY ?? 0);
      fig.setAttribute("x", f1(fx - w / 2)); fig.setAttribute("y", f1(fy - h));
      fig.setAttribute("width", f1(w)); fig.setAttribute("height", f1(h));
      val.textContent = !B.figX && !B.figY ? "middle" : "";
    });
  } else if (kind === "pad") {
    // A square to tap or drag: the sun marks where the light comes from,
    // and the shine sits on that side of each eye.
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "-1.2 -1.2 2.4 2.4");
    svg.setAttribute("class", "pad");
    svg.innerHTML = `<rect x="-1.2" y="-1.2" width="2.4" height="2.4" rx="0.2" fill="#87ceeb"/>` +
      `<circle r="0.45" fill="#f5c542" stroke="#333" stroke-width="0.04"/>` +
      `<circle cx="-0.15" cy="-0.08" r="0.07"/><circle cx="0.15" cy="-0.08" r="0.07"/>` +
      `<g id="sun"><circle r="0.16" fill="#fff59d" stroke="#f59e0b" stroke-width="0.05"/></g>`;
    const sun = svg.querySelector("#sun");
    const at = e => {
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
      const c = v => Math.round(Math.max(-1, Math.min(1, v)) * 100) / 100;
      state[part].lightX = c(p.x); state[part].lightY = c(p.y); changed();
    };
    let held = false;
    svg.addEventListener("pointerdown", e => { held = true; svg.setPointerCapture(e.pointerId); at(e); });
    svg.addEventListener("pointermove", e => { if (held) at(e); });
    svg.addEventListener("pointerup", () => { held = false; });
    svg.addEventListener("pointercancel", () => { held = false; });
    box.append(svg);
    syncs.push(() => sun.setAttribute("transform", `translate(${state[part].lightX} ${state[part].lightY})`));
  }
  const when = "when" in opts ? opts.when : SHOWN_WHEN[part + "." + key];
  if (when) syncs.push(() => { box.hidden = !when(state[part]); });
  return box;
}

function showTab() {
  syncs = []; mixLights = null;
  const tabs = document.getElementById("tabs"), panel = document.getElementById("panel");
  tabs.replaceChildren(...TABS.map(([name], i) =>
    el("button", { "aria-pressed": i === tab, onclick: () => { tab = i; showTab(); } }, name)));
  const [, part, ctls] = TABS[tab];
  panel.dataset.part = part;
  panel.replaceChildren(...ctls.map(c => control(part, c)));
  changed();
}
