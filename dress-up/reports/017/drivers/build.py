#!/usr/bin/env python3
"""^du_report(17): 📜 game scripts, a player's guide in the style of a 1980s-90s game manual (^ticket(593)).

Reads data/texts.json (what the game said in each scene of tools/checks/manual593.mjs, run on GitHub's computers: the log's entries,
the errors and answers of the broken scripts) and data/features.json (the feature list, with where each one stands), and the pictures in
pictures/ from the same run. Writes index.html.
  python3 dress-up/reports/017/drivers/build.py
"""
import os, json, html
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(R, "data", "texts.json")))
F = json.load(open(os.path.join(R, "data", "features.json")))
RUN = json.load(open(os.path.join(R, "data", "run.json")))
EV = json.load(open(os.path.join(R, "data", "events.json")))
ST = json.load(open(os.path.join(R, "data", "state.json")))
GL = json.load(open(os.path.join(R, "data", "globals.json")))
esc = lambda s: html.escape(str(s if s is not None else ""))
pic = lambda name, cap, cls="": (f'<figure class="shot {cls}"><img src="pictures/{name}" alt="{esc(cap)}" loading="lazy">'
                                 f'<figcaption>{cap}</figcaption></figure>') if os.path.exists(os.path.join(R, "pictures", name)) else f'<p class="missing">[picture {esc(name)} not taken]</p>'
box = lambda kind, title, body: f'<aside class="box {kind}"><div class="box-h">{title}</div>{body}</aside>'
code = lambda s: f'<pre class="code">{esc(s)}</pre>'
ref = lambda n: f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'

def log_line(e):
    d = e.get("diff") or []
    ch = ", ".join(f'{c["path"]}: {json.dumps(c["from"])} → {json.dumps(c["to"])}' for c in d) or "no change"
    ev = e["ev"]; v = ev.get("value")
    return f'#{e["n"]} {e["engine"].upper():6} {e["call"]}({ev["tag"]}({json.dumps(v)})) {e["ms"]} ms · {ch}'

te, un, st = T.get("typeError", {}), T.get("unknown", {}), T.get("stops", {})
rows = "".join(f'<tr><td>{esc(f["area"])}</td><td>{f["what"]}</td><td class="st st-{f["status"]}">{esc(dict(done="DONE", branch="ON A BRANCH", next="NOT YET", check="TO CHECK").get(f["status"], f["status"]))}</td><td>{f.get("where", "")}</td></tr>' for f in F)
counts = {k: sum(1 for f in F if f["status"] == k) for k in ("done", "check", "branch", "next")}
# (Matthew, 2026-10-24: "sub section about each 'real game event' (using any nav arrow in any square, and using the game world data to
# figure out what to do next) vs 'game script event' now"; "the actual global state in JS for the game, versus what we have so far in
# Globals, to expose to the event handler game scripts")
sc = lambda x: f'<td class="st st-done">{esc(x)}</td>' if x else '<td class="st st-next">THE GAME&#39;S JS</td>'
nav_rows = "".join(f'<tr><td>{esc(e["event"])}{" <i>(" + esc(e["note"]) + ")</i>" if e.get("note") else ""}</td><td>{esc(e["decides"])}</td>{sc(e["script"])}</tr>' for e in EV["navigation"])
oth_rows = "".join(f'<tr><td>{esc(e["event"])}</td><td>{esc(e["decides"])}</td>{sc(e["script"])}</tr>' for e in EV["other"])
n_nav, n_nav_s = len(EV["navigation"]), sum(1 for e in EV["navigation"] if e["script"])
n_oth, n_oth_s = len(EV["other"]), sum(1 for e in EV["other"] if e["script"])
gl_rows = "".join(f'<tr><td><code>{esc(g["fields"])}</code></td><td>{esc(g["room"])}</td><td>{esc(g["source"])}</td></tr>' for g in GL)
top_rows = "".join(f'<tr><td><code>{esc(k)}</code></td><td class="n">{v:,}</td></tr>' for k, v in ST["top"][:10])
fam_rows = ", ".join(f'<code>{esc(k)}</code> {v}' for k, v in ST["families"][:12])


PAGE = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<!-- nav: begin --><meta name="theme-support" content="data-theme"><script src="https://matthewhammer.org/nav/nav.js"></script><!-- nav: end -->
<script>try {{ var t = localStorage.getItem("theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); }} catch (e) {{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Game Scripts Guide</title>
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
  .toc {{ columns: 2; font-family: "VT323", monospace; font-size: 1.3em; border: 2px dashed var(--line); padding: 10px 16px; }}
  .toc a {{ text-decoration: none; }} @media (max-width: 560px) {{ .toc {{ columns: 1; }} }}
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
</style>
</head>
<body>
<button class="theme" id="theme" title="Light or dark">◐ Auto</button>
<main>
<p class="series"><a href="../">Dress Up reports</a> · <a class="ref" href="../017/"><code><b>^du_report(</b>17<b>)</b></code></a> · 2026-10-24 · <span class="wip">work in progress</span> · about <a href="https://matthewhammer.org/hazel/dress-up/">Messed Up Dress Up</a>, a game made with M and N · {ref(593)}</p>
<div class="cover">
  <div class="pub">KIDS' CHOICE GAMES PRESENTS</div>
  <h1>GAME SCRIPTS<br>PLAYER'S GUIDE</h1>
  <div class="edition">for MESSED UP DRESS UP · the 📜 Scripting panel · first edition</div>
  {pic("01-pit-room.png", "The trap room, also called the pit room, in the game: two red levers, two blue levers, two pits. What each lever does is decided by a game script.", "half")}
</div>
<p class="series">Matthew, 2026-10-24: “explaining the new game script feature, in the spirit of a 1980s or 1990s game manual, with screenshots … we want to show what log events look like, and how to use them to ‘debug’ the game script”; “the report/manual for game scripts should show examples of erroneous scripts, and how to check the errors and fix them”; and “use this report to list the full feature set, to track it”.</p>

<div class="toc">
<a href="#ch1">1 · WHAT ARE GAME SCRIPTS?</a><br>
<a href="#ch2">2 · GETTING STARTED</a><br>
<a href="#ch3">3 · THE SCRIPT PANEL</a><br>
<a href="#ch4">4 · A WALK THROUGH THE PIT ROOM</a><br>
<a href="#ch5">5 · THE EVENT LOG 🪵</a><br>
<a href="#ch6">6 · DEBUGGING WITH THE LOG</a><br>
<a href="#ch7">7 · TROUBLESHOOTING: BROKEN SCRIPTS</a><br>
<a href="#ch8">8 · WHAT A SCRIPT COSTS 🔬</a><br>
<a href="#ch9">9 · BEHIND THE SCENES: GAME EVENTS</a><br>
<a href="#ch10">10 · BEHIND THE SCENES: THE GAME&#39;S STATE</a><br>
<a href="#ch11">11 · QUICK REFERENCE: EVERY FEATURE</a><br>
<a href="#ch12">12 · ABOUT THIS GUIDE</a>
</div>

<h2 id="ch1"><span class="ch">1</span>WHAT ARE GAME SCRIPTS?</h2>
<p>Some rooms in Messed Up Dress Up have <i>rules</i>. Pull a red lever in the trap room and a pit opens or shuts. Pull a blue lever and a boulder drops into a pit, or is lifted out. Pull the lever in a tree house and its trap door swings. Walk out of a square and the world decides where you arrive.</p>
<p>Every rule is a small program, a <b>game script</b>. The game hands it what it needs to know, the <b>globals</b> (which levers are up, which pits are open, which square of the world the friend is in), and an <b>event</b> (“the left red lever was pulled”). The script answers with <b>commands</b> (“flip the left lever; open pit 0”). The game carries them out, with the sounds and animations you know.</p>
{box("tip", "★ GOOD TO KNOW", "<p>Each rule is written three times, in three languages, and all three give the same answers. The game checks this on every change, over 50,000 cases. You choose which version runs.</p>")}
<p>The three languages:</p>
<ul>
<li><b>JS</b>: the game's own JavaScript, shown read-only, exactly as the game runs it.</li>
<li><b>Hazel</b>: a language with a type checker that reads your rule as you write it, and still runs a rule with mistakes in it.</li>
<li><b>🍄 Fumola</b>: a language in the style of Motoko, running in the browser as WebAssembly.</li>
</ul>

<h2 id="ch2"><span class="ch">2</span>GETTING STARTED</h2>
<ol class="steps">
<li>Open the side panel and choose the <b>📜 Scripting</b> tab.</li>
<li>At the top, in <b>⚙️ script editor settings</b>, the <b>all</b> row picks one language for every room: <span class="key">JS</span> <span class="key">Hazel</span> <span class="key">🍄 Fumola</span>. Each room's own box has the same three chips, to choose room by room.</li>
<li>Walk into the trap room and pull a lever. The rule in the language you chose decides what happens.</li>
</ol>
{pic("02-panel.png", "The 📜 Scripting panel beside the game: the settings at the top, then 🪵 the event log, then a box for each room's rule and one for Common, the helpers every room can call.")}

<h2 id="ch3"><span class="ch">3</span>THE SCRIPT PANEL</h2>
<h3>Settings</h3>
{pic("03-settings.png", "⚙️ script editor settings: the language for every room; the code's size and font; colours on or off; Hazel as tiles or text; line numbers; the event log on or off, and how many calls it keeps; and the longest line before it is broken.", "half")}
<h3>⛶ Max size and the outline</h3>
<p>Every box has a <span class="key">⛶ max size</span> button. It opens the box across the screen, with an <b>outline</b> on the left: every box, and in each its types (with their kinds and how many cases) and its functions (with their types, as Hazel works them out). Click a line in the outline and the box goes to that definition and selects it. Drag the bar between the two sides to make the outline wider or narrower.</p>
<p>Next to <span class="key">✖ back to game</span>, the <span class="key">🎮 show game viewport</span> chip puts the game itself at the top of the outline, so you can play while reading the rules and the log.</p>
{pic("04-max-trap-room.png", "⛶ max size at the trap room's rule, in Hazel's tiles, with the game viewport at the top left and the outline below it.")}
<h3>Hazel's tiles</h3>
<p>Hazel boxes show the rule as Hazel's own <b>tiles</b>, the real Hazel editor, in the page's colours. Type in them and the game uses your change about half a second after you stop. Right-click a name for <b>Goto definition</b> (or press <span class="key">F12</span>): it finds the definition even in another box, in Common, or among the types at the program's start. Prefer plain text? Choose <b>hazel: ✏️ text</b> in the settings.</p>

<h2 id="ch4"><span class="ch">4</span>A WALK THROUGH THE PIT ROOM</h2>
<p>The trap room has two pits and four levers. The two <b>red</b> levers open and shut the pits; which lever works which pit depends on the room's <b>wiring</b>: normal, reversed, or at random. The two <b>blue</b> levers drop a boulder into each pit the lever's side works, or lift the boulders out if one is there.</p>
<p>Here is the red lever's part of the rule, in Hazel:</p>
{code('''| Pull(side) =>
  let (was0, was1) = Common.pits_open(g.lever_L, g.lever_R, w) in
  let l = if side == L then !g.lever_L else g.lever_L in
  let r = if side == R then !g.lever_R else g.lever_R in
  let (now0, now1) = Common.pits_open(l, r, w) in
  Flip(side, Common.pit_moves(0, was0, now0, Common.pit_moves(1, was1, now1, Done)))''')}
<p>Read it line by line: which pits are open now; the levers after this pull; which pits are open after it; then the answer, flip the lever that was pulled and move each pit whose state changed. <code>Common.pits_open</code> and <code>Common.pit_moves</code> are helpers in the Common box, shared by every room.</p>
{box("tip", "★ TRY THIS", "<p>Pull the left red lever, then look at 🪵 the event log: the newest entry says <code>lever_L: false → true</code>. Pull it again and it goes back.</p>")}

<h2 id="ch5"><span class="ch">5</span>THE EVENT LOG 🪵</h2>
<p>Every time the game calls into a script, whichever language answers, the call goes into the <b>event log</b>, newest first, up to the last 100 (or all of them: <b>keep: all</b>). A line says:</p>
<ul>
<li>its number and the time, to the millisecond;</li>
<li>which language answered: JS, Hazel or Fumola;</li>
<li>the call and its event, as in <code>TrapRoom.on_event(Pull("L"))</code>;</li>
<li>how long it took in all (and how much of it was compiling the program, the first time);</li>
<li>how much of the globals it changed.</li>
</ul>
<p>Open a line to see the event, <b>what it changed</b> (each field, before → after), the rule's own answer, and, under one more fold, <b>the globals before and after in full</b>, side by side, with every changed field marked on both sides.</p>
{pic("05-log.png", "Playing and reading at once: the game viewport at the top left, and 🪵 the event log with the two newest calls opened. Each shows its event, what it changed (in the box), and the rule's answer.")}
{pic("05b-log-globals.png", "The same entry with “globals before and after, in full” opened: the two side by side, scrolling together, the field the call changed marked on both sides.")}
<p>The log of the run behind these pictures:</p>
{code(chr(10).join(log_line(e) for e in T.get("log", [])[::-1]) or "(no entries)")}
{box("tip", "★ WHY A BOULDER ARRIVES LATE", "<p>A boulder takes over a second to fall. The game writes where it is only when it lands, so the log reads the globals again two seconds after the call. A change found then is marked <i>“when its animation ended, 2 s later”</i>. If another call comes in first, the log doesn't guess.</p>")}
{box("tip", "★ A HUNDRED COPIES FOR THE PRICE OF ONE", "<p>Each entry keeps the whole globals twice, before and after. Most of it is the same from one call to the next, so the log stores each distinct part once and shares it. Six calls of the trap room keep their globals in about 8 shared parts, where plain copies would need 96. The line at the top of the log shows both numbers.</p>")}

<h2 id="ch6"><span class="ch">6</span>DEBUGGING WITH THE LOG</h2>
<p>When a lever does something you didn't expect, work through it like this:</p>
<ol class="steps">
<li><b>Do it once.</b> Pull the lever a single time, so the newest entry is the one you care about.</li>
<li><b>Which language answered?</b> If it says <b>JS</b> where you expected Hazel or Fumola, your rule didn't answer. Look for ⚠️ or ⛔ on the same line (chapter 7).</li>
<li><b>What came in?</b> Open the entry and read the <b>event</b> and the globals <b>before</b>. Was the lever really up? Was the wiring what you thought?</li>
<li><b>What did the rule say?</b> <b>The rule's answer</b> is exactly what it returned: <code>Flip(L, SetPit(0, true, Done))</code>, as data.</li>
<li><b>What changed?</b> If the answer is right but <b>what it changed</b> isn't, the game carried a command out differently than you meant. If the answer itself is wrong, the mistake is in the rule.</li>
<li><b>Compare with JS.</b> Switch that room to <span class="key">JS</span>, pull the lever again, and compare the two entries side by side.</li>
</ol>

<h2 id="ch7"><span class="ch">7</span>TROUBLESHOOTING: BROKEN SCRIPTS</h2>
<p>Four ways a script goes wrong, what each one looks like, and how to fix it. Every example was broken on purpose, in the run behind this guide.</p>

<h3>7.1 A type error (Hazel)</h3>
<p>Hazel reads the whole program before anything runs. Change the red lever's answer from <code>Flip(side, …)</code> to <code>Flip(3, …)</code>: a lever is a <code>Side</code> (<code>L</code> or <code>R</code>), not a number.</p>
{box("warn", "⚠ WHAT YOU SEE", "<p>The room's box lists its errors under its name; the ⛶ outline shows <b>⚠️</b> and a count beside the room; and the event log gets a <b>check</b> entry, before any lever is pulled:</p>" + code(chr(10).join(te.get("errors", [])) or "(not captured)") + "<p>The rule still <b>runs</b>: Hazel runs a program with errors as far as it can. Its answer goes in the entry, with <code>‹not a value›</code> where the error stopped it. But the game's own JS moves the lever, so the game keeps working while you fix it.</p>")}
{pic("06-type-error-box.png", "The trap room's box with its type errors listed under its name.")}
{pic("07-type-error-log.png", "The log: a check entry with the errors, then the pull, answered by JS, with Hazel's own answer and its errors underneath.")}
{box("tip", "★ HOW TO FIX IT", "<p>Read the message: <i>“3: a Side is wanted here, but this is an Int”</i>. Put back a <code>Side</code> (here, <code>side</code>), and the next check entry says <b>✅ the program is fine again</b>.</p>")}
{pic("08-fixed-log.png", "Fixed: the check entry says the program is fine again, and the next pull is Hazel's own.")}

<h3>7.2 A hole to fill (Hazel)</h3>
<p>Leave part of a rule unwritten, a <code>?</code> or an <code>if</code> without its <code>else</code>, and Hazel counts it: <i>“1 hole to fill”</i>, or <i>“1 bracket or keyword without its partner”</i>. It appears just like a type error: in the box, in the outline, and in a check entry. The game's JS moves until the rule is finished.</p>

<h3>7.3 A command the room doesn't know</h3>
<p>Every room carries out only its own commands. The trap room knows <code>Flip</code>, <code>SetPit</code>, <code>DropBoulder</code> and <code>LiftBoulder</code>; it doesn't know <code>GoSquare</code>, which belongs to the world. This rule type-checks, since <code>GoSquare</code> is a real command, but the room can't carry it out:</p>
{code(un.get("text", ""))}
{box("warn", "⚠ WHAT YOU SEE", f"<p>The entry says <b>⚠️ 1 command the room does not know</b>, and inside: <i>the room does not know {esc(', '.join(un.get('unknown') or ['GoSquare']))}: the commands from there on were not acted on</i>. The rule's answer shows the whole list it returned.</p>")}
{pic("09-unknown-command.png", "A command the trap room doesn't know: the entry, its answer, and the warning.")}
{box("tip", "★ HOW TO FIX IT", "<p>Use only the room's own commands. The rule's answer shows where the list went wrong; everything after the unknown command was skipped too.</p>")}

<h3>7.4 A rule that stops (Fumola)</h3>
<p>Some mistakes only show up when the rule runs. In Fumola, reading past the end of a list stops the rule:</p>
{code(st.get("line", ""))}
{box("warn", "⚠ WHAT YOU SEE", f"<p>The entry says <b>⛔ stopped: {esc(st.get('error') or 'Fumola: an index past the end')}</b>. Nothing the rule meant to do happened, and the lever stays where it was.</p>")}
{pic("10-fumola-stops.png", "A Fumola rule that stops: the entry and its message.")}
{box("tip", "★ HOW TO FIX IT", "<p>Find the line the message names, and check the list's length before reading from it, or read with a pattern (<code>switch</code>) that covers the empty case.</p>")}

<h2 id="ch8"><span class="ch">8</span>WHAT A SCRIPT COSTS 🔬</h2>
<p>In the <b>⚙️ Advanced</b> tab, under <b>🧪 tests and timing</b>, <b>🔬 the scripts' cost</b> shows, for every kind of event the scripts answer, how long it takes in each language: the whole event (from the game's call to the last command carried out), and for Hazel and Fumola the rule alone. It also shows each language's set-up time. A frame is 16.7 ms; a rule that takes longer than that can make the game stutter.</p>
{pic("11-cost.png", "🔬 the scripts' cost, filled by playing the trap room.", "half")}

<h2 id="ch9"><span class="ch">9</span>BEHIND THE SCENES: GAME EVENTS</h2>
<p>Scripts answer only some of what happens in the game. Every way of moving, every arrow, door, pit and ladder, ends in one place in the game's code, <code>enterScene</code>. It tries a passage, a world way, a rope bridge, a ladder, then asks the scripts (<code>scriptGo</code>), and otherwise takes the door's own destination, fixed when the scene was drawn. Here is every kind of game event, what the game reads to decide what happens next, and whether a script decides it today.</p>
<h3>Moving: {n_nav_s} of {n_nav} kinds go through a script</h3>
<div class="scroll"><table class="feat"><thead><tr><th>the event</th><th>what decides where it leads</th><th>who decides</th></tr></thead><tbody>{nav_rows}</tbody></table></div>
<h3>Doing: {n_oth_s} of {n_oth} kinds go through a script</h3>
<div class="scroll"><table class="feat"><thead><tr><th>the event</th><th>what it reads</th><th>who decides</th></tr></thead><tbody>{oth_rows}</tbody></table></div>
{box("tip", "★ WHAT THIS MEANS", "<p>The scripts decide the levers and the trap room's pits, the dungeons' ladders up, and the world's arrows between squares. Everything else that moves the friend, including the castle's own doors, the tree houses, caves, tents, huts, pictures and passages, still goes where the game's JS sends it. Each of those could become a script the same way: a room, an event, and a command back.</p>")}

<h2 id="ch10"><span class="ch">10</span>BEHIND THE SCENES: THE GAME'S STATE</h2>
<p>The game keeps everything it knows in one object, <code>state</code>: {ST["topParts"]} parts, about {ST["bytes"] // 1000} KB written out as JSON (a long-played save). A script sees a small slice of it, <b>Globals</b>: 17 fields, the slice its room needs, built fresh for each call.</p>
<h3>The game's state</h3>
<div class="scroll"><table class="feat"><thead><tr><th>part</th><th>bytes as JSON</th></tr></thead><tbody>{top_rows}</tbody></table></div>
<p>The <code>background</code> is the world itself: {ST["backgroundKeys"]:,} settings in {ST["backgroundFamilies"]} families, most of them per castle room ({fam_rows}, …). <code>world</code> is the map: {ST["worldSquares"]} squares, each with its kind (one of {ST["placeKinds"]}), its ways, and its things (of {ST["thingKinds"]} kinds); the castles have {ST["roomKinds"]} kinds of room. The rest is the friend (face, body, clothes, costume), the scripts themselves, and the player's settings.</p>
<h3>What a script sees: Globals</h3>
<div class="scroll"><table class="feat"><thead><tr><th>field</th><th>for</th><th>where the game keeps it</th></tr></thead><tbody>{gl_rows}</tbody></table></div>
{box("warn", "⚠ NOT IN GLOBALS (YET)", "<p>Where the friend stands in a room, what they wear, any room but the one the event is in, the castle's hall doors (390 settings), its cats, thrones and horses, the world's things and links to other worlds, the people, the clock, and the music. A rule that needs one of these has to wait for a field to be added. The game builds each room's slice in <code>SCRIPT_ACTS[kind].globals</code> (25-scripting.js), and the type <code>Globals</code> at the program's start lists the fields, so the two change together.</p>")}

<h2 id="ch11"><span class="ch">11</span>QUICK REFERENCE: EVERY FEATURE</h2>
<p>The full feature set of the 📜 Scripting panel, and where each feature stands: {counts["done"]} done, {counts["check"]} done but not yet seen by Matthew, {counts["branch"]} on a branch, {counts["next"]} not yet built. This table is kept up to date as the work goes on.</p>
<div class="scroll"><table class="feat"><thead><tr><th>area</th><th>feature</th><th>status</th><th>where</th></tr></thead><tbody>{rows}</tbody></table></div>

<h2 id="ch12"><span class="ch">12</span>ABOUT THIS GUIDE</h2>
<p>The pictures and every quoted entry and message come from one run of <code>tools/checks/manual593.mjs</code> (kids-choice-games) on GitHub's computers: branch <code>{esc(RUN.get("branch"))}</code>, the game at <code>{esc(RUN.get("game"))}</code>, run <a href="{esc(RUN.get("url"))}">{esc(RUN.get("id"))}</a>, dark mode, 1440 × 900. The check sets each scene up, breaks the rules on purpose, and takes the picture; nothing was retouched. <code>drivers/build.py</code> draws this page from <a href="data/texts.json">data/texts.json</a> and <a href="data/features.json">data/features.json</a>.</p>
<p>Related: <a href="https://matthewhammer.org/hazel/reports/">Hazel reports</a>, where the scripts' speed and the three-way checks are measured; hazelgrove/hazel <a href="https://github.com/hazelgrove/hazel/pull/2711">#2711</a> (Hazel as a JS library); Adapton/fumola.</p>
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
# on GitHub (tools/checks/manual593.mjs), and drivers/zine.sh lays the pages out on Letter for folding and stapling.
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
PRINT = re.sub(r'<script>\s*\(function \(\) \{.*?</script>', '', PRINT, flags=re.S).replace("<title>Game Scripts Guide</title>", "<title>Game Scripts Guide (print)</title>")
open(os.path.join(R, "print.html"), "w").write(PRINT)
print("wrote 017/index.html:", len(F), "features,", sum(1 for f in os.listdir(os.path.join(R, "pictures")) if f.endswith(".png")), "pictures")
