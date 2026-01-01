# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into your Next.js project. This integration uses the modern `instrumentation-client.ts` approach for Next.js 15.3+ which provides automatic pageview tracking, session recording, and exception capture out of the box.

## Integration Summary

### Configuration Files Created/Modified

| File | Description |
|------|-------------|
| `apps/next/instrumentation-client.ts` | PostHog client initialization with automatic pageview capture, exception tracking, and debug mode in development |
| `apps/next/.env` | Environment variables for PostHog API key and host |

### Events Implemented

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `user_signed_up` | User successfully created a new account with passkey authentication | `packages/app/features/auth/sign-up/screen.tsx` |
| `user_login_with_phone` | User initiated login via phone number | `packages/app/features/auth/loginWithPhone/screen.tsx` |
| `onboarding_completed` | User completed the onboarding flow and created a send account | `packages/app/features/auth/onboarding/screen.tsx` |
| `send_transfer_initiated` | User initiated a crypto transfer to another user | `packages/app/features/send/confirm/screen.tsx` |
| `send_transfer_completed` | User successfully completed a crypto transfer | `packages/app/features/send/confirm/screen.tsx` |
| `earn_deposit_submitted` | User submitted a deposit to the SendEarn vault | `packages/app/features/earn/deposit/screen.tsx` |
| `earn_withdraw_submitted` | User submitted a withdrawal from the SendEarn vault | `packages/app/features/earn/withdraw/screen.tsx` |
| `sendtag_checkout_completed` | User completed a sendtag purchase | `packages/app/features/account/sendtag/checkout/components/checkout-confirm-button.tsx` |
| `secret_shop_fund_clicked` | User clicked fund account button in secret shop | `packages/app/features/secret-shop/screen.tsx` |
| `auth_error_occurred` | An authentication error occurred during sign-up or sign-in | `packages/app/features/auth/sign-up/screen.tsx`, `packages/app/features/auth/loginWithPhone/screen.tsx` |
| `passkey_integrity_failed` | Passkey integrity check failed during account creation | `packages/app/features/auth/sign-up/screen.tsx` |

### User Identification

Users are identified via `posthog.identify()` when they:
- Complete sign-up (`packages/app/features/auth/sign-up/screen.tsx`)
- Complete onboarding (`packages/app/features/auth/onboarding/screen.tsx`)

The distinct ID used is the user's `send_account_id`, which allows consistent tracking across sessions.

### Error Tracking

Automatic exception capture is enabled via `capture_exceptions: true`. Additionally, manual error tracking is implemented for:
- Authentication errors during sign-up and login
- Passkey integrity failures

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/276188/dashboard/963652) - Core analytics dashboard tracking user signups, onboarding, transfers, and earn activities

### Insights
- [User Sign-ups & Onboarding](https://us.posthog.com/project/276188/insights/meW8joyM) - Tracks new user registrations and onboarding completion
- [Sign-up to Onboarding Funnel](https://us.posthog.com/project/276188/insights/GEOla8kv) - Conversion funnel from user sign-up to completing onboarding (7-day window)
- [Send Transfers Activity](https://us.posthog.com/project/276188/insights/2TvbWDtW) - Tracks initiated and completed crypto transfers
- [Earn Deposits & Withdrawals](https://us.posthog.com/project/276188/insights/MIjAJIZ1) - Tracks SendEarn deposit and withdrawal activity
- [Sendtag Purchases](https://us.posthog.com/project/276188/insights/1CwS1Pvd) - Tracks completed sendtag checkout transactions

## Environment Variables

The following environment variables have been configured in `apps/next/.env`:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_7QfxECVls5AFXinwcGTnRIMAUJsJJLdDl30kJyoTsTh
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Make sure to add these to your production environment (Vercel, etc.) as well.
