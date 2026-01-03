# TODO - Test Localnet Compose Flow

## Completed
- [x] Verify compose.localnet.yaml config is valid (iteration 1)
- [x] Check .localnet.env has required variables (iteration 1)
- [x] Fix anvil entrypoint - foundry image uses /bin/sh -c which requires explicit entrypoint override (iteration 1)
- [x] Fix ANVIL_BASE_INTERNAL_PORT - use fixed port 8547 instead of dynamic allocation (iteration 2)
- [x] Fix submodules - properly initialized openzeppelin-contracts-upgradeable and p256-verifier (iteration 2)
- [x] Verify yarn:install passes in Tilt (iteration 2)
- [x] Verify anvil starts and is healthy on internal port 8547
- [x] Verify nginx proxy starts and is healthy
- [x] Verify RPC calls through proxy work (cast bn returns block number)
- [x] Verify bundler connects through proxy (connects to http://anvil-proxy:80)

## Blocked
- [ ] Full Tilt integration - supabase migration fails with null value error in distribution_verification_values table (pre-existing issue)
- [ ] Shovel indexing - requires database to be running
- [ ] Bundler full startup - requires paymaster deposit fixtures (fails on insufficient funds)

## Notes
- ANVIL_BASE_PORT=49667 (external, via nginx proxy)
- ANVIL_BASE_INTERNAL_PORT=8547 (fixed, internal to Docker network)
- BUNDLER_PORT=49668
- SHOVEL_PORT=49669
- WORKSPACE_NAME=sendapp-bb-dev

### Fixes Applied (Iteration 2)

#### Fix 1: Dynamic ANVIL_BASE_INTERNAL_PORT
**Problem**: `ANVIL_BASE_INTERNAL_PORT` was dynamically allocated but nginx.localnet.conf has `server anvil-base:8547` hardcoded.

**Solution**: Use fixed port 8547 for internal anvil communication since:
- It's only used within the Docker network (no host conflicts)
- nginx.conf doesn't support environment variable substitution natively
- Simplifies configuration

#### Fix 2: Submodule Initialization
**Problem**: Submodules `openzeppelin-contracts-upgradeable` and `p256-verifier` were not properly initialized, causing yarn:install to fail.

**Solution**: Manually fetched and checked out the correct commits:
- `openzeppelin-contracts-upgradeable`: fbdb824a735891908d5588b28e0da5852d7ed7ba
- `p256-verifier`: 5f96fa28cbf725cb4195ec5798589f23cc129d68

### Verification Results
The nginx proxy + Docker Compose solution works correctly:
- Anvil receives correct command arguments (host, port, chain-id, fork-url, etc.)
- Nginx proxy provides connection pooling (keepalive 32)
- RPC calls through proxy succeed
- Bundler and other services can connect through the proxy

The blocking issues (supabase migration, unfunded bundler) are pre-existing problems unrelated to the localnet compose changes.
