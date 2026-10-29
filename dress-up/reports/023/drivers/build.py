#!/usr/bin/env python3
"""^du_report(23): the 🎒 backpack, a young player's guide, in the style of ^du_report(17) and ^du_report(18) (^ticket(639)).

Reads data/texts.json and data/run.json (what tools/checks/packguide639.mjs recorded on GitHub's computers) and the pictures in
pictures/ from the same run. Writes index.html and print.html (for the zine).
  python3 dress-up/reports/018/drivers/build.py
"""
import os, json, html
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUN = json.load(open(os.path.join(R, "data", "run.json"))) if os.path.exists(os.path.join(R, "data", "run.json")) else {}
esc = lambda s: html.escape(str(s if s is not None else ""))
# (each picture as WebP where it is, a third of the PNG's size: the game repository stays small)
webp = lambda name: name[:-4] + ".webp" if name.endswith(".png") and os.path.exists(os.path.join(R, "pictures", name[:-4] + ".webp")) else name
pic = lambda name, cap, cls="": (f'<figure class="shot {cls}"><img src="pictures/{webp(name)}" alt="{esc(cap)}" loading="lazy">'
                                 f'<figcaption>{cap}</figcaption></figure>') if os.path.exists(os.path.join(R, "pictures", webp(name))) else f'<p class="missing">📷 a picture of this is coming</p>'
box = lambda kind, title, body: f'<aside class="box {kind}"><div class="box-h">{title}</div>{body}</aside>'
code = lambda s: f'<pre class="code">{esc(s)}</pre>'
ref = lambda n: f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'

# which parts of the backpack are in the game yet: a chapter about one that is not says so, and the guide is re-built as each lands
BUILT = json.load(open(os.path.join(R, "data", "built.json"))) if os.path.exists(os.path.join(R, "data", "built.json")) else {}
soon = lambda what: "" if BUILT.get(what) else box("warn", "COMING SOON", "<p>This part of the backpack is being built right now. When it is in the game, this page will show it with pictures.</p>")
VER = RUN.get("version", "")

BODY = f"""<p class="series"><a href="../">Dress Up reports</a> · <a class="ref" href="../023/"><code><b>^du_report(</b>23<b>)</b></code></a> · 2026-10-29 · <span class="wip">work in progress</span> · about <a href="https://matthewhammer.org/kids-choice-games/dress-up/">Messed Up Dress Up</a></p>
<div class="cover">
  <div class="pub">KIDS' CHOICE GAMES PRESENTS</div>
  <h1>THE BACKPACK<br>ADVENTURER'S GUIDE</h1>
  <div class="edition">for MESSED UP DRESS UP · the 🎒 backpack{(" · version " + esc(VER)) if VER else ""}</div>
  {pic("01-pack-on.png", "Your friend, with the backpack on.", "half")}
</div>
<p class="series">Matthew, 2026-10-29: “another young player's guide ... how to use the backpack: make visible, place item inside, take item out and place into world.”</p>

<div class="toc">
<a href="#ch1">1 · WHAT IS A BACKPACK?</a><br>
<a href="#ch2">2 · PUT IT ON</a><br>
<a href="#ch3">3 · FIND A TREASURE CHEST</a><br>
<a href="#ch4">4 · OPEN IT!</a><br>
<a href="#ch5">5 · LOOK INSIDE</a><br>
<a href="#ch6">6 · TAKE ONE OUT</a><br>
<a href="#ch7">7 · PICK IT UP AGAIN</a><br>
<a href="#ch8">8 · THINGS YOU CAN CARRY</a><br>
<a href="#ch9">9 · THE PUZZLE ROOM 🧩</a><br>
<a href="#ch10">10 · THE QUICK CARD</a><br>
<a href="#ch11">11 · ABOUT THIS GUIDE</a><br>
</div>

<h2 id="ch1"><span class="ch">1</span>WHAT IS A BACKPACK?</h2>
<p>A <b>backpack</b> is a bag you wear on your back. You can put things in it and carry them with you.</p>
<p>In Messed Up Dress Up, your friend has a backpack too. When your friend finds a treasure, it goes <b>into the backpack</b>. Later, you can take it <b>out</b> and put it down somewhere new.</p>
{box("tip", "GOOD TO KNOW", "<p>The backpack goes with your friend everywhere: to the farm, to the castle, to the sea. What is in it stays in it.</p>")}

<h2 id="ch2"><span class="ch">2</span>PUT IT ON</h2>
<p>At first, you can't see the backpack. Let's put it on!</p>
<ol class="steps">
<li>Open the side panel.</li>
<li>Choose the <span class="key">🎒 Backpack</span> tab.</li>
<li>Press <span class="key">🎒 drawn on the friend</span>.</li>
</ol>
<p>Now your friend wears it. Press it again to take it off. The things inside stay inside.</p>
{pic("02-pack-tab.png", "The 🎒 Backpack tab. The top button puts the backpack on your friend.")}
{pic("01-pack-on.png", "The backpack on your friend's back.", "half")}

<h2 id="ch3"><span class="ch">3</span>FIND A TREASURE CHEST</h2>
<p>A <b>treasure chest</b> 💰 is a box with a lid. A chest that is <b>shut</b> has a surprise in it.</p>
<p>The dungeon rooms have chests, and you can put one anywhere you like:</p>
<ol class="steps">
<li>Open the <span class="key">🏞️ Background</span> tab.</li>
<li>Find <b>🪨 things to put here</b>, and choose <span class="key">💰 treasure chest</span>.</li>
<li>Pick what comes out, in <b>🎁 what comes out</b>.</li>
</ol>
{pic("03-chest-shut.png", "A shut treasure chest, waiting.")}

<h2 id="ch4"><span class="ch">4</span>OPEN IT!</h2>
<ol class="steps">
<li>Walk your friend right up to the chest.</li>
<li>Press <span class="key">Enter</span> on the keyboard (on a game controller, the button that goes through doors).</li>
</ol>
<p>The lid opens. The treasure flies up over your friend's head, and you hear music. Then the treasure goes <b>into the backpack</b>!</p>
{pic("04-chest-open.png", "Ta-da! The treasure, held up high, on its way into the backpack.")}
{box("tip", "TRY THIS", "<p>You can record your own sound for a chest in the <span class='key'>🎙️ Recordings</span> tab, and pick it for the chest. Then the chest plays your voice when it opens!</p>")}

<h2 id="ch5"><span class="ch">5</span>LOOK INSIDE</h2>
<p>Open the <span class="key">🎒 Backpack</span> tab again. Under <b>🎒 what's in it</b>, each thing has a <b>card</b>: its picture, its name, and when you found it.</p>
{pic("05-cards.png", "Three treasures in the backpack, a card for each.")}

<h2 id="ch6"><span class="ch">6</span>TAKE ONE OUT</h2>
{soon("putdown")}
<p>Every card has a <span class="key">⬇️ put down</span> button. Press it, and your friend takes that thing out of the backpack and puts it on the ground, right in front of them.</p>
{pic("06-put-down.png", "The crown, put down on the floor in front of your friend.")}
<p>Now walk somewhere else, and put down another one. You can decorate a whole room with your treasures!</p>

<h2 id="ch7"><span class="ch">7</span>PICK IT UP AGAIN</h2>
{soon("pickup")}
<p>Walk up to a thing on the ground and press <span class="key">Enter</span>. Your friend picks it up, and it goes back into the backpack.</p>
{pic("07-pick-up.png", "Picking the crown up again.")}

<h2 id="ch8"><span class="ch">8</span>THINGS YOU CAN CARRY</h2>
{soon("items")}
<p>Treasures from chests are not the only things that fit in the backpack. Walk up to one of these and press <span class="key">Enter</span> to put it in:</p>
<div class="scroll"><table class="feat"><thead><tr><th>thing</th><th>where to find it</th></tr></thead><tbody>
<tr><td>🧪 a potion</td><td>the witch's places, or put one anywhere from <b>🪨 things</b></td></tr>
<tr><td>🍫 a chocolate bar</td><td>new! put one anywhere from <b>🪨 things</b>, maybe in the tree house</td></tr>
<tr><td>🍾 a glass bottle with a cork</td><td>new! from <b>🪨 things</b></td></tr>
<tr><td>🥅 a bug net</td><td>new! from <b>🪨 things</b></td></tr>
<tr><td>🍄 a small mushroom</td><td>toadstools and cave mushrooms</td></tr>
</tbody></table></div>
<h3>CATCH A BEE! 🐝</h3>
{soon("bee")}
<p>Have an empty <b>glass bottle</b> in your backpack? Walk up to a bee and press <span class="key">Enter</span>. Your friend takes out the bottle, the bee buzzes in, and the cork goes <i>pop!</i> on top. The bottle, with the bee in it, goes back into the backpack.</p>
{pic("09-bee.png", "A bee, caught in a glass bottle.")}
{box("tip", "BE KIND TO BEES", "<p>Put the bottle down and pick it up again somewhere with flowers. Then... maybe let the bee go?</p>")}

<h2 id="ch9"><span class="ch">9</span>THE PUZZLE ROOM 🧩</h2>
{soon("puzzle")}
<p>In the <b>puzzle room</b> there are three <b>stone plates</b> on the floor. Each plate has a picture on it: a 👑 crown, a 🐚 shell, and a 🗡️ sword.</p>
<p>There are three shut chests, too. Can you open the chests, and put each treasure on the plate that shows it?</p>
<p>When all three plates have the right thing on them... something happens! What is it? Play and find out.</p>
{pic("08-puzzle.png", "The puzzle room: three plates, three chests.")}
{box("tip", "HOW TO GET THERE", "<p>In the <span class='key'>🎒 Backpack</span> tab, press <span class='key'>🧩 go to the puzzle room</span>.</p>")}

<h2 id="ch10"><span class="ch">10</span>THE QUICK CARD</h2>
<div class="card">
<p><b>Put the backpack on:</b> 🎒 tab, <span class="key">🎒 drawn on the friend</span></p>
<p><b>Open a chest:</b> walk up to it, press <span class="key">Enter</span></p>
<p><b>See what's inside:</b> 🎒 tab, <b>what's in it</b></p>
<p><b>Take a thing out:</b> its card, <span class="key">⬇️ put down</span></p>
<p><b>Pick it up again:</b> walk up to it, press <span class="key">Enter</span></p>
<p><b>Catch a bee:</b> an empty bottle in the backpack, walk up to a bee, <span class="key">Enter</span></p>
<p><b>The puzzle:</b> each treasure on its own plate</p>
</div>

<h2 id="ch11"><span class="ch">11</span>ABOUT THIS GUIDE</h2>
<p>{("Every picture is of <b>Messed Up Dress Up " + esc(VER) + "</b>, taken by <code>tools/checks/packguide639.mjs</code> (kids-choice-games) on GitHub's computers" + ((', run <a href="' + esc(RUN["url"]) + '">' + esc(RUN["id"]) + '</a>') if RUN.get("url") else "") + ".") if VER else "The pictures are being taken now: this guide is a work in progress, written while the backpack's last parts are built."}</p>
<p>The backpack is {ref(632)}, the chests {ref(631)}, this guide {ref(639)}. Made for M and N, on a day off school, for reading and for playing.</p>
"""

PAGE = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<!-- nav: begin --><meta name="theme-support" content="data-theme"><script src="https://matthewhammer.org/nav/nav.js"></script><!-- nav: end -->
<script>try {{ var t = localStorage.getItem("theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); }} catch (e) {{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Backpack Guide</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
<style>
  :root {{ --bg: #f4ecd8; --paper: #fffaf0; --ink: #231f1a; --muted: #6b6052; --line: #c9b99a; --accent: #b4361d; --alt: #1d5fb4; --good: #2f7d32; --bad: #b4361d; --tip: #fff3c4; --warn: #ffe0d6; --code: #1d1b16; --codeink: #e8e2d0; --link: #1d5fb4; }}
  @media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg: #16140f; --paper: #1f1c16; --ink: #ece4d2; --muted: #a89c86; --line: #4a4234; --accent: #ff7a4d; --alt: #7fb2ff; --good: #7bd17f; --bad: #ff7a4d; --tip: #3a3218; --warn: #3a2018; --code: #0d0c09; --codeink: #e8e2d0; --link: #9cc3ff; }} }}
  :root[data-theme="dark"] {{ --bg: #16140f; --paper: #1f1c16; --ink: #ece4d2; --muted: #a89c86; --line: #4a4234; --accent: #ff7a4d; --alt: #7fb2ff; --good: #7bd17f; --bad: #ff7a4d; --tip: #3a3218; --warn: #3a2018; --code: #0d0c09; --codeink: #e8e2d0; --link: #9cc3ff; }}
  * {{ box-sizing: border-box; }}
  /* (Matthew, 2026-10-24: "This serif font choice ... is very close to actual manuals I read --- but I find it hard to read, and let's choose
     a nicer looking one, that's a bit bigger") Literata, a serif made for long reading, larger */
  body {{ margin: 0; background: var(--bg); color: var(--ink); font: 19px/1.62 "Literata", Georgia, serif; }}
  main {{ max-width: 900px; margin: 0 auto; padding: 24px 16px 80px; }}
  a {{ color: var(--link); }}
  .series {{ font: 15px/1.4 system-ui, sans-serif; color: var(--muted); }}
  .cover {{ border: 4px double var(--ink); background: var(--paper); padding: 28px 22px; margin: 18px 0 30px; text-align: center; }}
  .cover .pub {{ font-family: "VT323", monospace; font-size: 1.3em; letter-spacing: 0.15em; color: var(--muted); }}
  h1 {{ font-family: "Press Start 2P", monospace; font-size: clamp(1.1em, 4.2vw, 1.9em); line-height: 1.5; margin: 14px 0; color: var(--accent); text-shadow: 3px 3px 0 color-mix(in srgb, var(--ink) 20%, transparent); }}
  .cover .edition {{ font-family: "VT323", monospace; font-size: 1.5em; }}
  h2 {{ font-family: "Press Start 2P", monospace; font-size: 1em; line-height: 1.6; margin: 48px 0 14px; padding: 10px 12px; background: var(--ink); color: var(--paper); }}
  h2 .ch {{ color: var(--accent); margin-right: 10px; }}
  h3 {{ font-family: "VT323", monospace; font-size: 1.6em; margin: 26px 0 6px; border-bottom: 2px dotted var(--line); }}
  .box {{ border: 3px solid var(--ink); padding: 10px 14px; margin: 16px 0; background: var(--paper); }}
  .box .box-h {{ font-family: "Press Start 2P", monospace; font-size: 0.7em; margin-bottom: 6px; }}
  .box.tip {{ background: var(--tip); }} .box.warn {{ background: var(--warn); border-color: var(--bad); }}
  .box.warn .box-h {{ color: var(--bad); }}
  pre.code {{ background: var(--code); color: var(--codeink); padding: 10px 12px; overflow-x: auto; font: 14px/1.45 "VT323", ui-monospace, monospace; font-size: 1.05em; border-left: 6px solid var(--accent); white-space: pre-wrap; }}
  code {{ font-family: ui-monospace, Menlo, monospace; font-size: 0.88em; }}
  figure.shot {{ margin: 18px 0; border: 3px solid var(--ink); background: var(--paper); padding: 6px; }}
  figure.shot img {{ display: block; width: 100%; height: auto; image-rendering: auto; }}
  figure.shot figcaption {{ font: 14px/1.4 system-ui, sans-serif; color: var(--muted); padding: 6px 4px 2px; }}
  figure.half {{ max-width: 520px; }}
  /* (Matthew, 2026-10-24: "center the screenshot, under title for report") */
  .cover figure.shot {{ margin-left: auto; margin-right: auto; }}
  .toc {{ columns: 2; font-family: "VT323", monospace; font-size: 1.3em; border: 2px dashed var(--line); padding: 10px 16px; }}
  .toc a {{ text-decoration: none; display: inline-block; padding: 0 6px; margin: 1px 0; }}
  /* (Matthew, 2026-10-24: "invert colors of 'main menu' (report contents 1--12), when we do hover over") a menu line lit as a game's is */
  .toc a:hover, .toc a:focus-visible {{ background: var(--link); color: var(--bg); outline: none; }} @media (max-width: 560px) {{ .toc {{ columns: 1; }} }}
  ol.steps li {{ margin: 6px 0; }}
  table.feat {{ width: 100%; border-collapse: collapse; font: 14px/1.4 system-ui, sans-serif; }}
  table.feat td.n {{ text-align: right; }} table.feat th, table.feat td {{ border: 1px solid var(--line); padding: 5px 7px; text-align: left; vertical-align: top; }}
  table.feat th {{ background: var(--ink); color: var(--paper); font-family: "VT323", monospace; font-size: 1.2em; font-weight: normal; }}
  td.st {{ font-family: "Press Start 2P", monospace; font-size: 0.6em; white-space: nowrap; }}
  td.st-done {{ color: var(--good); }} td.st-check {{ color: var(--alt); }} td.st-branch {{ color: #b8860b; }} td.st-next {{ color: var(--bad); }}
  .scroll {{ overflow-x: auto; }}
  /* (Matthew, 2026-10-24: "the buttons shown in the text should be equally round to the buttons in the actual GUI") a button named in the
     text drawn as the game draws its chips */
  .key {{ display: inline-block; border: 1px solid var(--line); border-radius: 10px; padding: 1px 10px; font: 600 0.82em/1.5 system-ui, "Segoe UI", sans-serif; background: var(--paper); white-space: nowrap; vertical-align: 1px; }}
  .missing {{ color: var(--bad); font-family: "VT323", monospace; }}
  .wip {{ color: #b45309; font-weight: 600; }}
  button.theme {{ font: 13px system-ui; border: 1px solid var(--line); background: var(--paper); color: var(--muted); border-radius: 8px; padding: 1px 8px; cursor: pointer; position: fixed; top: 8px; right: 8px; }}
  .grid {{ position: relative; aspect-ratio: 16 / 9; max-width: 640px; margin: 16px auto; border: 3px solid var(--ink); background: linear-gradient(var(--paper), var(--tip)); font: 600 14px/1 system-ui, sans-serif; }}
  .grid .v {{ position: absolute; top: 0; bottom: 0; border-left: 1px dashed var(--line); }} .grid .v span {{ position: absolute; top: 4px; left: 3px; }}
  .grid .h {{ position: absolute; left: 0; right: 0; border-top: 1px dashed var(--line); }} .grid .h span {{ position: absolute; right: 4px; top: 3px; }}
  .grid .dot {{ position: absolute; transform: translate(-50%, -50%); background: var(--accent); color: var(--paper); border-radius: 999px; padding: 3px 8px; white-space: nowrap; }}
  .card {{ border: 3px double var(--ink); background: var(--paper); padding: 8px 14px; columns: 2; }} .card p {{ margin: 4px 0; break-inside: avoid; }} @media (max-width: 560px) {{ .card {{ columns: 1; }} }}
</style>
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

# (Matthew, 2026-10-24: "can we make a low-toner, Black and White, PDF version of the manual? ... like a zine, where each US Letter sized
# page ... has 2 pages on top, and 2 pages on back, and they are meant to be folded and stapled") The same guide for paper: half-letter
# pages (5.5 x 8.5 in), black on white, no fills (headings outlined, boxes ruled, code with a rule at its left), each chapter on a new
# page, nothing split across a page; the light-mode pictures (pictures-light/, taken in the same run) in grey. Chrome prints it to PDF
# on GitHub (tools/checks/storyguide600.mjs), and drivers/zine.sh lays the pages out on Letter for folding and stapling.
import re
PRINT_CSS = """
  @page { size: 5.5in 8.5in; margin: 0.42in 0.38in 0.5in; }
  * { box-sizing: border-box; color: #000 !important; background: transparent !important; box-shadow: none !important; text-shadow: none !important; }
  html, body { background: #fff !important; }
  body { margin: 0; font: 10pt/1.42 "Literata", Georgia, serif; }
  main { max-width: none; padding: 0; }
  a { text-decoration: none; } a.ref code b { font-weight: normal; }
  .series { font: 7.5pt/1.35 system-ui, sans-serif; }
  .cover { border: 2.5pt double #000; padding: 0.25in 0.18in; margin: 0 0 0.12in; text-align: center; break-after: page; }
  .cover .pub { font-family: "VT323", monospace; font-size: 12pt; letter-spacing: 0.15em; }
  h1 { font-family: "Press Start 2P", monospace; font-size: 15pt; line-height: 1.5; margin: 10pt 0; }
  .cover .edition { font-family: "VT323", monospace; font-size: 12pt; }
  h2 { font-family: "Press Start 2P", monospace; font-size: 8.5pt; line-height: 1.6; margin: 0 0 8pt; padding: 5pt 6pt; border: 1.5pt solid #000; break-before: page; break-after: avoid; }
  h2 .ch { margin-right: 6pt; }
  h3 { font-family: "VT323", monospace; font-size: 13pt; margin: 10pt 0 3pt; border-bottom: 1pt dotted #000; break-after: avoid; }
  p, li { orphans: 3; widows: 3; }
  .box { border: 1.2pt solid #000; padding: 5pt 7pt; margin: 7pt 0; break-inside: avoid; }
  .box.warn { border-style: dashed; border-width: 1.5pt; }
  .box .box-h { font-family: "Press Start 2P", monospace; font-size: 6pt; margin-bottom: 3pt; }
  pre.code { border: none; border-left: 2pt solid #000; padding: 3pt 7pt; margin: 6pt 0; font: 8.5pt/1.3 "VT323", ui-monospace, monospace; white-space: pre-wrap; break-inside: avoid; }
  code { font-size: 0.86em; }
  figure.shot { border: 0.8pt solid #000; padding: 3pt; margin: 7pt 0; break-inside: avoid; }
  figure.shot img { display: block; width: 100%; max-height: 4.1in; object-fit: contain; filter: grayscale(1) contrast(1.05); }
  figure.shot figcaption { font: 7pt/1.3 system-ui, sans-serif; padding: 3pt 1pt 0; }
  figure.half { max-width: none; }
  .toc { columns: 1; font-family: "VT323", monospace; font-size: 11.5pt; border: 1pt dashed #000; padding: 6pt 10pt; break-after: page; }
  table.feat { font: 6.8pt/1.3 system-ui, sans-serif; border-collapse: collapse; width: 100%; }
  table.feat th, table.feat td { border: 0.5pt solid #000; padding: 2pt 3pt; }
  table.feat th { font-family: "VT323", monospace; font-size: 9pt; border-bottom-width: 1.2pt; }
  table.feat tr { break-inside: avoid; }
  td.st { font-family: "Press Start 2P", monospace; font-size: 4.6pt; }
  .scroll { overflow: visible; }
  .key { border: 0.7pt solid #000; border-radius: 6pt; padding: 0 5pt; font: 600 0.85em/1.4 system-ui, sans-serif; }
  button.theme, script { display: none !important; }
"""
light = lambda m: m.group(0).replace('src="pictures/', 'src="pictures-light/') if os.path.exists(os.path.join(R, "pictures-light", re.search(r'src="pictures/([^"]+)"', m.group(0)).group(1))) else m.group(0)
PRINT = re.sub(r'<!-- nav: begin -->.*?<!-- nav: end -->', '', PAGE, flags=re.S)
PRINT = re.sub(r"<style>.*?</style>", "<style>" + PRINT_CSS + "</style>", PRINT, count=1, flags=re.S)
PRINT = re.sub(r'<img src="pictures/[^"]+"', light, PRINT).replace(' loading="lazy"', '')
PRINT = re.sub(r'<script>\s*\(function \(\) \{.*?</script>', '', PRINT, flags=re.S).replace("<title>Backpack Guide</title>", "<title>Backpack Guide (print)</title>")
open(os.path.join(R, "print.html"), "w").write(PRINT)
# (ticket 595) the 🔊 Listen bar, as every report has it
import subprocess
subprocess.run(["python3", os.path.join(R, "..", "..", "..", "tools", "add_listen.py"), os.path.join(R, "index.html")], check=True)
print("wrote 023/index.html and print.html:", len([f for f in os.listdir(os.path.join(R, "pictures")) if f.endswith(".webp")]), "pictures")
