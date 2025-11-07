# i18n Implementation Checklist

This checklist captures the current English-only strings that need to be migrated into the localisation system. Tackle items top-to-bottom or assign per section; each bullet links to the source file for quick reference. Use the existing namespaces (`common`, `home`, `onboarding`, `settings`, `splash`, etc.) or create scoped ones when copy is feature-specific.

## Navigation Surfaces & Shared Chrome

- [ ] Externalise tab header labels and ensure `Tabs.Screen` options consume `t()` (`apps/expo/app/(tabs)/_layout.tsx:13`)
- [ ] Move BottomNav tab definitions (`key`, `href`, and visual label) into `common` resources, wiring `BottomNavBar/BottomNavBarContent` to translate (`packages/app/components/BottomTabBar/BottomNavBar.tsx:23`, `packages/app/components/BottomTabBar/BottomNavBarContent.tsx:23`)
- [ ] Translate sidebar link text for desktop + NavSheet (`packages/app/components/sidebar/HomeSideBar.tsx:50`)
- [ ] Replace the hard-coded "Account" label in the sidebar account entry (`packages/app/components/sidebar/HomeSideBar.tsx:142`)
- [ ] Localise `TopNav` defaults (`Invest`, `Cash`, etc.) and dynamic fallback copy (`packages/app/components/TopNav.tsx:44`)
- [ ] Translate profile header/back button labels rendered via `ProfileTopNav` (`packages/app/components/ProfileTopNav.tsx:1`)
- [ ] Localise NavSheet close-button tooltip/text if introduced (`packages/app/components/NavSheet.tsx:1`)

## Stack Screen Titles (Expo Router)

Audit each `Stack.Screen` title and move it into resources; afterwards fetch via `useTranslation` or a helper to avoid inline literals.

- [ ] `Deposit`, `Deposit on Base`, `Apple Pay`, `Debit Card`, `Success` (`apps/expo/app/deposit/*.tsx`)
- [ ] `Enter Amount`, `Preview and Send` (`apps/expo/app/send/*.tsx`)
- [ ] `Savings`, `Details`, `Deposit`, `Withdraw Savings`, `Rewards Balance`, `Balance` (`apps/expo/app/earn/[asset]/*.tsx`, `apps/expo/app/earn/index.tsx`)
- [ ] `Trade`, `Trade summary` (`apps/expo/app/trade/*.tsx`)
- [ ] `Rewards` (`apps/expo/app/rewards/index.tsx`)
- [ ] `Transaction details` (`apps/expo/app/activity/details.tsx`)
- [ ] All `account` section titles (Account, Profile, Personal information, Link In Bio, Language, Sendtags, Register Sendtags, Checkout, First Sendtag, Passkeys, Create/Confirm Passkey, Referrals) (`apps/expo/app/account/**/*.tsx`)
- [ ] `Invest`, `Cash` detail screens (`apps/expo/app/token/index.tsx`, `apps/expo/app/stables/index.tsx`, `apps/expo/app/investments/index.tsx`)
- [ ] Profile routes (`History`, `About`, dynamic profile titles) (`apps/expo/app/profile/[sendid]/*.tsx`)
- [ ] Auth stack header (ensure hidden header still sourced from i18n if ever shown) (`apps/expo/app/(auth)/_layout.tsx`)
- [ ] Root fallback `Not Found` page title (`apps/expo/app/+not-found.tsx`)

## Shared Account & Settings Experience

- [ ] Translate labels/buttons in `AccountHeader` (invite/share CTA copy, verification tooltip) (`packages/app/features/account/components/AccountHeader.tsx:1`)
- [ ] Translate `AccountLinks` group labels (`Settings`, `Support`) and every row label including external links and `sign out` (`packages/app/features/account/components/AccountLinks.tsx:20`)
- [ ] Localise `AccountNavLink` test IDs/labels if mirrored in UI (`packages/app/features/account/components/AccountNavLink.tsx:1`)
- [ ] Update `AccountScreenLayout` to provide translated empty states if any appear later (`packages/app/features/account/AccountScreenLayout.tsx:1`)

## Core Feature Flows

### Home & Overview
- [ ] Move `HomeScreen` fallback copy (`fallback.missingAccount.*`) into locale files (already referenced but ensure translations exist) and audit all Card headers (`RewardsCard`, `FriendsCard`, etc.) (`packages/app/features/home/screen.tsx:47`)
- [ ] Translate `ExploreScreen` banners (`Get Rewarded`, `Earn SEND ...`, `SENDPOT`) (`packages/app/features/explore/screen.tsx:1`)
- [ ] Translate `InvestScreen` banner text (`packages/app/features/invest/screen.tsx:3`)

### Splash & Auth
- [ ] Ensure all `SplashScreen` headline/CTAs, carousel prompts, and button text use `t()` (`packages/app/features/splash/screen.tsx:30`)
- [ ] `OnboardingScreen` strings (passkey messaging, errors, button labels) should reference `onboarding` namespace keys (`packages/app/features/auth/onboarding/screen.tsx:44`)
- [ ] Login, signup, and app-review auth screens should pull UI copy from the appropriate namespace (`apps/expo/app/(auth)/auth/*.tsx` and their feature implementations)

### Send & Activity
- [ ] Localise search empty/error states and CTA text in `SendScreen`, `SendAmountForm`, and recipient components (`packages/app/features/send/screen.tsx:26`)
- [ ] Translate `SendSuggestions` section headers (recent, favorites, birthdays, top senders) (`packages/app/features/send/suggestions/*.ts`) 
- [ ] `SendConfirmScreen` copy (summary labels, buttons, status) should come from the `send` namespace (`packages/app/features/send/confirm/screen.tsx:47`)
- [ ] `ActivityScreen` and `ActivityDetails` require translation-aware headers, error messages, and field labels (`packages/app/features/activity/screen.tsx:16`, `packages/app/features/activity/ActivityDetails.tsx:1`)

### Deposit & Funding
- [ ] `DepositScreen` option titles/descriptions (`Crypto Wallet`, `Deposit from an external wallet`, etc.) (`packages/app/features/deposit/screen.tsx:5`)
- [ ] `DepositCryptoScreen` instructions, button states, and toast errors (`packages/app/features/deposit/crypto/screen.tsx:9`)
- [ ] Coinbase onramp screens (`packages/app/features/deposit/DepositCoinbase/*`) should use translations for payment method messaging
- [ ] `DepositSuccessScreen` confirmation text (`packages/app/features/deposit/success/screen.tsx:6`)

### Savings / Earn / Rewards
- [ ] `EarnScreen` marketing copy (`Boost Your Savings Instantly`, bullet points, buttons) (`packages/app/features/earn/screen.tsx:16`)
- [ ] `DepositScreen` / `WithdrawForm` under `earn` namespace need translated placeholders, validation errors, and CTA text (`packages/app/features/earn/deposit/screen.tsx:56`, `packages/app/features/earn/withdraw/screen.tsx:40`)
- [ ] Balance/Rewards sub-screens should share keys for headers (`packages/app/features/earn/active/screen.tsx`, `packages/app/features/earn/rewards/screen.tsx`, `packages/app/features/earn/earnings/screen.tsx`)
- [ ] Rewards activity dashboard copy (section headings, fallback text, button labels) (`packages/app/features/rewards/activity/screen.tsx:54`)
- [ ] `Affiliate/Friends` screen messaging (`Invite friends...`, toast messages, table labels) (`packages/app/features/affiliate/screen.tsx:1`)

### Trading & Swaps
- [ ] `SwapFormScreen` field labels, validation messages (`Min slippage value is 0%`, `review`, `loading`) (`packages/app/features/swap/form/screen.tsx:43`)
- [ ] `SwapSummaryScreen` confirmation copy, error handling, and button text (`packages/app/features/swap/summary/screen.tsx:24`)
- [ ] Risk dialog content (`packages/app/features/swap/form/RiskDialog/SwapRiskDialog.tsx`)

### Additional Modules
- [ ] `SendPot` (jackpot cards, risk dialog, buy/confirm flows) (`packages/app/features/sendpot/*.tsx`)
- [ ] `SecretShop` administrative helpers, success/error toasts (`packages/app/features/secret-shop/screen.tsx:42`)
- [ ] `Leaderboard` headings and table labels (`packages/app/features/leaderboard/screen.tsx:5`)
- [ ] `MaintenanceModeScreen` headline/subtitle (`packages/app/features/maintenance-mode/screen.tsx:10`)
- [ ] `SendV0TokenUpgradeScreen` body copy, button labels, link text (`packages/app/features/send-token-upgrade/screen.tsx:78`)
- [ ] `UnknownScreen` fallback strings (`packages/app/features/unknown/screen.tsx:1`)
- [ ] Any additional marketing banners or modals under `packages/app/features/home` (`RewardsCard`, `FriendsCard`, etc.)

## Supporting Tasks

- [ ] Define or extend namespaces (`common`, `navigation`, `account`, etc.) in `packages/app/i18n/config.ts:16` and update `resources`
- [ ] Populate English keys in `packages/app/i18n/resources/**/en.json`; mirror structure for Spanish (and future locales)
- [ ] Introduce hooks/helpers for stack title translations (e.g., `useStackTitle(namespaceKey)`) to avoid repetition
- [ ] Add snapshot/unit tests where practical to prevent regressions on missing translation keys
- [ ] Document translation workflow in `README` or a contributor guide (optional but recommended)

Mark each item once the corresponding strings are read from locale files and the UI renders via `t()` lookups.
