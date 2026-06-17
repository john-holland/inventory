/**
 * Static federation slice from resaurce — surfaces + Module Federation hints only.
 * Routing and RobotCopy flows live in cave.manifest.yaml (server-side).
 */

import { resolveCaveBaseUrlForService } from './soaRegistry';

const UI_TOME_PATH = '/tome/resaurce-frontend';

export type ResaurceFederationMeta = {
  remote_name: string;
  remote_entry_path: string;
  exposed_module: string;
};

/** Static federation slice served by GET /tome/resaurce-frontend */
export type ResaurceFrontendTome = {
  tome_semver: string;
  service: 'resaurce';
  surfaces: Array<{ id: string; title?: string }>;
  assets_base?: string;
  federation?: ResaurceFederationMeta;
};

/** @deprecated Flow defs moved to cave.manifest; kept for local RobotCopy runtime aliases. */
export type RobotCopyFlowDef = {
  message?: string;
  route?: string;
  requires_presence?: boolean;
  payload_template?: Record<string, unknown>;
};

export function resaurceUiTomeUrl(overrideBase?: string): string | null {
  const base = (overrideBase || resolveCaveBaseUrlForService('resaurce') || '').replace(/\/$/, '');
  if (!base) return null;
  return `${base}${UI_TOME_PATH}`;
}

export async function fetchResaurceFrontendTome(overrideBase?: string): Promise<ResaurceFrontendTome | null> {
  const url = resaurceUiTomeUrl(overrideBase);
  if (!url) return null;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  return (await res.json()) as ResaurceFrontendTome;
}
