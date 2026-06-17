declare module '@inventory/cave-adapter' {
  export interface CaveEnvelopeV2 {
    schema_version: '2.0';
    route?: string;
    message?: string;
    service?: 'resaurce' | 'saurce' | 'inventory';
    payload: Record<string, unknown>;
    trace_id: string;
    reply_mode: string;
    presence?: string | null;
    causation_id?: string | null;
    causality_path?: unknown[];
    tenant?: string | null;
    trace_loop?: { prevent?: boolean };
  }

  export class DefaultHttpCaveAdapter {
    constructor(opts: {
      resolveBaseUrl: (routeOrService: string) => string;
      routePath?: string;
      fetchImpl?: typeof fetch;
      timeoutMs?: number;
    });
    sendEnvelope(envelope: CaveEnvelopeV2): Promise<Record<string, unknown>>;
  }
}
