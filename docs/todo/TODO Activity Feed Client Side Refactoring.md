# Activity Feed Client Side Refactoring

After implementing the new activity feed client processing documented here, @/docs/activity-feed-client-processing.md, a number of TODOs were identified.

- Separate Database Events and Virtual Events into their own enums and then create a union for them. @/packages/app/utils/zod/activity/events.ts
- Finish send earn withdraw events.
- Create a branded or const type for Send App contract labels in the address book. @/packages/app/utils/useAddressBook.ts
- Centralize the activity event parse and process activity into a single function. Need proposals on the name and API for simplicity and maximum extensibility (who knows what parameters we may need in the future).
- Seeing unknown `unknown activity ` after adding the Send Earn Deposit virtual event.
- Unit tests for the new virtual events and increasing the coverage for the zod schemas.

Relevant files:

- `packages/app/features/home/utils/useTokenActivityFeed.ts`
- `packages/app/features/activity/utils/useActivityFeed.ts`
- `packages/app/utils/useAddressBook.ts`
- `packages/app/utils/activity.ts`
- `packages/app/utils/zod/activity/events.ts`
- `packages/app/utils/zod/activity/index.ts`

