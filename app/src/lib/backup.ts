import { db } from './db/schema';

/**
 * Backup and restore (blueprint F28). One file holds everything the teacher made on this device, except textbook
 * PDFs (too large; add them again). With a PIN set, pupil names stay encrypted inside the file and the same PIN
 * opens them after a restore.
 */
export const BACKUP_FORMAT = 'consilia-backup';
const TABLES = ['profile', 'settings', 'classes', 'pupils', 'lessons', 'sessions', 'attendance', 'pbd', 'reflections', 'mentorNotes', 'bankCustom', 'media', 'feedbackQueue', 'meta', 'register', 'plans', 'days'] as const;
type TableName = (typeof TABLES)[number];
export interface BackupFile { format: typeof BACKUP_FORMAT; version: 1; createdAt: string; app: string; counts: Record<string, number>; tables: Record<string, unknown[]> }

async function blobToDataUrl(b: Blob): Promise<string> {
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return `data:${b.type || 'application/octet-stream'};base64,${btoa(s)}`;
}
function dataUrlToBlob(u: string): Blob {
  const [head, data] = u.split(',');
  const type = /data:([^;]+)/.exec(head)?.[1] ?? 'application/octet-stream';
  return new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], { type });
}

export async function makeBackup(app: string): Promise<string> {
  const tables: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  for (const t of TABLES) {
    let rows = await db.table(t).toArray();
    if (t === 'media') rows = await Promise.all(rows.map(async (m) => ({ ...m, blob: m.blob instanceof Blob ? await blobToDataUrl(m.blob) : m.blob })));
    tables[t] = rows; counts[t] = rows.length;
  }
  await db.settings.put({ key: 'lastBackup', value: Date.now() });
  return JSON.stringify({ format: BACKUP_FORMAT, version: 1, createdAt: new Date().toISOString(), app, counts, tables } satisfies BackupFile);
}

export function readBackup(text: string): { ok: true; file: BackupFile } | { ok: false; error: string } {
  let f: Partial<BackupFile>;
  try { f = JSON.parse(text); } catch { return { ok: false, error: 'This is not a Consilia backup file.' }; }
  if (f?.format !== BACKUP_FORMAT) return { ok: false, error: 'This is not a Consilia backup file.' };
  if (f.version !== 1) return { ok: false, error: 'This backup was made by a newer Consilia. Update the app first.' };
  if (!f.tables || typeof f.tables !== 'object') return { ok: false, error: 'The backup file is damaged.' };
  for (const t of Object.keys(f.tables)) {
    if (!(TABLES as readonly string[]).includes(t)) return { ok: false, error: `The backup file has an unknown section (${t}).` };
    if (!Array.isArray(f.tables[t])) return { ok: false, error: `The backup file is damaged (${t}).` };
  }
  return { ok: true, file: f as BackupFile };
}

/** "merge" keeps everything here and adds or updates from the file; "replace" makes this device match the file. */
export async function restore(file: BackupFile, mode: 'merge' | 'replace'): Promise<number> {
  const rows: Record<string, unknown[]> = {};
  for (const t of TABLES) rows[t] = (file.tables[t] ?? []).map((r) => (t === 'media' && typeof (r as { blob?: unknown }).blob === 'string' ? { ...(r as object), blob: dataUrlToBlob((r as { blob: string }).blob) } : r));
  let n = 0;
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES as readonly TableName[]) {
      if (mode === 'replace') await db.table(t).clear();
      if (rows[t].length) { await db.table(t).bulkPut(rows[t]); n += rows[t].length; }
    }
  });
  return n;
}
export const backupName = () => `Consilia-backup-${new Date().toISOString().slice(0, 10)}.consilia-backup`;
export async function lastBackup(): Promise<number | null> { return ((await db.settings.get('lastBackup'))?.value as number) ?? null; }
