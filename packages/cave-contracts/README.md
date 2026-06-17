# @inventory/cave-contracts

Versioned **JSON Schema** and **Pact** artifacts shared by inventory, resaurce, and saurce.

## Layout

- `schemas/envelope-v2.json` — Cave message envelope (aligns with [docs/cave-tome-lvm/SPEC.md](../../docs/cave-tome-lvm/SPEC.md)).
- `pacts/` — notes on copying stable pact JSON from `frontend/pacts/`.

## Hybrid discovery (1C) — Python workers

Implemented in [backend/python-apis/log_view_machine/soa_discovery.py](../../backend/python-apis/log_view_machine/soa_discovery.py). Merge order: **config file + env → AWS Cloud Map → OpenShift template** (later keys override).

| Variable | Purpose |
|----------|---------|
| `SOA_REGISTRY_PATH` | JSON/YAML registry with `contexts` (see `service_registry`) |
| `SOA_*_URL` / `SOA_RES_AURCE_URL`, `SOA_SAURCE_URL`, `SOA_INVENTORY_URL` | Per-service Cave bases |
| `SOA_USE_AWS_DISCOVERY` | Set `1` to call Cloud Map when `boto3` and namespace are configured |
| `SOA_CLOUDMAP_NAMESPACE_ID` | Cloud Map namespace id |
| `SOA_CLOUDMAP_SERVICES_JSON` | `{"resaurce":"service-name-in-namespace","saurce":"..."}` |
| `SOA_CLOUDMAP_SCHEME` | `http` or `https` (default `http`) |
| `SOA_OCP_URL_TEMPLATE` | e.g. `https://{service}-cave-{namespace}.apps.example.com` |
| `OCP_NAMESPACE` / `KUBERNETES_NAMESPACE` / `POD_NAMESPACE` | Substituted as `{namespace}` |

**Kotlin BFF (optional):** `SOA_CAVE_BFF_PROXY_ENABLED=true` exposes `POST /bff/cave/route` on the Spring app (see `application.properties` + `CaveBffProxyController`).

## Publish / submodule

- **npm:** `npm publish` from this directory after versioning.
- **git submodule:** add this path as a submodule in resaurce/saurce repos pointing at the same commit.

Sibling repos can also copy the schema + Pact JSON from inventory via [scripts/sync-cave-contracts-to-siblings.sh](../../scripts/sync-cave-contracts-to-siblings.sh).
