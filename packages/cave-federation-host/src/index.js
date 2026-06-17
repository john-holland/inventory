/**
 * @inventory/cave-federation-host — static federation slice reader (Module Federation remotes).
 * Outbound Cave HTTP must go through RobotCopy / sendCaveMessage — not this package.
 */

/**
 * @param {Record<string, unknown>} tome UI Tome JSON from GET /tome/*-frontend
 * @returns {{ remoteEntryPath: string | null, exposes?: string[] }}
 */
export function readFederationFromUiTome(tome) {
  if (!tome || typeof tome !== 'object') return { remoteEntryPath: null };
  const fed = /** @type {Record<string, unknown>} */ (tome).federation;
  if (!fed || typeof fed !== 'object') return { remoteEntryPath: null };
  const path = fed.remote_entry_path;
  const exposes = Array.isArray(fed.exposes) ? fed.exposes.filter((x) => typeof x === 'string') : undefined;
  return {
    remoteEntryPath: typeof path === 'string' && path.trim() ? path.trim() : null,
    exposes,
  };
}

/**
 * Fetch static federation slice from a Cave host.
 * @param {{ baseUrl: string, service?: string, fetchImpl?: typeof fetch }} options
 */
export async function fetchStaticFederationSlice(options) {
  const base = String(options.baseUrl || '').replace(/\/$/, '');
  const service = options.service || 'resaurce';
  const fetchFn = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
  if (!base) throw new Error('fetchStaticFederationSlice: baseUrl required');
  if (!fetchFn) throw new Error('fetchStaticFederationSlice: fetch not available');
  const res = await fetchFn(`${base}/tome/${service}-frontend`, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  return res.json();
}

/**
 * @deprecated Use RobotCopy.sendMessage / sendCaveMessage — direct route HTTP bypasses message delegation.
 * @param {{ baseUrl: string, fetchImpl?: typeof fetch }} options
 */
export function createStructuralCaveClient(options) {
  const base = String(options.baseUrl || '').replace(/\/$/, '');
  const fetchFn = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
  if (!base) throw new Error('createStructuralCaveClient: baseUrl required');
  if (!fetchFn) throw new Error('createStructuralCaveClient: fetch not available; pass fetchImpl');

  return {
    baseUrl: base,
    /**
     * @deprecated use message-first envelopes via RobotCopy
     */
    async caveRoute(route, payload, opts = {}) {
      console.warn(
        '[cave-federation-host] caveRoute is deprecated; use RobotCopy.sendMessage with logical message names'
      );
      const traceId =
        opts.traceId ||
        (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `trace-${Date.now()}`);
      const body = {
        schema_version: '2.0',
        route,
        payload: payload || {},
        trace_id: traceId,
        reply_mode: opts.replyMode || 'sync_http',
        ...(opts.tenant != null ? { tenant: opts.tenant } : {}),
      };
      const res = await fetchFn(`${base}/cave/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      let json = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }
      return { status: res.status, json };
    },
  };
}
