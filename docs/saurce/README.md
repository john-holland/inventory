# saurce Cave (reference for john-holland/saurce)

Authoritative **commerce** and **crypto / high-yield savings portfolio** Cave host lives in the sibling checkout **`../saurce`** (Node/Express), using the same **Cave → Tome → LVM2** stack as resaurce.

## Example routes (inventory callers)

| Route | Purpose |
|-------|---------|
| `saurce:wallet/balance` | Legacy probe (pact); prefer commerce route |
| `saurce:wallet/list` / `wallet/get` / `wallet/transactions/list` | Authoritative wallet ledger |
| `saurce:wallet/hold/apply` | Post holds with **inventory-computed** line amounts (shipping math stays in inventory) |
| `saurce:commerce/wallet/balance` | Wallet balance probe |
| `saurce:crypto/portfolio/snapshot` | Portfolio snapshot for UI |
| `saurce:investment/eligibility/evaluate` | Hold-type eligibility |
| `saurce:investment/mode/enable` | Risky mode + anti-collateral debit on ledger |
| `saurce:review/cabin/submit`, `review/queue/list`, `review/ticket/create` | Cabin review pipeline |

**UI Tome:** `GET {saurceBase}/tome/saurce-frontend` — authoritative YAML in sibling `../saurce/tomes/saurce-frontend/v1/module.yaml`. Inventory loads it via [frontend/src/cave/saurceInventoryCave.ts](../../frontend/src/cave/saurceInventoryCave.ts) and [frontend/src/services/saurceUiTome.ts](../../frontend/src/services/saurceUiTome.ts).

Wire protocol: [docs/cave-tome-lvm/SPEC.md](../cave-tome-lvm/SPEC.md).

## Client configuration (inventory)

- Browser: `REACT_APP_SOA_SAURCE_URL`
- Python workers: `SOA_SAURCE_URL` or `SOA_REGISTRY_PATH` JSON `contexts.*.saurce`
- Kotlin BFF: `soa.saurce-url` — server-side client [SaurceCaveClient.kt](../../backend/src/main/kotlin/com/inventory/api/service/SaurceCaveClient.kt) (inject where a flow needs wallet or portfolio facts).

**Saurce service flags** (sibling repo): `SAURCE_CORS_ORIGINS`, `SAURCE_ENFORCE_ALLOWED_ROUTES=1`, `SAURCE_DEV_MOCK_USER=1`, `LVM_FORWARD_URL` for `POST /lvm/append` forwarding.

Local dev may point both resaurce and saurce at the same mock listener if only one process is running.

## Optional UI bridge

When `REACT_APP_SAURCE_BRIDGE_ENABLED=true`, [WalletService](../../frontend/src/services/WalletService.ts) may still prefer remote **commerce** balance probes; when `REACT_APP_SOA_SAURCE_URL` is set, the wallet **ledger** (list / transactions / hold apply) and [InvestmentService](../../frontend/src/services/InvestmentService.ts) / [ReviewService](../../frontend/src/services/ReviewService.ts) delegate to saurce per [saurceBridge.ts](../../frontend/src/services/saurceBridge.ts).

Run `../saurce` (`npm start`, `npm run test:smoke`, `npm run verify:pact`); sync contracts from inventory repo root: `./scripts/sync-cave-contracts-to-siblings.sh`.

## resaurce → saurce (narrow)

For HR/legal flows that need a commerce fact, the resaurce repo may use [saurceOutbound.js](../../../resaurce/src/saurce/saurceOutbound.js) with `SOA_SAURCE_URL` / `RESAURCE_SAURCE_URL`. Avoid generic coupling; pass `trace_id` / `tenant` on envelopes. See [docs/resaurce/README.md](../resaurce/README.md#narrow-resaurce--saurce-calls).
