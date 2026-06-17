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
| `route` | Full route string including optional prefix (**optional when `message` present**) |
| `message` | Logical message name; serving Cave resolves via `cave.manifest.yaml` |
| `payload` | Object body |
| `trace_id` | Correlation ID |
| `causation_id` | Optional upstream id |
| `causality_path` | Hop chain appended by each Cave (loop detection) |
| `presence` | Opaque presence handle / token |
| `reply_mode` | `sync_http` \| `async_queue` \| `async_poll_token` |
| `reply_to` | Optional callback route or queue name |
| `tome_semver` | Optional Tome bundle version |
| `tenant` | Optional tenant id |
| `trace_loop` | Optional `{ prevent?: boolean }` override |

**Client rule:** inventory browser app code sends **`message`** via **RobotCopy** (`robotCopyRuntime.sendMessage` / `executeFlow`). Transport adapters (`cave-adapter-ts`, BFF proxy) forward envelopes without resolving routes.

## Cave manifest (`cave.manifest.yaml`)

Each Cave host owns one authoritative manifest served at `GET /cave/manifest`:

| Section | Purpose |
|---------|---------|
| `messages` | Root logical message → relative or explicit route |
| `tomes.*.messages` | Per-Tome overrides |
| `cave.structural.*.messages` | Structural pattern overrides |
| `lvm.machines` | XState interpreter metadata |
| `lvm.multicast` | Server-orchestrated fan-out (not client routing tables) |
| `encapsulation.allowed_routes` | Server-side route allowlist |
| `trace_loop` | `detect: true`, **`prevent: true`** default |

Static federation (Module Federation remotes only) is served at `GET /tome/{service}-frontend` and optional `GET /cave/federation` — **no messages, machines, or routing tables**.

## Location-invariant routing

The **shape** of `cave.manifest.yaml` is identical across cloud placements (messages, tomes, lvm, trace_loop, robotcopy). The SOA registry supplies **base URLs only** (`REACT_APP_SOA_*_URL`, `SOA_REGISTRY_PATH`); it must **not** embed routing tables, message maps, or machine metadata.

**Enforcement (inventory browser):** `validateLocationInvariantRegistry()` in [soaRegistry.ts](../frontend/src/services/soaRegistry.ts) rejects registry objects that contain `messages`, `routes`, `machines`, etc., or URL values with non-empty paths. With `REACT_APP_SOA_STRICT_MODE=true`, invalid registries throw at startup check via `assertLocationInvariantEnvRegistry()`.

Clients resolve logical **`message`** names only through RobotCopy; the serving Cave host resolves routes from its manifest.

## Trace loop guard

On every `POST /cave/route`, before delegation and dispatch:

1. Append hop to `causality_path`
2. Detect cycles (`CAUSAL_LOOP_DETECTED` when `prevent: true`, default)
3. `trace_heartbeat` / `presence_verify` exempt per manifest `trace_loop.heartbeat`

Multicast and cross-Cave outbound legs forward the same `trace_id` and accumulated `causality_path`.

## Inventory UI availability (CaveFeatureGate)

Cave-dependent UI uses `useCaveShell` + `CaveFeatureGate` with a required **`surface`** id (e.g. `commerce_wallet`, `tax_documents`, `investment`):

- **`initialModel`** — optional `Record<string, unknown>` passed to `useTomeSurface` / `machine.useViewStateMachine` so surfaces receive context (`itemId`, `tenantId`, `userId`) without page-level service calls.
- **`surfaceTransitions`** — per-surface XState extras merged in `getSurfaceChartExtras` (e.g. `ready` → `submitting` on `SUBMIT_REVIEW`, `GENERATE` → `generating` for document surfaces).

| State | UI |
|-------|-----|
| unset | Info alert — configure `REACT_APP_SOA_*_URL` |
| loading | `CircularProgress` placeholder |
| error | Error alert + retry |
| ready | LVM **`withState`** view stack via `useTomeSurface` / `@inventory/cave-ui-lvm` |

No local domain mocks in production paths. Optional `REACT_APP_CAVE_DEV_FALLBACK=true` enables legacy mock data for Jest/integration only.

RobotCopy flow definitions load from `GET /cave/manifest` → `robotcopy.flows` (not static federation JSON).

## State middleware and withState (browser LVM)

**Separation:** middleware runs **before** `withState` handlers on every state entry; handlers return views only via `ctx.view(...)`.

| Layer | Responsibility |
|-------|----------------|
| **State middleware** | `trace`, `presence`, `delegation`, `robotCopy`, `caveDbSnapshot`, `log`; optional **capsule** catchall for sub-machines |
| **withState handler** | Read model; `ctx.view(<StatelessView />)`; user events via `ctx.send` only |
| **React page shell** | `CaveFeatureGate` + `{machine.viewStack}` — **no large `switch (state)`** |

**Static analysis index:** `cave-cli tome index` emits `{ states, views, messages }`; `ClientGenerator.ingestTomeModuleIndex()` merges with live `getRegisteredStateHandlerNames()` from each `ViewStateMachine`.

**Browser entry:** import from `log-view-machine/browser` (no Express). IndexedDB CaveDB via `@inventory/cave-ui-lvm` `createBrowserCaveDb`.

**Exceptions (narrow):** event pattern match inside one handler; singular `surfaceTemplate()` when all states share chrome.

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

**LVM2 CLI / tooling:** Machine metadata is authoritative in each host's `cave.manifest.yaml` (`lvm.machines`). **Discovery:** `GET /lvm2/discover` projects from the manifest. **Log-view-machine** `ClientGenerator.ingestCaveManifest()` merges manifest messages/machines into tooling docs; `ingestStaticFederationSlice()` is UI federation only.

**Investment numeric checks:** `investment/mode/enable` anti-collateral validation uses `inventory/backend/python-apis/wallet-ledger/wallet_math.py` (Decimal) when the script is reachable (`SAURCE_WALLET_MATH_SCRIPT` or sibling `inventory/...` path from the saurce install); otherwise the prior floating-point check is used as a fallback.

### Domain Tomes and structural routes (Node LVM hooks)

Domain YAML under `resaurce/tomes/**` and `saurce/tomes/**` may declare `structural_routes` on each `transitions[]` entry. `domainTomeLoader` indexes those paths so `getLvmEventNamesForStructuralRoute` stays aligned with Cave mutating routes without a hand-maintained `if` chain.

### Shared service CaveDB (browser)

All LVM surfaces on the same SOA service share one IndexedDB namespace via `getServiceCaveDb(service)` (`@inventory/cave-ui-lvm`). The tome id is `{service}-inventory-ui` (e.g. `saurce-inventory-ui`). Keys include `presence:token`, `pending:<machineId>:<trace_id>`, and `snapshot:<machineId>:<trace_id>`. Surfaces such as `cabin_session` and `review_cabin` on saurce read/write the same store so presence defer and middleware snapshots stay consistent across pages.

### Hybrid surfaces and sub-machines

When one product area needs both a full page flow and a separate CSR/admin surface, split **surfaces** instead of sharing one view map:

| Surface | Page | Machine |
|---------|------|---------|
| `cabin_session` | CabinPage | `inventory:cabinSessionUi` + sub-machine `createWizard` |
| `review_cabin` | CSRDashboard | `inventory:reviewCabinUi` |
| `commerce_wallet` | PartnerDashboard | `inventory:partnerWalletUi` |
| `investment` | ItemDetailsPage | `inventory:investmentUi` (`initialModel.itemId`) |
| `tax_documents` | DocumentsPage | `inventory:taxDocumentsUi` |
| `legal_review` | DocumentsPage | `inventory:legalReviewUi` |
| `inventory_reports` | DocumentsPage | `inventory:inventoryReportsUi` |
| `sales_reports` | DocumentsPage | `inventory:salesReportsUi` |
| `hr_help` | DocumentsPage (dialog) | `inventory:hrHelpUi` (`initialModel.tenantId`, `userId`) |

DocumentsPage is a **multi-surface thin shell**: four grid `CaveFeatureGate` cells plus an HR dialog gate. Each document category owns list/generate UI in its Ready view; `loading.on_enter` fires the list message (not `idle`).

Parent state `wizardActive` on `cabin_session` uses capsule `subMachineRouter` to delegate to the `createWizard` sub-machine. Cross-surface Cave messages use the same manifest delegation map and shared service CaveDB.

### CaveDB and `withState` / `logStates`

When orchestration needs idempotent snapshots or cross-request reads, inject a **CaveDBAdapter** on the ViewStateMachine (`ctx.db`) and use **`find` / `findOne` before `put`** with a stable document key (e.g. `snapshot:<machineId>:<trace_id>`). Node Cave in-memory stores remain separate from CaveDB unless explicitly bridged.

### Publishable adapters (inventory packages)

- **`@inventory/cave-federation-host`** — static federation slice reader (`fetchStaticFederationSlice`, `readFederationFromUiTome`). `createStructuralCaveClient.caveRoute` is **deprecated**; use RobotCopy.
- **`@inventory/cave-pilot-configs`** — pilots send **message-first** envelopes (`request_hr_help`, `wallet_hold_apply`).
- **`frontend/src/cave/robotCopyRuntime.ts`** — sole public Cave API for inventory browser.

