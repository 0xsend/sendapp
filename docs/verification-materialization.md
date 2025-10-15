# Verification materialization

## send_accounts: add generated address_bytes

Why:
- Avoid repeated hex decode of addresses at query time; speed up joins and deltas in balance sync paths.
- Schema-first change to support on-demand SAB lookups without new triggers.

Test plan:
- Generate migration: yarn --cwd supabase migration:diff verification_materialization_address_bytes
- Reset DB: yarn --cwd supabase reset
- Focused tests: yarn --cwd supabase test supabase/tests/tags_search_test.sql supabase/tests/tags_search_and_lookup_test.sql
- Expected: both files PASS

References (style/quality):
- supabase/schemas/link_in_bio.sql — uses GENERATED ALWAYS STORED for computed column (domain); mirrors generated column pattern and quoting style.
- supabase/schemas/send_account_receives.sql — uses GENERATED ALWAYS STORED for event_id and btree indexes; mirrors index naming and placement.
- supabase/schemas/send_token_transfers.sql — demonstrates index conventions and SECURITY DEFINER patterns we follow across schemas.
- /tmp/verification-balance-materialization-spec.md — source spec for address_bytes and SAB.
