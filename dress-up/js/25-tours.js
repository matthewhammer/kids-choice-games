"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 178) A part of the game's script, run in order by index.html.

// ===================== 🤖 AUTOMATED PLAY: TOURS =====================
// (ticket 813, Matthew 2026-11-21: "let's add a robot icon to the top-level menu, just after people. the menu name is 'automated
// play'. let's have a few 'tours' built in here. Each tour explores a different theme in the world system, and there's also a 'full
// tour' that combines them all. Themes: deep ocean diving, forest hike, witch/healer/castle visits, tree house visits, etc", "the
// idea of turning those on would be to replay the kinds of automated speedruns that we are doing in CI, but now integrate them as
// user-facing features", and "as we run the tour, let's show an outline for the tour (like its plan/agenda) with the current item(s)
// highlighted")
// A tour is the game playing itself, as a player plays it: the friend (and the team) walked from square to square by the nav
// arrows (a way planned over the world's squares, tourWay), through doors and back by the ⬅️ back chip, diving, and riding the
// rocket by its chips. Each tour a list of steps, each a few words, a doing, and what should be so after it (expect): the 🤖 tab
// shows the list as its outline, the step under way lit, those done ✓ (or ⚠️, when what should be so was not); a strip over the
// picture says the step under way. ⏹ stops it. The speed run's check (tools/checks/tours813.mjs) runs the same tours and reads
// their expectations: what is played here is what is checked there.
let tour = null;   // (the tour under way, or the last: its id and name, its steps, each a label, a doing, an expectation and a mark, now, done or missed; the step under way; whether stopped, whether done)
const tourWait = ms => new Promise(r => setTimeout(r, ms));
const tourUntil = async (f, ms = 15000) => { const t = performance.now(); while (performance.now() - t < ms) { if (tour && tour.stopped) return false; if (f()) return true; await tourWait(90); } return false; };
const tourSettled = () => !entering && !figAway && !flight;
// a way over the world's squares from one to the nearest square that `want` takes (its key, its cell): the nav arrows' directions
function tourWay(W, from, want) {
  const seen = new Set([from]), q = [[from, []]];
  while (q.length) {
    const [k, path] = q.shift();
    if (k !== from && want(k, W.cells[k])) return path;
    for (const d of worldLiveWays(W, k)) {
      const nb = worldNeighbour(W, k, d);
      if (nb.off || !W.cells[nb.key] || seen.has(nb.key) || (W.cells[k].links && W.cells[k].links[d])) continue;
      seen.add(nb.key); q.push([nb.key, [...path, d]]);
    }
  }
  return want(from, W.cells[from]) ? [] : null;
}
// the doings a step is made of, each waiting till it is over (a walk to a way and through it; a trip through a door)
const T = {
  // across the world, a square at a time, by the nav arrow toward the nearest square `want` takes
  async to(want) {
    const W = state.world, way = tourWay(W, W.at, want);
    if (!way) return false;
    for (const d of way) {
      if (tour && tour.stopped) return false;
      const b = document.querySelector(`#ways .way-arrow[data-way="${d}"]`), at0 = state.world.at;
      if (!b) return false;
      b.click();
      if (!await tourUntil(() => state.world.at !== at0 && !entering)) return false;
      await tourUntil(tourSettled); await tourWait(350);
    }
    return true;
  },
  toKind(kinds) { const ks = [].concat(kinds); return T.to((k, c) => ks.includes(c.kind)); },
  // through the door in the picture whose data match (to: where it leads, and the rest), as a tap on it goes
  async enter(match) {
    const doors = [...document.querySelectorAll("#bg .portal")].filter(p => Object.entries(match).every(([a, b]) => p.dataset[a] === String(b)));
    if (!doors.length) return false;
    const kind0 = state.background.kind; enterScene(doors[0]);
    return await tourUntil(() => state.background.kind !== kind0 && tourSettled()) && (await tourWait(900), true);
  },
  // ⬅️ back the way they came, by the back chip
  async back() {
    const b = document.getElementById("back"); if (!b || b.hidden) return false;
    const kind0 = state.background.kind; b.click();
    return await tourUntil(() => state.background.kind !== kind0 && tourSettled()) && (await tourWait(600), true);
  },
  // ⬇️ a dive to the deep ocean below, ⬆️ up to the surface
  async dive(dir) {
    if (diveDir() !== dir) return false;
    const w0 = state.world.id; diveGo(dir);
    return await tourUntil(() => state.world.id !== w0 && tourSettled()) && (await tourWait(500), true);
  },
  // a few squares about: each time by the first way there is that is not back where they were
  async wander(n) {
    let last = null;
    for (let i = 0; i < n; i++) {
      const W = state.world, ways = worldLiveWays(W, W.at).filter(d => { const nb = worldNeighbour(W, W.at, d); return !nb.off && W.cells[nb.key] && nb.key !== last && !(W.cells[W.at].links && W.cells[W.at].links[d]); });
      if (!ways.length) return i > 0;
      last = W.at;
      const key = worldNeighbour(W, W.at, ways[0]).key;
      if (!await T.to(k => k === key)) return false;
    }
    return true;
  },
  // a rocket's chip (🚀 blast off, 🪐 land, 🏡 home, ⏏️ step out, 🚀 board), its trip over
  async rocket(act, done) {
    await tourUntil(() => document.querySelector(`#ways-own [data-act="${act}"]`), 4000);
    const b = document.querySelector(`#ways-own [data-act="${act}"]`); if (!b) return false;
    b.click();
    return await tourUntil(() => done() && tourSettled()) && (await tourWait(500), true);
  },
  async look(ms = 1500) { await tourWait(ms); return true; },
};
const tourStep = (label, run, expect = () => true) => ({ label, run, expect, mark: "" });
const kindIs = (...ks) => () => ks.includes(state.background.kind);
// the tours: each a few words and its steps (made when it starts, from the world as it is then)
const TOURS = [
  { id: "ocean", name: "🤿 Deep ocean diving", steps: () => [
    tourStep("🏖️ Walk to the beach", () => T.toKind("beach"), kindIs("beach")),
    tourStep("🌊 Wade out into the sea", () => T.toKind("sea"), kindIs("sea")),
    tourStep("🤿 Dive down to the deep ocean", () => T.dive("down"), () => !!state.world.ocean),
    tourStep("🐠 Swim about the deep", () => T.wander(2), () => !!state.world.ocean),
    tourStep("🫧 Swim up to the surface", () => T.dive("up"), () => !state.world.ocean && state.background.kind === "sea"),
    tourStep("🏖️ Back to the beach", () => T.toKind("beach"), kindIs("beach"))] },
  { id: "forest", name: "🌲 A forest hike", steps: () => [
    tourStep("🌲 Into the forest", () => T.toKind("forest"), kindIs("forest")),
    tourStep("🍄 Along the woods path", () => T.toKind("woodpath"), kindIs("woodpath")),
    tourStep("🧚 Through the fairy forest", () => T.toKind("fairyforest"), kindIs("fairyforest")),
    tourStep("🏕️ On to the campsite", () => T.toKind("campsite"), kindIs("campsite")),
    tourStep("⛺ A look inside a tent", () => T.enter({ to: "tent" }), kindIs("tent")),
    tourStep("⬅️ Back out", () => T.back(), kindIs("campsite")),
    tourStep("💦 Down to the waterfall", () => T.toKind("waterfall"), kindIs("waterfall"))] },
  { id: "visits", name: "🧙 The witch, the healer and the castle", steps: () => [
    tourStep("🧙 To the witch's hut", () => T.toKind("witch"), kindIs("witch")),
    tourStep("🚪 In to see the witch", () => T.enter({ to: "witchroom" }), kindIs("witchroom")),
    tourStep("⬅️ Back out", () => T.back(), kindIs("witch")),
    tourStep("🌳 To the clearing", () => T.toKind("clearing"), kindIs("clearing")),
    tourStep("🩺 In to see the healer", () => T.enter({ to: "healerroom" }), kindIs("healerroom")),
    tourStep("⬅️ Back out", () => T.back(), kindIs("clearing")),
    tourStep("🏰 To the castle", () => T.toKind("castle"), kindIs("castle")),
    tourStep("🚪 In through its door", () => T.enter({ to: "castleroom" }), kindIs("castleroom")),
    tourStep("⬅️ Back out", () => T.back(), kindIs("castle"))] },
  { id: "trees", name: "🌳 Tree houses", steps: () => [
    tourStep("🌳 To a tree house", () => T.toKind("treehouse"), kindIs("treehouse")),
    tourStep("🪜 Up into its room", () => T.enter({ to: "treeroom", house: 1 }), kindIs("treeroom")),
    tourStep("⬅️ Back down", () => T.back(), kindIs("treehouse")),
    tourStep("🌿 Up to the treetop", () => T.enter({ to: "treetop" }), kindIs("treetop")),
    tourStep("⬅️ Back down", () => T.back(), kindIs("treehouse")),
    tourStep("🌳 To the other tree house", () => T.to((k, c) => c.kind === "treehouse" && k !== state.world.at), kindIs("treehouse")),
    tourStep("🪜 Up into one of its rooms", () => T.enter({ to: "treeroom", house: 2 }), kindIs("treeroom")),
    tourStep("⬅️ Back down", () => T.back(), kindIs("treehouse"))] },
  { id: "space", name: "🚀 Space", steps: () => [
    tourStep("🚀 Into the rocket, all of you", async () => { state.body.rocket = "ride"; changed(); await tourWait(800); return true; }, () => state.body.rocket === "ride"),
    tourStep("🚀 Blast off to outer space", () => T.rocket("blast", () => !!state.world.space), () => !!state.world.space),
    tourStep("✨ Across space to a planet", () => { const S = spaceEnsure(), k = Object.keys(S.cells).find(k => S.cells[k].planet && S.cells[k].planet !== "home"); return T.to(key => key === k); },
             () => !!(state.world.cells[state.world.at] || {}).planet),
    tourStep("🪐 Land on it", () => { const c = state.world.cells[state.world.at] || {}; return T.rocket("land", () => state.world.planet === c.planet); }, () => !!state.world.planet),
    tourStep("⏏️ Step out, all of you", () => T.rocket("out", () => state.body.rocket === "hover"), () => state.body.rocket === "hover"),
    tourStep("👣 A walk on the planet", () => T.wander(1), () => !!state.world.planet),
    tourStep("🚀 Board the rocket", () => T.rocket("board", () => state.body.rocket === "ride"), () => state.body.rocket === "ride"),
    tourStep("🚀 Blast off again", () => T.rocket("blast", () => !!state.world.space), () => !!state.world.space),
    tourStep("🌌 Across space toward home", () => T.to((k, c) => c.planet === "home"), () => (state.world.cells[state.world.at] || {}).planet === "home"),
    tourStep("🏡 Home to the start world", () => T.rocket("home", () => !state.world.space && !state.world.planet), () => state.world.id === WORLD_FIRST),
    tourStep("⏏️ Step out", () => T.rocket("out", () => state.body.rocket === "hover"), () => state.body.rocket === "hover")] },
];
TOURS.push({ id: "full", name: "🗺️ The full tour", steps: () => TOURS.filter(t => t.id !== "full").flatMap(t => [tourStep("— " + t.name, () => T.look(300)), ...t.steps()]) });
// into the start world first, out of the air, if they are not there
async function tourBegin() {
  if (flight) { flightLand(true); await tourWait(800); }
  if (state.background.kind === "none") { const b = document.getElementById("start-world"); if (b) b.click(); await tourWait(2500); }
  if (state.world.id !== WORLD_FIRST || INSIDE_KINDS.has(state.background.kind)) { worldSwitch(WORLD_FIRST, worldById(WORLD_FIRST).start, null, true); await tourWait(800); }
  if (state.body.rocket === "ride" && !["space", "full"].includes(tour.id)) { state.body.rocket = "none"; changed(); }   // (walking tours on foot)
}
// a tour played: each step, its mark, what it found; opts.check (the speed run's): the same, its findings kept in tour.log
async function tourRun(id, opts = {}) {
  const def = TOURS.find(t => t.id === id); if (!def || (tour && !tour.done)) return null;
  tour = { id, name: def.name, steps: [], i: -1, stopped: false, done: false, log: [], check: !!opts.check };
  tourShow();
  await tourBegin();
  tour.steps = def.steps(); tourShow();
  for (let i = 0; i < tour.steps.length && !tour.stopped; i++) {
    const S = tour.steps[i]; tour.i = i; S.mark = "now"; tourShow();
    let did = false; try { did = await S.run(); } catch (e) { did = false; tour.log.push([false, S.label + ": " + String(e && e.message || e)]); }
    if (tour.stopped) { S.mark = ""; break; }
    const ok = !!did && !!S.expect();
    S.mark = ok ? "done" : "missed"; tour.log.push([ok, S.label, ok ? null : JSON.stringify({ did, world: state.world.name, at: state.world.at, kind: state.background.kind, rocket: state.body.rocket })]);
    tourShow();
    await tourWait(ok ? 400 : 900);
  }
  tour.done = true; tour.i = -1; tourShow();
  return tour.log;
}
function tourStop() { if (tour && !tour.done) { tour.stopped = true; tourShow(); } }
// The 🤖 tab: the tours, a chip each; the one under way (or the last), its outline. And the strip over the picture.
let tourRenders = [];
function toursPanel(box) {
  const wrap = el("div", { class: "tours" }); box.append(wrap);
  let shown = "";
  const render = () => {
    const sig = JSON.stringify(tour ? [tour.id, tour.done, tour.stopped, tour.steps.map(s => s.mark)] : null);
    if (sig === shown && wrap.isConnected) return; shown = sig;
    const busy = !!tour && !tour.done;
    wrap.replaceChildren(
      el("div", { class: "hint" }, "The game plays itself, as you would: the nav arrows, the doors, the rocket. Choose a tour and watch; ⏹ stops it."),
      el("div", { class: "chipset tours-pick" }, [el("div", { class: "cap" }, "🤖 tours"), el("div", { class: "row" }, TOURS.map(t =>
        el("button", { class: "tour-chip", "data-tour": t.id, "aria-pressed": String(!!tour && tour.id === t.id), ...(busy ? { disabled: "" } : {}), onclick: () => tourRun(t.id) }, t.name)))]),
      ...(tour ? [el("div", { class: "chipset tour-outline" }, [
        el("div", { class: "cap" }, [tour.name + (tour.done ? (tour.stopped ? ": stopped" : tour.steps.every(s => s.mark === "done") ? ": done ✓" : ": done") : ""),
          ...(busy ? [el("button", { class: "tour-stop", onclick: () => tourStop() }, "⏹ stop")] : [])]),
        tour.steps.length ? el("ol", { class: "tour-steps" }, tour.steps.map(s => el("li", { class: "tour-step " + (s.mark || "todo"), ...(s.mark === "now" ? { "aria-current": "step" } : {}) },
          (s.mark === "done" ? "✓ " : s.mark === "missed" ? "⚠️ " : s.mark === "now" ? "▶ " : "") + s.label))) : el("div", { class: "hint" }, "getting ready…")])] : []));
    const now = wrap.querySelector('[aria-current="step"]'); if (now && busy) now.scrollIntoView({ block: "nearest" });
  };
  render.wrap = wrap; tourRenders.push(render);
  syncs.push(render); render();
  return render;
}
function tourShow() {
  tourRenders = tourRenders.filter(f => f.wrap.isConnected);
  for (const f of tourRenders) f();
  // the strip over the picture: the tour, the step under way, ⏹
  const bar = document.getElementById("tour-bar"); if (!bar) return;
  const on = !!tour && !tour.done, S = on && tour.i >= 0 ? tour.steps[tour.i] : null;
  bar.hidden = !on;
  if (!on) return;
  const text = `${tour.name}${S ? ` · ${tour.i + 1} of ${tour.steps.length}: ${S.label}` : " · getting ready…"}`;
  if (bar.dataset.text !== text) { bar.dataset.text = text;
    bar.replaceChildren(el("span", { class: "tour-now" }, text), el("button", { class: "tour-stop", type: "button", title: "Stop the tour", onclick: e => { e.currentTarget.blur(); tourStop(); } }, "⏹")); }
}
