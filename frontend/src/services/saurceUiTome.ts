/**
 * Static federation slice from saurce — surfaces only (no routing tables).
 */

import { resolveCaveBaseUrlForService } from './soaRegistry';
import type { ResaurceFrontendTome, RobotCopyFlowDef } from './resaurceUiTome';

export type { RobotCopyFlowDef };

export type SaurceFrontendTome = Omit<ResaurceFrontendTome, 'service'> & { service: 'saurce' };

const UI_TOME_PATH = '/tome/saurce-frontend';

export function saurceUiTomeUrl(overrideBase?: string): string | null {
  const base = (overrideBase || resolveCaveBaseUrlForService('saurce') || '').replace(/\/$/, '');
  if (!base) return null;
  return `${base}${UI_TOME_PATH}`;
}

export async function fetchSaurceFrontendTome(overrideBase?: string): Promise<SaurceFrontendTome | null> {
  const url = saurceUiTomeUrl(overrideBase);
  if (!url) return null;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  return (await res.json()) as SaurceFrontendTome;
}
