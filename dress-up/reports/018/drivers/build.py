#!/usr/bin/env python3
"""^du_report(18): 🎬 story scripts, a director's guide for the kids, in the style of ^du_report(17) (^ticket(600)).

Reads data/texts.json and data/run.json (what tools/checks/storyguide600.mjs recorded on GitHub's computers) and the pictures in
pictures/ from the same run. Writes index.html and print.html (for the zine).
  python3 dress-up/reports/018/drivers/build.py
"""
import os, json, html
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(R, "data", "texts.json")))
RUN = json.load(open(os.path.join(R, "data", "run.json")))
esc = lambda s: html.escape(str(s if s is not None else ""))
# (each picture as WebP where it is, a third of the PNG's size: the game repository stays small)
webp = lambda name: name[:-4] + ".webp" if name.endswith(".png") and os.path.exists(os.path.join(R, "pictures", name[:-4] + ".webp")) else name
pic = lambda name, cap, cls="": (f'<figure class="shot {cls}"><img src="pictures/{webp(name)}" alt="{esc(cap)}" loading="lazy">'
                                 f'<figcaption>{cap}</figcaption></figure>') if os.path.exists(os.path.join(R, "pictures", webp(name))) else f'<p class="missing">[picture {esc(name)} not taken]</p>'
box = lambda kind, title, body: f'<aside class="box {kind}"><div class="box-h">{title}</div>{body}</aside>'
code = lambda s: f'<pre class="code">{esc(s)}</pre>'
ref = lambda n: f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'

EXAMPLE = "# a walk round the farm yard\nwalk 30 60\nface right\nsay Good morning, farm!\npose dance\nwait 2\npose stand\nwalk 75 40\nface front\nsay Time for a rest.\npose sit"

PAGE = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<!-- nav: begin --><meta name="theme-support" content="data-theme"><script src="https://matthewhammer.org/nav/nav.js"></script><!-- nav: end -->
<script>try {{ var t = localStorage.getItem("theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); }} catch (e) {{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Story Scripts Guide</title>
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
<p class="series"><a href="../">Dress Up reports</a> · <a class="ref" href="../018/"><code><b>^du_report(</b>18<b>)</b></code></a> · 2026-10-24 · <span class="wip">work in progress</span> · about <a href="https://matthewhammer.org/kids-choice-games/dress-up/">Messed Up Dress Up</a>, a game made with M and N · {ref(600)}</p>
<div class="cover">
  <div class="pub">KIDS' CHOICE GAMES PRESENTS</div>
  <h1>STORY SCRIPTS<br>DIRECTOR'S GUIDE</h1>
  <div class="edition">for MESSED UP DRESS UP · the 🎬 story box and 🚶 paths · version {esc(RUN.get("version", ""))}</div>
  {pic("03-dance.png", "Your friend, dancing in the farm yard, because the story said so.", "half")}
</div>
<p class="series">Matthew, 2026-10-24: “a new Zine and manual report --- for the kids to understand the story-script language, with examples, and more coloring pages.”</p>

<div class="toc">
<a href="#ch1">1 · YOU ARE THE DIRECTOR</a><br>
<a href="#ch2">2 · WHERE THE STORY BOX IS</a><br>
<a href="#ch3">3 · THE SEVEN STEPS</a><br>
<a href="#ch4">4 · WHERE IS 30? WHERE IS 60?</a><br>
<a href="#ch5">5 · YOUR FIRST STORY</a><br>
<a href="#ch6">6 · PULLING LEVERS</a><br>
<a href="#ch7">7 · AGAIN AND AGAIN: LOOP</a><br>
<a href="#ch8">8 · EVERYONE CAN WALK 🚶</a><br>
<a href="#ch9">9 · OOPS! A WRONG LINE</a><br>
<a href="#ch10">10 · STORIES TO TRY</a><br>
<a href="#ch11">11 · THE QUICK CARD</a><br>
<a href="#ch12">12 · ABOUT THIS GUIDE</a><br>
<a href="../../manuals/story-scripts-guide-{esc(RUN.get("version", ""))}-zine-print-2-sided-flip-long-edge.pdf">13 · PRINT IT: THE ZINE (PDF) 🖨️</a><br>
<small style="display: inline-block; padding: 0 6px">print on both sides, flip on the long edge · <a href="../../manuals/story-scripts-guide-{esc(RUN.get("version", ""))}-zine-print-2-sided-flip-short-edge.pdf">short-edge copy</a></small><br>
<small style="display: inline-block; padding: 0 6px">and <a href="../../manuals/story-words-one-page.pdf">the story words on one page, a picture for each (PDF)</a>, for the youngest directors: print it on one side</small>
</div>

<h2 id="ch1"><span class="ch">1</span>YOU ARE THE DIRECTOR</h2>
<p>In a film, the <b>director</b> tells the actors what to do: walk over there, turn around, say your line, dance! In Messed Up Dress Up, <b>you</b> are the director, and your friend is the actor.</p>
<p>You write what happens as a <b>story script</b>: a list of steps, <b>one step on each line</b>. Your friend does them in order, from the top line to the bottom line.</p>
{code("walk 30 60\nsay Hello!\npose dance")}
<p>This story has three steps. Your friend walks, says “Hello!”, and dances. That's it! You just wrote your first story.</p>
{box("tip", "GOOD TO KNOW", "<p>Each place has its own story. The farm yard can have one story, the castle another, and the tree house another.</p>")}

<h2 id="ch2"><span class="ch">2</span>WHERE THE STORY BOX IS</h2>
<ol class="steps">
<li>Open the side panel and choose the <span class="key">🏞️ Background</span> tab.</li>
<li>Find the <b>🎬 a story for this place</b> box.</li>
<li>Write your steps in it, one on each line.</li>
<li>Press <span class="key">▶ play</span>. Your friend acts it out!</li>
</ol>
{pic("01-story-box.png", "The 🎬 story box with a story in it. ▶ plays it, ⏹ stops it, and 🎬 play when we come here plays it every time you arrive in this place.")}
<p>Three buttons:</p>
<ul>
<li><span class="key">▶ play</span> starts the story from the top. If the box is empty, it plays an example story.</li>
<li><span class="key">⏹ stop</span> stops it.</li>
<li><span class="key">🎬 play when we come here</span>: when it is on, the story starts by itself every time you come into this place.</li>
</ul>
{box("tip", "YOU CAN ALWAYS TAKE OVER", "<p>Click or tap in the picture, or press a key, and the story stops so you can play yourself.</p>")}

<h2 id="ch3"><span class="ch">3</span>THE SEVEN STEPS</h2>
<p>A story knows seven steps. Each line starts with one of these words:</p>
<div class="scroll"><table class="feat"><thead><tr><th>step</th><th>what your friend does</th><th>try it</th></tr></thead><tbody>
<tr><td><code>walk</code></td><td>walks to a spot in the picture (chapter 4 says how spots work)</td><td><code>walk 30 60</code></td></tr>
<tr><td><code>wait</code></td><td>waits, a number of seconds</td><td><code>wait 2</code></td></tr>
<tr><td><code>pose</code></td><td>stands, sits, lies down, meditates, hugs, or dances</td><td><code>pose dance</code></td></tr>
<tr><td><code>face</code></td><td>turns to look left, right, front (at you), or back</td><td><code>face right</code></td></tr>
<tr><td><code>pull</code></td><td>walks to a lever and pulls it</td><td><code>pull L</code></td></tr>
<tr><td><code>say</code></td><td>says some words, shown over the picture</td><td><code>say Hello!</code></td></tr>
<tr><td><code>loop</code></td><td>goes back to the top and does it all again</td><td><code>loop</code></td></tr>
</tbody></table></div>
<p>The poses are: <code>stand</code>, <code>sit</code>, <code>lie</code>, <code>meditate</code>, <code>hug</code> and <code>dance</code>. Each dance is a surprise: your friend picks a different one every time.</p>
<p>A line that starts with <code>#</code> is a <b>note</b> for you. Your friend skips it.</p>
{code("# this is a note: my friend does not read it\nsay Hi!")}

<h2 id="ch4"><span class="ch">4</span>WHERE IS 30? WHERE IS 60?</h2>
<p><code>walk</code> takes two numbers. The <b>first</b> says how far <b>across</b> the picture: 0 is the left edge, 50 the middle, 100 the right edge. The <b>second</b> says how far <b>toward you</b>: 0 is far away at the back, 100 is right at the front.</p>
<div class="grid" role="img" aria-label="A map of the picture: across from 0 at the left to 100 at the right, and toward you from 0 at the back to 100 at the front">
  <div class="v" style="left:25%"><span>25</span></div><div class="v" style="left:50%"><span>50</span></div><div class="v" style="left:75%"><span>75</span></div>
  <div class="h" style="top:33%"><span>back: 0</span></div><div class="h" style="top:66%"><span>front: 100</span></div>
  <div class="dot" style="left:30%;top:52%">walk 30 60</div><div class="dot" style="left:75%;top:46%">walk 75 40</div><div class="dot" style="left:13%;top:66%">walk 10 100</div>
</div>
<p>You can leave out the second number: <code>walk 80</code> walks to 80 across and stays just as near or far as before.</p>
{box("tip", "TRY THIS", "<p><code>walk 0</code>, then <code>walk 100</code>. Your friend walks all the way across.</p>")}

<h2 id="ch5"><span class="ch">5</span>YOUR FIRST STORY</h2>
<p>Go to the farm yard and type this story in the box:</p>
{code(EXAMPLE)}
<p>Press <span class="key">▶ play</span>. Your friend walks out, turns, says good morning, dances, walks to the back, and sits down for a rest.</p>
{pic("02-say.png", "“say Good morning, farm!”: the words show at the top of the picture, and the story box says which line is playing.")}
{pic("04-sit.png", "The last line, pose sit: the story is over. The box says “the end”.")}
<p>Change one line and play it again. Make your friend say something else. Make them dance twice. It's your story!</p>

<h2 id="ch6"><span class="ch">6</span>PULLING LEVERS</h2>
<p><code>pull</code> makes your friend walk to a lever and pull it, just like when you click a lever yourself.</p>
<ul>
<li>In the castle's trap room: <code>pull L</code> and <code>pull R</code> for the red levers, <code>pull BL</code> and <code>pull BR</code> for the blue ones.</li>
<li>In a tree room: <code>pull H</code> for the trap door's lever.</li>
<li>Levers you put in a place yourself have numbers: <code>pull 1</code> is the first one, <code>pull 2</code> the second.</li>
</ul>
{code("walk 25 55\nsay Which lever opens the pit?\npull L\nwait 1\nface front\nsay That one!")}
{pic("05-lever.png", "pull L: the friend walked to the left red lever and pulled it.")}
{box("warn", "CAREFUL", "<p>A pit that opens under your friend is a pit they fall into. That can be the story, too!</p>")}

<h2 id="ch7"><span class="ch">7</span>AGAIN AND AGAIN: LOOP</h2>
<p>Put <code>loop</code> at the end and the story starts over from the top, forever, until you press <span class="key">⏹ stop</span> or take over.</p>
{code("# the castle guard\nwalk 20 50\nface right\nwait 2\nwalk 80 50\nface left\nwait 2\nloop")}

<h2 id="ch8"><span class="ch">8</span>EVERYONE CAN WALK 🚶</h2>
<p>Your friend isn't the only one who can move. The other people you made in the <span class="key">👥 People</span> tab can walk too, each on their own <b>path</b>.</p>
<ol class="steps">
<li>Put a person in a place with <span class="key">📍 here</span>.</li>
<li>Press <span class="key">🚶 path</span> next to their name.</li>
<li>Write their path in the box, with the same steps as a story: <code>walk</code>, <code>wait</code>, <code>pose</code>, <code>face</code>.</li>
<li>Press <span class="key">▶ walk it</span>.</li>
</ol>
{pic("06-people-path.png", "👥 People: a person's 🚶 path box, open under their name.")}
<p>A path always goes round and round: when it gets to the end, it starts again by itself.</p>
{pic("07-walkers.png", "Two people walking their own paths while your friend stands still.")}
{box("tip", "GOOD TO KNOW", "<p>People on paths can't say things or pull levers. Only your friend's story can do that.</p>")}

<h2 id="ch9"><span class="ch">9</span>OOPS! A WRONG LINE</h2>
<p>If a line has a word the story doesn't know, the story stops at that line and tells you which line it is, and what it can do instead.</p>
{code("walk 30 60\njump 5\nsay I never get here")}
{pic("08-wrong-line.png", "The story stopped at line 2: “jump” is not a step.")}
<p>The story box said: <b>{esc(T.get("wrong", "") or "(the run did not record it)")}</b></p>
<p>Things that go wrong, and how to fix them:</p>
<ul>
<li><b>A spelling slip</b>, like <code>wlak</code>: fix the word.</li>
<li><b>A missing number</b>, like <code>walk</code> on its own or <code>wait</code> with no seconds: add the number.</li>
<li><b>A pose it doesn't know</b>, like <code>pose jump</code>: use stand, sit, lie, meditate, hug or dance.</li>
<li><b>A lever that isn't here</b>, like <code>pull L</code> in the farm yard: go to the trap room, or pull a lever you placed.</li>
<li><b>It stopped by itself?</b> Maybe you clicked the picture. Press <span class="key">▶ play</span> again.</li>
</ul>

<h2 id="ch10"><span class="ch">10</span>STORIES TO TRY</h2>
<h3>The dance party</h3>
{code("say Party time!\npose dance\nwait 2\npose dance\nwait 2\npose dance\nwait 2\nloop")}
<h3>Hide and seek</h3>
{code("say I'll count to three!\nface back\nwait 3\nface front\nsay Ready or not!\nwalk 10 40\nwalk 90 40\nsay Where are you?")}
<h3>The lazy day</h3>
{code("walk 50 80\npose lie\nwait 5\npose sit\nsay What a nice nap.")}
<h3>Goodnight</h3>
{code("walk 40 50\nface front\nsay Goodnight, everyone!\npose meditate")}
<h3>Which lever? (in the trap room)</h3>
{code("say Let's try them all!\npull L\nwait 2\npull R\nwait 2\npull L\npull R\nsay Back the way they were.")}
{box("tip", "MAKE YOUR OWN", "<p>Mix the steps any way you like. Short stories are great. Long stories are great. Silly stories are the best.</p>")}

<h2 id="ch11"><span class="ch">11</span>THE QUICK CARD</h2>
<div class="card">
<p><code>walk X Z</code>: to X across (0–100), Z toward you (0–100)</p>
<p><code>wait S</code>: S seconds</p>
<p><code>pose …</code>: stand, sit, lie, meditate, hug, dance</p>
<p><code>face …</code>: left, right, front, back</p>
<p><code>pull …</code>: L, R, BL, BR, H, or a lever's number</p>
<p><code>say …</code>: words over the picture</p>
<p><code>loop</code>: back to the top</p>
<p><code># …</code>: a note, skipped</p>
<p><span class="key">▶ play</span> · <span class="key">⏹ stop</span> · <span class="key">🎬 play when we come here</span></p>
<p>🚶 paths: walk, wait, pose, face; always loop</p>
</div>

<h2 id="ch12"><span class="ch">12</span>ABOUT THIS GUIDE</h2>
<p>Every picture is of <b>Messed Up Dress Up {esc(RUN.get("version", ""))}</b>, as released, taken by <code>tools/checks/storyguide600.mjs</code> (kids-choice-games) on GitHub's computers{(', run <a href="' + esc(RUN["url"]) + '">' + esc(RUN["id"]) + '</a>') if RUN.get("url") else ''}. The coloring pages at the end of the zine are the game's own drawings, with every color taken out.</p>
<p>The story box is {ref(440)}, the walking paths {ref(599)}. Made with M and N, who will be reading it, and coloring it.</p>
</main>
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
PRINT = re.sub(r'<script>\s*\(function \(\) \{.*?</script>', '', PRINT, flags=re.S).replace("<title>Story Scripts Guide</title>", "<title>Story Scripts Guide (print)</title>")
open(os.path.join(R, "print.html"), "w").write(PRINT)
# (ticket 595) the 🔊 Listen bar, as every report has it
import subprocess
subprocess.run(["python3", os.path.join(R, "..", "..", "..", "tools", "add_listen.py"), os.path.join(R, "index.html")], check=True)
print("wrote 018/index.html and print.html:", len([f for f in os.listdir(os.path.join(R, "pictures")) if f.endswith(".webp")]), "pictures")
