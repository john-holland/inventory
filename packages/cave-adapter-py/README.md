# cave-adapter (Python)

Install from the inventory monorepo:

```bash
pip install -e packages/cave-adapter-py
```

`log_view_machine.cave_client` adds `packages/cave-adapter-py` to `sys.path` when present so workers pick this up without a separate install.

**Environment**

- `CAVE_ADAPTER_RETRY=0` — disable retries
- `CAVE_ADAPTER_RPS` — token bucket capacity and refill rate per route prefix (default `50`)
- `CAVE_ADAPTER_BREAKER_THRESHOLD` — failures before open (default `5`)
