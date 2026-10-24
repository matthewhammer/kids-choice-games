// The long-edge copy of a zine: every back side (the even pages) turned upside down, so a printer flipping on the LONG edge, as most do
// by default, prints each side upright. finish.sh runs it on the short-edge copy.
//   mutool run dress-up/reports/017/drivers/rotate-backs.js <short-edge.pdf> <long-edge.pdf>
var doc = new PDFDocument(scriptArgs[0]);
for (var i = 1; i < doc.countPages(); i += 2) doc.findPage(i).put("Rotate", 180);
doc.save(scriptArgs[1]);
