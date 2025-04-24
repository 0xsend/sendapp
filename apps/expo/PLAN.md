# Native App Onboarding Plan

## Goal

Create a native app onboarding page and refactor the existing sign-up page to use a shared authentication layout.

## Analysis

The existing sign-up page (`apps/expo/app/(auth)/auth/sign-up.tsx`) contains common layout elements that can be extracted:
- Main `Container` with safe area handling.
- `YStack` for centering content.
- `Anchor` containing the `IconSendLogo` positioned at the top.
- `ScrollView` wrapping the main page content.

## Proposed Steps

1.  **Create Shared Auth Layout:**
    *   Modify `apps/expo/app/(auth)/_layout.tsx` to serve as the shared `AuthLayout`.
    *   The layout component will accept `children` as a prop.
    *   It will render the `Container`, `YStack`, `Anchor` (with logo), and `ScrollView`, placing the `children` inside the `ScrollView`.

2.  **Refactor Sign-Up Page:**
    *   Update `apps/expo/app/(auth)/auth/sign-up.tsx` to use the `AuthLayout`.
    *   Remove duplicated layout code, rendering only the `<SignUpScreen />` component within the layout.

3.  **Create Onboarding Page:**
    *   Create a new file: `apps/expo/app/(auth)/onboarding.tsx`.
    *   Use the `AuthLayout` in this new page.
    *   Add specific content for the onboarding steps (start with placeholder).
    *   Configure `Stack.Screen` options for the onboarding page title.

## Visual Structure

```mermaid
graph TD
    subgraph Shared Auth Layout (apps/expo/app/(auth)/_layout.tsx)
        A[Container + SafeArea] --> B(YStack);
        B --> C{Logo Anchor};
        B --> D[ScrollView];
        D --> E((Children Prop));
    end

    subgraph Sign Up Page (apps/expo/app/(auth)/auth/sign-up.tsx)
        F[AuthLayout] --> G[SignUpScreen Component];
    end

    subgraph Onboarding Page (apps/expo/app/(auth)/onboarding.tsx)
        H[AuthLayout] --> I[Onboarding Content];
    end

    G --> E;
    I --> E;
```

## Next Action

Once this plan is approved, toggle to Act Mode to begin implementation, starting with the creation/modification of the shared `AuthLayout` in `apps/expo/app/(auth)/_layout.tsx`.
*   `settings/`
    *   `index.tsx` (Settings screen, likely accessed via Drawer)

## 3. Authentication Flow Implementation (Revised v2)

The app uses a non-traditional authentication approach:

*   **Root Check (`app/index.tsx`)**:
    *   Checks for user session (`useUser`).
    *   If authenticated: Renders `HomeScreen` directly. *(Note: This might need adjustment to delegate rendering to the `(drawer)/(tabs)/index.tsx`)*
    *   If not authenticated: Renders `SplashScreen` wrapped in `AuthCarouselContext`. The carousel images are hardcoded here.
*   **Sign Up (`app/(auth)/auth/sign-up.tsx`)**: Screen exists for the sign-up process. Users needing to sign up will be directed here.
*   **Sign In**: Initiated directly from the `SplashScreen` component (e.g., via a "Sign In" button). This will trigger the passkey authentication flow. **No separate `sign-in.tsx` screen will be created.**
*   **Auth Group (`app/(auth)/_layout.tsx`)**: Provides a basic Stack layout for screens within the `(auth)` group (currently just sign-up).

**Implementation Notes:**
*   The primary auth check happens at the root (`app/index.tsx`).
*   The `SplashScreen` handles the unauthenticated experience, onboarding carousel, and **must include the trigger for the sign-in (passkey) flow**.
*   **Need to implement:**
    *   The sign-in (passkey) logic triggered from `SplashScreen`.
    *   Logic to redirect unauthenticated users attempting to access `(drawer)` routes to the appropriate auth screen (likely back to the root `index.tsx` which shows `SplashScreen`, or directly to `sign-up.tsx` if applicable). This might involve a higher-level check in `app/_layout.tsx` or the root `(drawer)/_layout.tsx`.

## 4. Navigation Structure (Drawer > Tabs)

*(This section remains the same as the previous revision)*

The authenticated part of the app uses a nested navigation structure:

*   **Drawer (`app/(drawer)/_layout.tsx`)**:
    *   Acts as the main container for authenticated screens.
    *   Currently uses a placeholder component for its `drawerContent`. Needs implementation (likely the `ProfileScreen` or a custom drawer menu).
*   **Tabs (`app/(drawer)/(tabs)/_layout.tsx`)**:
    *   Nested inside the Drawer.
    *   Defines two tabs: 'Home' (`index.tsx`) and 'Profile' (`profile.tsx`).
    *   Includes a shared header with:
        *   A menu button to open the Drawer.
        *   A plus button that navigates to a `/create` route (which doesn't exist yet).
    *   Tab icons use `Home` and `User` from `@tamagui/lucide-icons`.

## 5. Proposed Implementation Plan (Revised v2)

Leverage the existing Drawer > Tabs structure. Port Next.js pages into this structure, creating new screens/routes as needed.

**Immediate Priorities:**

1.  **Implement Drawer Content:** Replace the placeholder in `app/(drawer)/_layout.tsx` with the actual `ProfileScreen` component (or a custom drawer menu component) from `packages/app/features/profile/screen.tsx` (or similar). Adapt for mobile.
2.  **Implement Profile Tab Screen:** Create `app/(drawer)/(tabs)/profile.tsx`. Import and render the `ProfileScreen` component, adapting its content for the main tab view vs. the drawer view if necessary. Review `apps/next/pages/profile/[sendid].tsx` for logic (needs adaptation as the tab likely shows the *logged-in user's* profile).
3.  **Implement Home Tab Screen:** Verify `app/(drawer)/(tabs)/index.tsx`. Ensure it correctly renders the main content for the home tab (likely `HomeScreen` from `packages/app/features/home/screen.tsx`). Adjust `app/index.tsx` if needed to avoid rendering `HomeScreen` twice.
4.  **Address `/create` Route:** Decide what the Plus button in the header should do. Implement the corresponding `app/(drawer)/create.tsx` screen or change the button's navigation target. Review potential Next.js counterparts like `send/index.tsx` or `deposit/index.tsx`.
5.  **Implement Sign-In Logic:** Add the necessary logic and UI elements (e.g., button) to the `SplashScreen` component (`packages/app/features/splash/screen.tsx`) to trigger the passkey sign-in flow.
6.  **Authentication Guarding:** Implement proper route protection, likely in `app/_layout.tsx` or `app/(drawer)/_layout.tsx`, to redirect unauthenticated users away from the `(drawer)` group.

**Porting Remaining Screens (Mapping Example - Needs Refinement):**

*   Decide where each feature fits: New Tab? Screen within Drawer? Stack pushed from a Tab?
*   Update the mapping table based on the Drawer/Tabs structure.

| Next.js Route (`apps/next/pages`) | Proposed Expo Route (`apps/expo/app`)                                  | Placement Idea        | Shared Component (`packages/app`)                                  | Next.js Page to Review                                                                             |
| :-------------------------------- | :--------------------------------------------------------------------- | :-------------------- | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| `index.tsx`                       | `(drawer)/(tabs)/index.tsx`                                            | **Existing Tab**      | `HomeScreen`                                                       | `apps/next/pages/index.tsx`                                                                          |
| `profile/[sendid].tsx`            | `(drawer)/(tabs)/profile.tsx` & Drawer Content                         | **Existing Tab/Drawer** | `ProfileScreen`                                                    | `apps/next/pages/profile/[sendid].tsx`                                                               |
| `activity.tsx`                    | `(drawer)/activity.tsx` OR `(drawer)/(tabs)/activity.tsx`              | New Screen or Tab     | `ActivityScreen` (`packages/app/features/activity/screen.tsx`)     | `apps/next/pages/activity.tsx`                                                                       |
| `leaderboard.tsx`                 | `(drawer)/leaderboard.tsx` OR `(drawer)/(tabs)/leaderboard.tsx`        | New Screen or Tab     | `LeaderboardScreen` (`packages/app/features/leaderboard/screen.tsx`) | `apps/next/pages/leaderboard.tsx`                                                                    |
| `deposit/`                        | `(drawer)/deposit/index.tsx` (pushed as stack)                         | Stack from Tab/Drawer | `DepositScreen` (`packages/app/features/deposit/screen.tsx`)       | `apps/next/pages/deposit/index.tsx`                                                                  |
| `earn/`                           | `(drawer)/earn/_layout.tsx`, `(drawer)/earn/index.tsx` (pushed stack)  | Stack from Tab/Drawer | `EarnScreen` (`packages/app/features/earn/screen.tsx`)             | `apps/next/pages/earn/index.tsx`                                                                     |
| ... *(continue for other routes)* | ...                                                                    | ...                   | ...                                                                | ...                                                                                                  |
| `auth/sign-up.tsx`                | `(auth)/auth/sign-up.tsx`                                              | **Existing Auth Screen**| `SignUpScreen` (`packages/app/features/auth/sign-up-screen.tsx`)   | `apps/next/pages/auth/sign-up.tsx`                                                                   |

**Notes:**

*   **Shared Components:** Continue leveraging `packages/app/features/*`. Create/adapt components as needed.
*   **Navigation:** Use `solito`'s `<Link>` and `useRouter` within the established Drawer/Tabs structure. Use `router.push('/(drawer)/deposit')` for stack navigation.
*   **Styling:** Utilize Tamagui components.

## 6. Next Steps and Progress (Revised v2)

### Completed
1. ✅ Root `index.tsx` handles session check and renders `HomeScreen` or `SplashScreen`.
2. ✅ `SplashScreen` uses `AuthCarouselContext` with hardcoded mobile images.
3. ✅ Sign-up screen exists at `app/(auth)/auth/sign-up.tsx`.
4. ✅ Drawer navigator is set up (`app/(drawer)/_layout.tsx`).
5. ✅ Tabs navigator (Home, Profile) is nested in Drawer (`app/(drawer)/(tabs)/_layout.tsx`).
6. ✅ Header with Drawer toggle and `/create` button exists in Tabs layout.

### Upcoming Tasks (Prioritized)
1.  Implement Drawer content in `app/(drawer)/_layout.tsx` (using `ProfileScreen` or custom menu).
2.  Implement Profile tab screen (`app/(drawer)/(tabs)/profile.tsx`) using `ProfileScreen`.
3.  Verify/Implement Home tab screen (`app/(drawer)/(tabs)/index.tsx`) using `HomeScreen`.
4.  Define and implement the `/create` route/screen (`app/(drawer)/create.tsx` or similar).
5.  Implement Sign-In logic/button within `SplashScreen` (`packages/app/features/splash/screen.tsx`).
6.  Add authentication guards to protect the `(drawer)` group.
7.  Plan navigation structure for remaining features (Activity, Leaderboard, Deposit, Earn, etc.).
8.  Port remaining screens based on the decided structure.
