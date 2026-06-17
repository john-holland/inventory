import {
  buildSoaRegistryFromEnv,
  validateLocationInvariantRegistry,
} from '../soaRegistry';

describe('validateLocationInvariantRegistry', () => {
  it('accepts origin-only service URLs', () => {
    const result = validateLocationInvariantRegistry({
      resaurce: 'http://127.0.0.1:3456',
      saurce: 'http://127.0.0.1:3457',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects routing table keys in registry', () => {
    const result = validateLocationInvariantRegistry({
      resaurce: 'http://127.0.0.1:3456',
      messages: { foo: 'bar' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('messages'))).toBe(true);
    }
  });

  it('rejects URLs with paths', () => {
    const result = validateLocationInvariantRegistry({
      resaurce: 'http://127.0.0.1:3456/cave/route',
    });
    expect(result.ok).toBe(false);
  });

  it('env registry passes location-invariant check', () => {
    const reg = buildSoaRegistryFromEnv();
    const filtered = Object.fromEntries(Object.entries(reg).filter(([, v]) => v));
    if (Object.keys(filtered).length === 0) return;
    expect(validateLocationInvariantRegistry(filtered).ok).toBe(true);
  });
});
