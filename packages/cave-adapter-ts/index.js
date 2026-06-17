/**
 * @inventory/cave-adapter — default HTTP Cave client with resilience + optional OTel.
 */

'use strict';

/** @type {{ startActiveSpan?: (n:string,o:object,fn:(s:any)=>any)=>any } | null} */
let _otel = null;

function configureOtel(api) {
  _otel = api || null;
}

function _span(name, attrs, fn) {
  if (_otel && typeof _otel.startActiveSpan === 'function') {
    return _otel.startActiveSpan(name, { attributes: attrs || {} }, fn);
  }
  return fn({ setAttribute() {}, recordException() {}, end() {} });
}

class TokenBucketLimiter {
  /**
   * @param {{ capacity: number, refillPerSec: number }} opts
   */
  constructor(opts) {
    this.capacity = opts.capacity;
    this.refillPerSec = opts.refillPerSec;
    this._tokens = opts.capacity;
    this._last = Date.now();
  }
  _refill() {
    const now = Date.now();
    const delta = (now - this._last) / 1000;
    this._last = now;
    this._tokens = Math.min(this.capacity, this._tokens + delta * this.refillPerSec);
  }
  /** @returns {boolean} */
  tryConsume() {
    this._refill();
    if (this._tokens >= 1) {
      this._tokens -= 1;
      return true;
    }
    return false;
  }
}

class CircuitBreaker {
  /**
   * @param {{ failureThreshold: number, cooldownMs: number, halfOpenMaxAttempts: number }} c
   */
  constructor(c) {
    this.failureThreshold = c.failureThreshold;
    this.cooldownMs = c.cooldownMs;
    this.halfOpenMaxAttempts = c.halfOpenMaxAttempts;
    this._failures = 0;
    this._openedAt = 0;
    this._state = 'closed';
    this._halfAttempts = 0;
  }
  get state() {
    return this._state;
  }
  _shouldTry() {
    if (this._state === 'closed') return true;
    if (this._state === 'open') {
      if (Date.now() - this._openedAt >= this.cooldownMs) {
        this._state = 'half_open';
        this._halfAttempts = 0;
        return true;
      }
      return false;
    }
    return this._halfAttempts < this.halfOpenMaxAttempts;
  }
  onSuccess() {
    this._failures = 0;
    this._state = 'closed';
    this._halfAttempts = 0;
  }
  onFailure() {
    this._failures += 1;
    if (this._state === 'half_open') {
      this._state = 'open';
      this._openedAt = Date.now();
      return;
    }
    if (this._failures >= this.failureThreshold) {
      this._state = 'open';
      this._openedAt = Date.now();
    }
  }
  beforeCall() {
    if (!this._shouldTry()) {
      const e = new Error('circuit_open');
      e.code = 'CIRCUIT_OPEN';
      throw e;
    }
    if (this._state === 'half_open') this._halfAttempts += 1;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(ms) {
  return Math.floor(ms * (0.5 + Math.random()));
}

/**
 * @param {{ maxAttempts: number, baseDelayMs: number, maxDelayMs: number }} o
 */
async function withRetries(o, fn) {
  let attempt = 0;
  let delay = o.baseDelayMs;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt += 1;
      if (attempt >= o.maxAttempts) throw e;
      const msg = String(e && e.message);
      const st = e && e.status;
      const retriable =
        msg === 'fetch_failed' ||
        msg === 'timeout' ||
        (typeof st === 'number' && st >= 500) ||
        st === 408 ||
        st === 429;
      if (!retriable) throw e;
      await sleep(jitter(Math.min(delay, o.maxDelayMs)));
      delay = Math.min(delay * 2, o.maxDelayMs);
    }
  }
}

/**
 * @typedef {{ schema_version: string, route: string, payload: Record<string, unknown>, trace_id: string, reply_mode: string, presence?: string | null }} CaveEnvelopeV2
 */

class DefaultHttpCaveAdapter {
  /**
   * @param {{
   *   resolveBaseUrl: (route: string) => string;
   *   fetchImpl?: typeof fetch;
   *   timeoutMs?: number;
   *   breaker?: CircuitBreaker;
   *   limiter?: TokenBucketLimiter | null;
   *   limiterKey?: (route: string) => string;
   *   perKeyLimiter?: boolean;
   *   retry?: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number } | null;
   *   routePath?: string;
   * }} opts
   */
  constructor(opts) {
    this.resolveBaseUrl = opts.resolveBaseUrl;
    const g = typeof globalThis !== 'undefined' ? globalThis : {};
    this.fetchImpl = opts.fetchImpl || (typeof g.fetch === 'function' ? g.fetch.bind(g) : null);
    this.timeoutMs = opts.timeoutMs ?? 30000;
    this.breaker = opts.breaker ?? new CircuitBreaker({ failureThreshold: 5, cooldownMs: 15000, halfOpenMaxAttempts: 1 });
    this._sharedLimiter =
      opts.limiter === undefined
        ? new TokenBucketLimiter({
            capacity: Number(process.env.CAVE_ADAPTER_RPS || 50),
            refillPerSec: Number(process.env.CAVE_ADAPTER_RPS || 50),
          })
        : opts.limiter;
    this._limitersByKey = new Map();
    this.perKeyLimiter = opts.perKeyLimiter !== false;
    this.limiterKey = opts.limiterKey || ((route) => route.split(':')[0] || 'default');
    this.retry =
      opts.retry ??
      (process.env.CAVE_ADAPTER_RETRY === '0'
        ? null
        : { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 2000 });
    this.routePath = opts.routePath || '/cave/route';
  }

  /**
   * @param {CaveEnvelopeV2} envelope
   * @returns {Promise<Record<string, unknown>>}
   */
  async sendEnvelope(envelope) {
    if (!this.fetchImpl) throw new Error('fetch_unavailable');
    const urlKey = envelope.route || `${envelope.service || 'resaurce'}:`;
    if (!envelope.route && !envelope.message) {
      return { ok: false, skipped: true, reason: 'route_or_message_required' };
    }
    const base = this.resolveBaseUrl(urlKey);
    if (!base) return { ok: false, skipped: true, reason: 'no_base_url' };
    const lk = this.limiterKey(urlKey);
    let lim = this._sharedLimiter;
    if (this.perKeyLimiter && this._sharedLimiter != null) {
      if (!this._limitersByKey.has(lk)) {
        this._limitersByKey.set(
          lk,
          new TokenBucketLimiter({
            capacity: Number(process.env.CAVE_ADAPTER_RPS || 50),
            refillPerSec: Number(process.env.CAVE_ADAPTER_RPS || 50),
          })
        );
      }
      lim = this._limitersByKey.get(lk);
    }
    if (lim && !lim.tryConsume()) {
      return { ok: false, skipped: true, reason: 'usage_limited', key: lk };
    }
    try {
      this.breaker.beforeCall();
    } catch (ce) {
      if (ce && ce.code === 'CIRCUIT_OPEN') {
        return { ok: false, skipped: true, reason: 'circuit_open', breaker_state: this.breaker.state };
      }
      throw ce;
    }
    const rp = this.routePath.startsWith('/') ? this.routePath : `/${this.routePath}`;
    const url = `${base.replace(/\/$/, '')}${rp}`;
    const body = JSON.stringify(envelope);
    const run = async () => {
      return _span('cave.sendEnvelope', { 'cave.route': envelope.route }, async (span) => {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
        try {
          const res = await this.fetchImpl(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            signal: ctrl.signal,
          });
          span.setAttribute('http.status_code', res.status);
          let json;
          try {
            json = await res.json();
          } catch {
            const err = new Error('invalid_json');
            err.status = res.status;
            throw err;
          }
          if (!res.ok) {
            const err = new Error('http_error');
            err.status = res.status;
            err.body = json;
            throw err;
          }
          this.breaker.onSuccess();
          return json;
        } catch (e) {
          if (e && e.name === 'AbortError') {
            const err = new Error('timeout');
            err.status = 408;
            throw err;
          }
          if (e && e.status) throw e;
          const err = new Error('fetch_failed');
          throw err;
        } finally {
          clearTimeout(t);
        }
      });
    };
    try {
      if (this.retry) return await withRetries(this.retry, run);
      return await run();
    } catch (e) {
      this.breaker.onFailure();
      spanRecordError(e);
      return { ok: false, error: String((e && e.message) || e), status: e && e.status };
    }
  }
}

function spanRecordError(e) {
  _span('cave.error', {}, (s) => {
    s.recordException(e);
    s.end();
  });
}

module.exports = {
  configureOtel,
  TokenBucketLimiter,
  CircuitBreaker,
  withRetries,
  DefaultHttpCaveAdapter,
};
