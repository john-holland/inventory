# resaurce Cave (reference layout for john-holland/resaurce)

**Authoritative Cave process** lives in the sibling checkout **`../resaurce`** (Node/Express). This folder keeps **reference artifacts** and pointers for the inventory monorepo.

## Contents

- `tomes/hr/v1/help.yaml` — example Tome fragment for HR help (states / transitions placeholders).
- **UI Tome** (authoritative in sibling `../resaurce`): `tomes/resaurce-frontend/v1/module.yaml` — served as JSON at `GET {resaurceBase}/tome/resaurce-frontend`. Inventory loads it via [frontend/src/services/resaurceUiTome.ts](../../frontend/src/services/resaurceUiTome.ts) for embedded SaaS UI shells.
- Wire protocol: see `docs/cave-tome-lvm/SPEC.md` and `scripts/mock_cave_server.py`.

## RobotCopy registry (conceptual)

| serviceName | Owns (Cave / Tome / LVM2) | Cave base URL (inventory client) |
|---------------|---------------------------|-------------------------------------|
| resaurce      | HR + tax + legal          | `REACT_APP_SOA_RES_AURCE_URL` or legacy `REACT_APP_CAVE_BASE_URL` / `SOA_RES_AURCE_URL` or `CAVE_BASE_URL` |
| saurce        | Commerce + crypto portfolio | `REACT_APP_SOA_SAURCE_URL` / `SOA_SAURCE_URL` |
| inventory     | Tax / document jobs (Python) | `REACT_APP_SOA_INVENTORY_URL` / `SOA_INVENTORY_URL` (optional future Cave) |

See [docs/soa-registry.example.json](../soa-registry.example.json), [docs/soa-registry.example.yaml](../soa-registry.example.yaml), [scripts/SMOKE_SOA.md](../../scripts/SMOKE_SOA.md), and [docs/saurce/README.md](../saurce/README.md).

Kotlin BFF (inventory API) reads the same settings via `soa.*` in [application.properties](../../backend/src/main/resources/application.properties) and [SoaProperties.kt](../../backend/src/main/kotlin/com/inventory/api/config/SoaProperties.kt).

Run `../resaurce` locally (`npm start`); sync contracts with inventory `./scripts/sync-cave-contracts-to-siblings.sh`. Inventory ships thin clients ([frontend/src/services/resaurceClient.ts](../../frontend/src/services/resaurceClient.ts)), HR Cave bridge ([frontend/src/services/hrResaurceBridge.ts](../../frontend/src/services/hrResaurceBridge.ts)), UI Tome fetch ([frontend/src/services/resaurceUiTome.ts](../../frontend/src/services/resaurceUiTome.ts)), and this reference doc.

### SaaS module (inventory host)

1. Configure `REACT_APP_SOA_RES_AURCE_URL` to the tenant’s resaurce Cave base URL.
2. At runtime, call `fetchResaurceFrontendTome()` to read surfaces and `allowed_routes`, then mount your micro-frontend (iframe, federation, or web component) that **only** calls `POST /cave/route` with envelope v2 (same as [resaurceClient.sendCaveRoute](../../frontend/src/services/resaurceClient.ts)).
3. Pass `tenant` / auth from the host into envelopes per SPEC. Optional: enable strict SOA mode so missing Cave fails fast.

### Resaurce HR: RobotCopy + Module Federation (Documents)

| Variable | Purpose |
|----------|---------|
| `REACT_APP_RESAURCE_HR_REMOTE` | Set to `true` to compile in the `resaurce_hr` remote and enable the HR workspace dialog on [DocumentsPage](../../frontend/src/components/DocumentsPage.tsx). |
| `REACT_APP_RESAURCE_REMOTE_ENTRY` | Full URL of `remoteEntry.js` (default in dev: `http://127.0.0.1:3456/remote/remoteEntry.js`). Must match where `npm run build:hr-remote` is served in resaurce. |
| `REACT_APP_SOA_TENANT` | Optional tenant id forwarded on Cave envelopes. |
| `REACT_APP_INVENTORY_USER_ID` | Optional display user id passed into the remote (placeholder until auth context is wired). |

When `REACT_APP_RESAURCE_HR_REMOTE` is `true` **and** resaurce is configured in the SOA registry, **Get HR Help** on Documents opens only the Resaurce-backed workspace ([loadResaurceInventoryCave](../../frontend/src/cave/resaurceInventoryCave.ts) + RobotCopy + federated UI). Otherwise the legacy in-app HR dialog remains available.

### Tax documents on Documents

When resaurce is configured, [DocumentsPage](../../frontend/src/components/DocumentsPage.tsx) loads the tax catalog via RobotCopy flow `tax_documents_list` and generates with `tax_generate_enqueue` (see UI Tome on resaurce). Legal / inventory / sales rows still use local mocks until those domains move.

The Kotlin BFF `POST /api/documents/tax/generate` calls resaurce Cave when `soa.resaurce-url` is set and completes the job in-process so existing status/download endpoints keep working; if resaurce is unreachable it falls back to the Python worker queue.

Standalone resaurce dev can use `RESAURCE_DEV_MOCK_USER=1` so envelopes without host identity still work; see the sibling [resaurce README](../../../resaurce/README.md).

### Narrow resaurce → saurce calls

Use only when an HR or legal handler truly needs a commerce or portfolio fact (for example enriching a legal review with “wallet exposure”). The sibling helper [saurceOutbound.js](../../../resaurce/src/saurce/saurceOutbound.js) POSTs envelope v2 to `SOA_SAURCE_URL` (or `RESAURCE_SAURCE_URL`). Do **not** proxy all saurce traffic through resaurce.

