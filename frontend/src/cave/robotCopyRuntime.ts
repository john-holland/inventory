/**
 * RobotCopy — sole public Cave API for inventory browser.
 * Message-first flows; transport via sendCaveMessage / sendCaveRoute (internal).
 */

import type { RobotCopyFlowDef } from '../services/resaurceUiTome';
import type { PresenceContext } from '../adapters/userPresenceCaveAdapter';
import type { CaveSendResult } from '../services/resaurceClient';
import type { SoaServiceName } from '../services/soaRegistry';

export type CaveUiTome = {
  tome_semver: string;
  service: SoaServiceName;
  surfaces?: unknown[];
  robotcopy?: { flows?: Record<string, RobotCopyFlowDef> };
};

export function mergePayloadTemplate(
  tmpl: Record<string, unknown>,
  vars: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(tmpl)) {
    if (typeof v === 'string') {
      const m = /^{{(\w+)}}$/.exec(v);
      if (m && Object.prototype.hasOwnProperty.call(vars, m[1])) {
        out[k] = vars[m[1]] as unknown;
        continue;
      }
    }
    out[k] = v;
  }
  return out;
}

export type RobotCopyDeps = {
  sendCaveRoute: (
    route: string,
    payload: Record<string, unknown>,
    options?: { traceId?: string; presence?: string | null; replyMode?: string; tenant?: string | null }
  ) => Promise<CaveSendResult>;
  sendCaveMessage?: (
    message: string,
    payload: Record<string, unknown>,
    options?: {
      traceId?: string;
      presence?: string | null;
      tenant?: string | null;
      service?: SoaServiceName;
    }
  ) => Promise<CaveSendResult>;
  verifyPresence: (token: string | null) => Promise<PresenceContext>;
  readPresence: () => string | null;
  defaultService?: SoaServiceName;
  /** Flow defs from GET /cave/manifest robotcopy.flows (overrides tome.robotcopy). */
  flows?: Record<string, RobotCopyFlowDef>;
};

export type RobotCopyRuntime = {
  tome: CaveUiTome;
  executeFlow: (
    name: string,
    vars: Record<string, unknown>,
    opts?: { traceId?: string; tenant?: string | null }
  ) => Promise<CaveSendResult & { error?: string; reason?: string }>;
  sendMessage: (
    message: string,
    payload: Record<string, unknown>,
    opts?: {
      traceId?: string;
      tenant?: string | null;
      service?: SoaServiceName;
      requiresPresence?: boolean;
      presence?: string | null;
    }
  ) => Promise<CaveSendResult & { error?: string; reason?: string }>;
};

/** Flow name aliases → message names (when UI Tome has route-only flows). */
const FLOW_MESSAGE_ALIASES: Record<string, string> = {
  request_hr_help: 'request_hr_help',
  list_available_employees: 'list_available_employees',
  create_chat_room: 'create_chat_room',
  send_chat_message: 'send_chat_message',
  list_chat_messages: 'list_chat_messages',
  tax_documents_list: 'tax_documents_list',
  tax_generate_enqueue: 'tax_generate_enqueue',
  tax_generate_status: 'tax_generate_status',
  tax_generate_result: 'tax_generate_result',
};

export function createRobotCopyRuntime(tome: CaveUiTome, deps: RobotCopyDeps): RobotCopyRuntime {
  const rc = tome.robotcopy;
  const flows: Record<string, RobotCopyFlowDef> = {
    ...(rc?.flows && typeof rc.flows === 'object' ? rc.flows : {}),
    ...(deps.flows || {}),
  };
  const defaultService = deps.defaultService || tome.service || 'resaurce';

  async function sendMessage(
    message: string,
    payload: Record<string, unknown>,
    opts?: {
      traceId?: string;
      tenant?: string | null;
      service?: SoaServiceName;
      requiresPresence?: boolean;
      presence?: string | null;
    }
  ): Promise<CaveSendResult & { error?: string; reason?: string }> {
    if (opts?.requiresPresence) {
      const pr = await deps.verifyPresence(deps.readPresence());
      if (!pr.ok) {
        return { ok: false, skipped: true, reason: 'presence_failed' };
      }
    }
    const presence =
      opts?.presence !== undefined ? opts.presence : opts?.requiresPresence ? deps.readPresence() : null;
    if (deps.sendCaveMessage) {
      return deps.sendCaveMessage(message, payload, {
        traceId: opts?.traceId,
        presence,
        tenant: opts?.tenant ?? undefined,
        service: opts?.service || defaultService,
      }) as Promise<CaveSendResult & { error?: string; reason?: string }>;
    }
    return { ok: false, error: 'message_transport_unavailable' };
  }

  async function executeFlow(
    name: string,
    vars: Record<string, unknown>,
    opts?: { traceId?: string; tenant?: string | null }
  ): Promise<CaveSendResult & { error?: string; reason?: string }> {
    let def = flows[name];
    if (!def && FLOW_MESSAGE_ALIASES[name]) {
      def = { message: FLOW_MESSAGE_ALIASES[name], payload_template: {} };
    }
    if (!def) {
      return { ok: false, error: 'unknown_flow' };
    }

    const messageName = def.message || FLOW_MESSAGE_ALIASES[name] || name;
    const payload = mergePayloadTemplate(def.payload_template || {}, vars);
    const presence = def.requires_presence ? deps.readPresence() : null;

    if (def.requires_presence) {
      const pr = await deps.verifyPresence(presence);
      if (!pr.ok) {
        return { ok: false, skipped: true, reason: 'presence_failed' };
      }
    }

    if (def.message || FLOW_MESSAGE_ALIASES[name]) {
      return sendMessage(messageName, payload, {
        traceId: opts?.traceId,
        tenant: opts?.tenant,
        requiresPresence: def.requires_presence,
      });
    }

    if (def.route) {
      return deps.sendCaveRoute(def.route, payload, {
        traceId: opts?.traceId,
        presence,
        tenant: opts?.tenant ?? undefined,
      }) as Promise<CaveSendResult & { error?: string; reason?: string }>;
    }

    return { ok: false, error: 'unknown_flow' };
  }

  return { tome, executeFlow, sendMessage };
}
