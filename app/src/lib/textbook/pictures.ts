import type { Lesson } from '../lesson/model';
import type { BookKind } from './books';
import { slotFor } from './books';
import { lessonTextbook, singlePages, bookTitle } from './lesson';

/** A textbook page drawn as a picture for the printed lesson plan or the Word file. Made on the device. */
export interface PagePicture { kind: BookKind; page: number; title: string; dataUrl: string; w: number; h: number }

/**
 * Draws the lesson's textbook pages from the teacher's own PDFs on the Textbook Shelf. Books that are not on the
 * shelf (or whose file is missing) are listed in `missing`; nothing leaves the device.
 */
export async function lessonPictures(l: Pick<Lesson, 'sowNotes' | 'aids' | 'stages' | 'curriculum' | 'textbook'>, max = 8): Promise<{ pictures: PagePicture[]; missing: BookKind[] }> {
  const [{ listBooks, getBookFile }, { openPdf, renderPage }] = await Promise.all([import('./store'), import('./pdf')]);
  const books = await listBooks();
  const pages = singlePages(lessonTextbook(l).pages, max);
  const pictures: PagePicture[] = []; const missing: BookKind[] = [];
  for (const kind of [...new Set(pages.map((p) => p.kind))]) {
    const slot = slotFor(l.curriculum.year, kind);
    const book = slot && books.find((b) => b.slot === slot.id);
    const file = book ? await getBookFile(book) : null;
    if (!book || !file) { missing.push(kind); continue; }
    const doc = await openPdf(file);
    for (const p of pages.filter((x) => x.kind === kind)) {
      const n = p.page + book.offset;
      if (n < 1 || n > book.pages) continue;
      const canvas = document.createElement('canvas');
      await renderPage(doc, n, canvas, 800);
      pictures.push({ kind, page: p.page, title: bookTitle(l.curriculum.year, kind), dataUrl: canvas.toDataURL('image/jpeg', 0.82), w: canvas.width, h: canvas.height });
    }
  }
  return { pictures, missing };
}
