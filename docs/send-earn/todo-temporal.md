# Implementation Plan: Send Earn Deposit Temporal Workflow

## 1. Goal

Refactor the current client-side Send Earn deposit process to utilize a Temporal workflow for improved reliability, observability, and separation of concerns. This aligns the deposit flow with the existing pattern used for Send transfers.

## 2. Database Changes

We need a new table to track the state of deposit workflows.

*   **Create `temporal.send_earn_deposits` table:**
    *   Schema similar to `temporal.send_account_transfers`.
    *   Columns:
        *   `workflow_id` (TEXT, PRIMARY KEY)
        *   `status` (TEXT - e.g., 'initialized', 'submitted', 'sent', 'confirmed', 'failed')
        *   `owner` (BYTEA, nullable) - The address of the send account depositing the tokens
        *   `assets` (NUMERIC, nullable) - Amount of the ERC20 token being deposited
        *   `vault` (BYTEA, nullable) - Address of the vault contract
        *   `user_op_hash` (BYTEA, nullable)
        *   `tx_hash` (BYTEA, nullable)
        *   `activity_id` - (foreign key to public.activity, nullable)
        *   `error_message` (TEXT, nullable)
        *   `created_at` (TIMESTAMPTZ, default now())
        *   `updated_at` (TIMESTAMPTZ, default now())
    *   Add appropriate indexes (e.g., on `workflow_id`, `sender`, `status`).
    *   Create a Supabase migration file for this change (`supabase/migrations/20250329182006_create_temporal_send_earn_deposits.sql`).
    *   Create an `AFTER INSERT` trigger (`temporal.temporal_deposit_insert_pending_activity`) on `temporal.send_earn_deposits`:
        *   **Handles Nullable Fields:** Checks if `owner` is present. If `owner` is NULL (e.g., during initial record creation by the workflow before decoding), the trigger exits without creating an activity record.
        *   **Looks up User ID:** If `owner` is NOT NULL, looks up the `user_id` from `public.send_accounts`.
        *   **Inserts Pending Activity:** If `user_id` is found, inserts a record into `public.activity` with `event_name` = `'temporal_send_earn_deposit'`.
        *   **Stores Available Data:** Stores available details (`workflow_id`, `owner`, `assets`, `vault`) in the `activity.data` JSONB field, handling NULLs appropriately.
        *   **Updates Foreign Key:** Updates the `activity_id` column in the triggering `temporal.send_earn_deposits` row.
    *   Create triggers to delete the `'temporal_send_earn_deposit'` activity record after the deposit is indexed into `public.send_earn_deposit` (using the transaction hash to find the activity id to delete). *(Note: This deletion trigger is part of the `private.send_earn_deposit_trigger_insert_activity` function)*.
    *   Supabase pgtap tests (`supabase/tests/temporal_send_earn_deposits_test.sql`) to verify the triggers are working:
        *   Test setup requires inserting into `auth.users` and `public.send_accounts`.
        *   Test setup also requires inserting into `public.send_account_created` if simulating the final deposit event.
        *   Verify the correct `event_name` and `data` format in `public.activity`.
        *   **Verify Nullable Field Handling:** Includes tests to ensure records inserted with NULL `owner` do not create an activity entry initially.
        *   Verify the cleanup trigger correctly removes the pending activity upon `public.send_earn_deposit` insertion.

## 3. Temporal Workflow Implementation (`packages/workflows`)

*   **Define Activities (`src/deposit-workflow/activities.ts`):**
    *   Create a `createDepositActivities` function similar to `createTransferActivities`.
    *   Activities needed:
        *   `upsertTemporalDepositActivity`: Inserts the initial record into `temporal.send_earn_deposits` with status 'initialized'.
        *   `upsertTemporalDepositActivity`: Inserts or updates the record in `temporal.send_earn_deposits`. Handles initial insert with `owner`, `assets`, `vault` and subsequent status/hash updates.
        *   `simulateDepositActivity`: Simulates the deposit UserOperation using `pimlicoBundlerClient.simulateUserOperation`. (Consider reusing or adapting simulation logic if possible).
        *   `sendUserOpActivity`: Can likely reuse the existing activity from `transfer-workflow`.
        *   `waitForTransactionReceiptActivity`: Can likely reuse the existing activity from `transfer-workflow`.
        *   `getBaseBlockNumberActivity`: Can likely reuse the existing activity from `transfer-workflow`.

*   **Define Workflow (`src/deposit-workflow/workflow.ts`):**
    *   Create `DepositWorkflow` function
    *   Input: `userOp: UserOperation<'v0.7'>`, `owner: Address`, `assets: Address`, `vault: Address`.
    *   Workflow steps:
        1.  Get `workflowId` from `workflowInfo()`.
        2.  Call `upsertTemporalDepositActivity` with minimal data (status 'initialized', workflow_id) to create initial record.
        3.  Decode `userop.callData`: Use `app/utils/decodeDepositUserOp`, `viem`, and the appropriate ABI (Send Account `execute` or Send Earn `deposit`) to extract `assets` and `vault`.
        4.  Call `updateTemporalDepositActivity` to update record with decoded data (add `owner`, `assets`, `vault`).
        5.  Call `simulateDepositActivity`.
        6.  Call `updateTemporalDepositActivity` (status 'submitted').
        7.  Call `sendUserOpActivity` to submit the UserOp.
        8.  Call `updateTemporalDepositActivity` (status 'sent', add `user_op_hash`).
        9.  Call `waitForTransactionReceiptActivity`.
        10. Call `updateTemporalDepositActivity` (status 'confirmed', add `tx_hash`).
    *   Implement error handling (e.g., using `try...catch` and updating status to 'failed' with `error_message`).
    *   Register the new workflow in `packages/workflows/src/all-workflows.ts`.

## 4. API Layer (tRPC - `packages/api`)

*   **Update Router (`packages/api/src/routers/sendEarn.ts`):**
    *   Modify the existing `deposit` mutation.
    *   Input schema remains: `z.object({ userop: UserOperationSchema, sendAccountCalls: SendAccountCallsSchema, entryPoint: address })`.
    *   Updated Logic:
        1.  Get Temporal client (`getTemporalClient`).
        2.  **Validate UserOp:**
            *   Verify the decoded call is a valid deposit.
            *   Verify `userop.sender` matches the authenticated user's Send Account (`session.user.id`).
            *   Validate `assets` and `vault` addresses.
        3.  Calculate `userOpHash` using `getUserOperationHash`.
        4.  Construct `workflowId` (`temporal/deposit/{userId}/{userOpHash}`).
        5.  Start the `DepositWorkflow` using `client.workflow.start`, passing the `userop`.
        6.  Handle potential `WorkflowExecutionAlreadyStartedError` errors gracefully.
        7.  Return `{ workflowId }`.
*   **Register Router (`packages/api/src/routers/_app.ts`):** [DONE]
    *   No changes needed here if the router was already registered.

## 5. Frontend Changes (`packages/app`) [DONE]

*   **Refactor Deposit Screen (`packages/app/features/earn/deposit/screen.tsx`):** [DONE]
    *   Removed the existing `useMutation` hook and associated logic (`baseMainnetBundlerClient.sendUserOperation`, `waitForUserOperationReceipt`, `withRetry`).
    *   Kept the `signUserOp` logic.
    *   Imported `api` from `app/utils/api`.
    *   Introduced `api.sendEarn.deposit.useMutation()` hook.
    *   Created `handleDepositSubmit` function which:
        1.  Signs the UserOperation (`signUserOp`).
        2.  Calls `depositMutation.mutateAsync({ userop: signedUserOp, entryPoint: derivedEntryPoint, sendAccountCalls: derivedCalls })`.
    *   Updated the `SchemaForm`'s `onSubmit` prop to use `handleDepositSubmit`.
    *   Updated UI state (loading indicators, button disabled state, error display via toast) based on the `depositMutation` status (`isPending`, `isSuccess`, `isError`, `error`).
    *   Removed the local `useropState`.
    *   Corrected hook dependencies.

## 6. Testing Strategy

*   **Unit Tests:**
    *   Test activity logic, especially decoding and database interactions.
    *   Test workflow logic using the Temporal testing framework if possible.
*   **Database Tests (pgTap):**
    *   Verify the `temporal.temporal_deposit_insert_pending_activity` trigger correctly inserts into `public.activity` with the expected `event_name` and `data` format.
    *   Verify the cleanup trigger correctly removes the pending activity upon `public.send_earn_deposit` insertion.
    *   Ensure test setup correctly populates `auth.users` and `public.send_accounts` without relying on `chain_addresses`.
*   **Integration Tests:**
    *   Test the tRPC endpoint interaction with the Temporal client.
*   **End-to-End Tests (Playwright):**
    *   Create/update tests for the earn deposit flow, ensuring it completes successfully via the new workflow.
    *   Verify database state changes in `temporal.send_earn_deposits`.

## 7. Future Considerations (Optional)

*   **Notifications:** Add activities to notify the user upon successful confirmation or failure.
*   **Retries/Compensation:** Implement more sophisticated retry logic or compensation patterns within the workflow if needed.
*   **Monitoring:** Ensure Temporal UI and application logs provide adequate visibility into workflow execution.
