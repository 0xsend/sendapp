# TODO - PostHog Analytics Implementation

## Completed
- [x] Create packages/app/analytics/types.ts with all event types (iteration 1)
- [x] Create packages/app/analytics/analytics.ts (web implementation) (iteration 1)
- [x] Create packages/app/analytics/analytics.native.ts (native implementation) (iteration 1)
- [x] Create packages/app/analytics/index.ts exports (iteration 1)
- [x] Create packages/app/provider/analytics/AnalyticsProvider.tsx (iteration 1)
- [x] Add AnalyticsProvider to packages/app/provider/index.tsx compose() (iteration 1)
- [x] Add posthog-react-native dependency to apps/expo/package.json (iteration 1)
- [x] Migrate sign-up/screen.tsx to useAnalytics() (iteration 1)
- [x] Migrate loginWithPhone/screen.tsx to useAnalytics() (iteration 1)
- [x] Migrate onboarding/screen.tsx to useAnalytics() (iteration 1)
- [x] Migrate send/confirm/screen.tsx to useAnalytics() (iteration 1)
- [x] Migrate earn/deposit/screen.tsx to useAnalytics() (iteration 1)
- [x] Migrate earn/withdraw/screen.tsx to useAnalytics() (iteration 1)
- [x] Migrate checkout-confirm-button.tsx to useAnalytics() (iteration 1)
- [x] Remove posthog from secret-shop/screen.tsx (iteration 1)
- [x] Delete apps/next/instrumentation-client.ts (iteration 1)
- [x] Add analytics to tsconfig.json include array (iteration 1)
- [x] Fix TypeScript errors in analytics.native.ts (iteration 1)
- [x] Run yarn install to install posthog-react-native (iteration 1)
- [x] TypeScript compilation passes (iteration 1)
- [x] Biome linting passes (iteration 1)

## In Progress
- [ ] None

## Pending
- [ ] None

## Blocked
- [ ] None

## Notes
- Implemented cross-platform PostHog analytics service with:
  - Platform-specific implementations using .ts/.native.ts pattern
  - Type-safe event capture with discriminated unions
  - Auto-identification via AnalyticsProvider watching useUser()
  - All 7 affected feature files migrated from direct posthog-js imports
  - Secret shop had posthog removed (tracking not needed there)
- All verifications passed:
  - No direct posthog-js imports in packages/app/features/
  - No typeof window checks for posthog
  - instrumentation-client.ts removed
  - posthog-react-native installed
  - TypeScript and Biome checks pass
