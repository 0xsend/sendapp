# sendctl - Send App Environment Toolkit

## When to Use
Use sendctl when you need to:
- Verify the development environment is healthy
- Debug service connectivity issues
- Check if specific services are running
- Prepare environment before running tests

## Commands

### Check all services
```bash
sendctl doctor
sendctl doctor --json  # Machine-readable output
```

### Check specific service
```bash
sendctl check next
sendctl check anvil
sendctl check supabase
```

### Wait for services to be ready
```bash
sendctl doctor --wait --max-retries=30
```

## Common Issues

### All services failing
- Tilt may not be running: `tilt up`
- Wrong environment: Check NEXT_PUBLIC_* env vars

### Anvil failing
- Restart anvil: `tilt trigger anvil:base-node`
- Check if forking: Anvil forks from mainnet, network issues can cause failures

### Supabase failing
- Restart: `cd supabase && yarn supabase stop && yarn supabase start`
- Reset DB: `cd supabase && yarn supabase reset`

## Environment Variables
Services are configured via standard Send App env vars:
- NEXT_PUBLIC_URL (Next.js app)
- NEXT_PUBLIC_SUPABASE_URL (Supabase API)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (required for Supabase auth)
- NEXT_PUBLIC_BASE_RPC_URL (Anvil RPC)
- NEXT_PUBLIC_BUNDLER_RPC_URL (AA Bundler)
- SHOVEL_URL (Shovel indexer)
- TEMPORAL_ADDR (Temporal gRPC, host:port format)
- SENDCTL_TIMEOUT (optional, default 10000ms)
