# PostHog Exception Handling Implementation

This document outlines the phased implementation plan for automatic exception handling with PostHog on web and iOS platforms.

## Current State

- PostHog is integrated for analytics events via `packages/app/analytics/`
- Web uses `posthog-js` v1.312.0
- Native uses `posthog-react-native` v3.4.1 (note: error tracking autocapture requires >= 4.14.0)
- **No centralized exception tracking exists** - errors are handled locally with toast notifications

## Overview

PostHog provides built-in exception autocapture that can track JavaScript errors, unhandled promise rejections, and React Native crashes. This implementation adds automatic error tracking while preserving the existing analytics patterns.

---

## Phase 1: Web Exception Autocapture

**Goal**: Enable automatic JavaScript error capture on the Next.js web app.

### 1.1 Enable Exception Autocapture in PostHog Config

Update `packages/app/analytics/analytics.web.ts`:

```typescript
posthog.init(apiKey, {
  api_host: apiHost,
  capture_pageview: true,
  capture_pageleave: true,
  persistence: 'localStorage+cookie',
  // Add exception autocapture
  capture_exceptions: {
    capture_unhandled_errors: true,
    capture_unhandled_rejections: true,
    capture_console_errors: false, // Disable to reduce noise
  },
  // Rate limit exceptions to prevent flooding
  error_tracking: {
    __exceptionRateLimiterRefillRate: 5,   // Tokens added per second
    __exceptionRateLimiterBucketSize: 20,  // Max burst capacity
  },
})
```

**Rate Limiter Behavior**: The token bucket algorithm prevents exception flooding. With `refillRate: 5` and `bucketSize: 20`, the system can burst up to 20 exceptions, then sustains 5 exceptions/second. Excess exceptions are silently dropped client-side. Tune these values based on expected error volume.

### 1.2 What Gets Captured Automatically

With `capture_exceptions: true`, PostHog automatically captures:

- **Uncaught exceptions** via `window.onerror`
- **Unhandled promise rejections** via `unhandledrejection` event
- **Console errors** (wrapped `console.error` calls)

Note: React error boundaries *catch* errors, so those won't hit `window.onerror`. We'll explicitly capture them in Phase 4.

Each exception event includes:
- `$exception_list` - Structured exception list (type, value/message, stack frames)
- `$exception_level` - Severity level
- Current URL and user context

### 1.3 Source Maps for Readable Stack Traces

For production debugging, upload source maps to PostHog:

```bash
# Install the PostHog CLI globally (or as dev dependency)
npm install -g @posthog/cli

# Set environment variables for CI/CD:
# POSTHOG_CLI_HOST - PostHog host (e.g., https://us.i.posthog.com)
# POSTHOG_CLI_ENV_ID - Environment ID from PostHog
# POSTHOG_CLI_TOKEN - API token with sourcemap permissions

# In apps/next/package.json, add scripts:
"posthog:sourcemaps:inject": "posthog-cli sourcemap inject --directory .next/static --project send-app --version $npm_package_version",
"posthog:sourcemaps:upload": "posthog-cli sourcemap upload --directory .next/static",
"posthog:sourcemaps": "npm run posthog:sourcemaps:inject && npm run posthog:sourcemaps:upload"
```

Run `yarn posthog:sourcemaps` from `apps/next` after `next build` in your CI/CD pipeline.

### 1.4 Verification

1. Deploy to staging
2. Trigger a test error in browser console: `throw new Error('Test exception')`
3. Verify exception appears in PostHog > Error Tracking

---

## Phase 2: React Native Exception Autocapture (JS)

**Goal**: Capture uncaught JavaScript exceptions and unhandled rejections in the Expo/React Native app.

### 2.1 Upgrade the RN SDK

PostHog’s RN error tracking autocapture requires `posthog-react-native >= 4.14.0`.

Update:
- `apps/expo/package.json`
- `packages/app/package.json`

Then reinstall deps and regenerate native builds as needed.

### 2.2 Enable RN Error Tracking Autocapture

Configure `errorTracking.autocapture` on the client in `packages/app/analytics/analytics.native.ts`:

```typescript
client = new PostHog(key, {
  host,
  enableSessionReplay: false,
  errorTracking: {
    autocapture: {
      uncaughtExceptions: true,
      unhandledRejections: true,
      console: ['error'], // Only capture console.error, not warn
    },
    // Rate limit exceptions to prevent flooding
    rateLimiter: {
      refillRate: 5,   // Tokens added per second
      bucketSize: 20,  // Max burst capacity
    },
  },
})
```

No `PostHogProvider` is required for this; it works with the existing `AnalyticsProvider` pattern.

### 2.3 Hermes Requirement

PostHog RN error tracking requires Hermes. Ensure it’s enabled in Expo (e.g. add `jsEngine: 'hermes'` to `apps/expo/app.config.ts` if not already).

### 2.4 Native Crashes (iOS/Android)

PostHog explicitly states it **does not** support native Android/iOS exception capture yet. If we need native crash reports, we’ll need a separate crash reporter and optionally forward high‑level events into PostHog.

### 2.5 Verification

1. Build a preview/release build: `eas build --profile preview`
2. Trigger a test error (e.g. `setTimeout(() => { throw new Error('Test RN exception') }, 0)` in a temporary screen)
3. Verify exception appears in PostHog > Error Tracking

---

## Phase 3: Manual Exception Capture API

**Goal**: Add a `captureException()` method to the analytics service for explicit error tracking.

### 3.1 Update Types

Add to `packages/app/analytics/types.ts`:

```typescript
export interface ExceptionProperties {
  /** Component or function where error occurred */
  source?: string
  /** Whether this was handled or unhandled */
  handled?: boolean
  /** Additional context to attach to the event */
  context?: Record<string, unknown>
}

export interface AnalyticsService {
  init(): Promise<void>
  identify(distinctId: string, properties?: AnalyticsUserProperties): void
  capture<E extends AnalyticsEvent>(event: E): void
  screen(name: string, properties?: Record<string, unknown>): void
  reset(): void
  isInitialized(): boolean
  // Add exception capture
  captureException(error: unknown, properties?: ExceptionProperties): void
}
```

Also export `ExceptionProperties` from `packages/app/analytics/index.ts` and `packages/app/analytics/index.native.ts`.

### 3.2 Web Implementation

Add to `packages/app/analytics/analytics.web.ts`:

```typescript
captureException(error: unknown, properties?: ExceptionProperties): void {
  if (!initialized) {
    console.error('[Analytics] Not initialized, cannot capture exception')
    return
  }

  posthog.captureException(error, {
    source: properties?.source,
    handled: properties?.handled ?? true,
    ...properties?.context,
  })
}
```

### 3.3 Native Implementation

Add to `packages/app/analytics/analytics.native.ts`:

```typescript
captureException(error: unknown, properties?: ExceptionProperties): void {
  if (!client) {
    console.error('[Analytics] Not initialized, cannot capture exception')
    return
  }

  client.captureException(error, {
    source: properties?.source,
    handled: properties?.handled ?? true,
    ...properties?.context,
  })
}
```

### 3.4 Usage Example

```typescript
const analytics = useAnalytics()

try {
  await riskyOperation()
} catch (error) {
  analytics.captureException(error as Error, {
    source: 'SendTransferScreen',
    handled: true,
    context: { transferId, amount },
  })
  // Show user-friendly error
  showToast('Transfer failed')
}
```

---

## Phase 4: React Error Boundary Integration

**Goal**: Capture React component errors with full context.

### 4.1 Create Analytics Error Boundary

Create `packages/app/components/AnalyticsErrorBoundary.tsx`:

```typescript
import { Component, type ReactNode } from 'react'
import { analytics } from 'app/analytics'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class AnalyticsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    analytics.captureException(error, {
      source: this.props.componentName ?? 'ErrorBoundary',
      handled: true,
      context: {
        componentStack: errorInfo.componentStack,
      },
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
```

### 4.2 Wrap Critical Sections

```typescript
// Example: in packages/app/provider/index.tsx
<AnalyticsErrorBoundary componentName="AppRoot" fallback={null}>
  <Concerns>{children}</Concerns>
</AnalyticsErrorBoundary>

// Or wrap specific screens/flows
<AnalyticsErrorBoundary componentName="SendFlow">
  <SendTransferScreen />
</AnalyticsErrorBoundary>
```

Pick a fallback UI that matches the app experience (blank screen, retry UI, etc.).

---

## Phase 5: Error Filtering and Grouping

**Goal**: Configure PostHog to filter noise and group related errors.

### 5.1 Filter Known/Expected Errors

Some errors are expected and shouldn't clutter error tracking:

```typescript
// In packages/app/analytics/analytics.web.ts init config
const IGNORED_ERRORS = [
  'ResizeObserver loop limit exceeded',
  'Network request failed',
  'AbortError',
]

posthog.init(apiKey, {
  // ...other config
  before_send: (event) => {
    if (event.event === '$exception') {
      const exceptionList = event.properties?.$exception_list
      const message = Array.isArray(exceptionList) ? exceptionList[0]?.value : undefined
      if (IGNORED_ERRORS.some(ignored => message?.includes(ignored))) {
        return null // Drop the event
      }
    }
    return event
  },
})
```

For React Native, the SDK doesn't support `before_send`. Apply filtering in the `captureException` wrapper:

```typescript
// In packages/app/analytics/analytics.native.ts
const IGNORED_ERRORS = [
  'Network request failed',
  'AbortError',
  'The operation was aborted',
]

captureException(error: unknown, properties?: ExceptionProperties): void {
  if (!client) {
    console.error('[Analytics] Not initialized, cannot capture exception')
    return
  }

  // Filter known/expected errors
  const message = error instanceof Error ? error.message : String(error)
  if (IGNORED_ERRORS.some(ignored => message.includes(ignored))) {
    return
  }

  client.captureException(error, {
    source: properties?.source,
    handled: properties?.handled ?? true,
    ...properties?.context,
  })
}
```

### 5.2 Grouping and Triage

PostHog groups errors by stack trace and message in Error Tracking. Use the custom `source` and `context` fields from Phase 3/4 to filter and group in the UI (e.g. by screen or flow).

---

## Phase 6: Alerting and Monitoring

**Goal**: Set up alerts for critical errors.

### 6.1 PostHog Error Tracking Dashboard

1. Navigate to PostHog > Error Tracking
2. Enable error tracking for the project
3. Configure grouping rules for similar stack traces

### 6.2 Create Alert Actions

1. Go to PostHog > Data Management > Actions
2. Create action for high-severity errors:
   - Name: "Critical Exception"
   - Match: `$exception` events where `source` contains critical paths

### 6.3 Set Up Webhooks (Optional)

Configure webhook to Slack/PagerDuty for critical errors:

1. PostHog > Settings > Integrations
2. Add webhook destination
3. Configure action to trigger webhook

---

## Implementation Checklist

### Phase 1: Web Autocapture
- [ ] Enable `capture_exceptions` with granular options in web config
- [ ] Configure rate limiter (refillRate: 5, bucketSize: 20)
- [ ] Test exception capture in development
- [ ] Set up source map uploads in CI/CD
- [ ] Verify exceptions appear in PostHog dashboard

### Phase 2: React Native JS Autocapture
- [ ] Upgrade `posthog-react-native` to >= 4.14.0
- [ ] Enable `errorTracking.autocapture` in `analytics.native.ts`
- [ ] Configure rate limiter in errorTracking options
- [ ] Ensure Hermes is enabled
- [ ] Test on iOS simulator
- [ ] Test on physical device with release build
- [ ] Verify exceptions appear in PostHog dashboard

### Phase 3: Manual Capture API
- [ ] Add `ExceptionProperties` type
- [ ] Add `captureException()` to web implementation
- [ ] Add `captureException()` to native implementation
- [ ] Export `ExceptionProperties` from analytics index
- [ ] Update `useAnalytics` hook to expose method
- [ ] Add to existing error handlers in critical flows

### Phase 4: Error Boundaries
- [ ] Create `AnalyticsErrorBoundary` component
- [ ] Wrap critical app sections
- [ ] Test boundary catches and reports errors

### Phase 5: Filtering and Grouping
- [ ] Identify and filter known/expected errors
- [ ] Configure fingerprinting for error grouping
- [ ] Review and tune grouping rules

### Phase 6: Alerting
- [ ] Set up Error Tracking dashboard
- [ ] Create actions for critical errors
- [ ] Configure alert destinations (Slack, email, etc.)

---

## References

- [PostHog Exception Autocapture Docs](https://posthog.com/docs/error-tracking/exception-autocapture)
- [PostHog React Native SDK](https://posthog.com/docs/libraries/react-native)
- [PostHog Source Maps](https://posthog.com/docs/error-tracking/source-maps)
