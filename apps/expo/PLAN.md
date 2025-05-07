# Native App Implementation Plan

## Goal

Complete the Send native app implementation by addressing layout issues, improving user experience, and porting remaining features from the Next.js application.

## Current Navigation Architecture

The current navigation architecture for the Expo app is built using Expo Router v2 and follows a nested structure:

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
   - Currently only has the home screen tab
   - Custom header with drawer menu toggle and "+" button

## Next.js App Structure

The Next.js app has a more comprehensive routing structure with many additional screens:

1. **Main Sections**:
   - Activity feed
   - Profile pages
   - Send/receive functionality
   - Deposit/withdraw flows
   - Earn and rewards
   - Settings and account management
   - Trade features
   - SendPot (lottery) functionality

2. **Account Management**:
   - Profile editing
   - Backup credentials
   - SendTag management
   - Affiliate program

## Proposed Navigation Improvements

To align the Expo app with the Next.js app structure, I recommend the following improvements:

### 1. Expand Tab Navigation

Update the tab navigation to include the core sections from the Next.js app:

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
    name="profile"
    options={{
      title: 'Profile',
      tabBarIcon: ({ focused }) => <User color={focused ? '$color12' : '$color10'} />
    }}
  />
  <Tabs.Screen
    name="earn"
    options={{
      title: 'Earn',
      tabBarIcon: ({ focused }) => <DollarSign color={focused ? '$color12' : '$color10'} />
    }}
  />
</Tabs>
```

### 2. Enhance Drawer Content

Expand the drawer to include all major navigation sections:

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
  │   └── debit-card.tsx
  ├── sendpot/
  │   ├── index.tsx
  │   └── buy-tickets.tsx
  ├── trade/
  │   ├── index.tsx
  │   └── summary.tsx
  ├── leaderboard.tsx
  └── settings/
      ├── index.tsx
      └── account/
          ├── index.tsx
          ├── edit-profile.tsx
          └── sendtag/
              ├── index.tsx
              └── add.tsx
```

### 4. Authentication Flow Refinement

Enhance the authentication flow with a shared layout:

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

1. **Expand Tab Navigation**:
   - Modify `(drawer)/(tabs)/_layout.tsx` to include all main tab screens
   - Create empty placeholder screens for each tab

2. **Enhance Drawer Navigation**:
   - Update drawer content in `(drawer)/_layout.tsx`
   - Add all menu items with proper routes
   - Implement navigation logic

3. **Create Auth Layout**:
   - Update `(auth)/_layout.tsx` to provide consistent auth experience
   - Style auth screens consistently

### Phase 2: Core Screen Implementation (Medium Priority)

1. **Home Screen**:
   - Complete home screen implementation
   - Fix HomeQuickActions and TokenActivityFeed.native.tsx

2. **Profile Screen**:
   - Implement profile viewing
   - Add profile editing functionality

3. **Activity Screen**:
   - Port activity feed
   - Optimize for mobile

4. **Send/Receive Functionality**:
   - Implement send flow
   - Add QR code scanning

### Phase 3: Additional Features (Lower Priority)

1. **Deposit/Withdraw**:
   - Implement deposit options
   - Add crypto and fiat flows

2. **Earn & Rewards**:
   - Port earn functionality
   - Implement rewards tracking

3. **Trade & SendPot**:
   - Add basic trading UI
   - Implement SendPot lottery feature

## Next Steps

1. Expand the tab navigation to include all main screens (home, activity, profile, earn)
2. Update drawer content with all navigation options
3. Create consistent auth layout
4. Begin implementing core screens according to priority
5. Fix existing UI issues in HomeQuickActions and TokenActivityFeed.native.tsx