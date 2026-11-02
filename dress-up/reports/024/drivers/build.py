#!/usr/bin/env python3
"""^du_report(24): what is new since ^du_report(23), another young player's guide in its style (^ticket(661)).

Reads data/texts.json and data/run.json (what drivers/shots024.mjs recorded on GitHub's computers, run on a diag branch) and the
pictures in pictures/ from the same run. Writes index.html and print.html (for the zine).
  python3 dress-up/reports/024/drivers/build.py
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
ref = lambda n: f'<a class="ref" href="https://matthewhammer.org/hazel/dashboard/#ticket-{n}"><code><b>^ticket(</b>{n}<b>)</b></code></a>'
du = lambda n: f'<a class="ref" href="../{n:03d}/"><code><b>^du_report(</b>{n}<b>)</b></code></a>'
v = lambda s: f'<span class="ver">{s}</span>'

VER = RUN.get("version", "")
TITLE = "Night, Day and the Garden in Messed Up Dress Up"

BODY = f"""<p class="series"><a href="../">Dress Up reports</a> · <a class="ref" href="../024/"><code><b>^du_report(</b>24<b>)</b></code></a> · 2026-11-01 · <span class="wip">work in progress</span> · about <a href="https://matthewhammer.org/kids-choice-games/dress-up/">Messed Up Dress Up</a></p>
<div class="cover">
  <div class="pub">KIDS' CHOICE GAMES PRESENTS</div>
  <h1>NIGHT, DAY<br>AND THE GARDEN</h1>
  <div class="edition">a young player's guide to what is new since {du(23)} · the sword, night and day, plants that grow back, the garden, its plants and the watering can, and the spring{(" · version " + esc(VER)) if VER else ""}</div>
  {pic("01-garden.png", "The new 🌻 garden: beds of soil to plant in, bees, an apple tree, and the shed.", "half")}
</div>
<p class="series">Matthew, 2026-11-01, trying the garden with M: “a new du_report in the style of du_report 23, now explaining all new features between that report and the current release”. {du(23)} showed the 🎒 backpack, chests, pots, tools and the dungeon, up to version 0.0.464. This guide is everything since, up to 0.0.473.</p>

<div class="toc">
<a href="#ch1">1 · WHAT'S NEW</a><br>
<a href="#ch2">2 · A SWORD THAT CUTS</a><br>
<a href="#ch3">3 · WHAT IS CUT STAYS CUT</a><br>
<a href="#ch4">4 · NIGHT AND DAY 🌗</a><br>
<a href="#ch5">5 · TIME FOR BED 🛌</a><br>
<a href="#ch6">6 · PLANTS GROW BACK 🌱</a><br>
<a href="#ch7">7 · THE GARDEN 🌻</a><br>
<a href="#ch8">8 · THE SPRING 💧</a><br>
<a href="#ch9">9 · PLANT A GARDEN 🌷</a><br>
<a href="#ch10">10 · THE WATERING CAN 💧</a><br>
<a href="#ch11">11 · FIXED</a><br>
<a href="#ch12">12 · MAKE UP A STORY</a><br>
<a href="#ch13">13 · THE QUICK CARD</a><br>
<a href="#about">ABOUT THIS GUIDE</a><br>
</div>

<h2 id="ch1"><span class="ch">1</span>WHAT'S NEW</h2>
<p>Since the last guide, Messed Up Dress Up has grown. Most of it was <b>M's idea</b>:</p>
<div class="scroll"><table class="feat"><thead><tr><th>version</th><th>what is new</th><th>chapter</th></tr></thead><tbody>
<tr><td>0.0.465</td><td>🗡️ A sword that <b>cuts plants</b>. <i>Chop!</i></td><td><a href="#ch2">2</a>, <a href="#ch3">3</a></td></tr>
<tr><td>0.0.466</td><td>🌗 <b>Night and day</b>, and 🛌 <b>sleeping</b> in a bed</td><td><a href="#ch4">4</a>, <a href="#ch5">5</a></td></tr>
<tr><td>0.0.470</td><td>🌱 Cut plants <b>grow back</b></td><td><a href="#ch6">6</a></td></tr>
<tr><td>0.0.471</td><td>Two new places: the 🌻 <b>garden</b> and the 💧 <b>spring</b></td><td><a href="#ch7">7</a>, <a href="#ch8">8</a></td></tr>
<tr><td>0.0.472</td><td>🌷 <b>Flowers</b> and 🥕 <b>vegetables</b> to plant in the garden</td><td><a href="#ch9">9</a></td></tr>
<tr><td>0.0.473</td><td>A 💧 <b>watering can</b>, so the plants grow</td><td><a href="#ch10">10</a></td></tr>
<tr><td>0.0.467 to 0.0.469</td><td>Things that were broken, now fixed</td><td><a href="#ch11">11</a></td></tr>
</tbody></table></div>
<p>The version number is under the game's name, at the top of the controls. If yours is older, reload the page.</p>

<h2 id="ch2"><span class="ch">2</span>A SWORD THAT CUTS</h2>
<p>A sword can cut down plants. First, your friend needs a sword in their hand. There are three ways:</p>
<ul>
<li>Dress up as a <b>knight</b> or as the <b>Time Wanderer</b> in <span class="key">🐯 Costume</span>. They have their own sword.</li>
<li>Find the 🗡️ sword in the castle's <b>smithy</b>, pick it up, then press <span class="key">✋ hold it</span> on its card in the <span class="key">🎒 Backpack</span> tab.</li>
<li>In <span class="key">🧍 Body</span>, tap <b>🫱 right hand holds</b> (or 🫲 left) and choose <span class="key">🗡️ sword</span>.</li>
</ul>
{pic("02-sword-held.png", "A sword in hand, facing a bush in the garden.", "half")}
<p>Now walk up to a plant, <b>face it</b>, and swing: press <span class="key">U</span> on a keyboard, or the controller's 🥅 button (the one that swings the bug net).</p>
{pic("03-chop.png", "Chop! The sword swings, and the bush goes in a puff of leaves.", "half")}
<p>The nearest plant in front of your friend goes in a <b>puff of leaves</b>. One plant each swing. A sword cuts trees, bushes, vines, cactuses, clumps of flowers and mushrooms.</p>
{pic("04-cut.png", "The bush is gone. Now there is room to walk where it stood.", "half")}
{box("tip", "GOOD TO KNOW", "<p>Rows of flowers and grass that go all the way across a place are not cut. They are there to walk through.</p>")}

<h2 id="ch3"><span class="ch">3</span>WHAT IS CUT STAYS CUT</h2>
<p>A plant you cut is gone, and it is not in your way any more. In the 🌍 world, every square remembers its own cut plants: cut a tree in one forest, and the forest next door still has all of its trees.</p>
<p><b>Want one back right now?</b> Open <span class="key">🏞️ Background</span> and look at <b>👁️ default background objects</b>: everything the place draws itself, a chip each. A cut plant's chip shows 🙈. Tap it, and the plant grows back.</p>
{pic("05-grow-by-hand.png", "👁️ default background objects in the forest clearing: a tree that was cut (tree, left, inner) shows 🙈. Tap it to bring it back.")}
<p>Plants can also grow back by themselves. See <a href="#ch6">chapter 6</a>.</p>

<h2 id="ch4"><span class="ch">4</span>NIGHT AND DAY 🌗</h2>
<p>Now the game can have <b>time</b>. It is off to start. To turn it on:</p>
<ol class="steps">
<li>Open the <span class="key">⚙️ Advanced</span> tab.</li>
<li>Press <span class="key">🌗 night and day: night falls, and you sleep in a bed till morning</span>.</li>
</ol>
{pic("06-days-on.png", "🌗 night and day, on, in ⚙️ Advanced. ⏱️ a whole day takes 12 minutes, and 🛌 counts the nights slept.")}
<p>Now the hour shows at the top of the picture: ☀️ in the daytime, 🌙 at night. A whole day takes 12 minutes to start. Change it with ⏱️.</p>
{pic("07-noon.png", "Noon in the forest clearing: ☀️ 12:00 pm at the top.")}
<p>After sunset, every place grows <b>dark</b> (less so inside). The game tells you it is bedtime:</p>
<pre class="code">🌙 Night is falling. Find somewhere to sleep: a bed, a bunk, a sleeping bag or a blanket.</pre>
{pic("08-nightfall.png", "9 at night: dark, the moon at the top, and time to find a bed.")}
<p>Some places have <b>their own night</b>, with the moon and the stars: the jungle waterfall, the cave, the camp site, the tent and the fairy forest.</p>
{pic("09-campsite-night.png", "The camp site at night, under the stars.")}
{box("tip", "GOOD TO KNOW", "<p>The hour and the date come from <b>🌍 where and when</b>, so the sun and the moon are where they really would be.</p>")}

<h2 id="ch5"><span class="ch">5</span>TIME FOR BED 🛌</h2>
<p>When it is dark, find a bed: the bed in the grass hut's bedroom, a bunk, the sleeping bags in a tent, or a blanket. <b>Tap the bed</b> (or click it), and your friend walks over and lies down.</p>
{pic("10-asleep.png", "Asleep in the grass hut's bed. Everything goes dark...")}
<p>Your friend falls asleep. It goes dark, and then it is <b>7 in the morning</b>, the next day:</p>
<pre class="code">🌅 Good morning! Nights slept: 1.</pre>
{pic("11-morning.png", "Good morning! It is 7 o'clock, and 🛌 counts one night slept.")}
<ul>
<li>🛌 counts the nights you have slept. It shows at the top of the picture, and in <span class="key">⚙️ Advanced</span>.</li>
<li>Lying down in the <b>daytime</b> is only a rest: “It's still daytime. Come back to bed when it's dark.”</li>
<li>Stay up all night if you like. Morning comes anyway!</li>
</ul>

<h2 id="ch6"><span class="ch">6</span>PLANTS GROW BACK 🌱</h2>
<p>This was M's idea too. Plants you cut with the sword <b>come back by themselves</b>. It is on to start. You will find it in <span class="key">⚙️ Advanced</span>, under 🌗 night and day:</p>
{pic("12-regrow-setting.png", "🌱 cut plants grow back, and ⏱️ how long they take.")}
<ul>
<li>A cut plant grows back after <b>2 minutes</b>. Change it with ⏱️, from 1 to 30 minutes.</li>
<li>It comes back with a <b>puff of leaves</b> and a 🌱, even while you are somewhere else.</li>
<li>With 🌗 <b>night and day</b> on, cut plants grow back <b>by the next morning</b> instead. Sleep in a bed, and everything you cut is back!</li>
<li>A bush or a cactus that <i>you</i> put in a place grows back too, right where it was.</li>
</ul>
{pic("13-regrow.png", "Two minutes later: the bush is back, where it was.", "half")}
<p>Don't want them back? Press <span class="key">🌱 cut plants grow back</span> again to turn it off. Then what you cut stays cut.</p>

<h2 id="ch7"><span class="ch">7</span>THE GARDEN 🌻</h2>
<p>A brand new place, made for M's garden. It is one of the 🏠 <b>home</b> places. To go there, open <span class="key">🏞️ Background</span>, choose <span class="key">🏠 home</span>, then <span class="key">🌻 garden</span>:</p>
{pic("14-place-menu.png", "The place menu: 🏠 home, then 🌻 garden.")}
<p>In the garden there is:</p>
<ul>
<li>a white <b>picket fence</b> with an arbor of climbing roses, and snowy Colorado mountains far away;</li>
<li>tall flowers along the fence;</li>
<li>a <b>garden shed</b> with a window box, and a <b>rain barrel</b>;</li>
<li>an <b>apple tree</b>, a <b>bench</b>, and a red <b>wheelbarrow</b>;</li>
<li>🐝 <b>bees</b> (catch one with the bug net: {du(23)} shows how);</li>
<li>beds of dug <b>soil</b>, either side of a path of stepping stones, ready for planting (<a href="#ch9">chapter 9</a> shows what to plant).</li>
</ul>
{pic("15-garden-beds.png", "The garden with all six beds of soil.")}
<p>How many beds? In <span class="key">🏞️ Background</span>, <b>🟫 beds of soil to plant in</b>: from none to six.</p>
{box("tip", "PUT IT IN YOUR WORLD", "<p>In <span class='key'>🗺️ World design</span>, drag <span class='key'>🌻 garden</span> (or <span class='key'>💧 spring</span>) onto a square of the grid. Then you can walk to it from the squares next door.</p>")}
{pic("19-world-places.png", "🗺️ World design: places to put in a square. The garden and the spring are there now.")}

<h2 id="ch8"><span class="ch">8</span>THE SPRING 💧</h2>
<p>The other new place is the <b>spring</b>, one of the 💧 water places. It is like the lake, but small, with land all the way round: a little round pool, bubbling up in a meadow, with woods behind it.</p>
{pic("16-spring.png", "The spring: mossy stones round the pool, reeds, frogs, a rock and a fallen log.")}
<p>Walk right into it! Your friend wades in the water.</p>
{pic("17-wading.png", "Wading in the spring.", "half")}
<p>Look closely: there are <b>frogs</b> on the stones and lily pads, puffing their throats in and out, and bubbles coming up in the middle, where the water wells up from under the ground.</p>
{pic("18-frogs.png", "The spring's frogs, and its bubbles.")}
<p>To go there, open <span class="key">🏞️ Background</span> and choose <span class="key">💧 water</span>, then <span class="key">💧 spring</span>. Its settings are there too: <b>🐸 frogs</b> (none to three) and <b>🫧 how much it bubbles</b>.</p>
{pic("14-place-menu-water.png", "The 💧 water places, with the spring.")}

<h2 id="ch9"><span class="ch">9</span>PLANT A GARDEN 🌷</h2>
<p>Now the garden has things to plant! Open <span class="key">🏞️ Background</span>, find <b>🪨 things to put here</b>, and tap <span class="key">🌻 garden</span>. There are two:</p>
{pic("20-put-garden.png", "🪨 things to put here, with 🌻 garden chosen: + 🌷 flower bed and + 🥕 vegetable patch.")}
<p>Tap <span class="key">+ 🌷 flower bed</span> or <span class="key">+ 🥕 vegetable patch</span>, or drag one into the picture, right where you want it to grow. Drag it again to move it.</p>
<p>Each one you put gets its own <b>card</b>, below the buttons. On a flower bed's card, choose <b>🌼 which flower</b>. A vegetable patch's card has <b>🥕 which vegetable</b>.</p>
{pic("21-flower-card.png", "A flower bed's card: 🌼 which flower, and 🌱 how grown.", "half")}
<p>There are <b>eight flowers</b>, and they all grow wild in Colorado:</p>
<ul>
<li>💙 Colorado blue columbine (Colorado's own flower)</li>
<li>🖌️ Indian paintbrush</li>
<li>🔔 Rocky Mountain penstemon</li>
<li>🌞 blanket flower</li>
<li>🌻 sunflowers</li>
<li>💜 silvery lupine</li>
<li>🎩 prairie coneflower (it looks like a Mexican hat)</li>
<li>🩵 wild blue flax</li>
</ul>
{pic("22-flower-beds.png", "All eight flowers. At the back: sunflowers, silvery lupine, penstemon and Indian paintbrush. At the front: columbine, blanket flower, prairie coneflower and wild blue flax.")}
<p>And there are <b>eight vegetables</b> that grow in the United States:</p>
<ul>
<li>🍅 tomatoes, in their cage</li>
<li>🌽 corn</li>
<li>🥕 carrots</li>
<li>🎃 pumpkins</li>
<li>🥬 lettuce</li>
<li>🫛 peas, climbing up their stakes</li>
<li>🫑 bell peppers</li>
<li>🥦 broccoli</li>
</ul>
{pic("23-vegetable-patches.png", "All eight vegetables. At the back: corn, tomatoes, peas and bell peppers. At the front: pumpkins, carrots, lettuce and broccoli.")}
<p>Plants grow when you water them (<a href="#ch10">chapter 10</a>). You can also slide <b>🌱 how grown</b> on a plant's card to make it small or big. A plant has four stages:</p>
<ol class="steps">
<li><b>Sprouts</b>, just poking out of the soil.</li>
<li><b>Young</b> plants, green all over.</li>
<li><b>In bud</b>, with the fruit still green.</li>
<li><b>In flower</b>, and the vegetables <b>ripe</b>.</li>
</ol>
{pic("24-how-grown.png", "🌱 how grown, from left to right: sprouts, young, in bud, in flower. Sunflowers at the back, pumpkins at the front.")}
{box("tip", "GOOD TO KNOW", "<p>New plants start as sprouts, ready to water. You can walk right through them, and the 🗡️ sword does not cut them.</p>")}

<h2 id="ch10"><span class="ch">10</span>THE WATERING CAN 💧</h2>
<p>Plants need water to grow, and now there is a <b>watering can</b>! It is <b>🪜 inside the tree house</b>, on the floor in front of the bunk beds. (Been to the tree house before? The can is there the next time you go in.)</p>
{pic("25-can-found.png", "The watering can in the tree house. It glows when your friend is close enough to pick it up.")}
<p>Walk up to it and press <span class="key">Enter</span>, or tap it. It goes in your 🎒 and right into your friend's hand.</p>
{pic("26-can-held.png", "Got it! The can is in your friend's hand.", "half")}
<h3>Fill it up</h3>
<p>The can starts out empty. Walk up to some <b>water</b> and press <span class="key">U</span> (or the controller's 🥅 button). It fills at:</p>
<ul>
<li>the spring, the duck pond, a castle's moat, the tree house's stream, the cemetery's brook, the beach and the sea, and the waterfall's pool;</li>
<li>a well, a rain barrel (the garden has one), a water trough or a fountain.</li>
</ul>
<p>Under the sea, it fills anywhere!</p>
{pic("27-filling.png", "Dipping the can into the spring. Bubbles come up as it fills.", "half")}
<pre class="code">💧 Glug, glug! The can is full of water.</pre>
{pic("28-full.png", "Full! The friend says so at the top of the picture.")}
<p>A full can holds <b>6 pours</b>. Its card in the <span class="key">🎒 Backpack</span> tab shows how many are left.</p>
{pic("29-can-card.png", "The can's card in 🎒 Backpack: 💧💧💧💧💧💧, 6 of 6 pours.", "half")}
<h3>Water your plants</h3>
<p>While your friend holds the can, every plant that is still growing shows a <b>water meter</b> above it: a 💧, and a bar that fills up blue. It holds three 💧.</p>
{pic("30-meters.png", "Four sprouts and their meters: sunflowers and pumpkins with none, columbine with some, carrots with a little.")}
<p>Stand next to a plant, face it, and press <span class="key">U</span>. Or just tap the plant: your friend walks over and waters it. The can tips, drops fall, and one 💧 goes into the plant.</p>
{pic("31-pouring.png", "Pouring! One 💧 for the pumpkins.", "half")}
<h3>Watch them grow</h3>
<ul>
<li>A plant drinks one 💧 every <b>15 seconds</b>. Each 💧 it drinks makes it grow one stage, with a puff and a 🌱.</li>
<li>Three 💧 take a plant from sprouts all the way to flowers, or ripe vegetables. Fill up its meter, and it does the rest!</li>
<li>Plants keep drinking while you are somewhere else, even when the game is closed. Come back later, and they have grown.</li>
<li>Plants never wilt. A plant with no water just waits for more.</li>
</ul>
{pic("32-grown.png", "Later: the sunflowers, pumpkins, columbine and carrots, all grown. Grown plants need no more water, so their meters are gone.")}
{box("tip", "GOOD TO KNOW", "<p>When nothing happens, your friend says why: “The can is empty!” (fill it at water), “It has all the water it can drink” (wait a little), or “This one is all grown!”</p>")}

<h2 id="ch11"><span class="ch">11</span>FIXED</h2>
<p>Some things were broken. Now they work:</p>
<ul>
<li><b>One dungeon.</b> The game was making a new 🗝️ dungeon every time the page loaded, with more and more holes down to it in the cemetery and the castle. Now a game keeps just one. {v("0.0.468")}</li>
<li><b>Every room has its things.</b> After you went into one room with things to find, the other rooms were empty. Now every room has its own things the first time you go in, so the bug-catching puzzle works whichever room you visit first. {v("0.0.468")}</li>
<li><b>📜 Scripting's Hazel tiles load again.</b> They were stuck at “loading”. {v("0.0.467")}</li>
<li><b>Places look the same every time.</b> The witch's room, with its glowing mushroom, was sometimes drawn a tiny bit differently. {v("0.0.469")}</li>
</ul>

<h2 id="ch12"><span class="ch">12</span>MAKE UP A STORY</h2>
<p>Some ideas:</p>
<ul>
<li>A knight cuts a path through the forest... and by morning the forest has grown back!</li>
<li>Stay up late at the camp site, look at the stars, then sleep in the tent.</li>
<li>Count how many nights your friend can sleep. Can you get to ten?</li>
<li>The frogs of the spring are having a party. Who is invited?</li>
<li>Catch a bee in the garden, then let it go again by the flowers.</li>
<li>Plant a vegetable garden. What will you cook when everything is ripe?</li>
<li>Fill the can at the spring, then water the whole garden. How many trips does it take?</li>
</ul>

<h2 id="ch13"><span class="ch">13</span>THE QUICK CARD</h2>
<div class="card">
<p><b>Hold a sword:</b> 🎒 its card, <span class="key">✋ hold it</span></p>
<p><b>Cut a plant:</b> face it, <span class="key">U</span>, or 🥅</p>
<p><b>Grow one back now:</b> 🏞️, 👁️, tap its 🙈</p>
<p><b>Night and day:</b> ⚙️, <span class="key">🌗 night and day</span></p>
<p><b>How long a day is:</b> ⚙️, ⏱️</p>
<p><b>Sleep:</b> at night, tap a bed</p>
<p><b>Plants grow back:</b> ⚙️, <span class="key">🌱 cut plants grow back</span></p>
<p><b>Go to the garden:</b> 🏞️, <span class="key">🌻 garden</span></p>
<p><b>Go to the spring:</b> 🏞️, <span class="key">💧 spring</span></p>
<p><b>Plant flowers or vegetables:</b> 🏞️, 🪨, <span class="key">🌻 garden</span></p>
<p><b>Get the watering can:</b> 🪜 inside the tree house, walk to it, <span class="key">Enter</span></p>
<p><b>Fill the can:</b> next to water, <span class="key">U</span></p>
<p><b>Water a plant:</b> next to it, <span class="key">U</span>, or tap it</p>
<p><b>Grow a plant by hand:</b> its card, 🌱 how grown</p>
<p><b>Put a place in your world:</b> 🗺️, drag it onto the grid</p>
</div>

<h2 id="about"><span class="ch">✎</span>ABOUT THIS GUIDE</h2>
<p>{("Every picture is of <b>Messed Up Dress Up " + esc(VER) + "</b>, taken by this report's <code>drivers/shots024.mjs</code> on GitHub's computers" + ((', run <a href="' + esc(RUN["url"]) + '">' + esc(RUN["id"]) + '</a>') if RUN.get("url") else "") + ".") if VER else "The pictures are coming: they are taken on GitHub's computers."}</p>
<p>The sword that cuts plants is {ref(656)}, night and day and sleeping {ref(657)}, the Hazel tiles {ref(658)}, plants growing back {ref(659)}, the garden and the spring {ref(660)}, the dungeon and room fixes {ref(639)}, and this guide {ref(661)}. Made for M and N, who tried the garden first.</p>
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
  .ver {{ font: 600 12px/1.4 system-ui, sans-serif; color: var(--muted); border: 1px solid var(--line); border-radius: 6px; padding: 0 5px; white-space: nowrap; }}
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
PRINT = re.sub(r'<script>\s*\(function \(\) \{.*?</script>', '', PRINT, flags=re.S).replace(f"<title>{TITLE}</title>", f"<title>{TITLE} (print)</title>")
open(os.path.join(R, "print.html"), "w").write(PRINT)
# (ticket 595) the 🔊 Listen bar, as every report has it
import subprocess
subprocess.run(["python3", os.path.join(R, "..", "..", "..", "tools", "add_listen.py"), os.path.join(R, "index.html")], check=True)
print("wrote 024/index.html and print.html:", len([f for f in os.listdir(os.path.join(R, "pictures")) if f.endswith(".webp")]), "pictures")
