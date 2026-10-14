# Kids' Choice Games

**▶ Play Messed Up Dress Up at http://matthewhammer.org/kids-choice-games/dress-up/**

Small games made with and for M and N, my daughter and son, who choose what comes next. Each is a plain HTML and JavaScript page, and each has two jobs.

**Real play.** The kids ask for features as they play: a witch with a cat on her shoulder, claws at 900%, a hut on chicken legs. Each request goes live as soon as it's ready, so the next round of play tests it.

**Research.** The same toys are then rebuilt as *user-defined livelits* in [Hazel](https://hazel.org): GUIs written as ordinary Hazel code, living inside the program they edit. That's the Livelit Playground, on [hazelgrove/hazel#2635](https://github.com/hazelgrove/hazel/pull/2635) and [#2597](https://github.com/hazelgrove/hazel/pull/2597). The game redraws in milliseconds. The Hazel versions of its toys first took seconds, and some took minutes. Closing that gap, so Hazel can run toys like these as user code and keep up with the kids, is the subject of the [Hazel performance analysis](http://matthewhammer.org/hazel/performance-analysis/) series.

The order matters: the plain prototype is played with first, by real players, and the Hazel version formulates what the play settled on.

## Games

- [`dress-up/`](dress-up/): **Messed Up Dress Up**, a paper doll with every part on a slider, dozens of costumes and backgrounds, and its own music. Live at http://matthewhammer.org/kids-choice-games/dress-up/. Its features by version are in [`dress-up/VERSIONS.md`](dress-up/VERSIONS.md).

## Playing one

Each game is a single HTML file, with nothing to install. Open `dress-up/index.html` in a browser, or serve the folder:

```
cd dress-up && python3 -m http.server 8133
```

and visit http://localhost:8133/.

## History

The commits before this README come from where the game was first published, as a folder of my homepage's repository. They keep their messages and dates: one commit per change that went live, from 2026-10-09 on.
