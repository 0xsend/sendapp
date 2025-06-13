# Sendtags System: Complete Guide

## What Are Sendtags?

**Sendtags** (also called "tags") are unique usernames in the Send app that serve as human-readable identifiers for users. Think of them as "/handles" similar to Twitter usernames, but for cryptocurrency payments and social features. Users can send money to each other using sendtags instead of long wallet addresses.

### Key Characteristics
- **Unique**: Each sendtag is globally unique across the Send app
- **User-friendly**: Alphanumeric strings (1-20 characters, A-Z, a-z, 0-9, underscore)
- **Payment identifiers**: Send money using "/alice" instead of wallet addresses
- **Social identity**: Appear in activity feeds, profiles, and social interactions
- **Multiple per user**: Each user can own up to 5 sendtags under their Send account
- **Main tag**: Users designate one confirmed tag as their primary identity

### Example Use Cases
- Sending money: "Send $10 to /alice" 
- Social features: "/bob liked your transaction"
- Profile identity: Users choose a primary "main" sendtag for their public profile

## System Architecture

The sendtag system uses a three-table design that provides flexibility and proper data relationships:

### Core Tables
1. **`tags`** - Stores the actual sendtag data (name, status, timestamps)
2. **`send_account_tags`** - Junction table linking users' send accounts to their tags
3. **`send_accounts`** - User accounts with a reference to their main tag

### Relationship Model
```
User → Send Account → Send Account Tags → Tags
       ↑                                   ↑
       └─── main_tag_id ──────────────────┘
```

This design allows:
- Users to own multiple tags through the junction table
- Easy addition/removal of tag associations
- Automatic tag recycling when users release tags
- Clean separation between tag ownership and tag existence

## Tag Status Lifecycle

Each tag has a status that controls its availability and usage:

### Status Types
- **`pending`** - Tag claimed but payment not confirmed (30-minute expiration)
- **`confirmed`** - Tag paid for and verified on blockchain
- **`available`** - Previously owned tag that was released for reuse

### Lifecycle Flow
1. **Creation**: User claims a tag → status becomes `pending`
2. **Payment**: User pays and transaction is verified → status becomes `confirmed`  
3. **Usage**: Only `confirmed` tags can be used for payments and set as main tag
4. **Release**: User deletes tag association → status becomes `available` (if no other owners)
5. **Recycling**: Another user can claim `available` tags

### Business Rules
- Users can own maximum 5 tags at once
- Only confirmed tags work for payments and social features
- Pending tags expire after 30 minutes without payment
- Tag names are globally unique (case-insensitive)
- Available tags preserve their name but clear ownership

## Security Model

The system uses PostgreSQL Row Level Security (RLS) to ensure data privacy and integrity:

### Tag Visibility
- Users can only see tags they own through the junction table relationship
- Anonymous users cannot see any private tag data
- Confirmed tags may appear in public search results

### Tag Operations
- **Creation**: Users can only create tags for their own send accounts
- **Updates**: Users can only modify their own pending tags
- **Deletion**: Two-tier system - pending tags can be deleted directly, confirmed tags must be released through the junction table

### Data Integrity
- Foreign key constraints prevent orphaned references
- Triggers automatically manage main tag assignment and succession
- Business logic enforced at database level prevents invalid states

## Main Tag Feature

The main tag system designates one confirmed tag as a user's primary identity:

### Automatic Assignment
- When a user's first tag is confirmed, it automatically becomes their main tag
- No manual intervention required for basic functionality
- Ensures all users with confirmed tags have a main tag

### Manual Selection
- Users can change their main tag to any of their confirmed tags
- Only confirmed tags are eligible to be main tags
- Changes take effect immediately

### Succession Logic
- If a user's main tag is deleted, the system automatically promotes their next oldest confirmed tag
- If no other confirmed tags exist, main_tag_id is set to NULL
- Prevents users from being left without a main tag when they have other options

## Key Operations

### Tag Creation
When users create a new tag:
1. System checks if an `available` tag with that name exists and claims it
2. If no available tag exists, creates a new tag record
3. Creates association in `send_account_tags` junction table
4. Enforces 5-tag limit per user
5. New tag starts in `pending` status

### Tag Confirmation
When payment is verified:
1. Backend verifies blockchain transaction receipt
2. Updates tag status from `pending` to `confirmed`
3. Creates activity feed entries
4. Links to payment receipt for audit trail
5. If this is user's first confirmed tag, automatically sets as main tag

### Tag Release
Users can release tags in two ways:
1. **Cancel pending tags**: Direct deletion removes unpaid reservations
2. **Release confirmed tags**: Deleting from junction table releases ownership
   - If no other users own the tag, it becomes `available` for others
   - If it was the main tag, system automatically assigns new main tag
   - Tag name is preserved for potential reuse

## Integration Points

### Activity Feed
- Tag confirmation creates activity entries visible to user's network
- Tag operations include relevant metadata (transaction hashes, timestamps)
- Social features use confirmed tags for user identification

### Payment System  
- Confirmed tags serve as payment identifiers in send flows
- Receipt system links tag confirmations to blockchain transactions
- Payment validation prevents unauthorized tag confirmations

### Search Functionality
- Global search includes confirmed tags with fuzzy matching
- Search results respect user privacy settings
- Trigram indexing provides fast partial name matching

### Referral System
- Tag confirmation can establish referral relationships
- First tag registration may include referral codes
- Referral tracking contributes to user rewards and verification

## For Developers

### API Patterns
Most tag operations work through existing endpoints with automatic main tag handling. Only one new endpoint is needed:

```typescript
// Update main tag (only new API needed)
PUT /api/send-accounts/{id}
{ main_tag_id: tagId }

// Existing patterns continue to work:
POST /api/tags - creates tag, auto-assigns main if first
DELETE /api/send-account-tags/{id} - releases tag, auto-reassigns main if needed
```

### Query Patterns
```typescript
// Get user's tags with main tag indicator
const tags = await supabase
  .from('tags')
  .select(`
    *,
    is_main:send_accounts!inner(main_tag_id)
  `)
  .eq('send_accounts.user_id', userId)
```

### Key Constraints
- Tag names: 1-20 characters, alphanumeric + underscore only
- User limit: 5 active tags maximum
- Main tag: Must be one of user's confirmed tags
- Case sensitivity: Tag names are case-insensitive (stored as citext)
- Uniqueness: Tag names are globally unique

### Migration Considerations
For existing users, run migration to assign main tags:
- Sets main_tag_id to user's oldest confirmed tag
- New users get automatic assignment via triggers
- No breaking changes to existing APIs

### Testing Requirements
The system includes comprehensive test coverage for:
- Tag creation and confirmation flows with payment verification
- Main tag assignment and succession logic
- RLS policies ensuring proper data isolation
- Business rule enforcement (limits, validation, uniqueness)
- Integration with activity feeds and receipt systems

This architecture provides a robust, scalable foundation for the sendtag system while maintaining simplicity for developers and users.
