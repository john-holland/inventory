/**
 * Cave HTTP transport (internal to RobotCopy). SOA base URL resolution.
 * App code should use robotCopy.sendMessage / executeFlow — not these directly.
 */

import {
  buildSoaRegistryFromEnv,
  isAnySoaCaveConfigured,
  isServiceConfigured,
  parseExplicitService,
  resolveCaveBaseUrlForRoute,
  resolveCaveBaseUrlForService,
  type SoaServiceName,
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
  resolveCaveBaseUrlForService,
};

/** @deprecated use isAnySoaCaveConfigured or isServiceConfigured */
export function isCaveConfigured(): boolean {
  return isAnySoaCaveConfigured();
}

function newTraceId(explicit?: string): string {
  return (
    explicit ||
    (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
    `trace-${Date.now()}`
  );
}

let _adapter: import('@inventory/cave-adapter').DefaultHttpCaveAdapter | null = null;

function getAdapter(): import('@inventory/cave-adapter').DefaultHttpCaveAdapter {
  const bff = (process.env.REACT_APP_CAVE_BFF_URL || '').replace(/\/$/, '');
  if (!_adapter) {
    _adapter = new caveAdapter.DefaultHttpCaveAdapter({
      resolveBaseUrl: (routeOrService: string) => (bff ? bff : resolveCaveBaseUrlForRoute(routeOrService)),
      routePath: bff ? '/bff/cave/route' : '/cave/route',
    });
  }
  return _adapter;
}

export type CaveSendOptions = {
  traceId?: string;
  presence?: string | null;
  replyMode?: string;
  tenant?: string | null;
  causationId?: string | null;
  service?: SoaServiceName;
};

/**
 * RobotCopy transport: explicit structural route (compat).
 * @internal Prefer robotCopy.executeFlow / sendMessage from app code.
 */
export async function sendCaveRoute(
  route: string,
  payload: Record<string, unknown>,
  options?: CaveSendOptions
): Promise<CaveSendResult> {
  if (process.env.REACT_APP_CAVE_ADAPTER_LEGACY === 'true') {
    return sendCaveRouteLegacy(route, payload, options);
  }
  const envelope: import('@inventory/cave-adapter').CaveEnvelopeV2 = {
    schema_version: '2.0',
    route,
    payload,
    trace_id: newTraceId(options?.traceId),
    presence: options?.presence ?? undefined,
    tenant: options?.tenant ?? undefined,
    causation_id: options?.causationId ?? undefined,
    reply_mode: (options?.replyMode || 'sync_http') as 'sync_http',
  };
  return getAdapter().sendEnvelope(envelope) as Promise<CaveSendResult>;
}

/**
 * RobotCopy transport: message-first delegation (serving Cave resolves route).
 * @internal Prefer robotCopy.sendMessage from app code.
 */
export async function sendCaveMessage(
  message: string,
  payload: Record<string, unknown>,
  options?: CaveSendOptions
): Promise<CaveSendResult> {
  const service = options?.service || 'resaurce';
  if (!resolveCaveBaseUrlForService(service) && !process.env.REACT_APP_CAVE_BFF_URL) {
    return { ok: false, skipped: true, reason: `no Cave base URL for service ${service}` };
  }
  const envelope: import('@inventory/cave-adapter').CaveEnvelopeV2 = {
    schema_version: '2.0',
    message,
    service,
    payload,
    trace_id: newTraceId(options?.traceId),
    presence: options?.presence ?? undefined,
    tenant: options?.tenant ?? undefined,
    causation_id: options?.causationId ?? undefined,
    reply_mode: (options?.replyMode || 'sync_http') as 'sync_http',
  };
  return getAdapter().sendEnvelope(envelope) as Promise<CaveSendResult>;
}

async function sendCaveRouteLegacy(
  route: string,
  payload: Record<string, unknown>,
  options?: CaveSendOptions
): Promise<CaveSendResult> {
  const base = resolveCaveBaseUrlForRoute(route);
  if (!base) {
    return { ok: false, skipped: true, reason: 'no Cave base URL for route (SOA env unset)' };
  }
  const body = {
    schema_version: '2.0',
    route,
    payload,
    trace_id: newTraceId(options?.traceId),
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
