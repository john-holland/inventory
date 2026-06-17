# Cross-service Cave integration

**Pact provider verification** and the Cave HTTP hosts for **resaurce** and **saurce** now live in the **sibling repositories** next to inventory:

| Service   | Path (sibling)     | Verify |
|-----------|--------------------|--------|
| resaurce  | `../resaurce`      | `cd ../resaurce && npm install && npm run verify:pact` |
| saurce    | `../saurce`        | `cd ../saurce && npm install && npm run verify:pact`   |

## Consumer pacts (inventory)

Generate or refresh pact JSON from the inventory frontend:

```bash
cd frontend && npm run pact:cross-cave
```

Copy updated JSON + envelope schema into siblings:

```bash
./scripts/sync-cave-contracts-to-siblings.sh
```

Discovery env for hybrid 1C is documented in [packages/cave-contracts/README.md](../packages/cave-contracts/README.md).
