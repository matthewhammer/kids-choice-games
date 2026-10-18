#!/usr/bin/env python3
"""^du_report(4)'s page, from its data (data/report.json): the chart and the
tables are drawn from the numbers there, so the page and its data agree.
  python3 drivers/build.py   (from 004/)"""
import json, html, os
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(HERE, "data", "report.json"), encoding="utf-8"))
E = html.escape
def ref(n, kind="du_report"):
    if kind == "du_report":
        return f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
    return f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
def run_link(r): return f'<a href="https://github.com/matthewhammer/kids-choice-games/actions/runs/{r}">run {r}</a>'
OLD = D["old_archive"]["runs"]; NEW = D["new_archive"]; N6 = NEW["run_2026_10_18"]
DET = D["determinism"]; HID = D["hidden_drawings"]; PIX = HID["pixels"]["pct"]
PLACES = {p[0]: p for p in HID["places"]}
fmt = lambda x: f"{x:,.1f}" if isinstance(x, float) else f"{x:,}"

# Figure 1: what each run added to git, old against new
rows = [(f'{r["run"]} · {r["version"]}', r["git_old_mib"], r["git_new_mib"]) for r in OLD] + [(f'2026/10/18 · {N6["version"]}', None, N6["git_new_mib"])]
X0, X1, top, bh, gap = 230, 700, 14, 13, 12
scale = (X1 - X0) / 320
h = top + len(rows) * (2 * bh + 2 + gap) + 26
svg = [f'<svg class="chart" viewBox="0 0 760 {h}" role="img" aria-label="What each run added to git, old archive against new">']
for t in (0, 80, 160, 240, 320):
    x = X0 + t * scale
    svg.append(f'<line class="grid" x1="{x:.1f}" y1="6" x2="{x:.1f}" y2="{h-20}"/><text class="tick" x="{x:.1f}" y="{h-6}" text-anchor="middle">{t} MiB</text>')
y = top
for label, a, b in rows:
    svg.append(f'<text class="lab" x="{X0-8}" y="{y+bh+4}" text-anchor="end">{E(label)}</text>')
    if a is not None:
        svg.append(f'<rect class="b0" x="{X0}" y="{y}" width="{a*scale:.1f}" height="{bh}" rx="2"/><text class="val1" x="{X0+a*scale+5:.1f}" y="{y+bh-2}">{a:.1f} (folder per run, PNGs)</text>')
    else:
        svg.append(f'<text class="tick" x="{X0+4}" y="{y+bh-2}">(made after the move)</text>')
    yb = y + bh + 2
    svg.append(f'<rect class="b2" x="{X0}" y="{yb}" width="{max(b*scale,1.5):.1f}" height="{bh}" rx="2"/><text class="val1" x="{X0+b*scale+5:.1f}" y="{yb+bh-2}">{b:.1f} (one folder, no PNG)</text>')
    y += 2 * bh + 2 + gap
svg.append("</svg>")
FIG1 = "".join(svg)

def runs_table():
    out = ['<div class="scroll"><table><tr><th>run</th><th>game</th><th>drawings</th><th>PNGs, the whole run</th><th>PNGs stored (not links)</th><th>SVGs</th><th>settings JSON</th><th>WebP thumbnails</th><th>added to git</th></tr>']
    for r in OLD:
        out.append(f'<tr><td>{r["run"]}</td><td>{r["version"]}</td><td class="n">{r["pictures"]}</td><td class="n">{r["png_mb"]} MB</td><td class="n">{r["png_stored_mb"]} MB ({r["png_stored"]})</td><td class="n">{r["svg_mb"]} MB</td><td class="n">{r["json_mb"]} MB</td><td class="n">{r["webp_mb"]} MB</td><td class="n">{r["git_old_mib"]} MiB → {r["git_new_mib"]} MiB</td></tr>')
    out.append(f'<tr><td>2026/10/18</td><td>{N6["version"]}</td><td class="n">{N6["drawings"]}</td><td class="n good">none</td><td class="n good">none</td><td class="n">{N6["svg_mb"]} MB</td><td class="n">{N6["json_mb"]} MB</td><td class="n">{N6["webp_mb"]} MB</td><td class="n">{N6["git_new_mib"]} MiB</td></tr>')
    out.append("</table></div>")
    return "".join(out)

def places_table():
    keep = ["waterfall", "clearing", "treehouse", "castle", "cemetery", "fairyforest", "forest", "house", "lake"]
    out = ['<div class="scroll"><table><tr><th>place (with the friend)</th><th>SVG, 0.0.197 → 0.0.201</th><th>shapes drawn</th><th>animations</th><th>pixels that differ</th></tr>']
    for k in keep:
        p = PLACES[k]
        pct = PIX.get(k)
        out.append(f'<tr><td>{k}</td><td class="n">{p[1]/1000:.0f} → {p[5]/1000:.0f} KB ({100*(p[5]-p[1])/p[1]:+.0f}%)</td><td class="n">{p[3]:,} → {p[7]:,}</td><td class="n">{p[4]} → {p[8]}</td><td class="n">{f"{pct[0]:.2f}%" if pct else "–"}</td></tr>')
    tb = sum(p[1] for p in HID["places"]); ta = sum(p[5] for p in HID["places"])
    td = sum(p[3] for p in HID["places"]); tda = sum(p[7] for p in HID["places"])
    out.append(f'<tr><td><b>all {len(HID["places"])} places</b></td><td class="n"><b>{tb/1e6:.2f} → {ta/1e6:.2f} MB ({100*(ta-tb)/tb:+.1f}%)</b></td><td class="n"><b>{td:,} → {tda:,}</b></td><td class="n">{sum(p[4] for p in HID["places"])} → {sum(p[8] for p in HID["places"])}</td><td></td></tr></table></div>')
    return "".join(out)

def pair(k, alt):
    p = PLACES[k]; pct = PIX[k]
    return (f'<figure class="pair" data-before="pictures/{k}-0.0.197.svg" data-after="pictures/{k}-0.0.201.svg">'
            f'<div class="three"><div><img src="pictures/{k}-0.0.197.svg" alt="{E(alt)}, 0.0.197" loading="lazy"><span>0.0.197 · {p[1]/1000:.0f} KB · {p[3]:,} shapes</span></div>'
            f'<div><img src="pictures/{k}-0.0.201.svg" alt="{E(alt)}, 0.0.201" loading="lazy"><span>0.0.201 · {p[5]/1000:.0f} KB · {p[7]:,} shapes</span></div>'
            f'<div><canvas width="480" height="356" aria-label="Where the two differ"></canvas><span>where they differ, still: {pct[0]:.2f}% of pixels</span></div></div>'
            f'<figcaption><b>{E(alt)}</b></figcaption></figure>')

DR = DET["random_seeded"]
if DR["result"] == "PENDING":
    det_text = "Run again with the seeded random: not back yet when this draft was written."
else:
    det_text = DR["result"]

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>try {{ var t = localStorage.getItem("theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); }} catch (e) {{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>One Folder, Every Run</title>
<style>
  :root {{ --bg: #fbfaf7; --paper: #ffffff; --ink: #1f2328; --muted: #5b6470; --line: #e3e0d8; --accent: #6d28d9; --soft: #cbbcf0; --alt: #0f8b7d; --good: #15803d; --bad: #b91c1c; --link: #1d4ed8; }}
  @media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg: #15171a; --paper: #1d2024; --ink: #e8e6e3; --muted: #a2a9b3; --line: #33373d; --accent: #c4b5fd; --soft: #5b4a8a; --alt: #2dd4bf; --good: #4ade80; --bad: #f87171; --link: #93c5fd; }} }}
  :root[data-theme="dark"] {{ --bg: #15171a; --paper: #1d2024; --ink: #e8e6e3; --muted: #a2a9b3; --line: #33373d; --accent: #c4b5fd; --soft: #5b4a8a; --alt: #2dd4bf; --good: #4ade80; --bad: #f87171; --link: #93c5fd; }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 system-ui, "Segoe UI", Roboto, sans-serif; }}
  main {{ max-width: 980px; margin: 0 auto; padding: 32px 16px 80px; }}
  h1 {{ font-size: 2em; line-height: 1.2; margin: 0 0 6px; }}
  h2 {{ font-size: 1.35em; margin: 48px 0 10px; padding-top: 8px; border-top: 2px solid var(--line); }}
  h3 {{ font-size: 1.08em; margin: 24px 0 6px; }}
  p, li {{ max-width: 72ch; }}
  .series {{ color: var(--muted); margin: 0 0 6px; font-size: 0.92em; }}
  .sub {{ color: var(--muted); margin: 0 0 24px; }}
  .headline {{ background: var(--paper); border-left: 4px solid var(--accent); padding: 10px 14px; border-radius: 6px; }}
  .headline ol > li {{ margin: 8px 0; }}
  a {{ color: var(--link); text-underline-offset: 2px; }}
  a.ref code, code {{ font-size: 0.9em; }}
  code {{ background: color-mix(in srgb, var(--line) 50%, transparent); padding: 0 4px; border-radius: 4px; }}
  .kpis {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin: 18px 0; }}
  .kpi {{ background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }}
  .kpi .v {{ font-size: 1.7em; font-weight: 700; }} .kpi .l {{ color: var(--muted); font-size: 0.9em; }}
  .good {{ color: var(--good); }} .bad {{ color: var(--bad); }}
  figure {{ margin: 18px 0; }} figcaption {{ color: var(--muted); font-size: 0.9em; margin-top: 6px; max-width: 72ch; }}
  svg.chart {{ width: 100%; height: auto; background: var(--paper); border: 1px solid var(--line); border-radius: 10px; }}
  svg.chart .grid {{ stroke: var(--line); }} svg.chart .tick {{ fill: var(--muted); font-size: 11px; }}
  svg.chart .lab {{ fill: var(--ink); font-size: 12px; }} svg.chart .val1 {{ fill: var(--ink); font-size: 11px; font-weight: 600; }}
  svg.chart .b0 {{ fill: var(--soft); }} svg.chart .b2 {{ fill: var(--alt); }}
  table {{ border-collapse: collapse; width: 100%; font-size: 0.92em; }}
  th, td {{ text-align: left; padding: 7px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }}
  th {{ color: var(--muted); font-weight: 600; }} td.n {{ font-variant-numeric: tabular-nums; white-space: nowrap; }}
  .scroll {{ overflow-x: auto; }}
  .note {{ color: var(--muted); font-size: 0.9em; }}
  ol.steps {{ list-style: none; padding-left: 0; }} ol.steps li {{ margin: 12px 0; border-left: 3px solid var(--line); padding-left: 12px; }}
  .stepnum a {{ font-weight: 700; text-decoration: none; }}
  button.tk, button.theme {{ font: inherit; font-size: 0.8em; border: 1px solid var(--line); background: var(--paper); color: var(--muted); border-radius: 8px; padding: 1px 8px; cursor: pointer; }}
  button.theme {{ position: fixed; top: 10px; right: 10px; }}
  .pair {{ background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: 8px; }}
  .three {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; }}
  .three img, .three canvas {{ width: 100%; height: auto; display: block; border-radius: 8px; background: #fff; }}
  .three span {{ display: block; color: var(--muted); font-size: 0.82em; margin-top: 3px; }}
</style>
</head>
<body>
<button class="theme" id="theme" title="Light or dark">◐ Auto</button>
<main>
<p class="series"><a href="../">Dress Up reports</a> · {ref(4)} · 2026-10-18 · about <a href="https://matthewhammer.org/kids-choice-games/dress-up/">Messed Up Dress Up</a>, a game made with M and N · after {ref(3)}</p>
<h1>One folder, every run</h1>
<p class="sub">How can the game's picture archive keep a year or more of runs in one repository, and what did moving it show about the pictures themselves? The archive passed GitHub Pages' 1 GB after five runs; on 2026-10-18 it was moved to a new layout ({ref(272, "ticket")}). Measured that day, on the archives' own files and on GitHub's computers.</p>

<div class="headline" id="answers">
<p><b>Short answers.</b> Sizes are the archives' files, MB of 10<sup>6</sup> bytes; git's sizes are MiB. Each run is one run of the archive (<a href="#method">below</a>).</p>
<ol>
<li><b>The PNGs were most of it, and now there are none.</b> A run's PNGs (every picture 1920 wide) came to {OLD[0]["png_mb"]} to {OLD[-1]["png_mb"]} MB, {OLD[3]["png_stored_mb"]} to {OLD[-1]["png_stored_mb"]} MB of it new after the links to earlier runs. No PNG is kept now: a PNG is drawn from the SVG when someone asks for one, in their own browser.</li>
<li><b>One folder, rewritten by every run, and every run a git tag.</b> Git stores a file once however many runs share it, and a file that changes a little as a small difference. The same five runs take {NEW["replayed_five_runs_packed_mib"]} MiB this way, against 768 MiB on GitHub before; with today's sixth, {NEW["six_runs_packed_mib"]} MiB. A run added {min(r["git_old_mib"] for r in OLD)} to {max(r["git_old_mib"] for r in OLD)} MiB to git before, and {min(r["git_new_mib"] for r in OLD)} to {max(r["git_new_mib"] for r in OLD)} MiB now. The site holds only the newest run: {NEW["site_mb"]} MB, against 1.3 GB.</li>
<li><b>The thumbnails are the same size,</b> {D["thumbnails"]["before"]["mb"]} MB for 530 before and {D["thumbnails"]["now"]["mb"]} MB for 530 now, drawn by Chrome from the SVG instead of by ffmpeg from the PNG. Every one changed once, today, with the encoder: about 7 of today's {N6["git_new_mib"]} MiB.</li>
<li><b>The settings file did not decide its drawing.</b> Four things outside it changed every run, so the archive kept "changes" that were not changes: the settings file's own saved time (no settings file was ever the same as the run before's: 367 of 367 stored again on 10/17), animation phases read from the page's clocks, random choices (a figure's clip-path id), and bubble space's bubbles, a simulation that moves every frame. The archive holds the clocks and the random still now, and two runs of one game commit come out the same but for bubble space, a simulation whose bubbles move every frame. {ref(274, "ticket")} would put what decides a drawing in the file, and {ref(275, "ticket")} would mark the rest as extra.</li>
<li><b>0.0.198's hidden drawings, left out, look the same.</b> The waterfall's SVG went from {PLACES["waterfall"][1]/1000:.0f} to {PLACES["waterfall"][5]/1000:.0f} KB and from {PLACES["waterfall"][3]} to {PLACES["waterfall"][7]} shapes, with the same {PLACES["waterfall"][8]} animations; {PIX["waterfall"][0]:.2f}% of its pixels differ. In the eight places compared, 0.05% to 1.48% differ.</li>
</ol>
</div>

<div class="kpis">
<div class="kpi"><div class="v good">{OLD[-1]["png_mb"]:.0f} → 0 MB</div><div class="l">PNGs in a run (530 pictures, 0.0.197 → 0.0.201)</div></div>
<div class="kpi"><div class="v good">768 → {NEW["replayed_five_runs_packed_mib"]:.0f} MiB</div><div class="l">the same five runs in git (GitHub's size before; packed now)</div></div>
<div class="kpi"><div class="v">{D["thumbnails"]["before"]["mb"]} → {D["thumbnails"]["now"]["mb"]} MB</div><div class="l">thumbnails for 530 pictures (ffmpeg → Chrome)</div></div>
<div class="kpi"><div class="v good">{PLACES["waterfall"][1]/1000:.0f} → {PLACES["waterfall"][5]/1000:.0f} KB</div><div class="l">the waterfall's SVG, 0.0.197 → 0.0.201; {PIX["waterfall"][0]:.2f}% of pixels differ</div></div>
</div>

<h2 id="places">The places that lost their hidden drawings</h2>
<p>Released in 0.0.198 (2026-10-17): in each place, a tree, pine, leaf pad, bush's pad or flower more than 75% hidden behind what is drawn in front of it is left out. Each pair below is the game's own drawing at 0.0.197 and at 0.0.201, from the two runs of the archive either side, moving; the third picture is drawn here, by your browser, from the two: each still, with the pixels that differ in magenta over a faded copy.</p>
{pair("waterfall", "💦 The waterfall: its far jungle")}
{pair("clearing", "🌳 The clearing")}
{pair("treehouse", "🌳 The tree house: its leaves and its flowers behind the trunk")}
<p>Where the magenta falls: on the edges of what was left out, which could show by up to a quarter (the far jungle beside the waterfall's cliff, the far rows of trees in the clearing, the tree house's leaves and the flowers at its foot), and on the ripples round the friend in the water, which move. The rest of each picture is the same, in 10% (the tree house) to 37% (the waterfall) fewer bytes.</p>
{places_table()}
<p class="note">Shapes drawn: the SVG's path, polygon, polyline, ellipse, circle, rect, line, use, text and image elements. The release notes count 675 fewer drawn across the places at their defaults; this count is of shapes in the 39 pictures with the friend, so the two differ. Between these two runs the game also changed where the friend arrives (0.0.200) and the music's timing (0.0.199), so a difference can be one of those. Pixels compared by Chrome 152 on Matthew's laptop, each picture still, 960 wide.</p>

<h2 id="sizes">Where the space went</h2>
<figure id="fig-1">{FIG1}
<figcaption>Figure 1. What each run added to git, the old archive (a folder per run, PNGs, unchanged files linked to the run before) against the new (one folder, no PNG). Old: on the laptop, its objects compressed one by one; GitHub, packing them, holds all five in 768 MiB. New: packed. The 2026/10/18 run includes about 7 MiB of thumbnails re-encoded once.</figcaption></figure>
{runs_table()}
<p class="note">"The whole run" counts every file, links followed; "stored" counts only files that were not links to an earlier run. The first 10/15 run (0.0.36) survived only in git: the second (0.0.55) was written over it in the same folder; both are runs in the new archive.</p>

<h2 id="layout">One folder, every run a tag</h2>
<p>The new <a href="https://github.com/matthewhammer/dress-up-pictures">dress-up-pictures</a> keeps one folder, <code>pictures/</code>, replaced whole by each run: each drawing's SVG (animations and all), its settings in the game's save format (the game's 📂 Load opens them) and a 480-wide WebP thumbnail, with the run's manifest and page. Each run is a tag, <code>run-2026-10-18</code>; <code>runs.json</code> lists them. The site serves the newest run; the <a href="https://matthewhammer.org/hazel/dress-up/pictures.html">picture viewer</a> reads an earlier one from its tag, and GitHub shows a tag's files or gives it as a zip. The five runs before the move were replayed into it from the old archive's commits, so its history starts at 2026-10-15.</p>
<p>The old archive is kept as it was, read-only, as <a href="https://github.com/matthewhammer/dress-up-pictures-2026-10-18">dress-up-pictures-2026-10-18</a>, PNGs and all; a link into its folders by day under the old name is sent there. The music archive, <a href="https://github.com/matthewhammer/dress-up-music">dress-up-music</a>, moved the same way: one copy of each tune, <code>music/&lt;tune&gt;.mp3</code>, each run a tag. Its second run (0.0.201) recorded one tune, the 🔥 turtle super-dub step; the other 28 had not changed since 0.0.42 and kept their files, so the run cost only the new tune's 1.5 MB.</p>
<p>Runs are made on GitHub's computers (Chrome 155, headless), as no browser runs on Matthew's laptop since 2026-10-16; the laptop only adds a finished run, with no browser and no ffmpeg. A year of daily runs at today's 2 to 10 MiB a run would come to roughly 0.7 to 2 GB, under GitHub's 5 GB for a repository; the site stays one run's size.</p>

<h2 id="thumbs">The thumbnails</h2>
<p>Before, each thumbnail was made on the laptop from the 1920-wide PNG, scaled to 480 by ffmpeg (WebP, quality 72). Now Chrome draws the SVG 480 wide and encodes it (WebP, quality 0.72), in the same run that draws the pictures, so no PNG is made at all. For the 530 pictures of a run: {D["thumbnails"]["before"]["mb"]} MB before, {D["thumbnails"]["now"]["mb"]} MB now. All 530 differ in their bytes from the run before, once; from now on a thumbnail changes when its drawing does.</p>

<h2 id="json">What the settings file does not decide</h2>
<p>A drawing's settings file is meant to draw it again: Load it in the game at the run's version, and the same picture comes out. Moving the archive showed four things that changed between runs while the settings stayed the same:</p>
<div class="scroll"><table><tr><th>what</th><th>where, in 0.0.201</th><th>what it did to the archive</th></tr>
{"".join(f"<tr><td>{E(x['what'])}</td><td>{E(x['where'])}</td><td>{E(x['effect'])}</td></tr>" for x in D["not_in_the_json"])}
</table></div>
<p>The old archive linked a file to the run before's only when the two were the same, byte for byte. Its counts show what got through: on 10/17, 103 of 367 PNGs were new (a still leaves the animations out), but 265 of 367 SVGs and 367 of 367 settings files.</p>
<p><b>What the archive does now</b> (<code>archive.mjs</code>, {E(DET["clocks_held"]["archive_commit"])} and {E(DET["random_seeded"]["archive_commit"])}): it leaves the saved time out of the settings it keeps (Load ignores it), holds the page's clocks at 0 before each picture, and gives the page a seeded random, started from the same seed before each picture. Two runs of one game commit, at once on GitHub, with the clocks held: {DET["clocks_held"]["svg_differing"]} of {DET["clocks_held"]["of"]} SVGs still differed ({E(DET["clocks_held"]["which"])}), and none of the settings files. {E(det_text)}</p>
<p><b>Two kinds of file, proposed.</b> The game's own save should carry what decides the drawing, a random seed and a time origin for the phases, and for a simulation like bubble space either its state or a rule that draws it from the seed and the time, so that its file alone draws the same SVG every time ({ref(274, "ticket")}). Beside it, a <i>full snapshot</i>: the same file plus extra fields that do not decide the drawing and are there for the person who made the file, the date and time it was saved first among them ({ref(275, "ticket")}). The picture archive keeps the first kind and never stores a new time for an unchanged picture. Marked as extra in the format itself, the extra fields can be dropped by a tool that does not know their names. One more to look at: Load keeps the player's music volume and mute, not the file's.</p>

<h2 id="wrong">What we got wrong on the way</h2>
<ul>
<li><b>We read the old links as "unchanged".</b> They only ever caught byte-equal files, and a settings file could never be one: its saved time saw to that.</li>
<li><b>We first called 387 of 408 changed SVGs noise</b>, in a commit message, from a check that only knew CSS delays: it had found 21. The message was corrected within minutes; samples of the rest showed SMIL begins changed too, beside real changes.</li>
<li><b>The workflow's first push went without the workflow:</b> a shell chain meant to stop at its first failure (<code>set -e</code>, inline) did not, and pushed the rest. Fixed at once; the one test run it started was cancelled.</li>
<li><b>Matthew's laptop crashed</b> 30 seconds into this work, at a load of 0.16, during a two-second read of the archive: nothing was lost, and the work since ran one light step at a time.</li>
</ul>

<h2 id="next">What next</h2>
<ol class="steps">
<li id="step-1"><span class="stepnum"><a href="#step-1">1.</a></span> <b>A save file that fully draws its picture:</b> a random seed and a time origin in the file, read by the drawing instead of Math.random and the page's clocks, and bubble space's bubbles drawn from them (or kept in the file); then the archive's own stilling can go. Until then, the archive could hold the frames' time still too, for bubble space. Now {ref(274, "ticket")}. <button class="tk" data-step="1">copy for a ticket</button></li>
<li id="step-2"><span class="stepnum"><a href="#step-2">2.</a></span> <b>The full snapshot,</b> with its extra fields marked as such (the saved time first), and the picture file without them. Now {ref(275, "ticket")}. <button class="tk" data-step="2">copy for a ticket</button></li>
<li id="step-3"><span class="stepnum"><a href="#step-3">3.</a></span> <b>Runs without the laptop:</b> the workflow commits and tags its run itself, with a token that can write to the two archives (Matthew's to make); the laptop's step (a 140 MB download, <code>add_run.sh</code>) goes away. Now {ref(276, "ticket")}. <button class="tk" data-step="3">copy for a ticket</button></li>
<li id="step-4"><span class="stepnum"><a href="#step-4">4.</a></span> <b>Watch the size:</b> each run's entry in <code>runs.json</code> says what it added to git, and the front page a running total, so the archive's growth is read, not guessed. Now {ref(277, "ticket")}. <button class="tk" data-step="4">copy for a ticket</button></li>
</ol>

<h2 id="method">How this was put together</h2>
<p><b>Sizes.</b> The old archive's files from its last commit (<code>1d43134</code>) and, for the first 10/15 run, from git (<code>81c6e6c</code>, <code>git ls-tree -l</code>); "stored" leaves out symlinks. What a run added to git: <code>git rev-list --objects --disk-usage</code> between run commits, on the laptop (loose objects) for the old archive, packed (<code>git repack -ad</code>) for the new; GitHub's size from its API. The new archive's runs 1 to 5 are the old ones replayed (<code>tools/replay_dated_runs.mjs</code>); run 6 is {run_link(N6["github_run"])}, the game at <code>{N6["game_commit"]}</code> (0.0.201).</p>
<p><b>Shapes and pixels.</b> Shapes are counted in each SVG by element name. Pixels: each pair drawn still (its animate elements and CSS animations taken out), 960 wide on white, by Chrome 152 in the desktop app on Matthew's laptop, both files from the published archives; a pixel differs when a channel differs by more than 16 of 255 (and, in the data, 48). The difference pictures on this page are drawn again by the reader's browser, the same way, 480 wide.</p>
<p><b>Runs alike.</b> Two runs of one game commit at once on GitHub ({run_link(DET["clocks_held"]["runs"][0])}, {run_link(DET["clocks_held"]["runs"][1])}), then both run again with the seeded random; each run's files downloaded and compared one by one. (Each run also prints a fingerprint of all its files of a kind, but that takes in its manifest and source.json, which carry the run's own time, so it never matches.)</p>
<p><b>The data</b> is here twice: embedded in this page (<code>&lt;script type="application/json" id="report-data"&gt;</code>) and as files in <a href="data/">004/data/</a>: <code>report.json</code> (every number here), with the measurements behind it. The page is built from it by <a href="drivers/build.py">004/drivers/build.py</a>. The pictures are the archives' (<a href="https://matthewhammer.org/dress-up-pictures-2026-10-18/">2026/10/17/22-28</a> and <a href="https://matthewhammer.org/dress-up-pictures/">2026/10/18</a>), copied into <a href="pictures/">004/pictures/</a>.</p>
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
    const msg = `Mint a ticket for this step: Dress Up reports, ^du_report(4), What next, step ${{n}}: "${{text.textContent.trim()}}". ${{location.href.split("#")[0]}}#step-${{n}}`;
    navigator.clipboard.writeText(msg).then(() => {{ t.textContent = "copied"; setTimeout(() => t.textContent = "copy for a ticket", 1500); }});
  }};
  // (each pair's third picture: both drawings still, the pixels that differ in magenta over a faded copy of the newer)
  const still = async (url, W) => {{
    const s = new DOMParser().parseFromString(await (await fetch(url)).text(), "image/svg+xml").documentElement;
    for (const x of s.querySelectorAll("animate,animateTransform,animateMotion,set")) x.remove();
    for (const x of s.querySelectorAll("[style*=animation]")) x.setAttribute("style", x.getAttribute("style").replace(/animation:[^;]*;?/g, ""));
    const vb = s.viewBox.baseVal, H = Math.round(W * vb.height / vb.width); s.setAttribute("width", W); s.setAttribute("height", H);
    const img = new Image(); img.src = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(s)], {{ type: "image/svg+xml" }})); await img.decode();
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, W, H); g.drawImage(img, 0, 0); return g.getImageData(0, 0, W, H);
  }};
  const io = new IntersectionObserver(es => es.forEach(async e => {{
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const f = e.target, cv = f.querySelector("canvas");
    try {{
      const a = await still(f.dataset.before, 480), b = await still(f.dataset.after, 480);
      cv.width = b.width; cv.height = b.height; const out = cv.getContext("2d").createImageData(b.width, b.height);
      for (let i = 0; i < b.data.length; i += 4) {{
        const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2])) > 16;
        out.data[i] = d ? 230 : 255 - (255 - b.data[i]) * 0.3; out.data[i + 1] = d ? 0 : 255 - (255 - b.data[i + 1]) * 0.3; out.data[i + 2] = d ? 160 : 255 - (255 - b.data[i + 2]) * 0.3; out.data[i + 3] = 255;
      }}
      cv.getContext("2d").putImageData(out, 0, 0);
    }} catch (err) {{ cv.replaceWith(Object.assign(document.createElement("span"), {{ textContent: "(the difference could not be drawn here)" }})); }}
  }}), {{ rootMargin: "200px" }});
  document.querySelectorAll("figure.pair").forEach(f => io.observe(f));
}})();
</script>
</body>
</html>
'''
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(page)
print("wrote", os.path.join(HERE, "index.html"), len(page), "bytes")
