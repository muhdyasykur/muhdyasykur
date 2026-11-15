import type { PDFDocumentProxy } from 'pdfjs-dist';

/** pdf.js is loaded only when a book is opened (it is large). The worker is bundled, so it works offline. */
let lib: typeof import('pdfjs-dist') | null = null;
async function pdfjs() {
  if (!lib) {
    lib = await import('pdfjs-dist');
    const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    lib.GlobalWorkerOptions.workerSrc = worker;
  }
  return lib;
}
export async function openPdf(data: ArrayBuffer | Blob): Promise<PDFDocumentProxy> {
  const buf = data instanceof Blob ? await data.arrayBuffer() : data;
  return (await pdfjs()).getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
}
/** Draw one page to fit `width` CSS pixels, sharp on high-density screens. Returns the drawn size. */
export async function renderPage(doc: PDFDocumentProxy, n: number, canvas: HTMLCanvasElement, width: number, maxHeight = Infinity): Promise<{ w: number; h: number }> {
  const page = await doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(width / base.width, maxHeight / base.height);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const vp = page.getViewport({ scale: scale * dpr });
  canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
  canvas.style.width = `${Math.floor(vp.width / dpr)}px`; canvas.style.height = `${Math.floor(vp.height / dpr)}px`;
  await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
  return { w: vp.width / dpr, h: vp.height / dpr };
}
/** Text layer of every page (empty strings for scanned pages). */
export async function pageTexts(doc: PDFDocumentProxy, onProgress?: (n: number) => void): Promise<string[]> {
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const t = await (await doc.getPage(i)).getTextContent();
    out.push(t.items.map((x) => ('str' in x ? x.str : '')).join(' ').replace(/\s+/g, ' ').trim());
    onProgress?.(i);
  }
  return out;
}
