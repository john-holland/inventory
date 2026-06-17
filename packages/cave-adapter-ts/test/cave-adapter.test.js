'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { DefaultHttpCaveAdapter, CircuitBreaker, TokenBucketLimiter } = require('..');

test('circuit open yields structured skipped response', async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 999999, halfOpenMaxAttempts: 1 });
  const adapter = new DefaultHttpCaveAdapter({
    resolveBaseUrl: () => 'http://127.0.0.1:9',
    fetchImpl: async () => {
      throw Object.assign(new Error('fetch_failed'), { status: undefined });
    },
    breaker,
    retry: null,
  });
  await adapter.sendEnvelope({
    schema_version: '2.0',
    route: 'svc:path',
    payload: {},
    trace_id: 't1',
    reply_mode: 'sync_http',
  });
  const r2 = await adapter.sendEnvelope({
    schema_version: '2.0',
    route: 'svc:path',
    payload: {},
    trace_id: 't2',
    reply_mode: 'sync_http',
  });
  assert.strictEqual(r2.reason, 'circuit_open');
});

test('token bucket blocks when empty', () => {
  const lim = new TokenBucketLimiter({ capacity: 1, refillPerSec: 0 });
  assert.strictEqual(lim.tryConsume(), true);
  assert.strictEqual(lim.tryConsume(), false);
});
