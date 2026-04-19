# Cave–Tome–LVM specification (structural routing and message passing)

Normative for john-holland/inventory, john-holland/resaurce, john-holland/saurce, john-holland/log-view-machine (Python package in this repo until split), and coordinated adapters.

## SOA service discovery (hybrid)

Inventory resolves `explicit_service` in a route (e.g. `resaurce:hr/help/request`, `saurce:crypto/portfolio/snapshot`) to a **Cave base URL** before calling `POST {base}/cave/route`.

1. **Config (default):** Registry file from `SOA_REGISTRY_PATH` — **JSON** or **YAML** (`.yaml` / `.yml`; PyYAML required in Python). Examples: [soa-registry.example.json](../soa-registry.example.json), [soa-registry.example.yaml](../soa-registry.example.yaml). `contexts` keys: `default`, `stage name`, or `vpc-id__subnet-id`. Per-service env overrides: `SOA_RES_AURCE_URL`, `SOA_SAURCE_URL`, `SOA_INVENTORY_URL`. Legacy `CAVE_BASE_URL` maps to **resaurce** when `SOA_RES_AURCE_URL` is unset (Python workers).
2. **AWS (optional):** Set `SOA_USE_AWS_DISCOVERY=1`; when boto3 and Cloud Map wiring are present, `AwsCloudMapRegistryAdapter` may override URLs; otherwise it contributes nothing and config wins.

**Ec2SubnetConfigurationAdapter** (concept): `DiscoveryContext` carries `vpc_id`, `subnet_id`, `stage`, `region` (from env `SOA_VPC_ID`, `SOA_SUBNET_ID`, `SOA_STAGE`, `AWS_REGION`). Implementations: `ConfigSubnetRegistryAdapter`, `AwsCloudMapRegistryAdapter`; merge via `resolve_hybrid_service_urls()` in Python ([backend/python-apis/log_view_machine/soa_discovery.py](../backend/python-apis/log_view_machine/soa_discovery.py)).

**Browser:** `REACT_APP_SOA_RES_AURCE_URL`, `REACT_APP_SOA_SAURCE_URL`, `REACT_APP_SOA_INVENTORY_URL`, plus legacy `REACT_APP_CAVE_BASE_URL` for resaurce fallback ([frontend/src/services/soaRegistry.ts](../frontend/src/services/soaRegistry.ts)).

## Structural routing

- **Route grammar**: `[<serviceName> ":"] <domain> "/" <resource> { "/" <segment> }` where each segment is a lowercase slug `[a-z0-9_]+`.
- **Explicit service**: optional `serviceName:` prefix (e.g. `resaurce:`) binds the message to that service’s Cave in the RobotCopy registry (not local path-only resolution).
- **Resolution order** (RobotCopy): (1) if `serviceName` present → registry → remote Cave; (2) else if local Tome defines path → local CaveRobit; (3) else typed error `UNKNOWN_ROUTE` / `SERVICE_NOT_REGISTERED`.

## Message envelope (v2)

JSON fields:

| Field | Description |
|--------|-------------|
| `schema_version` | `"2.0"` |
| `route` | Full route string including optional prefix |
| `payload` | Object body |
| `trace_id` | Correlation ID |
| `causation_id` | Optional upstream id |
| `presence` | Opaque presence handle / token |
| `reply_mode` | `sync_http` \| `async_queue` \| `async_poll_token` |
| `reply_to` | Optional callback route or queue name |
| `tome_semver` | Optional Tome bundle version |
| `tenant` | Optional tenant id |

## LVM2.0 lifecycle (tax example)

Python helpers emit structured events with `schema: lvm2.0` and types such as `TaxDocumentJobQueued`, `TaxDocumentJobRunning`, `TaxDocumentJobCompleted`, `TaxDocumentJobFailed`. Events append via Cave `POST /lvm/append` when `CAVE_BASE_URL` is set.

## Cave wire (mock reference)

- `POST {CAVE_BASE_URL}/cave/route` — body: envelope JSON.
- `POST {CAVE_BASE_URL}/lvm/append` — body: `{ "trace_id", "events": [...] }`.
- `GET {CAVE_BASE_URL}/cave/poll?handle=...` — optional async poll.

See `scripts/mock_cave_server.py` in this repository.

## Anti-patterns

Unstructured topics; SQL or filesystem paths embedded in routes; Tome transitions without corresponding LVM append for the same `trace_id` (on Cave server side).

## XState ViewStateMachine alignment (LVM, Cave, tooling)

LogViewMachine `ViewStateMachine` charts use **XState `xstateConfig`** for states and transitions. Domain **orchestration** (when to call Cave, how to react) can live in **`withState` / `logStates` handlers** alongside `context.log` for structured metadata.

### Naming and layers

| Layer | Purpose |
|--------|--------|
| **Tome YAML** (`transitions[].on`, `lvm_events`) | Human-facing transition names and LVM event types for documentation and parity checks. |
| **XState** | `states` / `on` keys should **reuse the same transition words** as the Tome where practical (e.g. resaurce HR help: `request`, `chat_created`). |
| **Cave** | `POST /cave/route` envelope `route` (e.g. `resaurce:hr/help/request`, `saurce:wallet/hold/apply`) is authoritative for side effects. |
| **ClientGenerator** | `discover()` reads real `xstateConfig` states/events plus registered `withState` keys from each `ViewStateMachine`. |

### `trace_id` (required on Cave calls from handlers)

Every `withState` / `logStates` path that performs a Cave HTTP call MUST:

1. Generate or forward a **`trace_id`** on the envelope (`schema_version` `2.0`, `route`, `payload`, `trace_id`, optional `tenant`, `presence`, `reply_mode`).
2. Include the same **`trace_id`** on `context.log(..., metadata)` entries for that step so logs, Cave, and optional CaveDB snapshots correlate.

Editor pilot tomes (`resaurce-hr-pilot-tome`, `saurce-wallet-pilot-tome`) in `log-view-machine` `mod/node-mod-editor` follow this pattern; CaveDB snapshot keys use `snapshot:<machineId>:<trace_id>`.

### Persistence boundaries

- **Inventory Kotlin H2** and **resaurce/saurce in-memory stores** are separate systems of record from **editor CaveDB** (DuckDB-backed adapter per Tome via `persistence` on `TomeConfig` and `CAVE_DB_DIR`).
- **ViewStateMachine** may use a **CaveDBAdapter** as `db` for `find`/`findOne` (and `put` in handlers); RxDB remains optional in the browser.

## Node Cave XState routing (saurce / resaurce)

`saurce` and `resaurce` dispatch `POST /cave/route` through an **XState interpreter** per bounded context: one chart per `machineId`, initial state `idle`, event `ROUTE` carrying the Cave handler context (`structural`, `route`, `payload`, `traceId`, `tenant`). The domain’s existing handler runs in an `assign` action; response shape is unchanged for clients and pact tests.

| Service | Structural prefix | `machineId` |
|--------|-------------------|-------------|
| saurce | `wallet/` | `saurce:walletLedger` |
| saurce | `investment/` | `saurce:investmentPolicy` |
| saurce | `commerce/` | `saurce:commerceWallet` |
| saurce | `crypto/` | `saurce:cryptoPortfolio` |
| saurce | `review/` | `saurce:reviewQueue` |
| resaurce | `hr/` | `resaurce:hrHelp` |
| resaurce | `tax/` | `resaurce:taxDocuments` |
| resaurce | `legal/` | `resaurce:legalDocument` |
| resaurce | `presence/` | `resaurce:presence` |

**LVM2 CLI / tooling:** Static manifests live at `contracts/lvm2/saurce-machines.json` and `contracts/lvm2/resaurce-machines.json`. **Discovery:** `GET /lvm2/discover` on each Cave host returns the same JSON. **Log-view-machine** `ClientGenerator.ingestNodeCaveManifest()` plus `parseNodeCaveMachineManifest()` merge those routes into `discover().nodeCaveMachines` and the generated markdown documentation.

**Investment numeric checks:** `investment/mode/enable` anti-collateral validation uses `inventory/backend/python-apis/wallet-ledger/wallet_math.py` (Decimal) when the script is reachable (`SAURCE_WALLET_MATH_SCRIPT` or sibling `inventory/...` path from the saurce install); otherwise the prior floating-point check is used as a fallback.

### Domain Tomes and structural routes (Node LVM hooks)

Domain YAML under `resaurce/tomes/**` and `saurce/tomes/**` may declare `structural_routes` on each `transitions[]` entry. `domainTomeLoader` indexes those paths so `getLvmEventNamesForStructuralRoute` stays aligned with Cave mutating routes without a hand-maintained `if` chain.

### CaveDB and `withState` / `logStates`

When orchestration needs idempotent snapshots or cross-request reads, inject a **CaveDBAdapter** on the ViewStateMachine (`ctx.db`) and use **`find` / `findOne` before `put`** with a stable document key (e.g. `snapshot:<machineId>:<trace_id>`). Node Cave in-memory stores remain separate from CaveDB unless explicitly bridged.

### Publishable adapters (inventory packages)

- **`@inventory/cave-federation-host`** — default `fetch` Cave client (`createStructuralCaveClient`) and `readFederationFromUiTome` for UI Tome JSON.
- **`@inventory/cave-pilot-configs`** — shared `createTomeConfig` pilots for resaurce HR and saurce wallet (consumed by log-view-machine `node-mod-editor`).

