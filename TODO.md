# TODO - sendctl Implementation

## Completed
- [x] Create package structure at packages/sendctl/
- [x] Implement types.ts with CheckStatus, CheckResult, DoctorResult, SingleCheckResult
- [x] Implement config.ts for environment configuration
- [x] Implement service checks (next, supabase, anvil, bundler, shovel, temporal)
- [x] Implement doctor command
- [x] Implement check command
- [x] Implement output formatting (human/JSON)
- [x] Create CLI entry point and bin shim
- [x] Add sendctl script to root package.json
- [x] Install dependencies and verify TypeScript compiles
- [x] Start localnet via Tilt
- [x] Verify sendctl doctor passes
- [x] Verify sendctl check anvil passes

## In Progress
- [ ] Commit implementation

## Pending
None

## Blocked
None

## Notes
- Chain ID for localnet is 845337 (0xce619), not 84532 (0x14a34) as originally specified
- SHOVEL_URL can be constructed from SHOVEL_PORT if not explicitly set
- NEXT_PUBLIC_BUNDLER_RPC_URL already includes /rpc path, so don't append it
- Factory funding check made informational-only (doesn't fail check) since factory contract doesn't need ETH directly
