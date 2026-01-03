# TODO - Test Localnet Compose Flow

## Completed
- [x] Verify compose.localnet.yaml config is valid (iteration 1)
- [x] Check .localnet.env has required variables (iteration 1)
- [x] Fix anvil entrypoint - foundry image uses /bin/sh -c which requires explicit entrypoint override (iteration 1)
- [x] Verify anvil starts and is healthy on internal port 8547
- [x] Verify nginx proxy starts and is healthy
- [x] Verify RPC calls through proxy work (cast bn returns block 8)
- [x] Verify bundler connects through proxy (failed on insufficient funds, not connection)

## In Progress
- [ ] Commit compose.localnet.yaml fix

## Blocked
- [ ] Full Tilt integration - supabase migration fails with null value error in distribution_verification_values table (pre-existing issue)
- [ ] Shovel indexing - requires database to be running
- [ ] Bundler full startup - requires paymaster deposit fixtures

## Notes
- ANVIL_BASE_PORT=49667
- BUNDLER_PORT=49668
- SHOVEL_PORT=49669
- ANVIL_BASE_INTERNAL_PORT=8547
- WORKSPACE_NAME=sendapp-bb-dev

### Key Fix Applied
The foundry image (`ghcr.io/foundry-rs/foundry:stable`) has entrypoint `/bin/sh -c` which doesn't work correctly with Docker Compose's `command` when using YAML block scalar (`>`).

Fixed by:
1. Adding `entrypoint: ["anvil"]` to override the image entrypoint
2. Using array syntax for command arguments

### Verification Results
The nginx proxy + Docker Compose solution works correctly:
- Anvil receives correct command arguments (host, port, chain-id, fork-url, etc.)
- Nginx proxy provides connection pooling (keepalive 32)
- RPC calls through proxy succeed
- Bundler and other services can connect through the proxy

The blocking issues (supabase migration, unfunded bundler) are pre-existing problems unrelated to the localnet compose changes.
