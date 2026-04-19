/**
 * @inventory/cave-federation-host — LVM2-aligned default Cave HTTP + federation hints.
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
 * @param {{ baseUrl: string, fetchImpl?: typeof fetch }} options Cave base (no trailing slash required)
 */
export function createStructuralCaveClient(options) {
  const base = String(options.baseUrl || '').replace(/\/$/, '');
  const fetchFn = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
  if (!base) throw new Error('createStructuralCaveClient: baseUrl required');
  if (!fetchFn) throw new Error('createStructuralCaveClient: fetch not available; pass fetchImpl');

  return {
    baseUrl: base,
    /**
     * @param {string} route full route e.g. resaurce:hr/help/session
     * @param {Record<string, unknown>} payload
     * @param {{ traceId?: string, replyMode?: string, tenant?: string }} [opts]
     */
    async caveRoute(route, payload, opts = {}) {
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
