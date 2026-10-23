# Dress Up's test drivers

Node 22 (its own `fetch` and `WebSocket`, nothing to install) or Python 3, driving a muted headless browser: Chrome over its DevTools port, Firefox through geckodriver. The archive tools live in the archives' own repositories, `dress-up-pictures` and `dress-up-music`.

They run on GitHub's computers, from [`.github/workflows/dress-up-tests.yml`](../.github/workflows/dress-up-tests.yml), on every branch pushed except `main` (a push to `main` deploys the game). Each run's summary prints what they found, and its artifacts hold the files. Frame rates there are a GitHub computer's: compare a branch against `main`, or a case against its control, not against the 55 frames a second a release needs on a real computer.

| Tool | What it does |
|---|---|
| `check_script.py <page>` | The page's inline script through `node --check`: a duplicate `const` once broke the whole page. |
| `sweep.mjs <port> <url> <out.json>` | The safety net's pictures: every place at each time of day, every castle room style in both themes, every costume, from the defaults with every LFO off; each picture's markup hashed. `sweep_diff.py a b` compares two runs. |
| `structure.mjs <port> <url> <out.json>` | The safety net's other half: the defaults, the controls, every show-when rule over a set of castle states, `castleOf`. `structure_diff.py a b` compares two runs. |
| `shots.mjs <port> <url> <cases.json> <outdir>` | A PNG of the game for each case, its JavaScript run on the defaults (music muted). A branch lists what it wants to see in `tools/shots.json`. |
| `scripting520.mjs [hazel-lib.js]` | Ticket 520, no browser: `js/25-scripting.js` in node against a small fake page: the program spec built from the 📜 editors, the levers through `Hazel.runProgram` or the fallback, and the Hazel frame's messages (origin, ready, size, status, crash, a frame that never starts, the keys given back). Given a built `hazel-lib.js` (hazelgrove/hazel#2719's branch), runProgram against the fallback on the real library. Runs on the laptop; `--stack-size=7000` for the library. |
| `fumola_rules_check.mjs [bindings dir]` | Ticket 542, no browser: `js/25-fumola.js` (the room rules in Fumola, and the page's own text-in, JSON-out glue) run in node on Fumola's wasm build (`fumola_wasm.js` and `fumola_wasm_bg.wasm`; default `~/fumola-wasm-main/bindings`), every case `hazelrules531.mjs` gives the Hazel rules, against the same game JS, in both modes (the World map held in Fumola, and passed in), plus named edges and Common's helpers. About 20 s; runs on the laptop, one node, light. |
| `checks/*.mjs <port> <url>` | A branch's own checks, each run in CI and failing it with exit status 1 (a feature's behavior, such as `collide176.mjs`). |
| `checks/objects180.mjs` and `objects_md.py` | OBJECTS.md's pictures: every place, and each object clipped from it, made on GitHub (`out/objects/` in the run's artifact); `objects_md.py` writes the doc from them (ticket 180). |
| `fpsgate.mjs <port> <url> [cases]` | The frame-rate gate (ticket 152): the scenes that had trouble, walked with a fake controller and dragged with real mouse events, three runs each. `SLOW=1`, `BLACK=1` for the slow tiers. |
| `audit160.mjs <port> <url> [cases]` | Every place, castle room style and tree-house room walked with the on-screen controller (ticket 160). |
| `leak167.mjs <port> <url> <friend.json \| -> [rounds]` | Ticket 167, in Chrome: the duck pond fresh, after rounds of changes, after a reload, with what might grow counted (elements, listeners, heap, timers, animations, audio nodes). `-` is the default friend; a saved friend stays off this public repository. |
| `speedlog.py <log url> [--since YYYY-MM-DD]` | The 🧪 and ⏱️ lines sent with 📮 (ticket 166), read back from the Fumola canister's log. |
| `leakff.py <url> <friend.json \| -> [rounds]` | The same in Firefox. `CLEAR=1` adds the game's caches emptied and the music paused before the reload; `CONTROL=1` swims for as long instead of making changes. |
