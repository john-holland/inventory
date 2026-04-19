/**
 * Minimal log-view-machine Tome shell for saurce Cave orchestration.
 */

import { createTome, createTomeConfig, type TomeInstance } from 'log-view-machine';
import type { SaurceFrontendTome } from '../services/saurceUiTome';

export type SaurceShellTome = {
  uiTome: SaurceFrontendTome;
  tomeInstance: TomeInstance;
};

export function createSaurceInventoryShellTome(uiTome: SaurceFrontendTome): SaurceShellTome {
  const allowedCount = Array.isArray((uiTome as { allowed_routes?: string[] }).allowed_routes)
    ? (uiTome as { allowed_routes: string[] }).allowed_routes.length
    : 0;
  const config = createTomeConfig({
    id: 'inventory-saurce-cave-shell',
    name: 'Inventory saurce Cave shell',
    description: 'Structural routing shell paired with RobotCopy runtime',
    context: {
      service: 'saurce',
      tome_semver: uiTome.tome_semver,
      allowedRoutesCount: allowedCount,
    },
    machines: {
      routingShell: {
        id: 'inventory-saurce-routing-shell',
        name: 'Routing shell',
        runHandlersOnTransition: true,
        defaultModelForTransitionHandlers: {},
        xstateConfig: {
          id: 'inventory-saurce-routing-shell',
          initial: 'ready',
          states: { ready: {} },
        },
        logStates: {
          ready: async (ctx) => {
            await ctx.log('inventory.saurce.shell.ready', {
              machineId: 'inventory-saurce-routing-shell',
              tome_semver: uiTome.tome_semver,
            });
          },
        },
      },
    },
  });
  return { uiTome, tomeInstance: createTome(config) };
}
