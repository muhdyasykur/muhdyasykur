import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { formBody, sentToday, FORM_ID } from './feedback';

describe('Feedback Garden', () => {
  it('fills the Jotform fields by their real names', () => {
    const b = formBody({ mood: 'good', kind: 'Idea', text: '  Add Year 3 phonics games ', votes: ['Full Canva connection', 'Mentor accounts to comment on my RPH'], name: 'Nur Aisyah binti Ali' }, '0.6.0');
    expect(b.get('formID')).toBe(FORM_ID);
    expect(b.get('q2_q2_textbox0')).toBe('🙂 Good');
    expect(b.get('q4_q4_textarea2')).toBe('Add Year 3 phonics games');
    expect(b.get('q5_q5_textbox3')).toBe('Full Canva connection; Mentor accounts to comment on my RPH');
    expect(b.get('q6_q6_fullname4[first]')).toBe('Nur'); expect(b.get('q6_q6_fullname4[last]')).toBe('Aisyah binti Ali');
    expect(b.get('q7_q7_textbox5')).toBe('0.6.0');
  });
  it('counts today\'s feedback for the daily limit', () => {
    const now = new Date('2026-11-16T10:00:00').getTime();
    const it = (t: number) => ({ id: String(t), mood: 'good', kind: 'Idea', text: 'x', createdAt: t });
    expect(sentToday([it(now - 3600_000), it(now - 86400_000 * 2)], now)).toBe(1);
  });
});
