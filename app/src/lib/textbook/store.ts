import { db, type Book } from '../db/schema';

/**
 * Textbooks are stored only on this device: in the browser's private file storage (OPFS) where available,
 * otherwise in IndexedDB. They are never uploaded, shared or put in backups (blueprint F32).
 */
async function opfsDir(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const root = await navigator.storage?.getDirectory?.();
    return root ? await root.getDirectoryHandle('textbooks', { create: true }) : null;
  } catch { return null; }
}
export async function putBookFile(id: string, file: Blob): Promise<'opfs' | 'idb'> {
  const dir = await opfsDir();
  if (dir) {
    try {
      const fh = await dir.getFileHandle(`${id}.pdf`, { create: true });
      const w = await (fh as FileSystemFileHandle & { createWritable(): Promise<FileSystemWritableFileStream> }).createWritable();
      await w.write(file); await w.close();
      return 'opfs';
    } catch { /* fall back below */ }
  }
  await db.bookBlobs.put({ id, blob: file });
  return 'idb';
}
export async function getBookFile(b: Book): Promise<Blob | null> {
  if (b.storage === 'opfs') {
    const dir = await opfsDir();
    try { return dir ? await (await dir.getFileHandle(`${b.id}.pdf`)).getFile() : null; } catch { return null; }
  }
  return (await db.bookBlobs.get(b.id))?.blob ?? null;
}
export async function removeBook(b: Book) {
  if (b.storage === 'opfs') { try { await (await opfsDir())?.removeEntry(`${b.id}.pdf`); } catch { /* already gone */ } }
  else await db.bookBlobs.delete(b.id);
  await db.books.delete(b.id);
}
export const listBooks = () => db.books.toArray();
export const bookForSlot = (slot: string) => db.books.where('slot').equals(slot).first();
export async function space(): Promise<{ used: number; quota: number } | null> {
  try { const e = await navigator.storage.estimate(); return { used: e.usage ?? 0, quota: e.quota ?? 0 }; } catch { return null; }
}
export const mb = (n: number) => `${(n / 1048576).toFixed(n > 100 * 1048576 ? 0 : 1)} MB`;
