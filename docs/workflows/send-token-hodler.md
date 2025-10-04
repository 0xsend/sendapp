# Temporal-driven SEND balances and hodler verification

Summary
- Move from DB-advancer to Temporal-driven updates that read balanceOf at transfer confirmation.
- Track only SEND token for now; persist balances into public.token_balances and upsert distribution_verifications type=send_token_hodler with weight=balance.
- Enable RLS so users can SELECT their own balances directly.

Scope (phase 0–2)
- SEND-only, ERC-20 balanceOf via configured RPC; native ETH/outside ERC-20s are out-of-scope for this PR (design leaves room to support later).
- Persist for `from` always; also persist for `to` only when both are Send Accounts.
- Read point: after receipt is available (no additional confirmations for now).
- DB reads: direct SELECT from public.token_balances (RLS enforced: user sees own rows only).

What changes
- Temporal transfer workflow (packages/workflows/src/transfer-workflow/workflow.ts):
  - After a transfer is confirmed, add two activities per applicable participant:
    1) readAndPersistBalance (reads balanceOf for SEND token, upserts public.token_balances)
    2) upsertSendTokenHodlerVerification (upserts distribution_verifications with type=send_token_hodler, weight=balance)
  - Only execute when decoded token is the SEND token for the active chain; skip otherwise.
  - Apply to `from`; apply to `to` only if it’s also a Send Account.
- Activities (packages/workflows/src/transfer-workflow/activities.ts):
  - Implement readAndPersistBalance using existing wagmi patterns (distribution-workflow/wagmi.ts → readSendTokenBalanceOf) and Supabase admin upsert (pattern from deposit-workflow/activities.ts).
  - Implement upsertSendTokenHodlerVerification with ON CONFLICT (distribution_id, user_id, type) DO UPDATE; metadata NULL, weight=balance.
  - Resolve current distribution at run-time (qualification window contains now()).
- Database (supabase/migrations/*):
  - Add enum value send_token_hodler to verification_type.
  - Enable RLS on public.token_balances and add policy: authenticated users can SELECT their own rows.

Out of scope (future increments)
- Cleanup of prior advancer/cursor/functions/views (not needed here since we branch off dev without those).
- Native ETH and arbitrary ERC-20 support: design notes indicate token can be NULL in token_balances for ETH; actual schema change is deferred to a follow-up PR to avoid breaking PK (user_id, token). For now, SEND-only means token remains NOT NULL.
- One-shot/batch backfill workflow to seed balances before deploying Temporal path (to be implemented after core activities land).

Why this correlates to existing patterns
- Activities DB write patterns mirror deposit-workflow/activities.ts (Supabase admin, retryable vs non-retryable ApplicationFailure).
- balanceOf reads mirror distribution-workflow/wagmi.ts (readSendTokenBalanceOf(config, { args: [address], chainId })).
- Upsert patterns for public tables mirror prior direct inserts in deposit activities (e.g., referrals) and composite ON CONFLICT strategies used elsewhere.

Test plan (high level)
- Migration:
  - Apply migration in staging; verify new enum value; verify RLS policy allows only own rows.
- Workflow (staging):
  - Perform a SEND token transfer between two Send Accounts; observe public.token_balances updated for both; distribution_verifications row upserted for type=send_token_hodler with weight=balance.
  - Perform a SEND token transfer where `to` is not a Send Account; observe balance persisted for `from` only.
- Backfill (later PR):
  - Run one-shot workflow to seed balances; verify rows inserted/updated and verifications optionally upserted.
