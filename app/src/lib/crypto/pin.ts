/**
 * PIN protection for pupil data (blueprint F28). The key is derived from the PIN with PBKDF2 and never stored;
 * pupil names and notes are kept as AES-GCM ciphertext. A forgotten PIN cannot be recovered, by design.
 */
const PREFIX = 'enc:v1:';
const ITERATIONS = 210_000;
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export interface PinConfig { salt: string; check: string; iterations: number }

export async function deriveKey(pin: string, salt: Uint8Array<ArrayBuffer>, iterations = ITERATIONS): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export const isEncrypted = (s: string | undefined) => !!s && s.startsWith(PREFIX);
export async function encryptText(key: CryptoKey, text: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));
  return `${PREFIX}${b64(iv)}:${b64(ct)}`;
}
export async function decryptText(key: CryptoKey, s: string): Promise<string> {
  if (!isEncrypted(s)) return s;
  const [iv, ct] = s.slice(PREFIX.length).split(':');
  return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct)));
}
export const validPin = (pin: string) => /^\d{4,6}$/.test(pin);

export async function createPin(pin: string, iterations = ITERATIONS): Promise<{ config: PinConfig; key: CryptoKey }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(pin, salt, iterations);
  return { config: { salt: b64(salt), check: await encryptText(key, 'consilia'), iterations }, key };
}
/** Returns the key if the PIN is right, otherwise null. */
export async function openPin(pin: string, config: PinConfig): Promise<CryptoKey | null> {
  const key = await deriveKey(pin, unb64(config.salt), config.iterations);
  try { return (await decryptText(key, config.check)) === 'consilia' ? key : null; } catch { return null; }
}
