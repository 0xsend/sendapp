# Phase 2: API Layer Updates

**Status**: 🚨 CRITICAL BLOCKING ISSUE - `registerFirstSendtag` breaks all new user onboarding

## Objective

Fix critical API endpoints to properly integrate with the send_account_tags architecture and add missing validation.

## Summary

**Database Layer**: ✅ Fully implemented and tested (All tests passing - 100% pass rate)
**API Layer**: 🚨 One critical issue blocks shipping the entire feature

The database foundation is solid, but a single API endpoint (`registerFirstSendtag`) bypasses the new junction table architecture, breaking new user onboarding. This must be fixed before the feature can ship.

**Time to ship**: 2-4 hours to fix the critical API issue + testing

## Critical Issues

### 🚨 Issue 1: registerFirstSendtag Broken (BLOCKS SHIPPING)
**Priority**: Must fix immediately - BREAKS ALL NEW USER ONBOARDING

**Problem**: 
- `registerFirstSendtag` bypasses `send_account_tags` junction table
- Uses direct `user_id` insertion instead of `send_account_id`
- New users' first sendtags not properly linked to send accounts

**Location**: `packages/api/src/routers/tag/router.ts:130-164`

**Current Code** (incorrect):
```typescript
const result = await ctx.db
  .insert(tags)
  .values({
    name: input.name,
    user_id: ctx.user.id, // ❌ Should use send_account_id
  })
  .returning()
```

**Should Be**:
```typescript
const result = await ctx.db.rpc('create_tag', {
  tag_name: input.name,
  send_account_id: input.sendAccountId // ✅ Use junction table
})
```

### ⚠️ Issue 2: updateMainTag Validation Missing (HIGH)
**Priority**: Security vulnerability

**Problem**:
- No validation that tag exists
- No check that tag belongs to user's send account  
- No verification tag is confirmed (not pending)
- Users can set `main_tag_id` to invalid values

**Location**: `packages/api/src/routers/sendAccount.ts:453-479`

## Implementation Tasks

### Task 2.1: Fix registerFirstSendtag API

**File**: `packages/api/src/routers/tag/router.ts`

**Changes Required**:

1. **Update Input Schema**:
```typescript
const registerFirstSendtagInput = z.object({
  name: z.string(),
  sendAccountId: z.string().uuid(), // Add this field
})
```

2. **Update Implementation**:
```typescript
registerFirstSendtag: publicProcedure
  .input(registerFirstSendtagInput)
  .mutation(async ({ ctx, input }) => {
    // Verify send account belongs to user
    const sendAccount = await ctx.db.query.sendAccounts.findFirst({
      where: and(
        eq(sendAccounts.id, input.sendAccountId),
        eq(sendAccounts.user_id, ctx.user.id)
      )
    })
    
    if (!sendAccount) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Send account not found'
      })
    }

    // Use create_tag RPC function
    const result = await ctx.db.rpc('create_tag', {
      tag_name: input.name,
      send_account_id: input.sendAccountId
    })

    // Auto-confirm since it's free first sendtag
    await ctx.db.rpc('confirm_tags', {
      send_account_id: input.sendAccountId,
      tag_name: input.name
    })

    // Set as main tag if user has no main tag
    if (!sendAccount.main_tag_id) {
      await ctx.db
        .update(sendAccounts)
        .set({ main_tag_id: result[0].id })
        .where(eq(sendAccounts.id, input.sendAccountId))
    }

    return result[0]
  })
```

### Task 2.2: Fix Frontend Calls to registerFirstSendtag

**Files to Update**:
- `packages/app/features/auth/sign-up/screen.tsx`
- `packages/app/features/auth/onboarding/screen.tsx`

**Changes Required**:

1. **Sign-up Screen** (`packages/app/features/auth/sign-up/screen.tsx`):
```typescript
// Current (incorrect)
const createdSendAccount = await createAccount()
await registerFirstSendtagMutateAsync({ name: validatedSendtag })

// Fix to (correct)
const createdSendAccount = await createAccount()
await registerFirstSendtagMutateAsync({ 
  name: validatedSendtag,
  sendAccountId: createdSendAccount.id 
})
```

2. **Onboarding Screen** (`packages/app/features/auth/onboarding/screen.tsx`):
```typescript
// Current (incorrect) 
const createdSendAccount = await createAccount()
await registerFirstSendtagMutateAsync({ name: validatedSendtag })

// Fix to (correct)
const createdSendAccount = await createAccount()
await registerFirstSendtagMutateAsync({ 
  name: validatedSendtag,
  sendAccountId: createdSendAccount.id 
})
```

### Task 2.3: Add updateMainTag Validation

**File**: `packages/api/src/routers/sendAccount.ts`

**Add Validation Logic**:
```typescript
updateMainTag: protectedProcedure
  .input(z.object({
    tagId: z.number()
  }))
  .mutation(async ({ ctx, input }) => {
    // Get user's send account
    const sendAccount = await ctx.db.query.sendAccounts.findFirst({
      where: eq(sendAccounts.user_id, ctx.user.id)
    })
    
    if (!sendAccount) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Send account not found'
      })
    }

    // Validate tag exists and belongs to user
    const tagOwnership = await ctx.db
      .select()
      .from(sendAccountTags)
      .innerJoin(tags, eq(sendAccountTags.tag_id, tags.id))
      .where(and(
        eq(sendAccountTags.send_account_id, sendAccount.id),
        eq(sendAccountTags.tag_id, input.tagId),
        eq(tags.status, 'confirmed') // Must be confirmed
      ))
      .limit(1)

    if (tagOwnership.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Tag not found or not confirmed for this send account'
      })
    }

    // Update main tag
    const result = await ctx.db
      .update(sendAccounts)
      .set({ main_tag_id: input.tagId })
      .where(eq(sendAccounts.id, sendAccount.id))
      .returning()

    return result[0]
  })
```

### Task 2.4: Update tag.delete Endpoint

**File**: `packages/api/src/routers/tag/router.ts`

**Add Validation**:
```typescript
delete: protectedProcedure
  .input(z.object({
    tagId: z.number()
  }))
  .mutation(async ({ ctx, input }) => {
    const sendAccount = await ctx.db.query.sendAccounts.findFirst({
      where: eq(sendAccounts.user_id, ctx.user.id)
    })

    if (!sendAccount) {
      throw new TRPCError({
        code: 'NOT_FOUND', 
        message: 'Send account not found'
      })
    }

    // Cannot delete main tag
    if (sendAccount.main_tag_id === input.tagId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot delete main tag. Set a different main tag first.'
      })
    }

    // Verify ownership
    const ownership = await ctx.db
      .select()
      .from(sendAccountTags)
      .where(and(
        eq(sendAccountTags.send_account_id, sendAccount.id),
        eq(sendAccountTags.tag_id, input.tagId)
      ))
      .limit(1)

    if (ownership.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Tag not found for this send account'
      })
    }

    // Delete from junction table and update tag status
    await ctx.db.transaction(async (tx) => {
      await tx
        .delete(sendAccountTags)
        .where(and(
          eq(sendAccountTags.send_account_id, sendAccount.id),
          eq(sendAccountTags.tag_id, input.tagId)
        ))

      await tx
        .update(tags)
        .set({ 
          status: 'available',
          user_id: null 
        })
        .where(eq(tags.id, input.tagId))
    })

    return { success: true }
  })
```

## Error Handling

### Standard Error Responses
```typescript
// Not found errors
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Resource not found'
})

// Validation errors
throw new TRPCError({
  code: 'BAD_REQUEST', 
  message: 'Invalid request parameters'
})

// Permission errors
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'Insufficient permissions'
})
```

### Database Transaction Safety
```typescript
// Use transactions for multi-table operations
await ctx.db.transaction(async (tx) => {
  // Multiple operations here
  // All succeed or all rollback
})
```

## Testing

### API Tests to Run
```bash
cd packages/api && yarn test | cat
```

### Test Cases to Add

1. **registerFirstSendtag Tests**:
   - [ ] Successfully creates tag with send_account_id
   - [ ] Auto-confirms free first sendtag
   - [ ] Sets as main tag if none exists
   - [ ] Rejects invalid send_account_id
   - [ ] Rejects if send account doesn't belong to user

2. **updateMainTag Tests**:
   - [ ] Successfully updates main tag
   - [ ] Rejects non-existent tag
   - [ ] Rejects unconfirmed tag
   - [ ] Rejects tag not owned by user
   - [ ] Rejects if no send account

3. **tag.delete Tests**:
   - [ ] Successfully deletes non-main tag
   - [ ] Rejects deletion of main tag
   - [ ] Rejects if tag not owned
   - [ ] Updates tag status to 'available'

### Integration Testing
- [ ] Complete sign-up flow with first sendtag
- [ ] Complete onboarding flow with first sendtag
- [ ] Main tag selection flow
- [ ] Tag deletion flow

## Definition of Done

- [ ] `registerFirstSendtag` uses `send_account_id` and junction table
- [ ] Frontend sign-up/onboarding flows pass `sendAccountId`
- [ ] `updateMainTag` has comprehensive validation
- [ ] `tag.delete` prevents main tag deletion
- [ ] All API tests pass
- [ ] Error handling implemented
- [ ] Database transactions used appropriately
- [ ] No breaking changes to existing functionality

## Next Phase

After completion, proceed to **Phase 3: Frontend Components** to implement UI for the new functionality.