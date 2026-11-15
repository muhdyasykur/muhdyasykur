import { shuffle, type Rand } from './random';

/**
 * Fair name picker (blueprint F18): nobody is picked twice until everyone present has been picked.
 * State is plain data so it can be saved per class and survive a reload.
 */
export interface PickerState { picked: string[] }
export function pick(present: string[], state: PickerState, rand: Rand = Math.random): { id: string | null; state: PickerState; roundDone: boolean } {
  if (!present.length) return { id: null, state, roundDone: false };
  let picked = state.picked.filter((id) => present.includes(id));
  let left = present.filter((id) => !picked.includes(id));
  let roundDone = false;
  if (!left.length) { picked = []; left = present; roundDone = true; }
  const id = shuffle(left, rand)[0];
  return { id, state: { picked: [...picked, id] }, roundDone };
}
