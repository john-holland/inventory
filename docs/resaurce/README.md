# resaurce Cave (reference layout for john-holland/resaurce)

This repository hosts **reference artifacts** until `john-holland/resaurce` is checked out alongside inventory.

## Contents

- `tomes/hr/v1/help.yaml` — example Tome fragment for HR help (states / transitions placeholders).
- Wire protocol: see `docs/cave-tome-lvm/SPEC.md` and `scripts/mock_cave_server.py`.

## RobotCopy registry (conceptual)

| serviceName | Cave base URL env |
|-------------|-------------------|
| resaurce    | `REACT_APP_CAVE_BASE_URL` / `CAVE_BASE_URL` |
| inventory   | future inventory Cave |

Implement the authoritative Cave process, Tomes, and CaveRobits in the **resaurce** repo; inventory only ships adapters and this reference.

