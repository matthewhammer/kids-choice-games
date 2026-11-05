#!/usr/bin/env python3
"""^du_report(25): the overview map, the world seen from above, flying (^ticket(691); this report ^ticket(692)).

Reads data/texts.json and data/run.json (what drivers/shots025.mjs recorded on GitHub's computers, run on a diag branch) and the
pictures in pictures/ from the same run. The guide's styles are ^du_report(24)'s (drivers/guide.css), with a pair of pictures
side by side for each place. Writes index.html.
  python3 dress-up/reports/025/drivers/build.py
"""
import os, json, html
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load = lambda name: json.load(open(os.path.join(R, "data", name))) if os.path.exists(os.path.join(R, "data", name)) else {}
RUN, TX = load("run.json"), load("texts.json")
esc = lambda s: html.escape(str(s if s is not None else ""))
have = lambda name: os.path.exists(os.path.join(R, "pictures", name + ".webp"))
img = lambda name, alt: (f'<img src="pictures/{name}.webp" alt="{esc(alt)}" loading="lazy">' if have(name) else '<p class="missing">📷 a picture of this is coming</p>')
pic = lambda name, cap, cls="": f'<figure class="shot {cls}">{img(name, cap)}<figcaption>{cap}</figcaption></figure>'
# a place, or a square, from the side and from above, side by side; its words under the pair
pair = lambda stem, title, cap: (f'<figure class="shot pair"><div class="two">{img(stem + "-side", title + ", in its usual view")}{img(stem + "-above", title + ", from above")}</div>'
                                 f'<figcaption><b>{title}</b> · <span class="lr">left, its usual view; right, from above</span>. {cap}</figcaption></figure>')
box = lambda kind, title, body: f'<aside class="box {kind}"><div class="box-h">{title}</div>{body}</aside>'
ref = lambda n: f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
du = lambda n: f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
key = lambda s: f'<span class="key">{s}</span>'
VER = TX.get("version") or RUN.get("version", "")
TITLE = "The World From Above in Messed Up Dress Up"

# what each place shows from above (its scene's own things, where they stand in it), in the order shots025.mjs takes them
PLACES = [
 ("forest", "Two rows of pines along the back, the meadow with its pale middle and its flowers, and four big trees, two on each side."),
 ("clearing", "Sand paths fan out from the near middle to what the clearing shows far off: the house, the tree house, the castle, the witch's hut and the healer's round hut, each only if its 🏞️ Background setting is on."),
 ("fairyforest", "The great tree on the left with the fairy house's round green door in its trunk, the ring of red toadstools (as many as its setting), stones, and the fairies' little lights."),
 ("woodpath", "Thick woods on both sides and the path winding off to the far trees, with tree trunks, ferns and red mushrooms along it."),
 ("crossing", "The forest floor in the crossing's own colour, leaves on it, woods in its corners, and a path for each way that is open."),
 ("mountains", "The snowy peaks at the back, the lake and the village down in the far valley (if that setting is on), the trail curving off to the left, rocks and pines."),
 ("pasture", "The fence across the back with its gate and a bird on the post, the big tree, the water trough, and the horses (bay, grey and chestnut, as many as its setting)."),
 ("lake", "The woods along the far shore, the water with its lily pads and ducks, cattails on both sides, and the sandy beach in the middle of the near shore."),
 ("sea", "Waves all over the open water, and the sun's sparkle on it."),
 ("deepsea", "The dark sea floor with ridges at the back, dark rocks, kelp, and a vent bubbling on the left."),
 ("underwater", "The sandy bottom under the lake: kelp at the back, the shipwreck with its chest, and the sharks' picnic table."),
 ("beach", "The ocean along the back with its foam, the sand with two striped blankets, two umbrellas with their chairs, two palms and two sand castles."),
 ("waterfall", "The mossy cliff, the falls down it (as wide as its setting), the pool below with its mist, jungle trees, vines and parrots."),
 ("witch", "The witch's log hut on its dark mound behind the fence of stakes with skulls on them, the giant dead tree, skeleton arms, and the green cauldron over its fire."),
 ("cemetery", "The rows of gravestones, the brook winding down with the weeping willow on its bank, and bushes of four colours."),
 ("house", "The house with its dark roof and brick chimney, the garage and the driveway, the stone walk to the door, the flower bed, an oak each side, and toys on the lawn."),
 ("farmyard", "The crop fields behind the fence, the red barn, the farmhouse, the windpump and its trough, the red tractor, the haystack and the hens."),
 ("treehouse", "The great tree's crown with the round room on top, and each tree house on its platform: roofed in its animal's colour, with its ears. Rope bridges, ladders, and the stream winding past."),
 ("campsite", "The pines along the back, the tents (as many as its setting), the fire in its ring of stones, and the logs to sit on."),
 ("castle", "The moat round the walls with lily pads, the drawbridge, a tower at each corner and the keep, all with roofs in the castle's colours and flags, the fence, the road out with its pennants, the hay cart, the well, and the castle's trees."),
 ("hut", "The round grass hut's thatch (more huts in a ring, if its setting says), the sand path to its door, flowers, and the woodpile."),
 ("desert", "The rippled sand, the red mesas at the back, and every cactus where the scene stands it: saguaros, a Joshua tree, an agave, an ocotillo, a prickly pear and a barrel cactus. Rocks and the lizard's stone."),
 ("garden", "The white picket fence with its rose arbor, the stepping stones, the beds (as many as its setting), the shed and its rain barrel, the apple tree, the bench and the wheelbarrow."),
 ("spring", "The round pool ringed with mossy stones, its lily pads, reeds and frogs, the mossy rock and the log."),
 ("dungeon", "Already drawn from above in its own view: the walls round a tiled floor, open where its ways go, torches in the corners."),
 ("cavecross", "The rock walls round a worn floor, crystals, moss, ice or stalagmites by its kind of cave."),
 ("imagination", "The empty white room, with the map board of place pictures on its far wall."),
 ("bubblespace", "The pale blue floor and its bubbles."),
 ("livingroom", "A place you go into, put in a square of the world: from above, it is a roof."),
 ("tent", "Inside a tent, put in a square: a roof too, in its own colour."),
]
P = TX.get("places", {})
gallery = "".join(pair(f"{20 + i:02d}-{k}", esc((P.get(k) or {}).get("name") or k), cap) for i, (k, cap) in enumerate(PLACES))

SQ = TX.get("squares", {})
SQUARES = [("0,4", "The jungle waterfall's square, with the rocks and trees placed in it"), ("0,3", "A deep sea square with four treasure chests, kelp, a starfish and a fish"),
           ("1,5", "A forest crossing with rocks and two trees placed in it"), ("5,4", "A forest square full of rocks"), ("0,0", "A deep sea square with its shells")]
squares = "".join(pair(f"1{i}-square-{k.replace(',', '-')}", esc(t), "Placed: " + esc(", ".join(sorted(set((SQ.get(k) or {}).get("things", []))))) + "." if (SQ.get(k) or {}).get("things") else "")
                  for i, (k, t) in enumerate(SQUARES))
TH = TX.get("things", {})
dots = sorted({d for v in TH.values() for d in v.get("dots", [])})
label = {k: l for v in TH.values() for k, l in zip(v.get("kinds", []), v.get("labels", []))}
things = "".join(pair(tag, esc("Things to place: " + v.get("group", "")), esc(", ".join(v.get("labels", []))) + ".") for tag, v in sorted(TH.items()))
W, FPS = TX.get("world", {}), TX.get("fps", {})
costs = "".join(f'<tr><td>{esc((P.get(k) or {}).get("name") or k)}</td><td class="n">{(P.get(k) or {}).get("look", ["", ""])[0]}</td><td class="n">{(P.get(k) or {}).get("look", ["", ""])[1]}</td></tr>' for k, _ in PLACES if P.get(k))

BODY = f"""<p class="series"><a href="../">Dress Up reports</a> · <a class="ref" href="../025/"><code><b>^du_report(</b>25<b>)</b></code></a> · 2026-11-04 · <span class="wip">work in progress</span> · about <a href="https://matthewhammer.org/kids-choice-games/dress-up/">Messed Up Dress Up</a>{(" " + esc(VER)) if VER else ""}</p>
<div class="cover">
  <div class="pub">KIDS' CHOICE GAMES PRESENTS</div>
  <h1>THE WORLD<br>FROM ABOVE</h1>
  <div class="edition">a young player's guide to flying: the 🎈 balloon, the 🫧 bubble, and every place and every thing seen from the sky</div>
  {pic("03-world-high", "The whole world from the top of the sky: every square of it a patch of the quilt, the seams stitched between them, the balloon at the middle.", "half")}
</div>
{('<p class="series"><b>Updated 2026-11-05:</b> the pictures retaken of ' + esc(VER) + ', where every kind of thing is drawn as itself from above (16 were plain dots in 0.0.489).</p>') if VER and VER != "0.0.489" else ""}
<p class="series">Matthew, 2026-11-04: “this overview map (top down for each background) is very nice. Let's create a dress up report about it, with lots of screenshots of backgrounds and placed objects.” M had asked for a way to see the world like this before. The flying is {ref(691)}; this report is {ref(692)}.</p>
<nav class="toc"><a href="#ch1">1 · WHAT'S NEW</a><br><a href="#ch2">2 · TAKE OFF 🎈</a><br><a href="#ch3">3 · HOW HIGH ⬆️⬇️</a><br><a href="#ch4">4 · LANDING 🛬</a><br><a href="#ch5">5 · EVERY PLACE FROM ABOVE</a><br><a href="#ch6">6 · PLACED THINGS</a><br><a href="#ch7">7 · EVERY THING TO PLACE</a><br><a href="#ch8">8 · IS IT FAST?</a><br><a href="#ch9">9 · WHAT'S NEXT</a></nav>

<h2 id="ch1"><span class="ch">1</span>WHAT'S NEW</h2>
<p>You can fly now. Get in the 🎈 hot-air balloon, or ride a 🫧 big bubble, and the game stops showing one place at a time from the side. It shows the <b>whole world from above</b>: every square of the world is a patch of a quilt, with its paths running on into the next square's, so you see how the places join up.</p>
<p>Every place is drawn from above the way its own scene draws it: the lake's ducks, the castle's moat and towers, the tree houses on their tree, the witch's hut behind its fence of skulls. Every thing you have <b>placed</b> in a square is there too, drawn from above: trees, rocks, chests, animals, cacti.</p>
{box("tip", "TRY IT", f"<p>Open {key('🎒')} (or press <b>I</b>), find {key('🎈 the hot-air balloon')}, and tap {key('🛫 fly')}.</p>")}

<h2 id="ch2"><span class="ch">2</span>TAKE OFF 🎈</h2>
<p>The two crafts are items, like 🫧 blowing bubbles and 🔥 breathing fire: anyone has them. Tap {key('🛫 fly')} on one in {key('🎒 Your items')}, or put it in {key('🔹')} or {key('🔸')} and press that button (Z or X on the keyboard, the triggers on a controller).</p>
{pic("05-items", "🎒 Your items, with the two crafts at the end of the row: 🎈 the hot-air balloon and 🫧 a big bubble to ride, each with 🛫 fly.")}
<p>You take off from the square you are in. Inside a house or a cave there is no sky, so the game says to go outside first.</p>
{pic("04-bubble-lake", "Riding the 🫧 big bubble low over the lake: the ducks, the lily pads, the cattails and the beach below, the place's name at the top, ⬆️ ⬇️ 🛬 on the left.")}

<h2 id="ch3"><span class="ch">3</span>HOW HIGH ⬆️⬇️</h2>
<p>How high you are is how much of the world you see. Low down, one square fills the picture and you see its small things. Higher, the squares around it come into view. At the top you see the whole world, with clouds drifting between you and the ground.</p>
{pic("01-world-low", "Low, over the forest clearing: the clearing's paths, its trees and the huts it shows, the castle's square to the east, the lake's to the west. The balloon's shadow is on the ground below it.")}
{pic("02-world-mid", "Halfway up: the squares round about, the paths joining them.")}
<div class="scroll"><table class="feat"><tr><th>to do</th><th>on the screen</th><th>keyboard</th><th>controller</th></tr>
<tr><td>fly about</td><td>tap where to go</td><td>the arrows</td><td>the arrows or the stick</td></tr>
<tr><td>climb</td><td>{key('⬆️')}</td><td>Page Up or +</td><td>a jump button</td></tr>
<tr><td>sink</td><td>{key('⬇️')}</td><td>Page Down or −</td><td>crouch</td></tr>
<tr><td>land</td><td>{key('🛬')}</td><td>the craft's Z or X again</td><td>the craft's 🔹 or 🔸 again</td></tr></table></div>

<h2 id="ch4"><span class="ch">4</span>LANDING 🛬</h2>
<p>Sink all the way down over a place, or press {key('🛬')}, and you land in that place, in its usual view. Over an empty square there is nowhere to land: the game says so and you stay up. While you fly, the game's own buttons rest (no fire, no bubbles, no tools): you are up in the sky.</p>

<h2 id="ch5"><span class="ch">5</span>EVERY PLACE FROM ABOVE</h2>
<p>Here is every place, each one by itself in a square, on the left as you see it when you are there and on the right from above. Up there, its paths go to the edges where its ways lead, and they meet its neighbours' paths. The small things, like flowers, ducks and toys, are only drawn when you fly low.</p>
<div class="gallery">{gallery}</div>

<h2 id="ch6"><span class="ch">6</span>PLACED THINGS</h2>
<p>A thing you put in a square with 🏞️ Background stays in that square, and from above it is drawn where you put it: across the square where it stands across the scene, and nearer the bottom the nearer it stands. Here are squares of the friend's own world with things placed in them.</p>
<div class="gallery">{squares}</div>
{box("tip", "PUT ONE AND LOOK", "<p>Put a cow or a tree in the square you are in, then take off: it is there, below you.</p>")}

<h2 id="ch7"><span class="ch">7</span>EVERY THING TO PLACE</h2>
<p>Every kind of thing there is to place, a dozen to a square, each in its usual view and then from above.</p>
<div class="gallery">{things}</div>
{box("warn", "NOT YET", "<p>" + f"{len(dots)} kinds are still a plain dot from above: " + esc(", ".join(label.get(d, d) for d in dots)) + ". They are where they should be, just not drawn as themselves yet.</p>") if dots else box("tip", "EVERY ONE", "<p>Every kind of thing is drawn as itself from above. The first version of this guide (pictures of 0.0.489) found 16 that were still a plain dot, from the chocolate bar to the helmet; 0.0.491 drew them all.</p>")}

<h2 id="ch8"><span class="ch">8</span>IS IT FAST?</h2>
<p>The game's first rule is 60 frames a second for everything a controller does. Flying keeps to it by drawing the quilt <b>once</b>, when you take off, and then only moving and scaling it: one change a frame, whatever the height. The squares out of view are hidden, and high up each square's small things are left out.</p>
<div class="scroll"><table class="feat"><tr><th>on GitHub's Linux computer, in Chrome</th><th>this run</th></tr>
<tr><td>the friend's world: its squares</td><td class="n">{esc(W.get("squares", "…"))}</td></tr>
<tr><td>its quilt's shapes, built once</td><td class="n">{esc(W.get("shapes", "…"))}</td></tr>
<tr><td>building it, at take-off</td><td class="n">{esc(W.get("buildMs", "…"))} ms</td></tr>
<tr><td>flying east, low</td><td class="n">{esc(FPS.get("low", "…"))} frames a second</td></tr>
<tr><td>flying east, at the top</td><td class="n">{esc(FPS.get("high", "…"))} frames a second</td></tr></table></div>
<p>Each place's drawing from above has a budget, checked with every release by <code>tools/checks/flight691.mjs</code>: at most 56 shapes with all eight of its paths, and at most 60 more small ones that show only low down, even at the top of every one of its settings (six tree houses, twelve ducks, thirty toadstools).</p>
<div class="scroll"><table class="feat"><tr><th>place</th><th>shapes</th><th>small ones, low down</th></tr>{costs}</table></div>

<h2 id="ch9"><span class="ch">9</span>WHAT'S NEXT</h2>
<ol class="steps">
{('<li><b>The dots.</b> Draw ' + str(len(dots)) + ' kinds of thing from above as themselves (the gem, the bee, shells, starfish, fish…): ' + ref(691) + '.</li>') if dots else ''}
<li><b>The bubble's own symbol.</b> The 🫧 big bubble to ride shares its symbol with 🫧 blowing bubbles; Matthew may pick it another: {ref(691)}.</li>
<li><b>Inside places.</b> The rooms inside a house or a castle have no square of their own, so you cannot see their things from the sky: {ref(691)}.</li>
<li><b>The pictures archive.</b> The archive of every picture in the game was refreshed on 2026-11-05 (run-2026-11-05, 0.0.490), flying and all: {ref(689)}.</li>
</ol>

<h2 id="about"><span class="ch">✎</span>ABOUT THIS GUIDE</h2>
<p>{("Every picture is of <b>Messed Up Dress Up " + esc(VER) + "</b>, taken by this report's <code>drivers/shots025.mjs</code> on GitHub's computers" + ((', run <a href="' + esc(RUN["url"]) + '">' + esc(RUN["id"]) + '</a>') if RUN.get("url") else "") + ".") if VER else "The pictures are coming: they are taken on GitHub's computers by this report's <code>drivers/shots025.mjs</code>, on a diag branch."}
The flying is in the game's <code>js/25-flight.js</code>. Each place's look from above is drawn from what its own scene draws and where; a survey of all the scenes set them right (the house's roof is dark brown, the lake has no dock). Made for M and N; M asked for it first.</p>
"""

CSS = open(os.path.join(R, "drivers", "guide.css")).read() + """
  /* (^du_report(25)) a place from the side and from above, side by side; one above the other on a phone */
  figure.pair .two { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  figure.pair .two img { display: block; width: 100%; height: auto; }
  figure.pair .lr { color: var(--muted); }
  @media (max-width: 560px) { figure.pair .two { grid-template-columns: 1fr; } }
"""
PAGE = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<!-- nav: begin --><meta name="theme-support" content="data-theme"><script src="https://matthewhammer.org/nav/nav.js"></script><!-- nav: end -->
<script>try {{ var t = localStorage.getItem("theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); }} catch (e) {{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{TITLE}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
<button class="theme" id="theme" title="Light or dark">◐ Auto</button>
<main>
{BODY}</main>
<script>
(function () {{ var b = document.getElementById("theme"), modes = ["auto", "light", "dark"], labels = {{ auto: "◐ Auto", light: "☀ Light", dark: "☾ Dark" }};
  var cur = "auto"; try {{ cur = localStorage.getItem("theme") || "auto"; }} catch (e) {{}}
  function set(m) {{ cur = m; if (m === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", m); b.textContent = labels[m]; try {{ localStorage.setItem("theme", m); }} catch (e) {{}} }}
  set(cur); b.onclick = function () {{ set(modes[(modes.indexOf(cur) + 1) % 3]); }}; }})();
</script>
</body>
</html>
"""
open(os.path.join(R, "index.html"), "w").write(PAGE)
print("wrote", os.path.join(R, "index.html"), len(PAGE), "bytes;", sum(1 for f in os.listdir(os.path.join(R, "pictures")) if f.endswith(".webp")), "pictures")
