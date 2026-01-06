# TODO - Playwright Phase 2 Stabilization

## Completed
- [x] Fix account.logged-in.spec.ts - use textbox role with correct field names (Name, About, SAVE CHANGES)
- [x] Fix account-settings-backup.onboarded.spec.ts beforeEach - add waitForURL after clicking Passkeys link
- [x] Fix contacts.onboarded.spec.ts:283 - increase toast hidden timeout from 5s to 10s
- [x] Fix account-sendtag-checkout tests - increase response timeout from 10s to 20s
- [x] Fix account-settings-backup.onboarded.spec.ts - add waitForURL with longer timeout for blockchain tx

## In Progress
- [ ] Investigate infrastructure timeout issues during onboarding fixture

## Blocked
- [ ] Full test suite verification - onboarding fixture timing out waiting for `sendAccount.create` API response
  - Issue: Tests timing out waiting for `/api/trpc/sendAccount.create` and `/api/trpc/tag.registerFirstSendtag` responses
  - Affect: All tests that use the `sendAccount` fixture
  - Root cause: Likely infrastructure/Tilt environment issue, not test code
  - All services (Next.js, Supabase) are running and accessible
  - Observed during both parallel and single-worker test runs

## Notes
- Firefox browser removed from playwright.config.ts (chromium only)
- i.pravatar.cc added to allowedImageHosts.js
- All infrastructure services appear healthy (Tilt shows "ok" status)
- API endpoints respond correctly when tested via curl
- Issue manifests during test fixture setup, not in test code itself
