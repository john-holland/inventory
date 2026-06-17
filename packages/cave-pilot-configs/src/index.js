/**
 * @inventory/cave-pilot-configs — HR + wallet pilot Tome definitions (log-view-machine createTomeConfig).
 */
import { createTomeConfig } from 'log-view-machine';

function traceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Send message-first Cave envelope via fetch (pilot hosts wire RobotCopy.sendDelegatedMessage in production).
 */
async function sendCaveMessage(baseUrl, message, payload, options = {}) {
  const url = `${String(baseUrl).replace(/\/$/, '')}/cave/route`;
  const envelope = {
    schema_version: '2.0',
    message,
    payload: payload || {},
    trace_id: options.traceId || traceId(),
    tenant: options.tenant || 'pilot',
    presence: options.presence || 'pilot',
    reply_mode: 'sync_http',
    ...(options.service ? { service: options.service } : {}),
  };
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

/**
 * @param {{ resaurceBaseUrl?: string; duckdbPath?: string }} options
 */
export function buildResaurceHrPilotTomeConfig(options = {}) {
  const resaurceBaseUrl = options.resaurceBaseUrl || 'http://127.0.0.1:3456';
  const duckdbPath = options.duckdbPath || '';

  return createTomeConfig({
    id: 'resaurce-hr-pilot-tome',
    name: 'resaurce HR help pilot',
    description: 'ViewStateMachine pilot aligned with resaurce HR help Tome (message delegation)',
    messages: {
      request_hr_help: 'hr/help/request',
    },
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
            idle: { on: { request: 'sessionRequested' } },
            sessionRequested: { on: { chat_created: 'sessionActive', CAVE_FAIL: 'idle' } },
            sessionActive: { on: { RESET: 'idle' } },
          },
        },
        logStates: {
          idle: async (ctx) => {
            await ctx.log('resaurce HR pilot: idle', { message: 'request_hr_help', machineId: 'resaurce-hr-help-pilot' });
          },
          sessionRequested: async (ctx) => {
            const tid = traceId();
            await ctx.log('resaurce HR pilot: calling Cave', { trace_id: tid, message: 'request_hr_help', tenant: 'pilot' });
            const { ok, json } = await sendCaveMessage(resaurceBaseUrl, 'request_hr_help', { context: 'lvm-hr-pilot' }, {
              traceId: tid,
              service: 'resaurce',
            });
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
      routes: { hrHelpPilot: { path: '/events', method: 'POST' } },
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
    description: 'ViewStateMachine pilot for saurce wallet hold apply (message delegation)',
    messages: {
      wallet_hold_apply: 'wallet/hold/apply',
    },
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
            idle: { on: { APPLY_HOLD: 'applyingHold' } },
            applyingHold: { on: { CAVE_OK: 'success', CAVE_FAIL: 'error' } },
            success: { on: { RESET: 'idle' } },
            error: { on: { RESET: 'idle' } },
          },
        },
        logStates: {
          idle: async (ctx) => {
            await ctx.log('saurce wallet pilot: idle', { message: 'wallet_hold_apply' });
          },
          applyingHold: async (ctx) => {
            const tid = traceId();
            await ctx.log('saurce wallet pilot: applying hold', { trace_id: tid });
            const { ok, json } = await sendCaveMessage(
              saurceBaseUrl,
              'wallet_hold_apply',
              {
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
              { traceId: tid, service: 'saurce' }
            );
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
      routes: { walletHoldPilot: { path: '/events', method: 'POST' } },
    },
  });
}
