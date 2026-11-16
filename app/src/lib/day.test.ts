import { describe, it, expect } from 'vitest';
import { buildDay, sortByTime, toPlan } from './day';
import type { Lesson } from './lesson/model';
import type { Slot } from './timetable';

const slots: Slot[] = [{ id: 's1', classId: 'c4', day: 1, start: '09:10', durationMin: 60 }, { id: 's2', classId: 'c5', day: 1, start: '07:40', durationMin: 30 }, { id: 's3', classId: 'c4', day: 2, start: '08:00', durationMin: 60 }];
const lesson = (id: string, classId: string | null, date: string, start: string, topic: string) => ({ id, classId, topic, curriculum: { year: 4 }, header: { date, start, className: classId === 'c4' ? '4 Bestari' : '', durationMin: 60 } }) as unknown as Lesson;
const name = (id: string) => ({ c4: '4 Bestari', c5: '5 Cemerlang' } as Record<string, string>)[id] ?? '?';
const MON = '2026-11-16';

describe('my day', () => {
  it('lists the day\'s periods in time order, with their lesson plans, plus lesson plans without a period', () => {
    const rows = buildDay(MON, slots, [lesson('L1', 'c4', MON, '09:10', 'Where are you from?'), lesson('L2', null, MON, '11:00', 'Relief')], {}, undefined, name);
    expect(rows.map((r) => r.item.title)).toEqual(['5 Cemerlang', '4 Bestari · Where are you from?', 'Year 4 · Relief']);
    expect(rows[1].lesson?.id).toBe('L1');
  });
  it('keeps the teacher\'s order, ticks and own items, and slots new items in by time', () => {
    const first = buildDay(MON, slots, [], {}, undefined, name);
    const saved = toPlan(MON, [first[1], { item: { id: 'x1', kind: 'extra', ref: '', time: '10:30', title: 'Marking', done: true }, lesson: null, slot: null, cancelled: null }, { ...first[0], item: { ...first[0].item, done: true } }], '');
    const rows = buildDay(MON, slots, [lesson('L3', null, MON, '12:00', 'Club')], {}, saved, name);
    expect(rows.map((r) => r.item.title)).toEqual(['4 Bestari', 'Marking', '5 Cemerlang', 'Year 4 · Club']);
    expect(rows[2].item.done).toBe(true);
    expect(sortByTime(rows).map((r) => r.item.time)).toEqual(['07:40', '09:10', '10:30', '12:00']);
  });
});
