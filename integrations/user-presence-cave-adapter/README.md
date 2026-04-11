# user-presence-cave-adapter — multi-repo rollout

Inventory ships the reference implementation under:

- `frontend/src/adapters/userPresenceCaveAdapter.ts`
- `frontend/src/services/resaurceClient.ts`

## Configure in each app

| Repository | Action |
|------------|--------|
| **john-holland/inventory** | Set `REACT_APP_CAVE_BASE_URL`; import adapter before HR / sensitive routes. |
| **john-holland/continuuuum** | Copy adapter pattern; call `resaurce:presence/verify` via shared Cave client. |
| **john-holland/unified-semantic-compressor** | Same; inject presence header on outbound jobs. |
| **john-holland/saurce** | Same. |
| **john-holland/resaurce** | Host CaveRobit for `presence/verify` and issue tokens. |

## Environment

- `REACT_APP_CAVE_BASE_URL` — browser → Cave (inventory frontend).
- `CAVE_BASE_URL` — Python workers (`log_view_machine.cave_client`).
