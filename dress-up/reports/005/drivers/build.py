#!/usr/bin/env python3
"""^du_report(5)'s page, from its data (data/report.json) and its mockups
(drivers/mockups.html): the tables come from the numbers there.
  python3 drivers/build.py   (from 005/)"""
import json, html, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(HERE, "data", "report.json"), encoding="utf-8"))
MK = open(os.path.join(HERE, "drivers", "mockups.html"), encoding="utf-8").read()
E = html.escape
def ref(n, kind="du_report"):
    if kind == "du_report": return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def mockup(id_):
    a = MK.index(f'<div class="mk" id="mk-{id_}">'); b = MK.find('<!-- MOCKUP', a); return MK[a:b if b > 0 else len(MK)]
STYLE = MK[MK.index("<style>"):MK.index("</style>") + 8]
BG = D["background"]; DS = D["designers"]
shared = "".join(f'<tr><td>{E(a)}</td><td>{E(b)}</td><td><code>{E(c)}</code></td></tr>' for a, b, c in DS["shared"])
shown = "".join(f'<tr><td>{E(p)}</td><td class="n">{r}</td><td class="n">{g}</td><td class="n">{c if c is not None else "–"}</td></tr>' for p, r, g, c in BG["shown"])
tabs = "".join(f'<tr><td>{E(t)}</td><td class="n">{r:,}</td><td class="n">{g}</td><td class="n">{s}</td></tr>' if isinstance(r, int) and "Background" not in t else "" for t, r, g, s in D["tabs"])
fromrows = "".join(f'<tr><td>{E(k)}</td><td class="n">{v:,}</td><td class="n">{100 * v / BG["rows"]:.0f}%</td></tr>' for k, v in BG["from"].items())
found = "".join(f'<li><b>{E(a)}.</b> {E(b)} (<code>{E(c)}</code>)</li>' for a, b, c in D["found"])
# Figure 1: rows a player sees, by place (bars)
X0, X1, rows = 230, 700, BG["shown"]
mx = 50
h = 14 + len(rows) * 26 + 26
fig = [f'<svg class="chart" viewBox="0 0 760 {h}" role="img" aria-label="Rows a player sees in the Background tab, by place">']
for t in (0, 10, 20, 30, 40, 50):
    x = X0 + t * (X1 - X0) / mx
    fig.append(f'<line class="grid" x1="{x:.1f}" y1="6" x2="{x:.1f}" y2="{h - 20}"/><text class="tick" x="{x:.1f}" y="{h - 6}" text-anchor="middle">{t}</text>')
for i, (p, r, g, c) in enumerate(rows):
    y = 14 + i * 26
    fig.append(f'<text class="lab" x="{X0 - 8}" y="{y + 14}" text-anchor="end">{E(p)}</text><rect class="b1" x="{X0}" y="{y}" width="{r * (X1 - X0) / mx:.1f}" height="18" rx="3"/>'
               f'<text class="val1" x="{X0 + r * (X1 - X0) / mx + 5:.1f}" y="{y + 14}">{r} rows' + (f', {g} groups' if g else "") + '</text>')
fig.append("</svg>"); FIG1 = "".join(fig)

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>try {{ var t = localStorage.getItem("theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); }} catch (e) {{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Always Be Knolling</title>
<style>
  :root {{ --bg: #fbfaf7; --paper: #ffffff; --ink: #1f2328; --muted: #5b6470; --line: #e3e0d8; --accent: #6d28d9; --soft: #cbbcf0; --alt: #0f8b7d; --good: #15803d; --bad: #b91c1c; --link: #1d4ed8; }}
  @media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg: #15171a; --paper: #1d2024; --ink: #e8e6e3; --muted: #a2a9b3; --line: #33373d; --accent: #c4b5fd; --soft: #5b4a8a; --alt: #2dd4bf; --good: #4ade80; --bad: #f87171; --link: #93c5fd; }} }}
  :root[data-theme="dark"] {{ --bg: #15171a; --paper: #1d2024; --ink: #e8e6e3; --muted: #a2a9b3; --line: #33373d; --accent: #c4b5fd; --soft: #5b4a8a; --alt: #2dd4bf; --good: #4ade80; --bad: #f87171; --link: #93c5fd; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 system-ui, "Segoe UI", Roboto, sans-serif; }}
  main {{ max-width: 1080px; margin: 0 auto; padding: 32px 16px 80px; }}
  h1 {{ font-size: 2em; line-height: 1.2; margin: 0 0 6px; }}
  h2 {{ font-size: 1.35em; margin: 48px 0 10px; padding-top: 8px; border-top: 2px solid var(--line); }}
  h3 {{ font-size: 1.08em; margin: 24px 0 6px; }}
  p, li {{ max-width: 76ch; }}
  .series {{ color: var(--muted); margin: 0 0 6px; font-size: 0.92em; }}
  .sub {{ color: var(--muted); margin: 0 0 24px; }}
  .headline {{ background: var(--paper); border-left: 4px solid var(--accent); padding: 10px 14px; border-radius: 6px; }}
  .headline ol > li {{ margin: 8px 0; }}
  a {{ color: var(--link); text-underline-offset: 2px; }}
  code {{ font-size: 0.86em; background: color-mix(in srgb, var(--line) 50%, transparent); padding: 0 4px; border-radius: 4px; }}
  .kpis {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin: 18px 0; }}
  .kpi {{ background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }}
  .kpi .v {{ font-size: 1.7em; font-weight: 700; }} .kpi .l {{ color: var(--muted); font-size: 0.9em; }}
  figure {{ margin: 18px 0; }} figcaption {{ color: var(--muted); font-size: 0.9em; margin-top: 6px; max-width: 76ch; }}
  svg.chart {{ width: 100%; height: auto; background: var(--paper); border: 1px solid var(--line); border-radius: 10px; }}
  svg.chart .grid {{ stroke: var(--line); }} svg.chart .tick {{ fill: var(--muted); font-size: 11px; }} svg.chart .lab {{ fill: var(--ink); font-size: 12px; }}
  svg.chart .val1 {{ fill: var(--ink); font-size: 11px; font-weight: 600; }} svg.chart .b1 {{ fill: var(--accent); }}
  table {{ border-collapse: collapse; width: 100%; font-size: 0.9em; }}
  th, td {{ text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }}
  th {{ color: var(--muted); font-weight: 600; }} td.n {{ font-variant-numeric: tabular-nums; white-space: nowrap; }}
  .scroll {{ overflow-x: auto; }}
  .note {{ color: var(--muted); font-size: 0.9em; }}
  .ba {{ display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 14px; align-items: start; }}
  .ba > div > h4 {{ margin: 0 0 6px; font-size: 0.95em; color: var(--muted); }}
  .ba img {{ width: 100%; height: auto; border-radius: 10px; border: 1px solid var(--line); display: block; }}
  @media (max-width: 760px) {{ .ba {{ grid-template-columns: 1fr; }} }}
  .shots {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }}
  .shots img {{ width: 100%; border-radius: 10px; border: 1px solid var(--line); display: block; }}
  .rules {{ counter-reset: r; list-style: none; padding: 0; }}
  .rules li {{ counter-increment: r; margin: 10px 0; padding-left: 2.6em; position: relative; }}
  .rules li::before {{ content: "R" counter(r); position: absolute; left: 0; font-weight: 700; color: var(--accent); }}
  ol.steps {{ list-style: none; padding-left: 0; }} ol.steps li {{ margin: 12px 0; border-left: 3px solid var(--line); padding-left: 12px; }}
  .stepnum a {{ font-weight: 700; text-decoration: none; }}
  button.tk, button.theme {{ font: inherit; font-size: 0.8em; border: 1px solid var(--line); background: var(--paper); color: var(--muted); border-radius: 8px; padding: 1px 8px; cursor: pointer; }}
  button.theme {{ position: fixed; top: 10px; right: 10px; z-index: 9; }}
</style>
{STYLE}
</head>
<body>
<button class="theme" id="theme" title="Light or dark">◐ Auto</button>
<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(5)} · 2026-10-18 · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(4)}</p>
<h1>Always be knolling</h1>
<p class="sub">What did the two full-screen designers, 🎵 Music and 🗺️ World design, do the same way that the rest of Dress Up's panels do not, and should every panel move to it? Read from the game's code at 0.0.204 (every row each tab declares, and which a player sees in each place), with pictures of the panels as they are and mockups of what they could be ({ref(279, "ticket")}).</p>

<div class="headline" id="answers">
<p><b>Short answers.</b></p>
<ol>
<li><b>The two designers share one way of laying out a panel,</b> {len(DS["shared"])} choices in all: one way in and out, the rest of the page cleared, a slim bar, cards in a grid, boxes within boxes, kinds told apart by a faint tint, fewer words, and a row on one line. The world designer adds the game itself as its first card. Each choice was asked for along the way (tickets 159, 210, 224, 226, 231, 250), and none of it has reached the other {DS["of_tabs"] - 2} tabs.</li>
<li><b>The 🏞️ Background tab is the biggest of them by far:</b> {BG["rows"]:,} rows in {BG["groups"]} groups, {100 * BG["from"]["the three castles"] / BG["rows"]:.0f}% of them the three castles' rooms. In a place, a player sees 9 rows (the forest) to 50 (outside a castle), one under the other in a narrow column, the groups as dashed boxes.</li>
<li><b>The proposal: one approach for every panel,</b> nine rules (<a href="#global">below</a>): a box for each thing you can see or hear, named once; nesting shown by boxes inside boxes alone; everything laid out in plain view, in order (knolled); the thing shown, not just named; and every big tab a designer with the game as its first card, its boxes mirroring what is in the picture.</li>
<li><b>Three before and afters:</b> the castle's color themes (one decision in one place, its colors shown), the bubble themes (three cards, each with its bubble drawn), and a full-screen 🏞️ Background designer (the game as its first card; the place picked from pictures of the places; what stands in the place as a card each, with its picture).</li>
<li><b>Found on the way:</b> the house's 🧸 toys slider never shows (two rows share a key), and the bubble themes' on/off switches look the same on and off.</li>
</ol>
</div>

<div class="kpis">
<div class="kpi"><div class="v">2 of {DS["of_tabs"]}</div><div class="l">tabs with a full screen of their own (🎵 Music, 🗺️ World design)</div></div>
<div class="kpi"><div class="v">{BG["rows"]:,}</div><div class="l">rows declared in 🏞️ Background, in {BG["groups"]} groups</div></div>
<div class="kpi"><div class="v">9–50</div><div class="l">of them a player sees in one place (the forest; outside a castle)</div></div>
<div class="kpi"><div class="v">{len(DS["shared"])}</div><div class="l">choices the two designers make alike</div></div>
</div>

<h2 id="principles">Four ideas</h2>
<p><b>Knolling.</b> Laying out the things you are working with, at right angles, grouped by kind, all in plain view. The word is said to come from Frank Gehry's furniture shop in 1987, where Andrew Kromelow squared up the tools that way. The artist Tom Sachs made "always be knolling" a rule of his studio: put away what you are not using, group what you are, and lay it out so that you can see all of it. For a panel: each thing's controls together, in its own place, aligned with its neighbours, nothing hidden in a list that scrolls past.</p>
<p><b>Boxes within boxes, with little visual noise.</b> Sub-structure should be visible as structure: a part of a thing sits in a box inside that thing's box, and that is all the decoration it needs. No dashed borders, no repeated names, no instructions in a label.</p>
<p><b>Fractal organization.</b> The same shapes at every scale: a tab is a box of boxes, a box is a box of rows, a row a line of chips. Learn one level and you can read them all; zooming in or out changes the scale, not the rules.</p>
<p><b>Mirror worlds.</b> David Gelernter's <i>Mirror Worlds</i> (1991), subtitled "the day software puts the universe in a shoebox", imagines software models of the world that you can look into whole and then zoom into, part by part: a view he called topsight. The world designer is a small one already: the game's world as a grid of squares, each a picture of its place, and the game itself in a card beside it. A designer for each panel would mirror what that panel changes: the place, the friend, the music.</p>

<h2 id="designers">What the two designers do alike</h2>
<div class="shots"><img src="pictures/before-music.jpg" alt="The music full screen: a slim bar, cards in a grid, the mixing board's strips as cards"><img src="pictures/before-world-designer.jpg" alt="The world designer full screen: the grid of places on the left, the game and the cards on the right"></div>
<p class="note">🎵 Music and 🗺️ World design, full screen, at 1280 × 800 (0.0.204; shown smaller here). Each has a slim bar with ✕ back; the music's mixing board is a card of cards, its strips tinted by kind; the world designer's grid is a picture of each place, and its first card on the right is the game itself.</p>
<div class="scroll"><table><tr><th>choice</th><th>what it is</th><th>where</th></tr>{shared}</table></div>
<p><b>Where they differ:</b> {E("; ".join(DS["differences"]))}. <b>Left unfinished:</b> {E("; ".join(DS["unfinished"]))}.</p>

<h2 id="panels">The panels as they are</h2>
<div class="shots"><img src="pictures/before-background-wide.jpg" alt="The game at 1280 wide: the picture, and the Background tab in a narrow column under 19 tab buttons"><img src="pictures/before-background-narrow.jpg" alt="The Background tab's rows in the forest, on a narrow window"></div>
<p class="note">The 🏞️ Background tab in the forest, at 1280 × 800 (left, smaller) and on a narrow window (right): under the 19 tabs, the kinds of place and the places as chips in dashed boxes, then one row under another.</p>
<figure id="fig-1">{FIG1}<figcaption>Figure 1. Rows of 🏞️ Background a player sees in each place, at the game's defaults (0.0.204; SHOWN_WHEN run on the defaults, each place in turn). Outside a castle, 50 rows in 10 groups and about 258 chips.</figcaption></figure>
<div class="scroll"><table><tr><th>where Background's {BG["rows"]:,} rows come from</th><th>rows</th><th>share</th></tr>{fromrows}</table></div>
<h3>Every tab</h3>
<div class="scroll"><table><tr><th>tab</th><th>rows declared</th><th>groups</th><th>shown at the defaults</th></tr>{tabs}<tr><td>🏞️ Background</td><td class="n">{BG["rows"]:,}</td><td class="n">{BG["groups"]}</td><td class="n">9 to 50</td></tr></table></div>
<p class="note">🎵 Music's 10 rows include the mixing board, about 120 controls for a tune of 14 parts; 🗺️ World design's 2 include the whole designer.</p>

<h2 id="after">Before and after</h2>
<h3 id="castle">The castle's color themes</h3>
<p>A castle has two themes, A and B: each two flag colors, how they go together (↔️ in turn, ▥ stripes, ▦ checkers) and a carpet. A is the castle's own, its flags outside too; B starts as A with its colors swapped. Today the colors are set in one group ("🎨 N's castle: its color themes", 8 rows), and each room that takes a theme chooses one in its own box, by name: "🎨 theme A" or "🎨 theme B", with no color to see. One decision in two places. After: the two themes side by side, each drawn as its flag; each room shows its theme as its flag's two colors, and a tap swaps it; the rooms that keep their own colors say so.</p>
<div class="ba"><div><h4>before (castle N, room 1)</h4><img src="pictures/before-castle-theme.png" alt="A room's box: its colors, theme A or theme B, as words"></div><div><h4>after</h4>{mockup("castle")}</div></div>
<h3 id="bubbles">The bubble themes</h3>
<p>Three themes, A (always) and B and C (each switched on or off), five rows each: colour, size, shine, sparkle, sparkle colour. They are in 🏞️ Background, for bubble space (20 rows, 4 groups), and again in 🎮 Controls, for blowing bubbles, where B and C have a second, separate on and off. Every label repeats its theme's letter ("🅱️ colour", "🅱️ size"), and the on and off switch is a chip named "🅱️ theme B" both ways that looks the same on and off. After: three cards side by side, each headed by its bubble, drawn from its settings; its switch at its corner; no letter repeated inside.</p>
<div class="ba"><div><h4>before (bubble space, theme B on)</h4><img src="pictures/before-bubble-themes.jpg" alt="Theme A's last rows and theme B's first, stacked in dashed boxes"></div><div><h4>after</h4>{mockup("bubbles")}</div></div>
<h3 id="background">🏞️ Background, as a designer</h3>
<p>The world designer, made for one place: the same slim bar and ✕ back, the game as the first card on the right, and on the left the place's boxes, each mirroring something in the picture. The place is picked from pictures of the places (the picture archive's), grouped by kind; the place's own settings are one box; what stands in the place is a card each, its picture clipped from the scene (OBJECTS.md's), lit in the game while pointed at (the 🔬 overlays already outline each one) and hidden with a tap; the friend here, the place's ways and its music are a box each. The side panel keeps the same boxes, smaller, for quick changes during play.</p>
<div class="ba"><div><h4>before (the forest's rows; the lake has 17)</h4><img src="pictures/before-background-narrow.jpg" alt="The Background tab's rows in the forest, one under another"></div><div><h4>after (the lake, full screen)</h4>{mockup("background")}</div></div>
<p class="note">The mockups are drawn in this page, in the game's own dark colors; their settings, defaults, objects and tune are the lake's and castle N's as the game has them at 0.0.204. The live game card is the lake's archived picture.</p>

<h2 id="global">A global shift: the rules</h2>
<ol class="rules">
<li><b>A box for each thing you can see or hear</b>: a place, a thing standing in it, a part of the friend, a channel, a theme. Its name once, at its top, emoji first; nothing inside repeats it (no "🅱️ colour" inside theme B).</li>
<li><b>Nesting by boxes alone</b>: each level a shade lighter than the one it is in, no dashed lines; kinds told apart by a faint tint, as the music's strips and the world's squares are.</li>
<li><b>Knolled</b>: boxes in a grid, things of a kind the same size and lined up, everything a box holds in plain view. A 👁️ fold only for the big ones, remembered in the browser, as the world's view is.</li>
<li><b>A row on one line</b>: its emoji and two or three words, its control, its value, the music's knob as the model. What a label explains today ("% for each tenth of the picture", "0 = a blur") moves into a hint shown on pointing.</li>
<li><b>Show the thing</b>: a color as a swatch, a theme as what it draws (a bubble, a flag), a place as its picture, a thing standing in a place as its own picture.</li>
<li><b>One decision, one place</b>: a theme chosen where its colors are set, or its colors shown where it is chosen; a setting used in two tabs is one box shown in both, and one setting, not two.</li>
<li><b>Mirror the picture</b>: every big tab a designer that opens with the game as its first card; each box mirrors something in it; pointing at a box lights its thing in the game, and pointing at a thing in the game finds its box.</li>
<li><b>The same at every scale</b>: tab, designer, box, box inside it, row, chip; the side panel is the designer's boxes, smaller, not a different layout.</li>
<li><b>Keep it fast</b>: a box is built once and refreshed by what it shows, and show-when rules stay lookups (ticket 167: the Background tab's refresh once held swimming at 2 to 15 frames a second).</li>
</ol>
<p>In code, three pieces carry all of it: a box (its name, its tint, its fold, its grid of what it holds), the row the music's knobs already are, and the designer's shell the two full screens share (the bar, ✕, the cleared page, the game card). TABS would say which boxes a tab has, and SHOWN_WHEN would show and hide whole boxes as it shows and hides rows now.</p>

<h2 id="found">Found on the way</h2>
<ul>{found}</ul>

<h2 id="next">What next</h2>
<ol class="steps">
<li id="step-1"><span class="stepnum"><a href="#step-1">1.</a></span> <b>The pieces:</b> a box, the one-line row and the designer's shell, shared by every tab (CSS tokens for the shades and tints; TABS rows grouped into boxes); the two full screens moved onto them, the same as they look now. <button class="tk" data-step="1">copy for a ticket</button></li>
<li id="step-2"><span class="stepnum"><a href="#step-2">2.</a></span> <b>🏞️ Background as a designer:</b> full screen with the game as its first card; the places as pictures; the place's own box; what stands in it as cards with their pictures, lit in the game while pointed at; the friend, the ways and the music each a box. <button class="tk" data-step="2">copy for a ticket</button></li>
<li id="step-3"><span class="stepnum"><a href="#step-3">3.</a></span> <b>The castle's themes in one place:</b> both drawn as flags; each room's theme shown by its colors and swapped with a tap; the rooms that keep their own colors saying so. <button class="tk" data-step="3">copy for a ticket</button></li>
<li id="step-4"><span class="stepnum"><a href="#step-4">4.</a></span> <b>The bubble themes as three cards</b>, each with its bubble drawn; their on and off visible (a bug today); one on and off for each theme, or two plainly named. <button class="tk" data-step="4">copy for a ticket</button></li>
<li id="step-5"><span class="stepnum"><a href="#step-5">5.</a></span> <b>Fixed: the house's 🧸 toys</b>, two rows sharing a key, its slider never shown at the house. <button class="tk" data-step="5">copy for a ticket</button></li>
<li id="step-6"><span class="stepnum"><a href="#step-6">6.</a></span> <b>The other tabs, biggest first:</b> 🐯 Costume (46 rows), 😀 Face (31), 🎮 Controls (22), 👁 Eyes and 🖐 Hands (15 each), and the rest; each as its boxes, then, where it has many, a designer of its own. <button class="tk" data-step="6">copy for a ticket</button></li>
<li id="step-7"><span class="stepnum"><a href="#step-7">7.</a></span> <b>Tidy what the survey found stale:</b> three comments and two lines of agent-instructions.md about the full screens; "colour" and "color". <button class="tk" data-step="7">copy for a ticket</button></li>
<li id="step-8"><span class="stepnum"><a href="#step-8">8.</a></span> <b>Measure the full-screen designer's speed</b> (ticket 289, not measured for this report): many place pictures at once were slow on the black laptop, so before step 2 is built, its place pictures drawn live, as still pictures and as bitmaps, and the friend's walk and drag with the designer open, at normal speed and on the slow tiers. The numbers come back here as a dated note. <button class="tk" data-step="8">copy for a ticket</button></li>
</ol>

<h2 id="wrong">What we got wrong on the way</h2>
<ul>
<li><b>Our first background mockup invented the forest's settings</b> (clouds, trees, flowers, day and night): the forest has none of its own. The mockup is the lake now, with the lake's real five.</li>
<li><b>Our first castle mockup gave every room a theme;</b> only rooms with doors of their own take one (castle N, at its defaults: the king's room alone).</li>
</ul>

<h2 id="method">How this was put together</h2>
<p><b>The code.</b> {E(D["how"])}. The game is {D["game"]["version"]} (<code>{D["game"]["commit"]}</code>). Rows declared: TABS walked, groups expanded; rows shown: SHOWN_WHEN run with each place set as the background, everything else at its defaults (two kinds of row, things standing in a place and seats, hide themselves when they have nothing to list).</p>
<p><b>The pictures.</b> {E(D["pictures"]["taken"])}. {E(D["pictures"]["after"])}.</p>
<p><b>The data</b> is here twice: embedded in this page (<code>&lt;script type="application/json" id="report-data"&gt;</code>) and as <a href="data/report.json">005/data/report.json</a>. The page is built from it and from the mockups by <a href="drivers/build.py">005/drivers/build.py</a>.</p>
</main>
<script type="application/json" id="report-data">{json.dumps(D, indent=1, ensure_ascii=False)}</script>
<script>
(() => {{
  const b = document.getElementById("theme"), modes = ["auto", "light", "dark"], names = {{ auto: "◐ Auto", light: "☀ Light", dark: "☾ Dark" }};
  let m = "auto"; try {{ m = localStorage.getItem("theme") || "auto"; }} catch (e) {{}}
  const show = () => {{ b.textContent = names[m]; if (m === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", m); }};
  b.onclick = () => {{ m = modes[(modes.indexOf(m) + 1) % 3]; try {{ localStorage.setItem("theme", m); }} catch (e) {{}} show(); }};
  show();
  for (const t of document.querySelectorAll("button.tk")) t.onclick = () => {{
    const li = t.closest("li"), n = t.dataset.step, text = li.cloneNode(true);
    text.querySelectorAll("button, .stepnum").forEach(e => e.remove());
    const msg = `Mint a ticket for this step: Dress Up reports, ^du_report(5), What next, step ${{n}}: "${{text.textContent.trim()}}". ${{location.href.split("#")[0]}}#step-${{n}}`;
    navigator.clipboard.writeText(msg).then(() => {{ t.textContent = "copied"; setTimeout(() => t.textContent = "copy for a ticket", 1500); }});
  }};
}})();
</script>
</body>
</html>
'''
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(page)
print("wrote", os.path.join(HERE, "index.html"), len(page), "bytes")
