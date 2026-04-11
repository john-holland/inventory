# Cave–Tome–LVM specification (structural routing and message passing)

Normative for john-holland/inventory, john-holland/resaurce, john-holland/log-view-machine (Python package in this repo until split), and coordinated adapters.

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
