import { tr } from '../i18n/index.svelte';
import { db, type Book } from '../db/schema';
import { getBookFile } from './store';
import { openPdf } from './pdf';

/**
 * On-device text recognition for scanned textbooks (blueprint F32). tesseract.js is loaded only when a teacher asks,
 * from the app's own /ocr/ folder (never a CDN), and the page images never leave the device. One book at a time;
 * progress is saved after every page, so a closed app carries on from the same page next time.
 */
export const ocr = $state({ bookId: '', done: 0, total: 0, phase: '' as '' | 'loading' | 'reading' | 'paused' | 'finished' | 'error', message: '' });
let stop = false;

export const isScan = (b: Book) => b.ocrDone !== undefined || !b.text;
export const ocrProgress = (b: Book) => (b.ocrDone ?? 0) / b.pages;

/** Keep lines that look like words; drop the noise recognition makes of pictures and borders. */
export function cleanText(raw: string): string {
  return raw.split(/\n/).map((l) => l.replace(/[|_~^<>{}\\[\]]+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((l) => { const letters = (l.match(/[A-Za-z]/g) ?? []).length; return l.length >= 3 && letters / l.length > 0.55 && /[A-Za-z]{2,}/.test(l); })
    .map((l) => l.split(' ').filter((w) => (w.match(/[A-Za-z]/g) ?? []).length >= 2 || /^(I|a|A|\d+[.,]?)$/.test(w)).join(' '))
    .filter((l) => l.length >= 3)
    .join(' ');
}

export function pauseOcr() { stop = true; }

/** True once the recognition files have been downloaded and kept (so it can run offline). */
export async function ocrFilesKept(): Promise<boolean> {
  try {
    const c = await caches.open('consilia-ocr');
    const base = new URL(`${import.meta.env.BASE_URL}ocr/`, location.href).href;
    return !!(await c.match(base + 'worker.min.js')) && !!(await c.match(base + 'eng.traineddata.gz'));
  } catch { return false; }
}

export async function makeSearchable(book: Book, opts: { scale?: number } = {}) {
  if (ocr.phase === 'loading' || ocr.phase === 'reading') return;
  stop = false;
  Object.assign(ocr, { bookId: book.id, done: book.ocrDone ?? 0, total: book.pages, phase: 'loading', message: tr('Getting text recognition ready…') });
  let worker: import('tesseract.js').Worker | null = null;
  try {
    const file = await getBookFile(book);
    if (!file) throw Object.assign(new Error('The PDF is no longer on this device.'), { code: 'pdf-missing' });
    const doc = await openPdf(file);
    const { createWorker, OEM } = await import('tesseract.js');
    const base = new URL(`${import.meta.env.BASE_URL}ocr/`, location.href).href;
    worker = await createWorker('eng', OEM.LSTM_ONLY, {
      workerPath: base + 'worker.min.js', corePath: base, langPath: base.replace(/\/$/, ''), workerBlobURL: false, gzip: true,
      logger: (m: { status: string; progress: number }) => { if (ocr.phase === 'loading' && /loading|initializ/.test(m.status)) ocr.message = tr('Getting text recognition ready… {x}%', { x: Math.round(m.progress * 100) }); }
    });
    const text = [...(book.text ?? Array(book.pages).fill(''))];
    const canvas = document.createElement('canvas');
    ocr.phase = 'reading';
    for (let i = book.ocrDone ?? 0; i < book.pages; i++) {
      if (stop) { ocr.phase = 'paused'; ocr.message = tr('Paused at page {i} of {pages}.', { i, pages: book.pages }); return; }
      ocr.message = tr('Reading page {x} of {pages}…', { x: i + 1, pages: book.pages });
      const page = await doc.getPage(i + 1);
      const v1 = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: (opts.scale ?? 1600) / v1.width });
      canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const { data } = await worker.recognize(canvas);
      text[i] = cleanText(data.text);
      await db.books.update(book.id, { text, ocrDone: i + 1 });
      ocr.done = i + 1;
      await new Promise((r) => setTimeout(r, 30)); // let the app breathe between pages
    }
    ocr.phase = 'finished'; ocr.message = tr('Finished. {pages} pages are now searchable.', { pages: book.pages });
  } catch (e) {
    ocr.phase = 'error';
    ocr.message = (e as { code?: string }).code === 'pdf-missing' ? tr('The PDF is no longer on this device. Add it again on the Textbook Shelf.') : tr('Text recognition stopped. Check that you were online the first time, then press Continue.');
  } finally {
    await worker?.terminate().catch(() => {});
  }
}
