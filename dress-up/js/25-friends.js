"use strict";
// Messed Up Dress Up. Copyright 2026 Matthew Hammer and family (M and N). Reuse welcome, with credit: see LICENSE and NOTICE.
// SPDX-License-Identifier: Apache-2.0
// (ticket 615, Matthew 2026-10-25: "M can no longer easily save files on the ipad --- ... it's really hard now for a kid, or me,
// or anyone that's not familar with what's happening"; "can we save in the browser database somehow?") Saved friends, kept in
// this browser: 💾 Save adds the friend shown, with a small picture of it, to the browser's own storage (IndexedDB), and 📂 Load
// lists them, newest first: a tap brings one back, ✖ twice removes it. Nothing leaves the device, and no file is written, so a
// tablet asks nothing (an iPad's Home Screen app turned a file into its share sheet). A file is still a tap away: ▾ beside
// 💾 Save writes them, and "📄 from a file" here reads one. Where the browser keeps nothing (a private window), 💾 Save writes
// the file instead (24-surprise-save-start-over.js). Each friend is a row { id, made, file, thumb }: file is what a .json
// holds (snapshotFile), thumb a small .png of the picture as a data: URL.
const FRIENDS_DB = "dress-up-friends", FRIENDS_STORE = "friends", FRIENDS_THUMB_H = 160;
let friendsRemoving = null;   // (the one whose ✖ was tapped once, waiting for the second tap)

function friendsDb() {
  if (!friendsDb.p) friendsDb.p = new Promise((ok, no) => {
    if (typeof indexedDB === "undefined") { no(new Error("no IndexedDB")); return; }
    const r = indexedDB.open(FRIENDS_DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(FRIENDS_STORE, { keyPath: "id" });
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  });
  return friendsDb.p;
}
function friendsTx(mode, f) {
  return friendsDb().then(db => new Promise((ok, no) => {
    const t = db.transaction(FRIENDS_STORE, mode), req = f(t.objectStore(FRIENDS_STORE));
    t.oncomplete = () => ok(req ? req.result : undefined); t.onerror = () => no(t.error); t.onabort = () => no(t.error);
  }));
}
async function friendsAll() {
  const all = (await friendsTx("readonly", s => s.getAll())) || [];
  return all.sort((a, b) => b.made - a.made);
}

// the picture as it is drawn, small, as a .png (as Save draws its .png); null when it cannot be drawn
function friendsThumb() {
  return new Promise(res => {
    try {
      const pic = document.getElementById("pic"), vb = pic.viewBox.baseVal, scale = FRIENDS_THUMB_H / vb.height;
      const copy = unrastered(pic.cloneNode(true));
      const w = Math.max(1, Math.round(vb.width * scale));
      copy.setAttribute("width", w); copy.setAttribute("height", FRIENDS_THUMB_H);
      const img = new Image();
      img.onload = () => { try { const c = document.createElement("canvas"); c.width = w; c.height = FRIENDS_THUMB_H;
        c.getContext("2d").drawImage(img, 0, 0); res(c.toDataURL("image/png")); } catch (e) { res(null); } };
      img.onerror = () => res(null);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(copy));
      setTimeout(() => res(null), 4000);
    } catch (e) { res(null); }
  });
}

// 💾 Save: the friend shown, kept here; true when kept
async function friendsSave() {
  const d = new Date(), file = snapshotFile(d);
  const row = { id: "f" + d.getTime().toString(36) + Math.floor(Math.random() * 1296).toString(36), made: d.getTime(), file: JSON.parse(JSON.stringify(file)), thumb: null };
  try {
    await friendsTx("readwrite", s => s.put(row));   // (kept first: a picture that cannot be drawn loses nothing)
  } catch (e) { return false; }
  const thumb = await friendsThumb();
  if (thumb) { row.thumb = thumb; try { await friendsTx("readwrite", s => s.put(row)); } catch (e) { /* (kept without its picture) */ } }
  return true;
}

const friendsWhen = t => {
  const d = new Date(t), now = new Date(), hm = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const days = Math.round((new Date(now.toDateString()) - new Date(d.toDateString())) / 864e5);
  return days === 0 ? "today " + hm : days === 1 ? "yesterday " + hm : d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + hm;
};

// 📂 Load: the friends kept here, and a file
async function friendsOpen() {
  const old = document.querySelector(".friends-pop");
  if (old) old.remove();
  let list = null;
  try { list = await friendsAll(); } catch (e) { list = null; }
  const close = () => { pop.remove(); document.removeEventListener("keydown", esc, true); document.getElementById("load").focus(); };
  const esc = e => { if (e.key === "Escape") { e.preventDefault(); close(); } };
  const fromFile = el("button", { class: "friends-file", onclick: () => { close(); document.getElementById("load-file").click(); } }, "📄 from a file…");
  const grid = el("div", { class: "friends-grid" });
  const draw = () => {
    if (!list) { grid.replaceChildren(el("p", { class: "hint" }, "This browser keeps nothing here (a private window?): load from a file instead.")); return; }
    if (!list.length) { grid.replaceChildren(el("p", { class: "hint" }, "No friends saved here yet: 💾 Save keeps the friend you see, in this browser.")); return; }
    grid.replaceChildren(...list.map(f => {
      const pick = el("button", { class: "friends-pick", title: "Bring this friend back", onclick: () => {
        try { loadSaved(f.file); close(); } catch (err) { alert("That friend didn't load: " + err.message); } } },
        [f.thumb ? el("img", { src: f.thumb, alt: "a saved friend" }) : el("span", { class: "friends-nopic" }, "🧍"), el("span", { class: "friends-when" }, friendsWhen(f.made))]);
      const rm = el("button", { class: "friends-remove" + (friendsRemoving === f.id ? " asking" : ""), title: "Remove this saved friend (tap twice)",
        "aria-label": "Remove this saved friend", onclick: async () => {
          if (friendsRemoving !== f.id) { friendsRemoving = f.id; draw(); return; }
          friendsRemoving = null;
          try { await friendsTx("readwrite", s => s.delete(f.id)); } catch (e) { /* (stays listed) */ }
          list = list.filter(x => x.id !== f.id); draw(); } }, friendsRemoving === f.id ? "✖ remove?" : "✖");
      return el("div", { class: "friends-card" }, [pick, rm]);
    }));
  };
  draw();
  const pop = el("div", { class: "friends-pop", role: "dialog", "aria-modal": "true", "aria-labelledby": "friends-title" }, [
    el("div", { class: "friends-box" }, [
      el("div", { class: "friends-head" }, [el("h2", { id: "friends-title" }, "📂 Your saved friends"),
        el("button", { class: "friends-close", "aria-label": "Close", onclick: () => close() }, "✖")]),
      el("p", { class: "hint" }, "Kept in this browser, on this device. Tap one to bring it back."),
      grid, el("div", { class: "row friends-foot" }, [fromFile])])]);
  pop.addEventListener("click", e => { if (e.target === pop) close(); });
  document.body.append(pop); document.addEventListener("keydown", esc, true);
  (pop.querySelector(".friends-pick") || fromFile).focus();
}
