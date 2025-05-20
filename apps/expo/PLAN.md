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
   - Includes screens for sign-up and onboarding
   - Uses a basic layout without drawer or tabs

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
   - Basic drawer navigation is in place with the following menu items:
     - Home, Activity, Send, Deposit, Earn, Trade, SendPot, Leaderboard, Settings
   - Tab navigation includes Home, Activity, Profile, and Earn

2. **Screens Implemented**:
   - Basic authentication flow (sign-up and onboarding)
   - Home screen with minimal functionality
   - Simple activity, profile, and earn screens

3. **Missing Features**:
   - Feed screen
   - Explore section
   - Invest functionality
   - Complete account management (backup flow, personal info, affiliate)
   - Enhanced SendPot with confirmation flows
   - Apple Pay integration
   - Complete deposit and withdrawal flows

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

## Proposed Navigation Improvements

To align the Expo app with the Next.js app structure, the following improvements are recommended:

### 1. Update Tab Navigation

The tab navigation is already well-structured but needs consistent styling and performance optimizations:

```tsx
// In apps/expo/app/(drawer)/(tabs)/_layout.tsx
<Tabs
  screenOptions={{
    tabBarShowLabel: false,
    headerShown: false,
    tabBarStyle: {
      // Consistent styling with safe area insets
      paddingTop: 10,
      paddingBottom: insets.bottom + 10,
      height: 60,
      borderTopWidth: 1,
      borderTopColor: '$borderColor',
    },
  }}
>
  <Tabs.Screen
    name="index"
    options={{
      title: 'Home',
      tabBarIcon: ({ size, focused }) => (
        <Home color={focused ? '$color12' : '$color10'} size={size} strokeWidth={2} />
      ),
    }}
  />
  <Tabs.Screen
    name="activity"
    options={{
      title: 'Activity',
      tabBarIcon: ({ size, focused }) => (
        <Activity color={focused ? '$color12' : '$color10'} size={size} strokeWidth={2} />
      ),
    }}
  />
  <Tabs.Screen
    name="profile"
    options={{
      title: 'Profile',
      tabBarIcon: ({ size, focused }) => (
        <User color={focused ? '$color12' : '$color10'} size={size} strokeWidth={2} />
      ),
    }}
  />
  <Tabs.Screen
    name="earn"
    options={{
      title: 'Earn',
      tabBarIcon: ({ size, focused }) => (
        <DollarSign color={focused ? '$color12' : '$color10'} size={size} strokeWidth={2} />
      ),
    }}
  />
</Tabs>
```

### 2. Enhance Drawer Content

The current drawer implementation includes most key navigation items but should be expanded to include all features from the Next.js app:

```tsx
// In apps/expo/app/(drawer)/_layout.tsx
function ProfileScreen() {
  // ... existing code

  const menuItems = [
    { icon: <Home size={20} />, label: 'Home', route: '/(tabs)' },
    { icon: <Activity size={20} />, label: 'Activity', route: '/(tabs)/activity' },
    { icon: <Send size={20} />, label: 'Send', route: '/send' },
    { icon: <Download size={20} />, label: 'Deposit', route: '/deposit' },
    { icon: <DollarSign size={20} />, label: 'Earn', route: '/(tabs)/earn' },
    { icon: <TrendingUp size={20} />, label: 'Trade', route: '/trade' },
    { icon: <Gift size={20} />, label: 'SendPot', route: '/sendpot' },
    // Add missing navigation items
    { icon: <Search size={20} />, label: 'Explore', route: '/explore' },
    { icon: <LineChart size={20} />, label: 'Invest', route: '/invest' },
    { icon: <Rss size={20} />, label: 'Feed', route: '/feed' },
    { icon: <Award size={20} />, label: 'Leaderboard', route: '/leaderboard' },
    { icon: <Settings size={20} />, label: 'Settings', route: '/settings' },
  ]

  return (
    <Container f={1} backgroundColor="$background">
      <YStack f={1} pt={top} pb={bottom} px="$4" gap="$6">
        {/* Brand logo */}
        <XStack py="$4" ai="center">
          <IconSendLogo size={'$6'} color={'$color12'} />
        </XStack>

        {/* Profile section */}
        <YStack gap="$4">
          <XStack ai="center" gap="$3">
            <Button
              circular
              size="$5"
              icon={<User size={20} />}
              onPress={() => router.push('/(tabs)/profile')}
            />
            <YStack>
              <H3>{profile?.name || 'User'}</H3>
              <Paragraph color="$color10">{user?.email || ''}</Paragraph>
            </YStack>
          </XStack>
        </YStack>

        <Separator />

        {/* Navigation menu */}
        <YStack f={1} gap="$4">
          {menuItems.map((item) => (
            <Button
              key={item.route}
              variant="outlined"
              onPress={() => router.push(item.route)}
              icon={item.icon}
              color="$color12"
            >
              {item.label}
            </Button>
          ))}

          {/* Theme toggle */}
          <Button variant="outlined" icon={<Moon size={20} />} color="$color12">
            Dark Mode
          </Button>
        </YStack>

        {/* Sign out button */}
        <Button
          onPress={async () => {
            await supabase.auth.signOut()
            router.push('/')
          }}
          theme="red"
          icon={<LogOut size={20} />}
        >
          Sign Out
        </Button>
      </YStack>
    </Container>
  )
}
```

>[!NOTE]
> Use the web sidebar component structure from `packages/app/components/sidebar/HomeSideBar.tsx` as a reference for consistent navigation patterns and icons.

### 3. Complete Route Structure

Create the following routes to match the Next.js application structure:

```
/app/(drawer)/
  ├── (tabs)/
  │   ├── _layout.tsx (tabs navigator)
  │   ├── index.tsx (home screen)
  │   ├── activity.tsx
  │   ├── profile.tsx
  │   └── earn.tsx
  ├── _layout.tsx (drawer navigator)
  ├── send/
  │   ├── index.tsx
  │   └── confirm.tsx
  ├── deposit/
  │   ├── index.tsx
  │   ├── crypto.tsx
  │   ├── debit-card.tsx
  │   ├── apple-pay.tsx
  │   └── success.tsx
  ├── sendpot/
  │   ├── index.tsx
  │   ├── buy-tickets.tsx
  │   └── confirm-buy-tickets.tsx
  ├── trade/
  │   ├── index.tsx
  │   └── summary.tsx
  ├── explore/
  │   ├── index.tsx
  │   └── rewards/
  │       └── index.tsx
  ├── invest/
  │   └── index.tsx
  ├── feed/
  │   └── index.tsx
  ├── leaderboard.tsx
  └── settings/
      ├── index.tsx
      └── account/
          ├── index.tsx
          ├── edit-profile.tsx
          ├── personal-info.tsx
          ├── affiliate.tsx
          ├── backup/
          │   ├── index.tsx
          │   ├── create.tsx
          │   └── confirm/
          │       └── [cred_id].tsx
          └── sendtag/
              ├── index.tsx
              ├── add.tsx
              ├── checkout.tsx
              └── first.tsx
```

### 4. Authentication Flow Enhancement

Enhance the authentication flow with a complete layout that includes all auth methods:

```tsx
// In apps/expo/app/(auth)/_layout.tsx
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'black' }
      }}
    >
      <Stack.Screen name="auth/onboarding" />
      <Stack.Screen name="auth/sign-up" />
      <Stack.Screen name="auth/login-with-phone" />
    </Stack>
  )
}
```

### 5. Consistent Header Configuration

Implement a consistent header configuration utility:

```tsx
// In apps/expo/utils/configureScreenHeader.tsx
export function configureScreenHeader(options: {
  title: string,
  showBack?: boolean,
  showMenu?: boolean,
  showAction?: boolean,
  actionIcon?: React.ReactNode,
  onActionPress?: () => void
}) {
  return {
    title: options.title,
    headerTitle: () => (
      <XStack ai="center" jc="center">
        <H4>{options.title}</H4>
      </XStack>
    ),
    headerShown: true,
    headerShadowVisible: false,
    headerTitleAlign: 'center',
    headerLeft: options.showMenu
      ? () => <MenuButton />
      : options.showBack
        ? undefined // Use default back button
        : () => <View />,
    headerRight: options.showAction
      ? () => (
          <Button
            borderStyle="unset"
            backgroundColor="transparent"
            onPress={options.onActionPress}
          >
            {options.actionIcon || <Plus size={24} />}
          </Button>
        )
      : () => <View />
  }
}
```

## Implementation Plan

### Phase 1: Navigation Structure Completion (High Priority)

1. **Enhance Drawer Navigation**:
   - Add missing menu items (Explore, Invest, Feed) to `(drawer)/_layout.tsx`
   - Ensure consistent styling with web application
   - Fix navigation routing between drawer items and tabs

2. **Complete Auth Layout**:
   - Add login-with-phone screen to auth flow
   - Ensure consistent styling across all auth screens

3. **Create Consistent Headers**:
   - Implement the configureScreenHeader utility
   - Apply consistent headers across all screens

### Phase 2: Core Screen Implementation (Medium Priority)

1. **Home Screen Enhancement**:
   - Implement and optimize HomeQuickActions.native.tsx
   - Fix and optimize TokenActivityFeed.native.tsx
   - Add proper skeleton loading states

2. **Profile Screen Completion**:
   - Complete profile viewing functionality
   - Implement profile editing
   - Add personal info management screens

3. **Activity Screen Optimization**:
   - Complete activity feed implementation
   - Optimize list rendering for mobile performance
   - Add proper pull-to-refresh and pagination

4. **Send/Receive Functionality**:
   - Complete send flow with confirmation screens
   - Implement QR code scanning
   - Add contact selection functionality

### Phase 3: Additional Features (Lower Priority)

1. **Deposit/Withdraw Flows**:
   - Complete deposit options screens
   - Implement Apple Pay integration
   - Add crypto deposit/withdrawal flows
   - Create success and confirmation screens

2. **Earn & Rewards**:
   - Complete earn section with asset-specific screens
   - Implement rewards tracking
   - Add proper data visualization for earnings

3. **Trade & SendPot**:
   - Implement trade screens with confirmation flow
   - Complete SendPot with ticket buying functionality
   - Add ticket confirmation screens

4. **New Features**:
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

1. Update drawer navigation with missing menu items (Feed, Explore, Invest)
2. Implement the configureScreenHeader utility for consistent headers
3. Fix and optimize HomeQuickActions and TokenActivityFeed native components
4. Add login-with-phone to the auth flow
5. Complete the send flow with confirmation screens
6. Implement profile editing and management screens
7. Create deposit flow with crypto and fiat options
8. Complete the earn section with rewards tracking
9. Implement SendPot with ticket buying functionality
10. Add explore and feed sections
