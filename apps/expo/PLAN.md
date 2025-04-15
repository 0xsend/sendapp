# Expo App Feature Parity Plan

## Goal

This document outlines the plan to bring the Expo application (`apps/expo`) to feature parity with the Next.js application (`apps/next`) in terms of page structure and navigation. We will leverage Expo Router's file-based routing and utilize shared components from `packages/app` where possible, adapting the UI for a mobile experience using Tamagui.

## 1. Next.js Page Structure (`apps/next/pages`)

The current structure of the Next.js application includes the following top-level pages and directories:

**Files:**

*   `_app.tsx` (App wrapper)
*   `_document.tsx` (Document structure)
*   `[tag].tsx` (Dynamic route for tags)
*   `404.tsx` (Not Found page)
*   `activity.tsx`
*   `index.tsx` (Home page)
*   `leaderboard.tsx`
*   `secret-shop.tsx`

**Directories:**

*   `account/`
*   `api/` (API routes - not relevant for Expo UI)
*   `auth/`
*   `deposit/`
*   `earn/`
*   `explore/`
*   `feed/`
*   `invest/`
*   `profile/` (Contains dynamic route `[sendid].tsx`)
*   `send/`
*   `sendpot/`
*   `trade/`

## 2. Current Expo App Structure (`apps/expo/app`)

The current structure is minimal:

**Files:**

*   `_layout.tsx` (Root layout)
*   `index.tsx` (Home screen)

**Directories:**

*   `(auth)/` (Authentication flow with `_layout.tsx`)

## 3. Authentication Flow Implementation

The app uses a non-traditional authentication approach:

* **Passkey Authentication**: If a user already has an account, they authenticate using passkeys (WebAuthn) rather than username/password
* **Sign Up Flow**: New users are redirected to the sign-up process
* **Home Page Implementation**: The Next.js `index.tsx` demonstrates this flow:
  * Checks for user session
  * If authenticated: Renders `HomeLayout` with `HomeScreen`
  * If not authenticated: Renders `SplashScreen` with `AuthCarouselContext` for onboarding carousel

**Implementation Notes:**
* The Expo app already has a `(auth)/_layout.tsx` with `AuthCarouselContext` structure in place
* When implementing authentication in Expo:
  * Review `apps/next/pages/index.tsx` for flow logic
  * Examine `packages/app/features/splash/screen.tsx` for the unauthenticated experience
  * Implement similar passkey authentication and sign-up redirects
  * Ensure carousel images and progress state are properly managed (the Next.js implementation loads these from server-side props)

## 4. Proposed Expo App Structure & Implementation Plan

We will use Expo Router's file-based routing conventions. Directories correspond to route segments, and files like `index.tsx` serve as the default screen for a directory. `_layout.tsx` files configure layout wrappers (e.g., Stack, Tabs).

**Implementation Approach:**
* For each screen implementation, first review the corresponding Next.js page to understand:
  * Component structure and imports
  * Authentication/protection logic
  * Data fetching patterns
  * UI layout and specific components

**Mapping:**

| Next.js Route (`apps/next/pages`) | Proposed Expo Route (`apps/expo/app`) | Shared Component (`packages/app`)                                  | Next.js Page to Review                                                                             |
| :-------------------------------- | :------------------------------------ | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| `index.tsx`                       | `index.tsx`                           | `HomeScreen` (or equivalent)                                       | `apps/next/pages/index.tsx` - Review how session check and UI is handled.                             |
| `activity.tsx`                    | `activity.tsx`                        | `ActivityScreen` (`packages/app/features/activity/screen.tsx`)     | `apps/next/pages/activity.tsx` - Review activity data loading and display.                           |
| `leaderboard.tsx`                 | `leaderboard.tsx`                     | `LeaderboardScreen` (`packages/app/features/leaderboard/screen.tsx`) | `apps/next/pages/leaderboard.tsx` - Review leaderboard implementation.                                |
| `secret-shop.tsx`                 | `secret-shop.tsx`                     | `SecretShopScreen` (`packages/app/features/secret-shop/screen.tsx`)  | `apps/next/pages/secret-shop.tsx` - Review shop layout and item display.                              |
| `[tag].tsx`                       | `[tag].tsx`                           | `TagScreen` (`packages/app/features/tag/screen.tsx`)               | `apps/next/pages/[tag].tsx` - Review dynamic parameter handling.                                     |
| `deposit/`                        | `deposit/index.tsx`                   | `DepositScreen` (`packages/app/features/deposit/screen.tsx`)       | `apps/next/pages/deposit/index.tsx` - Review deposit flow.                                           |
| `earn/`                           | `earn/_layout.tsx`, `earn/index.tsx`  | `EarnScreen` (`packages/app/features/earn/screen.tsx`)             | `apps/next/pages/earn/index.tsx` - Review earnings overview screen.                                  |
| `earn/[asset]/balance.tsx`        | `earn/[asset]/balance.tsx`            | `EarnBalanceScreen` (`packages/app/features/earn/balance/screen.tsx`) | `apps/next/pages/earn/[asset]/balance.tsx` - Review dynamic asset balance display.                    |
| `explore/`                        | `explore/index.tsx`                   | `ExploreScreen` (`packages/app/features/explore/screen.tsx`)       | `apps/next/pages/explore/index.tsx` - Review exploration interface.                                  |
| `feed/`                           | `feed/index.tsx`                      | `FeedScreen` (`packages/app/features/feed/screen.tsx`)             | `apps/next/pages/feed/index.tsx` - Review feed data loading and UI.                                  |
| `invest/`                         | `invest/index.tsx`                    | `InvestScreen` (`packages/app/features/invest/screen.tsx`)         | `apps/next/pages/invest/index.tsx` - Review investment options presentation.                         |
| `send/`                           | `send/index.tsx`                      | `SendScreen` (`packages/app/features/send/screen.tsx`)             | `apps/next/pages/send/index.tsx` - Review send transaction flow.                                     |
| `sendpot/`                        | `sendpot/index.tsx`                   | `SendpotScreen` (`packages/app/features/sendpot/screen.tsx`)       | `apps/next/pages/sendpot/index.tsx` - Review sendpot functionality.                                  |
| `trade/`                          | `trade/index.tsx`                     | `TradeScreen` (`packages/app/features/trade/screen.tsx`)           | `apps/next/pages/trade/index.tsx` - Review trading interface.                                        |
| `account/`                        | `account/_layout.tsx`, `account/index.tsx` | `AccountScreen` (`packages/app/features/account/screen.tsx`)       | `apps/next/pages/account/index.tsx` - Review account overview screen.                                |
| `account/affiliate.tsx`           | `account/affiliate.tsx`               | `AffiliateScreen` (`packages/app/features/account/affiliate/screen.tsx`) | `apps/next/pages/account/affiliate.tsx` - Review affiliate program interface.                         |
| `account/sendtag/index.tsx`       | `account/sendtag.tsx`                 | `SendtagScreen` (`packages/app/features/account/sendtag/screen.tsx`) | `apps/next/pages/account/sendtag/index.tsx` - Review sendtag management.                              |
| `profile/[sendid].tsx`            | `profile/[sendid].tsx`                | `ProfileScreen` (`packages/app/features/profile/screen.tsx`)       | `apps/next/pages/profile/[sendid].tsx` - Review profile display with dynamic ID.                      |
| `auth/`                           | `(auth)/_layout.tsx`, `(auth)/sign-in.tsx`, `(auth)/sign-up.tsx` | `SignInScreen`, `SignUpScreen` (`packages/app/features/auth/...`) | `apps/next/pages/auth/*` - Review authentication screens and implement passkey flow.                  |

**Notes:**

*   **Shared Components:** Shared screen components are located in `packages/app/features/*`. If a required component doesn't exist, it needs to be created or adapted.
*   **Next.js Page Review:** For each screen implementation, carefully review the corresponding Next.js page to understand authentication requirements, data fetching patterns, and UI components in use.
*   **Authentication Implementation:** Implement the non-traditional auth flow using passkeys for existing users and redirect to sign-up for new users, mirroring the pattern in `apps/next/pages/index.tsx`.
*   **Navigation:** Use `solito`'s `<Link>` component and `useRouter` hook for cross-platform navigation between screens, leveraging Expo Router's file structure. Stack navigation will likely be the default via `_layout.tsx` files. Consider Tab navigation for top-level sections if appropriate for mobile UX.
*   **Authentication:** Implement authentication checks within the relevant `_layout.tsx` files (e.g., the root layout or a specific group layout) to protect routes. Redirect unauthenticated users to the `(auth)` group.
*   **Styling:** Utilize Tamagui components (`@tamagui/core`, `tamagui`) for UI elements consistent with the design system.

## 5. Next Steps and Progress

### Completed
1. ✅ Authentication flow implementation:
   - Updated home page implementation in `apps/expo/app/index.tsx` with session checking and conditional rendering similar to Next.js
   - Implemented the sign-in and sign-up screens in `apps/expo/app/(auth)/`
   - Set up the auth carousel for new users including image loading
   - Configured the AuthCarouselContext properly in both root index and auth layout

### Upcoming Tasks
1. Ensure `solito` is correctly configured in both `apps/next` and `apps/expo`.
2. Complete the directory structure within `apps/expo/app` as outlined above.
3. Create the basic `.tsx` files for each screen.
4. For each screen implementation:
   - Review the corresponding Next.js page implementation
   - Understand the data fetching patterns and UI components used
   - Import and render the corresponding shared screen components from `packages/app`
   - Adapt as needed for the mobile experience
5. Implement navigation between screens using `solito`'s `<Link>` component and `useRouter` hook.
6. Set up `_layout.tsx` files for Stack navigation within each main section (account, earn, etc.), potentially considering Tab navigation for the root layout.

### Specific Next Screen Priorities
1. Activity screen
2. Leaderboard screen
3. Profile screen
4. Deposit flow
5. Earn screens
