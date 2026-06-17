/**
 * Inventory-local Cave surface for saurce: UI Tome + browser shell stub + RobotCopy runtime.
 */

import { fetchSaurceFrontendTome, type SaurceFrontendTome } from '../services/saurceUiTome';
import type { RobotCopyFlowDef } from '../services/resaurceUiTome';
import { sendCaveMessage, sendCaveRoute } from '../services/resaurceClient';
import { createRobotCopyRuntime, type RobotCopyRuntime } from './robotCopyRuntime';
import { createSaurceInventoryShellTome } from './inventorySaurceShell';
import { getOrRefreshStaticFederation } from '../services/federationStatic';
import { fetchCaveManifest, robotCopyFlowsFromManifest } from './fetchCaveManifest';
import type { CaveShellInstance } from './caveShellInstance';

export type SaurceInventoryCave = {
  tome: SaurceFrontendTome;
  robotCopy: RobotCopyRuntime;
  tomeInstance: CaveShellInstance;
};

let cached: { semver: string; cave: SaurceInventoryCave } | null = null;
let robotCopyPromise: Promise<RobotCopyRuntime | null> | null = null;

export async function loadSaurceInventoryCave(options?: {
  baseUrlOverride?: string;
  forceRefresh?: boolean;
}): Promise<SaurceInventoryCave | null> {
  const base = options?.baseUrlOverride;
  const [tome, manifest] = await Promise.all([
    fetchSaurceFrontendTome(base),
    fetchCaveManifest('saurce', base),
  ]);
  if (!tome || !tome.tome_semver) return null;
  if (!options?.forceRefresh && cached && cached.semver === tome.tome_semver) {
    return cached.cave;
  }
  const { tomeInstance } = createSaurceInventoryShellTome(tome);
  if (typeof tomeInstance.start === 'function') {
    await tomeInstance.start();
  }
  await getOrRefreshStaticFederation();
  const manifestFlows = robotCopyFlowsFromManifest(manifest) as Record<string, RobotCopyFlowDef>;
  const robotCopy = createRobotCopyRuntime(tome, {
    sendCaveRoute,
    sendCaveMessage,
    verifyPresence: async () => ({ ok: true as const }),
    readPresence: () => null,
    defaultService: 'saurce',
    flows: manifestFlows,
  });
  try {
    await robotCopy.sendMessage(
      'trace_heartbeat',
      { source: 'inventory-saurce-shell' },
      { traceId: `saurce-shell-${Date.now()}`, service: 'saurce' }
    );
  } catch {
    /* optional shell heartbeat */
  }
  const cave = { tome, robotCopy, tomeInstance };
  cached = { semver: tome.tome_semver, cave };
  robotCopyPromise = Promise.resolve(robotCopy);
  return cave;
}

/** Cached RobotCopy for service-layer callers (WalletService, etc.). */
export async function getSaurceRobotCopy(forceRefresh = false): Promise<RobotCopyRuntime | null> {
  if (!forceRefresh && cached?.cave?.robotCopy) return cached.cave.robotCopy;
  if (!forceRefresh && robotCopyPromise) return robotCopyPromise;
  const cave = await loadSaurceInventoryCave({ forceRefresh });
  return cave?.robotCopy ?? null;
}

export async function clearSaurceInventoryCaveCache(): Promise<void> {
  if (cached?.cave?.tomeInstance && typeof cached.cave.tomeInstance.stop === 'function') {
    await cached.cave.tomeInstance.stop();
  }
  cached = null;
  robotCopyPromise = null;
}

export function saurceFederationEntryUrl(_tome: SaurceFrontendTome, _baseOverride?: string): string | null {
  return null;
}
