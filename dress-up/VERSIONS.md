# Messed Up Dress Up: versions

Each version lists the game's features as of that version. The newest version is first.

## 0.0.42 (2026-10-15)

Everything in 0.0.41, plus a door behind you.

- **⬇️ A door behind you:** the bottom edge of a room's picture is a door we can't see, behind the friend, and now it can lead somewhere. In a castle hallway, the trap room and the greenhouse, a new setting, "⬇️ behind you (a door we can't see) leads to", sends it out of the castle or to any room; it leads nowhere until you set it. When it leads somewhere, a sign at the bottom of the picture points down to it, and a click on the sign goes there. The living room and each tree house room have the same setting, leading to any place in the game. (Rooms with a sign at the bottom already, like the king's room, have that sign as their door behind you; a dungeon has none, since a pit has no way in but from above.)
- **The castle designer uses it:** it can put a way back in a room's door behind you when the room has no other free exit. In N's castle, the greenhouse's archway into the trap room was one way with no fix; now "🔧 add a door back" fixes it, and the castle has no problems left.

## 0.0.41 (2026-10-15)

Everything in 0.0.40, plus the spiral staircase, where a hallway's stairs lead.

- **🌀 A spiral staircase, a new castle room:** a round tower room, cut away at the front like a doll's house, its stone wall curving round behind. In the middle a stone column rises, and the steps wind up round it, turn after turn, out of sight. Its doors come out onto the steps at different heights, one higher than the last ("🚪 doors in its walls", up to four, each leading where you say). Arrow slits let in beams of light, torches on the column light the way up, and its way out is a sign toward you. Now "🌀 the first spiral stairs", the hallway's stairs, lead somewhere: up to the castle's first spiral staircase, when it has one.

## 0.0.40 (2026-10-15)

Everything in 0.0.39, plus the castle's kitchen and smithy, and their people.

- **🍲 A kitchen, a new castle room:** a big warm room of stone under oak beams. A great hearth burns in the back wall, with onions, garlic and herbs hung along its mantel. In front of it a cauldron of soup hangs on its tripod over its own little fire, steaming, and a cook in a frilled white cap and a blue dress stirs it. There's a domed bread oven with its mouth aglow and loaves on its sill, shelves of blue-rimmed plates and crocks, and copper pots and pans hanging from a rack on the beam. Sacks of flour and barrels stand by the back wall. In front is a long worktable of bread, cheese, a cabbage and a bowl of apples, where a cook in a tall white hat chops carrots on a board, once a beat. The cooks keep time with the quick LFO, and the steam and the oven's glow with the slow one.
- **⚒️ A smithy, a new castle room,** dark and very rustic: rough stone black with soot under old timbers, lit only by the forge. The forge's coals glow and breathe, with a hood over it up to the chimney and its bellows working. The smith, bearded, in a leather apron, beats a glowing bar on the anvil on its stump, holding it with his tongs, and sparks fly as his hammer lands. There's a quench barrel, steaming, tongs, hammers and horseshoes on the wall, a rack of swords, a shield in the castle's colors, and a heap of coal. His hammer and the sparks keep time with the quick LFO, and the forge's glow and the bellows with the slow one.
- Both rooms have doors in their side walls and a way out toward you, as the king's room does. The cooks and the smith will join the cast of friends to come, with settings of their own.

## 0.0.39 (2026-10-15)

Everything in 0.0.38, plus room in the greenhouse for every way out of it.

- **🌿 The greenhouse has stone walls up its sides, and room for every way out.** With many rooms, its archways crowded together along its back wall, one over another. Now the back wall holds six archways, three either side of its middle. Any more are doors in its side walls, two to a side, set in perspective (as the king's room's are), and those walls are stone now, up to above the doors, with the glass above them. Any more still are signs at the bottom, pointing toward you ("👑 13 ⬇️"). Matthew's idea.

## 0.0.38 (2026-10-15)

Everything in 0.0.37, plus M's dining room.

- **🍽️ A dining room, a new castle room (M's idea, the first of "M's rooms"):** a long hall, seen down its length as the hallway is, its floor of wooden boards. Down its middle runs a long table, set for as many as "🍽️ places at table" says: 4 to 18, one at each end and the rest down its two sides (eight to a side at most). The table grows longer with more places. It has a white cloth with a runner in the room's carpet color, gold at its edges. At each place there's a chair with a cushion, a plate, a gold cup, and a knife and fork. Candles burn down the table in brass sticks, and candelabras of candles hang over it on chains from the vault. Torches line the walls, and at the far end a great fireplace burns. The candle flames and the fire flicker with the quick LFO, and the torches and the fire glow with the slow one. Its doors run down its walls as the hallway's do, and its way out is a sign toward you.

## 0.0.37 (2026-10-15)

Everything in 0.0.36, plus the castle designer, each room's own way out, and castles of up to 13 rooms.

- **🗺️ The castle designer:** in a castle's rooms box, "🗺️ open the castle designer" shows the castle as a map: outside and each room as a box (with its emoji and number), and every way between them as an arrow (🚪 a door, 🪧 a sign, 🏛️ an archway, 🪜 a ladder, 🌀 stairs, 🕳️ a pit, dashed for a pit or a ladder). The room you are in is ringed in purple. Tap a room (on the map, or in the row of rooms under it) to see where its ways lead, or to go there; tap a way to choose where it leads. Doors are two-way to start with ("↔️ two-way doors"): when you choose where a way leads, the room it leads to gets a door back, if it has space for one. Under the map, a list of what looks wrong: a room that can't be reached from outside, a room with no way back out, a way to a room the castle doesn't have, a way with no way back. Each has a button saying how it would put it right (add a door back, lead it somewhere that has a way back, close the door), and "🔧 fix everything" does them all. Matthew's idea. (The map is drawn with Cytoscape.js, loaded the first time the designer opens.)
- **↩️ Each room's own way out:** the king's room's sign toward you, the trap room's archway, a dungeon's ladder and the greenhouse's archway out now lead where you say, room by room ("↩️ its way out leads to": "✨ the usual way", out of the castle, or any room). The usual way: out of the castle only from room 1, up to the trap room from a dungeon, and back to room 1 from any other room. Before, every one of these led out of the castle. A hallway's first door leads out only in room 1 too; elsewhere it leads to room 1.
- **🚪 Castles of up to 13 rooms** ("🚪 how many rooms", 1 to 13).

## 0.0.36 (2026-10-15)

Everything in 0.0.35, plus a hallway whose stairs lead nowhere ends in a wall.

- **🧱 A hallway whose stairs lead nowhere ends in a wall.** When "🌀 the stairs at its end lead to" is "🧱 nowhere", there are no stairs: the corridor ends in a stone wall, its courses meeting the side walls' at the corners, with a torch on it lighting it warmly. Before, the lit archway and its stairs were still there, leading nowhere. Matthew's idea.

## 0.0.35 (2026-10-15)

Everything in 0.0.34, plus the spooky waltz funked five ways; seven LFOs, with every place moving to the music; three new castle rooms (a cat room, a stable and a hallway), with the castle's cats and horses; our imagination, a new place; gems in the cave; D's castle; two color themes per castle; and many drawings fixed, inside the tree house most of all.

- **Fixed: inside the tree house, the wind is outside.** The tree's limbs inside each room had twigs and leaves fluttering in a breeze, and the house sign swung on its ropes, though no wind blows indoors and no leaves grow without sun. Now the limbs that pass through a room are bare and still, and the sign hangs still. Out of each window you see one of the tree's limbs, with branches forking off it and the tree house's own leaf pads on their tips: the limb sways in the wind with E, and its leaves flutter with D. Matthew caught this one.
- **Fixed: the hallway's banners hang from poles.** They hung face-on just off the walls, from nothing; now each hangs from a pole jutting out of the wall, braced back into it, so it faces down the corridor as it is drawn.
- **Fixed: the stable's horseshoes, saddles and bridle lie on their walls.** They were drawn face-on, as if stuck to the picture; now each is laid flat on its side wall in perspective, narrower and slanted as the wall runs toward us.
- **Fixed: the castle's gate, well and hay cart.** The portcullis's bars started below the top of its arch and had nothing across them; now they fill the arch, with bars across too. The well's stones and the hay cart's straws stay on the well and on the heap.
- **Fixed: the deep dungeon's hanging cage, and the greenhouse's monstera leaves.** The cage's bars stuck up past its dome or stopped short of it; now each starts on the dome. The monstera's slits started in the air beside the leaf; now each cuts in from the leaf's own edge.
- **Fixed: the cat room's window seat has three panels side by side,** no longer overlapping.
- **Fixed: the castle road's stones line its edges,** instead of wandering off into the meadow beside it.
- **Fixed: the healer's chimney is stone all the way up.** Its stonework stopped partway, leaving the chimney breast bare above the mantel, and a stone in every other row stuck out past its edge; now the stones run from the ceiling to the mantel, and stay on the breast.
- **Fixed: the castle's stonework stays behind its gate.** The wall's blocks were drawn over everything on it, crossing the gate, the portcullis, the windows, the banners and the torches, and one poked onto a tower. Now they are drawn first, and kept on the wall.
- **Fixed: the house's driveway joints run edge to edge,** instead of out onto the lawn on one side and short of the edge on the other.
- **Fixed: the healer's hut's roof, seen from the clearing.** Its thatch stuck up above the roof and its smoke rose from the air above it; the roof now peaks where the thatch meets, each line of thatch runs from the eaves to the peak, and the smoke comes out of its top.
- **Fixed: the castle rooms' cobwebs hang together.** In each top corner, a web's threads fanned out over the side wall while its rings hung on the back wall; now threads and rings make one web, in the corner.
- **Fixed: the fairy's wings' veins end at the wing's edge.** On the butterfly, dragonfly and leaf wings, veins ran off the wing into the air, or stopped well short of its edge, and two of the butterfly's spots floated beside it. Now every vein reaches the edge and stops there, and the spots sit on the wing.
- **Fixed: the tree house's reading lantern hangs from the roof.** Its cord stopped in mid-air, well below the sloping roof (the same kind of slip M spotted in the fairy forest). Now it runs up to the roof's edge, on a hook.
- **Fixed: the tents' mesh windows lie on their walls.** Each was a flat box with a square grid, as if stuck on the picture. Now its frame and mesh are drawn on the sloping canvas in perspective: threads along the wall run toward the far end as the seams do, threads across it slant as the far wall's edge does, and they close up toward the back. Matthew caught this one.
- **Fixed: the cat room window's leads stay inside its arch.** The window's lead lines ran up past the curve at its top onto the wall; now everything in the window is kept inside its arch.
- **Fixed: the castle rooms' floors stay on the floor.** In the stone rooms (the king's room, the trap room, the dungeons, the hallway, the stable) and the greenhouse, the lines across the floor ran on up the side walls. Now each ends where the floor meets the wall, and the rows close up toward the back, as paving does. The floor's and ceiling's far corners follow the walls' own lines, so no dark wedge shows at the bottom corners. Matthew caught this one.
- **🧙 The spooky waltz, funked, five ways (A to E, all five kept):** the spooky waltz, all of it (the theremin ghosts, the oom-pah-pah, the bell, the music box), quicker (205 beats a minute) and four half steps down, with a funk beat in 4. The beat has kick, snare, hats, a shaker, a cowbell and congas, plus bongos as the bongo breakdown's, with their own solo halfway. Under it all, a pair of wah-wah basses, buzzy and plucky: one low, popping its octaves, and one higher, answering it. Both keep to the waltz's chords, and the bass lines are louder than the waltz's own. The five differ in how the funk's big beats land on the waltz's:
  - A, four to a bar: a whole funk bar in each waltz bar;
  - B, half-time over two bars: the kick on one waltz bar's downbeat, the snare on the next's;
  - C, the waltz in 4: the waltz itself re-set in four;
  - D, the kick with the waltz: the snare and hats in 4 over it;
  - E, a shuffle over two bars: in the waltz's own triplets.
- **〰️ Seven LFOs, and every scene moves with the music.** The mixing board has four more LFOs: D, a quick one (once a beat to start with); E, a slow one (once in four bars); and F and G, for wings (F a wingbeat that looks like one, a quarter of a beat; G so fast it blurs, a sixteenth). Out of the box, they are the scenes' own. In every scene, its quick things move with D and its slow things with E; butterflies' wings beat with F:

  | Place | Quick things (D) | Slow things (E) |
  |---|---|---|
  | lake | the sun's rays, the ducks bobbing | the clouds |
  | forest, house, tree house, clearing, path through the woods | the butterflies bobbing (their wings with F) | sunbeams, clouds, the tree house's swing |
  | cemetery | the moths | the clouds |
  | under the sea | the fishes' tails | the seaweed swaying |
  | beach | the sand castles' flags | the palm fronds |
  | witch's woods | her cauldron fire | the bats gliding |
  | witch's hut | the cauldron fire | the crows' cages swinging |
  | healer's hut | the fire under the pot | the healer swaying |
  | living room | a new wall clock's pendulum | the lamp's glow |
  | inside the tree house | the leaves outside the window | the limbs outside the window swaying |
  | fairy forest | the fairy lights, the sun's rays, the stars | the lanterns swinging, the clouds |
  | mountain trail | the birds' wings | the clouds |
  | jungle waterfall | the parrots' wings | the vines swaying |
  | camp site | the campfire, the stars | the clouds, the fire's glow |
  | inside a tent | the campfire outside, the stars | the tent's light |
  | cave behind the falls | the gems sparkling | the crystals glowing |
  | castle | the pennants, the sun's rays | the clouds |
  | the castle's rooms with torches | the torches' flames | the torches' glow |
  | greenhouse | the glass parrots' wings | the clouds |
  | cat room | the fire | the cat toys swinging |
  | stable | the hens pecking | the dust in the sunbeam |
  | our imagination | the map's dotted paths | the room's glow |

  Things side by side each go their own way into the wave, never in step. That is only how they start:
  - D to G can be set like any LFO, and anything can follow any LFO.
  - Three new choices on the scene's panel say which LFO its quick things, its slow things and its wings follow: "〰️ quick things in the scene move with", "〰️ slow things in the scene move with" and "〰️ wings in the scene beat with". Or "their own pace", as before.
  - Each LFO's strip on the mixing board names the scene's things that follow it.
- **🕰️ A wall clock in the living room,** high on the right, its pendulum swinging.
- **🐈 A cat room, a new castle room:** a big, cozy wooden room. It has honey plank walls, beams overhead and a lantern, and a stone fireplace with a crackling fire, sparks rising from it. Over the mantel, with its candles and its little clock, hangs a portrait of a royal cat in a crown. There is a window seat under the evening sky (a crescent moon, twinkling stars), its curtains tied back. Two tall cat trees have carpeted platforms, sisal posts, a pompom swinging, and a cubby at the foot with eyes peeking out of it. Shelves step up the side walls to a high walkway across the back, with a cat flap at its end and a feather toy dangling from it, and a rope bridge crosses the room. On the floor are a big braided rug, bowls of fish and water, a basket, a box, balls of yarn, a toy mouse, and a mouse hole whose mouse peeks out now and then. Its doors are in its side walls, as the king's room's are, and its way out is a sign at the bottom. The rug, the curtains, the window seat and the cat trees take its color theme.
- **🐈 The castle's cats:** up to eight ("🐈 how many cats"), six to start with. Each has its own fur, tuxedo white, eyes and size, and it is one of:
  - 🐈 sitting, its tail hanging over a shelf's edge, or curled round its paws on the floor;
  - 😴 curled up asleep, breathing slowly, a "z" rising;
  - 🐾 walking to and fro.

  Where it is: by the fire, on either cat tree, on the high walkway, in the window seat, in the basket, on a shelf, on the mantel, on the rug, in the box, or on the rope bridge.
- **〰️ Each cat wags in its own time, never together.** A cat wags with an LFO, in time with the music ("〰️ its tail wags with"; the quick LFO D to start with), or at its own pace. Each starts its own way into the wag ("↪️ how far into the wag it starts"), spread out to begin with. A tail on an LFO too fast to see blurs, as the fairy's wings do. The mixing board's LFO strip lists the cats' tails that follow it.
- **🐴 A stable, a new castle room:** the castle's stone under timber.
  - Along the back wall, four stalls, each with a half door, its top door swung open, a brass name plate, a bucket, and a hay net inside.
  - Over the stalls, a hay loft stacked with bales, straw hanging off its edge, and a ladder up.
  - High in the wall, a round window. Sunbeams slant down from it through drifting dust, and swallows loop round the beams.
  - Horseshoes are nailed up for luck, and saddles and a bridle hang on the walls. A lantern hangs on the middle post.
  - On the floor: straw everywhere, a stone water trough that ripples, buckets, a heap of hay with a pitchfork in it, and two hens pecking about.
  - Its doors are in its side walls, as the king's room's are.
- **🐴 The castle's horses:** up to four ("🐴 how many horses"), three to start with, each looking out over its stall's door. Each has its own coat, mane and face marking (⭐ a star, ❕ a stripe, ⬜ a blaze, or none), and a halter in the castle's colors. A horse nods, looks round now and then, flicks an ear, blinks, and munches a wisp of hay. Each nods in its own time: with an LFO ("〰️ it nods with"; the slow LFO E to start with) or at its own pace, starting its own way into the nod. An empty stall has a blanket in the castle's colors over its door.
- **Fixed: the fairy forest's lanterns hang from branches.** M noticed that the two lanterns by the great tree hung from nothing. Now the tree has two branches reaching out from its trunk, each ending in a tuft of leaves, and each lantern's string is tied round one of them.
- **Fixed: the fairy house follows its LFO at once.** Before, changing its LFO's speed, shape or depth on the mixing board left the house fading as before, until something else in the fairy forest changed.
- **🕯️ A hallway, a new castle room:** a long corridor going off into the dark, lit only by its torches (the fairy forest's night over it, and no fireflies: they live outside), arches across its vault, and along its walls, by turns, torches and banners in the castle's flag colors with its owner's letter. A carpet runs from you all the way down it, in a color of the castle's own ("🟥 the hallway's carpet"). Its doors are set into its side walls in perspective, left and right, as a hand-painted adventure game draws them, each with its sign. At the far end, an archway onto the foot of a spiral staircase, lit from above; where it leads is the hallway's own setting ("🌀 the stairs at its end lead to": the first spiral stairs, any room, or nowhere), even the hallway itself: the friend flies up the stairs and lands back in it, as through a picture of the room you are in. The hallway is seen from a little higher than the other rooms, so its far end shows above the friend's head.
- **🚪 A castle is rooms by number, each with its own exits:** a hallway has up to four doors in its walls ("🚪 doors in its walls", 0 to 4), each leading where you say, out of the castle or to a room by its number (its own too), and its stairs at the far end lead where you say, so two hallways can join each other and still have their own doors to their own rooms. The king's room has its own doors too, set the same way: in its side walls in perspective, two to a side, clear of the throne, the banners and the suits of armor (now against the back wall), and its way out is a sign at the bottom, toward you, as the forest clearing's path (a door set to lead out is that sign). The other rooms still lead to all the rest. A door's choices list only the rooms the castle has, each with its own room's emoji (👑 room 1, 🕯️ room 2, 🕳️ room 3), as the go-to chips show them. On the castle's tab, "🚶 go straight to" chips take you outside or into any room by its number, and its settings are in dashed boxes: the castle's look, its rooms, and each room's own (a hallway's doors and stairs, a dungeon's skeletons, only where they apply).
- **Where you are, after how you feel:** the caption under the picture says it, with each place's own word: feeling happy in the 🌲 forest, at the 🏕️ camp site, on the 🥾 path through the woods, near the 🌳 tree house, outside of N's 🏰 castle, 🐠 under the sea, in the 🗝️ dungeon (room 4 of N's castle).
- **Inside a castle room, only that room's settings show**, marked as the room you are in; at the castle itself, every room's show.
- **💭 Our imagination, a new place,** first after none: a room of endless white, and on its far wall a map of every place there is, each a little framed picture of it that you can go through, a column to each kind of place (woods, water, camping, home, the witch's, castles), the places down it joined by a dotted path. Go there, and you can go anywhere.
- **Fixed: a picture takes you to its own place.** A picture showed its place's own signposts and doors, and a click on one of them took you where that one led (the camp site's picture to the mountain trail); now the whole picture is the way in (the living room's pictures too).
- **💎 Gems in the cave behind the falls:** gems all over its walls ("💎 gems on the walls", up to 40), each with a sparkle, and sparkles on its crystals, set like the night sky's stars: their shape, size (up to huge), brightness and twinkle.
- **💦 The jungle waterfall's speed and time of day:** "how fast it falls", and "🌗 time of day" (☀️ day, 🌇 sunset, 🌙 night, the moon out at night), the waterfall's own settings, so the falls and the view out of the cave behind them always agree. Its width shows in the cave too.
- **🏰 D's castle, as D chose it:** to start with, five levels, green-grey stone, 16 trees round it, a narrower moat, purple and green flags in stripes, and purple roofs.
- **🎨 Two color themes for each castle, A and B:** each its two colors, how they go (in turn, stripes, checkers) and a carpet color. A is the castle's own (its flags outside too); B starts as A with its two colors swapped and its carpet in A's second color. Each hallway and king's room takes one ("🎨 its colors"), rooms taking A and B by turns to start with, so two hallways or two king's rooms look different. The king's room's carpet is its theme's too, no longer always red.
- **Fixed: torch flames stay on their torches.** A torch's flame flickered by stretching about the corner of the picture, so the farther a torch was from the middle, the further its flame drifted off it (the dungeons' too).

## 0.0.34 (2026-10-15)

Everything in 0.0.33, plus LFOs faster than a beat, down to a 32nd of a beat, with fairy wings that blur when they flap faster than the screen can show.

- **⏱️ LFOs faster than a beat,** down to a 32nd of a beat. The "⏱️ round in" knob on the mixing board mirrors itself around 1 beat, now its middle: 1/32, 1/31 … 1/3, 1/2 beat below it, and 2, 3, 4, 5 … beats to 8 bars above it, every whole number of beats now (it used to skip 5, 7, 9 and others). A bongo or conga following a fast LFO bends all through each hit, in time with the tune, not just at its start: at a few to the beat it warbles, and near 1/32 beat (about 60 times a second) it buzzes. Slower LFOs sound as they did.
- **🧚 Wings too fast to see:** wings flapping with an LFO faster than the screen can draw (a cycle in under about four frames, around 1/8 beat or faster) show as fast wings look: a see-through blur across the whole sweep of the flap, thickest where the wave lingers, that keeps moving (eight see-through copies flap at the LFO's own speed, each an eighth of a cycle behind the last, so every frame catches them spread round the cycle, in a new place each time). A part fading with an LFO that fast (and the fairy house) holds at its average see-through-ness instead of flickering.

## 0.0.33 (2026-10-14)

Everything in 0.0.32, plus a ghost costume, the fairy forest, and the fairy in a shirt and pants.

- **👻 A ghost costume,** like the 👻 emoji but the friend's full size: a sheet over all of them, domed over the head, its sleeves along the arms as they are held (up, out or down) with round ends, a wavy hem, soft folds, and an "o" of a mouth. **How ragged** it is: from smooth round waves to torn points and slits. **Eyes:** none, one, two, or three (the third in the middle of the forehead, like the three-eyed smiley on the poster for the movie Evolution), drawn in the friend's own eye style, or, with **🕳️ hide eyes**, plain black holes like the emoji's. **The sheet's color,** off-white at first. And its **see-through-ness** right there on its panel: the Visibility tab's every-part chips and full-body slider, with the slider's LFO chip, so the whole ghost can fade in and out with the music.
- **🧚 The fairy forest,** a new background, reached by a "🧚 fairies" sign in the forest clearing: a glade in the woods at the time of day you pick (☀️ day, 🌅 sunrise, 🌇 sunset, 🌙 night), a ring of red-and-white toadstools in the grass (as many as you like, glowing a little at night), and a great old tree with a fairy house in it: a round green door between its roots, lit round windows with flower boxes, shelf-fungus steps winding up to a little balcony, lanterns, a chimney with smoke. The house shows as much as its slider says (0 hides it), and it can fade in and out with LFO A, B or C, in time with the music; the mixing board lists it. Fireflies at sunset and at night, sparkles by day; at night, the stars as the camp site's star settings say. A sign goes back to the clearing.
- **🧚 The fairy in a shirt and pants:** two chips, 👗 dress or 👕 shirt + pants. With pants, her tunic is a top, in the same five styles and colors, its hem a short frill at her hips (petals, leaves, bells, a sparkly zigzag, or a toadstool's, with its white frill), over pants a shade deeper than the tunic.

## 0.0.32 (2026-10-14)

Everything in 0.0.31, plus inside the healer's hut, three peaceful waltzes, a wreath of flowers for the fairy, an afro of its own shape, and bangs that sit under the witch's brim.

- **Fixed: the afro no longer becomes a beard.** It was one big circle, whose lower part reached down beside the cheeks to the jaw. Now it is an afro's own shape: a big round puff over the head, curly at its edge, ending at the ears, at every length.
- **Fixed: bangs under the witch's hat.** With big eyes (which make the head taller, and lift the hat with it), a band of bare forehead opened between the hat's brim and the bangs, and only bits of hair over the eyes showed. Now the bangs come from right under the brim, whatever the eyes' size.
- **🌸 A wreath of flowers for the fairy,** worn round her head on her forehead, above her brows, over her hair: a vine with leaves and six flowers, smaller toward the sides as the ring turns away. Its flowers in every color, or all of one kind: 🌸 pink roses, 🤍 daisies, 🌼 buttercups, 💙 forget-me-nots or 💜 violets. On by default; a toggle takes it off. When her head explodes, it goes off with the lid.
- **💃 Three peaceful waltzes,** in the waltz group: a 🏰 castle waltz (a flute over harpsichord oom-pah-pah, strings and bells), the castle's own tune now; a 👑 ballroom waltz (fiddles, harpsichord broken chords, a flute answering), for inside the castle; and a slow, warm 🌿 healer's waltz (vibes over soft chords, plucked oom-pah-pah, a music box), for inside the healer's hut. The witch's spooky waltz stays with the witch.
- **🌿 Inside the healer's hut,** a new background, and the healer's hut in the forest clearing is a doorway into it. It is warm: round cream walls under a thatched roof, herbs drying from the beam, a round window full of sun, a braided rug. A stone hearth with a fire, and on it a big pot of golden soup with carrots and herbs, steaming. Shelves and shelves of potions, neatly kept, each shelf its own kind of bottle in rainbow order. The healer's cat sits up on the top shelf, its tail hanging down and slowly swinging (its fur, tuxedo and eyes have their own colors). The healer herself is friendly: long auburn hair with flowers by her ears, a green dress and an apron with a heart, rosy cheeks, a smile; she sways gently from side to side and stirs the soup with a long wooden spoon. Drag her anywhere; her size has a slider. A worktable with a mortar and pestle, bowls, herbs, scissors, a knife and a little balance; a small table with two chairs, a teapot and cups, to sit and talk. The door goes back out to the clearing.

## 0.0.31 (2026-10-14)

Everything in 0.0.30, plus fairy wings that flap with the music's LFOs.

- **〰️ Wings that flap with the music:** the fairy's wing controls have an LFO chip (no LFO, A, B or C). With an LFO, the wings flap once per LFO cycle, in the shape of its wave (a triangle, a saw or a sine), in time with the music, and farther the deeper the LFO (from a gentle flap to a big one, more than the usual flutter). Changing the LFO on the mixing board changes the flapping at once, and the board lists 🧚 fairy wings among what that LFO drives; the wings keep flapping while you drag the fairy.

## 0.0.30 (2026-10-14)

Everything in 0.0.29, plus stars of many shapes and sizes that twinkle at the camp site, and a fairy who flies when you drag her.

- **🧚 Fly as a fairy:** a fairy's wings keep flapping while you drag her about, so she can fly (and the sparkle wings' stars keep twinkling). The rest of the picture's animations still hold still during a drag, as before, so dragging stays smooth: measured, the flapping costs nothing noticeable.
- **⭐ Stars at the camp site:** at night, new controls for the stars: their **shape** (• dots as before, ✦ four points, ★ five, ✶ six, ✴ eight, or 🎲 a mix, the new usual: the small ones dots, the bigger ones stars of every kind), their **size** on average (many small and a few big, from tiny up to huge), their **brightness** on average (the brightest with a soft glow), and how much they **twinkle**: the big bright ones turn a little, grow and shrink, and glimmer, each at its own pace, and the small ones blink. The night seen through the tent's door has the same stars. The moon is drawn over the stars now, so none shows through its dark side.

## 0.0.29 (2026-10-14)

Everything in 0.0.28, plus no skeletons in the castles unless you ask for them, castle colors, bangs in front of the face, a fairy, and parts that fade with the music's LFOs.

- **〰️ Three LFOs, shared:** the mixing board's LFOs are now three, A, B and C (D is gone; no tune used it), and with the whole tune's strip they make a square of four before the instruments. The same three are used everywhere: by the drums' pitch, and now by the friend's parts.
- **👻 Fading with the beat:** on the Visibility tab, each part has an LFO chip beside its name (no LFO, A, B, C): that part fades in and out with the LFO's wave, never past its slider, as far as the LFO's depth says (full depth fades it right out), in time with the music while it plays (else at the tune's tempo). The full-body slider has one too, which sets every part to the same LFO ("mixed LFOs" when they differ). Changing an LFO on the mixing board changes the fading at once.
- **🧚 A fairy costume:** wings in five styles (🦋 butterfly, 🪰 dragonfly, 🍃 leaf, 🌸 petal, ✨ sparkle, its stars twinkling), each with its own colors, fluttering (unless turned off); a tunic in five (🌸 petals, 🍃 leaves, 🔔 bluebell, ✨ sparkle with gold stars, 🍄 toadstool with white spots and a frill), each its own hem and colors; and shoes of the fairy's own: curly slippers, petal shoes, leaf wraps, sparkle boots, or bare feet with flower anklets. Her own hair, face and hands.
- **📌 Pin the full-body slider** to the full-screen controls, like any other slider.
- **🗝️ No skeletons unless you want them:** the castles' dungeons now have no skeletons or skulls at first; each dungeon room has its own slider for them, from none up to as many as its drawing has (two in the dungeon, four in the deep dungeon), the least scary first (in the deep one: the skull under the candle, then the one in the cell, the one in the cage, the one hanging). With none, the chains hang empty and the candle stands on a stone. The dungeon's sign is a key now, not a skull, and the trap room has a dropped sword by its pit instead of a bone.
- **🚩 Castle colors:** each castle's banners and flags are in two colors, its owner's choice, used in one of three ways: in turn (each flag one color, the next the other), stripes, or checkers; in the clearing's far view, at the castle, on the road's pennants, and in the king's room (its banners and shields). The owner's letter is always readable: dark on a light banner, white on a dark one, outlined in the other, and on a round badge of its own on stripes and checkers (M's letter now shows on her gold). **🔺 Roofs** in a color of each castle's own.
- **✂️ Bangs in front:** a fix for a bug since the first version: the whole hairdo was drawn behind the head, so its front, the fringe over the forehead, was hidden by the face (a see-through head showed it). Now the front of the hair comes over the face, the eyes and the brows, in locks of its own kind (pointed for straight hair, round for curly hair and an afro, a zigzag for spiky hair), parted for long hair. A new **bangs** slider on the Hair tab sets how far down it comes: 0 for none (the old look), 100 (the usual) for down to the brows, and past that over the brows and the eyes. When the head explodes, the bangs split along the crack, the top going off with the lid.

## 0.0.28 (2026-10-14)

Everything in 0.0.27, with the ducks swimming forward.

- **🦆 Ducks swim forward:** in 0.0.27 a duck paddled out and then came back the same way facing, as if swimming backwards. Now it swims out, pauses to turn round, and swims back facing where it goes, then turns again.

## 0.0.27 (2026-10-14)

Everything in 0.0.26, plus organic trees, bushes, grass and rocks in every scene, snow that sits on its mountains, and skies that move.

- **🌳 Trees, bushes, grass and rocks, grown as the tree house's are:** every broadleaf tree now has a trunk flaring at its roots, limbs forking up, and leaf pads at their tips (the tree house's own pad shapes), darker behind and lighter in front, each tree from its own seed; pines are tiers of drooping boughs; bushes are low mounds of leaf pads, some in flower; grass grows in tufts of curved blades; rocks are irregular stones with a lit face and a crack. No more lollipops or ice-cream scoops, in the woods, the clearing, the tree house's woods, the house's yard, the lake's far wood, the castle, the healer's grove, the cemetery, the waterfall's jungle, the path through the woods, the mountain trail, the witch's woods and under the sea. One set of drawings for every scene, for consistency.
- **🏔️ Snow that sits on the mountains:** each snow cap is cut from its own peak's slopes, with a ragged snow line, on the mountain trail and behind the castle (whose mountains are now a proper range).
- **☁️ Every cloud drifts,** slowly, each at its own pace; **🦆 the lake's ducks** paddle about, bobbing and rocking; **☀️ the sun's rays** turn slowly and breathe, at the lake and the castle.
- **🌤️ Sunbeams in the woods** (and on the path through them) come from one far, still sun: they run parallel, each its own width, and each dims and brightens as clouds go by, now and then nearly gone.
- **Fixed:** bushes no longer grow in the tree house's stream; castle banners hang from the battlements as long as the wall is tall, so a one-level castle's no longer dip into the moat.

## 0.0.26 (2026-10-14)

Everything in 0.0.25, plus backgrounds by kind of place, and three castles with their rooms.

- **🏞️ Backgrounds by kind of place,** as the music is by kind: the Background tab's long row of places is now two rows, each in a dashed box with its name: first the kind of place (⬜ no background, 🌲 woods, 💧 water, 🏕️ camping, 🏠 home, 🧙 the witch's), then that kind's places. Picking a kind goes to its first place, unless the place now is already of that kind; going through a doorway shows the new place's kind.
- **🏰 Three castles, N's, M's and D's:** each with its own settings: how many levels (1 to 5), its stone, how many trees grow round it, and how wide its moat and drawbridge are (none to very wide), its flags and banners in its owner's color with the owner's letter. The forest clearing shows the one picked ("🏰 whose castle"), far off and now a doorway; a new place, 🏰 castle, shows it up close: far snowy mountains and forest, the sun and birds, stonework, ivy, lit windows and torches, reeds and lily pads in the moat, a road with pennants, a hay cart, a well, barrels, flowers, framing oaks.
- **🚪 Castle rooms:** each castle has up to six rooms, each in a style, chosen in the Background tab; the gate leads into the first, and doors lead between them. N's room styles, for any castle: 👑 the king's room (a throne on a dais, a red carpet, banners, a stained-glass window, a chandelier, suits of armor, a chest of gold, and an open door onto the hallway outside); 🌿 the greenhouse (glass walls and roof, vines on every wall, glass parrots flying by the vines, palms, monstera, ferns, birds of paradise, hibiscus, bromeliads, and a fountain in the middle, its water running); 🕳️ the trap room (one doorway, and two spiked pits in the floor that drop into the dungeons); 💀 the dungeon and ⛓️ the deep dungeon (skeletons hanging on the walls, chains, a cage, a cell, glowing mushrooms, dripping water, and a ladder back up to the trap room).

## 0.0.25 (2026-10-14)

Everything in 0.0.24, with the full-body slider working as it should.

- **🧍 The full-body slider sets every part to its value:** moving it puts every part's visibility exactly where it is, wherever the parts were (in 0.0.24 it moved them by the same amount, keeping their differences). It keeps its own value; when a part is moved on its own, the parts no longer all match it, so it dims and says "mixed" until it is moved again. The "every part at once" chips set it too.
- **The chips in order:** 🙂 visible, 👻 ghost, 🫥 invisible.

## 0.0.24 (2026-10-14)

Everything in 0.0.23, plus a full-body visibility slider, a smooth drag past the cauldron, tree house size, and a tab icon.

- **🧍 A full-body slider:** in the 👻 Visibility tab, under the "every part at once" chips and above the parts, one slider moves every part's slider by the same amount, so the friend fades or comes back as a whole while each part keeps its own difference (each stops at invisible or fully there). It shows the most visible part. A drag moves the parts from where they were when it began, so dragging back puts them back as they were.
- **🧙 Dragging the friend past the cauldron is smooth again:** in the witch's woods and inside her hut, a drag of the friend crawled (60 moves took 8 seconds in the woods, with frames up to a quarter second apart). Now the scenery stays put while the friend is redrawn, instead of being taken out and put back on every move, and the scene's animations (the fumes, the bubbles) hold still while a drag is held, going on from where they stopped when you let go: the same drag takes 2 seconds, at a steady 60 frames a second, as in a scene with no fumes.
- **🏡 Tree house size:** in the 🌳 tree house, a slider grows its houses apart from the tree (50 to 250, as big as 2½ times), each about where it sits, with the rope bridges and ladders still meeting their platforms.
- **🐈‍⬛ A tab icon, drawn by the game itself:** the tree house with two cat houses, a black cat and an amber cat, at tree house size 250, rendered from the game's own picture and scaled down to a browser tab's sizes (16, 32 and 48 pixels; PNGs in the page itself, so the game stays one file).

## 0.0.23 (2026-10-14)

Everything in 0.0.22, plus a quiet link to the game's code.

- **The game's code, one chip away:** a quiet "GitHub ↗" chip after 🎵 Music, last in the row of tabs, opens the game's repository (matthewhammer/kids-choice-games) in a new tab, so the game keeps its place.

## 0.0.22 (2026-10-14)

Everything in 0.0.21, plus LFOs on the drums' pitch, and bongos that sing.

- **〰️ LFOs on the drums' pitch:** the mixing board has four LFOs, A to D, in a row before the instruments: each is a slow wave that keeps time with the tune, going once round in one beat up to eight bars, in a shape (△ triangle, ◿ saw or ∿ sine), so far up and down (its depth, up to an octave either way). Every drum with a 🎵 pitch knob (the bongos, the congas) has an LFO chip: tap it for none, LFO A, B, C or D, and its pitch follows that wave, a hit at a time. Kept for each tune with the friend, as the rest of the mix.
- **🪘 Bongos that sing:** the classic beats set their own LFOs: 🥁 bongo breakdown's high bongo rises and falls once a bar, and in the solo the high one talks, up and down every two beats, while the low one climbs over eight bars; 🏜️ canyon cruise's low bongo, a hit every dotted quarter, plays a little tune of its own that comes round every bar and a half; 🛹 skatepark strut's high bongo goes round every three beats, against the bar's four. And 🏖️ beach calypso's second conga sways.

## 0.0.21 (2026-10-14)

Everything in 0.0.20, plus inside the tents, a cave behind the falls, a path through the woods, a usual size for every place, a visibility panel, and the classic beats in threes.

- **⛺ Inside the tents:** at the camp site every tent is a doorway into its own inside, the same color as outside: the 🟧 orange one has sleeping bags and a flashlight, the 🟦 blue one a teddy bear, books and a lantern, the 🟩 green one an explorer's map, binoculars, a backpack and a jar of fireflies. Its door stands open onto the camp at the camp's own time of day, its fire lit or out, and is the way back out. (Also a background of its own, with a choice of which tent.)
- **🪨 The cave behind the falls:** the waterfall itself is a doorway into a cave you can't see from outside: stalactites dripping, crystals glowing, glowworms, bats asleep and an old chest. From inside you see the falls from behind, as wide and as misty as the waterfall's sliders make them, and they are the way back out.
- **🥾 The path through the woods:** the forest clearing's path toward you (its sign says "🥾 path ⬇️") leads to a new path through the woods, tall trunks, ferns and mushrooms, whose signpost goes back to the clearing or on to the mountain trail; the trail's signpost has a third arrow, "🌲 woods", back.
- **🧍 Landing on the ground:** through a doorway or by picking a background, a friend lands where they can stand: beside the campfire, not in it; on the bank of the waterfall's pool, not in the water; beside a tent's door or the cave's mouth, not in front of it.
- **🧍 A usual size for every place:** a friend in a background is as big as the place's things make sense beside them: small by the waterfall or the tree house, bigger in the living room or a tent. 100 on the size slider is that usual size in every place (it goes up to 1000); a friend saved before keeps the size they had.
- **👻 Visibility:** a new panel with a slider for how much of each part of the body shows (100 all of it, 0 none): 🙂 head, 👀 eyes, 💇 hair, 👕 shirt, 👖 pants, 👟 feet and 🖐 hands. Above them, three chips set every part at once: 🫥 invisible, 🙂 visible and 👻 ghost (every part half there). An invisible shirt is an invisible body (the neck and arms too), and invisible pants are invisible hips and legs: parts turn ghostly or vanish, the clothes never come off. The eyes go on their own, so an invisible head can keep its eyes, floating; things held or worn on the side (a witch's cat and broom) stay. A ghost is evenly see-through, even where a part is drawn twice (the arms go behind the hair and again over the face), and its shadow fades with it. 🎲 Surprise leaves what shows alone.
- **🎶 The music's chips in boxes:** the kinds of music and the kind's tunes each sit in a dashed box with its name ("kind of music", "tunes: 🥁 classic beats"), so the two rows read apart.
- **🥁 Classic beats in threes:** the three classic beats play triplets and cross-rhythms against their beat: the high bongo ends every other bar in triplets and the low one plays three over two beats (🥁 bongo breakdown, whose bongo solo goes from three to the beat to three over two beats to six to the beat); the bass runs up in triplets, the theme falls in a lazy triplet, and the low bongo hits every dotted quarter, three for every two of the band's (🏜️ canyon cruise); the hats roll in triplets and the organ plays three chords over two beats (🛹 skatepark strut); and every snare fill into a new section goes faster and faster in triplets. (Tunes can now be written in triplets: a note's length may be a fraction, and drum hits in parentheses share a beat.)

## 0.0.20 (2026-10-14)

Everything in 0.0.19, plus music by kind, three classic beats, and moving music by an interval.

- **🎶 Music by kind:** the Music tab picks a kind of music, then one of its tunes: 🥁 classic beats, 🌴 reggae, 🏖️ calypso, 🏠 house, 🕺 groove, 💃 waltz, 🏃 chase and 📖 storybook (or 🏞️ the scene's own tune). Picking a kind plays its first tune, unless the tune playing is already of that kind.
- **🥁 Three classic beats:** our own funk tunes in the style of the instrumentals hip-hop grew up on, about three minutes each: 🥁 bongo breakdown, 🏜️ canyon cruise and 🛹 skatepark strut. Each gives every player a turn in front: the bongos open it, then the bass guitar, the bongos again, the drum kit, the organ, the rhythm guitar and the lead guitar each take a solo (watch the sections under the tune's slider, and solo or mute them on the mixing board). New instruments for them: a bass guitar, bongos, an open hi-hat, a tonewheel organ with a spinning speaker, a funk guitar with a wah, and a twangy lead guitar with a whammy bar.
- **🎹 Move the tune by an interval:** under the transpose slider, ➖ | 🎵 interval | ➕. A tap on the interval goes to the next one, a half step, a whole step, a minor 3rd and so on up to the octave (where it starts); ➖ and ➕ move the slider by exactly that much.
- **🎚️ Move each instrument too:** on the mixing board, every instrument that plays notes has its own ➖ | 🎵 interval | ➕, and says how far it is moved: none, or up to three presses either way ("+2 × 5th"). Drums keep their sound.
- Part names on the mixing board read with spaces ("bass Solo", "break Kick").

## 0.0.19 (2026-10-13)

Everything in 0.0.18, plus the far views match the places they show.

- **🌲 The forest clearing shows the places as you made them:** the tree house is that very tree, small and far off: its houses, their animals and colors, its bridges, ladders, leaves, swing and size (and its crown, seen from afar), each house a doorway into its room. The family house is as big as its slider says. The witch's hut stands on chicken legs only when it has them, as long as they are, with skulls on its fence as big, as wide-eyed and as glowing as her woods' skulls.
- (Pictures on the walls were already drawn from the same settings as their scenes.)

## 0.0.18 (2026-10-13)

Everything in 0.0.17, plus three new places: a mountain trail, a jungle waterfall and a camp site.

- **⛰️ A mountain trail:** snowy peaks in ranges, a lake and a village far below, clouds drifting, birds circling, and the trail winding off uphill. Its signpost points to the falls and the camp (each arrow a doorway). Sliders: how high the peaks are, clouds, birds, and the lake and village (on or off).
- **💦 A jungle waterfall:** the water streaming down a mossy cliff into a pool, ripples spreading, mist rising at its foot, big-leaved trees, vines swaying, parrots and flowers; a sign back to the trail. Sliders: waterfall width, vines, mist, parrots.
- **🏕️ A camp site:** tents round a campfire, logs to sit on, a sign back to the trail. Controls:
  - the time of day: ☀️ day, 🌇 sunset or 🌙 night (stars twinkling and a moon);
  - the campfire lit or out (out, it smokes), and its flames' size, sparks flying up;
  - what is on the fire: nothing, 🌭 veggie sausages on sticks, or 🍲 a pot of soup hanging over it, steaming;
  - how many tents.
- **🌲 The forest clearing:** the paths run on the ground to each place's door or gate; the castle has a moat, its drawbridge down, and a low fence outside it; the witch's hut has a crooked fence; the healer's hut stands among trees.

## 0.0.17 (2026-10-13)

Everything in 0.0.16, plus a room inside every tree house, ways between them, inside the witch's hut, and a forest clearing.

- **🪜 A room inside each tree house, 1 to 6,** numbered as the houses are outside, a sign with its number and its animal hanging from the rafters. Each house's kind of room is its own, with two more kinds: 🎨 an **art studio** (an easel, paint jars, drawings pinned up) and 🥁 a **music room** (drums, a keyboard, records on the wall). Each room's two pictures are its own to choose.
- **Ways between the rooms,** where the houses are joined outside: a door in the side wall where a rope bridge goes out, a hatch in the floor down a ladder (to the house below, or 🌳 out to the ground), a ladder up through the ceiling where the house above comes down to this one. Each has a sign saying where it goes, and is a doorway.
- **The ladders join the houses:** house 1's goes down to house 5, house 2's to house 6, house 3's to house 1, house 4's to house 2 (to the ground when there is no house below).
- **Inside always matches outside,** whatever the numbers of houses, bridges and ladders (checked for all 252 ways): a bridge to a smaller house now reaches its platform, and you are always inside a house the tree has (going into house 6 grows the tree to six; fewer houses take you to the last one).
- **🧙 Inside the witch's hut:** click her hut in the witch's woods to go in. A cauldron bubbles over its fire, crows sit in hanging cages, frogs in jars, snakes in a glass tank, and the witch herself stands there: drag her anywhere. It matches her hut outside: the red door in the middle, a window either side, and a round window above, now in the hut's gable too. Both cauldrons, inside and out, bubble over a flickering fire, and their fumes rise as a double helix, one green and one blue, turning as they go up and out past the top of the picture. Sliders: the witch's size, the cauldron's size, crows, frogs, snakes. Her door goes back out to the woods.
- **🌲 A forest clearing,** with paths out to what you choose to see far off, each with its own switch: 🏠 the family house, 🌳 the tree house (with its houses as you chose them), 🧙 the witch's hut, 🏰 a castle on its hill, and 🌿 a healer's hut. The house, the tree house and the witch's hut are doorways into their scenes (the castle's and the healer's insides are still to come).
- Fixed: the pictures in the tree house rooms and the living room's window could not be clicked through (a dim or a pane of glass lay over them).

## 0.0.16 (2026-10-13)

Everything in 0.0.15, plus as many talons as you like.

- **🦅 Talons, 1 to 100,** like the toes, each foot its own: one talon back and the rest forward, fanned wider and thinner as there are more, each with its hooked claw (4 looks as it always did).

## 0.0.15 (2026-10-13)

Everything in 0.0.14, plus doorways between the scenes, feet as free as the hands, and tree houses in colors of your own.

- **🚪 Doorways into other scenes:** a picture on a wall, a window, a tree house and the house's front door glow under the pointer. Click one (or tap it), and the friend flies to it, shrinking to fit it and spinning, slowly and then fast, into its scene. They land where a friend starts, at the size they had.
  - the living room's pictures and its window go to the scenes they show;
  - inside the tree house, the pictures go to theirs, and the window back outside;
  - each tree house goes inside it, each to a room of its own (bunk room, kitchen, reading nook, lookout);
  - the house's front door goes into the living room.
  - after a trip, a **⬅️ back** chip on the picture goes back through the doorway, the friend spinning into it, to where they stood; after several trips, back one at a time. Choosing a scene from the menu starts afresh.

- **👟 Feet, like hands:**
  - a **"feet are different"** switch gives each foot a column of its own (the friend's right foot on our left, as with the hands), each with its own style and toes; the color and the size are both feet's;
  - **🦶 toes** and **👽 alien toes** each have a slider for how many, **1 to 100** (5 toes and 3 or 4 alien toes look as they always did; more fan round the foot, to a fringe at 100);
  - the picture's frame grows to hold toes that fan out below the feet;
  - saved friends with the old "5 toes", "4 toes" and "3 toes" feet come back the same.
- **🌳 Tree houses in colors of your own,** each house its own:
  - a 🐱 **cat** house starts as a **tuxedo cat** (black, a white muzzle and a white bib over the door); its fur, its white (or none) and its eyes are each house's;
  - a 🎀 **fancy house**'s walls, roof and trim, and a 🔨 **craftsman**'s walls, roof, trim and gable, start as they were and can change.

## 0.0.14 (2026-10-13)

Everything in 0.0.13, plus the great tree's crown.

- **🌳 The tree house's great tree has a crown,** high above the picture: its trunk goes on up, branches spread wide, and big bonsai pads of leaves sit on them. At the usual size it is out of sight; shrink the tree to see it. The leaves slider fills it too (0: bare branches).

## 0.0.13 (2026-10-13)

Everything in 0.0.12, plus a forest, a stream and a swing round the tree house, and three more kinds of tree house.

- **🌳 The tree house stands in a forest:** pines and round trees on the hills and at the meadow's edge, bushes, and flowers in the grass.
- **A stream** winds down past the tree, and **a rope swing** sways over it from a long branch.
- **Three more kinds of house** in each house's menu, beside the animals:
  - 🪵 **cabin:** a plain red gable and a chimney;
  - 🎀 **fancy house:** a steep scalloped roof, lacy trim, a gold finial, a round window and flower boxes;
  - 🔨 **craftsman:** a low wide gable with rafter tails and braces, and tapered porch posts on stone.

## 0.0.12 (2026-10-13)

Everything in 0.0.11, plus five new backgrounds with sliders of their own, and four chase tunes.

- **Five new backgrounds**, each with its own sliders (a size, a count, and for pictures, their detail):
  - 🦆 **Lake:** ducks, cattails at the water's edge, a little beach, thin grass on the dirt shore, sun and puffy clouds. Sliders: ducks, duck size, cattails, clouds, cloud size.
  - 🏠 **House and yard:** a brown house of two floors with the garage on its right, a driveway, a stone walk, a tree each side, bushes, flowers, and toys left on the lawn. Sliders: house size, tree size, toys, flowers.
  - 🌳 **Tree house:** one great tree, its trunk five trunks braided into one, with up to six houses, rope bridges across it and ladders down. Its leaves grow in bonsai pads on many branches. Each house is an animal (🦊 fox, 🦉 owl, 🐸 frog, 🐰 bunny, 🐻 bear, 🐱 cat): its roof is the animal's head, its face above the door, like a costume's hood; the lower houses stand in front. Sliders: houses, tree size, rope bridges, ladders, leaves, and each house's animal.
  - 🪜 **Inside the tree house:** a bunk room, a kitchen, a reading nook or a lookout. Each room has its own wood, floor and window. The tree's trunk comes up through the floor, its strands braided, and bare branches poke through the walls. It is dim inside. Sliders: room, window size, things in the room, pictures on the wall and their detail, and each picture's scene.
  - 🛋️ **Living room:** a couch in the middle, pillows on it, a lamp and a plant. Above the couch, a window with curtains looks out on a background of your choice, at its own detail. Up to six pictures hang on the wall, and each one shows a background of your choice. A picture of the living room holds its own pictures. Sliders: what is outside the window and its detail, couch size, pillows, pictures, picture detail (0 is a blur, 100 is all of it), picture size, and each picture's scene.
- **Four chase tunes,** layered synths with drums dropping out and crashing back in, made for the tempo slider (try 250%). Each is about 2 minutes:
  - 🌳 **Tree-house chase** (the tree house's own, inside and out);
  - 🦆 **Duck-pond dash** (the lake's);
  - 🛋️ **Couch-cushion rave** (the living room's);
  - 🏠 **Round-the-house chase** (the house's).
- **Two new instruments** on the mixing board: 🎛️ a dance lead (its knob: how bright) and ⚡ a laser zap (its knob: how far it falls).
- **Scenes are kept between moves:**
  - moving one of the figure's sliders no longer draws the scenery again;
  - a scene's own slider builds again only the parts it changes, and the page keeps the rest as they are: a size slider (the tree's, the house's, the couch's) changes one group's transform, and a count slider (ducks, toys, pillows) one part.
  - a picture of the living room on its own wall changes with the room (its pillows, its couch), as it should.

## 0.0.11 (2026-10-12)

Everything in 0.0.10, plus longer beach tunes, with bridges, breaks and new parts.

- **The beach tunes are longer, and change as they go:**
  - 🏖️ **Beach calypso** (about 2½ minutes, 10 sections):
    - a third steel-pan tune over a bridge of its own (A minor, F, C, G), with its own strum and bass;
    - a second pan breaking the chords under the tune;
    - a higher conga answering the first, and a carnival whistle;
    - a break of pans and hand drums only, and the last stretch a whole step higher.
  - 🥁 **Beach soca jump-up** (about 2½ minutes, 12 sections):
    - a bridge tune (B minor, G, D, A) with its own chop and bass, as a breather;
    - buzzy synth stabs for the jumps, and the whistle;
    - two snare-roll build-ups, and the last jump a whole step higher.
  - 🌴 **Sunny reggae** (about 3½ minutes, 9 sections), still all rhythm:
    - a bridge (C, D, G, E minor) with its own bass line, chop, organ bubble and vamp;
    - two dub sections, where the chop and a rim shot drop deep into the echo;
    - a stretch with sixteenth-note hi-hats.

## 0.0.10 (2026-10-12)

Everything in 0.0.9, plus longer forest and garden tunes, rhythm vamps in sunny reggae, and the music's mute at the top of its tab.

- **🔊 The music's mute chip** is now at the top of the 🎵 Music tab, above the rest, not at the bottom under the mixing board.
- **🌲 The forest walk is twice as long,** about 3 minutes:
  - a third flute tune that wanders into E minor, over chords of its own;
  - plucked violins answering the flute;
  - a cuckoo calling far off, dewdrops, and a woodpecker tapping into the echo;
  - a section a fourth higher, and breaks where the bass drops out.
- **🌿 The peaceful garden is longer too,** about 4 minutes:
  - a third flute tune in D minor, over its own pad and music box;
  - wind chimes, soft vibraphone chords and a gentle bass;
  - a section a whole step higher, and a quiet break of chimes and birds.
- **🌴 Sunny reggae has rhythm where its tunes were.** The melodica's two lead melodies are gone. In their place are two vamps that follow the bass line:
  - vamp A stabs the chord on the bass line's own off-beats;
  - vamp B doubles the end of each bar's bass figure an octave up, short, as a reggae guitar picks along with the bass.

  The last section has both.

## 0.0.9 (2026-10-12)

Everything in 0.0.8, plus a knob for each instrument, a tape stop, and a steady line for where the tune is.

- **A knob for each instrument** on its mixing-board strip, at 50 as the tune was written:
  - ✨ ring: steel pan, harpsichord, plucked violin and strings, guitar strum, music box, bell;
  - ✨ length: rim, snare, hat, shaker, cowbell, chop;
  - 💥 boom: kick;
  - 🎵 pitch: conga, in half steps;
  - 🎸 growl: bass;
  - 🐝 wah: the buzzy bass;
  - 🎹 bright: organ;
  - 〰️ vibrato: flute and melodica;
  - 〰️ waver: the ghost;
  - 🌀 wobble: the vibraphone (0 stops it);
  - 🌅 swell: the pad;
  - 🫧 bloop: bubbles;
  - 🐦 chirp: birds.

  A knob changes the notes that part plays from then on.
- **📼 Tape stop** in the transport: as when a tape machine loses its power, the music, its echoes and its room slow down and slide down in pitch together to a halt, then pause there. ▶ play carries on from where the tape stopped.
- Fixed: where the tune is ("bar 14 · beat 2 of 4 · section 2 of 6") and its time ("0:16 / 0:59") sometimes broke onto two lines as the numbers changed. They now sit on a line of their own under the buttons, which never wraps.

## 0.0.8 (2026-10-12)

Everything in 0.0.7, plus stereo panning and dub echo throws on the mixing board, and a transport for the music.

- **↔️ Pan** on every strip of the mixing board: from 10 to the left to 10 to the right. The dry sound moves, and the echo and the room stay in the middle.
- **🌊 Throw,** the dub engineer's trick, on every strip: hold it, and everything that part plays goes into the echo; let go, and it goes back to its own echo setting. A quick tap throws for a whole beat. On the whole tune's strip, **🌊 throw everything** throws every part at once.
- **⏯️ Where the tune is,** at the top of the 🎵 Music tab:
  - a slider across the whole tune, with its sections marked underneath and the one playing lit;
  - where it is in bars and beats ("bar 21 · beat 2 of 4 · section 3 of 6"), and in minutes and seconds at the tempo set ("0:53 / 2:05");
  - ⏸ pause and ▶ play, which carries on from the same place, and ⏮ rewind;
  - drag the slider and let go to jump there, while playing or paused.

  Choosing another tune plays it from the start.

## 0.0.7 (2026-10-12)

Everything in 0.0.6, plus longer tunes that change as they go, four more spooky tunes for the witch's woods, and a mixing board.

- **Every tune is longer and changes as it goes:** each now plays in sections, from about 1¼ to 2½ minutes before it starts again, with parts coming in and dropping out. There are quiet intros, breakdowns with only the drums and bass, a second melody, and some key changes: the calypso moves up a whole step for its last choruses, and the forest walk wanders up for a while.
- **Four more spooky tunes** for the witch's woods, beside the theremin waltz:
  - 🦇 bat-wing boogie: a low, buzzy bass line going round and round, plucked violins creeping over it, a ghostly voice in the break;
  - 🕯️ haunted harpsichord: broken chords over a bass that creeps down a step at a time, a ticking clock and a tolling bell;
  - 🔮 crystal-ball vibes: a spooky swing on vibraphone, with a walking bass, finger snaps, brushes and a theremin answering;
  - 🕷️ spider's tiptoe: plucked violins on tiptoe over plucked cellos, with drips and a ghost in the break.

  New instruments: a buzzy bass, a harpsichord, a vibraphone (with its wobble) and a plucked violin. Tunes can swing their eighth notes too.
- **🎚️ The mixing board,** in the 🎵 Music tab, for the tune playing:
  - each part has its own strip, with a light that blinks as it plays, so you can see the parts come and go;
  - each strip has 🔇 mute, 🎧 solo, 🔊 level (−10 to +10 dB), 🌊 echo and 🏛️ room (how much of it goes to the echo and the reverb), and 🎛️ tone (a filter from dark to bright, for dub sweeps);
  - for the whole tune: 🌊 echo repeats, ⏱️ echo time (in steps, kept in time with the tempo) and 🏛️ room, and ↺ reset the mix;
  - the mix is kept for each tune and saved with the friend; 🎲 Surprise me leaves it alone, and ↺ Start over clears it.

## 0.0.6 (2026-10-12)

Everything in 0.0.5, plus four more Caribbean and reggae tunes.

- **Four more Caribbean and reggae tunes** in the 🎵 Music tab, six in all for the beach and under the sea:
  - 🥁 beach soca jump-up: fast, a kick on every beat, a cowbell, and a bouncing steel-pan riff;
  - 🌴 sunny reggae: a major-key one-drop, with a guitar's chop, the organ's quick "bubble" between the beats, and a melodica tune;
  - 🐢 turtle steppers dub: a kick on every beat under the sea, a deep rolling bass, the chop and the melodica deep in echo, and a far-off ping like sonar;
  - 🎐 steel-pan lullaby: slow and gentle, one steel pan singing over another's broken chords, with a soft bass and bubbles.

  Each background keeps its own tune as before (beach calypso, bubble reggae), and the new tunes sit in the list beside their scene's own. New instruments: a snare, a cowbell, a reggae guitar's chop and a melodica.

## 0.0.5 (2026-10-12)

Everything in 0.0.4, plus music, and the skulls' blinking in or out of sync. Tested at home before release.

- **💀 skull eyes blink in sync / out of sync:** a chip in the witch's woods. In sync, every skull's eyes blink together, as before. Out of sync, each skull (on the fence and the buried skeletons) blinks at its own pace, from half to one and a half times the blink rate, starting from its own place in the blink. Both eyes of one skull stay together, and a redraw keeps each skull where it was. The chip shows while the eyes blink and glow.
- **🎵 Music, a first cut:** each background plays a tune of its own, made by the game's own little synthesizers from notes written as MIDI numbers (no sound files):
  - 🌲 forest: a walk in the woods (flute, plucked strings and birds);
  - 🏖️ beach: calypso (steel pan, strummed guitar and congas);
  - 🐠 underwater: bubble reggae (one-drop drums, organ chops in a dub echo, bubbles);
  - 🧙 witch's woods: a spooky waltz (a ghostly wavering voice and a tolling bell);
  - 🌿 cemetery: a peaceful garden (a music box over a soft pad, a gentle flute).

  The 🎵 Music tab plays the scene's own tune, or any tune over any background. It has a volume slider and a mute chip, and a 🔊/🔇 button sits in the picture's top-left corner. There is no music without a background, unless a tune is picked. The sound starts with the first tap, as browsers require, and rests while the page is hidden. 🎲 Surprise me leaves the music alone, and Load and ↺ Start over keep the volume and mute.
- **🏃 Tempo and 🎹 transpose** in the 🎵 Music tab:
  - Tempo runs from 25% to 300% of the tune's own speed. A change carries the tune on from where it is, at the new pace, with the echo kept in time.
  - Transpose moves the tune from 24 half steps down to 24 up. The drums keep their sound.
  - The "playing" line says the beats a minute and how far the tune is moved.
  - Both go with the friend, like the tune choice: Load brings them back, and Start over resets them.

## 0.0.4 (2026-10-12)

Everything in 0.0.3, with the skulls on the witch's fence refined.

- **Each skull has its own size,** from the usual size (the smallest) up to three times bigger.
- **💀 skulls: biggest size** sets how big the biggest skull may be: from 100% (all the usual size) to 3000%, ten times the new usual biggest, for silly-huge skulls that tower over the woods.
- **💀 skull eye size** (50% to 500%) makes the skulls' eyes bigger or smaller. As on a face, bigger eyes grow the skull to hold them: its sides and top move out, and its nose and jaw move down. The red glow stays its share of the eye.
- Each skull stays on its stake, growing up and out from the tip, and is drawn in front of the whole fence, so a big skull covers the stakes beside it.
- The old "skull eyes: size" slider is now **💀 skull eyes: red glow size**, which is what it always set.

## 0.0.3 (2026-10-12)

Everything in 0.0.2, with each hand in its own column.

- **With the hands the same,** the right/left columns are gone. In 0.0.2 they showed in that mode too, under the one style menu. Below the color come the sliders for the style the hands wear.
- **With the hands different,** each column holds everything about its own hand: its style, and the sliders for that style, such as the number of fingers, the claws, the star's points, and the hand's angle. Each hand keeps its own values, so one hand can have 9 fingers and the other 5. Only the color and the size, which both hands share, stay below the columns.
- Different hands start as a copy of each other, with their style and every setting, then change on their own.
- A pinned slider from one hand's column says whose it is in the full-screen controls, such as "⬅️ right hand: ✋ number of fingers".
- 🎲 Surprise me picks each hand's settings on their own when the hands are different.
- Friends saved with 0.0.1 or 0.0.2 load as they were: their right hand takes its own style and keeps the settings it was drawn with.

## 0.0.2 (2026-10-12)

Everything in 0.0.1, with the hands' styles chosen in a new way. A player asked for it while still learning that a friend who faces you has their left hand on your right.

- **One chip says whether the hands are the same or different,** and a tap flips it: 🖐️🖐️ *hands are the same*, or 🖐️✊ *hands are different*. It replaces the "hand on the left" menu and its "same" choice.
- **Same hands have one style menu,** for both hands.
- **Different hands have a menu each,** side by side and mirrored about a dashed line, placed as the hands are in the picture. The friend faces us, so **⬅️ right hand** is on the left and **left hand ➡️** is on the right, each arrow pointing at its hand.
- Different hands start alike, and then each changes on its own.
- 🎲 Surprise me makes the hands different about one time in four, as before.
- Friends saved with 0.0.1 load as they were: their "hand on the left" was the friend's right hand, and it still is.

## 0.0.1 (2026-10-12)

The game as it was when it got its first version number: everything built from 2026-10-09 to 2026-10-11, with M and N choosing. Those are the 64 commits before this file.

### The face

- Skin and head color, with skin swatches that say what they mean (smiley, mad, sick, alien, witch).
- Head size up to 750, face width and height up to 600, and a face shape from round to alien. The head grows to hold big eyes, a big nose and a big mouth.
- Eyes:
  - size, gap (up to 600), shape (round to narrow) and angle (flat to slanted);
  - pupil, iris and eye-white colors and sizes;
  - a shine with its own light direction, color, brightness and size;
  - star eyes, heart eyes and x eyes.
- Eyebrows that rise above big eyes, or one big eyebrow.
- Noses:
  - side and front views in several shapes (L, <, soft, hook, bulbous), with height and width;
  - a witch nose that points left, out or right, at any length, with warts that grow with it.
- A mouth from a frown to a big smile, with its size and how open it is. Normal or spiky teeth, and a tongue that sticks out, with its length, width and color.
- Faces of feeling: side lines, an explosion (hair and hoods fly off), candy, head rays and sickness.

### The body

- Hair: none, short, long or curly, with a length.
- Neck length and width, arms up or down, arm length (up to 600) and width, and leg length and width. Raised arms go in front of the face.
- Hands, each style with its own angle all the way round:
  - human, with 1 to 100 fingers;
  - alien, with 1 to 99 fingers;
  - stars, with up to 100 points;
  - mittens;
  - claws: up to 100 of them, up to 900% long.

  The left hand can have its own style, and a hand closes round a broom.
- Feet: sneakers, boots, clown shoes, or bare feet with five toes, an alien's four or three, or talons.

### Clothes and costumes

- Tops: t-shirt, long sleeves or tank top, with a collar, color and pattern (pattern size and color).
- Bottoms: long pants, shorts, a skirt (with its length) or a dress.
- Swimwear and underwear (swim trunks, briefs, bikini), with or without a top.
- Animal costumes: tiger, black cat, lion with a mane, bear, peregrine falcon, raccoon, bobcat, leopard, bald eagle, cheetah, a falcon suit with arm wings, black jaguar, wolf and deer.
  - The cats have claws.
  - The hoods hug the head at any height.
  - Tiger stripes wrap round each part, as Daniel Tiger's do.
- A witch:
  - her hat and dress in one color, with orange trim;
  - a web pattern all over the dress, or a few webs;
  - buckled boots and a buckled belt;
  - a tuxedo cat on her shoulder in any colors, and a broom, each sized from 10% to 1000%.

### Scenes

- Five backgrounds:
  - a forest;
  - under the sea, with sharks at a picnic table, forks in their fins;
  - a beach;
  - a peaceful cemetery;
  - the witch's woods: a hut on chicken legs that can grow and come nearer, a skull palisade whose red eyes blink together, skeletons, a cauldron, dead trees and big roots.
- In a scene, the figure stands on a fixed stage, where it can be dragged and sized.

### Playing and keeping

- **🎲 Surprise me:** a random friend, sometimes with irises, slanted eyes or a new head shape.
- **💾 Save:** a picture (.png), a drawing that prints at any size (.svg) and the settings (.json), named by the date and time.
- **📂 Load** a saved friend, and **↺ Start over**.
- Full screen, with sliders pinned to a heads-up display.
- Pinch and pan on tablets, and one file per tap on phones.
