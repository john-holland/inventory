/**
 * Fetch cave.manifest.yaml from a Cave host (tooling + inventory shell boot).
 */

import { resolveCaveBaseUrlForService, type SoaServiceName } from '../services/soaRegistry';

export type CaveManifestRobotCopyFlow = {
  message?: string;
  route?: string;
  requires_presence?: boolean;
  payload_template?: Record<string, unknown>;
};

export type CaveManifestDoc = {
  schema_version?: string;
  service?: string;
  messages?: Record<string, string>;
  robotcopy?: { flows?: Record<string, CaveManifestRobotCopyFlow> };
  tomes?: Record<string, unknown>;
  lvm?: { machines?: unknown[]; multicast?: Record<string, unknown> };
};

export async function fetchCaveManifest(
  service: SoaServiceName,
  overrideBase?: string
): Promise<CaveManifestDoc | null> {
  const base = (overrideBase || resolveCaveBaseUrlForService(service) || '').replace(/\/$/, '');
  if (!base) return null;
  try {
    const res = await fetch(`${base}/cave/manifest`, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return (await res.json()) as CaveManifestDoc;
  } catch {
    return null;
  }
}

export function robotCopyFlowsFromManifest(
  manifest: CaveManifestDoc | null
): Record<string, CaveManifestRobotCopyFlow> {
  const flows = manifest?.robotcopy?.flows;
  return flows && typeof flows === 'object' ? flows : {};
}
