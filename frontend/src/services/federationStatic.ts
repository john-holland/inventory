/**
 * Static federation cache — Module Federation remotes only (no routing tables).
 */

import { buildSoaRegistryFromEnv, type SoaServiceName } from './soaRegistry';

export type StaticFederationSlice = {
  tome_semver: string;
  service: string;
  surfaces: Array<{ id: string; title?: string }>;
  assets_base?: string;
  federation?: {
    remote_name?: string;
    remote_entry_path?: string;
    exposed_module?: string;
  };
};

export type StaticFederationAggregated = {
  schema_version: string;
  generated_at: string;
  sources: Array<{ service: string; url: string; fetched_at: string }>;
  services: Record<string, StaticFederationSlice>;
};

const TTL_MS = Number(
  (typeof process !== 'undefined' && process.env.REACT_APP_FEDERATION_STATIC_CACHE_TTL_MS) || 300000
);

let _cache: { data: StaticFederationAggregated; expires: number } | null = null;

export async function aggregateStaticFederation(
  services: SoaServiceName[] = ['resaurce', 'saurce']
): Promise<StaticFederationAggregated> {
  const reg = buildSoaRegistryFromEnv();
  const now = new Date().toISOString();
  const out: StaticFederationAggregated = {
    schema_version: 'cave-federation-static-aggregated/1',
    generated_at: now,
    sources: [],
    services: {},
  };

  for (const svc of services) {
    const base = reg[svc];
    if (!base) continue;
    const url = `${base.replace(/\/$/, '')}/tome/${svc}-frontend`;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = (await res.json()) as StaticFederationSlice;
        out.services[svc] = json;
        out.sources.push({ service: svc, url, fetched_at: now });
      }
    } catch {
      /* skip unavailable host */
    }
  }

  _cache = { data: out, expires: Date.now() + TTL_MS };
  return out;
}

export function getStaticFederationCache(): StaticFederationAggregated | null {
  if (!_cache) return null;
  if (Date.now() > _cache.expires) return null;
  return _cache.data;
}

export async function getOrRefreshStaticFederation(
  force = false
): Promise<StaticFederationAggregated | null> {
  if (!force) {
    const cached = getStaticFederationCache();
    if (cached) return cached;
  }
  try {
    const live = await aggregateStaticFederation();
    if (Object.keys(live.services).length > 0) return live;
  } catch {
    /* fall through to bundled slice */
  }
  return loadBundledStaticFederation();
}

/** Offline aggregate from `public/federation.static.aggregated.json` (cave-cli output). */
export async function loadBundledStaticFederation(): Promise<StaticFederationAggregated | null> {
  if (typeof fetch === 'undefined') return null;
  try {
    const res = await fetch('/federation.static.aggregated.json', { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as StaticFederationAggregated;
    _cache = { data, expires: Date.now() + TTL_MS };
    return data;
  } catch {
    return getStaticFederationCache();
  }
}
