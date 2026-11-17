import { describe, it, expect, vi, afterEach } from 'vitest';
import { iso, today, addDays, parseDate } from './dates';
import { backupName } from './backup';

afterEach(() => vi.useRealTimers());

describe('local dates (Malaysian time)', () => {
  it('runs in Asia/Kuala_Lumpur', () => {
    expect(new Date('2026-01-01T00:00:00Z').getTimezoneOffset()).toBe(-480);
  });
  it('gives the local date before 8 am, not the UTC one', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-17T23:30:00Z')); // 07:30 on Wednesday 18 November in Kuala Lumpur
    expect(today()).toBe('2026-11-18');
    expect(new Date().toISOString().slice(0, 10)).toBe('2026-11-17'); // what the old code used
    expect(backupName()).toBe('Consilia-backup-2026-11-18.consilia-backup');
  });
  it('moves by whole local days across months and years', () => {
    expect(addDays('2026-11-18', 1)).toBe('2026-11-19');
    expect(addDays('2026-11-18', -1)).toBe('2026-11-17');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(iso(parseDate('2026-11-18'))).toBe('2026-11-18');
  });
});
