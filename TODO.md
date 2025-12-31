# TODO - Bridge Webhook Migration

## Completed
- [x] Review migration plan and current implementation (iteration 1)
- [x] Update `KycStatus` enum to include `awaiting_questionnaire` and `awaiting_ubo`
- [x] Update `WebhookEventSchema` to use `event_*` payload format
- [x] Update `verifyWebhookSignature` to use RSA-SHA256 with timestamp
- [x] Add `extractTosStatusFromEvent` helper
- [x] Add `isVirtualAccountActivityEvent` helper (rename from `isDepositEvent`)
- [x] Update exports in `index.ts`
- [x] Update webhook API route to use new event format
- [x] Add test file `packages/bridge/src/__tests__/webhooks.test.ts`
- [x] Write tests for signature verification (29 tests passing)
- [x] Write tests for status extraction helpers
- [x] Run type check on bridge package (passes)
- [x] Run type check on Next.js app (webhook route passes)
- [x] Run lint check (passes)
- [x] Run tests (29 tests passing)
- [x] Update migration plan checklist
- [x] Update `.env.local.template` with `BRIDGE_WEBHOOK_PUBLIC_KEY`
- [x] Fix payment_rail fallback to use 'ach_push' (DB constraint compliance)
- [x] Mark remaining checklist items as explicitly out of scope

## In Progress
(none)

## Pending
(none - all success criteria met)

## Blocked
(none)

## Notes
- Current implementation now uses RSA-SHA256 signature verification with timestamped payload
- Event schema uses `event_id`, `event_type`, `event_category`, `event_object`, etc.
- Tests directory created with comprehensive unit tests
- payment_rail defaults to 'ach_push' when missing (DB only allows 'ach_push' or 'wire')
- Out of scope items marked in checklist:
  - Dashboard webhook URL configuration (deployment/ops task)
  - Integration tests for KYC and deposit event processing
