# Dress Up: what stands in each place

The formal list of every place's objects (ticket 99), as of 0.0.198, at the default settings, each with its picture (ticket 180). A slider that adds things (more toys, more ducks, more chairs) adds objects.

- **Depth** is the y where a thing stands on the ground, in the stage's units: the ground line is at 320, and the friend's feet can be anywhere from about 11 (far) to 406 (near).
- The friend is drawn behind every object deeper than their feet, and in front of the rest. **front** means in front of everything: the friend is always under it (darkness, light, steam, the sign toward us).
- Flat things on the ground and the backdrop (sky, far hills, back walls and what hangs on them) are not objects.
- In the game each place shows this list in its background tab, with an 👁️ chip per object to hide or show it.
- **The pictures:** each place as it starts, the friend hidden and its animations held still; each object clipped from that picture by its box on the screen, so what stands near it shows too. Drawn by GitHub's headless Chrome.

Made by `tools/checks/objects180.mjs` (on GitHub's computers: push a branch carrying it) and `tools/objects_md.py`. Make it again after changing what stands in a place.

## 🔲 empty room

(0.0.77, ticket 153.) Nothing stands here: the friend is in front of everything. Its back wall is solid, as the imagination's is.

<img src="objects/emptyroom/place.webp" alt="🔲 empty room, as it starts" width="480">

## 🫧 bubble space

<img src="objects/bubblespace/place.webp" alt="🫧 bubble space, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| front | bubbles | <img src="objects/bubblespace/bubbles.webp" alt="bubbles" height="72"> |

## 💭 our imagination

(0.0.75, ticket 145: its ladders, one at each column's right, at the wall's foot. Its back wall is solid: the friend's feet stay at 271.5 or nearer.)

<img src="objects/imagination/place.webp" alt="💭 our imagination, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 268.5 | ladder 1 | <img src="objects/imagination/ladder-1.webp" alt="ladder 1" height="72"> |
| 268.5 | ladder 2 | <img src="objects/imagination/ladder-2.webp" alt="ladder 2" height="72"> |
| 268.5 | ladder 3 | <img src="objects/imagination/ladder-3.webp" alt="ladder 3" height="72"> |
| 268.5 | ladder 4 | <img src="objects/imagination/ladder-4.webp" alt="ladder 4" height="72"> |
| 268.5 | ladder 5 | <img src="objects/imagination/ladder-5.webp" alt="ladder 5" height="72"> |
| 268.5 | ladder 6 | <img src="objects/imagination/ladder-6.webp" alt="ladder 6" height="72"> |

## 🌲 forest

<img src="objects/forest/place.webp" alt="🌲 forest, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 234.1 | pines, far row | <img src="objects/forest/pines-far-row.webp" alt="pines, far row" height="72"> |
| 277.1 | pines, near row | <img src="objects/forest/pines-near-row.webp" alt="pines, near row" height="72"> |
| 285.6 | butterflies | <img src="objects/forest/butterflies.webp" alt="butterflies" height="72"> |
| 345.8 | big tree, left, inner | <img src="objects/forest/big-tree-left-inner.webp" alt="big tree, left, inner" height="72"> |
| 345.8 | big tree, right, inner | <img src="objects/forest/big-tree-right-inner.webp" alt="big tree, right, inner" height="72"> |
| 371.5 | big tree, left, outer | <img src="objects/forest/big-tree-left-outer.webp" alt="big tree, left, outer" height="72"> |
| 371.5 | big tree, right, outer | <img src="objects/forest/big-tree-right-outer.webp" alt="big tree, right, outer" height="72"> |
| front | way N | <img src="objects/forest/way-n.webp" alt="way N" height="72"> |
| front | way NE | <img src="objects/forest/way-ne.webp" alt="way NE" height="72"> |
| front | way E | <img src="objects/forest/way-e.webp" alt="way E" height="72"> |
| front | way SE | <img src="objects/forest/way-se.webp" alt="way SE" height="72"> |
| front | way S | <img src="objects/forest/way-s.webp" alt="way S" height="72"> |

## 🐠 underwater

<img src="objects/underwater/place.webp" alt="🐠 underwater, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 259.9 | orange fish | <img src="objects/underwater/orange-fish.webp" alt="orange fish" height="72"> |
| 259.9 | yellow fish | <img src="objects/underwater/yellow-fish.webp" alt="yellow fish" height="72"> |
| 259.9 | pink fish | <img src="objects/underwater/pink-fish.webp" alt="pink fish" height="72"> |
| 259.9 | blue fish | <img src="objects/underwater/blue-fish.webp" alt="blue fish" height="72"> |
| 337.2 | seaweed, left | <img src="objects/underwater/seaweed-left.webp" alt="seaweed, left" height="72"> |
| 337.2 | seaweed, right | <img src="objects/underwater/seaweed-right.webp" alt="seaweed, right" height="72"> |
| 340.6 | rock, left 3 | <img src="objects/underwater/rock-left-3.webp" alt="rock, left 3" height="72"> |
| 344.7 | rock, left 2 | <img src="objects/underwater/rock-left-2.webp" alt="rock, left 2" height="72"> |
| 345.8 | shipwreck | <img src="objects/underwater/shipwreck.webp" alt="shipwreck" height="72"> |
| 345.8 | picnic bench | <img src="objects/underwater/picnic-bench.webp" alt="picnic bench" height="72"> |
| 345.8 | shark, left | <img src="objects/underwater/shark-left.webp" alt="shark, left" height="72"> |
| 345.8 | shark, right | <img src="objects/underwater/shark-right.webp" alt="shark, right" height="72"> |
| 345.8 | picnic table | <img src="objects/underwater/picnic-table.webp" alt="picnic table" height="72"> |
| 347.2 | rock, right 2 | <img src="objects/underwater/rock-right-2.webp" alt="rock, right 2" height="72"> |
| 358.9 | rock, right 1 | <img src="objects/underwater/rock-right-1.webp" alt="rock, right 1" height="72"> |
| 362.3 | rock, left 1 | <img src="objects/underwater/rock-left-1.webp" alt="rock, left 1" height="72"> |
| front | bubbles | <img src="objects/underwater/bubbles.webp" alt="bubbles" height="72"> |

## 🪸 deep sea

<img src="objects/deepsea/place.webp" alt="🪸 deep sea, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 238.4 | school of fish | <img src="objects/deepsea/school-of-fish.webp" alt="school of fish" height="72"> |
| 340.6 | kelp, left | <img src="objects/deepsea/kelp-left.webp" alt="kelp, left" height="72"> |
| 340.6 | kelp, right | <img src="objects/deepsea/kelp-right.webp" alt="kelp, right" height="72"> |
| 342 | rock, left 2 | <img src="objects/deepsea/rock-left-2.webp" alt="rock, left 2" height="72"> |
| 349.8 | rock, left 1 | <img src="objects/deepsea/rock-left-1.webp" alt="rock, left 1" height="72"> |
| 354.4 | vent | <img src="objects/deepsea/vent.webp" alt="vent" height="72"> |
| 354.5 | rock, right 2 | <img src="objects/deepsea/rock-right-2.webp" alt="rock, right 2" height="72"> |
| 365.4 | rock, right 1 | <img src="objects/deepsea/rock-right-1.webp" alt="rock, right 1" height="72"> |
| front | way E | <img src="objects/deepsea/way-e.webp" alt="way E" height="72"> |
| front | way S | <img src="objects/deepsea/way-s.webp" alt="way S" height="72"> |

## 🏖️ beach

<img src="objects/beach/place.webp" alt="🏖️ beach, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 328.6 | beach chair, left | <img src="objects/beach/beach-chair-left.webp" alt="beach chair, left" height="72"> |
| 328.6 | beach chair, right | <img src="objects/beach/beach-chair-right.webp" alt="beach chair, right" height="72"> |
| 337.2 | umbrella, left | <img src="objects/beach/umbrella-left.webp" alt="umbrella, left" height="72"> |
| 337.2 | umbrella, right | <img src="objects/beach/umbrella-right.webp" alt="umbrella, right" height="72"> |
| 354.4 | palm tree, left | <img src="objects/beach/palm-tree-left.webp" alt="palm tree, left" height="72"> |
| 354.4 | palm tree, right | <img src="objects/beach/palm-tree-right.webp" alt="palm tree, right" height="72"> |
| 358.6 | sand castle, left | <img src="objects/beach/sand-castle-left.webp" alt="sand castle, left" height="72"> |
| 358.6 | sand castle, right | <img src="objects/beach/sand-castle-right.webp" alt="sand castle, right" height="72"> |
| front | way N | <img src="objects/beach/way-n.webp" alt="way N" height="72"> |
| front | way NE | <img src="objects/beach/way-ne.webp" alt="way NE" height="72"> |
| front | way E | <img src="objects/beach/way-e.webp" alt="way E" height="72"> |
| front | way SE | <img src="objects/beach/way-se.webp" alt="way SE" height="72"> |
| front | way S | <img src="objects/beach/way-s.webp" alt="way S" height="72"> |
| front | way SW | <img src="objects/beach/way-sw.webp" alt="way SW" height="72"> |
| front | way W | <img src="objects/beach/way-w.webp" alt="way W" height="72"> |
| front | way NW | <img src="objects/beach/way-nw.webp" alt="way NW" height="72"> |

## 🌊 open water

<img src="objects/sea/place.webp" alt="🌊 open water, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| front | way E | <img src="objects/sea/way-e.webp" alt="way E" height="72"> |
| front | way SE | <img src="objects/sea/way-se.webp" alt="way SE" height="72"> |
| front | way SW | <img src="objects/sea/way-sw.webp" alt="way SW" height="72"> |
| front | way W | <img src="objects/sea/way-w.webp" alt="way W" height="72"> |

## 🧙 witch's woods

<img src="objects/witch/place.webp" alt="🧙 witch's woods, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 212.6 | dead trees, far row | <img src="objects/witch/dead-trees-far-row.webp" alt="dead trees, far row" height="72"> |
| 245.3 | dead trees, near row | <img src="objects/witch/dead-trees-near-row.webp" alt="dead trees, near row" height="72"> |
| 278.8 | hut | <img src="objects/witch/hut.webp" alt="hut" height="72"> |
| 297.7 | fence | <img src="objects/witch/fence.webp" alt="fence" height="72"> |
| 297.7 | skulls | <img src="objects/witch/skulls.webp" alt="skulls" height="72"> |
| 354.4 | giant tree | <img src="objects/witch/giant-tree.webp" alt="giant tree" height="72"> |
| 354.4 | tree, right | <img src="objects/witch/tree-right.webp" alt="tree, right" height="72"> |
| 364.7 | skeleton, left | <img src="objects/witch/skeleton-left.webp" alt="skeleton, left" height="72"> |
| 367.2 | cauldron | <img src="objects/witch/cauldron.webp" alt="cauldron" height="72"> |
| 376.7 | skeleton, right | <img src="objects/witch/skeleton-right.webp" alt="skeleton, right" height="72"> |
| 380.1 | skeleton, right edge | <img src="objects/witch/skeleton-right-edge.webp" alt="skeleton, right edge" height="72"> |
| 383.6 | skeleton, left edge | <img src="objects/witch/skeleton-left-edge.webp" alt="skeleton, left edge" height="72"> |
| front | way E | <img src="objects/witch/way-e.webp" alt="way E" height="72"> |
| front | way SE | <img src="objects/witch/way-se.webp" alt="way SE" height="72"> |
| front | way S | <img src="objects/witch/way-s.webp" alt="way S" height="72"> |

## 🌿 cemetery

<img src="objects/cemetery/place.webp" alt="🌿 cemetery, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 242.7 | far trees | <img src="objects/cemetery/far-trees.webp" alt="far trees" height="72"> |
| 259.9 | butterflies | <img src="objects/cemetery/butterflies.webp" alt="butterflies" height="72"> |
| 275.3 | far stones | <img src="objects/cemetery/far-stones.webp" alt="far stones" height="72"> |
| 294.2 | yellow bush | <img src="objects/cemetery/yellow-bush.webp" alt="yellow bush" height="72"> |
| 301.5 | willow | <img src="objects/cemetery/willow.webp" alt="willow" height="72"> |
| 318.3 | green bush | <img src="objects/cemetery/green-bush.webp" alt="green bush" height="72"> |
| 323.4 | headstone, left | <img src="objects/cemetery/headstone-left.webp" alt="headstone, left" height="72"> |
| 325.2 | cross | <img src="objects/cemetery/cross.webp" alt="cross" height="72"> |
| 342.3 | headstone, right | <img src="objects/cemetery/headstone-right.webp" alt="headstone, right" height="72"> |
| 345.8 | stag stone | <img src="objects/cemetery/stag-stone.webp" alt="stag stone" height="72"> |
| 345.8 | pink bush | <img src="objects/cemetery/pink-bush.webp" alt="pink bush" height="72"> |
| 349.2 | white bush | <img src="objects/cemetery/white-bush.webp" alt="white bush" height="72"> |
| front | way N | <img src="objects/cemetery/way-n.webp" alt="way N" height="72"> |
| front | way NE | <img src="objects/cemetery/way-ne.webp" alt="way NE" height="72"> |
| front | way E | <img src="objects/cemetery/way-e.webp" alt="way E" height="72"> |
| front | way W | <img src="objects/cemetery/way-w.webp" alt="way W" height="72"> |
| front | way NW | <img src="objects/cemetery/way-nw.webp" alt="way NW" height="72"> |

## 🦆 lake

<img src="objects/lake/place.webp" alt="🦆 lake, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 105.3 | far wood | <img src="objects/lake/far-wood.webp" alt="far wood" height="72"> |
| 125.8 | duck 1 | <img src="objects/lake/duck-1.webp" alt="duck 1" height="72"> |
| 142.9 | duck 5 | <img src="objects/lake/duck-5.webp" alt="duck 5" height="72"> |
| 167.2 | duck 3 | <img src="objects/lake/duck-3.webp" alt="duck 3" height="72"> |
| 192.6 | duck 2 | <img src="objects/lake/duck-2.webp" alt="duck 2" height="72"> |
| 198.8 | duck 4 | <img src="objects/lake/duck-4.webp" alt="duck 4" height="72"> |
| 264.2 | cattails, left | <img src="objects/lake/cattails-left.webp" alt="cattails, left" height="72"> |
| 264.2 | cattails, right | <img src="objects/lake/cattails-right.webp" alt="cattails, right" height="72"> |
| front | way N | <img src="objects/lake/way-n.webp" alt="way N" height="72"> |
| front | way E | <img src="objects/lake/way-e.webp" alt="way E" height="72"> |
| front | way SE | <img src="objects/lake/way-se.webp" alt="way SE" height="72"> |
| front | way S | <img src="objects/lake/way-s.webp" alt="way S" height="72"> |
| front | way SW | <img src="objects/lake/way-sw.webp" alt="way SW" height="72"> |
| front | way W | <img src="objects/lake/way-w.webp" alt="way W" height="72"> |
| front | way NW | <img src="objects/lake/way-nw.webp" alt="way NW" height="72"> |

## 🏠 house and yard

<img src="objects/house/place.webp" alt="🏠 house and yard, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 169.7 | house | <img src="objects/house/house.webp" alt="house" height="72"> |
| 186.9 | tree, left | <img src="objects/house/tree-left.webp" alt="tree, left" height="72"> |
| 195.5 | tree, right | <img src="objects/house/tree-right.webp" alt="tree, right" height="72"> |
| 217.9 | teddy | <img src="objects/house/teddy.webp" alt="teddy" height="72"> |
| 220.1 | truck 2 | <img src="objects/house/truck-2.webp" alt="truck 2" height="72"> |
| 232.3 | wagon | <img src="objects/house/wagon.webp" alt="wagon" height="72"> |
| 233.2 | ball | <img src="objects/house/ball.webp" alt="ball" height="72"> |
| 252.9 | blocks | <img src="objects/house/blocks.webp" alt="blocks" height="72"> |
| 267 | truck | <img src="objects/house/truck.webp" alt="truck" height="72"> |
| 268.5 | butterflies | <img src="objects/house/butterflies.webp" alt="butterflies" height="72"> |
| 354.1 | ball 2 | <img src="objects/house/ball-2.webp" alt="ball 2" height="72"> |
| 364.2 | bucket | <img src="objects/house/bucket.webp" alt="bucket" height="72"> |
| front | way N | <img src="objects/house/way-n.webp" alt="way N" height="72"> |
| front | way NE | <img src="objects/house/way-ne.webp" alt="way NE" height="72"> |
| front | way E | <img src="objects/house/way-e.webp" alt="way E" height="72"> |
| front | way SE | <img src="objects/house/way-se.webp" alt="way SE" height="72"> |
| front | way S | <img src="objects/house/way-s.webp" alt="way S" height="72"> |
| front | way SW | <img src="objects/house/way-sw.webp" alt="way SW" height="72"> |
| front | way W | <img src="objects/house/way-w.webp" alt="way W" height="72"> |
| front | way NW | <img src="objects/house/way-nw.webp" alt="way NW" height="72"> |

## 🌳 tree house

<img src="objects/treehouse/place.webp" alt="🌳 tree house, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 214.4 | trees, far row | <img src="objects/treehouse/trees-far-row.webp" alt="trees, far row" height="72"> |
| 268.5 | butterflies | <img src="objects/treehouse/butterflies.webp" alt="butterflies" height="72"> |
| 287.4 | trees, left | <img src="objects/treehouse/trees-left.webp" alt="trees, left" height="72"> |
| 287.4 | trees, right | <img src="objects/treehouse/trees-right.webp" alt="trees, right" height="72"> |
| 307.9 | bush, left 5 | <img src="objects/treehouse/bush-left-5.webp" alt="bush, left 5" height="72"> |
| 309.4 | bush, left 1 | <img src="objects/treehouse/bush-left-1.webp" alt="bush, left 1" height="72"> |
| 314.2 | bush, left 4 | <img src="objects/treehouse/bush-left-4.webp" alt="bush, left 4" height="72"> |
| 315.5 | bush, right 3 | <img src="objects/treehouse/bush-right-3.webp" alt="bush, right 3" height="72"> |
| 320 | tree house | <img src="objects/treehouse/tree-house.webp" alt="tree house" height="72"> |
| 320.7 | bush, left 8 | <img src="objects/treehouse/bush-left-8.webp" alt="bush, left 8" height="72"> |
| 334.9 | bush, right 1 | <img src="objects/treehouse/bush-right-1.webp" alt="bush, right 1" height="72"> |
| 337.3 | bush, left 6 | <img src="objects/treehouse/bush-left-6.webp" alt="bush, left 6" height="72"> |
| 337.7 | bush, right 2 | <img src="objects/treehouse/bush-right-2.webp" alt="bush, right 2" height="72"> |
| 341.5 | bush, left 3 | <img src="objects/treehouse/bush-left-3.webp" alt="bush, left 3" height="72"> |
| 342.6 | bush, left 2 | <img src="objects/treehouse/bush-left-2.webp" alt="bush, left 2" height="72"> |
| 345.5 | bush, right 8 | <img src="objects/treehouse/bush-right-8.webp" alt="bush, right 8" height="72"> |
| 346.8 | bush, left 7 | <img src="objects/treehouse/bush-left-7.webp" alt="bush, left 7" height="72"> |
| front | way S | <img src="objects/treehouse/way-s.webp" alt="way S" height="72"> |
| front | way SW | <img src="objects/treehouse/way-sw.webp" alt="way SW" height="72"> |
| front | way W | <img src="objects/treehouse/way-w.webp" alt="way W" height="72"> |

## 🛋️ living room

<img src="objects/livingroom/place.webp" alt="🛋️ living room, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 242.7 | lamp | <img src="objects/livingroom/lamp.webp" alt="lamp" height="72"> |
| 259.9 | plant | <img src="objects/livingroom/plant.webp" alt="plant" height="72"> |
| 285.6 | couch | <img src="objects/livingroom/couch.webp" alt="couch" height="72"> |
| front | way S | <img src="objects/livingroom/way-s.webp" alt="way S" height="72"> |

## 🧙 inside the witch's hut

<img src="objects/witchroom/place.webp" alt="🧙 inside the witch's hut, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 253 | snake tank | <img src="objects/witchroom/snake-tank.webp" alt="snake tank" height="72"> |
| 277.1 | cauldron | <img src="objects/witchroom/cauldron.webp" alt="cauldron" height="72"> |
| 320 | witch | <img src="objects/witchroom/witch.webp" alt="witch" height="72"> |
| front | dark | <img src="objects/witchroom/dark.webp" alt="dark" height="72"> |

## 🌲 forest clearing

<img src="objects/clearing/place.webp" alt="🌲 forest clearing, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 136.2 | far woods | <img src="objects/clearing/far-woods.webp" alt="far woods" height="72"> |
| 204.9 | castle | <img src="objects/clearing/castle.webp" alt="castle" height="72"> |
| 205.3 | tree house | <img src="objects/clearing/tree-house.webp" alt="tree house" height="72"> |
| 226.6 | house | <img src="objects/clearing/house.webp" alt="house" height="72"> |
| 252.3 | witch hut | <img src="objects/clearing/witch-hut.webp" alt="witch hut" height="72"> |
| 271.2 | healer hut | <img src="objects/clearing/healer-hut.webp" alt="healer hut" height="72"> |
| 345.8 | butterflies | <img src="objects/clearing/butterflies.webp" alt="butterflies" height="72"> |
| 354.4 | tree, left, outer | <img src="objects/clearing/tree-left-outer.webp" alt="tree, left, outer" height="72"> |
| 354.4 | tree, right, outer | <img src="objects/clearing/tree-right-outer.webp" alt="tree, right, outer" height="72"> |
| 388.7 | tree, left, inner | <img src="objects/clearing/tree-left-inner.webp" alt="tree, left, inner" height="72"> |
| 388.7 | tree, right, inner | <img src="objects/clearing/tree-right-inner.webp" alt="tree, right, inner" height="72"> |
| front | way N | <img src="objects/clearing/way-n.webp" alt="way N" height="72"> |
| front | way NE | <img src="objects/clearing/way-ne.webp" alt="way NE" height="72"> |
| front | way E | <img src="objects/clearing/way-e.webp" alt="way E" height="72"> |
| front | way SE | <img src="objects/clearing/way-se.webp" alt="way SE" height="72"> |
| front | way S | <img src="objects/clearing/way-s.webp" alt="way S" height="72"> |
| front | way SW | <img src="objects/clearing/way-sw.webp" alt="way SW" height="72"> |
| front | way W | <img src="objects/clearing/way-w.webp" alt="way W" height="72"> |
| front | way NW | <img src="objects/clearing/way-nw.webp" alt="way NW" height="72"> |

## 🌿 inside the healer's hut

<img src="objects/healerroom/place.webp" alt="🌿 inside the healer's hut, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 234.1 | potion shelves | <img src="objects/healerroom/potion-shelves.webp" alt="potion shelves" height="72"> |
| 234.1 | cat | <img src="objects/healerroom/cat.webp" alt="cat" height="72"> |
| 320 | soup pot | <img src="objects/healerroom/soup-pot.webp" alt="soup pot" height="72"> |
| 320 | healer | <img src="objects/healerroom/healer.webp" alt="healer" height="72"> |
| 385.3 | tea table | <img src="objects/healerroom/tea-table.webp" alt="tea table" height="72"> |
| 387 | chair, left | <img src="objects/healerroom/chair-left.webp" alt="chair, left" height="72"> |
| 387 | chair, right | <img src="objects/healerroom/chair-right.webp" alt="chair, right" height="72"> |
| 392.1 | worktable | <img src="objects/healerroom/worktable.webp" alt="worktable" height="72"> |
| front | warm light | <img src="objects/healerroom/warm-light.webp" alt="warm light" height="72"> |

## 🧚 fairy forest

<img src="objects/fairyforest/place.webp" alt="🧚 fairy forest, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 196.3 | trees, far row | <img src="objects/fairyforest/trees-far-row.webp" alt="trees, far row" height="72"> |
| 230.7 | trees, near row | <img src="objects/fairyforest/trees-near-row.webp" alt="trees, near row" height="72"> |
| 316.8 | toadstool 11 | <img src="objects/fairyforest/toadstool-11.webp" alt="toadstool 11" height="72"> |
| 317.5 | toadstool 12 | <img src="objects/fairyforest/toadstool-12.webp" alt="toadstool 12" height="72"> |
| 324 | toadstool 10 | <img src="objects/fairyforest/toadstool-10.webp" alt="toadstool 10" height="72"> |
| 325.2 | bush | <img src="objects/fairyforest/bush.webp" alt="bush" height="72"> |
| 325.4 | toadstool 13 | <img src="objects/fairyforest/toadstool-13.webp" alt="toadstool 13" height="72"> |
| 333.6 | toadstool 9 | <img src="objects/fairyforest/toadstool-9.webp" alt="toadstool 9" height="72"> |
| 337.2 | great tree | <img src="objects/fairyforest/great-tree.webp" alt="great tree" height="72"> |
| 337.2 | fairy house | <img src="objects/fairyforest/fairy-house.webp" alt="fairy house" height="72"> |
| 341.5 | toadstool 14 | <img src="objects/fairyforest/toadstool-14.webp" alt="toadstool 14" height="72"> |
| 349.4 | toadstool 8 | <img src="objects/fairyforest/toadstool-8.webp" alt="toadstool 8" height="72"> |
| 357.2 | toadstool 1 | <img src="objects/fairyforest/toadstool-1.webp" alt="toadstool 1" height="72"> |
| 370.6 | toadstool 7 | <img src="objects/fairyforest/toadstool-7.webp" alt="toadstool 7" height="72"> |
| 371.5 | stone, left | <img src="objects/fairyforest/stone-left.webp" alt="stone, left" height="72"> |
| 371.7 | toadstool 2 | <img src="objects/fairyforest/toadstool-2.webp" alt="toadstool 2" height="72"> |
| 382.7 | toadstool 6 | <img src="objects/fairyforest/toadstool-6.webp" alt="toadstool 6" height="72"> |
| 386.7 | toadstool 3 | <img src="objects/fairyforest/toadstool-3.webp" alt="toadstool 3" height="72"> |
| 390.7 | toadstool 5 | <img src="objects/fairyforest/toadstool-5.webp" alt="toadstool 5" height="72"> |
| 391.7 | toadstool 4 | <img src="objects/fairyforest/toadstool-4.webp" alt="toadstool 4" height="72"> |
| 397.3 | stone, right | <img src="objects/fairyforest/stone-right.webp" alt="stone, right" height="72"> |
| front | sparkles | <img src="objects/fairyforest/sparkles.webp" alt="sparkles" height="72"> |
| front | way N | <img src="objects/fairyforest/way-n.webp" alt="way N" height="72"> |
| front | way SW | <img src="objects/fairyforest/way-sw.webp" alt="way SW" height="72"> |
| front | way W | <img src="objects/fairyforest/way-w.webp" alt="way W" height="72"> |
| front | way NW | <img src="objects/fairyforest/way-nw.webp" alt="way NW" height="72"> |

## ⛰️ mountain trail

<img src="objects/mountains/place.webp" alt="⛰️ mountain trail, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 191.2 | birds | <img src="objects/mountains/birds.webp" alt="birds" height="72"> |
| 322.9 | pine, right 1 | <img src="objects/mountains/pine-right-1.webp" alt="pine, right 1" height="72"> |
| 326.6 | pine, right 4 | <img src="objects/mountains/pine-right-4.webp" alt="pine, right 4" height="72"> |
| 327.6 | pine, right 2 | <img src="objects/mountains/pine-right-2.webp" alt="pine, right 2" height="72"> |
| 329.6 | rock, left 5 | <img src="objects/mountains/rock-left-5.webp" alt="rock, left 5" height="72"> |
| 330.2 | pine, left 2 | <img src="objects/mountains/pine-left-2.webp" alt="pine, left 2" height="72"> |
| 334 | pine, left 3 | <img src="objects/mountains/pine-left-3.webp" alt="pine, left 3" height="72"> |
| 338.2 | rock, left 2 | <img src="objects/mountains/rock-left-2.webp" alt="rock, left 2" height="72"> |
| 338.9 | pine, right 3 | <img src="objects/mountains/pine-right-3.webp" alt="pine, right 3" height="72"> |
| 339.1 | pine, left 1 | <img src="objects/mountains/pine-left-1.webp" alt="pine, left 1" height="72"> |
| 344.1 | pine, left 4 | <img src="objects/mountains/pine-left-4.webp" alt="pine, left 4" height="72"> |
| 349.1 | rock, right 4 | <img src="objects/mountains/rock-right-4.webp" alt="rock, right 4" height="72"> |
| 351 | rock, left 4 | <img src="objects/mountains/rock-left-4.webp" alt="rock, left 4" height="72"> |
| 351.7 | rock, left 1 | <img src="objects/mountains/rock-left-1.webp" alt="rock, left 1" height="72"> |
| 355.9 | rock, left 3 | <img src="objects/mountains/rock-left-3.webp" alt="rock, left 3" height="72"> |
| 364.1 | rock, right 2 | <img src="objects/mountains/rock-right-2.webp" alt="rock, right 2" height="72"> |
| 364.7 | rock, right 3 | <img src="objects/mountains/rock-right-3.webp" alt="rock, right 3" height="72"> |
| 369.1 | rock, right 1 | <img src="objects/mountains/rock-right-1.webp" alt="rock, right 1" height="72"> |
| front | way E | <img src="objects/mountains/way-e.webp" alt="way E" height="72"> |
| front | way SE | <img src="objects/mountains/way-se.webp" alt="way SE" height="72"> |
| front | way S | <img src="objects/mountains/way-s.webp" alt="way S" height="72"> |
| front | way SW | <img src="objects/mountains/way-sw.webp" alt="way SW" height="72"> |
| front | way W | <img src="objects/mountains/way-w.webp" alt="way W" height="72"> |

## 💦 jungle waterfall

<img src="objects/waterfall/place.webp" alt="💦 jungle waterfall, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 259.9 | mist | <img src="objects/waterfall/mist.webp" alt="mist" height="72"> |
| 259.9 | vines | <img src="objects/waterfall/vines.webp" alt="vines" height="72"> |
| 371.5 | jungle tree, left | <img src="objects/waterfall/jungle-tree-left.webp" alt="jungle tree, left" height="72"> |
| 371.5 | jungle tree, right | <img src="objects/waterfall/jungle-tree-right.webp" alt="jungle tree, right" height="72"> |
| 371.5 | parrot 1 | <img src="objects/waterfall/parrot-1.webp" alt="parrot 1" height="72"> |
| 371.5 | parrot 2 | <img src="objects/waterfall/parrot-2.webp" alt="parrot 2" height="72"> |
| front | way NE | <img src="objects/waterfall/way-ne.webp" alt="way NE" height="72"> |
| front | way E | <img src="objects/waterfall/way-e.webp" alt="way E" height="72"> |
| front | way SE | <img src="objects/waterfall/way-se.webp" alt="way SE" height="72"> |
| front | way S | <img src="objects/waterfall/way-s.webp" alt="way S" height="72"> |

## 🏕️ camp site

<img src="objects/campsite/place.webp" alt="🏕️ camp site, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 238.4 | woods | <img src="objects/campsite/woods.webp" alt="woods" height="72"> |
| 285.6 | orange tent | <img src="objects/campsite/orange-tent.webp" alt="orange tent" height="72"> |
| 290.8 | blue tent | <img src="objects/campsite/blue-tent.webp" alt="blue tent" height="72"> |
| 354.4 | campfire | <img src="objects/campsite/campfire.webp" alt="campfire" height="72"> |
| 392.1 | log, left | <img src="objects/campsite/log-left.webp" alt="log, left" height="72"> |
| 392.1 | log, right | <img src="objects/campsite/log-right.webp" alt="log, right" height="72"> |
| 452.3 | log, near |  |
| front | way N | <img src="objects/campsite/way-n.webp" alt="way N" height="72"> |
| front | way NE | <img src="objects/campsite/way-ne.webp" alt="way NE" height="72"> |
| front | way E | <img src="objects/campsite/way-e.webp" alt="way E" height="72"> |
| front | way SE | <img src="objects/campsite/way-se.webp" alt="way SE" height="72"> |
| front | way S | <img src="objects/campsite/way-s.webp" alt="way S" height="72"> |
| front | way SW | <img src="objects/campsite/way-sw.webp" alt="way SW" height="72"> |
| front | way W | <img src="objects/campsite/way-w.webp" alt="way W" height="72"> |

## ⛺ inside a tent

<img src="objects/tent/place.webp" alt="⛺ inside a tent, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 302.8 | flashlight beam | <img src="objects/tent/flashlight-beam.webp" alt="flashlight beam" height="72"> |

## 🪨 cave behind the falls

<img src="objects/cave/place.webp" alt="🪨 cave behind the falls, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 302.8 | big stalagmite, left | <img src="objects/cave/big-stalagmite-left.webp" alt="big stalagmite, left" height="72"> |
| 302.8 | small stalagmite, left | <img src="objects/cave/small-stalagmite-left.webp" alt="small stalagmite, left" height="72"> |
| 302.8 | big stalagmite, right | <img src="objects/cave/big-stalagmite-right.webp" alt="big stalagmite, right" height="72"> |
| 302.8 | small stalagmite, right | <img src="objects/cave/small-stalagmite-right.webp" alt="small stalagmite, right" height="72"> |
| 302.8 | stalactites | <img src="objects/cave/stalactites.webp" alt="stalactites" height="72"> |
| 302.8 | bats | <img src="objects/cave/bats.webp" alt="bats" height="72"> |
| 320 | chest | <img src="objects/cave/chest.webp" alt="chest" height="72"> |

## 🥾 path through the woods

<img src="objects/woodpath/place.webp" alt="🥾 path through the woods, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 168.8 | far trees | <img src="objects/woodpath/far-trees.webp" alt="far trees" height="72"> |
| 168.8 | sunbeams | <img src="objects/woodpath/sunbeams.webp" alt="sunbeams" height="72"> |
| 277.1 | butterflies | <img src="objects/woodpath/butterflies.webp" alt="butterflies" height="72"> |
| 337.2 | tree, left inner | <img src="objects/woodpath/tree-left-inner.webp" alt="tree, left inner" height="72"> |
| 345.8 | tree, right inner | <img src="objects/woodpath/tree-right-inner.webp" alt="tree, right inner" height="72"> |
| 350.9 | mushroom, right inner | <img src="objects/woodpath/mushroom-right-inner.webp" alt="mushroom, right inner" height="72"> |
| 354.4 | mushroom, left inner | <img src="objects/woodpath/mushroom-left-inner.webp" alt="mushroom, left inner" height="72"> |
| 371.5 | mushroom, right outer | <img src="objects/woodpath/mushroom-right-outer.webp" alt="mushroom, right outer" height="72"> |
| 380.1 | tree, left outer | <img src="objects/woodpath/tree-left-outer.webp" alt="tree, left outer" height="72"> |
| 380.1 | mushroom, left outer | <img src="objects/woodpath/mushroom-left-outer.webp" alt="mushroom, left outer" height="72"> |
| 388.7 | tree, right outer | <img src="objects/woodpath/tree-right-outer.webp" alt="tree, right outer" height="72"> |
| front | way N | <img src="objects/woodpath/way-n.webp" alt="way N" height="72"> |
| front | way NE | <img src="objects/woodpath/way-ne.webp" alt="way NE" height="72"> |
| front | way E | <img src="objects/woodpath/way-e.webp" alt="way E" height="72"> |
| front | way S | <img src="objects/woodpath/way-s.webp" alt="way S" height="72"> |
| front | way W | <img src="objects/woodpath/way-w.webp" alt="way W" height="72"> |
| front | way NW | <img src="objects/woodpath/way-nw.webp" alt="way NW" height="72"> |

## 🛤️ forest crossing

<img src="objects/crossing/place.webp" alt="🛤️ forest crossing, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 57.2 | far trees | <img src="objects/crossing/far-trees.webp" alt="far trees" height="72"> |
| 57.2 | sunbeams | <img src="objects/crossing/sunbeams.webp" alt="sunbeams" height="72"> |
| 277.1 | butterflies | <img src="objects/crossing/butterflies.webp" alt="butterflies" height="72"> |
| front | way N | <img src="objects/crossing/way-n.webp" alt="way N" height="72"> |
| front | way E | <img src="objects/crossing/way-e.webp" alt="way E" height="72"> |
| front | way S | <img src="objects/crossing/way-s.webp" alt="way S" height="72"> |
| front | way W | <img src="objects/crossing/way-w.webp" alt="way W" height="72"> |

## 🏰 castle

<img src="objects/castle/place.webp" alt="🏰 castle, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 204.9 | trees, far row | <img src="objects/castle/trees-far-row.webp" alt="trees, far row" height="72"> |
| 239.3 | trees, near row | <img src="objects/castle/trees-near-row.webp" alt="trees, near row" height="72"> |
| 290.8 | castle | <img src="objects/castle/castle.webp" alt="castle" height="72"> |
| 290.8 | gate | <img src="objects/castle/gate.webp" alt="gate" height="72"> |
| 337.5 | well | <img src="objects/castle/well.webp" alt="well" height="72"> |
| 358.3 | hay cart | <img src="objects/castle/hay-cart.webp" alt="hay cart" height="72"> |
| 370.2 | pennant, left | <img src="objects/castle/pennant-left.webp" alt="pennant, left" height="72"> |
| 370.2 | pennant, right | <img src="objects/castle/pennant-right.webp" alt="pennant, right" height="72"> |
| 371.5 | big tree, left, outer | <img src="objects/castle/big-tree-left-outer.webp" alt="big tree, left, outer" height="72"> |
| 371.5 | big tree, right, outer | <img src="objects/castle/big-tree-right-outer.webp" alt="big tree, right, outer" height="72"> |
| 372.3 | rock, left, inner | <img src="objects/castle/rock-left-inner.webp" alt="rock, left, inner" height="72"> |
| 376.7 | barrel, far | <img src="objects/castle/barrel-far.webp" alt="barrel, far" height="72"> |
| 379 | rock, right, outer | <img src="objects/castle/rock-right-outer.webp" alt="rock, right, outer" height="72"> |
| 383.6 | barrel, middle | <img src="objects/castle/barrel-middle.webp" alt="barrel, middle" height="72"> |
| 390.4 | rock, right, inner | <img src="objects/castle/rock-right-inner.webp" alt="rock, right, inner" height="72"> |
| 390.6 | rock, left, outer | <img src="objects/castle/rock-left-outer.webp" alt="rock, left, outer" height="72"> |
| 392.1 | barrel, near | <img src="objects/castle/barrel-near.webp" alt="barrel, near" height="72"> |
| 392.1 | crate | <img src="objects/castle/crate.webp" alt="crate" height="72"> |
| 414.5 | big tree, left, inner | <img src="objects/castle/big-tree-left-inner.webp" alt="big tree, left, inner" height="72"> |
| 414.5 | big tree, right, inner | <img src="objects/castle/big-tree-right-inner.webp" alt="big tree, right, inner" height="72"> |
| front | way S | <img src="objects/castle/way-s.webp" alt="way S" height="72"> |
| front | way SW | <img src="objects/castle/way-sw.webp" alt="way SW" height="72"> |
| front | way W | <img src="objects/castle/way-w.webp" alt="way W" height="72"> |

## 🪜 tree house room 1

<img src="objects/treeroom-1/place.webp" alt="🪜 tree house room 1, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | side doors | <img src="objects/treeroom-1/side-doors.webp" alt="side doors" height="72"> |
| 231.7 | bunk beds | <img src="objects/treeroom-1/bunk-beds.webp" alt="bunk beds" height="72"> |
| 237.5 | ladder up | <img src="objects/treeroom-1/ladder-up.webp" alt="ladder up" height="72"> |
| 237.9 | toy chest | <img src="objects/treeroom-1/toy-chest.webp" alt="toy chest" height="72"> |
| 250.3 | tree trunk | <img src="objects/treeroom-1/tree-trunk.webp" alt="tree trunk" height="72"> |
| 271.9 | hatch | <img src="objects/treeroom-1/hatch.webp" alt="hatch" height="72"> |
| front | house sign | <img src="objects/treeroom-1/house-sign.webp" alt="house sign" height="72"> |
| front | dark | <img src="objects/treeroom-1/dark.webp" alt="dark" height="72"> |

## 🪜 tree house room 2

<img src="objects/treeroom-2/place.webp" alt="🪜 tree house room 2, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | side doors | <img src="objects/treeroom-2/side-doors.webp" alt="side doors" height="72"> |
| 231.7 | counter | <img src="objects/treeroom-2/counter.webp" alt="counter" height="72"> |
| 231.7 | stove | <img src="objects/treeroom-2/stove.webp" alt="stove" height="72"> |
| 250.3 | tree trunk | <img src="objects/treeroom-2/tree-trunk.webp" alt="tree trunk" height="72"> |
| 271.9 | hatch | <img src="objects/treeroom-2/hatch.webp" alt="hatch" height="72"> |
| 277.5 | table | <img src="objects/treeroom-2/table.webp" alt="table" height="72"> |
| front | house sign | <img src="objects/treeroom-2/house-sign.webp" alt="house sign" height="72"> |
| front | dark | <img src="objects/treeroom-2/dark.webp" alt="dark" height="72"> |

## 🪜 tree house room 3

<img src="objects/treeroom-3/place.webp" alt="🪜 tree house room 3, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | side doors | <img src="objects/treeroom-3/side-doors.webp" alt="side doors" height="72"> |
| 237.9 | bookcase | <img src="objects/treeroom-3/bookcase.webp" alt="bookcase" height="72"> |
| 250.3 | tree trunk | <img src="objects/treeroom-3/tree-trunk.webp" alt="tree trunk" height="72"> |
| 262.7 | beanbag | <img src="objects/treeroom-3/beanbag.webp" alt="beanbag" height="72"> |
| 271.9 | hatch | <img src="objects/treeroom-3/hatch.webp" alt="hatch" height="72"> |
| front | house sign | <img src="objects/treeroom-3/house-sign.webp" alt="house sign" height="72"> |
| front | dark | <img src="objects/treeroom-3/dark.webp" alt="dark" height="72"> |

## 🪜 tree house room 4

<img src="objects/treeroom-4/place.webp" alt="🪜 tree house room 4, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | side doors | <img src="objects/treeroom-4/side-doors.webp" alt="side doors" height="72"> |
| 237.9 | telescope | <img src="objects/treeroom-4/telescope.webp" alt="telescope" height="72"> |
| 250.3 | tree trunk | <img src="objects/treeroom-4/tree-trunk.webp" alt="tree trunk" height="72"> |
| front | house sign | <img src="objects/treeroom-4/house-sign.webp" alt="house sign" height="72"> |
| front | dark | <img src="objects/treeroom-4/dark.webp" alt="dark" height="72"> |

## 🪜 tree house room 5

<img src="objects/treeroom-5/place.webp" alt="🪜 tree house room 5, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 237.5 | ladder up | <img src="objects/treeroom-5/ladder-up.webp" alt="ladder up" height="72"> |
| 239.1 | paint table | <img src="objects/treeroom-5/paint-table.webp" alt="paint table" height="72"> |
| 244.1 | easel | <img src="objects/treeroom-5/easel.webp" alt="easel" height="72"> |
| 250.3 | tree trunk | <img src="objects/treeroom-5/tree-trunk.webp" alt="tree trunk" height="72"> |
| front | house sign | <img src="objects/treeroom-5/house-sign.webp" alt="house sign" height="72"> |
| front | dark | <img src="objects/treeroom-5/dark.webp" alt="dark" height="72"> |

## 🪜 tree house room 6

<img src="objects/treeroom-6/place.webp" alt="🪜 tree house room 6, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 234.1 | drum kit | <img src="objects/treeroom-6/drum-kit.webp" alt="drum kit" height="72"> |
| 237.5 | ladder up | <img src="objects/treeroom-6/ladder-up.webp" alt="ladder up" height="72"> |
| 237.9 | keyboard | <img src="objects/treeroom-6/keyboard.webp" alt="keyboard" height="72"> |
| 250.3 | tree trunk | <img src="objects/treeroom-6/tree-trunk.webp" alt="tree trunk" height="72"> |
| front | house sign | <img src="objects/treeroom-6/house-sign.webp" alt="house sign" height="72"> |
| front | dark | <img src="objects/treeroom-6/dark.webp" alt="dark" height="72"> |

## 👑 king's room

<img src="objects/castleroom-king/place.webp" alt="👑 king's room, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | throne | <img src="objects/castleroom-king/throne.webp" alt="throne" height="72"> |
| 225.5 | chandelier | <img src="objects/castleroom-king/chandelier.webp" alt="chandelier" height="72"> |
| 225.5 | armor, left | <img src="objects/castleroom-king/armor-left.webp" alt="armor, left" height="72"> |
| 225.5 | armor, right | <img src="objects/castleroom-king/armor-right.webp" alt="armor, right" height="72"> |
| 225.5 | door 2 | <img src="objects/castleroom-king/door-2.webp" alt="door 2" height="72"> |
| 225.5 | door 3 | <img src="objects/castleroom-king/door-3.webp" alt="door 3" height="72"> |
| 268.5 | chest of gold | <img src="objects/castleroom-king/chest-of-gold.webp" alt="chest of gold" height="72"> |
| front | way S | <img src="objects/castleroom-king/way-s.webp" alt="way S" height="72"> |

## 🌿 greenhouse

<img src="objects/castleroom-greenhouse/place.webp" alt="🌿 greenhouse, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | parrots | <img src="objects/castleroom-greenhouse/parrots.webp" alt="parrots" height="72"> |
| 225.5 | arch to room 1 | <img src="objects/castleroom-greenhouse/arch-to-room-1.webp" alt="arch to room 1" height="72"> |
| 225.5 | arch to room 2 | <img src="objects/castleroom-greenhouse/arch-to-room-2.webp" alt="arch to room 2" height="72"> |
| 225.5 | arch to room 3 | <img src="objects/castleroom-greenhouse/arch-to-room-3.webp" alt="arch to room 3" height="72"> |
| 230.7 | ferns | <img src="objects/castleroom-greenhouse/ferns.webp" alt="ferns" height="72"> |
| 232.4 | bird of paradise, right | <img src="objects/castleroom-greenhouse/bird-of-paradise-right.webp" alt="bird of paradise, right" height="72"> |
| 234.1 | bird of paradise, left | <img src="objects/castleroom-greenhouse/bird-of-paradise-left.webp" alt="bird of paradise, left" height="72"> |
| 237.5 | monstera, left | <img src="objects/castleroom-greenhouse/monstera-left.webp" alt="monstera, left" height="72"> |
| 239.3 | monstera, right | <img src="objects/castleroom-greenhouse/monstera-right.webp" alt="monstera, right" height="72"> |
| 242.7 | palm, left | <img src="objects/castleroom-greenhouse/palm-left.webp" alt="palm, left" height="72"> |
| 251.3 | palm, right | <img src="objects/castleroom-greenhouse/palm-right.webp" alt="palm, right" height="72"> |
| 285.6 | hibiscus, left | <img src="objects/castleroom-greenhouse/hibiscus-left.webp" alt="hibiscus, left" height="72"> |
| 289.1 | hibiscus, right | <img src="objects/castleroom-greenhouse/hibiscus-right.webp" alt="hibiscus, right" height="72"> |
| 320 | fountain | <img src="objects/castleroom-greenhouse/fountain.webp" alt="fountain" height="72"> |
| 354.4 | bromeliad, left | <img src="objects/castleroom-greenhouse/bromeliad-left.webp" alt="bromeliad, left" height="72"> |
| 354.4 | bromeliad, right | <img src="objects/castleroom-greenhouse/bromeliad-right.webp" alt="bromeliad, right" height="72"> |
| 388.7 | watering can | <img src="objects/castleroom-greenhouse/watering-can.webp" alt="watering can" height="72"> |

## 🕳️ trap room

<img src="objects/castleroom-trap/place.webp" alt="🕳️ trap room, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | way out | <img src="objects/castleroom-trap/way-out.webp" alt="way out" height="72"> |
| 285.6 | helmet | <img src="objects/castleroom-trap/helmet.webp" alt="helmet" height="72"> |

## 🗝️ dungeon

<img src="objects/castleroom-dungeon1/place.webp" alt="🗝️ dungeon, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 234.1 | ladder | <img src="objects/castleroom-dungeon1/ladder.webp" alt="ladder" height="72"> |
| 320 | bucket | <img src="objects/castleroom-dungeon1/bucket.webp" alt="bucket" height="72"> |
| 345.8 | rat | <img src="objects/castleroom-dungeon1/rat.webp" alt="rat" height="72"> |

## ⛓️ deep dungeon

<img src="objects/castleroom-dungeon2/place.webp" alt="⛓️ deep dungeon, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | cage | <img src="objects/castleroom-dungeon2/cage.webp" alt="cage" height="72"> |
| 234.1 | ladder | <img src="objects/castleroom-dungeon2/ladder.webp" alt="ladder" height="72"> |
| 235 | mushrooms | <img src="objects/castleroom-dungeon2/mushrooms.webp" alt="mushrooms" height="72"> |
| 297 | candle | <img src="objects/castleroom-dungeon2/candle.webp" alt="candle" height="72"> |
| 354.4 | cell | <img src="objects/castleroom-dungeon2/cell.webp" alt="cell" height="72"> |

## 🕯️ hallway

<img src="objects/castleroom-hallway/place.webp" alt="🕯️ hallway, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | doors | <img src="objects/castleroom-hallway/doors.webp" alt="doors" height="72"> |

## 🐈 cat room

<img src="objects/castleroom-catroom/place.webp" alt="🐈 cat room, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | door 2 | <img src="objects/castleroom-catroom/door-2.webp" alt="door 2" height="72"> |
| 225.5 | door 3 | <img src="objects/castleroom-catroom/door-3.webp" alt="door 3" height="72"> |
| 228.8 | cat tree, left | <img src="objects/castleroom-catroom/cat-tree-left.webp" alt="cat tree, left" height="72"> |
| 228.8 | cat tree, right | <img src="objects/castleroom-catroom/cat-tree-right.webp" alt="cat tree, right" height="72"> |
| 228.8 | cat 2 | <img src="objects/castleroom-catroom/cat-2.webp" alt="cat 2" height="72"> |
| 228.8 | cat 5 | <img src="objects/castleroom-catroom/cat-5.webp" alt="cat 5" height="72"> |
| 231.4 | cat 3 | <img src="objects/castleroom-catroom/cat-3.webp" alt="cat 3" height="72"> |
| 241.6 | firewood | <img src="objects/castleroom-catroom/firewood.webp" alt="firewood" height="72"> |
| 241.6 | window seat | <img src="objects/castleroom-catroom/window-seat.webp" alt="window seat" height="72"> |
| 241.6 | cat 4 | <img src="objects/castleroom-catroom/cat-4.webp" alt="cat 4" height="72"> |
| 254.1 | bowls | <img src="objects/castleroom-catroom/bowls.webp" alt="bowls" height="72"> |
| 258.7 | cat 1 | <img src="objects/castleroom-catroom/cat-1.webp" alt="cat 1" height="72"> |
| 282.5 | lantern | <img src="objects/castleroom-catroom/lantern.webp" alt="lantern" height="72"> |
| 282.5 | yarn, yellow | <img src="objects/castleroom-catroom/yarn-yellow.webp" alt="yarn, yellow" height="72"> |
| 295 | basket | <img src="objects/castleroom-catroom/basket.webp" alt="basket" height="72"> |
| 295 | cat 6 | <img src="objects/castleroom-catroom/cat-6.webp" alt="cat 6" height="72"> |
| 316.8 | toy mouse | <img src="objects/castleroom-catroom/toy-mouse.webp" alt="toy mouse" height="72"> |
| 343 | yarn, red | <img src="objects/castleroom-catroom/yarn-red.webp" alt="yarn, red" height="72"> |
| 343 | rope bridge | <img src="objects/castleroom-catroom/rope-bridge.webp" alt="rope bridge" height="72"> |
| 358.2 | box | <img src="objects/castleroom-catroom/box.webp" alt="box" height="72"> |
| 387.7 | yarn, green | <img src="objects/castleroom-catroom/yarn-green.webp" alt="yarn, green" height="72"> |
| front | way S | <img src="objects/castleroom-catroom/way-s.webp" alt="way S" height="72"> |

## 🐴 stable

<img src="objects/castleroom-stable/place.webp" alt="🐴 stable, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | swallows | <img src="objects/castleroom-stable/swallows.webp" alt="swallows" height="72"> |
| 225.5 | door 2 | <img src="objects/castleroom-stable/door-2.webp" alt="door 2" height="72"> |
| 225.5 | door 3 | <img src="objects/castleroom-stable/door-3.webp" alt="door 3" height="72"> |
| 227.2 | horse 1 | <img src="objects/castleroom-stable/horse-1.webp" alt="horse 1" height="72"> |
| 227.2 | horse 2 | <img src="objects/castleroom-stable/horse-2.webp" alt="horse 2" height="72"> |
| 227.2 | horse 3 | <img src="objects/castleroom-stable/horse-3.webp" alt="horse 3" height="72"> |
| 251.9 | ladder | <img src="objects/castleroom-stable/ladder.webp" alt="ladder" height="72"> |
| 266.1 | hen, brown | <img src="objects/castleroom-stable/hen-brown.webp" alt="hen, brown" height="72"> |
| 279.6 | sunbeam | <img src="objects/castleroom-stable/sunbeam.webp" alt="sunbeam" height="72"> |
| 295 | water trough | <img src="objects/castleroom-stable/water-trough.webp" alt="water trough" height="72"> |
| 295 | buckets | <img src="objects/castleroom-stable/buckets.webp" alt="buckets" height="72"> |
| 295 | hen, white | <img src="objects/castleroom-stable/hen-white.webp" alt="hen, white" height="72"> |
| 333.6 | hay heap | <img src="objects/castleroom-stable/hay-heap.webp" alt="hay heap" height="72"> |
| front | way S | <img src="objects/castleroom-stable/way-s.webp" alt="way S" height="72"> |

## 🍽️ dining room

<img src="objects/castleroom-dining/place.webp" alt="🍽️ dining room, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 74.6 | chair, far end | <img src="objects/castleroom-dining/chair-far-end.webp" alt="chair, far end" height="72"> |
| 88.3 | chair, left 4 | <img src="objects/castleroom-dining/chair-left-4.webp" alt="chair, left 4" height="72"> |
| 88.3 | chair, right 4 | <img src="objects/castleroom-dining/chair-right-4.webp" alt="chair, right 4" height="72"> |
| 95.9 | candelabra 2 | <img src="objects/castleroom-dining/candelabra-2.webp" alt="candelabra 2" height="72"> |
| 104.6 | chair, left 3 | <img src="objects/castleroom-dining/chair-left-3.webp" alt="chair, left 3" height="72"> |
| 104.6 | chair, right 3 | <img src="objects/castleroom-dining/chair-right-3.webp" alt="chair, right 3" height="72"> |
| 126.3 | chair, left 2 | <img src="objects/castleroom-dining/chair-left-2.webp" alt="chair, left 2" height="72"> |
| 126.3 | chair, right 2 | <img src="objects/castleroom-dining/chair-right-2.webp" alt="chair, right 2" height="72"> |
| 140.1 | candelabra 1 | <img src="objects/castleroom-dining/candelabra-1.webp" alt="candelabra 1" height="72"> |
| 156.6 | chair, left 1 | <img src="objects/castleroom-dining/chair-left-1.webp" alt="chair, left 1" height="72"> |
| 156.6 | chair, right 1 | <img src="objects/castleroom-dining/chair-right-1.webp" alt="chair, right 1" height="72"> |
| 176.7 | table | <img src="objects/castleroom-dining/table.webp" alt="table" height="72"> |
| 206.8 | chair, near end | <img src="objects/castleroom-dining/chair-near-end.webp" alt="chair, near end" height="72"> |
| 225.5 | doors | <img src="objects/castleroom-dining/doors.webp" alt="doors" height="72"> |
| front | dark | <img src="objects/castleroom-dining/dark.webp" alt="dark" height="72"> |
| front | fire light | <img src="objects/castleroom-dining/fire-light.webp" alt="fire light" height="72"> |
| front | torches | <img src="objects/castleroom-dining/torches.webp" alt="torches" height="72"> |
| front | way S | <img src="objects/castleroom-dining/way-s.webp" alt="way S" height="72"> |

## 🍲 kitchen

<img src="objects/castleroom-kitchen/place.webp" alt="🍲 kitchen, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | oven | <img src="objects/castleroom-kitchen/oven.webp" alt="oven" height="72"> |
| 225.5 | door 2 | <img src="objects/castleroom-kitchen/door-2.webp" alt="door 2" height="72"> |
| 225.5 | door 3 | <img src="objects/castleroom-kitchen/door-3.webp" alt="door 3" height="72"> |
| 228.8 | barrels | <img src="objects/castleroom-kitchen/barrels.webp" alt="barrels" height="72"> |
| 228.8 | flour sack | <img src="objects/castleroom-kitchen/flour-sack.webp" alt="flour sack" height="72"> |
| 243.5 | cook, chopping | <img src="objects/castleroom-kitchen/cook-chopping.webp" alt="cook, chopping" height="72"> |
| 256.4 | cauldron | <img src="objects/castleroom-kitchen/cauldron.webp" alt="cauldron" height="72"> |
| 256.4 | cook, stirring | <img src="objects/castleroom-kitchen/cook-stirring.webp" alt="cook, stirring" height="72"> |
| 266.1 | pots and pans | <img src="objects/castleroom-kitchen/pots-and-pans.webp" alt="pots and pans" height="72"> |
| 333.6 | worktable | <img src="objects/castleroom-kitchen/worktable.webp" alt="worktable" height="72"> |
| front | fire light | <img src="objects/castleroom-kitchen/fire-light.webp" alt="fire light" height="72"> |
| front | way S | <img src="objects/castleroom-kitchen/way-s.webp" alt="way S" height="72"> |

## ⚒️ smithy

<img src="objects/castleroom-smithy/place.webp" alt="⚒️ smithy, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 225.5 | forge | <img src="objects/castleroom-smithy/forge.webp" alt="forge" height="72"> |
| 225.5 | door 2 | <img src="objects/castleroom-smithy/door-2.webp" alt="door 2" height="72"> |
| 225.5 | door 3 | <img src="objects/castleroom-smithy/door-3.webp" alt="door 3" height="72"> |
| 234.1 | coal heap | <img src="objects/castleroom-smithy/coal-heap.webp" alt="coal heap" height="72"> |
| 266.1 | anvil | <img src="objects/castleroom-smithy/anvil.webp" alt="anvil" height="72"> |
| 266.1 | smith | <img src="objects/castleroom-smithy/smith.webp" alt="smith" height="72"> |
| 316.8 | water barrel | <img src="objects/castleroom-smithy/water-barrel.webp" alt="water barrel" height="72"> |
| front | dark | <img src="objects/castleroom-smithy/dark.webp" alt="dark" height="72"> |
| front | way S | <img src="objects/castleroom-smithy/way-s.webp" alt="way S" height="72"> |

## 🌀 spiral staircase

<img src="objects/castleroom-spiral/place.webp" alt="🌀 spiral staircase, as it starts" width="480">

| depth | object | picture |
|---:|---|---|
| 56.7 | door 3 | <img src="objects/castleroom-spiral/door-3.webp" alt="door 3" height="72"> |
| 148.8 | door 2 | <img src="objects/castleroom-spiral/door-2.webp" alt="door 2" height="72"> |
| 263.3 | column | <img src="objects/castleroom-spiral/column.webp" alt="column" height="72"> |
| 281.6 | steps | <img src="objects/castleroom-spiral/steps.webp" alt="steps" height="72"> |
| front | steps, in front | <img src="objects/castleroom-spiral/steps-in-front.webp" alt="steps, in front" height="72"> |
| front | dark | <img src="objects/castleroom-spiral/dark.webp" alt="dark" height="72"> |
| front | way S | <img src="objects/castleroom-spiral/way-s.webp" alt="way S" height="72"> |
