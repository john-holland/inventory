import { test } from 'node:test';
import assert from 'node:assert';
import { createPresenceStore } from '../src/presenceStore.js';

test('presenceStore readSync returns null when no token', () => {
  const store = createPresenceStore('test-presence');
  assert.equal(store.readSync(), null);
});
