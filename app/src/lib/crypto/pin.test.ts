import { describe, it, expect } from 'vitest';
import { createPin, openPin, encryptText, decryptText, isEncrypted, validPin } from './pin';

describe('PIN protection', () => {
  it('encrypts and decrypts with the right PIN only', async () => {
    const { config, key } = await createPin('2468', 1000);
    const c = await encryptText(key, 'Nur Aisyah binti Ahmad');
    expect(isEncrypted(c)).toBe(true);
    expect(c).not.toContain('Aisyah');
    const k2 = await openPin('2468', config);
    expect(k2).not.toBeNull();
    expect(await decryptText(k2!, c)).toBe('Nur Aisyah binti Ahmad');
    expect(await openPin('1357', config)).toBeNull();
  });
  it('accepts 4–6 digit PINs only', () => {
    expect(validPin('1234')).toBe(true);
    expect(validPin('123456')).toBe(true);
    expect(validPin('123')).toBe(false);
    expect(validPin('12a4')).toBe(false);
  });
  it('the same text encrypts differently each time', async () => {
    const { key } = await createPin('2468', 1000);
    expect(await encryptText(key, 'Ali')).not.toBe(await encryptText(key, 'Ali'));
  });
});
