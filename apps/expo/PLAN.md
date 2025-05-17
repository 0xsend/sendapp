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
   - Currently includes: index (home), activity, earn, and profile tabs
   - Custom header with drawer menu toggle and "+" button

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

To align the Expo app with the Next.js app structure, I recommend the following improvements:

### 1. Enhance Tab Navigation

The tab navigation already includes the core sections but could be expanded to match the Next.js app more closely:

```tsx
// In apps/expo/app/(drawer)/(tabs)/_layout.tsx
<Tabs>
  <Tabs.Screen
    name="index"
    options={{
      title: 'Home',
      tabBarIcon: ({ focused }) => <Home color={focused ? '$color12' : '$color10'} />
    }}
  />
  <Tabs.Screen
    name="activity"
    options={{
      title: 'Activity',
      tabBarIcon: ({ focused }) => <Activity color={focused ? '$color12' : '$color10'} />
    }}
  />
  <Tabs.Screen
    name="earn"
    options={{
      title: 'Earn',
      tabBarIcon: ({ focused }) => <DollarSign color={focused ? '$color12' : '$color10'} />
    }}
  />
  <Tabs.Screen
    name="profile"
    options={{
      title: 'Profile',
      tabBarIcon: ({ focused }) => <User color={focused ? '$color12' : '$color10'} />
    }}
  />
</Tabs>
```

### 2. Enhance Drawer Content

Expand the drawer to include all major navigation sections from the Next.js app:

```tsx
// Enhanced drawer content
function ProfileScreen() {
  // ... existing code

  const menuItems = [
    { icon: <Home size={20} />, label: 'Home', route: '/(tabs)' },
    { icon: <Activity size={20} />, label: 'Activity', route: '/activity' },
    { icon: <Send size={20} />, label: 'Send', route: '/send' },
    { icon: <Download size={20} />, label: 'Deposit', route: '/deposit' },
    { icon: <DollarSign size={20} />, label: 'Earn', route: '/earn' },
    { icon: <TrendingUp size={20} />, label: 'Trade', route: '/trade' },
    { icon: <Gift size={20} />, label: 'SendPot', route: '/sendpot' },
    { icon: <Search size={20} />, label: 'Explore', route: '/explore' },
    { icon: <LineChart size={20} />, label: 'Invest', route: '/invest' },
    { icon: <Rss size={20} />, label: 'Feed', route: '/feed' },
    { icon: <Award size={20} />, label: 'Leaderboard', route: '/leaderboard' },
    { icon: <Settings size={20} />, label: 'Settings', route: '/settings' },
  ]

  return (
    <Container f={1} backgroundColor="$background">
      {/* Profile section */}
      {/* ... */}

      <Separator />

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
      </YStack>

      {/* Sign out button */}
    </Container>
  )
}
```

>[!NOTE]
> Reference the relevant icons and navigation from the web project see packages/app/components/sidebar/HomeSideBar.tsx.

### 3. Create Consistent Route Structure

Add the corresponding routes matching the Next.js structure:

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

### 4. Authentication Flow Refinement

Enhance the authentication flow with a shared layout to include all auth methods:

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

### 5. Dynamic Header Configuration

Create a consistent header treatment across screens:

```tsx
// Header configuration utility
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

### Phase 1: Navigation Structure (High Priority)

1. **Complete Tab Navigation**:
   - Tab navigation already includes main screens, ensure they work correctly
   - Polish UI and transitions between tabs

2. **Enhance Drawer Navigation**:
   - Update drawer content in `(drawer)/_layout.tsx`
   - Add new menu items for Feed, Explore, and Invest
   - Implement navigation logic

3. **Complete Auth Layout**:
   - Add login-with-phone screen to auth flow
   - Ensure consistent styling across all auth screens

### Phase 2: Core Screen Implementation (Medium Priority)

1. **Home Screen**:
   - Complete home screen implementation
   - Fix HomeQuickActions and TokenActivityFeed.native.tsx

2. **Profile Screen**:
   - Implement profile viewing
   - Add profile editing functionality
   - Add personal info management

3. **Activity Screen**:
   - Port activity feed
   - Optimize for mobile

4. **Send/Receive Functionality**:
   - Implement send flow with confirmation
   - Add QR code scanning

### Phase 3: Additional Features (Lower Priority)

1. **Deposit/Withdraw**:
   - Implement deposit options
   - Add Apple Pay support
   - Add crypto and fiat flows  
   - Implement success screens

2. **Earn & Rewards**:
   - Port earn functionality
   - Implement asset-specific earn screens
   - Add rewards tracking

3. **Trade & SendPot**:
   - Add trade screens with summary
   - Implement SendPot with ticket buying
   - Add confirmation flows

4. **New Features**:
   - Implement Feed section
   - Add Explore with rewards
   - Create Invest functionality
   - Enhance backup flow with confirmation

## Verification

You can use the `xcrun simctl io booted screenshot` command to take a screenshot of the app. Use this to verify that the app is functioning as expected and that the navigation, layout, and screens are working as intended.

```bash
xcrun simctl io booted screenshot ./screenshot.png
```

Then read the contents of the screenshot and compare it to the expected output.

## Next Steps

1. Update drawer content with new navigation options (Feed, Explore, Invest)
2. Add login-with-phone to auth flow
3. Implement missing screens for new features
4. Fix existing UI issues in HomeQuickActions and TokenActivityFeed.native.tsx
5. Add account management features (backup flow, personal info, affiliate program)
6. Implement deposit success flows and Apple Pay
7. Complete SendPot confirmation flow
8. Add feed and explore functionality
