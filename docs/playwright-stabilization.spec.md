# Playwright Test Stabilization Specification

**Linear Issue**: [SEND-494](https://linear.app/sendapp/issue/SEND-494)
**Branch**: `bb/SEND-494-playwright-stabilization`
**Status**: In Progress

## Objective

Stabilize Playwright E2E tests to achieve reliable CI execution. The tests run via Tilt orchestration (which manages Docker containers for Supabase, Anvil, bundler) but the Next.js app is built directly in CI rather than using a Docker image build.

**Clarification on "Docker dependency"**: The previous CI approach required building a Next.js Docker image (`build_next_image` job), which was disabled due to Dockerfile issues. The new approach builds Next.js directly (`yarn workspace next-app build`) while Tilt still orchestrates infrastructure containers. This is not "Docker-free" but removes the broken Docker image build step.

## Success Criteria

| Criterion | Measurement | Threshold |
|-----------|-------------|-----------|
| Pass rate | `(passed / (passed + failed)) * 100` over 5 consecutive CI runs | >= 95% |
| Flaky tests | Tests that pass/fail inconsistently across runs | Documented with Linear issue, either fixed or quarantined |
| Runtime | Wall clock time per shard | < 10 minutes (currently ~15-18min) |
| CI gate | PR merge ability | `playwright-tests` job passes or failures are documented flakes with `test.skip()` |

**Quarantine Policy**: Tests that cannot be stabilized within the initial effort will be:
1. Marked with `test.skip()` and a comment referencing the Linear issue
2. Tracked in Linear with label `playwright-flaky`
3. Re-enabled when root cause is fixed

## Baseline (2026-01-03)

*Note: Date confirmed - baseline was run on 2026-01-03 using local Tilt environment.*

| Shard | Passed | Failed | Skipped | Runtime |
|-------|--------|--------|---------|---------|
| 1/4   | 27     | 11     | 2       | 15.5m   |
| 2/4   | 14     | 22     | 2       | 16.4m   |
| 3/4   | 22     | 15     | 0       | 17.9m   |
| 4/4   | 9      | 26     | 2       | 17.5m   |
| **Total** | **72** | **74** | **6** | ~67m |

**Current pass rate**: 49.3% (72/146)

### Skipped Tests (6 total)

| Test Name | File | Reason |
|-----------|------|--------|
| `can deposit ETH into Platform SendEarn` | `earn.onboarded.spec.ts` | Pre-existing skip - ETH vault not deployed |
| `can deposit ETH into SendEarn with referral` | `earn.onboarded.spec.ts` | Pre-existing skip - ETH vault not deployed |
| `can withdraw ETH from SendEarn` | `earn.onboarded.spec.ts` | Pre-existing skip - ETH vault not deployed |
| `can claim affiliate rewards for ETH` | `earn.onboarded.spec.ts` | Pre-existing skip - ETH vault not deployed |
| `can send to a phone contact` | `send.onboarded.spec.ts` | Pre-existing skip - phone contact feature incomplete |
| `can send using QR code` | `send.onboarded.spec.ts` | Pre-existing skip - QR feature incomplete |

*These tests were already skipped before the baseline run and are not part of the stabilization scope.*

## Per-Test Failure Mapping

### Shard 1 Failures (11 tests)

| Test Name | File | Category | Failure Signature |
|-----------|------|----------|-------------------|
| `can confirm a tag` | `account-sendtag-checkout.onboarded.spec.ts` | 6-Timeout/DB | `TimeoutError: waiting for response` |
| `can refer a tag` | `account-sendtag-checkout.onboarded.spec.ts` | 8-Logic | `Cannot add 5 tags` |
| `can backup account` | `account-settings-backup.onboarded.spec.ts` | 6-Timeout/DB | `Test timeout 30000ms exceeded` |
| `can update profile` | `account-settings.onboarded.spec.ts` | 5-Title | `Expected: "Send | Profile"` |
| `can visit activity page and see correct activity feed` | `activity.onboarded.spec.ts` | 4-Activity | `Activity rows not found` |
| `can deposit USDC into Platform SendEarn` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `net::ERR_ABORTED` |
| `can deposit USDC into SendEarn with a referral code` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `No affiliate vault found` |
| `can deposit again after withdrawing all funds for USDC` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Withdraw form not visible` |
| `can withdraw USDC from SendEarn` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `net::ERR_CONNECTION_REFUSED` |
| `can withdraw all USDC deposited amount from SendEarn` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Withdraw form not visible` |
| `can claim affiliate rewards for USDC` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Rewards element not visible` |

### Shard 2 Failures (22 tests)

| Test Name | File | Category | Failure Signature |
|-----------|------|----------|-------------------|
| `can visit token detail page` | `home.onboarded.spec.ts` | 4-Activity | `TokenActivityFeed elements not found` |
| `anon user can visit public profile` | `profile.anon.spec.ts` | 5-Title | `Expected: "Send | Profile", Received: "localhost/..."` |
| `logged in user needs onboarding before visiting profile` | `profile.logged-in.spec.ts` | 5-Title | `Expected: "Send | Profile", Received: "Send | Name"` |
| `can visit other user profile and send by tag` | `profile.onboarded.spec.ts` | 1-Routing | `waitForURL: timeout waiting for /send` |
| `can view activities between another profile` | `profile.onboarded.spec.ts` | 4-Activity | `waitForResponse: activity_feed timeout` |
| `can send USDC starting from profile page` | `send.onboarded.spec.ts` | 1-Routing | `Expected: /\/send/, Received: profile URL` |
| `can send USDC using tag starting from home page` | `send.onboarded.spec.ts` | 2-Visibility | `Search input not visible` |
| `can send USDC using sendid starting from home page` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `can send USDC using address starting from home page` | `send.onboarded.spec.ts` | 3-Strict | `getByText('0x...') resolved to 2 elements` |
| `can send SEND starting from profile page` | `send.onboarded.spec.ts` | 1-Routing | `Expected: /\/send/, Received: profile URL` |
| `can send SEND using tag starting from home page` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `can send SEND using sendid starting from home page` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `can send SEND using address starting from home page` | `send.onboarded.spec.ts` | 3-Strict | `getByText('0x...') resolved to 2 elements` |
| `can send ETH starting from profile page` | `send.onboarded.spec.ts` | 1-Routing | `Expected: /\/send/, Received: profile URL` |
| `can send ETH using tag starting from home page` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `can send ETH using sendid starting from home page` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `can send ETH using address starting from home page` | `send.onboarded.spec.ts` | 3-Strict | `getByText('0x...') resolved to 2 elements` |
| `cannot send below minimum amount for SEND token` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `sendtag complete happy path` | `sendtag-happy-path.onboarded.spec.ts` | 6-Timeout/DB | `waitForEvent: tag.confirm timeout` |
| `can swap USDC for SEND` | `swap.onboarded.spec.ts` | 4-Activity | `TokenActivityFeed not visible` |
| `can swap USDC for ETH` | `swap.onboarded.spec.ts` | 4-Activity | `TokenActivityFeed not visible` |
| `can refresh swap form and preserve filled data` | `swap.onboarded.spec.ts` | 7-Flake | `fillSwapForm timeout` |

### Shard 3 Failures (15 tests)

| Test Name | File | Category | Failure Signature |
|-----------|------|----------|-------------------|
| `can confirm a tag` | `account-sendtag-checkout.onboarded.spec.ts` | 6-Timeout/DB | `waitForResponse timeout` |
| `can refer a tag` | `account-sendtag-checkout.onboarded.spec.ts` | 8-Logic | `Cannot add 5 tags` |
| `can backup account` | `account-settings-backup.onboarded.spec.ts` | 6-Timeout/DB | `Test timeout exceeded` |
| `can remove a signer` | `account-settings-backup.onboarded.spec.ts` | 6-Timeout/DB | `Test timeout exceeded` |
| `can update profile` | `account.logged-in.spec.ts` | 5-Title | `Profile update timeout` |
| `can visit activity page and see correct activity feed` | `activity.onboarded.spec.ts` | 4-Activity | `Activity rows not found` |
| `can toggle favorite from profile page` | `contacts.onboarded.spec.ts` | 2-Visibility | `Element not visible` |
| `can deposit USDC into Platform SendEarn` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Expected send_earn_deposit record not found` |
| `can deposit USDC with referral code` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Expected send_earn_deposit record not found` |
| `can deposit USDC with existing upline` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Expected send_earn_deposit record not found` |
| `can deposit again after withdrawing` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Expected send_earn_deposit record not found` |
| `can withdraw USDC from SendEarn` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Expected send_earn_deposit record not found` |
| `can withdraw all USDC from SendEarn` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Expected send_earn_deposit record not found` |
| `can claim affiliate rewards for USDC` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Expected send_earn_deposit record not found` |
| `cannot use own referral code for USDC` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Expected send_earn_deposit record not found` |

### Shard 4 Failures (26 tests)

| Test Name | File | Category | Failure Signature |
|-----------|------|----------|-------------------|
| `always deposits into same vault` | `earn.onboarded.spec.ts` | 6-Timeout/DB | `Expected send_earn_deposit record not found` |
| `can visit token detail page` | `home.onboarded.spec.ts` | 4-Activity | `TokenActivityFeed elements not found` |
| `anon user can visit public profile` | `profile.anon.spec.ts` | 5-Title | `Title mismatch` |
| `logged in user needs onboarding before visiting profile` | `profile.logged-in.spec.ts` | 5-Title | `Title mismatch` |
| `can visit other user profile and send` | `profile.onboarded.spec.ts` | 1-Routing | `waitForURL timeout` |
| `can visit private profile` | `profile.onboarded.spec.ts` | 2-Visibility | `Element not visible` |
| `can view activities between profiles` | `profile.onboarded.spec.ts` | 4-Activity | `waitForResponse timeout` |
| `can upgrade Send Token V0 to V1` | `send-token-upgrade.onboarded.spec.ts` | 6-Timeout/DB | `Test timeout exceeded` |
| `can send USDC from profile page` | `send.onboarded.spec.ts` | 1-Routing | `URL mismatch` |
| `can send USDC using tag` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `can send USDC using sendid` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `can send USDC using address` | `send.onboarded.spec.ts` | 3-Strict | `Strict mode violation` |
| `can send SEND from profile page` | `send.onboarded.spec.ts` | 1-Routing | `URL mismatch` |
| `can send SEND using tag` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `can send SEND using sendid` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `can send SEND using address` | `send.onboarded.spec.ts` | 3-Strict | `Strict mode violation` |
| `can send ETH from profile page` | `send.onboarded.spec.ts` | 1-Routing | `URL mismatch` |
| `can send ETH using tag` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `can send ETH using sendid` | `send.onboarded.spec.ts` | 2-Visibility | `Amount input not visible` |
| `can send ETH using address` | `send.onboarded.spec.ts` | 3-Strict | `Strict mode violation` |
| `cannot send below minimum amount` | `send.onboarded.spec.ts` | 6-Timeout/DB | `waitForURL timeout during onboarding` |
| `sendtag complete happy path` | `sendtag-happy-path.onboarded.spec.ts` | 3-Strict | `getByText('4 USDC') resolved to 2 elements` |
| `redirect on sign-in` | `sign-in.anon.spec.ts` | 2-Visibility | `Search input not visible` |
| `can swap USDC for SEND` | `swap.onboarded.spec.ts` | 4-Activity | `TokenActivityFeed not visible` |
| `can swap USDC for ETH` | `swap.onboarded.spec.ts` | 4-Activity | `TokenActivityFeed not visible` |
| `can refresh swap form and preserve filled data` | `swap.onboarded.spec.ts` | 7-Flake | `fillSwapForm timeout` |

## Failure Categories

### 1. Send Flow URL Routing (8 tests)
**Pattern**: Tests expect `/send` URL but app routes to profile page with query params
**Root Cause**: App architecture changed - send flow is now a dialog that can appear on profile page
**Resolution**: Update tests to detect dialog presence rather than URL routing

**Investigation Plan**:
1. Examine current send flow implementation in app code
2. Identify dialog component and its visibility triggers
3. Update test assertions to check for dialog presence instead of URL
4. Verify dialog testID exists or add one for reliable detection

**Exit Criteria**: All 8 tests updated to use dialog-based assertions and pass consistently

### 2. Element Visibility (16 tests)
**Pattern**: Amount input `input[placeholder="0"]` or search input not visible
**Root Cause**: TBD - requires investigation
**Resolution**: Add testIDs to app components, improve wait conditions

**Investigation Plan**:
1. Run single failing test with `--debug` to observe UI state
2. Capture screenshot at failure point using `page.screenshot()`
3. Check if element exists but is hidden (CSS) vs not rendered
4. Verify dialog animation/transition timing
5. Add `data-testid` attributes if selectors are ambiguous

**Exit Criteria**: Each test either passes consistently or has documented root cause with fix PR

### 3. Strict Mode Violations (7 tests)
**Pattern**: `getByText('0x...') resolved to 2 elements` or `getByText('4 USDC') resolved to 2 elements`
**Root Cause**: Text appears in multiple places (header + form, or multiple price displays)
**Resolution**: Add `data-testid` to disambiguate

**Investigation Plan**:
1. Run failing test with `--debug` to identify duplicate elements
2. Locate both elements in the DOM and determine which is the intended target
3. Add `data-testid` attribute to the target element in app code
4. Update test to use `getByTestId()` instead of `getByText()`

**Exit Criteria**: All 7 tests use unambiguous selectors and pass consistently

### 4. TokenActivityFeed Not Loading (10 tests)
**Pattern**: Activity feed elements not found
**Root Cause**: TBD - requires investigation

**Investigation Plan**:
1. Check if activity data is seeded in test fixtures
2. Inspect network requests for activity_feed API calls
3. Add debug logging to activity feed component render
4. Verify Shovel/indexer is running and processing events
5. Check for race conditions between data seeding and UI render

**Exit Criteria**: Root cause identified and documented, fix implemented or test updated

### 5. Profile Page Title Mismatches (6 tests)
**Pattern**: Expected "Send | Profile", got user's name or sendtag
**Root Cause**: TBD - page title logic may have changed

**Investigation Plan**:
1. Check recent commits to profile page title logic
2. Compare expected vs actual title in test output
3. Determine if this is intentional UX change or regression
4. Update test expectations or fix title logic accordingly

**Exit Criteria**: Title behavior documented, test expectations aligned with intended behavior

### 6. Timeouts & DB Record Issues (23 tests)
**Pattern**: Test timeouts, missing DB records, or network/response failures across various flows
**Affected Areas**:
- Sendtag checkout: `tag.confirm` response timeout
- Earn flow: `send_earn_deposit` record not found, withdraw form not visible
- Account backup: test timeout exceeded
- Send token upgrade: test timeout exceeded
- Send onboarding: `waitForURL` timeout during onboarding

**Root Cause**: Multiple potential causes:
- Database records not created (Shovel indexer not processing events)
- Infrastructure service latency or unavailability
- Test timeout too aggressive for async operations

**Resolution**: Investigate per-flow, improve wait conditions, increase timeouts where appropriate

**Investigation Plan**:
1. Group tests by flow (sendtag, earn, account, send) for targeted investigation
2. Check bundler/anvil container logs during test run
3. Verify transaction confirmation and indexing in Shovel logs
4. Add response logging to identify where timeout occurs
5. Test with increased timeout to distinguish infra vs logic issues
6. For non-blockchain flows (account backup), check for missing UI state waits

**Exit Criteria**: Each test has documented root cause; infra issues have mitigation, logic issues have fixes

### 7. Intermittent Flakes (2 tests)
**Pattern**: Tests that fail inconsistently with timing-related errors
**Root Cause**: Race conditions in form interactions or network requests
**Resolution**: Improve wait conditions, add retries if necessary

**Investigation Plan**:
1. Run test multiple times (10+) to confirm flakiness pattern
2. Add timing logs to identify where race condition occurs
3. Replace `waitForTimeout` with web-first assertions
4. If still flaky after fixes, add `test.describe.configure({ retries: 2 })`

**Exit Criteria**: Either stabilize with better waits or document and add retry policy

### 8. Test Logic Errors (2 tests)
**Pattern**: Test preconditions or assertions don't match expected app state
**Root Cause**: Test logic issue (e.g., `can refer a tag` expects 5 tags but state doesn't allow it)
**Resolution**: Fix test setup/preconditions or update assertions

**Investigation Plan**:
1. Review test logic and expected preconditions
2. Verify app state matches test expectations
3. Update test setup or assertions as needed

**Exit Criteria**: Test logic corrected to match actual app behavior

## Phased Approach

Work is organized into phases with stacked PRs to enable fast, incremental merges. Each phase builds on the previous and has clear entry/exit criteria.

### Branching Strategy

```
dev (base)
 └── fix/playwright-phase0-infra
      └── fix/playwright-phase1-quick-wins
           └── fix/playwright-phase2-send-flow
                └── fix/playwright-phase3-earn-sendtag
                     └── fix/playwright-phase4-polish
```

**Stacked PR workflow:**
1. Create PR for each phase targeting the previous phase's branch
2. Merge phase 0 → dev first, then rebase phase 1 onto dev
3. Continue stacking until all phases merged
4. Each PR should be reviewable independently

---

### Phase 0: Infrastructure Blockers (MUST FIX)

**Scope**: Localnet infrastructure bugs that cause widespread test failures

**Known Infra Issues:**
| Issue | Signature | Impact | Root Cause |
|-------|-----------|--------|------------|
| Network failures | `net::ERR_ABORTED`, `net::ERR_CONNECTION_REFUSED` | Earn tests fail to load | Bundler/RPC service not ready or crashing |
| Shovel indexer | `send_earn_deposit record not found` | 9+ earn tests fail | Events not indexed before assertion |
| Sendtag confirmation | `tag.confirm` response timeout | 2+ sendtag tests fail | Slow or missing blockchain event processing |

**Investigation Steps:**
1. Check Tilt logs during test run for service crashes/restarts
2. Verify Shovel is processing events (check shovel logs, query DB)
3. Add health checks before test suite starts
4. Consider adding `waitForShovel()` utility for earn/sendtag tests

**Deliverables:**
- [ ] Document root cause for each infra issue
- [ ] Fix or add workaround for Shovel indexing delays
- [ ] Add service readiness checks to test setup
- [ ] Verify earn/sendtag tests can pass when infra is healthy

**Exit Criteria**: Infra issues documented with fixes or reliable workarounds; no `net::ERR_*` failures in clean runs

**PR**: `fix/playwright-phase0-infra` → `dev`

---

### Phase 1: Quick Wins (Low Effort, High Impact)

**Scope**: Simple fixes that don't require deep investigation

**Tasks:**
| Task | Tests Fixed | Effort |
|------|-------------|--------|
| Replace 9 `waitForTimeout` calls with web-first assertions | Reduces flakiness | 1-2 hours |
| Fix title mismatches (update test expectations) | 6 tests | 30 min |
| Fix test logic errors (tag referral, etc.) | 2 tests | 1 hour |

**Workflow per fix:**
1. Create focused commit for each fix
2. Run affected test locally to verify
3. Add to phase 1 PR

**Deliverables:**
- [ ] Remove all `waitForTimeout` calls from send/swap tests
- [ ] Update profile title expectations
- [ ] Fix `can refer a tag` test logic

**Exit Criteria**: 8+ tests fixed; no new `waitForTimeout` calls in modified files

**PR**: `fix/playwright-phase1-quick-wins` → `fix/playwright-phase0-infra`

---

### Phase 2: Send Flow (24 tests)

**Scope**: Fix send flow tests (8 routing + 16 visibility)

**Key Insight**: Send flow changed from page-based (`/send`) to dialog-based (modal on profile page)

**Tasks:**
1. **Investigate dialog pattern** (1-2 hours)
   - Identify dialog component in app code
   - Find or add `data-testid` for dialog
   - Document new send flow UX

2. **Update routing tests** (8 tests, 2-3 hours)
   - Replace `waitForURL('/send')` with dialog visibility check
   - Update assertions to check dialog state

3. **Fix visibility tests** (16 tests, 3-4 hours)
   - Add `data-testid` to amount input, search input
   - Replace ambiguous selectors with `getByTestId()`
   - Ensure proper wait for dialog animation

**Deliverables:**
- [ ] Document send flow dialog pattern
- [ ] Add testIDs to send dialog components
- [ ] Update all 24 send flow tests

**Exit Criteria**: All 24 send flow tests pass consistently (3 consecutive runs)

**PR**: `fix/playwright-phase2-send-flow` → `fix/playwright-phase1-quick-wins`

---

### Phase 3: Earn & Sendtag (23 tests)

**Scope**: Fix timeout and DB record issues in earn/sendtag flows

**Dependencies**: Phase 0 infra fixes must be complete

**Tasks:**
1. **Profile earn flow** (2-3 hours)
   - Identify slowest operations (on-chain tx, indexing)
   - Add timing instrumentation
   - Document expected latencies

2. **Fix earn deposit tests** (9 tests, 4-6 hours)
   - Add `waitForShovelIndexing()` helper
   - Increase timeouts where justified
   - Consider pre-seeding test data

3. **Fix sendtag confirmation** (2-3 hours)
   - Investigate `tag.confirm` event flow
   - Add proper response waits

4. **Fix account backup tests** (2 tests, 1-2 hours)
   - These are non-blockchain, likely UI timing issues

**Deliverables:**
- [ ] `waitForShovelIndexing()` fixture utility
- [ ] Documented earn flow timing expectations
- [ ] All 23 timeout/DB tests passing

**Exit Criteria**: All earn/sendtag tests pass; no timeout errors in 3 consecutive runs

**PR**: `fix/playwright-phase3-earn-sendtag` → `fix/playwright-phase2-send-flow`

---

### Phase 4: Polish & Runtime (Remaining)

**Scope**: Strict mode, activity feed, flakes, and runtime optimization

**Tasks:**
1. **Strict mode violations** (7 tests, 2-3 hours)
   - Add `data-testid` to disambiguate duplicate text
   - Update tests to use `getByTestId()`

2. **Activity feed loading** (10 tests, 3-4 hours)
   - Investigate `TokenActivityFeed` rendering
   - Check activity data seeding
   - Add proper loading state waits

3. **Intermittent flakes** (2 tests, 1-2 hours)
   - Add retry policy if needed
   - Document known flaky behavior

4. **Runtime optimization** (ongoing)
   - Profile test execution
   - Increase parallel workers
   - Target <10min/shard

**Deliverables:**
- [ ] All strict mode tests use unambiguous selectors
- [ ] Activity feed tests reliable
- [ ] Runtime <10min/shard achieved

**Exit Criteria**: 95%+ pass rate over 5 consecutive CI runs; <10min/shard

**PR**: `fix/playwright-phase4-polish` → `fix/playwright-phase3-earn-sendtag`

---

### Phase Summary

| Phase | Tests | Effort | Dependencies |
|-------|-------|--------|--------------|
| 0 - Infra Blockers | Blocking | 4-8 hours | None |
| 1 - Quick Wins | ~8 | 3-4 hours | Phase 0 |
| 2 - Send Flow | 24 | 6-8 hours | Phase 1 |
| 3 - Earn/Sendtag | 23 | 8-12 hours | Phase 0, 2 |
| 4 - Polish | 19 | 6-10 hours | Phase 3 |

**Total Estimated Effort**: 27-42 hours across all phases

## Known Flake Drivers

The following patterns introduce nondeterminism and should be addressed:

#### `Math.random()` Usage
| File | Line | Usage | Risk |
|------|------|-------|------|
| `send.onboarded.spec.ts` | 207 | `Math.random() * 1000` for amount | High - different amounts may trigger different code paths |
| `swap.onboarded.spec.ts` | 49 | `Math.floor(Math.random() * (20 - 2 + 1)) + 2` for slippage | Medium - comment notes "lower might make tests flaky" |
| `sendtag-happy-path.onboarded.spec.ts` | 297 | Tag name generation | Low - unique names, no logic dependency |
| `account-sendtag-checkout.onboarded.spec.ts` | 176, 253, 290 | Random array lengths | Medium - affects checkout flow |
| `activity.onboarded.spec.ts` | 17-19 | `Math.random() * 10000` for block_num/tx_idx/log_idx | Low - test data generation, unique values only |
| `account-settings-backup.onboarded.spec.ts` | 51 | `Math.random() * 1000000` for acctName | Low - unique name generation |
| `fixtures/metamask/page.ts` | 98 | `Math.random()` for screenshot filename | Low - filename uniqueness only |
| `utils/generators.ts` | 3-6 | Phone/sendtag/country generation | Low - unique values only |

**Resolution**: Seed randomness or use deterministic values. For critical flows, use fixed test values.

#### `waitForTimeout()` Usage (Hard Waits)
| File | Line | Duration | Purpose |
|------|------|----------|---------|
| `send.onboarded.spec.ts` | 379, 392 | 500ms | "Give UI time to update" |
| `sendtag-happy-path.onboarded.spec.ts` | 226, 354 | 1000ms | UI update timing |
| `contacts.onboarded.spec.ts` | 282, 615 | 1000ms, 300ms | Unknown |
| `fixtures/swap/index.ts` | 149, 175 | 1000ms | Form interaction timing |
| `earn.onboarded.spec.ts` | 996 | 2000ms | Unknown |

**Resolution**: Replace with web-first assertions:
- `await expect(element).toBeVisible()` instead of `waitForTimeout` + interaction
- `await page.waitForResponse()` for API calls
- `await expect(element).toHaveValue()` for form state

## Approach

### Priority Order
1. **Send flow tests** - Core user journey (24 tests: 8 routing + 16 visibility)
2. **Earn/Sendtag tests** - Revenue features (23 tests: timeouts/DB issues)
3. **Activity/Profile tests** - Supporting features (16 tests: 10 activity + 6 title)
4. **Remaining** - Strict mode (7), logic (2), flakes (2)

### Strategies

| Strategy | When to Use |
|----------|-------------|
| **Add testIDs** | Strict mode violations, ambiguous selectors |
| **Replace waitForTimeout** | Hard waits that cause flakiness |
| **Seed randomness** | Tests using `Math.random()` for values that affect behavior |
| **Add retries** | Genuine flakiness that can't be eliminated |
| **Skip with TODO** | Low-value tests, defer to future |
| **Delete test** | Obsolete tests that no longer match app behavior |
| **Fix test** | Test logic is wrong, app is correct |
| **Fix app** | App regression or missing accessibility |

### Assertion Guidelines
- **Hard assertions** (`expect()`): Flow control, critical validations
- **Soft assertions** (`expect.soft()`): UI state verification, multiple checks

### Selector Guidelines
- Prefer `getByTestId()` for disambiguation
- Prefer `getByRole()` for accessibility
- Use `.first()` only with explanatory comment
- Avoid fragile CSS selectors

## Runtime Optimization

**Goal**: Reduce shard runtime from ~15-18min to <10min per shard.

**Current State**:
- Total runtime: ~67min across 4 shards
- Per-shard average: ~16.8min
- Target: <10min/shard = <40min total

### Investigation Plan

1. **Profile test execution** - Identify slowest tests using `--reporter=list` with timing
2. **Analyze fixture overhead** - Measure time spent in `beforeEach`/`afterEach` hooks
3. **Check infrastructure waits** - Identify tests waiting on Tilt services (bundler, Shovel)
4. **Review test isolation** - Look for unnecessary page reloads or auth re-flows

### Optimization Strategies

| Strategy | Impact | Effort |
|----------|--------|--------|
| **Reduce hard waits** | High | Medium - replace `waitForTimeout` with web-first assertions |
| **Parallelize within shard** | High | Low - increase `workers` in playwright.config.ts |
| **Share auth state** | Medium | Medium - use `storageState` for authenticated tests |
| **Lazy fixture loading** | Medium | Low - only seed data when test needs it |
| **Skip redundant navigation** | Low | Low - reuse page state between related tests |

### Specific Actions

1. **Replace 9 `waitForTimeout` calls** (see Known Flake Drivers section)
   - Total hard wait time: ~8.3s (500ms×2 + 1000ms×5 + 300ms + 2000ms)
   - Expected savings: ~8s direct, plus reduced flakiness retries

2. **Increase parallel workers** from default to 2-4 per shard
   - Expected savings: 30-50% reduction if tests are independent

3. **Optimize fixture setup** for earn/sendtag flows
   - These flows have the longest setup times (blockchain transactions)
   - Consider pre-seeding test data instead of on-chain transactions where possible
   - Expected savings: TBD after profiling - requires investigation

4. **Profile and split longest tests**
   - If any single test takes >2min, consider splitting into focused assertions
   - Expected savings: TBD after profiling - requires investigation

**Exit Criteria**: 3 consecutive CI runs with all shards completing in <10min

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-03 | Target 95% pass rate over 5 runs | 100% unrealistic, some flakiness acceptable if documented |
| 2026-01-03 | Allow testID additions to app | Clean solution for selector issues |
| 2026-01-03 | Send flow is now dialog-based | Tests need to adapt to new UI pattern |
| 2026-01-03 | Opportunistic refactoring OK | Improve fixtures if it helps stability |
| 2026-01-03 | Replace waitForTimeout with web-first | Hard waits are primary flake source |
| 2026-01-03 | Use deterministic values for tests | Random values make failures hard to reproduce |

## Progress Tracking

- **Spec file**: Living document with findings and decisions
- **Linear issues**: Created for each failure category/fix
- **Git commits**: Conventional commits with `fix(playwright):` prefix

## Files Reference

| File | Purpose |
|------|---------|
| `packages/playwright/tests/*.spec.ts` | Test files |
| `packages/playwright/tests/fixtures/*` | Test fixtures and page objects |
| `packages/playwright/playwright.config.ts` | Playwright configuration |
| `.github/workflows/ci.yml` | CI workflow with `playwright-tests` job |

## Next Steps

1. [x] Complete baseline (run shards 3-4)
2. [ ] Investigate send flow dialog pattern - update test expectations
3. [ ] Replace `waitForTimeout` with web-first assertions in send/swap tests
4. [ ] Add testIDs for strict mode violations (7 tests)
5. [ ] Seed or fix `Math.random()` usage in critical test paths
6. [ ] Investigate TokenActivityFeed loading issues (10 tests)
7. [ ] Investigate Earn flow DB issues - send_earn_deposit records not found (9 tests)
8. [ ] Investigate sendtag confirmation timeouts
9. [ ] Reduce runtime to <10min/shard (see Runtime Optimization section)
