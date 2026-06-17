export interface CausalityHop {
  service: string;
  route: string;
  message?: string;
  hop: number;
  at: string;
}

export interface CaveEnvelopeV2 {
  schema_version: '2.0';
  /** Required when `message` is absent (server resolves when `message` present). */
  route?: string;
  /** Logical message name; serving Cave resolves via cave.manifest.yaml. */
  message?: string;
  /** Target Cave service when sending message-only (default resaurce). */
  service?: 'resaurce' | 'saurce' | 'inventory';
  payload: Record<string, unknown>;
  trace_id: string;
  reply_mode: 'sync_http' | 'async_queue' | 'async_poll_token';
  presence?: string | null;
  causation_id?: string | null;
  causality_path?: CausalityHop[];
  reply_to?: string | null;
  tenant?: string | null;
  tome_semver?: string | null;
  trace_loop?: { prevent?: boolean };
}

export type OtelLike = {
  startActiveSpan?: (name: string, opts: { attributes?: Record<string, unknown> }, fn: (s: SpanLike) => unknown) => unknown;
};

export interface SpanLike {
  setAttribute(key: string, value: unknown): void;
  recordException(e: unknown): void;
  end(): void;
}

export function configureOtel(api: OtelLike | null): void;

export class TokenBucketLimiter {
  constructor(opts: { capacity: number; refillPerSec: number });
  tryConsume(): boolean;
}

export class CircuitBreaker {
  constructor(opts: { failureThreshold: number; cooldownMs: number; halfOpenMaxAttempts: number });
  get state(): string;
  beforeCall(): void;
  onSuccess(): void;
  onFailure(): void;
}

export function withRetries<T>(
  opts: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number },
  fn: () => Promise<T>
): Promise<T>;

export class DefaultHttpCaveAdapter {
  constructor(opts: {
    resolveBaseUrl: (routeOrService: string) => string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    breaker?: CircuitBreaker;
    limiter?: TokenBucketLimiter | null;
    limiterKey?: (route: string) => string;
    perKeyLimiter?: boolean;
    retry?: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number } | null;
    routePath?: string;
  });
  sendEnvelope(envelope: CaveEnvelopeV2): Promise<Record<string, unknown>>;
}
