/**
 * Minimal log-view-machine Tome shell for resaurce Cave orchestration (createTome + createTomeConfig).
 * Structural HTTP calls remain in robotCopyRuntime until flows are fully charted here.
 */

import { createTome, createTomeConfig, type TomeInstance } from 'log-view-machine';
import type { ResaurceFrontendTome } from '../services/resaurceUiTome';

export type ResaurceShellTome = {
  uiTome: ResaurceFrontendTome;
  tomeInstance: TomeInstance;
};

/**
 * Browser-safe shell: one machine `routingShell` in `ready` with a startup log hook.
 * Pair with {@link createRobotCopyRuntime} for envelope sends until flows migrate to logStates.
 */
export function createResaurceInventoryShellTome(uiTome: ResaurceFrontendTome): ResaurceShellTome {
  const allowedCount = Array.isArray(uiTome.allowed_routes) ? uiTome.allowed_routes.length : 0;
  const config = createTomeConfig({
    id: 'inventory-resaurce-cave-shell',
    name: 'Inventory resaurce Cave shell',
    description: 'Structural routing shell; RobotCopy flows delegate HTTP until migrated to chart handlers',
    context: {
      service: 'resaurce',
      tome_semver: uiTome.tome_semver,
      allowedRoutesCount: allowedCount,
    },
    machines: {
      routingShell: {
        id: 'inventory-resaurce-routing-shell',
        name: 'Routing shell',
        runHandlersOnTransition: true,
        defaultModelForTransitionHandlers: {},
        xstateConfig: {
          id: 'inventory-resaurce-routing-shell',
          initial: 'ready',
          states: {
            ready: {},
          },
        },
        logStates: {
          ready: async (ctx) => {
            await ctx.log('inventory.resaurce.shell.ready', {
              machineId: 'inventory-resaurce-routing-shell',
              tome_semver: uiTome.tome_semver,
              allowed_routes: allowedCount,
            });
          },
        },
      },
    },
  });

  const tomeInstance = createTome(config);
  return { uiTome, tomeInstance };
}
