#!/usr/bin/env bash
# (ticket 600) report 18 from a run of tools/checks/storyguide600.mjs, as 017's finish.sh does report 17. The guide from a run (its chrome artifact downloaded to <dir>): the dark pictures as WebP for the web
# report, the quoted texts, the run's facts, the page and its print version built, and the zine laid out into dress-up/manuals/.
#   bash dress-up/reports/018/drivers/finish.sh <artifact dir> <run id> <version>
set -euo pipefail
art="$1"; run="$2"; ver="$3"; R="$(cd "$(dirname "$0")/.." && pwd)"; M="$R/../../manuals"
mkdir -p "$R/pictures" "$M"
rm -f "$R/pictures"/*.png "$R/pictures"/*.webp
for f in "$art"/storyguide/*.png; do ffmpeg -loglevel error -y -i "$f" -c:v libwebp -quality 82 "$R/pictures/$(basename "${f%.png}").webp"; done
cp "$art/storyguide/texts.json" "$R/data/texts.json"
game=$(git -C "$R" rev-parse --short origin/main)
printf '{"branch": "diag-600", "game": "%s", "version": "%s", "id": "%s", "url": "https://github.com/matthewhammer/kids-choice-games/actions/runs/%s"}\n' "$game" "$ver" "$run" "$run" > "$R/data/run.json"
python3 "$R/drivers/build.py"
bash "$R/../017/drivers/zine.sh" "$art/storyguide/guide-half.pdf" "$art/zine" 8
gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -dPDFSETTINGS=/printer -dCompatibilityLevel=1.6 -sOutputFile="$M/story-scripts-guide-$ver-zine.pdf" "$art/zine/zine.pdf"
du -h "$R/pictures" "$M/story-scripts-guide-$ver-zine.pdf" "$art/zine/zine.pdf" | sed 's|.*/kcg-566/||'
