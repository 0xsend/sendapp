# TODO - Squash Contacts Migrations

## Completed
- [x] Identify contacts-related migrations (iteration 1)
  - Found 7 migrations to squash:
    - 20251226231307_add_contact_book.sql
    - 20251226233835_add_owner_id_defaults.sql
    - 20251229045519_add_contact_labels_and_lookup.sql
    - 20251229055245_add_include_archived_to_contact_search.sql
    - 20251229092809_fix_label_id_ambiguous.sql
    - 20251229174700_add_contact_label_limit_trigger.sql
    - 20251229180444_add_sort_by_recency_parameter.sql
- [x] Stop Supabase, delete old migrations, generate single migration
  - Generated `20251230064903_contacts_feature.sql`
  - Fixed type ordering: added `contact_search_result` type at migration start
  - Removed duplicate type definition from middle of file
- [x] Reset database and run Supabase tests (701 tests passed)
- [x] Run `yarn build` - PASSED
- [x] Run unit tests (packages/app) - 389 passed
- [x] Run contacts E2E tests - 34/34 PASSED

## Pending
- [x] Commit all changes

## Blocked
(none)

## Notes
- The contacts feature migrations have been successfully squashed into a single migration
- All contacts-specific tests pass (pgTAP and E2E)
- Some flaky failures exist in other E2E tests (pre-existing timing issues, not related to this change)
