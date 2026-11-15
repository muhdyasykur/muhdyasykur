/** First-run guided tour state (blueprint F25). */
const KEY = 'consilia.tourDone';
export const tour = $state({ open: false, step: 0 });
export function startTour() { tour.step = 0; tour.open = true; }
export function endTour() { tour.open = false; try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ } }
export function tourDone() { try { return localStorage.getItem(KEY) === '1'; } catch { return true; } }
