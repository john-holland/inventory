/**
 * @inventory/cave-pilot-configs — HR + wallet pilot Tome definitions (log-view-machine createTomeConfig).
 * Consumed by log-view-machine node-mod-editor and any host that registers the same pilots.
 */
import { createTomeConfig } from 'log-view-machine';

async function postCaveRoute(baseUrl, envelope) {
  const url = `${String(baseUrl).replace(/\/$/, '')}/cave/route`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelope),
  });
  let json = {};
  try {
    json = await res.json();
  } catch (_) {
    json = {};
  }
  return { ok: res.ok, status: res.status, json };
}

function traceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * @param {{ resaurceBaseUrl?: string; duckdbPath?: string }} options
 */
export function buildResaurceHrPilotTomeConfig(options = {}) {
  const resaurceBaseUrl = options.resaurceBaseUrl || 'http://127.0.0.1:3456';
  const duckdbPath = options.duckdbPath || '';

  return createTomeConfig({
    id: 'resaurce-hr-pilot-tome',
    name: 'resaurce HR help pilot',
    description: 'ViewStateMachine pilot aligned with resaurce HR help Tome (orchestration + Cave envelope v2)',
    persistence: {
      enabled: true,
      adapter: 'duckdb',
      config: { path: duckdbPath, databasePath: duckdbPath },
    },
    machines: {
      hrHelpPilot: {
        id: 'resaurce-hr-help-pilot',
        name: 'HR help pilot',
        runHandlersOnTransition: true,
        defaultModelForTransitionHandlers: {},
        xstateConfig: {
          id: 'resaurce-hr-help-pilot',
          initial: 'idle',
          states: {
            idle: {
              on: { request: 'sessionRequested' },
            },
            sessionRequested: {
              on: { chat_created: 'sessionActive', CAVE_FAIL: 'idle' },
            },
            sessionActive: {
              on: { RESET: 'idle' },
            },
          },
        },
        logStates: {
          idle: async (ctx) => {
            await ctx.log('resaurce HR pilot: idle', {
              route: 'resaurce:hr/help/request',
              machineId: 'resaurce-hr-help-pilot',
            });
          },
          sessionRequested: async (ctx) => {
            const tid = traceId();
            await ctx.log('resaurce HR pilot: calling Cave', {
              trace_id: tid,
              route: 'resaurce:hr/help/request',
              tenant: 'pilot',
            });
            const envelope = {
              schema_version: '2.0',
              route: 'resaurce:hr/help/request',
              payload: { context: 'lvm-hr-pilot' },
              trace_id: tid,
              tenant: 'pilot',
              presence: 'pilot',
              reply_mode: 'sync_http',
            };
            const { ok, json } = await postCaveRoute(resaurceBaseUrl, envelope);
            if (!ok || json?.ok === false) {
              await ctx.log('resaurce HR pilot: Cave error', { trace_id: tid, json, status: ok });
              ctx.send({ type: 'CAVE_FAIL' });
              return;
            }
            if (ctx.db && typeof ctx.db.put === 'function') {
              await ctx.db.put(`snapshot:resaurce-hr-help-pilot:${tid}`, {
                state: 'sessionActive',
                trace_id: tid,
                sessionId: json.sessionId,
                updatedAt: new Date().toISOString(),
              });
            }
            await ctx.log('resaurce HR pilot: Cave ok', { trace_id: tid, sessionId: json.sessionId });
            ctx.send({ type: 'chat_created', payload: { trace_id: tid, sessionId: json.sessionId } });
          },
          sessionActive: async (ctx) => {
            await ctx.log('resaurce HR pilot: session active', {
              trace_id: ctx.event?.payload?.trace_id,
              machineId: 'resaurce-hr-help-pilot',
            });
          },
        },
      },
    },
    routing: {
      basePath: '/api/pilot/resaurce-hr',
      routes: {
        hrHelpPilot: { path: '/events', method: 'POST' },
      },
    },
  });
}

/**
 * @param {{ saurceBaseUrl?: string; duckdbPath?: string }} options
 */
export function buildSaurceWalletHoldPilotTomeConfig(options = {}) {
  const saurceBaseUrl = options.saurceBaseUrl || 'http://127.0.0.1:3457';
  const duckdbPath = options.duckdbPath || '';

  return createTomeConfig({
    id: 'saurce-wallet-pilot-tome',
    name: 'saurce wallet hold pilot',
    description: 'ViewStateMachine pilot for saurce wallet hold apply (Cave envelope v2)',
    persistence: {
      enabled: true,
      adapter: 'duckdb',
      config: { path: duckdbPath, databasePath: duckdbPath },
    },
    machines: {
      walletHoldPilot: {
        id: 'saurce-wallet-hold-pilot',
        name: 'Wallet hold pilot',
        runHandlersOnTransition: true,
        defaultModelForTransitionHandlers: {},
        xstateConfig: {
          id: 'saurce-wallet-hold-pilot',
          initial: 'idle',
          states: {
            idle: {
              on: { APPLY_HOLD: 'applyingHold' },
            },
            applyingHold: {
              on: { CAVE_OK: 'success', CAVE_FAIL: 'error' },
            },
            success: {
              on: { RESET: 'idle' },
            },
            error: {
              on: { RESET: 'idle' },
            },
          },
        },
        logStates: {
          idle: async (ctx) => {
            await ctx.log('saurce wallet pilot: idle', { route: 'saurce:wallet/hold/apply' });
          },
          applyingHold: async (ctx) => {
            const tid = traceId();
            await ctx.log('saurce wallet pilot: applying hold', { trace_id: tid });
            const envelope = {
              schema_version: '2.0',
              route: 'saurce:wallet/hold/apply',
              payload: {
                wallet_id: 'wallet_001',
                item_id: 'item_pilot',
                lines: [
                  {
                    type: 'shipping_hold_deposit',
                    amount: 1,
                    currency: 'USD',
                    description: 'lvm-pilot-hold',
                    hold_type: 'shipping',
                  },
                ],
              },
              trace_id: tid,
              tenant: 'pilot',
              presence: 'pilot',
              reply_mode: 'sync_http',
            };
            const { ok, json } = await postCaveRoute(saurceBaseUrl, envelope);
            if (!ok || json?.ok === false) {
              await ctx.log('saurce wallet pilot: Cave error', { trace_id: tid, json });
              ctx.send({ type: 'CAVE_FAIL' });
              return;
            }
            if (ctx.db && typeof ctx.db.put === 'function') {
              await ctx.db.put(`snapshot:saurce-wallet-hold-pilot:${tid}`, {
                state: 'success',
                trace_id: tid,
                updatedAt: new Date().toISOString(),
              });
            }
            ctx.send({ type: 'CAVE_OK', payload: { trace_id: tid, wallet: json.wallet } });
          },
          success: async (ctx) => {
            await ctx.log('saurce wallet pilot: hold applied', { trace_id: ctx.event?.payload?.trace_id });
          },
          error: async (ctx) => {
            await ctx.log('saurce wallet pilot: error state', {});
          },
        },
      },
    },
    routing: {
      basePath: '/api/pilot/saurce-wallet',
      routes: {
        walletHoldPilot: { path: '/events', method: 'POST' },
      },
    },
  });
}
