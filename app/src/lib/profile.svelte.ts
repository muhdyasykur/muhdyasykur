import { getProfile, saveProfile } from './db/repo';
import type { Profile } from './db/schema';

const SKIP = 'consilia.onboarded';
export const profile = $state<{ value: Profile | null; loaded: boolean; skipped: boolean }>({ value: null, loaded: false, skipped: false });

export async function loadProfile() {
  try { profile.skipped = localStorage.getItem(SKIP) === '1'; } catch { /* ignore */ }
  profile.value = (await getProfile().catch(() => undefined)) ?? null;
  profile.loaded = true;
}
export async function updateProfile(p: Omit<Profile, 'id' | 'createdAt'>) {
  await saveProfile({ ...p, createdAt: profile.value?.createdAt });
  profile.value = (await getProfile()) ?? null;
  skipOnboarding();
}
export function skipOnboarding() {
  profile.skipped = true;
  try { localStorage.setItem(SKIP, '1'); } catch { /* ignore */ }
}
