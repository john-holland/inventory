/**
 * user-presence-cave-adapter (inventory) — verifies presence via resaurce Cave RobotCopy.
 */

import { isServiceConfigured } from '../services/soaRegistry';
import { MSG_PRESENCE_VERIFY } from '../services/soaRoutes';

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
  if (!isServiceConfigured('resaurce')) {
    return { ok: true, traceId: 'dev', raw: { mode: 'cave_unconfigured' } };
  }
  if (!token) {
    return { ok: false };
  }
  const { getResaurceRobotCopy } = await import('../cave/resaurceInventoryCave');
  const rc = await getResaurceRobotCopy();
  if (!rc) {
    return { ok: false, raw: { reason: 'resaurce_cave_shell_unavailable' } };
  }
  const res = await rc.sendMessage(
    MSG_PRESENCE_VERIFY,
    { token },
    { traceId: `presence-${Date.now()}`, presence: token, service: 'resaurce' }
  );
  return { ok: Boolean(res.ok), traceId: res.trace_id as string | undefined, raw: res };
}

export function presenceHeaders(token: string | null): Record<string, string> {
  if (!token) return {};
  return { [PRESENCE_HEADER]: token };
}
