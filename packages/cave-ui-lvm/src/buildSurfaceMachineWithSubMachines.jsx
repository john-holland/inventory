/**
 * Build ViewStateMachine with optional sub_machines from compiled Tome surface index.
 */

import React from 'react';
import {
  createViewStateMachine,
  createTomeConfig,
  createCaveDbViewStorageFacade,
  createSubMachineCapsule,
} from 'log-view-machine/browser';
import { buildXstateFromIndex, stateMetaFromIndex, mergeChartTransitions } from './buildSurfaceMachineCore.js';
import { getSurfaceChartExtras } from './surfaceTransitions.js';

const SUB_TRANSITIONS = {
  basic: { NEXT: 'users' },
  users: { NEXT: 'airbnb', BACK: 'basic' },
  airbnb: { NEXT: 'confirm', BACK: 'users' },
  confirm: { BACK: 'airbnb' },
};

function mergeChart(base, extra) {
  return mergeChartTransitions(base, extra);
}

function buildSubStateMeta(smDef) {
  const meta = {};
  if (!smDef?.states) return meta;
  for (const [name, cfg] of Object.entries(smDef.states)) {
    meta[name] = {
      ...(cfg.on_enter ? { on_enter: cfg.on_enter } : {}),
      ...(cfg.view ? { view: cfg.view } : {}),
    };
  }
  return meta;
}

function buildSubLogStates(smDef, viewMap, parentSend) {
  const logStates = {};
  if (!smDef?.states) return logStates;
  for (const [stateName, cfg] of Object.entries(smDef.states)) {
    const viewId = cfg.view;
    const ViewComp = viewId ? viewMap[viewId] : null;
    logStates[stateName] = async (ctx) => {
      if (ctx.model && typeof ctx.model === 'object') {
        ctx.model.wizardSubState = stateName;
      }
      if (ViewComp) {
        const send = (ev) => {
          if (ctx.model && typeof ctx.model === 'object') {
            if (ev.wizardDraft) ctx.model.wizardDraft = ev.wizardDraft;
            if (ev.wizardSubState) ctx.model.wizardSubState = ev.wizardSubState;
          }
          return ctx.send(ev);
        };
        ctx.view(
          <ViewComp
            model={ctx.model}
            send={send}
            state={stateName}
            log={ctx.log}
            parentSend={parentSend}
          />
        );
      }
    };
  }
  return logStates;
}

function buildSubXstate(smDef) {
  const states = {};
  const names = Object.keys(smDef.states || {});
  for (const name of names) {
    states[name] = { on: { ...(SUB_TRANSITIONS[name] || {}), RESET: 'basic' } };
  }
  return {
    id: smDef.id,
    initial: smDef.initial || names[0] || 'basic',
    states,
  };
}

/**
 * @param {Object} options
 * @param {import('./tomeModuleLoader.js').TomeSurfaceIndex} options.index
 * @param {Record<string, import('react').ComponentType<any>>} options.viewComponents
 * @param {Record<string, Record<string, import('react').ComponentType<any>>>} [options.subViewComponents]
 * @param {Object} options.deps
 */
export function buildSurfaceMachineWithSubMachines(options) {
  const { index, viewComponents, subViewComponents = {}, deps } = options;
  const registryKey = `${index.service}:${index.surface}`;
  const baseChart = buildXstateFromIndex(index);
  const xstateConfig = mergeChart(baseChart, getSurfaceChartExtras(registryKey));
  const stateMeta = stateMetaFromIndex(index);
  const middleware = index.state_middleware || [
    'trace',
    'presence',
    'delegation',
    'robotCopy',
    'caveDbSnapshot',
    'log',
  ];

  const parentSendRef = { fn: () => {} };

  const subMachines = {};
  for (const [subKey, smDef] of Object.entries(index.sub_machines || {})) {
    const views = subViewComponents[subKey] || viewComponents;
    subMachines[subKey] = {
      id: smDef.id,
      xstateConfig: buildSubXstate(smDef),
      stateMeta: buildSubStateMeta(smDef),
      stateMiddleware: middleware,
      robotCopySend: deps.robotCopySend,
      readPresence: deps.readPresence,
      db: deps.db,
      logStates: buildSubLogStates(smDef, views, (ev) => parentSendRef.fn(ev)),
    };
  }

  const capsuleRouter =
    index.capsule === 'subMachineRouter'
      ? async (ctx, next) => {
          if (ctx.state === 'wizardActive') {
            const cap = createSubMachineCapsule('createWizard');
            await cap(ctx, next);
            return;
          }
          await next();
        }
      : undefined;

  const chain = capsuleRouter ? [...middleware, 'capsule'] : middleware;

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
    stateMiddleware: chain,
    capsule: capsuleRouter,
    robotCopySend: deps.robotCopySend,
    readPresence: deps.readPresence,
    subMachines,
  });

  parentSendRef.fn = (ev) => {
    if (machine && typeof machine.send === 'function') machine.send(ev);
  };

  for (const stateName of index.states) {
    const meta = stateMeta[stateName];
    const viewId = meta?.view;
    const ViewComp = viewId ? viewComponents[viewId] : null;
    machine = machine.withState(stateName, async (ctx) => {
      if (stateName === 'wizardActive' && ctx.model && typeof ctx.model === 'object') {
        if (!ctx.model.wizardDraft) ctx.model.wizardDraft = { name: '', description: '', userIds: [], itemIds: [] };
        if (!ctx.model.wizardSubState) ctx.model.wizardSubState = 'basic';
        ctx.model.activeSubMachine = 'createWizard';
      }
      if (ViewComp) {
        ctx.view(
          <ViewComp
            model={ctx.model}
            send={ctx.send}
            state={stateName}
            log={ctx.log}
            getSubMachine={ctx.getSubMachine}
          />
        );
      }
    });
  }

  return machine;
}
