# SOA Cave smoke (inventory mock)

## Sibling Cave hosts (authoritative dev)

Repos next to inventory: `../resaurce` (default port **3456**) and `../saurce` (default port **3457**).

```bash
(cd ../resaurce && npm install && npm start) &
(cd ../saurce && npm install && npm start) &
export REACT_APP_SOA_RES_AURCE_URL=http://127.0.0.1:3456
export REACT_APP_SOA_SAURCE_URL=http://127.0.0.1:3457
export REACT_APP_SAURCE_BRIDGE_ENABLED=true
```

Re-sync vendored Pact + envelope schema into siblings after inventory contract changes:

```bash
./scripts/sync-cave-contracts-to-siblings.sh
```

---

1. Start the mock Cave (one process can stand in for both logical services in dev):

   ```bash
   export CAVE_LISTEN_PORT=8765
   python3 scripts/mock_cave_server.py
   ```

2. Point both services at the same origin (or run a second listener on 8766 for saurce):

   ```bash
   export REACT_APP_SOA_RES_AURCE_URL=http://127.0.0.1:8765
   export REACT_APP_SOA_SAURCE_URL=http://127.0.0.1:8765
   ```

3. Optional: merge commerce/crypto into UI reads:

   ```bash
   export REACT_APP_SAURCE_BRIDGE_ENABLED=true
   ```

4. Curl checks:

   ```bash
   curl -sS -X POST http://127.0.0.1:8765/cave/route \
     -H 'Content-Type: application/json' \
     -d '{"schema_version":"2.0","route":"resaurce:hr/help/request","payload":{},"trace_id":"t1","reply_mode":"sync_http"}' | jq .

   curl -sS -X POST http://127.0.0.1:8765/cave/route \
     -H 'Content-Type: application/json' \
     -d '{"schema_version":"2.0","route":"saurce:crypto/portfolio/snapshot","payload":{"user_id":"u1"},"trace_id":"t2","reply_mode":"sync_http"}' | jq .
   ```

Authoritative Cave hosts run in sibling checkouts **resaurce** and **saurce** (see above). The mock below is for **inventory-only** development without those processes.
