/**
 * SOA: resolve Cave base URL from route prefix (servicename:path) + env / optional registry.
 * Mirrors backend/python-apis/log_view_machine/routing.py semantics for the browser.
 */

export type SoaServiceName = 'resaurce' | 'saurce' | 'inventory';

export interface SoaEnvRegistry {
  resaurce: string;
  saurce: string;
  inventory: string;
}

const env = {
  caveBaseUrl: process.env.REACT_APP_CAVE_BASE_URL || '',
  resaurceUrl: process.env.REACT_APP_SOA_RES_AURCE_URL || '',
  saurceUrl: process.env.REACT_APP_SOA_SAURCE_URL || '',
  inventoryUrl: process.env.REACT_APP_SOA_INVENTORY_URL || '',
  saurceBridgeEnabled: process.env.REACT_APP_SAURCE_BRIDGE_ENABLED || '',
  soaStrictMode: process.env.REACT_APP_SOA_STRICT_MODE || '',
  caveDevFallback: process.env.REACT_APP_CAVE_DEV_FALLBACK || '',
};

/**
 * Build service → origin map from Create React App env.
 * Legacy: REACT_APP_CAVE_BASE_URL populates resaurce when REACT_APP_SOA_RES_AURCE_URL is unset.
 */
export function buildSoaRegistryFromEnv(): SoaEnvRegistry {
  const legacy = env.caveBaseUrl;
  return {
    resaurce: env.resaurceUrl || legacy,
    saurce: env.saurceUrl,
    inventory: env.inventoryUrl,
  };
}

/** First segment before ':' when it looks like a service name (slug). */
export function parseExplicitService(route: string): string | null {
  if (!route || !route.includes(':')) return null;
  const idx = route.indexOf(':');
  const svc = route.slice(0, idx).trim().toLowerCase();
  if (!svc || !/^[a-z][a-z0-9_]*$/.test(svc)) return null;
  return svc;
}

export function resolveCaveBaseUrlForService(service: SoaServiceName): string {
  const reg = buildSoaRegistryFromEnv();
  return (reg[service] || '').replace(/\/$/, '');
}

export function resolveCaveBaseUrlForRoute(route: string): string {
  const svc = parseExplicitService(route);
  const reg = buildSoaRegistryFromEnv();
  if (svc && reg[svc as SoaServiceName]) {
    return reg[svc as SoaServiceName].replace(/\/$/, '');
  }
  // Path-only: use legacy single Cave URL (RobotCopy local resolution on server).
  return env.caveBaseUrl.replace(/\/$/, '');
}

export function isServiceConfigured(service: SoaServiceName): boolean {
  return Boolean(buildSoaRegistryFromEnv()[service]);
}

/** True if any SOA Cave endpoint is available (legacy URL counts as resaurce). */
export function isAnySoaCaveConfigured(): boolean {
  const r = buildSoaRegistryFromEnv();
  return Boolean(r.resaurce || r.saurce || r.inventory);
}

/** When true, Wallet/Investment may call saurce Cave routes (still no-ops if saurce URL unset). */
export function isSaurceBridgeEnabled(): boolean {
  return env.saurceBridgeEnabled === 'true';
}

/**
 * When true and a Cave base is configured, inventory services must not silently fall back to
 * local mocks after a failed Cave call (throws instead). Use for cutover testing.
 */
export function isSoaStrictMode(): boolean {
  return env.soaStrictMode === 'true';
}

/** Dev/test only: allow local domain mocks when Cave fails or is unset. Never enable in production UI. */
export function isCaveDevFallback(): boolean {
  return env.caveDevFallback === 'true';
}

const ROUTING_TABLE_KEYS = new Set([
  'messages',
  'routes',
  'routing',
  'machines',
  'multicast',
  'robotcopy',
  'lvm',
]);

/**
 * Location-invariant SOA: registry entries must be base URLs only.
 * Routing tables live in each host's `GET /cave/manifest`, not in the registry.
 */
export function validateLocationInvariantRegistry(
  registry: Record<string, unknown>
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(registry)) {
    if (ROUTING_TABLE_KEYS.has(key)) {
      errors.push(`registry must not contain routing key "${key}" — use GET /cave/manifest on each host`);
      continue;
    }
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (!/^https?:\/\//i.test(trimmed)) {
      errors.push(`registry[${key}] must be an http(s) base URL, got "${trimmed}"`);
      continue;
    }
    try {
      const u = new URL(trimmed);
      const path = u.pathname.replace(/\/$/, '');
      if (path && path !== '') {
        errors.push(
          `registry[${key}] must be origin-only (no path); routing is location-invariant via cave.manifest.yaml`
        );
      }
    } catch {
      errors.push(`registry[${key}] is not a valid URL`);
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

/** Validate CRA env registry conforms to location-invariant routing (URLs only). */
export function assertLocationInvariantEnvRegistry(): void {
  const reg = buildSoaRegistryFromEnv();
  const result = validateLocationInvariantRegistry(reg as unknown as Record<string, unknown>);
  if (!result.ok && env.soaStrictMode === 'true') {
    throw new Error(`SOA registry violates location-invariant routing: ${result.errors.join('; ')}`);
  }
}
