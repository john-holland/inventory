/**
 * user-presence-cave-adapter (inventory) — verifies presence via resaurce Cave route.
 * Same pattern should be copied to continuuuum, unified-semantic-compressor, saurce (see integrations/).
 */

import { sendCaveRoute, isCaveConfigured } from '../services/resaurceClient';

export interface PresenceContext {
  ok: boolean;
  traceId?: string;
  raw?: Record<string, unknown>;
}

const PRESENCE_HEADER = 'X-Presence-Token';

export function readPresenceFromWindow(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem('presence_token');
}

export async function verifyUserPresence(token: string | null): Promise<PresenceContext> {
  if (!isCaveConfigured()) {
    // Dev / tests: no Cave — treat as satisfied (inventory-only flows).
    return { ok: true, traceId: 'dev', raw: { mode: 'cave_unconfigured' } };
  }
  if (!token) {
    return { ok: false };
  }
  const res = await sendCaveRoute(
    'resaurce:presence/verify',
    { token },
    { traceId: `presence-${Date.now()}`, presence: token }
  );
  return { ok: Boolean(res.ok), traceId: res.trace_id as string | undefined, raw: res };
}

export function presenceHeaders(token: string | null): Record<string, string> {
  if (!token) return {};
  return { [PRESENCE_HEADER]: token };
}
