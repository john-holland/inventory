/**
 * Inventory-local Cave surface: Resaurce UI Tome + log-view-machine createTome shell + RobotCopy runtime.
 */

import type { TomeInstance } from 'log-view-machine';
import { fetchResaurceFrontendTome, type ResaurceFrontendTome } from '../services/resaurceUiTome';
import { sendCaveRoute } from '../services/resaurceClient';
import { resolveCaveBaseUrlForRoute } from '../services/soaRegistry';
import { RESAURCE_HR_HELP_REQUEST } from '../services/soaRoutes';
import { readPresenceFromWindow, verifyUserPresence } from '../adapters/userPresenceCaveAdapter';
import { createRobotCopyRuntime, type RobotCopyRuntime } from './robotCopyRuntime';
import { createResaurceInventoryShellTome } from './inventoryResaurceShell';

export type ResaurceInventoryCave = {
  tome: ResaurceFrontendTome;
  robotCopy: RobotCopyRuntime;
  /** log-view-machine TomeInstance (Cave → Tome shell); start() for logStates. */
  tomeInstance: TomeInstance;
};

let cached: { semver: string; cave: ResaurceInventoryCave } | null = null;

async function startShellIfNeeded(tomeInstance: TomeInstance): Promise<void> {
  if (typeof tomeInstance.start === 'function') {
    await tomeInstance.start();
  }
}

/**
 * Load UI Tome from Resaurce and create RobotCopy runtime. Caches by tome_semver.
 */
export async function loadResaurceInventoryCave(options?: {
  baseUrlOverride?: string;
  forceRefresh?: boolean;
}): Promise<ResaurceInventoryCave | null> {
  const tome = await fetchResaurceFrontendTome(options?.baseUrlOverride);
  if (!tome || !tome.tome_semver) return null;
  if (!options?.forceRefresh && cached && cached.semver === tome.tome_semver) {
    return cached.cave;
  }
  const { tomeInstance } = createResaurceInventoryShellTome(tome);
  await startShellIfNeeded(tomeInstance);
  const robotCopy = createRobotCopyRuntime(tome, {
    sendCaveRoute,
    verifyPresence: verifyUserPresence,
    readPresence: readPresenceFromWindow,
  });
  const cave = { tome, robotCopy, tomeInstance };
  cached = { semver: tome.tome_semver, cave };
  return cave;
}

export function resaurceFederationEntryUrl(tome: ResaurceFrontendTome, baseOverride?: string): string | null {
  const fed = (tome as { federation?: { remote_entry_path?: string } }).federation;
  const path = fed?.remote_entry_path;
  if (!path) return null;
  const base = (baseOverride || resolveCaveBaseUrlForRoute(RESAURCE_HR_HELP_REQUEST) || '').replace(/\/$/, '');
  if (!base) return null;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function clearResaurceInventoryCaveCache(): Promise<void> {
  if (cached?.cave?.tomeInstance && typeof cached.cave.tomeInstance.stop === 'function') {
    await cached.cave.tomeInstance.stop();
  }
  cached = null;
}
