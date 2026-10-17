# Dress Up's test drivers

Node 22 (its own `fetch` and `WebSocket`, nothing to install) or Python 3, driving a muted headless browser: Chrome over its DevTools port, Firefox through geckodriver. The archive tools live in the archives' own repositories, `dress-up-pictures` and `dress-up-music`.

They run on GitHub's computers, from [`.github/workflows/dress-up-tests.yml`](../.github/workflows/dress-up-tests.yml), on every branch pushed except `main` (a push to `main` deploys the game). Each run's summary prints what they found, and its artifacts hold the files. Frame rates there are a GitHub computer's: compare a branch against `main`, or a case against its control, not against the 55 frames a second a release needs on a real computer.

| Tool | What it does |
|---|---|
| `check_script.py <page>` | The page's inline script through `node --check`: a duplicate `const` once broke the whole page. |
| `sweep.mjs <port> <url> <out.json>` | The safety net's pictures: every place at each time of day, every castle room style in both themes, every costume, from the defaults with every LFO off; each picture's markup hashed. `sweep_diff.py a b` compares two runs. |
| `structure.mjs <port> <url> <out.json>` | The safety net's other half: the defaults, the controls, every show-when rule over a set of castle states, `castleOf`. `structure_diff.py a b` compares two runs. |
| `shots.mjs <port> <url> <cases.json> <outdir>` | A PNG of the game for each case, its JavaScript run on the defaults (music muted). A branch lists what it wants to see in `tools/shots.json`. |
| `checks/*.mjs <port> <url>` | A branch's own checks, each run in CI and failing it with exit status 1 (a feature's behavior, such as `collide176.mjs`). |
| `fpsgate.mjs <port> <url> [cases]` | The frame-rate gate (ticket 152): the scenes that had trouble, walked with a fake controller and dragged with real mouse events, three runs each. `SLOW=1`, `BLACK=1` for the slow tiers. |
| `audit160.mjs <port> <url> [cases]` | Every place, castle room style and tree-house room walked with the on-screen controller (ticket 160). |
| `leak167.mjs <port> <url> <friend.json \| -> [rounds]` | Ticket 167, in Chrome: the duck pond fresh, after rounds of changes, after a reload, with what might grow counted (elements, listeners, heap, timers, animations, audio nodes). `-` is the default friend; a saved friend stays off this public repository. |
| `speedlog.py <log url> [--since YYYY-MM-DD]` | The 🧪 and ⏱️ lines sent with 📮 (ticket 166), read back from the Fumola canister's log. |
| `leakff.py <url> <friend.json \| -> [rounds]` | The same in Firefox. `CLEAR=1` adds the game's caches emptied and the music paused before the reload; `CONTROL=1` swims for as long instead of making changes. |
