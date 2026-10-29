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

VER = RUN.get("version", "")
TEXTS = json.load(open(os.path.join(R, "data", "texts.json"))) if os.path.exists(os.path.join(R, "data", "texts.json")) else {}

# (Matthew 2026-10-29: "a full walk through of the dungeon ... with a warning that this part of the doc spoils puzzles") the dungeon's map,
# drawn from the maze the check read out of the game (data/texts.json: maze): a wall where there is no way, each gate a red bar with its
# number, the way in, the treasure room, and what lies in the side passages
def maze_map():
    M = TEXTS.get("maze")
    if not M: return '<p class="missing">📷 the map is drawn from the game, coming</p>'
    S, P = 44, 10
    cols, rows = M["cols"], M["rows"]
    out = [f'<svg viewBox="0 0 {cols * S + 2 * P} {rows * S + 2 * P}" width="100%" style="max-width:520px;display:block;margin:16px auto;background:var(--paper);border:3px solid var(--ink)" role="img" aria-label="A map of the dungeon maze">']
    icon = {"chest": "💰", "rock": "🪨", "statue": "🗿", "cavemushroom": "🍄", "toadstool": "🍄", "potion": "🧪", "chocolate": "🍫", "horseshoe": "🧲", "sign": "🪧"}
    gates = {}
    for k, c in M["cells"].items():
        for t in c["things"]:
            if t["kind"] == "plate" and t["opens"] and t["uid"].startswith("dg-g"): gates[(k, t["opens"])] = t["uid"][-1]
    for k, c in M["cells"].items():
        x, y = (int(v) for v in k.split(","))
        X, Y = P + x * S, P + y * S
        out.append(f'<rect x="{X}" y="{Y}" width="{S}" height="{S}" fill="#5c5a55" opacity="0.12"/>')
        for d, (x1, y1, x2, y2) in {"N": (0, 0, S, 0), "E": (S, 0, S, S), "S": (0, S, S, S), "W": (0, 0, 0, S)}.items():
            g = gates.get((k, d))
            if g: out.append(f'<line x1="{X + x1}" y1="{Y + y1}" x2="{X + x2}" y2="{Y + y2}" stroke="#d62828" stroke-width="6"/><text x="{X + (x1 + x2) / 2 + (6 if d in "EW" else 0)}" y="{Y + (y1 + y2) / 2 + (5 if d in "EW" else -4)}" font-size="13" font-weight="700" fill="#d62828" text-anchor="middle" font-family="sans-serif">{g}</text>')
            elif not c[d]: out.append(f'<line x1="{X + x1}" y1="{Y + y1}" x2="{X + x2}" y2="{Y + y2}" stroke="var(--ink)" stroke-width="3" stroke-linecap="square"/>')
        marks = []
        if k == M["start"]: marks.append("⬇️")
        if k == "7,0": marks.append("👑")
        for t in c["things"]:
            if k in (M["start"], "7,0"): break
            kind = t["id"] if t["kind"] == "item" else t["kind"]
            if kind in icon and not (t["kind"] == "plate"): marks.append(icon[kind] if t["kind"] != "chest" else "💰")
            if t["kind"] == "plate": marks.append("⬜")
        if marks: out.append(f'<text x="{X + S / 2}" y="{Y + S / 2 + 7}" font-size="18" text-anchor="middle">{"".join(marks[:2])}</text>')
    out.append("</svg>")
    return "".join(out)

BODY = f"""<p class="series"><a href="../">Dress Up reports</a> · <a class="ref" href="../023/"><code><b>^du_report(</b>23<b>)</b></code></a> · 2026-10-29 · <span class="wip">work in progress</span> · about <a href="https://matthewhammer.org/kids-choice-games/dress-up/">Messed Up Dress Up</a></p>
<div class="cover">
  <div class="pub">KIDS' CHOICE GAMES PRESENTS</div>
  <h1>DOING THINGS<br>IN MESSED UP<br>DRESS UP</h1>
  <div class="edition">a young player's guide · the 🎒 backpack, pots, tools, floor switches and the dungeon{(" · version " + esc(VER)) if VER else ""}</div>
  {pic("13-bee-bottle.png", "Got one! A bee, caught in a glass bottle.", "half")}
</div>
<p class="series">Matthew, 2026-10-29: “another young player's guide ... how to use the backpack: make visible, place item inside, take item out and place into world”; “document how to pick up pots and swing tools in this manual too”; “a full walk through of the dungeon, and each other set of dynamic interactions we've set up (bottle and bee, etc) with a warning that this part of the doc spoils puzzles.”</p>

<div class="toc">
<a href="#ch1">1 · THINGS TO DO</a><br>
<a href="#ch2">2 · THE ACTION BUTTON</a><br>
<a href="#ch3">3 · PUT ON THE BACKPACK</a><br>
<a href="#ch4">4 · OPEN A TREASURE CHEST</a><br>
<a href="#ch5">5 · LOOK INSIDE</a><br>
<a href="#ch6">6 · TAKE ONE OUT</a><br>
<a href="#ch7">7 · PICK IT UP AGAIN</a><br>
<a href="#ch8">8 · POTS: LIFT AND THROW</a><br>
<a href="#ch9">9 · GO EXPLORING</a><br>
<a href="#ch10">10 · TOOLS: HOLD AND SWING</a><br>
<a href="#ch11">11 · FLOOR SWITCHES</a><br>
<a href="#ch12">12 · PUZZLES TO SOLVE 🧩</a><br>
<a href="#ch13">13 · THE DUNGEON 🗝️</a><br>
<a href="#ch14">14 · MAKE UP A STORY</a><br>
<a href="#ch15">15 · THE QUICK CARD</a><br>
<a href="#spoilers">⚠️ SPOILERS: HOW TO SOLVE EVERYTHING</a><br>
<a href="#about">ABOUT THIS GUIDE</a><br>
</div>

<h2 id="ch1"><span class="ch">1</span>THINGS TO DO</h2>
<p>In Messed Up Dress Up, your friend can <b>do things</b>, not just walk around. They can open treasure chests, pick things up, carry them in a <b>backpack</b>, put them down somewhere new, lift pots and throw them, swing a bug net, and press floor switches.</p>
<p>This guide shows you how. There are puzzles to solve, and a whole dungeon to explore!</p>

<h2 id="ch2"><span class="ch">2</span>THE ACTION BUTTON</h2>
<p>When your friend is close to something they can use, it <b>glows</b>, like a door does. Then press the <b>action button</b>:</p>
<ul>
<li>On a keyboard: <span class="key">Enter</span>.</li>
<li>On a game controller: the 🫳 button (the same one that goes through a glowing door).</li>
<li>No keyboard? <b>Tap it</b> (or click it). Your friend walks over and does it.</li>
</ul>
<p>When you point at it, it says what will happen: <b>💰 open the chest</b>, <b>🎒 pick it up</b>...</p>
{pic("03-chest-shut.png", "A treasure chest, glowing: your friend is close enough to open it.")}
{box("tip", "GOOD TO KNOW", "<p>In 🎮 Controls you can choose which controller button does what: look for 🫳 <b>open a chest, pick up</b> and 🥅 <b>use the tool you hold</b>.</p>")}
{pic("16-controls.png", "The 🎮 Controls tab, with the two new actions.")}

<h2 id="ch3"><span class="ch">3</span>PUT ON THE BACKPACK</h2>
<ol class="steps">
<li>Open the <span class="key">🎒 Backpack</span> tab.</li>
<li>Press <span class="key">🎒 drawn on the friend</span>.</li>
</ol>
<p>Now your friend wears it! Press it again to take it off. The things inside stay inside.</p>
{pic("01-pack-on.png", "The backpack on your friend's back.", "half")}
{pic("02-pack-tab.png", "The 🎒 Backpack tab.")}

<h2 id="ch4"><span class="ch">4</span>OPEN A TREASURE CHEST</h2>
<p>A <b>shut</b> treasure chest 💰 has a surprise in it. Walk up to it. When it glows, press the action button.</p>
<p>The lid opens, the treasure flies up over your friend's head, and you hear music. Then the treasure goes <b>into the backpack</b>, and the chest is empty.</p>
{pic("04-chest-open.png", "Ta-da! A crown, held up high, on its way into the backpack.")}
{box("tip", "MAKE YOUR OWN CHEST", "<p>In <span class='key'>🏞️ Background</span>, under <b>🪨 things to put here</b>, add a <span class='key'>💰 treasure chest</span>. Choose what is inside it in <b>🎁 what comes out</b>. You can even pick your own voice from <span class='key'>🎙️ Recordings</span> to play when it opens!</p>")}

<h2 id="ch5"><span class="ch">5</span>LOOK INSIDE</h2>
<p>In the <span class="key">🎒 Backpack</span> tab, under <b>🎒 what's in it</b>, everything you carry has a <b>card</b>: its picture, its name, and when you got it.</p>
{pic("05-cards.png", "Three things in the backpack, a card for each.")}

<h2 id="ch6"><span class="ch">6</span>TAKE ONE OUT</h2>
<p>Every card has a <span class="key">⬇️ put down</span> button. Press it, and your friend puts that thing on the floor, right in front of them.</p>
{pic("06-put-down.png", "The crown, put down on the floor.")}
<p>Walk somewhere else and put down another one. You can decorate a whole room with your treasures!</p>

<h2 id="ch7"><span class="ch">7</span>PICK IT UP AGAIN</h2>
<p>Walk up to a thing on the floor. When it glows, press the action button (or tap it). It flies back into the backpack.</p>
{pic("07-pick-up.png", "Whoosh! The crown, flying back into the backpack.")}

<h2 id="ch8"><span class="ch">8</span>POTS: LIFT AND THROW</h2>
<p>The dungeon rooms have <b>pots</b>. Walk up to a pot and press the action button: your friend <b>lifts it over their head</b>.</p>
{pic("08-pot-held.png", "A pot, held up high.")}
<p>To <b>throw</b> it, press <span class="key">T</span> on a keyboard, or <span class="key">A</span> on a controller. The pot flies the way your friend is facing, and... <i>crash!</i></p>
{pic("09-pot-thrown.png", "Thrown! The pot flies, and breaks.")}
{box("tip", "GOOD TO KNOW", "<p>A pot you broke comes back when you leave the room and come in again.</p>")}

<h2 id="ch9"><span class="ch">9</span>GO EXPLORING</h2>
<p>Some rooms have things lying about that you can pick up. The healer, the witch and the blacksmith all keep interesting things in their rooms. What will you find?</p>
{pic("10-healer.png", "The healer's hut: what glows can go in your backpack.")}
<p>New things you can carry: 🧪 potions, 🍄 small mushrooms, 🍫 a chocolate bar, 🍾 a glass bottle, 🥅 a bug net, 🪨 rocks, 🗿 a little statue, 🔨 a hammer, 🧲 a horseshoe, and more. You can also put these anywhere yourself: in <span class="key">🏞️ Background</span>, <b>🪨 things to put here</b>, look in <span class="key">🎒 to carry</span>.</p>

<h2 id="ch10"><span class="ch">10</span>TOOLS: HOLD AND SWING</h2>
<p>A <b>tool</b> is something you use with your hands. The first tool is the <b>🥅 bug net</b>.</p>
<ol class="steps">
<li>Find the bug net and put it in your backpack.</li>
<li>On its card, press <span class="key">✋ hold it</span>. Now your friend holds the net.</li>
<li>Press <span class="key">U</span> on a keyboard, or <span class="key">Y</span> on a controller, to <b>swing</b> it. (No keyboard? Tap a bee.)</li>
</ol>
{pic("11-net-held.png", "Holding the bug net.")}
{pic("12-net-swing.png", "Swish! Swinging the net.")}
<p>To stop holding it, press <span class="key">🎒 put it away</span>. While you hold a tool, <span class="key">Y</span> swings it instead of crouching.</p>

<h2 id="ch11"><span class="ch">11</span>FLOOR SWITCHES</h2>
<p>A <b>floor switch</b> is a stone in the floor that can be <b>pressed down</b>. When it is down, it glows gold. There are two kinds:</p>
<ul>
<li><b>🔁 Step-on switches</b> go down when you step on them, and up again the next time you step on them.</li>
<li><b>⬇️ Hold-down switches</b> are only down while something is <b>on</b> them. Stand on one, and it goes down. Step off, and it comes up again! To keep it down, put something on it: a 🪨 rock, or a 🗿 statue.</li>
</ul>
<p>Some hold-down switches have a <b>picture</b> on them. Only the thing in the picture can hold that one down. Walk up to it and press the action button: if that thing is in your backpack, your friend puts it on the switch. If not, they tell you what it wants.</p>
{box("tip", "WHAT DO SWITCHES DO?", "<p>A switch can open a way out of a room, open trap doors, or make something appear. In <span class='key'>🏞️ Background</span>, a floor switch is in <b>🎚️ switches and traps</b>, and you choose what it does.</p>")}

<h2 id="ch12"><span class="ch">12</span>PUZZLES TO SOLVE 🧩</h2>
<h3>CATCH A BEE 🐝</h3>
<p>Can you catch a bee? You need <b>two things</b>: a <b>🥅 bug net</b> to catch it, and an empty <b>🍾 glass bottle</b> to keep it in. Where could they be? (A hint: one is up in the trees, and the other is with someone who makes medicine.) Then find a bee, hold the net, and swing!</p>
<h3>THE FLOOR SWITCH PUZZLE</h3>
<p>In the <span class="key">🎒 Backpack</span> tab, press <span class="key">🧩 put the floor switch puzzle here</span>. Chests appear, and floor switches with pictures. Can you get all the switches down at once?</p>
{pic("14-plates.png", "The floor switch puzzle: chests at the back, switches at the front.")}

<h2 id="ch13"><span class="ch">13</span>THE DUNGEON 🗝️</h2>
<p>Deep under the world there is a <b>dungeon</b>: a maze of 64 stone rooms. Somewhere in the start world there is a way down. Somewhere in the dungeon there is a treasure room... and a way back out.</p>
<p>Some walls in the dungeon are <b>gates</b>. A floor switch opens each one. Look around each room: what could press it?</p>
{box("tip", "STUCK?", "<p>The end of this guide shows the whole way through. But try it yourself first!</p>")}

<h2 id="ch14"><span class="ch">14</span>MAKE UP A STORY</h2>
<p>The things in your backpack can be the start of a story. Some ideas:</p>
<ul>
<li>The healer needs a 🍄 mushroom for a potion. Can you bring her one from the witch's room?</li>
<li>Leave a 🍫 chocolate bar in the tree house as a surprise for a friend.</li>
<li>Take the 🔨 hammer and 🧲 horseshoe from the smithy to the farm.</li>
<li>Put a treasure in a chest for someone else to find!</li>
</ul>

<h2 id="ch15"><span class="ch">15</span>THE QUICK CARD</h2>
<div class="card">
<p><b>Do the glowing thing:</b> <span class="key">Enter</span>, 🫳 on a controller, or tap it</p>
<p><b>Put the backpack on:</b> 🎒 tab, <span class="key">🎒 drawn on the friend</span></p>
<p><b>Open a chest:</b> walk up, action</p>
<p><b>Pick a thing up:</b> walk up, action</p>
<p><b>Put a thing down:</b> its card, <span class="key">⬇️ put down</span></p>
<p><b>Lift a pot:</b> walk up, action</p>
<p><b>Throw it:</b> <span class="key">T</span>, or <span class="key">A</span></p>
<p><b>Hold a tool:</b> its card, <span class="key">✋ hold it</span></p>
<p><b>Swing it:</b> <span class="key">U</span>, or <span class="key">Y</span></p>
<p><b>Press a switch:</b> stand on it, or put something on it</p>
<p><b>Let a bee go:</b> its card, <span class="key">🐝 let it go</span></p>
</div>

<h2 id="spoilers"><span class="ch">⚠️</span>SPOILERS: HOW TO SOLVE EVERYTHING</h2>
{box("warn", "STOP! SPOILERS AHEAD", "<p>The rest of this guide gives away the answers: where things are hidden, how to solve each puzzle, and the whole way through the dungeon, surprises and all. If you want to find them yourself, <b>stop reading here</b> and go play!</p>")}

<h3>WHERE EVERYTHING IS</h3>
<div class="scroll"><table class="feat"><thead><tr><th>where</th><th>what you can find</th></tr></thead><tbody>
<tr><td>🌿 the healer's hut</td><td>🧪 two potions, 🍾 a glass bottle, 🍫 a chocolate bar, 💡 a glowing mushroom</td></tr>
<tr><td>🧙 the witch's room</td><td>🧪 two potions, 🍄 three mushrooms</td></tr>
<tr><td>⚒️ the smithy</td><td>🔨 a hammer, 🧲 a horseshoe, 🗡️ a sword, 🛡️ a shield, 🪖 a helmet</td></tr>
<tr><td>🌳 the tree house</td><td>🥅 the bug net, 🍫 a chocolate bar</td></tr>
<tr><td>🌼 the clearing, the forests</td><td>🐝 bees</td></tr>
<tr><td>🗝️ the dungeon</td><td>chests, rocks, a statue, mushrooms, potions... see the map below</td></tr>
</tbody></table></div>

<h3>CATCHING A BEE: THE ANSWER</h3>
<ol class="steps">
<li>Go to the <b>tree house</b> (inside, up the ladder). Pick up the <b>🥅 bug net</b>.</li>
<li>Go to the <b>healer's hut</b>. Pick up the <b>🍾 glass bottle</b>.</li>
<li>In the 🎒 tab, press <span class="key">✋ hold it</span> on the net's card.</li>
<li>Go to the <b>clearing</b> or a forest, walk up to a 🐝 bee, and swing (<span class="key">U</span>, <span class="key">Y</span>, or tap the bee).</li>
<li>The bee goes into the bottle, the cork goes on, <i>pop!</i>, and the bottle goes into your backpack.</li>
</ol>
{pic("17-tree-net.png", "The tree house: the bug net, and a chocolate bar.")}
<p>Swing without an empty bottle and the bee just buzzes away. To set it free, press <span class="key">🐝 let it go</span> on its card.</p>

<h3>THE FLOOR SWITCH PUZZLE: THE ANSWER</h3>
<p>Open the three chests: they give a 👑 crown, a 🐚 shell and a 🗡️ sword. Put each one on the switch with its picture (walk up to the switch and press the action button). The fourth switch takes anything: pick up the 🗿 statue and put it there. When every switch is down, <i>click, click, click!</i> A new chest appears with a surprise inside: a 🥚 <b>dragon egg</b>!</p>
{pic("15-plates-solved.png", "Every switch down, and the new chest in the middle.")}

<h3>THE DUNGEON: THE WHOLE WAY THROUGH</h3>
<p><b>The map.</b> ⬇️ is where you come in, 👑 is the treasure room. The red bars are the three gates, numbered in the order you reach them. 💰 is a chest, ⬜ a floor switch, and the other pictures are things to find.</p>
{maze_map()}
<p><b>1. The way in.</b> In the start world, go to the <b>cemetery</b>. There is a dark ⚫ hole in the ground. Go into it, and you are in the dungeon's first room. A 🪜 ladder there takes you back up, any time.</p>
{pic("18-cemetery-hole.png", "The cemetery, and the hole down into the dungeon.")}
{pic("19-dungeon-in.png", "The dungeon's first room: a sign, and the ladder back up.")}
<p><b>2. Gate 1: step on it.</b> Find the room with a floor switch in the middle. Step on it: the switch goes down, and a wall rumbles open. (It is a step-on switch: step on it again and the way shuts!)</p>
{pic("20-gate-step.png", "Gate 1: standing on the switch opens the way.")}
<p><b>3. Gate 2: a rock.</b> This switch is a hold-down switch. Standing on it opens the way, but when you walk to the way, it shuts again! There is a 🪨 rock in the room. Pick it up, walk to the switch, and press the action button to put the rock on it. Now the way stays open.</p>
{pic("21-gate-rock.png", "Gate 2: the rock keeps the switch down, and the way open.")}
<p><b>4. Gate 3: the gems.</b> This switch has a picture of 💎 gems. Somewhere in the side passages before it there is a chest with gems in it (look at the map). Open it, bring the gems back, and put them on the switch.</p>
{pic("22-gems.png", "The gems, out of their chest.")}
{pic("23-gate-gems.png", "Gate 3: the gems on the switch, the way open.")}
<p><b>5. The treasure room.</b> At the far corner there are <b>four chests</b>: a 👑 crown, 🪙 gold, 💎 gems, and a 🥚 dragon egg. Open them all!</p>
{pic("24-treasure.png", "The treasure room.")}
<p><b>6. The way out.</b> There seems to be no way out... but there is a floor switch. Step on it, and a 🪜 <b>ladder</b> appears! Climb it, and you come out in the <b>castle</b>. (The castle now has a hole down into the treasure room, too.)</p>
{pic("25-ladder.png", "The switch, and the ladder that appears.")}
{pic("26-castle-out.png", "Out! In the castle, with the way back down.")}

<h2 id="about"><span class="ch">✎</span>ABOUT THIS GUIDE</h2>
<p>{("Every picture is of <b>Messed Up Dress Up " + esc(VER) + "</b>, taken by <code>tools/checks/packguide639.mjs</code> (kids-choice-games) on GitHub's computers" + ((', run <a href="' + esc(RUN["url"]) + '">' + esc(RUN["id"]) + '</a>') if RUN.get("url") else "") + ". The map is drawn from the maze the same run read out of the game.") if VER else "The pictures are being taken now."}</p>
<p>The backpack is {ref(632)}, the chests {ref(631)}, the pots {ref(629)}, and this guide and everything new in it (things to carry, tools, floor switches, the dungeon) {ref(639)}. Made for M and N, on a day off school, for reading and for playing.</p>
"""

PAGE = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<!-- nav: begin --><meta name="theme-support" content="data-theme"><script src="https://matthewhammer.org/nav/nav.js"></script><!-- nav: end -->
<script>try {{ var t = localStorage.getItem("theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); }} catch (e) {{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Doing Things in Messed Up Dress Up</title>
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
PRINT = re.sub(r'<script>\s*\(function \(\) \{.*?</script>', '', PRINT, flags=re.S).replace("<title>Doing Things in Messed Up Dress Up</title>", "<title>Doing Things in Messed Up Dress Up (print)</title>")
open(os.path.join(R, "print.html"), "w").write(PRINT)
# (ticket 595) the 🔊 Listen bar, as every report has it
import subprocess
subprocess.run(["python3", os.path.join(R, "..", "..", "..", "tools", "add_listen.py"), os.path.join(R, "index.html")], check=True)
print("wrote 023/index.html and print.html:", len([f for f in os.listdir(os.path.join(R, "pictures")) if f.endswith(".webp")]), "pictures")
