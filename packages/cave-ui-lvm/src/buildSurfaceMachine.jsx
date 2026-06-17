/**
 * Build ViewStateMachine from Tome surface index + view handler registry.
 */

import React from 'react';
import {
  createViewStateMachine,
  createTomeConfig,
  createCaveDbViewStorageFacade,
} from 'log-view-machine/browser';
import { buildXstateFromIndex, stateMetaFromIndex, mergeChartTransitions } from './buildSurfaceMachineCore.js';
import { getSurfaceChartExtras } from './surfaceTransitions.js';

export { buildXstateFromIndex, stateMetaFromIndex, mergeChartTransitions } from './buildSurfaceMachineCore.js';

/**
 * @param {Object} options
 * @param {import('./tomeModuleLoader.js').TomeSurfaceIndex} options.index
 * @param {Record<string, import('react').ComponentType<any>>} options.viewComponents
 * @param {Object} options.deps
 * @param {Record<string, object>} [options.stateMetaOverride]
 */
export function buildSurfaceMachine(options) {
  const { index, viewComponents, deps, stateMetaOverride } = options;
  const registryKey = `${index.service}:${index.surface}`;
  const baseChart = buildXstateFromIndex(index);
  const xstateConfig = mergeChartTransitions(baseChart, getSurfaceChartExtras(registryKey));
  const stateMeta = { ...stateMetaFromIndex(index), ...(stateMetaOverride || {}) };
  const middleware = index.state_middleware || ['trace', 'presence', 'delegation', 'robotCopy', 'caveDbSnapshot', 'log'];

  let machine = createViewStateMachine({
    machineId: index.machineId || `inventory:${index.surface}`,
    xstateConfig,
    tomeConfig: createTomeConfig({
      id: `${index.service}-${index.surface}`,
      messages: deps.messages,
      delegation: { service: deps.delegationService || index.service },
    }),
    db: deps.db ? createCaveDbViewStorageFacade(deps.db) : undefined,
    stateMeta,
    stateMiddleware: middleware,
    robotCopySend: deps.robotCopySend,
    readPresence: deps.readPresence,
  });

  for (const stateName of index.states) {
    const meta = stateMeta[stateName];
    const viewId = meta?.view;
    const ViewComp = viewId ? viewComponents[viewId] : null;
    machine = machine.withState(stateName, async (ctx) => {
      if (ViewComp) {
        ctx.view(
          <ViewComp model={ctx.model} send={ctx.send} state={stateName} log={ctx.log} />
        );
      }
    });
  }

  return machine;
}

/** @deprecated use buildSurfaceMachine */
export function buildSurfaceTome(options) {
  return buildSurfaceMachine(options);
}
