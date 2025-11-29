# Account Top-Off Workflow

Automated Temporal workflow for monitoring and topping off critical account balances on Base mainnet.

## Overview

This workflow runs every 15 minutes to check and automatically top off the following accounts:

1. **Bundler** (0x9d1478044F781Ca722ff257e70D05e4Ad673f443)
   - Type: ETH transfer
   - Min threshold: 0.5 ETH
   - Target balance: 2 ETH

2. **Transaction Paymaster** (0x592e1224D203Be4214B15e205F6081FbbaCFcD2D)
   - Type: Paymaster deposit (calls `deposit()`)
   - Min threshold: 0.1 ETH
   - Target balance: 1 ETH

3. **Sponsored Paymaster** (0x8A77aE0c07047c5b307B2319A8F4Bd9d3604DdD8)
   - Type: Paymaster deposit (calls `deposit()`)
   - Min threshold: 0.1 ETH
   - Target balance: 1 ETH

4. **Preburn** (0xC4b42349E919e6c66B57d4832B20029b3D0f79Bd)
   - Type: USDC transfer
   - Min threshold: 20 USDC
   - Target balance: 100 USDC


## Environment Variables

The workflow requires the following environment variables:

```bash
# Required: Private key for funding account top-offs (should hold both ETH and USDC)
FUNDING_TOPOFF_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Required: Temporal connection
TEMPORAL_ADDR=localhost:7233
```

**Important**: The funding wallet should hold both ETH and USDC. The workflow will check if sufficient funds are available before attempting top-offs.

## Setup

### 1. Configure Environment Variables

Add the required environment variables to your `.env.local` file:

```bash
FUNDING_TOPOFF_PRIVATE_KEY=0x...
```

### 2. Start Temporal Worker

Make sure the Temporal worker is running to execute the workflows:

```bash
# From the root of the monorepo
tilt up workers
```

Or manually:

```bash
cd apps/workers
yarn start
```

### 3. Create the Schedule

Run the schedule creation script once to set up the recurring workflow:

```bash
# From the root of the monorepo
tsx packages/workflows/src/topoff-workflow/start-schedule.ts
```

This creates a Temporal schedule named `account-topoff-schedule` that runs every 15 minutes.

## Usage

### Check Schedule Status

```bash
temporal schedule describe --schedule-id account-topoff-schedule
```

### Trigger Manual Run

```bash
temporal workflow start \
  --type topOffAccounts \
  --task-queue monorepo@latest \
  --workflow-id manual-topoff-$(date +%s)
```

### Delete Schedule

```bash
temporal schedule delete --schedule-id account-topoff-schedule
```

### Update Schedule

To update the schedule (e.g., change frequency), delete it first and then recreate:

```bash
temporal schedule delete --schedule-id account-topoff-schedule
tsx packages/workflows/src/topoff-workflow/start-schedule.ts
```

## Monitoring

The workflow logs detailed information about each top-off operation:

- Balance checks for each account
- Top-off transactions with amounts and transaction hashes
- Warnings for accounts below threshold
- Summary of all operations

Enable debug logging to see detailed output:

```bash
DEBUG=workflows:topoff tsx packages/workflows/src/topoff-workflow/start-schedule.ts
```

## Configuration

Account configurations are defined in `config.ts`. Key configuration options:

### Accounts

To modify thresholds or add accounts:
1. Edit `packages/workflows/src/topoff-workflow/config.ts`
2. Update the `TOPOFF_ACCOUNTS` array
3. Rebuild the workflow bundle (happens automatically on next deployment)

## Testing Locally

To test the workflow without setting up a schedule:

```bash
# Start local Temporal server (via Tilt)
tilt up

# In another terminal, start the worker
cd apps/workers
yarn start

# In another terminal, trigger the workflow manually
temporal workflow start \
  --type topOffAccounts \
  --task-queue monorepo@latest \
  --workflow-id test-topoff-$(date +%s)
```

## Deployment

The workflow is deployed automatically with the rest of the monorepo workflows. After deployment:

1. Ensure environment variables are set in production
2. Run the schedule creation script in production:
   ```bash
   tsx packages/workflows/src/topoff-workflow/start-schedule.ts
   ```

## Architecture

- **Workflow**: `workflow.ts` - Orchestrates the top-off process
  1. Calculates total ETH and USDC needed
  2. Checks if funding wallet has sufficient ETH and USDC
  3. Warns if insufficient funds (skips top-offs for that currency)
  4. Performs all top-offs sequentially for better observability
  5. Logs summary

- **Activities**: `activities.ts` - Individual operations
  - Balance checking: `checkEthBalance`, `checkFundingWalletEthBalance`, `checkPaymasterDeposit`, `checkUSDCBalance`, `checkUsdcBalanceOf`
  - Top-offs: `sendEth`, `sendUsdc`, `depositToPaymaster`, `sendBundlerSelfTransaction`
  - Helper: `calculateTotalETHNeeded`, `calculateTotalUSDCNeeded`, `checkAndTopOffAccount`

- **Configuration**: `config.ts` - Account addresses and thresholds
- **Schedule**: `start-schedule.ts` - Creates the Temporal schedule

## Error Handling

**No Automatic Retries** - Since this is a cron job running every 15 minutes, all errors are **non-retryable**:

- **Configuration errors** (missing env vars, unknown account types) → `ConfigurationError`
- **Transaction failures** (insufficient funds, RPC errors) → Propagated as-is

**Why no retries?**
- Runs every 15 minutes automatically
- Transient issues (RPC down, API rate limits) will resolve by next run
- Avoids wasting gas on failed transactions
- Clearer logs - one attempt per run

If an error occurs:
1. Activity fails immediately with `ApplicationFailure.nonRetryable()`
2. Error is logged clearly in Temporal UI
3. Next scheduled run (15 min later) will retry from scratch

## Security

- Private keys are stored in environment variables, never committed to git
- Use secure secret management in production (e.g., AWS Secrets Manager)
- The funding wallet should hold both ETH and USDC for top-offs
- Consider using a dedicated wallet with appropriate balance limits
- USDC transfers are sent directly without approval (standard ERC-20 transfers)
