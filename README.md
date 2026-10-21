# Kids' Choice Games

**▶ Play Messed Up Dress Up at http://matthewhammer.org/kids-choice-games/dress-up/**

Small games made with and for M and N, my daughter and son, who choose what comes next. Each is a plain HTML and JavaScript page, and each has two jobs.

**Real play.** The kids ask for features as they play: a witch with a cat on her shoulder, claws at 900%, a hut on chicken legs. Each request goes live as soon as it's ready, so the next round of play tests it.

**Research.** The same toys are then rebuilt as *user-defined livelits* in [Hazel](https://hazel.org): GUIs written as ordinary Hazel code, living inside the program they edit. That's the Livelit Playground, on [hazelgrove/hazel#2635](https://github.com/hazelgrove/hazel/pull/2635) and [#2597](https://github.com/hazelgrove/hazel/pull/2597). The game redraws in milliseconds. The Hazel versions of its toys first took seconds, and some took minutes. Closing that gap, so Hazel can run toys like these as user code and keep up with the kids, is the subject of the [Hazel performance analysis](http://matthewhammer.org/hazel/performance-analysis/) series.

The order matters: the plain prototype is played with first, by real players, and the Hazel version formulates what the play settled on.

## Games

- [`dress-up/`](dress-up/): **Messed Up Dress Up**, a paper doll with every part on a slider, dozens of costumes and backgrounds, and its own music. Live at http://matthewhammer.org/kids-choice-games/dress-up/. Its features by version are in [`dress-up/VERSIONS.md`](dress-up/VERSIONS.md).

## Playing one

Play it at http://matthewhammer.org/kids-choice-games/dress-up/, nothing to install. Each game is a single HTML file, so a copy also plays from disk: open `dress-up/index.html` in a browser.

## Licences

Reuse is welcome, with credit. Everything here is copyright 2026 Matthew Hammer and family (M and N), except one part [NOTICE](NOTICE) names, under two licences:

- **The code**, under the [Apache License 2.0](LICENSE): every program and script here (the `.js`, `.mjs`, `.py`, `.css`, `.html` and `.yml` files), the game's drawing methods and music-making among them, and the tools. Keep the [NOTICE](NOTICE) file with any copy or reuse of it.
- **Everything else**, under [Creative Commons Attribution 4.0](LICENSE-CC-BY-4.0) ([in short](https://creativecommons.org/licenses/by/4.0/)): the pictures, music and sounds, and the words (the `.md` files, and the words and pictures in the reports' pages). What is written inside a code file, such as the tunes in the music code or the words on the game's buttons, goes with that file, under Apache 2.0.

The one part that is not ours: the sun and moon formulas in `dress-up/js/09-backgrounds.js` follow [SunCalc 1.9.0](https://github.com/mourner/suncalc/tree/v1.9.0), by Vladimir (now Volodymyr) Agafonkin, and stay under its BSD 2-Clause licence (in [NOTICE](NOTICE)).

To credit us, say "by Matthew Hammer and family (M and N)", link to https://github.com/matthewhammer/kids-choice-games , name the licence, and say if you changed it.

The game also loads, from outside this repository, one outside library, [Cytoscape.js](https://js.cytoscape.org/) (MIT licence), for its map view, and two things of Matthew's own from his site: the nav bar his pages share, and pictures from the game's picture archive.

## History

The commits before this README come from where the game was first published, as a folder of my homepage's repository. They keep their messages and dates: one commit per change that went live, from 2026-10-09 on.
