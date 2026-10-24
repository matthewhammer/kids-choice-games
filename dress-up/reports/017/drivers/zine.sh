#!/usr/bin/env bash
# (Matthew, 2026-10-24: "a low-toner, Black and White, PDF version of the manual ... like a zine, where each US Letter sized page (I will
# print on US Letter) has 2 pages on top, and 2 pages on back, and they are meant to be folded and stapled, so the page order respects
# that final construction"; "a final set of 4 pages ... coloring pages")
# The guide's half-letter pages (guide-half.pdf, printed by Chrome in tools/checks/manual593.mjs) laid out for a saddle-stitched zine:
# blank pages for notes added before the last four (the coloring pages), so the count is a multiple of 4 and the coloring pages stay
# last; then two pages to each side of a landscape Letter sheet, in the order that, printed on both sides (flip on the SHORT edge),
# stacked, folded in half and stapled on the fold, reads 1, 2, 3 ... Writes zine.pdf, one copy (Matthew: "One copy per PDF is perfect":
# print it twice for two).
#   bash dress-up/reports/017/drivers/zine.sh <guide-half.pdf> <out dir>
set -euo pipefail
in="$1"; out="$2"; mkdir -p "$out"
n=$(pdfinfo "$in" | awk '/^Pages:/ {print $2}')
pad=$(( (4 - n % 4) % 4 ))
body=$(( n - 4 ))
blanks=""; for _ in $(seq 1 $pad); do blanks="$blanks,{}"; done
sel="1-${body}${blanks},$((body + 1))-${n}"
echo "pages: $n, notes pages added before the coloring pages: $pad, total: $((n + pad)), sheets: $(( (n + pad) / 4 ))"
pdfjam --quiet --paper '{5.5in,8.5in}' --outfile "$out/guide-padded.pdf" "$in" "$sel"
pdfjam --quiet --booklet true --landscape --paper letterpaper --outfile "$out/zine.pdf" "$out/guide-padded.pdf"
pdfinfo "$out/zine.pdf" | awk '/^Pages:|^Page size:/'
