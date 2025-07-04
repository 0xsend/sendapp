# Native App Implementation Plan

## Goal

Complete the Send native app implementation by addressing layout issues, improving user experience, and porting remaining features from the Next.js application.

## Current Navigation Architecture

The current navigation architecture for the Expo app is built using Expo Router v3 with file-based routing and follows this structure:

1. **Root Layout** (`/app/_layout.tsx`):
   - Sets up the main app provider, theme configuration, and global state
   - Handles authentication state and routing logic
   - Configures the root stack navigator

2. **Main Entry Point** (`/app/index.tsx`):
   - App entry screen (splash/home screen)
   - Handles initial app state and navigation decisions

3. **Authentication Route Group** (`/app/(auth)/`):
   - Route group for authentication flows
   - Contains nested layout (`_layout.tsx`) for auth-specific configuration
   - Screens include:
     - `auth/login-with-phone.tsx` - Phone number authentication
     - `auth/onboarding.tsx` - User onboarding flow
     - `auth/sign-up.tsx` - User registration

4. **Tabs Route Group** (`/app/(tabs)/`):
   - Main authenticated app navigation using tab-based routing
   - Contains nested layout (`_layout.tsx`) for tab configuration
   - Primary tabs:
     - `index.tsx` - Home/dashboard screen
     - `activity/index.tsx` - Activity feed
     - `explore/index.tsx` - Explore section
     - `send/` - Send functionality with nested screens:
       - `index.tsx` - Send screen
       - `confirm.tsx` - Send confirmation
       - `_layout.tsx` - Send flow layout

5. **Feature-Based Screen Organization**:
   - **Account Management** (`/app/account/`):
     - `index.tsx` - Account overview
     - `edit-profile.tsx` - Profile editing
     - `personal-info.tsx` - Personal information management
     - `affiliate.tsx` - Affiliate program
     - `backup/` - Backup credential management with confirmation flows
     - `sendtag/` - SendTag management (add, checkout, first tag)

   - **Financial Features**:
     - `deposit/` - Deposit flows (Apple Pay, crypto, debit card, success)
     - `earn/` - Earning features with asset-specific screens
     - `trade/` - Trading functionality with summary screens
     - `rewards/` - Rewards tracking

   - **Social & Gaming**:
     - `feed/` - Social feed functionality
     - `sendpot/` - Lottery/gaming features with ticket purchasing
     - `profile/` - User profile viewing with dynamic routing

6. **Error Handling**:
   - `+not-found.tsx` - 404/not found screen for invalid routes

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

### Phase 1: Project Setup (Completed ✅)

1. **Initial Expo Setup** ✅:
   - Configure Expo project with necessary dependencies
   - Set up TypeScript configuration and build tools
   - Configure Metro bundler and development environment
   - Set up Tamagui for consistent UI components

2. **Development Environment** ✅:
   - Configure ESLint and Prettier for code quality
   - Set up development scripts and build processes
   - Configure environment variables and app configuration
   - Set up iOS and Android build configurations

### Phase 2: Navigation Structure ✅

1. **File-Based Routing Setup** ✅:
   - Implement Expo Router v3 with file-based navigation
   - Create route groups for authentication and main app flows
   - Set up nested layouts for different app sections
   - Configure tab navigation for main app features

2. **Screen Structure Implementation** ✅:
   - Create all necessary screen files and layouts
   - Implement proper navigation flow between screens
   - Set up authentication routing and protection
   - Configure deep linking and navigation state management

### Phase 3: Screen Porting and Critical Issues ✅

1. **Port All Screens from Next.js** ✅:
   - Transfer all authentication screens (login, signup, onboarding)
   - Port main feature screens (home, activity, send, profile)
   - Implement account management screens (backup, sendtag, personal info)
   - Port financial features (deposit, earn, trade, rewards)
   - Transfer social features (feed, profile viewing, sendpot)

2. **Fix Critical Issues** ✅

### Phase 4: Internal Distributed Build

1. **Build Configuration** ✅:
   - Configure EAS Build for internal distribution
   - Set up development and staging build profiles
   - Configure code signing for iOS and Android
   - Set up internal testing distribution channels

2. **Testing Preparation**:
   - Prepare internal testing builds
   - Set up crash reporting and analytics
   - Configure feature flags for controlled rollout
   - Create testing documentation and guidelines

### Phase 5: Issue Resolution

1. **Bug Fixes and Polish**:
   - Address issues found during internal testing
   - Optimize performance and user experience
   - Fix platform-specific issues and edge cases
   - Implement accessibility improvements

2. **Quality Assurance**:
   - Comprehensive testing across devices and OS versions
   - Performance optimization and memory management
   - Security review and vulnerability assessment
   - Final UI/UX polish and consistency checks

### Phase 6: App Store Submission

1. **Store Preparation**:
   - Prepare app store listings and metadata
   - Create app screenshots and promotional materials
   - Configure app store connect and play console
   - Set up app store optimization (ASO)

2. **Submission Process**:
   - Submit to Apple App Store for review
   - Submit to Google Play Store for review
   - Address any review feedback and resubmit if needed
   - Plan launch strategy and rollout schedule

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

## Known Issues [TO BE SOLVED BEFORE RELEASE]

**Global issues**:
- visual issues, broken UI/styling
- referral code reading/writing is not working, due to implementation using cookies ✅
- dialogs are not appearing ✅
- QR code generation library is not working on native ✅
- a lot os stuff is blinking all over the place, too much data fetching, too much fading

**Project Structure**:
- check images loading 
- check fonts loading
- prepare splash screen and icons for ios ✅

**Auth**:
- login issues, passkey is found but error is thrown ✅
- app crushes on logout ✅

**Home screen**:
- rework flow on native, web flow is built on query params, native should use stacking screen ✅

**Send**:
- rework flow on native, web flow is built on query params, native should use stacking screen ✅
- sending is not stable, app sometimes crush on confirm screen ✅
- resetting send screen state after send is done

**Account**:
- QR code not working ✅

**Sendtags**:
- pricing dialog not appearing ✅
- referral code is not working ✅
- sendtag register is not stable, weird stuff is going on sometimes, like money gone but no sendtag (possibly only on simulator or localhost)

**Invest**:
- risk disclaimer on trade screen doesnt pop up ✅

**Earn**:
- referral code is not working ✅
- a lot os stuff is blinking on earn

**Activity**:
- redirect to external address is not working due to broken dialog ✅
- only 1st page is visible

**History**:
- rework flow of screens, cannot go back from profile details, history and receipt, use screen stacking
- cannot go back after pressing send button
- history scroll is broken, it behaves like standard screen, not like a chat

**Deposit**:
- QR to deposit by crypto transfer is not working ✅
- cannot copy address due to not working dialog ✅
- current implementation of coinbase onramp rely on browser API, need to build version for native https://github.com/coinbase/onramp-demo-mobile ✅

## Planned Improvements [POST RELEASE]

**UX Improvements**:
- floating bottom navbar instead of standard one
- pull to refresh data
- hiding header when scrolling down
- error page when app crush
- don't nest scroll views

**Auth**:
- passkeys for android, right now got passkeys only for ios
- no way to input referral, url won't work on native

**Referrals Screen**:
- number of referrals in header is missing
- refactor referrals screen to use recycler view

**Invest**:
- redirect successful trade to better place, right now its home screen

**Earn**:
- earn home page doest refresh automatically after deposit

**SendPot**:
- number of tickets purchased is not increased after purchase automatically, its fine after close and open again

**Activity**:
- when you go back from details app scroll all the way up, should maintain position
