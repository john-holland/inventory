/**
 * Inventory-local Cave surface: Resaurce UI Tome + browser shell stub + RobotCopy runtime.
 */

import { fetchResaurceFrontendTome, type ResaurceFrontendTome, type RobotCopyFlowDef } from '../services/resaurceUiTome';
import { sendCaveMessage, sendCaveRoute } from '../services/resaurceClient';
import { resolveCaveBaseUrlForService } from '../services/soaRegistry';
import { getOrRefreshStaticFederation } from '../services/federationStatic';
import { readPresenceFromWindow, verifyUserPresence } from '../adapters/userPresenceCaveAdapter';
import { createRobotCopyRuntime, type RobotCopyRuntime } from './robotCopyRuntime';
import { createResaurceInventoryShellTome } from './inventoryResaurceShell';
import { fetchCaveManifest, robotCopyFlowsFromManifest } from './fetchCaveManifest';
import type { CaveShellInstance } from './caveShellInstance';

export type ResaurceInventoryCave = {
  tome: ResaurceFrontendTome;
  robotCopy: RobotCopyRuntime;
  tomeInstance: CaveShellInstance;
};

let cached: { semver: string; cave: ResaurceInventoryCave } | null = null;

async function startShellIfNeeded(tomeInstance: CaveShellInstance): Promise<void> {
  if (typeof tomeInstance.start === 'function') {
    await tomeInstance.start();
  }
}

export async function loadResaurceInventoryCave(options?: {
  baseUrlOverride?: string;
  forceRefresh?: boolean;
}): Promise<ResaurceInventoryCave | null> {
  const base = options?.baseUrlOverride;
  const [tome, manifest] = await Promise.all([
    fetchResaurceFrontendTome(base),
    fetchCaveManifest('resaurce', base),
  ]);
  if (!tome || !tome.tome_semver) return null;
  if (!options?.forceRefresh && cached && cached.semver === tome.tome_semver) {
    return cached.cave;
  }
  const { tomeInstance } = createResaurceInventoryShellTome(tome);
  await startShellIfNeeded(tomeInstance);
  await getOrRefreshStaticFederation();
  const manifestFlows = robotCopyFlowsFromManifest(manifest) as Record<string, RobotCopyFlowDef>;
  const robotCopy = createRobotCopyRuntime(tome, {
    sendCaveRoute,
    sendCaveMessage,
    verifyPresence: verifyUserPresence,
    readPresence: readPresenceFromWindow,
    defaultService: 'resaurce',
    flows: manifestFlows,
  });
  try {
    await robotCopy.sendMessage(
      'trace_heartbeat',
      { source: 'inventory-resaurce-shell' },
      { traceId: `resaurce-shell-${Date.now()}`, service: 'resaurce' }
    );
  } catch {
    /* optional shell heartbeat */
  }
  const cave = { tome, robotCopy, tomeInstance };
  cached = { semver: tome.tome_semver, cave };
  return cave;
}

export function resaurceFederationEntryUrl(tome: ResaurceFrontendTome, baseOverride?: string): string | null {
  const fed = tome.federation;
  const remotePath = fed?.remote_entry_path;
  if (!remotePath) return null;
  const base = (baseOverride || resolveCaveBaseUrlForService('resaurce') || '').replace(/\/$/, '');
  if (!base) return null;
  return `${base}${remotePath.startsWith('/') ? remotePath : `/${remotePath}`}`;
}

export async function clearResaurceInventoryCaveCache(): Promise<void> {
  if (cached?.cave?.tomeInstance && typeof cached.cave.tomeInstance.stop === 'function') {
    await cached.cave.tomeInstance.stop();
  }
  cached = null;
}

let resaurceRobotCopyPromise: Promise<RobotCopyRuntime | null> | null = null;

export async function getResaurceRobotCopy(forceRefresh = false): Promise<RobotCopyRuntime | null> {
  if (!forceRefresh && cached?.cave?.robotCopy) return cached.cave.robotCopy;
  if (!forceRefresh && resaurceRobotCopyPromise) return resaurceRobotCopyPromise;
  resaurceRobotCopyPromise = loadResaurceInventoryCave({ forceRefresh }).then((c) => c?.robotCopy ?? null);
  return resaurceRobotCopyPromise;
}
