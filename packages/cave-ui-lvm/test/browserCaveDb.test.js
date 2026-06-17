import { test } from 'node:test';
import assert from 'node:assert';
import { getServiceCaveDb, serviceCaveDbTomeId } from '../src/browserCaveDb.js';

test('serviceCaveDbTomeId uses shared service namespace', () => {
  assert.equal(serviceCaveDbTomeId('saurce'), 'saurce-inventory-ui');
  assert.equal(serviceCaveDbTomeId('resaurce'), 'resaurce-inventory-ui');
});

test('getServiceCaveDb returns same adapter instance per service', () => {
  const a = getServiceCaveDb('saurce');
  const b = getServiceCaveDb('saurce');
  assert.strictEqual(a, b);
  assert.equal(a.tomeId, 'saurce-inventory-ui');
});

test('getServiceCaveDb isolates different services', () => {
  const saurce = getServiceCaveDb('saurce');
  const resaurce = getServiceCaveDb('resaurce');
  assert.notStrictEqual(saurce, resaurce);
  assert.equal(saurce.tomeId, 'saurce-inventory-ui');
  assert.equal(resaurce.tomeId, 'resaurce-inventory-ui');
});
