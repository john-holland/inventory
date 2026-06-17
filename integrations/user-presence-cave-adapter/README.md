# user-presence-cave-adapter — multi-repo rollout

Inventory ships the reference implementation under:

- `frontend/src/adapters/userPresenceCaveAdapter.ts`
- `frontend/src/services/resaurceClient.ts`

## Configure in each app

| Repository | Action |
|------------|--------|
| **john-holland/inventory** | Set `REACT_APP_SOA_RES_AURCE_URL` (or legacy `REACT_APP_CAVE_BASE_URL`); optional `REACT_APP_SOA_SAURCE_URL`. Import adapter before HR / sensitive routes. |
| **john-holland/continuuuum** | Copy adapter pattern; call `resaurce:presence/verify` via shared Cave client. |
| **john-holland/unified-semantic-compressor** | Same; inject presence header on outbound jobs. |
| **john-holland/saurce** | Same. |
| **john-holland/resaurce** | Host CaveRobit for `presence/verify` and issue tokens. |

## Environment

- `REACT_APP_SOA_RES_AURCE_URL` — resaurce Cave base URL (browser).
- `REACT_APP_SOA_SAURCE_URL` — saurce Cave base URL (browser).
- `REACT_APP_CAVE_BASE_URL` — legacy fallback mapped to **resaurce** when `REACT_APP_SOA_RES_AURCE_URL` is unset.
- `SOA_REGISTRY_PATH` — optional JSON registry for Python ([docs/soa-registry.example.json](../../docs/soa-registry.example.json)).
- `CAVE_BASE_URL` — Python legacy single Cave URL (treated as resaurce if `SOA_RES_AURCE_URL` unset).
- `REACT_APP_SAURCE_BRIDGE_ENABLED` — set to `true` to let Wallet/Investment call saurce when `REACT_APP_SOA_SAURCE_URL` is set (optional).

