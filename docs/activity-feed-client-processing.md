# Activity Feed Client-Side Processing

This document provides a comprehensive guide to the activity feed system in the Send App, with a focus on the client-side processing layer that enables virtual event types.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Structure](#database-structure)
4. [Client-Side Processing](#client-side-processing)
5. [Virtual Event Types](#virtual-event-types)
6. [Code Flow](#code-flow)
7. [Extending the System](#extending-the-system)
8. [Troubleshooting](#troubleshooting)

## Overview

The activity feed displays a chronological list of user activities within the Send App, such as transfers, deposits, withdrawals, and other events. While most events can be directly mapped from their database representation to a user-friendly display, some events require additional context to be correctly classified.

For example, a `send_account_transfer` event that transfers tokens to a Send Earn vault should be displayed as a "Send Earn Deposit" rather than a generic "Withdraw". This contextual processing is handled by a client-side layer that examines the event data and can override the event type when necessary.

## Architecture

The activity feed system consists of several components:

1. **Database Layer**: A Supabase view (`activity_feed`) that aggregates events from various tables
2. **Data Fetching Layer**: React Query hooks that fetch and paginate the activity data
3. **Processing Layer**: Client-side functions that analyze and potentially modify the event data
4. **Display Layer**: React components that render the processed activities

This architecture allows for a clean separation of concerns while enabling powerful client-side processing without requiring database schema changes.

## Database Structure

Events are stored in the database with the following key fields:

- `event_name`: A string identifier for the event type (e.g., `send_account_transfers`)
- `data`: A JSON object containing event-specific data
- `from_user`: Information about the sender (if applicable)
- `to_user`: Information about the receiver (if applicable)
- `created_at`: Timestamp of when the event occurred

The `activity_feed` view in Supabase aggregates these events and provides a unified interface for querying.

## Client-Side Processing

The client-side processing layer is responsible for examining the raw event data and potentially overriding the `event_name` based on contextual information. This is implemented in the `processActivity` and `processActivities` functions in `packages/app/utils/activity.ts`.

```typescript
/**
 * Processes an activity to determine if its event_name should be overridden based on contextual data.
 * This allows for more accurate event classification without changing the database schema.
 *
 * @param activity The original activity from the database
 * @param addressBook The address book containing known addresses and their labels
 * @returns A processed activity with potentially modified event_name
 */
export function processActivity(activity: Activity, addressBook: AddressBook): Activity {
  // Clone the activity to avoid mutating the original
  const processedActivity = { ...activity };

  // Rule 1: Send Account Transfer to Send Earn Vault should be a Send Earn Deposit
  if (
    isSendAccountTransfersEvent(activity) &&
    activity.to_user?.send_id === undefined && // Currently identified as a "Withdraw"
    addressBook[activity.data.t] === 'Send Earn' // Destination is a Send Earn vault
  ) {
    // Override the event_name to our virtual event type
    processedActivity.event_name = Events.SendEarnDeposit;
  }

  // Add more rules here as needed

  return processedActivity;
}
```

This function is called after fetching activities from the database but before displaying them to the user. It uses the `addressBook` to identify known addresses, such as Send Earn vaults.

## Virtual Event Types

Virtual event types are event types that don't exist in the database but are created client-side to represent specific contexts or scenarios. They are defined in the `Events` enum in `packages/app/utils/zod/activity/events.ts`:

```typescript
export enum Events {
  // Database events (actual event_name values from the database)
  SendAccountTransfers = 'send_account_transfers',
  TagReceipts = 'tag_receipts',
  TagReceiptUSDC = 'tag_receipt_usdc',
  Referrals = 'referrals',
  SendAccountReceive = 'send_account_receives',

  // Virtual events (client-side only)
  SendEarnDeposit = 'send_earn_deposit', // Virtual event for Send Earn deposits
}
```

Virtual events are handled in the display functions (`eventNameFromActivity` and `phraseFromActivity`) just like regular events:

```typescript
export function eventNameFromActivity(activity: Activity) {
  const { event_name, from_user, to_user, data } = activity;

  switch (true) {
    // Virtual events (client-side processed)
    case event_name === Events.SendEarnDeposit:
      return 'Send Earn Deposit';

    // Database events
    case isERC20Transfer && isAddressEqual(data.f, sendtagCheckoutAddress[baseMainnet.id]):
      return 'Referral Reward';
    // ... other cases
  }
}
```

## Code Flow

Here's the complete flow of activity data through the system:

1. **Database Query**: The `useActivityFeed` or `useTokenActivityFeed` hook queries the `activity_feed` view in Supabase.

2. **Data Parsing**: The raw data is parsed using Zod schemas to ensure type safety:
   ```typescript
   const activities = EventArraySchema.parse(data);
   ```

3. **Client-Side Processing**: The parsed activities are processed to identify special cases:
   ```typescript
   if (addressBook.data) {
     return processActivities(activities, addressBook.data);
   }
   ```

4. **Display**: The processed activities are rendered by React components, which use functions like `eventNameFromActivity` to determine how to display each activity.

## Extending the System

To add support for a new virtual event type:

1. **Add the Event Type**: Add a new entry to the `Events` enum in `packages/app/utils/zod/activity/events.ts`:
   ```typescript
   export enum Events {
     // ... existing events

     // Virtual events
     SendEarnDeposit = 'send_earn_deposit',
     NewVirtualEvent = 'new_virtual_event', // Add your new virtual event here
   }
   ```

2. **Add Processing Logic**: Add a new rule to the `processActivity` function in `packages/app/utils/activity.ts`:
   ```typescript
   export function processActivity(activity: Activity, addressBook: AddressBook): Activity {
     const processedActivity = { ...activity };

     // Existing rules...

     // New rule for your virtual event
     if (/* condition for identifying the new virtual event */) {
       processedActivity.event_name = Events.NewVirtualEvent;
     }

     return processedActivity;
   }
   ```

3. **Update Display Functions**: Add cases for your new virtual event in `eventNameFromActivity` and `phraseFromActivity`:
   ```typescript
   export function eventNameFromActivity(activity: Activity) {
     switch (true) {
       // ... existing cases

       case event_name === Events.NewVirtualEvent:
         return 'User-Friendly Event Name';

       // ... other cases
     }
   }

   export function phraseFromActivity(activity: Activity) {
     switch (true) {
       // ... existing cases

       case event_name === Events.NewVirtualEvent:
         return 'Action phrase for the event';

       // ... other cases
     }
   }
   ```

## Troubleshooting

### Common Issues

1. **Virtual Event Not Displaying Correctly**: Ensure that the virtual event is properly defined in the `Events` enum and that there are cases for it in both `eventNameFromActivity` and `phraseFromActivity`.

2. **Processing Rule Not Working**: Check that the condition in the `processActivity` function correctly identifies the events that should be processed. You may need to log the activity data to debug the condition.

3. **AddressBook Not Available**: The processing depends on the `addressBook` being available. If it's not, the processing will be skipped. Ensure that the `useAddressBook` hook is working correctly.

### Debugging Tips

- Use the browser console to log activities at different stages of the processing pipeline.
- Add temporary logging to the `processActivity` function to see which rules are being triggered.
- Check the network tab to ensure that the activity data is being fetched correctly from the database.

## Conclusion

The client-side processing layer provides a flexible way to enhance the activity feed without requiring database changes. By using virtual event types, we can accurately represent complex activities like Send Earn deposits while maintaining a clean separation between the database schema and the user interface.

This approach is extensible and can be adapted to handle new types of activities as the Send App evolves.
