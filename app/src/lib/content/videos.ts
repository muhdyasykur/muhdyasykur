/** The six tutorial videos (blueprint F25). Recorded from the real app by scripts/record-videos.cjs, captioned in English and BM.
 *  Files live in public/videos/ and are not in the install: they download when played and are then kept for offline use. */
export interface Video { id: string; title: string; ms: string; about: string }
export const VIDEOS: Video[] = [
  { id: 'first-rph', title: 'Your first RPH', ms: 'RPH pertama anda', about: 'From New RPH to a finished, aligned plan using a SoW lesson.' },
  { id: 'objectives', title: 'Objectives that pass SMART', ms: 'Objektif yang lulus SMART', about: 'Fix a vague objective with the ABCD boxes and success criteria.' },
  { id: 'teach', title: 'Teach mode', ms: 'Mod Mengajar', about: 'Attendance, the stage clock and the classroom toolkit.' },
  { id: 'classes-pbd', title: 'Classes and PBD', ms: 'Kelas dan PBD', about: 'Add a class, paste names, record TP levels and see progress.' },
  { id: 'export', title: 'Print, PDF and Word', ms: 'Cetak, PDF dan Word', about: 'Check the score, choose a layout and download the RPH.' },
  { id: 'backup', title: 'Back up and restore', ms: 'Sandaran dan pemulihan', about: 'Save one file each week and bring everything back on a new phone.' }
];
export const VIDEO_CACHE = 'consilia-videos';
export const videoUrl = (id: string) => `${import.meta.env.BASE_URL}videos/${id}.mp4`;
export const captionUrl = (id: string, lang: 'en' | 'ms') => `${import.meta.env.BASE_URL}videos/${id}.${lang}.vtt`;

/** After the first play, keep the whole file (and captions) so the video works offline. Range requests are then served from it. */
export async function keepForOffline(id: string): Promise<boolean> {
  if (!('caches' in self)) return false;
  try {
    const c = await caches.open(VIDEO_CACHE);
    const urls = [videoUrl(id), captionUrl(id, 'en'), captionUrl(id, 'ms')].map((u) => new URL(u, location.href).href);
    for (const u of urls) {
      if (await c.match(u)) continue;
      const r = await fetch(u);
      if (!r.ok) return false;
      await c.put(u, r);
    }
    return true;
  } catch { return false; }
}
export async function isKept(id: string): Promise<boolean> {
  if (!('caches' in self)) return false;
  try { return !!(await (await caches.open(VIDEO_CACHE)).match(new URL(videoUrl(id), location.href).href)); } catch { return false; }
}
