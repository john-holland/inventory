/**
 * Inventory-local Cave surface for saurce: UI Tome + createTome shell + RobotCopy runtime.
 */

import type { TomeInstance } from 'log-view-machine';
import { fetchSaurceFrontendTome, type SaurceFrontendTome } from '../services/saurceUiTome';
import type { ResaurceFrontendTome } from '../services/resaurceUiTome';
import { sendCaveRoute } from '../services/resaurceClient';
import { resolveCaveBaseUrlForRoute } from '../services/soaRegistry';
import { SAURCE_COMMERCE_WALLET_BALANCE } from '../services/soaRoutes';
import { createRobotCopyRuntime, type RobotCopyRuntime } from './robotCopyRuntime';
import { createSaurceInventoryShellTome } from './inventorySaurceShell';

export type SaurceInventoryCave = {
  tome: SaurceFrontendTome;
  robotCopy: RobotCopyRuntime;
  tomeInstance: TomeInstance;
};

let cached: { semver: string; cave: SaurceInventoryCave } | null = null;

/**
 * Load UI Tome from saurce and create RobotCopy runtime. Caches by tome_semver.
 */
export async function loadSaurceInventoryCave(options?: {
  baseUrlOverride?: string;
  forceRefresh?: boolean;
}): Promise<SaurceInventoryCave | null> {
  const tome = await fetchSaurceFrontendTome(options?.baseUrlOverride);
  if (!tome || !tome.tome_semver) return null;
  if (!options?.forceRefresh && cached && cached.semver === tome.tome_semver) {
    return cached.cave;
  }
  const { tomeInstance } = createSaurceInventoryShellTome(tome);
  if (typeof tomeInstance.start === 'function') {
    await tomeInstance.start();
  }
  const robotCopy = createRobotCopyRuntime(tome as ResaurceFrontendTome, {
    sendCaveRoute,
    verifyPresence: async () => ({ ok: true as const, subject: 'saurce' }),
    readPresence: () => null,
  });
  const cave = { tome, robotCopy, tomeInstance };
  cached = { semver: tome.tome_semver, cave };
  return cave;
}

export function saurceFederationEntryUrl(_tome: SaurceFrontendTome, _baseOverride?: string): string | null {
  return null;
}

export async function clearSaurceInventoryCaveCache(): Promise<void> {
  if (cached?.cave?.tomeInstance && typeof cached.cave.tomeInstance.stop === 'function') {
    await cached.cave.tomeInstance.stop();
  }
  cached = null;
}

export function saurceInventoryCaveBaseUrl(override?: string): string | null {
  const base = (override || resolveCaveBaseUrlForRoute(SAURCE_COMMERCE_WALLET_BALANCE) || '').replace(/\/$/, '');
  return base || null;
}
