// Copies the on-device text recognition files (tesseract.js, Apache-2.0) into public/ocr/ before dev and build.
// They are served by the app itself, never from a CDN, and are left out of the install: the Textbook Shelf
// downloads them the first time a teacher presses "Make searchable", and the service worker keeps them offline.
import { mkdirSync, copyFileSync, existsSync, writeFileSync } from 'node:fs';
const nm = new URL('../node_modules/', import.meta.url);
const out = new URL('../public/ocr/', import.meta.url);
mkdirSync(out, { recursive: true });
const files = [
  ['tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'],
  ['@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'eng.traineddata.gz']
];
for (const [from, to] of files) {
  const src = new URL(from, nm);
  if (!existsSync(src)) { console.error(`copy-ocr: missing ${from}. Run npm install.`); process.exit(1); }
  copyFileSync(src, new URL(to, out));
}
writeFileSync(new URL('LICENSE.txt', out), 'Text recognition: tesseract.js and tesseract.js-core (Apache License 2.0), Tesseract OCR and the English traineddata (Apache License 2.0).\n');
console.log('copy-ocr: on-device text recognition files ready in public/ocr/');
