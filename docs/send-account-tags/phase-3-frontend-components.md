# Phase 3: Frontend Components

**Status**: 📋 READY TO START - Awaiting critical API fix

## Objective

Implement UI components to support multiple sendtags with main tag selection and visual indicators.

## Prerequisites

- ✅ Phase 1 (Database Schema) completed - 40/42 tests passing
- 🚨 Phase 2 (API Layer) blocked by `registerFirstSendtag` fix  
- ✅ `main_tag_id` and `main_tag_name` available in database schema
- 📋 Generate TypeScript types after API fix: `cd supabase && yarn generate`

## Ready to Work
Frontend development can begin in parallel with the API fix. The database schema is complete and the TypeScript types can be generated once the API is fixed.

## Core Requirements

### Main Tag Display Priority
1. Main tag (if set) - with visual indicators
2. First confirmed tag (fallback)
3. Profile name (fallback)
4. Send ID (final fallback)

### Visual Design System
- Main tags: `$primary` color in activity feeds
- Underline indicator: 2px primary color bar in management
- Main tag pill: Semi-transparent dark background with blur
- Delete buttons: `$red10Light` color

## Implementation Tasks

### Task 3.1: Sendtag Management Screen

**File**: `packages/app/features/account/sendtag/screen.tsx`

**Changes Required**:
- [ ] Add tag sorting logic (main tag first)
- [ ] Implement visual indicators for main tag
- [ ] Add main tag selection dialog
- [ ] Implement tag deletion with confirmation
- [ ] Add loading states and toast notifications

**Key Components**:
```tsx
function SendtagList({
  allTags,
  onUpdateMainTag,
  isUpdating,
  mainTagId,
}): JSX.Element

function TagItem({
  tag,
  isMainTag,
  onUpdateMainTag,
  isUpdating,
}): JSX.Element
```

**Business Rules**:
- Main tag cannot be deleted
- Non-main tags show delete button on hover
- Clicking non-main tag opens "set as main" dialog

### Task 3.2: Account Overview Updates

**File**: `packages/app/features/account/screen.tsx`

**Changes Required**:
- [ ] Add main tag pill component
- [ ] Update referral code display logic
- [ ] Position pill absolute top-right

**Visual Spec**:
```tsx
{mainTagName && (
  <XStack
    position="absolute"
    gap="$2"
    ai={'center'}
    top={'$5'}
    right={'$5'}
    p={'$2'}
    paddingRight={'$3'}
    br={'$4'}
    bc={'rgba(0,0,0, 0.25)'}
    $platform-web={{ backdropFilter: 'blur(5px)' }}
  >
    <IconSlash size={'$1.5'} color={'$white'} />
    <Paragraph size={'$5'} color={'$white'}>
      Main Tag: {mainTagName}
    </Paragraph>
  </XStack>
)}
```

### Task 3.3: Profile Header Updates

**File**: `packages/app/features/profile/components/ProfileHeader.tsx`

**Changes Required**:
- [ ] Update display name logic priority
- [ ] Add main_tag_name to display chain

**Logic**:
```tsx
case !!profile?.name:
  return profile?.name
case !!profile?.main_tag_name:
  return `/${profile.main_tag_name}`
case !!profile?.all_tags?.[0]:
  return `/${profile.all_tags[0]}`
```

### Task 3.4: Activity Feed Updates

**Files**:
- `packages/app/features/activity/ActivityRow.tsx`
- `packages/app/features/activity/RecentActivity.tsx`
- `packages/app/features/home/TokenActivityRow.tsx`

**Changes Required**:
- [ ] Add main tag color highlighting (`$primary`)
- [ ] Update user display logic
- [ ] Fix layout issues in TokenActivityRow
- [ ] Add `isMainTag()` utility function

**Layout Constants**:
```tsx
const AVATAR_WIDTH = 40
const AVATAR_MARGIN = 14
const TEXT_MIN_WIDTH = 70
```

### Task 3.5: Type System Updates

**File**: `packages/app/utils/zod/activity/UserSchema.ts`

**Changes Required**:
- [ ] Add `main_tag_id: z.number().optional()`
- [ ] Add `main_tag_name: z.string().optional()`
- [ ] Update validation schemas
- [ ] Ensure backward compatibility

### Task 3.6: Utility Functions

**File**: `packages/app/utils/activity.ts`

**New Functions**:
```tsx
// Updated priority: main_tag_name → tags[0] → name → sendid
function userNameFromActivityUser(user: ActivityUser): string

// Check if user has main tag set
function isMainTag(user: ActivityUser): boolean
```

## Testing Checklist

### Unit Tests
- [ ] Tag sorting logic
- [ ] Main tag selection flow
- [ ] Delete tag functionality
- [ ] Display name priority logic
- [ ] Utility functions

### Visual Testing
- [ ] Main tag indicators display correctly
- [ ] Pill positioning on account overview
- [ ] Activity feed styling
- [ ] Mobile responsive design
- [ ] Platform-specific blur effects

### Integration Testing
- [ ] Complete sendtag management flow
- [ ] Main tag updates across components
- [ ] Tag deletion with UI updates
- [ ] Error handling and loading states

## Mobile Considerations

- Touch targets minimum 44px
- Proper spacing for mobile displays
- Text truncation with `numberOfLines`
- Platform-specific blur effects (web only)

## Definition of Done

- [ ] All UI components implement main tag display priority
- [ ] Visual indicators clearly distinguish main tags
- [ ] Tag management flow works end-to-end
- [ ] All tests pass
- [ ] Mobile and web responsive
- [ ] Error handling implemented
- [ ] Loading states provide good UX

## Next Phase

After completion, proceed to **Phase 4: Testing & Polish** to validate the complete implementation.