# Native App Implementation Plan

## Goal

Complete the Send native app implementation by addressing layout issues, improving user experience, and porting remaining features from the Next.js application.

## Analysis of Current State

Based on the provided screenshot and code review:

1. **Authentication Flow**:
   - Onboarding has been completed
   - Auth route group needs refinement
   - Sign-up page exists but needs shared auth layout

2. **UI/UX Issues**:
   - Layout problems in TokenDetails screen
   - Button text truncation in quick action buttons ("Trade" shows as "Tr...")
   - "No Activity" state is handled incorrectly in TokenActivityFeed.native.tsx
   - Overall mobile layout needs optimization

3. **Navigation Structure**:
   - Drawer/Tab navigation is in place but needs refinement
   - Many screens from Next.js still need to be ported to Expo

## Proposed Implementation Plan

### 1. Fix Mobile Layout Issues

#### 1.1. TokenDetails Screen Improvements

- Fix HomeQuickActions component to prevent text truncation:
  - Optimize button layout and spacing for mobile screens
  - Implement text scaling or appropriate text overflow handling
  - Consider using icons-only layout for very small screens

- Fix TokenActivityFeed.native.tsx:
  - Currently returns null when no activities, should render "No Activity" message
  - Implement consistent empty state between web and native versions

- Improve responsive layout:
  - Review responsive breakpoints in the TokenDetails component
  - Adjust paddings and margins for better mobile experience

### 2. Authentication Improvements

- Create shared AuthLayout component:
  - Modify `apps/expo/app/(auth)/_layout.tsx` to serve as shared AuthLayout
  - Extract common layout elements: Container, YStack, Logo Anchor, ScrollView
  - Apply this layout to sign-up and onboarding screens

- Implement proper authentication guards:
  - Protect (drawer) routes from unauthenticated access
  - Implement proper flow for auth state changes

### 3. Complete Core Features

- Drawer Implementation:
  - Complete the drawer content with proper profile display
  - Implement navigation to all needed sections

- Key Screens to Implement (in priority order):
  1. Activity & Token Details
  2. Send & Receive
  3. Deposit & Withdraw
  4. Profile
  5. Earn & Rewards
  6. Settings

- Implement consistent mobile header treatment:
  - Review header/title treatment across screens
  - Ensure consistency in navigation patterns

### 4. Screen Mapping Reference

| Next.js Route | Expo Route | Status | Priority |
|---------------|------------|--------|----------|
| `index.tsx` | `(drawer)/(tabs)/index.tsx` | In Progress | High |
| `profile/[sendid].tsx` | `(drawer)/(tabs)/profile.tsx` | Not Started | High |
| `activity.tsx` | `(drawer)/activity.tsx` | Not Started | High |
| `send/index.tsx` | `(drawer)/send/index.tsx` | Not Started | High |
| `deposit/index.tsx` | `(drawer)/deposit/index.tsx` | Not Started | High |
| `earn/index.tsx` | `(drawer)/earn/index.tsx` | Not Started | Medium |
| `leaderboard.tsx` | `(drawer)/leaderboard.tsx` | Not Started | Medium |
| `settings/index.tsx` | `(drawer)/settings/index.tsx` | Partial | Medium |
| `sendpot/index.tsx` | `(drawer)/sendpot/index.tsx` | Not Started | Low |
| `trade/index.tsx` | `(drawer)/trade/index.tsx` | Not Started | Low |

### 5. Technical Tasks

- Address token detail screen issues:
  - Fix padding, spacing, and responsive layout
  - Optimize quick action buttons for mobile display
  - Ensure consistent empty state handling

- Improve component re-usability:
  - Ensure components like HomeQuickActions are adaptive across screen sizes
  - Create mobile-specific versions of components when needed

- Optimize performance:
  - Implement virtualized lists for long scrolling content
  - Ensure smooth transitions and animations

## Implementation Steps

### Phase 1: Fix Critical Issues (High Priority)

1. **Fix Mobile Layout Issues**:
   - Update HomeQuickActions.tsx to better handle text truncation
   - Fix TokenActivityFeed.native.tsx to handle empty state
   - Improve responsive breakpoints in TokenDetails

2. **Implement Authentication Layout**:
   - Create shared AuthLayout in (auth)/_layout.tsx
   - Apply to sign-up and onboarding screens

3. **Implement Drawer Content**:
   - Complete drawer with profile and navigation options
   - Ensure proper routing between tabs and drawer items

### Phase 2: Complete Core App Screens (Medium Priority)

1. **Implement Activity Screen**:
   - Port activity feed with mobile optimizations
   - Ensure consistent UX with token activity views

2. **Complete Send & Receive Flows**:
   - Implement optimized send flow for mobile
   - Test QR code scanning and contact selection

3. **Implement Deposit & Withdraw**:
   - Create mobile-friendly deposit options
   - Implement withdraw flow with proper confirmations

### Phase 3: Polish and Refinement (Lower Priority)

1. **Complete Remaining Screens**:
   - Implement remaining features following priority order
   - Ensure consistent navigation patterns

2. **Final Testing and Optimization**:
   - Test on various screen sizes and devices
   - Optimize animations and transitions
   - Finalize responsive design

## Next Steps

1. Fix the HomeQuickActions component for better mobile display
2. Update TokenActivityFeed.native.tsx to properly show "No Activity" state
3. Create the shared auth layout 
4. Complete the drawer implementation
5. Begin porting highest priority screens (Activity, Send, Deposit)