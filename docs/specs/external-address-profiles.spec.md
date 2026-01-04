# External Address Profile Pages

## Summary

Support viewing profile pages for external Ethereum addresses at `/profile/{address}` URLs (e.g., `/profile/0x3F0E41d5C1654C862Ba5629e40eFAD30Ed7AEed5`).

## Problem

Currently, visiting a profile URL with an Ethereum address shows "Not found" instead of useful information about that address. The `profile_lookup` RPC already supports `lookup_type = 'address'`, but no route handles address-based URLs.

## Current Behavior

- `/profile/{sendid}` - Works for numeric SendIDs
- `/{tag}` - Works for SendTags
- `/profile/{address}` - Returns 404 "Not found"

## Proposed Behavior

### Case 1: Address has a Send account

**Redirect** to the canonical profile URL:
- If user has a tag: redirect to `/{tag}`
- Otherwise: redirect to `/profile/{sendid}`

This ensures SEO consistency and a single source of truth for each profile.

### Case 2: Address has no Send account

Display a minimal address profile page with:

1. **Address display** - Truncated format with copy button (e.g., `0x8335...2913`)
2. **Activity feed** - Reuse existing activity feed component, showing bidirectional transfers between current user and this address (20 items with infinite scroll)
3. **Send button** - Initiate send flow to this address
4. **View History link** - Navigate to `/profile/{address}/history` for full history
5. **Block explorer link** - External link to Basescan

**NOT shown:**
- On-chain balances (removed for external addresses)
- Contract/EOA indicator (not needed)

### Header/Navigation

- Back button: Show back arrow only, no text title (fixes `#undefined` bug)
- Header should not display a tag/name since external addresses don't have one

## Address Linking

All `0x` addresses throughout the app should be clickable links to `/profile/{address}`:

1. **Activity page** - Address in activity rows links to profile
2. **Send flow** - Recipient address in send confirmation links to profile
3. **Transaction details** - Sender/recipient addresses link to profile

This enables discovery of external address profiles from any context.

## Activity Feed Behavior

### On External Address Profile Page

- Reuse existing `ActivityFeed` component
- Filter to show bidirectional transfers between current user and this address
- Show 20 items initially with infinite scroll
- Tapping a row opens transaction details in a modal/sheet
- Empty state: "No transaction history" message

### In Send Flow

When sending to an external address, the send flow should show:
- Past ERC20 transfers between you and this address (bidirectional)
- This helps users see their transaction history with the recipient

## Technical Implementation

### Routing Strategy

Modify existing `/profile/[sendid]/index.tsx` to detect identifier type:

```typescript
// In getServerSideProps
const identifier = params.sendid as string

// Detect if address format (0x + 40 hex characters)
const isAddress = /^0x[a-fA-F0-9]{40}$/.test(identifier)
const isNumeric = !isNaN(Number(identifier))

if (isAddress) {
  // Look up by address
  const { data: profile } = await supabaseAdmin
    .rpc('profile_lookup', { lookup_type: 'address', identifier })
    .maybeSingle()

  if (profile) {
    // Redirect to canonical URL
    const redirectUrl = profile.tag ? `/${profile.tag}` : `/profile/${profile.sendid}`
    return { redirect: { destination: redirectUrl, permanent: false } }
  }

  // No Send account - render minimal address view
  return { props: { address: identifier, isExternalAddress: true } }
}

if (isNumeric) {
  // Existing sendid lookup logic
}

return { notFound: true }
```

### Component Updates

1. **ExternalAddressProfile** - Minimal profile view for non-Send addresses
   - Remove balances section
   - Add inline activity feed (reuse ActivityFeed with address filter)
   - Fix header to show no title (just back arrow)

2. **ActivityFeed** - Add support for external address filtering
   - New prop: `externalAddress?: Address`
   - Filter: bidirectional transfers between current user and external address

3. **Address components** - Make addresses clickable
   - Wrap address displays in Link to `/profile/{address}`
   - Apply to: ActivityRow, SendConfirmation, TransactionDetails

### Data Sources

- **Activity**: Query `activity` table filtered by:
  ```sql
  (from_user_id = current_user AND to_address = external_address)
  OR (to_user_id = current_user AND from_address = external_address)
  ```
- No balance queries for external addresses

### Validation

- Address format: `/^0x[a-fA-F0-9]{40}$/`
- Invalid addresses return 404 (standard not found page)
- Support all address types (EOAs and contracts) identically

## Routes Summary

| URL Pattern | Behavior |
|-------------|----------|
| `/profile/{address}` | Redirect if Send account exists, else show minimal view with activity |
| `/profile/{address}/history` | Full transaction history with this address |
| `/profile/{sendid}` | Existing behavior (unchanged) |
| `/{tag}` | Existing behavior (unchanged) |

## Success Criteria

1. Visiting `/profile/0x...` shows useful page instead of "Not found"
2. If address has Send account, redirects to canonical profile
3. External address profile shows activity feed (not send flow by default)
4. Activity feed shows bidirectional transfers with 20 items + infinite scroll
5. Tapping activity row opens transaction details modal
6. Back button shows arrow only, no `#undefined`
7. No balances shown for external addresses
8. All 0x addresses in app are clickable links to profile
9. Send flow shows ERC20 transfer history with recipient
10. Invalid addresses return 404

## Open Issues to Fix

| Issue | Current Behavior | Expected Behavior |
|-------|-----------------|-------------------|
| Back button | Shows `#undefined` | Shows back arrow only |
| Balances | Shows on-chain balances | Hidden for external addresses |
| Default view | Opens send flow | Shows activity feed inline |
| Send flow history | No history shown | Shows ERC20 transfers with address |
| Address linking | Addresses are plain text | Addresses link to `/profile/{address}` |

## Out of Scope (v1)

- ENS name resolution
- Multi-chain data (Ethereum mainnet, etc.)
- Contract detection/special handling
- "Invite to Send" flow
