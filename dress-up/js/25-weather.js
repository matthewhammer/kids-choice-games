"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 723) Part 25 of 26 of the game's script, run in order by index.html: the weather.

// (ticket 723, M, via Matthew: "weather, as in other games like Harvest Moon -- rainy, snowy, windy, cloudy, sunny, foggy ---
// with a weather report. For now, just put the weather report for the next day in the backpack feature. Soon, we will add a TV
// or a tablet, to further mimic Harvest Moon.") 🌦️ Weather (⚙️ Advanced, state.weather, off to start, as 🌗 night and day is):
// every day has one weather, the same all over the world, chosen by the day's date (background.skyYear, skyMonth, skyDay, the
// date 🌗 moves on each morning) and its season, from the friend's own seed, so a day always has the same weather and the
// next day's is known ahead: 🎒's 📻 weather report says it. Snow only in winter, as in Harvest Moon. Today's can be chosen by
// hand in ⚙️ Advanced, for today only. Outside (WEATHER_PLACES), it is drawn over the picture (makerOver, under the night's
// darkness): clouds, rain, snow, wind, fog; inside, under the sea, in a cave or a dungeon, or in the imagination, nothing.
// 60 fps first: a few layers, each one rectangle filled with a pattern and moved by CSS, the whole drawn again only when the
// weather, the place or the picture's frame changes (weatherShow, after each drawing).
const WEATHERS = {
  sunny:  { icon: "☀️", name: "sunny",  say: "Sunshine all day." },
  cloudy: { icon: "⛅", name: "cloudy", say: "Clouds, but no rain." },
  rainy:  { icon: "🌧️", name: "rain",   say: "Rain all day: the plants will love it." },
  snowy:  { icon: "❄️", name: "snow",   say: "Snow! Wrap up warm." },
  windy:  { icon: "💨", name: "windy",  say: "A strong wind: hold on to your hat." },
  foggy:  { icon: "🌫️", name: "fog",    say: "Thick fog: you can hardly see." },
};
const WEATHER_ORDER = ["sunny", "cloudy", "rainy", "snowy", "windy", "foggy"];
// (each season's chances, out of 100)
const WEATHER_SEASONS = {
  winter: { sunny: 25, cloudy: 25, rainy: 0,  snowy: 30, windy: 10, foggy: 10 },
  spring: { sunny: 35, cloudy: 20, rainy: 25, snowy: 0,  windy: 15, foggy: 5 },
  summer: { sunny: 55, cloudy: 15, rainy: 15, snowy: 0,  windy: 10, foggy: 5 },
  autumn: { sunny: 30, cloudy: 25, rainy: 20, snowy: 0,  windy: 15, foggy: 10 },
};
const seasonOf = M => M === 12 || M <= 2 ? "winter" : M <= 5 ? "spring" : M <= 8 ? "summer" : "autumn";
// (outside: where the sky is above; not inside, under the sea, in a cave or a dungeon, or anywhere imagined)
const WEATHER_PLACES = new Set(["forest", "beach", "sea", "witch", "cemetery", "lake", "house", "farmyard", "treehouse", "clearing", "fairyforest",
  "mountains", "waterfall", "campsite", "woodpath", "pasture", "crossing", "castle", "hut", "desert", "garden", "spring"]);
const weatherSet = () => state.weather || (state.weather = clone(DEFAULTS.weather));
const weatherOn = () => !!(state.weather && state.weather.on);
const dateOf = B => [Math.round(B.skyYear ?? 2026), Math.round(B.skyMonth ?? 10), Math.round(B.skyDay ?? 20)];
const dateKey = ([Y, M, D]) => `${Y}-${M}-${D}`;
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dateWords = ([, M, D]) => `${MONTH_NAMES[M - 1] || ""} ${D}`;
function dayAfter([Y, M, D]) { const b = { skyYear: Y, skyMonth: M, skyDay: D }; nextDay(b); return dateOf(b); }
// a day's weather: by its season, from the friend's seed and the date (the same day, always the same)
function weatherByDay([Y, M, D]) {
  const odds = WEATHER_SEASONS[seasonOf(M)], seed = Number(weatherSet().seed ?? 723);
  let r = seeded(seed * 7 + Y * 401 + M * 37 + D)(5) * 100;
  for (const k of WEATHER_ORDER) { r -= odds[k]; if (r < 0) return k; }
  return "sunny";
}
// today's: one chosen by hand for today (⚙️ Advanced), else the day's own
function weatherToday(B = state.background) {
  const W = weatherSet(), d = dateOf(B);
  return W.pick && W.pick !== "auto" && W.pickDay === dateKey(d) && WEATHERS[W.pick] ? W.pick : weatherByDay(d);
}
const weatherTomorrow = (B = state.background) => weatherByDay(dayAfter(dateOf(B)));
// (⚙️ Advanced: today's weather by hand, or "auto", the day's own; kept for today only)
function weatherPick(k) { const W = weatherSet(); W.pick = k; W.pickDay = dateKey(dateOf(state.background)); changed(); }
const weatherPicked = () => { const W = weatherSet(); return W.pick && W.pick !== "auto" && W.pickDay === dateKey(dateOf(state.background)) ? W.pick : "auto"; };

// The picture's weather: an SVG group of layers over [x, y, w, h], the sky's lower edge at hz (or a guess). Each moving layer is
// one rectangle filled with a pattern, a tile wider and taller than the view, moved by one tile by CSS and looping.
function weatherSvg(w, [x, y, W, H], hz) {
  const u = H / 600, sky = hz != null && hz > y && hz < y + H ? hz : y + H * 0.35, n = v => f1(v);
  // (a tile's pseudo-random spots: the same every time)
  const r = seeded(7230);
  let ri = 0; const R = () => r(ri++);
  const css = [], defs = [], layers = [];
  const tint = (fill, op) => layers.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(W)}" height="${n(H)}" fill="${fill}" opacity="${op}"/>`);
  // a falling (or blowing) layer: its tile, what is in it, and how it moves (dx, dy: one tile; secs: how long that takes)
  const layer = (id, tw, th, inner, dx, dy, secs, extra = "") => {
    defs.push(`<pattern id="wx-${id}" patternUnits="userSpaceOnUse" width="${n(tw)}" height="${n(th)}">${inner}</pattern>`);
    css.push(`@keyframes wx-${id}{from{transform:translate(0px,0px)}to{transform:translate(${n(dx)}px,${n(dy)}px)}}` +
             `.wx-${id}{animation:wx-${id} ${secs}s linear infinite}`);
    layers.push(`<g${extra}><rect class="wx-${id}" x="${n(x - tw)}" y="${n(y - th)}" width="${n(W + 2 * tw)}" height="${n(H + 2 * th)}" fill="url(#wx-${id})"/></g>`);
  };
  // clouds: a row of puffy clouds across the sky, twice over, drifting one view's width in secs
  const clouds = (fill, under, op, secs, k = 1) => {
    const one = i => { const cx = x + W * (0.1 + 0.27 * i + 0.08 * R()), cy = y + (sky - y) * (0.25 + 0.35 * R()), s = (55 + 30 * R()) * u * k;
      return `<g opacity="${op}"><ellipse cx="${n(cx)}" cy="${n(cy + s * 0.25)}" rx="${n(s * 1.6)}" ry="${n(s * 0.45)}" fill="${under}"/>` +
             `<ellipse cx="${n(cx - s * 0.7)}" cy="${n(cy)}" rx="${n(s * 0.7)}" ry="${n(s * 0.5)}" fill="${fill}"/>` +
             `<ellipse cx="${n(cx)}" cy="${n(cy - s * 0.25)}" rx="${n(s * 0.85)}" ry="${n(s * 0.7)}" fill="${fill}"/>` +
             `<ellipse cx="${n(cx + s * 0.75)}" cy="${n(cy + s * 0.05)}" rx="${n(s * 0.75)}" ry="${n(s * 0.5)}" fill="${fill}"/></g>`; };
    const row = [0, 1, 2, 3].map(one).join("");
    css.push(`@keyframes wx-clouds{from{transform:translate(0px,0px)}to{transform:translate(${n(-W)}px,0px)}}.wx-clouds{animation:wx-clouds ${secs}s linear infinite}`);
    layers.push(`<g class="wx-clouds">${row}<g transform="translate(${n(W)} 0)">${row}</g></g>`);
  };
  const drops = (tw, th, count, len, width, color, op) => [...Array(count)].map(() => { const px = R() * tw, py = R() * th;
    return `<line x1="${n(px)}" y1="${n(py)}" x2="${n(px - len * 0.18)}" y2="${n(py + len)}" stroke="${color}" stroke-width="${n(width)}" stroke-linecap="round" opacity="${op}"/>`; }).join("");
  const flakes = (tw, count, r0, r1, op) => [...Array(count)].map(() => `<circle cx="${n(R() * tw)}" cy="${n(R() * tw)}" r="${n(r0 + (r1 - r0) * R())}" fill="#ffffff" opacity="${op}"/>`).join("");
  if (w === "cloudy") {
    tint("#6b7280", 0.1);
    clouds("#f3f4f6", "#d1d5db", 0.92, 90);
  } else if (w === "rainy") {
    tint("#334155", 0.26);
    clouds("#9ca3af", "#6b7280", 0.95, 70, 1.2);
    layer("rain-far", 46 * u, 70 * u, drops(46 * u, 70 * u, 4, 14 * u, 1.1 * u, "#dbeafe", 0.4), 0, 70 * u, 0.55);
    layer("rain-near", 70 * u, 110 * u, drops(70 * u, 110 * u, 4, 26 * u, 1.8 * u, "#e0f2fe", 0.6), 0, 110 * u, 0.42);
  } else if (w === "snowy") {
    tint("#e2e8f0", 0.16);
    clouds("#f8fafc", "#cbd5e1", 0.9, 110, 1.1);
    css.push(`@keyframes wx-sway{0%,100%{transform:translate(0px,0px)}50%{transform:translate(${n(14 * u)}px,0px)}}.wx-sway{animation:wx-sway 3.2s ease-in-out infinite}`);
    layer("snow-far", 56 * u, 56 * u, flakes(56 * u, 7, 1.6 * u, 2.6 * u, 0.8), 0, 56 * u, 7, ` class="wx-sway"`);
    layer("snow-near", 96 * u, 96 * u, flakes(96 * u, 6, 3 * u, 5 * u, 0.95), 0, 96 * u, 5);
  } else if (w === "windy") {
    clouds("#f1f5f9", "#cbd5e1", 0.85, 22, 0.9);
    const streaks = (tw, th) => [...Array(4)].map(() => { const px = R() * tw, py = R() * th, l = (60 + 60 * R()) * u;
      return `<line x1="${n(px)}" y1="${n(py)}" x2="${n(px + l)}" y2="${n(py)}" stroke="#ffffff" stroke-width="${n(2.2 * u)}" stroke-linecap="round" opacity="0.7"/>`; }).join("");
    const leaves = (tw, th) => [...Array(5)].map((_, i) => { const px = R() * tw, py = R() * th, c = ["#7bb35a", "#c98a3a", "#a3b84a", "#d97706", "#65a30d"][i];
      return `<ellipse cx="${n(px)}" cy="${n(py)}" rx="${n(8 * u)}" ry="${n(4 * u)}" fill="${c}" transform="rotate(${Math.round(R() * 180)} ${n(px)} ${n(py)})"/>`; }).join("");
    layer("wind", 240 * u, 80 * u, streaks(240 * u, 80 * u), 240 * u, 0, 0.8);
    layer("leaves", 320 * u, 170 * u, leaves(320 * u, 170 * u), 320 * u, 40 * u, 1.9);
  } else if (w === "foggy") {
    defs.push(`<linearGradient id="wx-fog-thick" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="${n(y)}" y2="${n(y + H)}">` +
              `<stop offset="0" stop-color="#f1f5f9" stop-opacity="0.3"/><stop offset="${((sky - y) / H).toFixed(3)}" stop-color="#f1f5f9" stop-opacity="0.62"/>` +
              `<stop offset="1" stop-color="#f1f5f9" stop-opacity="0.42"/></linearGradient>` +
              `<radialGradient id="wx-fog-band"><stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`);
    layers.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(W)}" height="${n(H)}" fill="url(#wx-fog-thick)"/>`);
    const bands = [0, 1, 2].map(i => `<ellipse cx="${n(x + W * (0.2 + 0.33 * i))}" cy="${n(sky + (H - (sky - y)) * (0.15 + 0.3 * R()))}" rx="${n(W * 0.32)}" ry="${n(70 * u)}" fill="url(#wx-fog-band)"/>`).join("");
    css.push(`@keyframes wx-fog{from{transform:translate(0px,0px)}to{transform:translate(${n(W)}px,0px)}}.wx-fog{animation:wx-fog 60s linear infinite}`);
    layers.push(`<g class="wx-fog">${bands}<g transform="translate(${n(-W)} 0)">${bands}</g></g>`);
  }
  return `<style>${css.join("")}</style><defs>${defs.join("")}</defs>${layers.join("")}`;
}
// after each drawing: the weather over the picture, made again only when it, the place or the frame changed (and gone where
// there is none: off, inside, flying, or sunny)
let wxShown = "";
var WX_READY;   // (true once this part has run: in check_load's one joined script, a drawing before it must not reach its consts)
function weatherShow() {
  if (!WX_READY) return;
  const B = state.background, kind = B && B.kind;
  const on = weatherOn() && WEATHER_PLACES.has(kind) && !(typeof flight !== "undefined" && flight);
  const w = on ? weatherToday(B) : "sunny";
  let g = document.getElementById("weather");
  if (!on || w === "sunny") { if (g) g.remove(); wxShown = ""; return; }
  const O = makerOver(), vb = O.getAttribute("viewBox") || "0 0 800 600", hz = CLOCK_SKY.horizon[kind], key = `${w}|${vb}|${hz ?? ""}`;
  if (g && g.parentNode !== O) { g.remove(); g = null; }
  if (!g || key !== wxShown) {
    if (!g) { g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.id = "weather"; g.setAttribute("data-weather", w); O.prepend(g); }
    g.setAttribute("data-weather", w);
    g.innerHTML = weatherSvg(w, vb.split(/[\s,]+/).map(Number), hz);
    wxShown = key;
  }
  // (under the night's darkness, wherever that is)
  const dn = document.getElementById("day-night");
  if (dn && dn.parentNode === O && (g.compareDocumentPosition(dn) & Node.DOCUMENT_POSITION_PRECEDING)) O.insertBefore(g, dn);
}
// 🎒's 📻 weather report: tomorrow's weather, and today's
function weatherReportBox() {
  const B = state.background, today = dateOf(B), tomorrow = dayAfter(today), wt = WEATHERS[weatherTomorrow(B)], wd = WEATHERS[weatherToday(B)];
  return el("div", { class: "items-weather", role: "group", "aria-label": "the weather report" }, [
    el("div", { class: "items-weather-head" }, "📻 The weather report"),
    el("div", { class: "items-weather-row" }, [el("span", { class: "items-weather-icon", "aria-hidden": "true" }, wt.icon),
      el("span", {}, [el("b", {}, `Tomorrow, ${dateWords(tomorrow)}: ${wt.name}.`), " " + wt.say])]),
    el("div", { class: "hint" }, `Today, ${dateWords(today)}: ${wd.icon} ${wd.name}.` + (weatherOn() ? "" : " Turn on 🌦️ weather in ⚙️ Advanced to see it outside."))]);
}
WX_READY = true;
