# Native App Implementation Plan

## Goal

Complete the Send native app implementation by addressing layout issues, improving user experience, and porting remaining features from the Next.js application.

## Current Navigation Architecture

The current navigation architecture for the Expo app is built using Expo Router v3 and follows a nested structure:

1. **Root Layout** (`/app/_layout.tsx`):
   - Sets up the Provider, theme loading, and authentication state
   - Configures the main Stack Navigator with screens for:
     - `index` (splash/login screen)
     - `(drawer)` (authenticated content)
     - `(auth)` (authentication flows)
     - `settings/index` (settings screen)

2. **Authentication Flow** (`/app/(auth)/`):
   - Contained in route group `(auth)`
   - Includes screens for sign-up, login-with-phone, and onboarding
   - Uses a Stack navigator for navigation between auth screens
   - Implements a shared AuthLayout component for consistent UI across auth screens

3. **Main App Flow** (`/app/(drawer)/`):
   - Protected by authentication check
   - Uses Drawer Navigator from `expo-router/drawer`
   - Custom drawer content with profile info and menu items

4. **Tab Navigation** (`/app/(drawer)/(tabs)/`):
   - Nested inside the drawer navigator
   - Currently includes: index (home), activity, profile, and earn tabs
   - Custom header with drawer menu toggle and "+" button

## Current Implementation Status

The Expo app has implemented several key components:

1. **Navigation Structure**:
   - Drawer navigation is complete with ALL menu items:
     - Home, Activity, Send, Deposit, Earn, Trade, SendPot, Explore, Invest, Feed, Leaderboard, Settings
   - Tab navigation includes Home, Activity, Profile, and Earn

2. **Screens Implemented**:
   - Complete authentication flow (sign-up, login-with-phone, and onboarding)
   - Reusable AuthLayout component for consistent styling across auth screens
   - Consistent screen headers with configureScreenHeader utility
   - Home screen with optimized HomeQuickActions and TokenActivityFeed
   - Send flow with confirmation screen
   - Simple activity, profile, and earn screens

3. **Missing Features**:
   - Complete account management (backup flow, personal info, affiliate)
   - Enhanced SendPot with confirmation flows
   - Apple Pay integration
   - Complete deposit and withdrawal flows
   - Trading functionality
   - Implementation of Feed, Explore, and Invest content

## Next.js App Structure

The Next.js app has a comprehensive routing structure with these sections:

1. **Main Sections**:
   - Secret Shop for minting tokens on localnet
   - Activity feed
   - Profile pages
   - Send/receive functionality
   - Deposit/withdraw flows (including Apple Pay)
   - Earn and rewards
   - Settings and account management  
   - Trade features
   - SendPot (lottery) functionality with confirmation flow
   - Feed (dedicated feed section)
   - Explore section with rewards
   - Invest (investment features)
   - Leaderboard

2. **Account Management**:
   - Profile editing
   - Backup credentials with confirmation flow
   - SendTag management (add, checkout, first tag)
   - Affiliate program
   - Personal info management

3. **Authentication**:
   - Login with phone
   - Sign-up flow
   - Onboarding process

## Implementation Plan

### Phase 1: Navigation Structure Completion (Completed ✅)

1. **Enhance Drawer Navigation** ✅:
   - Added missing menu items (Explore, Invest, Feed) to `(drawer)/_layout.tsx`
   - Ensured consistent styling with web application
   - Fixed navigation routing between drawer items and tabs

2. **Complete Auth Layout** ✅:
   - Added login-with-phone screen to auth flow
   - Created reusable AuthLayout component in packages/app/features/auth/layout.tsx
   - Ensured consistent styling across all auth screens by applying the shared layout
   - Fixed navigation nesting issues by separating navigation and UI concerns

3. **Create Consistent Headers** ✅:
   - Implemented the configureScreenHeader utility
   - Applied consistent headers across all screens
   - Fixed type issues for proper React Navigation integration

### Phase 2: Core Screen Implementation (In Progress 🔄)

1. **Home Screen Enhancement** ✅:
   - Implemented and optimized HomeQuickActions.native.tsx
   - Fixed and optimized TokenActivityFeed.native.tsx
   - Added proper skeleton loading states

2. **Send/Receive Functionality** ✅:
   - Completed send flow with confirmation screens
   - Implemented Send confirmation flow

3. **Profile Screen Completion** 🔄:
   - Complete profile viewing functionality
   - Implement profile editing
   - Add personal info management screens

4. **Activity Screen Optimization** 🔄:
   - Complete activity feed implementation
   - Optimize list rendering for mobile performance
   - Add proper pull-to-refresh and pagination

### Phase 3: Additional Features (Pending ⏳)

1. **Deposit/Withdraw Flows** ⏳:
   - Complete deposit options screens
   - Implement Apple Pay integration
   - Add crypto deposit/withdrawal flows
   - Create success and confirmation screens

2. **Earn & Rewards** ⏳:
   - Complete earn section with asset-specific screens
   - Implement rewards tracking
   - Add proper data visualization for earnings

3. **Trade & SendPot** ⏳:
   - Implement trade screens with confirmation flow
   - Complete SendPot with ticket buying functionality
   - Add ticket confirmation screens

4. **New Features** ⏳:
   - Implement Feed section
   - Create Explore with rewards screens
   - Add Invest functionality
   - Complete backup flow with credential management

## Testing and Quality Assurance

1. **Device Testing**:
   - Test on both iOS and Android simulators/emulators
   - Verify UI consistency across different screen sizes
   - Test on physical devices when possible

2. **Navigation Testing**:
   - Verify all navigation flows work as expected
   - Test deep linking functionality
   - Ensure proper back navigation behavior

3. **Authentication Testing**:
   - Test all auth flows (sign-up, login, logout)
   - Verify proper session management
   - Test error states and recovery

4. **Performance Testing**:
   - Profile render performance on low-end devices
   - Optimize list rendering for large datasets
   - Test network request handling and caching

## Verification Methods

You can use the following methods to verify the app is functioning correctly:

1. **Screenshot Capture**:
   ```bash
   # For iOS Simulator
   xcrun simctl io booted screenshot ./screenshot.png
   
   # For Android Emulator
   adb shell screencap -p /sdcard/screenshot.png && adb pull /sdcard/screenshot.png
   ```

2. **Screen Recording**:
   ```bash
   # For iOS Simulator
   xcrun simctl io booted recordVideo ./recording.mp4
   
   # For Android Emulator
   adb shell screenrecord /sdcard/recording.mp4 && adb pull /sdcard/recording.mp4
   ```

3. **Maestro E2E Testing**:
   - Implement Maestro flows for critical user journeys
   - Run automated tests on CI/CD pipeline
   - See `docs/setting-up-maestro-e2e-tests.md` for setup information

## Next Steps (Prioritized)

1. ✅ Update drawer navigation with missing menu items (Feed, Explore, Invest)
2. ✅ Implement the configureScreenHeader utility for consistent headers
3. ✅ Fix and optimize HomeQuickActions and TokenActivityFeed native components
4. ✅ Add login-with-phone to the auth flow
5. ✅ Complete the send flow with confirmation screens
6. Implement profile editing and management screens
7. Create deposit flow with crypto and fiat options
8. Complete the earn section with rewards tracking
9. Implement SendPot with ticket buying functionality
10. Add explore and feed sections