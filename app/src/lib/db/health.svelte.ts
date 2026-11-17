import { db, watchUpgrades } from './schema';
/** `stale`: another tab updated Consilia; this tab must reload. `blocked`: an older tab is holding the old version open. */
export const dbHealth = $state({ stale: false, blocked: false });
export function startDbWatch() {
  watchUpgrades(db, { stale: () => (dbHealth.stale = true), blocked: () => (dbHealth.blocked = true) });
  db.on('ready', () => { dbHealth.blocked = false; });
}
