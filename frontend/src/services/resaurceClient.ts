/**
 * Thin HTTP client to Cave (resaurce or mock). Aligns with docs/cave-tome-lvm/SPEC.md envelope v2.
 */

export type CaveSendResult = Record<string, unknown> & { ok?: boolean; skipped?: boolean };

function caveBaseUrl(): string {
  return (typeof process !== 'undefined' && process.env.REACT_APP_CAVE_BASE_URL) || '';
}

export function isCaveConfigured(): boolean {
  return Boolean(caveBaseUrl());
}

export async function sendCaveRoute(
  route: string,
  payload: Record<string, unknown>,
  options?: { traceId?: string; presence?: string | null; replyMode?: string }
): Promise<CaveSendResult> {
  const base = caveBaseUrl();
  if (!base) {
    return { ok: false, skipped: true, reason: 'REACT_APP_CAVE_BASE_URL unset' };
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
    reply_mode: options?.replyMode || 'sync_http',
  };
  const res = await fetch(`${base.replace(/\/$/, '')}/cave/route`, {
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

