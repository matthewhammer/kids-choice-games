// (ticket 812) The space course, run inside the game's page: loaded and started by spacecourse812.mjs in the speed run (its loop
// runs only the .mjs files), or by hand in a browser's console, where it reports as it goes. window.__course: { done, log: [[ok,
// what, got], ...] }. See spacecourse812.mjs for what it checks and why.
window.__course = { done: false, log: [] };
window.__courseRun = async (opts = {}) => {   // (opts.only: "variations", the team's variations alone)
  const C = window.__course, ok = (what, cond, got) => { C.log.push([!!cond, what, cond ? null : JSON.stringify(got).slice(0, 900)]); if (window.__courseSay) console.log((cond ? "ok   " : "FAIL ") + what); };
  const w = ms => new Promise(r => setTimeout(r, ms));
  const until = async (f, ms = 12000) => { const t = performance.now(); while (performance.now() - t < ms) { if (f()) return true; await w(80); } return false; };
  const acts = () => [...document.querySelectorAll("#ways-own .rocket-act")].map(b => b.dataset.act);
  const settled = () => !entering && !figAway;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const placed = () => [...document.querySelectorAll("g.person-placed")].map(n => n.dataset.person).sort();
  const team = () => teamOf().map(P => P.id).sort();
  const look = () => ({ world: state.world.name, space: !!state.world.space, planet: state.world.planet || null, at: state.world.at, kind: state.background.kind,
    sky: state.background.alienSky, rocket: state.body.rocket, acts: acts(), portholes: document.querySelectorAll("#figure .porthole").length,
    placed: placed(), team: team(), me: state.person.id, teamAt: teamOf().map(P => P.place ? P.place.world + "|" + P.place.key : "none"), here: state.world.id + "|" + state.world.at });
  const planetKey = pid => { const S = spaceEnsure(); return Object.keys(S.cells).find(k => S.cells[k].planet === pid); };
  // a rocket action pressed, the trip's motion watched (the flying copy's top, every 120 ms), till done and landed
  const act = async (a, done) => {
    const b = document.querySelector('#ways-own [data-act="' + a + '"]');
    if (!b) return { ok: false, why: "no " + a + " chip; have " + acts(), tops: [] };
    b.click();
    const tops = [], t0 = performance.now();   // (the flying copy, every 100 ms: [its top, its height])
    while (performance.now() - t0 < 12000) { const c = document.querySelector(".fig-spin"); if (c) { const r = c.getBoundingClientRect(); tops.push([Math.round(r.top), Math.round(r.height)]); } if (done() && settled()) break; await w(100); }
    await w(250);
    return { ok: done() && settled(), tops };
  };
  // across a world by its nav arrows, a square at a time, toward key
  const goTo = async key => {
    for (let i = 0; i < 12 && state.world.at !== key; i++) {
      const [c, r] = state.world.at.split(",").map(Number), [tc, tr] = key.split(",").map(Number);
      const d = tc > c ? "E" : tc < c ? "W" : tr > r ? "S" : "N", b = document.querySelector('#ways .way-arrow[data-way="' + d + '"]');
      if (!b) return "no arrow " + d + " at " + state.world.at;
      const at0 = state.world.at; b.click();
      if (!await until(() => state.world.at !== at0 && !entering)) return "stuck at " + state.world.at;
      await until(settled); await w(350);   // (arrived, and the rocket's chips back)
    }
    return state.world.at;
  };
  // A trip's motion, from the flying copy's samples ([top, height]): off the ground, it rises (its top well above where it began);
  // into a planet, it shrinks to a speck (its height a fifth of its own or less). Then, in the new place: from above, it comes down
  // (after its highest, its top well lower again); out of a planet, it grows (after its smallest, at full size again)
  const first = r => r.tops.length ? r.tops[0] : [0, 0], last = r => r.tops.length ? r.tops[r.tops.length - 1] : [0, 0];
  const rose = r => r.tops.length >= 4 && Math.min(...r.tops.map(x => x[0])) < first(r)[0] - 60;
  const shrank = r => r.tops.length >= 4 && Math.min(...r.tops.map(x => x[1])) < first(r)[1] * 0.2;
  const camedown = r => { const tops = r.tops.map(x => x[0]), i = tops.indexOf(Math.min(...tops)); return i >= 0 && tops.slice(i).some(t => t > tops[i] + 60); };
  const grew = r => { const hs = r.tops.map(x => x[1]), i = hs.lastIndexOf(Math.min(...hs)); return i >= 0 && i < hs.length - 1 && hs[hs.length - 1] > hs[i] * 4; };
  const trip = async (name, a, done, how = {}) => {
    const r = await act(a, done);
    ok(name + ": done", r.ok, r);
    if (how.into) ok(name + ": the rocket flew into the planet, turned toward it and shrinking to a speck", shrank(r), r.tops);
    else ok(name + ": the rocket lifted off, rising out of the picture", rose(r), r.tops);
    if (how.outOf) ok(name + ": and came out of the planet, growing to its size", grew(r), r.tops);
    else ok(name + ": and came down from above onto the new place", camedown(r), r.tops);
    return look();
  };
  const aboard = (where, s, k) => { ok(where + ": the team aboard, a porthole each", s.rocket === "ride" && s.portholes === k, s); ok(where + ": none of the team standing about", s.placed.filter(id => s.team.includes(id)).length === 0, s.placed); };
  const outWith = (where, s, k) => ok(where + ": the team out with the friend, each placed in this square", s.team.length === k && s.team.every(id => s.placed.includes(id)) && s.teamAt.every(t => t === s.here), s);
  try {
    // the team: two cats, and a gnome made from a costume (there being a team, the one played till then joins it)
    personNewCat(); personNewCat(); await w(300);
    const k0 = personCostumes(), gnome = personNewCostume(k0[0][0], k0[0][1]); await w(1200);
    ok("the team: two cats and the friend, the new person played", team().length === 3 && state.person.id === gnome, look());
    const K = 3, W0 = state.world, keys = Object.keys(W0.cells), starts = [W0.start || keys[0], keys[Math.floor(keys.length / 2)]];
    const plan = [["zib", "pyra"], ["frost", "zib"]];
    for (let si = 0; si < (opts.only === "variations" ? 0 : starts.length); si++) {
      const start = starts[si], tag = "start " + start;
      worldSwitch(WORLD_FIRST, start, null, true); await w(500); state.body.rocket = "ride"; changed(); await w(600);
      let s = look();
      ok(tag + ": in the start world, riding, 🚀 blast off offered", !s.space && s.at === start && s.acts.includes("blast"), s);
      aboard(tag, s, K);
      s = await trip(tag + ": 🚀 blast off", "blast", () => !!state.world.space);
      ok(tag + ": in outer space, at home's square, 🏡 home offered", s.space && s.at === "0,2" && same(s.acts, ["home", "fly"]), s);
      aboard(tag + ", in space", s, K);
      for (const pid of plan[si]) {
        const key = planetKey(pid), got = await goTo(key); s = look();
        ok(tag + ": across space to " + pid + "'s square " + key + " by the nav arrows", got === key && same(s.acts, ["land", "fly"]), { got, s });
        s = await trip(tag + ": 🪐 land on " + pid, "land", () => state.world.planet === pid, { into: true });
        ok(tag + ": on " + pid + ", 👽 its surface, blast off and step out offered", s.planet === pid && s.kind === "alienplanet" && same(s.acts, ["blast", "fly", "out"]), s);
        aboard(tag + ", on " + pid, s, K);
        let r = await act("out", () => state.body.rocket === "hover"); await w(900); s = look();
        ok(tag + ": ⏏️ stepped out on " + pid + ": the rocket beside them, 🚀 board offered", r.ok && s.rocket === "hover" && same(s.acts, ["board"]), s);
        outWith(tag + ", out on " + pid, s, K);
        const at0 = s.at, way = state.world.cells[at0].ways[0], to = worldNeighbour(state.world, at0, way).key, got2 = await goTo(to); await w(1500); s = look();
        ok(tag + ": walked " + way + " on " + pid + ", " + at0 + " to " + to + ", as a team", got2 === to, { got2, s });
        outWith(tag + ", " + pid + " " + to, s, K);
        r = await act("board", () => state.body.rocket === "ride"); s = look();
        ok(tag + ": 🚀 boarded on " + pid, r.ok && same(s.acts, ["blast", "fly", "out"]), s);
        aboard(tag + ", boarded on " + pid, s, K);
        s = await trip(tag + ": 🚀 blast off from " + pid, "blast", () => !!state.world.space, { outOf: true });
        ok(tag + ": back in space at " + pid + "'s square", s.space && s.at === key && same(s.acts, ["land", "fly"]), s);
        aboard(tag + ", back in space", s, K);
      }
      const got = await goTo("0,2");
      ok(tag + ": across space home", got === "0,2", got);
      s = await trip(tag + ": 🏡 home", "home", () => !state.world.space && !state.world.planet, { into: true });
      ok(tag + ": home, at the square they blasted off from", !s.space && !s.planet && s.at === start && state.world.id === WORLD_FIRST, s);
      aboard(tag + ", home", s, K);
    }
    // ---- the team varied on the way
    if (opts.only === "variations") { worldSwitch(WORLD_FIRST, starts[0], null, true); await w(500); state.body.rocket = "ride"; changed(); await w(600); }
    let s = await trip("variations: 🚀 blast off", "blast", () => !!state.world.space);
    personNewCat(); await w(800); s = look();
    ok("a cat made in space: on the team", s.team.length === 4, s);
    aboard("a cat made in space", s, 4);
    const me0 = s.me; teamNext(); await w(900); s = look();
    ok("Q in space: another one played, the one before on the team", s.me !== me0 && s.team.includes(me0) && s.team.length === 4, s);
    aboard("Q in space", s, 4);
    await goTo(planetKey("pyra"));
    s = await trip("variations: 🪐 land on pyra", "land", () => state.world.planet === "pyra", { into: true });
    await act("out", () => state.body.rocket === "hover"); await w(900);
    const me1 = look().me, k1 = personCostumes(); personNewCostume(k1[1][0], k1[1][1]); await w(1500); s = look();
    ok("a new person on a planet: played, the one before on the team", s.me !== me1 && s.team.includes(me1) && s.team.length === 5, s);
    ok("a new person on a planet: the rocket beside them, 🚀 board offered", s.rocket === "hover" && same(s.acts, ["board"]), s);
    outWith("a new person on a planet", s, 5);
    const stay = s.team[0]; teamJoin(stay, false); await w(600); s = look();
    ok("one left on pyra: off the team, standing in the square", !s.team.includes(stay) && s.placed.includes(stay), s);
    const stayAt = state.peopleAway[stay].place.world + "|" + state.peopleAway[stay].place.key;
    await act("board", () => state.body.rocket === "ride");
    s = await trip("variations: 🚀 blast off from pyra", "blast", () => !!state.world.space, { outOf: true });
    aboard("variations, back in space", s, 4);
    ok("the one left on pyra: not in space", !s.placed.includes(stay), s);
    s = await trip("variations: 🪐 back down on pyra", "land", () => state.world.planet === "pyra", { into: true });
    const P = state.peopleAway[stay], nowAt = P && P.place ? P.place.world + "|" + P.place.key : null;
    ok("the one left on pyra: there still, where they stayed", nowAt === stayAt, { stayAt, nowAt });
    // in the air over the quilt: a cat and a person made; landing on another square, all the team there, none left where they took off
    worldSwitch(WORLD_FIRST, null, null, true); await w(500); state.body.rocket = "ride"; changed(); await w(400);
    const from = state.world.id + "|" + state.world.at; flightStart("rocketride"); await w(1500);
    personNewCat(); const k2 = personCostumes(); personNewCostume(k2[2][0], k2[2][1]); await w(800);
    // (a square of dry land to come down on: in water no one rides a rocket, they swim)
    const WF = state.world, wet = new Set(["sea", "deepsea", "lake", "beach", "underwater", "pond"]), to = Object.keys(WF.cells).find(k => k !== WF.at && WF.cells[k].kind !== "none" && !wet.has(WF.cells[k].kind)), [tc, tr] = to.split(",").map(Number);
    flight.x = tc + 0.5; flight.y = tr + 0.5; flightLand(true); await w(1800); s = look();
    const left = Object.values(state.peopleAway).filter(Q => Q.team && Q.place && Q.place.world + "|" + Q.place.key === from);
    ok("made in the air: none of the team left where the flight took off", left.length === 0 && s.here !== from, { from, s, left: left.map(Q => Q.id) });
    ok("made in the air: all of the team aboard after landing", s.rocket === "ride" && s.portholes === s.team.length, s);
    // (Matthew 2026-11-21: "planet Zib is cut off"; "we should permit the user to hover over the planets in the quilt mode and go to
    // surface directly") over outer space's quilt: each planet inside its own square; one tapped, flown to, landed on, its surface
    s = await trip("the quilt: 🚀 blast off again", "blast", () => !!state.world.space);
    rocketUp(); await until(() => !!flight, 6000);
    flight.want = 1; flyGo(); await until(() => flight && flight.h > 0.97, 8000); await w(400);
    const over = [...document.querySelectorAll("#fly .fly-planet")].map(g => { const a = g.getBoundingClientRect(), t = g.closest("[data-tile]").firstElementChild.getBoundingClientRect();
      return { p: g.dataset.planet, out: a.width > 0 && (a.left < t.left - 1 || a.right > t.right + 1 || a.top < t.top - 1 || a.bottom > t.bottom + 1) }; });
    ok("the quilt over outer space: its planets drawn, each inside its own square", over.length >= 4 && over.every(o => !o.out), over);
    const zib = document.querySelector('#fly .fly-planet[data-planet="zib"] .fly-glow');
    ok("the quilt over outer space: zib there to tap", !!zib, over);
    if (zib) {
      zib.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true, button: 0 }));
      const got = await until(() => !flight && state.world.planet === "zib" && settled(), 25000); await w(600); s = look();
      ok("🪐 zib tapped in the quilt: flown to, down, and into the planet, on its surface, riding", got && s.kind === "alienplanet" && s.rocket === "ride" && same(s.acts, ["blast", "fly", "out"]), s);
      aboard("zib, landed on from the quilt", s, s.team.length);
    }
  } catch (e) { ok("the course ran to its end", false, String(e && e.stack || e)); }
  C.done = true;
};
