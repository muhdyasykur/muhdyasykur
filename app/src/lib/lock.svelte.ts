import { getSetting, setSetting, resealAll, setCipher, type Cipher } from './db/repo';
import { createPin, openPin, encryptText, decryptText, type PinConfig } from './crypto/pin';

/** App-wide PIN state. The key lives only in memory and is dropped when the app locks or closes. */
export const lock = $state({ configured: false, unlocked: true, ready: false });
let current: Cipher | null = null;
const cipherOf = (key: CryptoKey): Cipher => ({ enc: (s) => encryptText(key, s), dec: (s) => decryptText(key, s) });

export async function loadLock() {
  const cfg = await getSetting<PinConfig | null>('pin', null);
  lock.configured = !!cfg; lock.unlocked = !cfg; lock.ready = true;
}
export async function unlock(pin: string): Promise<boolean> {
  const cfg = await getSetting<PinConfig | null>('pin', null);
  if (!cfg) return true;
  const key = await openPin(pin, cfg);
  if (!key) return false;
  current = cipherOf(key); setCipher(current); lock.unlocked = true;
  return true;
}
export function lockNow() { if (!lock.configured) return; current = null; setCipher(null); lock.unlocked = false; }
export async function setPin(pin: string) {
  const { config, key } = await createPin(pin);
  const next = cipherOf(key);
  await resealAll(current, next);
  await setSetting('pin', config);
  current = next; setCipher(next); lock.configured = true; lock.unlocked = true;
}
export async function removePin(pin: string): Promise<boolean> {
  if (!(await unlock(pin))) return false;
  await resealAll(current, null);
  await setSetting('pin', null);
  current = null; setCipher(null); lock.configured = false; lock.unlocked = true;
  return true;
}
