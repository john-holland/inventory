/**
 * Cave HTTP client (SOA): resolves base URL from `servicename:path` + env registry.
 * Uses `@inventory/cave-adapter` for retries, breaker, and limiter when available.
 */

import {
  buildSoaRegistryFromEnv,
  isAnySoaCaveConfigured,
  isServiceConfigured,
  parseExplicitService,
  resolveCaveBaseUrlForRoute,
} from './soaRegistry';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const caveAdapter = require('@inventory/cave-adapter') as typeof import('@inventory/cave-adapter');

export type { SoaServiceName } from './soaRegistry';

export type CaveSendResult = Record<string, unknown> & { ok?: boolean; skipped?: boolean };

export {
  buildSoaRegistryFromEnv,
  isAnySoaCaveConfigured,
  isServiceConfigured,
  parseExplicitService,
  resolveCaveBaseUrlForRoute,
};

/** @deprecated use isAnySoaCaveConfigured or isServiceConfigured */
export function isCaveConfigured(): boolean {
  return isAnySoaCaveConfigured();
}

function readEnv(key: string): string {
  return (typeof process !== 'undefined' && process.env[key]) || '';
}

let _adapter: import('@inventory/cave-adapter').DefaultHttpCaveAdapter | null = null;

function getAdapter(): import('@inventory/cave-adapter').DefaultHttpCaveAdapter {
  const bff = readEnv('REACT_APP_CAVE_BFF_URL').replace(/\/$/, '');
  if (!_adapter) {
    _adapter = new caveAdapter.DefaultHttpCaveAdapter({
      resolveBaseUrl: (route: string) => (bff ? bff : resolveCaveBaseUrlForRoute(route)),
      routePath: bff ? '/bff/cave/route' : '/cave/route',
    });
  }
  return _adapter;
}

export async function sendCaveRoute(
  route: string,
  payload: Record<string, unknown>,
  options?: { traceId?: string; presence?: string | null; replyMode?: string; tenant?: string | null }
): Promise<CaveSendResult> {
  if (readEnv('REACT_APP_CAVE_ADAPTER_LEGACY') === 'true') {
    return sendCaveRouteLegacy(route, payload, options);
  }
  const traceId =
    options?.traceId ||
    (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
    `trace-${Date.now()}`;
  const envelope = {
    schema_version: '2.0' as const,
    route,
    payload,
    trace_id: traceId,
    presence: options?.presence ?? undefined,
    tenant: options?.tenant ?? undefined,
    reply_mode: (options?.replyMode || 'sync_http') as 'sync_http',
  };
  return getAdapter().sendEnvelope(envelope) as Promise<CaveSendResult>;
}

async function sendCaveRouteLegacy(
  route: string,
  payload: Record<string, unknown>,
  options?: { traceId?: string; presence?: string | null; replyMode?: string; tenant?: string | null }
): Promise<CaveSendResult> {
  const base = resolveCaveBaseUrlForRoute(route);
  if (!base) {
    return { ok: false, skipped: true, reason: 'no Cave base URL for route (SOA env unset)' };
  }
  const traceId =
    options?.traceId ||
    (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
    `trace-${Date.now()}`;
  const body = {
    schema_version: '2.0',
    route,
    payload,
    trace_id: traceId,
    presence: options?.presence ?? undefined,
    tenant: options?.tenant ?? undefined,
    reply_mode: options?.replyMode || 'sync_http',
  };
  const res = await fetch(`${base}/cave/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  try {
    return (await res.json()) as CaveSendResult;
  } catch {
    return { ok: false, error: 'invalid JSON response', status: res.status };
  }
}
