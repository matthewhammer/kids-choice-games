# Dress Up: what stands in each place

The formal list of every place's objects (ticket 99), as of 0.0.46, at the default settings. A slider that adds things (more toys, more ducks, more chairs) adds objects.

- **Depth** is the y where a thing stands on the ground, in the stage's units: the ground line is at 320, and the friend's feet can be anywhere from about 11 (far) to 406 (near).
- The friend is drawn behind every object deeper than their feet, and in front of the rest. **front** means in front of everything: the friend is always under it (darkness, light, steam, the sign toward us).
- Flat things on the ground and the backdrop (sky, far hills, back walls and what hangs on them) are not objects.
- In the game each place shows this list in its background tab, with an 👁️ chip per object to hide or show it.

Made by `depthsheet.mjs` (see agent-instructions.md, Testing) and `objects_md.py`. Make it again after changing what stands in a place.

## 💭 our imagination

Nothing stands here: the friend is in front of everything.

## 🌲 forest

| depth | object |
|---:|---|
| 234 | pines, far row |
| 277 | pines, near row |
| 286 | butterflies |
| 346 | big tree, left, inner |
| 346 | big tree, right, inner |
| 372 | big tree, left, outer |
| 372 | big tree, right, outer |

## 🐠 underwater

| depth | object |
|---:|---|
| 260 | orange fish |
| 260 | yellow fish |
| 260 | pink fish |
| 260 | blue fish |
| 337 | seaweed, left |
| 337 | seaweed, right |
| 341 | rock, left 3 |
| 345 | rock, left 2 |
| 346 | shipwreck |
| 346 | picnic bench |
| 346 | shark, left |
| 346 | shark, right |
| 346 | picnic table |
| 347 | rock, right 2 |
| 359 | rock, right 1 |
| 362 | rock, left 1 |
| front | bubbles |

## 🏖️ beach

| depth | object |
|---:|---|
| 329 | beach chair, left |
| 329 | beach chair, right |
| 337 | umbrella, left |
| 337 | umbrella, right |
| 354 | palm tree, left |
| 354 | palm tree, right |
| 359 | sand castle, left |
| 359 | sand castle, right |

## 🧙 witch's woods

| depth | object |
|---:|---|
| 213 | dead trees, far row |
| 245 | dead trees, near row |
| 279 | hut |
| 298 | fence |
| 298 | skulls |
| 354 | giant tree |
| 354 | tree, right |
| 365 | skeleton, left |
| 367 | cauldron |
| 377 | skeleton, right |
| 380 | skeleton, right edge |
| 384 | skeleton, left edge |

## 🌿 cemetery

| depth | object |
|---:|---|
| 243 | far trees |
| 260 | butterflies |
| 275 | far stones |
| 294 | yellow bush |
| 302 | willow |
| 318 | green bush |
| 323 | headstone, left |
| 325 | cross |
| 342 | headstone, right |
| 346 | stag stone |
| 346 | pink bush |
| 349 | white bush |

## 🦆 lake

| depth | object |
|---:|---|
| 105 | far wood |
| 126 | duck 1 |
| 143 | duck 5 |
| 167 | duck 3 |
| 193 | duck 2 |
| 199 | duck 4 |
| 264 | cattails, left |
| 264 | cattails, right |

## 🏠 house and yard

| depth | object |
|---:|---|
| 170 | house |
| 187 | tree, left |
| 196 | tree, right |
| 218 | teddy |
| 232 | wagon |
| 233 | ball |
| 253 | blocks |
| 267 | truck |
| 269 | butterflies |
| 364 | bucket |

## 🌳 tree house

| depth | object |
|---:|---|
| 214 | trees, far row |
| 269 | butterflies |
| 287 | trees, left |
| 287 | trees, right |
| 308 | bush, left 5 |
| 309 | bush, left 1 |
| 314 | bush, left 4 |
| 316 | bush, right 3 |
| 320 | tree house |
| 321 | bush, left 8 |
| 335 | bush, right 1 |
| 337 | bush, left 6 |
| 338 | bush, right 2 |
| 342 | bush, left 3 |
| 343 | bush, left 2 |
| 346 | bush, right 8 |
| 347 | bush, left 7 |

## 🛋️ living room

| depth | object |
|---:|---|
| 243 | lamp |
| 260 | plant |
| 286 | couch |

## 🧙 inside the witch's hut

| depth | object |
|---:|---|
| 253 | snake tank |
| 277 | cauldron |
| 320 | witch |
| front | dark |

## 🌲 forest clearing

| depth | object |
|---:|---|
| 136 | far woods |
| 205 | castle |
| 205 | tree house |
| 227 | house |
| 252 | witch hut |
| 271 | healer hut |
| 346 | butterflies |
| 354 | tree, left, outer |
| 354 | tree, right, outer |
| 389 | tree, left, inner |
| 389 | tree, right, inner |
| front | sign |
| front | fairy sign |

## 🌿 inside the healer's hut

| depth | object |
|---:|---|
| 234 | potion shelves |
| 234 | cat |
| 320 | soup pot |
| 320 | healer |
| 385 | tea table |
| 387 | chair, left |
| 387 | chair, right |
| 392 | worktable |
| front | warm light |

## 🧚 fairy forest

| depth | object |
|---:|---|
| 196 | trees, far row |
| 231 | trees, near row |
| 317 | toadstool 11 |
| 318 | toadstool 12 |
| 324 | toadstool 10 |
| 325 | bush |
| 325 | toadstool 13 |
| 334 | toadstool 9 |
| 337 | great tree |
| 337 | fairy house |
| 342 | toadstool 14 |
| 349 | toadstool 8 |
| 357 | toadstool 1 |
| 371 | toadstool 7 |
| 372 | stone, left |
| 372 | toadstool 2 |
| 383 | toadstool 6 |
| 387 | toadstool 3 |
| 391 | toadstool 5 |
| 392 | toadstool 4 |
| 397 | stone, right |
| front | sparkles |
| front | sign |

## ⛰️ mountain trail

| depth | object |
|---:|---|
| 191 | birds |
| 323 | pine, right 1 |
| 327 | pine, right 4 |
| 328 | pine, right 2 |
| 329 | signpost |
| 330 | rock, left 5 |
| 330 | pine, left 2 |
| 334 | pine, left 3 |
| 338 | rock, left 2 |
| 339 | pine, right 3 |
| 339 | pine, left 1 |
| 344 | pine, left 4 |
| 349 | rock, right 4 |
| 351 | rock, left 4 |
| 352 | rock, left 1 |
| 356 | rock, left 3 |
| 364 | rock, right 2 |
| 365 | rock, right 3 |
| 369 | rock, right 1 |

## 💦 jungle waterfall

| depth | object |
|---:|---|
| 260 | mist |
| 260 | vines |
| 354 | signpost |
| 372 | jungle tree, left |
| 372 | jungle tree, right |
| 372 | parrot 1 |
| 372 | parrot 2 |

## 🏕️ camp site

| depth | object |
|---:|---|
| 238 | woods |
| 286 | orange tent |
| 291 | blue tent |
| 346 | signpost |
| 354 | campfire |
| 392 | log, left |
| 392 | log, right |
| 452 | log, near |

## ⛺ inside a tent

| depth | object |
|---:|---|
| 303 | flashlight beam |

## 🪨 cave behind the falls

| depth | object |
|---:|---|
| 303 | big stalagmite, left |
| 303 | small stalagmite, left |
| 303 | big stalagmite, right |
| 303 | small stalagmite, right |
| 303 | stalactites |
| 303 | bats |
| 320 | chest |

## 🥾 path through the woods

| depth | object |
|---:|---|
| 169 | far trees |
| 169 | sunbeams |
| 277 | butterflies |
| 337 | tree, left inner |
| 346 | tree, right inner |
| 351 | mushroom, right inner |
| 354 | mushroom, left inner |
| 363 | signpost |
| 372 | mushroom, right outer |
| 380 | tree, left outer |
| 380 | mushroom, left outer |
| 389 | tree, right outer |

## 🏰 castle

| depth | object |
|---:|---|
| 205 | trees, far row |
| 239 | trees, near row |
| 291 | castle |
| 291 | gate |
| 338 | well |
| 358 | hay cart |
| 370 | pennant, left |
| 370 | pennant, right |
| 372 | big tree, left, outer |
| 372 | big tree, right, outer |
| 372 | rock, left, inner |
| 377 | barrel, far |
| 379 | rock, right, outer |
| 384 | barrel, middle |
| 390 | rock, right, inner |
| 391 | rock, left, outer |
| 392 | barrel, near |
| 392 | crate |
| 415 | big tree, left, inner |
| 415 | big tree, right, inner |
| front | sign |

## 🪜 tree house room 1

| depth | object |
|---:|---|
| 234 | bunk beds |
| 238 | ladder up |
| 243 | toy chest |
| 260 | tree trunk |
| 305 | hatch |
| front | house sign |
| front | dark |

## 🪜 tree house room 2

| depth | object |
|---:|---|
| 234 | counter |
| 234 | stove |
| 260 | tree trunk |
| 298 | table |
| 305 | hatch |
| front | house sign |
| front | dark |

## 🪜 tree house room 3

| depth | object |
|---:|---|
| 243 | bookcase |
| 260 | tree trunk |
| 277 | beanbag |
| 305 | hatch |
| front | house sign |
| front | dark |

## 🪜 tree house room 4

| depth | object |
|---:|---|
| 243 | telescope |
| 260 | tree trunk |
| front | house sign |
| front | dark |

## 🪜 tree house room 5

| depth | object |
|---:|---|
| 238 | ladder up |
| 244 | paint table |
| 251 | easel |
| 260 | tree trunk |
| front | house sign |
| front | dark |

## 🪜 tree house room 6

| depth | object |
|---:|---|
| 238 | drum kit |
| 238 | ladder up |
| 243 | keyboard |
| 260 | tree trunk |
| front | house sign |
| front | dark |

## 👑 king's room

| depth | object |
|---:|---|
| 226 | throne |
| 226 | chandelier |
| 226 | armor, left |
| 226 | armor, right |
| 254 | door 2 |
| 254 | door 3 |
| 269 | chest of gold |
| front | sign |

## 🌿 greenhouse

| depth | object |
|---:|---|
| 226 | parrots |
| 226 | arch to room 1 |
| 226 | arch to room 2 |
| 226 | arch to room 3 |
| 231 | ferns |
| 232 | bird of paradise, right |
| 234 | bird of paradise, left |
| 238 | monstera, left |
| 239 | monstera, right |
| 243 | palm, left |
| 251 | palm, right |
| 286 | hibiscus, left |
| 289 | hibiscus, right |
| 320 | fountain |
| 354 | bromeliad, left |
| 354 | bromeliad, right |
| 389 | watering can |

## 🕳️ trap room

| depth | object |
|---:|---|
| 226 | way out |
| 286 | helmet |

## 🗝️ dungeon

| depth | object |
|---:|---|
| 234 | ladder |
| 320 | bucket |
| 346 | rat |

## ⛓️ deep dungeon

| depth | object |
|---:|---|
| 226 | cage |
| 234 | ladder |
| 235 | mushrooms |
| 297 | candle |
| 354 | cell |

## 🕯️ hallway

| depth | object |
|---:|---|
| 226 | doors |

## 🐈 cat room

| depth | object |
|---:|---|
| 229 | cat tree, left |
| 229 | cat tree, right |
| 229 | cat 2 |
| 229 | cat 5 |
| 231 | cat 3 |
| 242 | firewood |
| 242 | window seat |
| 242 | cat 4 |
| 254 | bowls |
| 254 | door 2 |
| 254 | door 3 |
| 259 | cat 1 |
| 283 | lantern |
| 283 | yarn, yellow |
| 295 | basket |
| 295 | cat 6 |
| 317 | toy mouse |
| 343 | yarn, red |
| 343 | rope bridge |
| 358 | box |
| 388 | yarn, green |
| front | sign |

## 🐴 stable

| depth | object |
|---:|---|
| 226 | swallows |
| 227 | horse 1 |
| 227 | horse 2 |
| 227 | horse 3 |
| 252 | ladder |
| 254 | door 2 |
| 254 | door 3 |
| 266 | hen, brown |
| 280 | sunbeam |
| 295 | water trough |
| 295 | buckets |
| 295 | hen, white |
| 334 | hay heap |
| front | sign |

## 🍽️ dining room

| depth | object |
|---:|---|
| 75 | chair, far end |
| 88 | chair, left 4 |
| 88 | chair, right 4 |
| 96 | candelabra 2 |
| 105 | chair, left 3 |
| 105 | chair, right 3 |
| 126 | chair, left 2 |
| 126 | chair, right 2 |
| 140 | candelabra 1 |
| 157 | chair, left 1 |
| 157 | chair, right 1 |
| 177 | table |
| 207 | chair, near end |
| 226 | doors |
| front | dark |
| front | fire light |
| front | torches |
| front | sign |

## 🍲 kitchen

| depth | object |
|---:|---|
| 226 | oven |
| 229 | barrels |
| 229 | flour sack |
| 244 | cook, chopping |
| 254 | door 2 |
| 254 | door 3 |
| 256 | cauldron |
| 256 | cook, stirring |
| 266 | pots and pans |
| 334 | worktable |
| front | fire light |
| front | sign |

## ⚒️ smithy

| depth | object |
|---:|---|
| 226 | forge |
| 234 | coal heap |
| 254 | door 2 |
| 254 | door 3 |
| 266 | anvil |
| 266 | smith |
| 317 | water barrel |
| front | dark |
| front | sign |

## 🌀 spiral staircase

| depth | object |
|---:|---|
| 57 | door 3 |
| 149 | door 2 |
| 263 | column |
| 282 | steps |
| front | dark |
| front | sign |
