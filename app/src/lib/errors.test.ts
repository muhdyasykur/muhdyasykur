import { describe as d, it, expect } from 'vitest';
import { describe } from './errors.svelte';

d('error messages', () => {
  it('explains a full device with a next step', () => {
    const r = describe(new DOMException('The quota has been exceeded.', 'QuotaExceededError'))!;
    expect(r.message).toMatch(/out of storage/); expect(r.next).toMatch(/Remove a textbook/);
    expect(describe({ name: 'AbortError', inner: { name: 'QuotaExceededError' } })!.message).toMatch(/out of storage/); // Dexie wraps it
  });
  it('ignores harmless browser errors', () => {
    expect(describe(new DOMException('x', 'NotAllowedError'))).toBeNull();
    expect(describe(new Error('ResizeObserver loop completed with undelivered notifications.'))).toBeNull();
  });
  it('gives a plain message for anything else', () => { expect(describe(new TypeError('x is undefined'))!.next).toMatch(/Feedback Garden/); });
});
