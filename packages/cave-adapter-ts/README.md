# @inventory/cave-adapter

Default **HTTP Cave** implementation with:

- **Circuit breaker** (failure threshold, half-open probe)
- **Retries** (exponential backoff + jitter on 408/429/5xx and network errors)
- **Token-bucket usage limiter** (per-route key)
- **OpenTelemetry** optional hooks (`configureOtel` no-op safe without SDK)

Inventory frontend depends on this package via `file:../packages/cave-adapter-ts` from [frontend/package.json](../../frontend/package.json).
