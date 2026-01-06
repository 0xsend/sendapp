# Phase 0 Investigation Findings

## Date: 2026-01-05

## Issue: Earn Deposit Test Failures

### Original Error
```
send_earn_deposit record not found
```

### Investigation Steps

1. **Tilt Services Status**
   - Initial state: Shovel failing (port 57598 conflict), bundler runtime error
   - Fix: Triggered Tilt updates to restart services
   - Result: All services healthy

2. **First Test Run** (after fixing Tilt)
   - Error changed to: `Test timeout of 30000ms exceeded` at `page.goto('/activity')`
   - Root cause: Activity page was redirecting to login (307 redirect)
   - This was a transient issue - services weren't fully ready

3. **Second Test Run** (single worker)
   - Error: `Timed out 5000ms waiting for expect(locator).toBeVisible()`
   - Looking for: `Deposit - 32,259.97 USDC`
   - The deposit completed successfully
   - Navigation to `/activity` worked
   - But the activity item wasn't visible yet

### Root Cause Identified

**TWO ISSUES FOUND:**

#### Issue 1: Text Mismatch (Primary Bug)

The `verifyActivity()` function expects text with a hyphen, but the UI renders without one:

```typescript
// Test expects:
page.getByText(`${event} - ${formatAmount(...)} ${coin.symbol}`)
// e.g., "Deposit - 10,692.04 USDC"

// Actual UI renders (from TokenActivityRow.tsx):
<Text>{eventName}</Text>   // "Deposit"
<Text>&nbsp;</Text>
<Text>{amount}</Text>      // "10,692.04 USDC"
// Combined visible text: "Deposit 10,692.04 USDC" (NO HYPHEN)
```

**Evidence from page snapshot:**
```yaml
- text: Deposit 10,692.04 USDC  # NO HYPHEN
```

Test looking for:
```
getByText('Deposit - 10,692.04 USDC')  # WITH HYPHEN
```

#### Issue 2: Activity Feed Filtering

The `/activity` page **excludes** `send_earn_deposit` events (see `useActivityFeed.ts:116`):
```typescript
// exclude Send Earn deposits and withdrawals from the feed (they show up as SendAccountTransfers)
`event_name.not.in.(${[Events.SendEarnDeposit, Events.SendEarnWithdraw].join(',')})`
```

Instead, the deposit shows up as an **ERC20 transfer** to the SendEarn contract, which is labeled "Deposit":
```typescript
// RecentActivityFeed.tsx:299-302
} else if (
  isERC20Transfer &&
  addressBook.data?.[activity.data.t] === ContractLabels.SendEarn
) {
  eventName = translator('events.deposit', 'Deposit')
}
```

This means the activity feed is working correctly - it just uses different events.

### Evidence

The send tests handle this correctly using `toHaveEventInActivityFeed` matcher:
```typescript
// From send.onboarded.spec.ts
await expect(supabase).toHaveEventInActivityFeed({
  event_name: 'send_account_transfers',
  ...
}, {
  timeout: 15000,  // Increased timeout for indexing
})
```

### Proposed Fix

**PRIMARY FIX: Remove the hyphen from the test expectation**

The test is checking for text that doesn't match the UI. The fix is simple:

```typescript
// BEFORE (broken):
async function verifyActivity({ page, assets, coin, event }) {
  await page.goto('/activity')
  await expect(
    page.getByText(
      `${event} - ${formatAmount(...)} ${coin.symbol}`  // WITH HYPHEN - WRONG!
    )
  ).toBeVisible({ timeout: 15000 })
}

// AFTER (fixed):
async function verifyActivity({ page, assets, coin, event }) {
  await page.goto('/activity')
  await expect(
    page.getByText(
      `${event} ${formatAmount(...)} ${coin.symbol}`  // NO HYPHEN - CORRECT!
    )
  ).toBeVisible({ timeout: 15000 })
}
```

### Recommended Approach

1. **Immediate fix**: Remove the hyphen from `verifyActivity()` text expectation
2. **Keep the timeout**: 15000ms timeout is still needed for Shovel indexing
3. **Verify `verifyEarnings()`**: This function already uses the correct format (no hyphen)

### Additional Observations

1. **Port conflicts**: Running multiple Tilt environments can cause port conflicts
   - Shovel tried to bind 57598 but it was in use
   - Solution: Ensure clean state before running tests

2. **Auth cookie preservation**: No issues found with auth after services are healthy

3. **Test parallelization**: Tests run with 2 workers by default, both can fail similarly

### Verification

**Fix Applied:** Removed hyphen from `verifyActivity()` text expectation

**Test Result:** ✅ PASSED
```
✓  1 [chromium] › tests/earn.onboarded.spec.ts:257:5 › Deposit USDC › can deposit USDC into Platform SendEarn (11.8s)
1 passed (21.5s)
```

### Additional Test: Referral Code Test

**Result:** Different failure - Next.js configuration issue (not related to activity text)

```
Invalid src prop (https://i.pravatar.cc/500?u=Pedro Purdy) on `next/image`,
hostname "i.pravatar.cc" is not configured under images in your `next.config.js`
```

This is an infrastructure issue with test fixtures generating random avatars using an external hostname. The activity text fix is correct but this test has a separate configuration issue.

### Next Steps

1. [x] ~~Implement timeout increase as quick fix~~ (already done in previous session)
2. [x] Fix text mismatch (hyphen removed)
3. [x] Verify fix with test run - **PASSED**
4. [ ] Fix Next.js image hostname configuration for `i.pravatar.cc` (separate issue)
5. [ ] Run remaining earn deposit tests after infra fix
6. [ ] Commit fix and update documentation
