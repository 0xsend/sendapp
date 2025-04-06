# Implementation Plan: Send Earn Deposit Temporal Workflow (Phased with Testing)

## 1. Goal

Refactor the current client-side Send Earn deposit process to utilize a Temporal workflow for improved reliability, observability, and separation of concerns. This aligns the deposit flow with the existing pattern used for Send transfers. This plan includes updates to handle refactored deposit decoding logic (`decodeSendEarnDepositUserOp`), specifically differentiating between direct vault deposits (`VaultDeposit`) and factory-based deposits (`FactoryDeposit`), and ensuring off-chain referral relationships are created for factory deposits with referrers. Referrals are one-to-one so once a user is referred, it should not change in the future. Unit and database tests are integrated into each phase.

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

## Phase 2: Supabase Helpers and Unit Testing

1.  **Implement/Update Helpers (`packages/workflows/src/.../supabase.ts` or shared utils):**
    *   Modify `upsertTemporalSendEarnDeposit` to accept `vault: null` and remove the strict requirement check in its validation logic.
    *   Ensure `updateTemporalSendEarnDeposit` can update the `vault` field.
    *   Verify or implement `async function getUserIdFromAddress(address: Address): Promise<string | null>` using `supabaseAdmin` (e.g., query `public.send_accounts`).
2.  **Unit Testing (Jest/Vitest):**
    *   Write/update unit tests for:
        *   `upsertTemporalSendEarnDeposit` (mock Supabase client, test null vault handling).
        *   `updateTemporalSendEarnDeposit` (mock Supabase client).
        *   `getUserIdFromAddress` (mock Supabase client, test found/not found cases).

## Phase 3: Temporal Activities and Unit Testing

1.  **Implement/Update Activities (`packages/workflows/src/deposit-workflow/activities.ts`):**
    *   Update `upsertTemporalDepositActivity` input type (`TemporalDepositInsert`) to allow optional/null `vault`, ensuring it calls the modified Supabase helper correctly.
    *   Implement `getVaultFromFactoryDepositActivity`:
        *   Input: `transactionHash: \`0x\${string}\``.
        *   Logic: Query `public.send_earn_deposit` table using the `transactionHash` to retrieve the associated `vault` address. Handle cases where the record or vault is not found. Return `Address | null`.
    *   Implement `upsertReferralRelationshipActivity`:
        *   Input: `referrerAddress: Address`, `referredAddress: Address`.
        *   Logic:
            1.  Query `public.send_earn_new_affiliate` using the `referrerAddress` (and potentially other relevant identifiers like `referredAddress` or tx info if available in that table) to validate if this specific deposit corresponds to a new affiliate creation event. *(Action: Need to confirm the exact schema and query logic for `send_earn_new_affiliate`)*.
            2.  If validated as a new affiliate referral for this context:
                *   Use `getUserIdFromAddress` for both `referrerAddress` and `referredAddress`.
                *   If both UUIDs (`referrerUuid`, `referredUuid`) are found, call `supabaseAdmin.from('referrals').insert({ referrer_id: referrerUuid, referred_id: referredUuid }, { ignoreDuplicates: true })`. **Note:** This relies on the unique constraint on `referred_id` to prevent duplicates for the same referred user, effectively implementing "first referrer wins". Using `insert` with `ignoreDuplicates: true` handles the conflict implicitly.
            3.  Log outcomes (validated/not validated, users found/not found, insert success/ignored due to conflict/DB error).
            4.  Handle errors appropriately (retryable for DB connection, non-retryable/warning otherwise).
    *   Verify other activities (`decode...`, `simulate...`, `send...`, `waitFor...`) are suitable.
2.  **Unit Testing (Jest/Vitest):**
    *   Write/update unit tests for:
        *   `upsertTemporalDepositActivity` (mock `upsertTemporalSendEarnDeposit`).
        *   `getVaultFromFactoryDepositActivity` (mock Supabase client/query, test found/not found).
        *   `upsertReferralRelationshipActivity` (mock Supabase client, `getUserIdFromAddress`, test validation logic against `send_earn_new_affiliate`, upsert call, error handling).

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
        10. Initialize `vaultAddressBytea: PgBytea | null`.
        11. **If `isFactoryDeposit(depositCall)`:**
            *   `try...catch` block for vault fetch.
            *   Call `getVaultFromFactoryDepositActivity(receipt.transactionHash)` -> `fetchedVaultAddress: Address | null`.
            *   If `fetchedVaultAddress`, set `vaultAddressBytea = hexToBytea(fetchedVaultAddress)`. Log outcome.
        12. **If `isFactoryDeposit(depositCall)`:**
            *   `try...catch` block for referral upsert.
            *   Call `upsertReferralRelationshipActivity(depositCall.referrer, depositCall.owner)`. Log outcome.
        13. Call final `updateTemporalDepositActivity` (status 'confirmed', update `tx_hash`, update `vault: vaultAddressBytea`).
    *   Ensure workflow does not fail after a successful UserOp receipt (steps 11 & 12 should be in try-catch).
    *   Ensure all necessary imports (`hexToBytea`, type guards).
    *   Register workflow in `all-workflows.ts`.
2.  **Workflow Unit Testing (Temporal Testing Framework):**
    *   Write/update workflow tests:
        *   Mock all activities (`proxyActivities`).
        *   Test the `VaultDeposit` path to successful confirmation.
        *   Test the `FactoryDeposit` path, covering:
            *   Successful vault fetch and successful referral upsert.
            *   Successful vault fetch and referral activity skipped/warns (e.g., users not found, not validated).
            *   Failed vault fetch (ensure workflow proceeds to final update).
            *   Failed referral upsert (ensure workflow proceeds to final update).
        *   Test error handling paths (e.g., activity failures before `sendUserOpActivity` should fail workflow).

*(End-to-End tests using Playwright are excluded for now)*.
