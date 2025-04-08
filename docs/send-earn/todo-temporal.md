# Implementation Plan: Send Earn Deposit Temporal Workflow (Phased with Testing)

## 1. Goal

Refactor the current client-side Send Earn deposit process to utilize a Temporal workflow for improved reliability, observability, and separation of concerns. This aligns the deposit flow with the existing pattern used for Send transfers. This plan includes updates to handle refactored deposit decoding logic (`decodeSendEarnDepositUserOp`), specifically differentiating between direct vault deposits (`VaultDeposit`) and factory-based deposits (`FactoryDeposit`). **Crucially, for factory deposits initiated with a valid referrer (`referrer != address(0)`), the workflow must ensure the corresponding off-chain referral relationship is created in the `public.referrals` table, respecting the "first referrer wins" logic by ignoring subsequent attempts for the same referred user.** Unit and database tests are integrated into each phase.

## Phase 1: Database Setup and Testing [COMPLETED]

1.  **[x] Schema Verification:**
    *   [x] Verify `temporal.send_earn_deposits` table exists with `vault` (BYTEA) as nullable. (No migration needed).
    *   [x] Verify `public.referrals` table exists with `referrer_id` (uuid), `referred_id` (uuid), an `id` primary key, and a unique constraint on `referred_id`. (No migration needed, will use `insert` with `ignoreDuplicates: true`).
2.  **[x] Trigger Verification/Implementation:**
    *   [x] Verify/implement the `temporal.temporal_deposit_insert_pending_activity` trigger to handle null `vault` in `activity.data`.
    *   [x] Verify/implement the cleanup trigger for the pending activity upon `public.send_earn_deposit` insertion.
3.  **[x] Database Testing (pgTap):**
    *   [x] Write/update pgTap tests (`supabase/tests/`) to:
        *   [x] Verify `temporal.send_earn_deposits` trigger behavior with null `vault`.
        *   [x] Verify `public.referrals` table constraints (unique `referred_id`) and insert logic (e.g., `ignoreDuplicates: true` behavior on conflict).
        *   [x] Verify the activity cleanup trigger functions correctly.

## Phase 2: Supabase Helpers and Unit Testing [COMPLETED]

1.  **[x] Implement/Update Helpers (`packages/workflows/src/deposit-workflow/supabase.ts`):**
    *   [x] Modify `upsertTemporalSendEarnDeposit` to accept `vault: null` and remove the strict requirement check in its validation logic.
    *   [x] Ensure `updateTemporalSendEarnDeposit` can update the `vault` field. (Verified, no changes needed).
    *   [x] Implement `async function getUserIdFromAddress(address: Address): Promise<string | null>` using `supabaseAdmin` (query `public.send_accounts`).
2.  **[x] Unit Testing (Jest):**
    *   [x] Write unit tests for:
        *   [x] `upsertTemporalSendEarnDeposit` (mock Supabase client, test null vault handling).
        *   [x] `updateTemporalSendEarnDeposit` (mock Supabase client).
        *   [x] `getUserIdFromAddress` (mock Supabase client, test found/not found cases).

## Phase 3: Temporal Activities [COMPLETED]

1.  **[x] Implement/Update Activities (`packages/workflows/src/deposit-workflow/activities.ts`):**
    *   [x] Update `upsertTemporalDepositActivity` input type (`TemporalDepositInsert`) to allow optional/null `vault`, ensuring it calls the modified Supabase helper correctly.
    *   [x] Implement `verifyDepositIndexedActivity`:
        *   [x] Input: `{ transactionHash: \`0x\${string}\`, owner: Address }`.
        *   [x] Logic: Query `public.send_earn_deposit` table using the `transactionHash` and `owner` to confirm the deposit record exists (indicating successful indexing by Shovel). This activity should likely retry with backoff until the record is found or a timeout is reached. Return `boolean` (or the found record if needed downstream). Handle query errors.
    *   [x] Implement `upsertReferralRelationshipActivity`:
        *   [x] Input: `referrerAddress: Address`, `referredAddress: Address`, `transactionHash: \`0x\${string}\``. *(Note: Added txHash based on implementation)*
        *   [x] Logic:
            1.  [x] Query `public.send_earn_new_affiliate` using the `referrerAddress`, `referredAddress`, and `transactionHash` to validate if this specific deposit corresponds to a new affiliate creation event.
            2.  [x] If validated as a new affiliate referral for this context:
                *   [x] Use `getUserIdFromAddress` for both `referrerAddress` and `referredAddress`.
                *   [x] If both UUIDs (`referrerUuid`, `referredUuid`) are found, call `supabaseAdmin.from('referrals').insert({ referrer_id: referrerUuid, referred_id: referredUuid })`. Handle unique constraint violation (`23505`) gracefully for "first referrer wins".
            3.  [x] Log outcomes (validated/not validated, users found/not found, insert success/ignored due to conflict/DB error).
            4.  [x] Handle errors appropriately (retryable for DB connection, non-retryable/warning otherwise, ensuring workflow doesn't fail for this optional step).
    *   [x] Verify other activities (`decode...`, `simulate...`, `send...`, `waitFor...`) are suitable.

## Phase 4: Temporal Workflow Refactoring and Testing

1.  **Refactor Workflow (`packages/workflows/src/deposit-workflow/workflow.ts`):**
    *   Implement the detailed workflow steps:
        1.  Get `workflowId`.
        2.  Call `decodeDepositUserOpActivity` -> `depositCall`.
        3.  Use type guards (`isVaultDeposit`, `isFactoryDeposit`).
        4.  Call `upsertTemporalDepositActivity` (handling null vault, converting types like Address to `bytea` via `hexToBytea`, bigint to string).
        5.  Call `simulateDepositActivity`.
        6.  Call `updateTemporalDepositActivity` (status 'submitted').
        7.  Call `sendUserOpActivity` -> `userOpHashBytea`.
        8.  Call `updateTemporalDepositActivity` (status 'sent').
        9.  Call `waitForTransactionReceiptActivity` -> `receipt`.
        10. Call `verifyDepositIndexedActivity({ transactionHash: receipt.transactionHash, owner: depositCall.owner })`. This activity should handle retries internally until the deposit is confirmed indexed or a timeout occurs.
        11. **If `isFactoryDeposit(depositCall)` and `depositCall.referrer !== constants.AddressZero`:**
            *   `try...catch` block for referral upsert (or handle errors within the activity).
            *   Call `upsertReferralRelationshipActivity({ referrerAddress: depositCall.referrer, referredAddress: depositCall.owner })`. Log outcome.
        // Note: No final update to temporal table needed. The cleanup trigger handles deletion upon public table insertion.
    *   Ensure workflow completes successfully after `verifyDepositIndexedActivity` confirms indexing. The referral step (11) should log errors but not fail the workflow if the deposit itself was successful and indexed.
    *   Ensure all necessary imports (`hexToBytea`, type guards, `constants.AddressZero`).
    *   Register workflow in `all-workflows.ts`.

*(End-to-End tests using Playwright are excluded for now)*.
