# Messed Up Dress Up: versions

Each version lists the game's features as of that version. The newest version is first.

## Unreleased

Changes since 0.0.7, for the next version. They are not deployed yet: the version and the deploy wait for Matthew's go-ahead.

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
