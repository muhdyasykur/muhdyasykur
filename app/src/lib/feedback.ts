import { db, type FeedbackItem } from './db/schema';
import { uid } from './lesson/model';

/**
 * Feedback Garden (blueprint F27). Feedback goes to the developer's own Jotform form. While offline it waits in
 * the queue and is sent later; nothing else is ever sent.
 */
export const FORM_ID = '263184239379064';
export const SUBMIT_URL = `https://submit.jotform.com/submit/${FORM_ID}`;
export const MOODS = [
  { id: 'love', icon: '😍', label: 'Love it', flower: 'sunflower' },
  { id: 'good', icon: '🙂', label: 'Good', flower: 'bungaraya' },
  { id: 'meh', icon: '😐', label: 'Okay', flower: 'orchid' },
  { id: 'sad', icon: '😕', label: 'Not yet', flower: 'sprout' }
] as const;
export const KINDS = ['Idea', 'Bug', 'Praise', 'Question'] as const;
export const IDEAS = [
  'Photo of a textbook page → lesson plan draft (AI)', 'Full Canva connection', 'KSSR 2027 curriculum when it is published',
  'Template designer for my school\'s lesson plan', 'Mentor accounts to comment on my lesson plan', 'Other subjects besides English', 'Text search inside scanned textbooks'
];
export interface Draft { mood: string; kind: string; text: string; votes: string[]; name: string }

/** Form fields exactly as the Jotform form names them. */
export function formBody(d: Draft, version: string): URLSearchParams {
  const mood = MOODS.find((m) => m.id === d.mood);
  const [first, ...rest] = d.name.trim().split(/\s+/);
  const b = new URLSearchParams({
    formID: FORM_ID, simple_spc: `${FORM_ID}-${FORM_ID}`, website: '',
    q2_q2_textbox0: mood ? `${mood.icon} ${mood.label}` : d.mood,
    q3_q3_textbox1: d.kind, q4_q4_textarea2: d.text.trim(), q5_q5_textbox3: d.votes.join('; '),
    'q6_q6_fullname4[first]': first ?? '', 'q6_q6_fullname4[last]': rest.join(' '), q7_q7_textbox5: version
  });
  return b;
}
export const DAILY_LIMIT = 5;
export function sentToday(items: FeedbackItem[], now = Date.now()): number {
  const day = new Date(now).toDateString();
  return items.filter((i) => new Date(i.createdAt).toDateString() === day).length;
}
type Stored = FeedbackItem & { votes?: string[]; name?: string };
export async function plant(d: Draft): Promise<Stored> {
  const item: Stored = { id: uid(), mood: d.mood, kind: d.kind, text: d.text.trim(), createdAt: Date.now(), votes: d.votes, name: d.name.trim() };
  await db.feedbackQueue.put(item);
  return item;
}
/** Try to send everything still waiting. Returns how many were sent. */
export async function flush(version: string): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;
  const waiting = (await db.feedbackQueue.toArray()).filter((i) => !i.sentAt) as Stored[];
  let n = 0;
  for (const i of waiting) {
    try {
      // the form host does not allow reading the reply, so a sent request counts as delivered
      await fetch(SUBMIT_URL, { method: 'POST', mode: 'no-cors', body: formBody({ mood: i.mood, kind: i.kind, text: i.text, votes: i.votes ?? [], name: i.name ?? '' }, version) });
      await db.feedbackQueue.update(i.id, { sentAt: Date.now() }); n++;
    } catch { break; }
  }
  return n;
}
