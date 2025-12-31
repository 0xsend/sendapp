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
- Integration tests (KYC/deposit event processing) marked as out of scope for this iteration
- Dashboard webhook URL configuration is a deployment step
