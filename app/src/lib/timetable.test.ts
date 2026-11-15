import { describe, it, expect } from 'vitest';
import { mondayOf, addDays, weekItems, overlaps, nextItem, type Slot } from './timetable';
import type { Lesson } from './lesson/model';

const slots: Slot[] = [
  { id: 'a', classId: 'c1', day: 1, start: '09:10', durationMin: 60 },
  { id: 'b', classId: 'c2', day: 1, start: '10:00', durationMin: 30 },
  { id: 'c', classId: 'c1', day: 3, start: '08:00', durationMin: 30 }
];
const lesson = (classId: string, date: string, start: string) => ({ id: classId + date, classId, header: { date, start } }) as unknown as Lesson;

describe('timetable', () => {
  it('finds the Monday of any date', () => {
    expect(mondayOf('2025-11-03')).toBe('2025-11-03');
    expect(mondayOf('2025-11-09')).toBe('2025-11-03');
    expect(addDays('2025-11-03', 2)).toBe('2025-11-05');
  });
  it('matches lessons to slots and marks cancelled ones', () => {
    const items = weekItems('2025-11-03', slots, [lesson('c1', '2025-11-03', '09:10')], { 'c@2025-11-05': 'Sports day' });
    expect(items.map((i) => [i.slot.id, i.date, !!i.lesson, i.cancelled])).toEqual([
      ['a', '2025-11-03', true, null], ['b', '2025-11-03', false, null], ['c', '2025-11-05', false, 'Sports day']
    ]);
  });
  it('flags overlapping slots on the same day', () => {
    expect(overlaps(slots).map(([x, y]) => x.id + y.id)).toEqual(['ab']);
  });
  it('finds the next lesson, skipping cancelled and finished ones', () => {
    const n = nextItem(new Date(2025, 10, 3, 10, 15), slots, [], { 'c@2025-11-05': 'Holiday' });
    expect([n?.slot.id, n?.date]).toEqual(['b', '2025-11-03']);
    const later = nextItem(new Date(2025, 10, 3, 11, 0), slots, [], { 'c@2025-11-05': 'Holiday' });
    expect([later?.slot.id, later?.date]).toEqual(['a', '2025-11-10']);
  });
});
