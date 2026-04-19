# @inventory/cave-federation-host

- **`createStructuralCaveClient(options)`** — default `fetch` implementation for `POST …/cave/route` (envelope v2).
- **`readFederationFromUiTome(tome)`** — reads optional `federation.remote_entry_path` from resaurce/saurce UI Tome JSON.

Use from SPAs or inventory frontend instead of duplicating envelope assembly. For full Cave → Tome → LVM orchestration in the browser, combine with `log-view-machine` `createTome` / `createTomeConfig`.
