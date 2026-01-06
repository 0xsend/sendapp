# sendctl - Send App Development Toolkit

## Overview

A TypeScript CLI toolkit for working with Send App services. Provides environment health checks and developer workflow automation.

## Design Principles

1. **Environment Agnostic** - No knowledge of Tilt, .localnet.env, or deployment tooling
2. **Direct Service Checks** - Query services via HTTP/RPC, not orchestration APIs
3. **Fail Fast** - Quick feedback with clear, actionable errors
4. **Machine & Human Friendly** - Human-readable by default, JSON for automation

## Commands

### `sendctl doctor`

Validates all Send App services are running and healthy.

```bash
# Basic health check
sendctl doctor

# JSON output for scripts/agents
sendctl doctor --json

# Wait mode - poll until ready or max retries exceeded
sendctl doctor --wait --max-retries=30

# Custom timeout per check in milliseconds (default 10000ms)
sendctl doctor --timeout=30000

# Check specific service only
sendctl check anvil
sendctl check supabase
sendctl check next
```

**Flags:**
- `--json` - Output JSON instead of human-readable format
- `--timeout=<ms>` - Timeout per check in milliseconds (default: 10000)
- `--wait` - Poll until all checks pass or max retries exceeded
- `--max-retries=<n>` - Max retry attempts in wait mode (default: 30)

**Timeout precedence:** `--timeout` flag > `SENDCTL_TIMEOUT` env var > hardcoded default (10000ms)

**Exit Codes:**
- `0` - All checks passed
- `1` - One or more checks failed
- `2` - Configuration error (e.g., invalid environment)

### `sendctl check <service>`

Check a single service. Available services:
- `next` - Next.js web app
- `supabase` - Supabase API
- `anvil` - Anvil Base fork (includes contract verification)
- `bundler` - AA Bundler
- `shovel` - Shovel indexer
- `temporal` - Temporal workflow engine

**Flags (same as `doctor`):**
- `--json` - Output JSON instead of human-readable format
- `--timeout=<ms>` - Timeout in milliseconds (default: 10000)

**Note:** `--wait` and `--max-retries` are not supported for single service checks. Use `sendctl doctor --wait` to wait for all services.

**Exit Codes (same as `doctor`):**
- `0` - Check passed
- `1` - Check failed
- `2` - Configuration error (e.g., missing required env var, invalid service name)

**Dependency handling:** When checking a service with dependencies (e.g., `sendctl check bundler`), the command checks *only* that service. It does not auto-run dependency checks. If the service's underlying dependency is unhealthy, the check will fail with an appropriate error (e.g., connection refused). Use `sendctl doctor` to check all services with proper dependency ordering.

## Environment Configuration

Configuration via environment variables with sensible defaults:

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_URL` | `http://localhost:3000` | Next.js app URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://localhost:54321` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (required) | Supabase anon key for API auth |
| `NEXT_PUBLIC_BASE_RPC_URL` | `http://localhost:8546` | Anvil RPC URL |
| `NEXT_PUBLIC_BUNDLER_RPC_URL` | `http://localhost:4337` | AA Bundler URL |
| `SHOVEL_URL` | (see below) | Shovel API URL |
| `SHOVEL_PORT` | `8383` | Shovel port (used if SHOVEL_URL not set) |
| `TEMPORAL_ADDR` | `localhost:7233` | Temporal gRPC address |
| `SENDCTL_TIMEOUT` | `10000` | Default check timeout in milliseconds |

**Note:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` is required for the Supabase check. If missing, the check will fail with a configuration error (exit code 2).

**Scope:** This tool is designed for **local development** (localnet) environments only. Staging and production health checks should use dedicated infrastructure monitoring tools with proper authentication and TLS configuration.

## Service Checks

### Next.js (`next`)
- **Endpoint:** `GET /api/healthz`
- **Success:** HTTP 200
- **Failure:** Connection refused, timeout, non-200 status

### Supabase (`supabase`)
- **Endpoint:** `GET /rest/v1/`
- **Headers:** `apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}`, `Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}`
- **Success:** HTTP 200
- **Failure:** Connection refused, timeout, auth error (401/403)
- **Config Error:** Missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` (exit code 2)

### Anvil (`anvil`)
Multi-step verification:
1. **RPC Health:** `eth_chainId` returns `0xce619` (845337, Base Localhost chain ID)
2. **Factory Contract:** `eth_getCode` confirms SendAccountFactory deployed
3. **Paymaster Contract:** `eth_getCode` confirms TokenPaymaster deployed
4. **Factory Funding:** `eth_getBalance` checks factory account ETH balance (informational only, does not fail check)

Contract addresses imported from `@my/wagmi` package at runtime.

**Dependencies:** The `bundler` check depends on `anvil`. If anvil fails, bundler is skipped.

### AA Bundler (`bundler`)
- **Endpoint:** `POST` to `NEXT_PUBLIC_BUNDLER_RPC_URL` with `eth_chainId` JSON-RPC
- **Expected Chain ID:** `0xce619` (845337, same as Anvil)
- **Success:** Valid JSON-RPC response with chain ID matching `0xce619`
- **Failure:** Connection refused, invalid response, chain ID mismatch
- **Depends on:** `anvil` (skipped if anvil fails in `doctor` command)

### Shovel (`shovel`)
- **Endpoint:** `GET /health` (primary), falls back to `GET /` if 404
- **Success:** HTTP 200
- **Failure:** Connection refused, timeout

### Temporal (`temporal`)
- **Check:** gRPC health check to Temporal frontend using standard `grpc.health.v1.Health/Check` protocol
- **Address:** Uses `TEMPORAL_ADDR` (host:port format, not URL)
- **Service Name:** Empty string (`""`) for overall server health (standard convention)
- **Transport:** Insecure (no TLS) - this tool is scoped to local development only
- **Library:** Uses `@grpc/grpc-js` for gRPC connectivity
- **Success:** Connection established, health response returns `SERVING` status
- **Failure:** Connection refused, timeout, health status not `SERVING`

## Output Format

### Human-Readable (default)
```
sendctl doctor

Service     Status   Time
─────────────────────────────
next        ✓ OK     45ms
supabase    ✓ OK     23ms
anvil       ✓ OK     156ms
  ├─ rpc    ✓ OK     12ms
  ├─ factory ✓ OK    48ms
  ├─ paymaster ✓ OK  47ms
  └─ funded ✓ OK     49ms
bundler     ✓ OK     34ms
shovel      ✓ OK     18ms
temporal    ✓ OK     29ms

All checks passed (305ms total)
```

### Failure Output
```
sendctl doctor

Service     Status   Time
─────────────────────────────
next        ✓ OK     45ms
supabase    ✓ OK     23ms
anvil       ✗ FAIL   10012ms
  ├─ rpc    ✗ FAIL   timeout
bundler     - SKIP   (depends on anvil)
shovel      ✓ OK     18ms
temporal    ✓ OK     29ms

1 check failed, 1 skipped

Failures:
  anvil: Connection timeout after 10000ms
```

### JSON Output (`--json`)
```json
{
  "success": false,
  "duration_ms": 10127,
  "checks": {
    "next": { "status": "ok", "duration_ms": 45 },
    "supabase": { "status": "ok", "duration_ms": 23 },
    "anvil": {
      "status": "failed",
      "duration_ms": 10012,
      "error": "Connection timeout after 10000ms",
      "sub_checks": {
        "rpc": { "status": "failed", "duration_ms": 10000, "error": "timeout" }
      }
    },
    "bundler": { "status": "skipped", "duration_ms": 0, "reason": "depends on anvil" },
    "shovel": { "status": "ok", "duration_ms": 18 },
    "temporal": { "status": "ok", "duration_ms": 29 }
  }
}
```

**Note:** All times are in milliseconds. Skipped checks have `duration_ms: 0`.

### Single-Service Output (`sendctl check <service>`)

Human-readable:
```
sendctl check anvil

Service     Status   Time
─────────────────────────────
anvil       ✓ OK     156ms
  ├─ rpc    ✓ OK     12ms
  ├─ factory ✓ OK    48ms
  ├─ paymaster ✓ OK  47ms
  └─ funded ✓ OK     49ms

Check passed (156ms)
```

JSON (`--json`):
```json
{
  "service": "anvil",
  "status": "ok",
  "duration_ms": 156,
  "sub_checks": {
    "rpc": { "status": "ok", "duration_ms": 12 },
    "factory": { "status": "ok", "duration_ms": 48 },
    "paymaster": { "status": "ok", "duration_ms": 47 },
    "funded": { "status": "ok", "duration_ms": 49 }
  }
}
```

**Type:** Single-service checks return `SingleCheckResult` (see Types section), which extends `CheckResult` with a `service` field identifying which service was checked.

## Wait Mode

When `--wait` is specified, doctor polls until all checks pass or max retries exceeded:

```bash
sendctl doctor --wait --max-retries=30
```

**Timing:**
- **Interval:** 2 seconds between retry attempts (fixed, not configurable)
- **Default max retries:** 30
- **Per-check timeout:** Uses `--timeout` value (default 10000ms)
- **Behavior:** Wait the interval, then run all checks. If any fail, wait interval and retry.

**Note:** Total wait time depends on check durations. With default settings (30 retries, 2s interval), minimum wait is ~60 seconds. If checks are slow or timing out, actual time can be longer. The interval is the delay *between* attempts, not including check execution time.

- Outputs progress to stderr: `Waiting for services... (attempt 5/30)`
- Final output same as normal doctor (to stdout)

### Wait Mode with `--json`

When combining `--wait` and `--json`:
- Progress messages go to **stderr** (not stdout)
- Final JSON result goes to **stdout**
- This allows piping JSON output while still seeing progress

```bash
# Progress to stderr, JSON to stdout
sendctl doctor --wait --json 2>/dev/null | jq .success
```

## Playwright Integration

### Global Setup

Create `packages/playwright/globalSetup.ts`:

```typescript
import { execSync } from 'child_process'

export default async function globalSetup() {
  try {
    // 30 second timeout per check, wait for services to be ready
    execSync('yarn sendctl doctor --timeout=30000 --wait --max-retries=30', {
      stdio: 'inherit',
      env: process.env,
    })
  } catch (error) {
    console.error('Environment health check failed. Aborting tests.')
    process.exit(1)
  }
}
```

Configure in `playwright.config.ts`:
```typescript
export default defineConfig({
  globalSetup: './globalSetup.ts',
  // ...
})
```

**Behavior:** Fail fast, abort all tests if doctor fails.

## Package Structure

```
packages/sendctl/
├── SPEC.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # CLI entry point (commander)
│   ├── commands/
│   │   ├── doctor.ts         # Doctor command
│   │   └── check.ts          # Individual check command
│   ├── checks/
│   │   ├── index.ts          # Check runner & types
│   │   ├── next.ts           # Next.js check
│   │   ├── supabase.ts       # Supabase check
│   │   ├── anvil.ts          # Anvil check (with sub-checks)
│   │   ├── bundler.ts        # AA Bundler check
│   │   ├── shovel.ts         # Shovel check
│   │   └── temporal.ts       # Temporal check
│   ├── config.ts             # Environment configuration
│   ├── output.ts             # Output formatting (human/JSON)
│   └── types.ts              # Shared types
├── bin/
│   └── sendctl.js            # CLI binary shim
└── tests/
    └── doctor.test.ts        # Unit tests for checks
```

## Types

```typescript
type CheckStatus = 'ok' | 'failed' | 'skipped'

interface CheckResult {
  status: CheckStatus
  duration_ms: number
  error?: string           // Present when status is 'failed'
  reason?: string          // Present when status is 'skipped'
  sub_checks?: Record<string, CheckResult>
}

interface DoctorResult {
  success: boolean
  duration_ms: number
  checks: Record<string, CheckResult>
}

interface SingleCheckResult extends CheckResult {
  service: string           // Name of the service checked (e.g., "anvil", "next")
}

interface HttpCheckConfig {
  url: string
  timeout: number
}

interface GrpcCheckConfig {
  address: string          // host:port format (e.g., "localhost:7233")
  timeout: number
}

interface SupabaseCheckConfig extends HttpCheckConfig {
  anonKey: string          // Required for auth header
}

interface Environment {
  next: HttpCheckConfig
  supabase: SupabaseCheckConfig
  anvil: HttpCheckConfig
  bundler: HttpCheckConfig
  shovel: HttpCheckConfig
  temporal: GrpcCheckConfig
}
```

**Notes:**
- `CheckStatus` has three states: `ok`, `failed`, `skipped`. There is no `pending` state.
- `error` is present only when `status === 'failed'`
- `reason` is present only when `status === 'skipped'`
- `duration_ms` is always present (0 for skipped checks)

## Dependencies

```json
{
  "dependencies": {
    "@grpc/grpc-js": "^1.10.0",
    "@grpc/proto-loader": "^0.7.0",
    "@my/wagmi": "workspace:*",
    "commander": "^12.0.0",
    "viem": "^2.27.2"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**Notes:**
- `@my/wagmi` is a runtime dependency because contract addresses are imported and used at check time (not inlined at build time). This keeps the addresses in sync with the rest of the monorepo without a build step.
- `@grpc/grpc-js` and `@grpc/proto-loader` are required for Temporal health checks. The health proto definition is loaded dynamically using proto-loader with the standard `grpc.health.v1` proto from the gRPC health checking protocol.

## Agent Skill

Located at `.claude/skills/sendctl/SKILL.md`:

```markdown
# sendctl - Send App Environment Toolkit

## When to Use
Use sendctl when you need to:
- Verify the development environment is healthy
- Debug service connectivity issues
- Check if specific services are running
- Prepare environment before running tests

## Commands

### Check all services
\`\`\`bash
sendctl doctor
sendctl doctor --json  # Machine-readable output
\`\`\`

### Check specific service
\`\`\`bash
sendctl check next
sendctl check anvil
sendctl check supabase
\`\`\`

### Wait for services to be ready
\`\`\`bash
sendctl doctor --wait --max-retries=30
\`\`\`

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
```

## Installation

Add to root `package.json`:
```json
{
  "devDependencies": {
    "@send/sendctl": "workspace:*"
  },
  "scripts": {
    "sendctl": "sendctl"
  }
}
```

Usage:
```bash
yarn sendctl doctor
```

## Non-Goals

- **Service Management** - No start/stop/restart; use Tilt
- **Deployment** - No deploy commands; use CI/CD
- **Configuration Generation** - No env file creation; manual setup
- **Log Viewing** - No log aggregation; use `tilt logs`
- **Tilt Awareness** - No Tilt API queries; environment-agnostic
