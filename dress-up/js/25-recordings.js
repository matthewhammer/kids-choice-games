"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 608, N and M, through Matthew, 2026-10-24: "new 'recordings' chip, at top level for MUDU --- record from the
// microphone ... until the user presses stop. create a button on the panel with that recording, with time it was created;
// length; optional label (they can't type much, so give them emoji options, as many as possible). x --- remove button to
// delete. when pressed, it replays the recording"; then: "if you can render a little 'wav recording picture' (like a DAW or
// audio recording editor shows), that could help them too. Let them choose a color for each play-recording-button")
// 🎙️ Recordings: ⏺ records from the microphone until ⏹; each recording a button that plays it, with its wave drawn, when it
// was made, how long it is, an emoji for a name (🏷️) and a colour (🎨), and ✖ to remove it (a second tap, so a stray tap
// keeps it).
// PRIVACY: a recording never leaves this browser. It is kept in this browser's own storage for this site (IndexedDB,
// REC_DB), never in the friend's state, so never in 💾 saves, links or anything sent; nothing here makes a request. The
// microphone is opened only by a press of ⏺ and let go at ⏹ (every track stopped, so the browser's 🎙️ sign goes out).
// It is kept in the browser's own format (Opus in WebM on Chrome and Firefox, AAC in MP4 on Safari), not MP3: browsers
// record only those, and play back what they record.
// (checks) recTestStream, when set, is a function giving the MediaStream to record instead of the microphone (an
// oscillator's, in tools/checks/recordings608.mjs: no microphone and no prompt on GitHub's machines).
const REC_DB = "dress-up-recordings", REC_STORE = "recs";
const REC_MAX_MS = 10 * 60 * 1000;   // (ten minutes, then it stops by itself: a forgotten ⏺ doesn't fill the computer)
const REC_TYPES = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"];
const REC_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#facc15", "#a3e635", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#fecaca", "#fde68a", "#bbf7d0", "#bfdbfe", "#e9d5ff", "#a16207", "#78716c", "#1f2937", "#ffffff"];
// (as many as we can: they can't type much) the emoji to name a recording with, by kind
const REC_EMOJI = [
  ["😀", "faces", "😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖 😺 😸 😹 😻 😼 😽 🙀 😿 😾"],
  ["🧒", "people", "👋 🤚 ✋ 🖖 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 👍 👎 ✊ 👊 👏 🙌 👐 🤲 🙏 💪 👂 👃 👀 👅 👄 👶 🧒 👦 👧 🧑 👨 👩 🧓 👴 👵 👮 🕵️ 💂 👷 🤴 👸 👳 🧕 🤵 👰 🤰 🤱 👼 🎅 🤶 🦸 🦹 🧙 🧚 🧛 🧜 🧝 🧞 🧟 💃 🕺 🏃 🚶 🧘 🛀 🛌"],
  ["🐶", "animals", "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🦗 🕷️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐅 🐆 🦓 🦍 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🐈 🐓 🦃 🦚 🦜 🦢 🦩 🕊️ 🐇 🦝 🦨 🦡 🦦 🦥 🐁 🐀 🐿️ 🦔 🐉 🐲"],
  ["🌻", "nature and weather", "🌵 🎄 🌲 🌳 🌴 🌱 🌿 ☘️ 🍀 🍁 🍂 🍃 🍄 🌾 💐 🌷 🌹 🥀 🌺 🌸 🌼 🌻 🌞 🌝 🌛 🌜 🌚 🌕 🌙 🌎 🪐 💫 ⭐ 🌟 ✨ ⚡ ☄️ 💥 🔥 🌪️ 🌈 ☀️ ⛅ ☁️ 🌧️ ⛈️ 🌩️ ❄️ ☃️ ⛄ 🌬️ 💨 💧 💦 🌊"],
  ["🍓", "food", "🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🌽 🥕 🥔 🍠 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🌮 🌯 🥗 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🍤 🍙 🍚 🍘 🍥 🥠 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🥛 🍼 🧃 🍯"],
  ["⚽", "play and music", "⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🏓 🏸 🥅 🏒 🏑 🥍 🏏 ⛳ 🏹 🎣 🥊 🥋 🎽 🛹 🛷 ⛸️ 🥌 🎿 🏂 🏆 🥇 🥈 🥉 🏅 🎖️ 🎪 🤹 🎭 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🎷 🎺 🎸 🎻 🎲 🧩 ♟️ 🎯 🎳 🎮 🎰 🧸 🪀 🪁 🎈 🎉 🎊 🎁 🎀 🪄 🔮"],
  ["🚀", "going places", "🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🚚 🚛 🚜 🛴 🚲 🛵 🏍️ 🚨 🚔 🚍 🚘 🚖 🚡 🚠 🚃 🚋 🚞 🚝 🚄 🚅 🚈 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🛩️ 🚀 🛸 🚁 🛶 ⛵ 🚤 🛥️ 🛳️ ⛴️ 🚢 ⚓ 🏰 🏯 🏟️ 🎡 🎢 🎠 ⛲ ⛱️ 🏖️ 🏝️ 🏜️ 🌋 ⛰️ 🏔️ 🗻 🏕️ ⛺ 🏠 🏡 🏘️ 🏚️ 🏗️ 🏭 🏢 🏬 🏥 🏦 🏨 🏪 🏫 💒 🏛️ ⛪ 🗼 🗽 🌉"],
  ["👑", "things", "👑 🎩 🧢 👒 🎓 ⛑️ 💍 💎 👓 🕶️ 🥽 🧣 🧤 🧥 👗 👘 👙 👚 👛 👜 🎒 👞 👟 🥾 🥿 👠 👡 👢 🩰 ⌚ 📱 💻 ⌨️ 🖥️ 🖱️ 💾 💿 📷 📹 🎥 📞 ☎️ 📺 📻 🧭 ⏰ ⌛ ⏳ 📡 🔋 🔌 💡 🔦 🕯️ 💰 💵 🪙 🔧 🔨 🛠️ ⛏️ 🔩 ⚙️ 🧱 🧲 💣 🧨 🪓 🗡️ ⚔️ 🛡️ 🏺 🔭 🔬 💊 🩹 🧬 🦠 🧪 🌡️ 🧹 🧺 🧻 🛁 🧼 🧽 🔑 🗝️ 🚪 🪑 🛋️ 🛏️ 🖼️ 🛒 🎟️ ✉️ 📦 📫 📜 📄 📅 📌 📎 ✂️ 🖍️ ✏️ 🖊️ 📝 🔍 🔒 🔓"],
  ["❤️", "hearts, colours and signs", "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ☯️ 🔆 ♻️ ✅ ❌ ❓ ❗ 💯 💤 💬 💭 🎵 🎶 ➕ ➖ ✖️ ➗ 🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 🟫 ⬛ ⬜ 🔶 🔷 🔺 🔻 💠 🔔 📣 📢 🏳️ 🏴 🚩 🏁 🏳️‍🌈 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟"],
].map(([icon, name, list]) => [icon, name, list.split(" ")]);
let recList = null;             // (the recordings, newest first, once read from the browser's storage)
let recMemoryOnly = false;      // (true when this browser keeps nothing: a private window, storage blocked; then until the page closes)
let recNow = null;              // (the one being made: { phase: "asking" | "recording", stream, mr, chunks, t0, peaks, an, ctx })
let recPlaying = null;          // (the one playing: { id, a, url, timer })
let recRemoving = null;         // (the one whose ✖ was tapped once, waiting for the second tap)
let recSaid = "";               // (a line to show: why it can't record)
let recDraw = null;             // (the panel's redraw, while it is shown)
let recTestStream = null;       // (checks: a function giving a MediaStream to record instead of the microphone)

// The browser's own storage: one object store, a recording per row ({ id, made, ms, type, data, peaks, emoji, color }).
function recDb() {
  if (!recDb.p) recDb.p = new Promise((ok, no) => {
    if (typeof indexedDB === "undefined") { no(new Error("no IndexedDB")); return; }
    const r = indexedDB.open(REC_DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(REC_STORE, { keyPath: "id" });
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  });
  return recDb.p;
}
function recTx(mode, f) {
  return recDb().then(db => new Promise((ok, no) => {
    const t = db.transaction(REC_STORE, mode), req = f(t.objectStore(REC_STORE));
    t.oncomplete = () => ok(req ? req.result : undefined); t.onerror = () => no(t.error); t.onabort = () => no(t.error);
  }));
}
async function recLoad() {
  if (recList) return recList;
  try { recList = (await recTx("readonly", s => s.getAll())) || []; } catch (e) { recList = recList || []; recMemoryOnly = true; }
  recList.sort((a, b) => b.made - a.made);
  return recList;
}
const recKeep = r => recMemoryOnly ? Promise.resolve() : recTx("readwrite", s => s.put(r)).catch(() => { recMemoryOnly = true; recRedraw(); });
const recForget = id => recMemoryOnly ? Promise.resolve() : recTx("readwrite", s => s.delete(id)).catch(() => {});
const recRedraw = () => { if (recDraw) recDraw(); };

// ⏺: ask for the microphone (the browser asks the first time), then record until ⏹ (or REC_MAX_MS)
async function recStart() {
  if (recNow) return;
  recStopPlaying(); recSaid = "";
  const can = recTestStream || (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder !== "undefined");
  if (!can) { recSaid = "🎙️ This browser can't record here."; recRedraw(); return; }
  recNow = { phase: "asking" }; recRedraw();
  let stream;
  try { stream = recTestStream ? await recTestStream() : await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (e) {
    recNow = null;
    recSaid = e && (e.name === "NotAllowedError" || e.name === "SecurityError") ? "🎙️ The browser said no to the microphone. A grown-up can allow it (the 🔒 or 🎙️ by the address) and try again."
      : "🎙️ No microphone was found.";
    recRedraw(); return;
  }
  const type = REC_TYPES.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
  let mr;
  try { mr = new MediaRecorder(stream, type ? { mimeType: type } : {}); }
  catch (e) { for (const t of stream.getTracks()) t.stop(); recNow = null; recSaid = "🎙️ This browser can't record here."; recRedraw(); return; }
  const R = recNow = { phase: "recording", stream, mr, chunks: [], t0: performance.now(), t1: 0, peaks: [], type: mr.mimeType || type || "audio/webm" };
  mr.ondataavailable = e => { if (e.data && e.data.size) R.chunks.push(e.data); };
  mr.onstop = () => recFinish(R);
  // (the level as it records, for the wave: an analyser on the same sound, read every 50 ms; a timer, not frames, as a
  // hidden page draws no frames)
  try { const AC = window.AudioContext || window.webkitAudioContext; R.ctx = new AC(); R.an = R.ctx.createAnalyser(); R.an.fftSize = 1024;
    R.ctx.createMediaStreamSource(stream).connect(R.an); R.buf = new Float32Array(R.an.fftSize); } catch (e) { R.an = null; }
  R.timer = setInterval(() => recTick(R), 50);
  mr.start(250);
  recRedraw();
}
function recTick(R) {
  if (R.an) { R.an.getFloatTimeDomainData(R.buf); let m = 0; for (let i = 0; i < R.buf.length; i++) { const v = Math.abs(R.buf[i]); if (v > m) m = v; } R.peaks.push(m); }
  else R.peaks.push(0);
  if (performance.now() - R.t0 >= REC_MAX_MS) recStop();
  if (recDraw && recDraw.live) recDraw.live();
}
function recStop() {
  const R = recNow;
  if (!R || R.phase !== "recording" || R.t1) return;
  R.t1 = performance.now();
  try { R.mr.stop(); } catch (e) { recFinish(R); }
}
// (⏹, or the end: the microphone let go at once, then the recording kept, newest first)
async function recFinish(R) {
  if (R.done) return; R.done = true;
  clearInterval(R.timer);
  for (const t of R.stream.getTracks()) t.stop();
  if (R.ctx) R.ctx.close().catch(() => {});
  const blob = new Blob(R.chunks, { type: R.type });
  recNow = null;
  if (!blob.size) { recSaid = "🎙️ Nothing was recorded."; recRedraw(); return; }
  await recLoad();
  const made = Date.now(), r = { id: made + "-" + Math.random().toString(36).slice(2, 7), made, ms: Math.max(1, Math.round((R.t1 || performance.now()) - R.t0)),
    type: blob.type || R.type, data: await blob.arrayBuffer(), peaks: recPeaks(R.peaks, 120), emoji: "", color: REC_COLORS[(recList.length * 7) % REC_COLORS.length] };
  recList.unshift(r);
  recRedraw();
  await recKeep(r);
}
// (the wave's picture: the loudest moment of each of n slices, scaled so the loudest is full height; a quiet recording is
// scaled up at most 10 times, so silence stays flat)
function recPeaks(p, n) {
  if (!p.length) return [];
  const out = [], top = Math.max(0.1, ...p);
  for (let i = 0; i < n; i++) { const a = Math.floor(i * p.length / n), b = Math.max(a + 1, Math.floor((i + 1) * p.length / n));
    let m = 0; for (let j = a; j < b && j < p.length; j++) m = Math.max(m, p[j]); out.push(Math.round(Math.min(1, m / top) * 1000) / 1000); }
  return out;
}
function recPlay(r) {
  if (recPlaying && recPlaying.id === r.id) { recStopPlaying(); recRedraw(); return; }
  recStopPlaying();
  const url = URL.createObjectURL(new Blob([r.data], { type: r.type })), a = new Audio(url);
  const P = recPlaying = { id: r.id, a, url };
  a.onended = () => { if (recPlaying === P) { recStopPlaying(); recRedraw(); } };
  a.play().catch(() => { if (recPlaying === P) { recStopPlaying(); recSaid = "🔇 This browser can't play that one."; recRedraw(); } });
  P.timer = setInterval(() => { if (recDraw && recDraw.head) recDraw.head(); }, 50);
  recRedraw();
}
function recStopPlaying() {
  const P = recPlaying; if (!P) return;
  recPlaying = null; clearInterval(P.timer);
  try { P.a.pause(); } catch (e) { /* (gone already) */ }
  URL.revokeObjectURL(P.url);
}
async function recRemove(r) {
  if (recPlaying && recPlaying.id === r.id) recStopPlaying();
  recRemoving = null;
  recList = recList.filter(x => x.id !== r.id);
  recRedraw();
  await recForget(r.id);
}
function recSet(r, k, v) { r[k] = v; recRedraw(); recKeep(r); }

const recClock = ms => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
function recWhen(t) {
  const d = new Date(t), now = new Date(), time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const day = d.toDateString() === now.toDateString() ? "today" : d.toDateString() === new Date(now - 864e5).toDateString() ? "yesterday"
    : d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return `${day} ${time}`;
}
// (the ink on a button of that colour: dark on a light one, white on a dark one)
function recInk(c) {
  const n = parseInt(c.slice(1), 16), [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#111" : "#fff";
}
// (a wave, as a recording editor draws one: a bar each slice, up and down from the middle; with `at` (0..1), what has played
// drawn full and the rest faded, and a line where it is)
function recWave(cv, peaks, ink, at = null) {
  const dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 160, h = cv.clientHeight || 40;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  const n = peaks.length, mid = h / 2;
  g.fillStyle = ink; g.globalAlpha = 0.35; g.fillRect(0, mid - 0.5, w, 1);
  if (!n) { g.globalAlpha = 1; return; }
  const step = w / n, bar = Math.max(1, step * 0.7);
  for (let i = 0; i < n; i++) { const x = i * step, y = Math.max(0.75, peaks[i] * (mid - 2));
    g.globalAlpha = at === null || (i + 0.5) / n <= at ? 0.95 : 0.35; g.fillRect(x, mid - y, bar, 2 * y); }
  if (at !== null) { g.globalAlpha = 1; g.fillRect(Math.min(w - 2, at * w), 0, 2, h); }
  g.globalAlpha = 1;
}
// (a pop-up of chips, as everywhere in the game (chipBox): the emoji by kind, a row of kinds at the top; and 🚫 no name)
function recEmojiBox(r) {
  let kind = Math.max(0, REC_EMOJI.findIndex(([, , list]) => list.includes(r.emoji)));
  const chips = k => REC_EMOJI[k][2].map(e => [e, e, e === r.emoji]);
  const box = chipBox("🏷️ a name for this recording: an emoji", "a name for this recording", chips(kind), v => recSet(r, "emoji", v), "person-pick-chip rec-emoji-chip", "emoji");
  const close = () => box.querySelector(".person-pick-cancel").click();
  const grid = box.querySelector(".person-pick-chips");
  const show = k => { kind = k;
    grid.replaceChildren(...chips(k).map(([v, lab, on]) => el("button", { class: "person-pick-chip rec-emoji-chip", "data-emoji": v, "aria-pressed": String(on), onclick: () => { close(); recSet(r, "emoji", v); } }, lab)));
    for (const b of kinds.children) b.setAttribute("aria-pressed", String(+b.dataset.kind === k)); };
  const kinds = el("div", { class: "row rec-emoji-kinds" }, REC_EMOJI.map(([icon, name], k) =>
    el("button", { "data-kind": k, title: name, "aria-label": name, "aria-pressed": String(k === kind), onclick: () => show(k) }, icon)));
  box.querySelector(".cap").after(kinds);
  box.querySelector(".person-pick-foot").prepend(el("button", { class: "rec-emoji-none", onclick: () => { close(); recSet(r, "emoji", ""); } }, "🚫 no name"));
  return box;
}
function recColorBox(r) {
  return chipBox("🎨 this recording's colour", "this recording's colour", REC_COLORS.map(c => [c, el("span", { class: "rec-swatch", style: `background:${c}` }), c === r.color]),
    v => recSet(r, "color", v), "person-pick-chip rec-color-chip", "color");
}

// The 🎙️ Recordings panel (its tab's one control, as 📜 Scripting's: control(), kind "recordings")
function recordingsPanel(box) {
  const rec = el("button", { class: "rec-record", onclick: () => recNow ? recStop() : recStart() });
  const live = el("canvas", { class: "rec-live", "aria-hidden": "true" });
  const said = el("div", { class: "hint rec-said", role: "status", "aria-live": "polite" });
  const list = el("div", { class: "rec-list" });
  const note = el("div", { class: "hint rec-note" });
  box.append(el("div", { class: "row rec-top" }, [rec, live]), said, list, note);
  const cards = new Map();
  const card = r => {
    const ink = recInk(r.color), wave = el("canvas", { class: "rec-wave", "aria-hidden": "true" });
    const playing = !!recPlaying && recPlaying.id === r.id;
    const play = el("button", { class: "rec-play", "data-rec": r.id, style: `background:${r.color};color:${ink};border-color:${r.color}`, "aria-pressed": String(playing),
      "aria-label": `${playing ? "stop" : "play"} the recording${r.emoji ? " " + r.emoji : ""} made ${recWhen(r.made)}, ${recClock(r.ms)} long`, onclick: () => recPlay(r) }, [
      el("span", { class: "rec-icon" }, playing ? "⏹" : "▶"),
      el("span", { class: "rec-emoji" }, r.emoji || ""),
      wave,
      el("span", { class: "rec-words" }, [el("span", { class: "rec-len" }, recClock(r.ms)), el("span", { class: "rec-made" }, recWhen(r.made))])]);
    const removing = recRemoving === r.id;
    const tools = el("div", { class: "rec-tools" }, [
      el("button", { class: "rec-name", title: "a name: an emoji", "aria-label": "give it a name: an emoji", onclick: () => recEmojiBox(r) }, "🏷️"),
      el("button", { class: "rec-color", title: "its colour", "aria-label": "choose its colour", onclick: () => recColorBox(r) }, "🎨"),
      el("button", { class: "rec-remove" + (removing ? " sure" : ""), title: removing ? "tap again to remove it" : "remove it", "aria-label": removing ? "tap again to remove this recording" : "remove this recording",
        onclick: () => { if (recRemoving === r.id) recRemove(r); else { recRemoving = r.id; recRedraw(); setTimeout(() => { if (recRemoving === r.id) { recRemoving = null; recRedraw(); } }, 4000); } } }, removing ? "✖ remove?" : "✖")]);
    const c = el("div", { class: "rec-card", "data-rec": r.id }, [play, tools]);
    cards.set(r.id, { c, wave, r, ink });
    return c;
  };
  const draw = () => {
    if (draw.shown && !box.isConnected) { if (recDraw === draw) recDraw = null; return; }   // (another tab now: let go)
    if (box.isConnected) draw.shown = true;
    const R = recNow;
    rec.textContent = !R ? "⏺ record" : R.phase === "asking" ? "🎙️ asking the browser…" : `⏹ stop  ${recClock(performance.now() - R.t0)}`;
    rec.classList.toggle("on", !!R && R.phase === "recording");
    rec.setAttribute("aria-pressed", String(!!R));
    live.hidden = !R || R.phase !== "recording";
    said.textContent = recSaid; said.hidden = !recSaid;
    cards.clear();
    if (!recList) list.replaceChildren(el("div", { class: "hint" }, "…"));
    else list.replaceChildren(...(recList.length ? recList.map(card) : [el("div", { class: "hint rec-empty" }, "No recordings yet: tap ⏺ record, talk or sing, then ⏹ stop.")]));
    for (const { wave, r, ink } of cards.values()) recWave(wave, r.peaks || [], ink, recPlaying && recPlaying.id === r.id ? 0 : null);
    note.textContent = recMemoryOnly ? "🔒 This browser keeps nothing here (a private window?), so these go when the page closes. Nothing is sent anywhere."
      : "🔒 Recordings stay in this browser, on this computer: nothing is sent anywhere, and they are not in 💾 saves.";
    draw.live();
  };
  draw.live = () => {
    const R = recNow;
    if (!R || R.phase !== "recording") return;
    const t = `⏹ stop  ${recClock(performance.now() - R.t0)}`; if (rec.textContent !== t) rec.textContent = t;
    recWave(live, R.peaks.slice(-80), getComputedStyle(rec).color || "#e11d48");
  };
  draw.head = () => {
    const P = recPlaying, k = P && cards.get(P.id);
    if (!k) return;
    const d = isFinite(P.a.duration) && P.a.duration > 0 ? P.a.duration : k.r.ms / 1000;
    recWave(k.wave, k.r.peaks || [], k.ink, Math.min(1, P.a.currentTime / d));
  };
  recDraw = draw;
  draw();
  setTimeout(() => { if (recDraw === draw) draw(); }, 0);   // (once the panel is on the page, the waves drawn at their size)
  if (!recList) recLoad().then(() => { if (recDraw === draw) draw(); });
}
