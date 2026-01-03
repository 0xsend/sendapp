# AnalyticsErrorBoundary Implementation Plan

This document outlines how to integrate `AnalyticsErrorBoundary` as a global fatal exception handler for web and native platforms.

## Current State

- `AnalyticsErrorBoundary` exists at `packages/app/components/AnalyticsErrorBoundary.tsx`
- It captures exceptions via `analytics.captureException()` with component stack context
- **Not currently used anywhere** - the component exists but isn't integrated

## Goal

Wrap critical app sections with `AnalyticsErrorBoundary` to:
1. Capture unhandled React errors with component stack traces in PostHog
2. Display a recovery UI that allows users to return home
3. Prevent white screens of death from crashing the entire app

---

## Phase 1: Create Recovery Fallback UI

The current boundary renders `null` on error, which isn't helpful. Create a user-friendly fallback.

### 1.1 Create `ErrorFallback` Component

Create `packages/app/components/ErrorFallback.tsx`:

```typescript
import { useCallback } from 'react'
import { Button, H2, Paragraph, YStack } from '@my/ui'
import { useRouter } from 'solito/router'

interface Props {
  error?: Error
  resetError?: () => void
}

export function ErrorFallback({ error, resetError }: Props) {
  const router = useRouter()

  const handleGoHome = useCallback(() => {
    router.replace('/')
    // Reset after navigation to avoid immediately re-rendering the crashing tree
    setTimeout(() => resetError?.(), 0)
  }, [router, resetError])

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$4">
      <H2>Something went wrong</H2>
      <Paragraph color="$gray10" textAlign="center">
        An unexpected error occurred. Please try again.
      </Paragraph>
      {__DEV__ && error && (
        <Paragraph color="$red10" fontSize="$2" fontFamily="$mono">
          {error.message}
        </Paragraph>
      )}
      <Button onPress={handleGoHome} theme="green">
        Go Home
      </Button>
    </YStack>
  )
}
```

### 1.2 Update `AnalyticsErrorBoundary` to Support Reset

Update `packages/app/components/AnalyticsErrorBoundary.tsx`:

```typescript
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { analytics } from 'app/analytics'

interface Props {
  children: ReactNode
  fallback?: ReactNode | ((props: { error?: Error; resetError: () => void }) => ReactNode)
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    analytics.captureException(error, {
      source: this.props.componentName ?? 'ErrorBoundary',
      handled: true,
      context: {
        componentStack: errorInfo.componentStack,
      },
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props
      if (typeof fallback === 'function') {
        return fallback({ error: this.state.error, resetError: this.resetError })
      }
      return fallback ?? null
    }
    return this.props.children
  }
}
```

---

## Phase 2: Web Integration

### 2.1 Wrap at App Root

Update `apps/next/pages/_app.tsx`:

```typescript
import { AnalyticsErrorBoundary } from 'app/components/AnalyticsErrorBoundary'
import { ErrorFallback } from 'app/components/ErrorFallback'

// In MyApp component, wrap Provider:
<NextThemeProvider>
  <Provider initialSession={pageProps.initialSession} i18n={i18n}>
    <AnalyticsErrorBoundary
      componentName="AppRoot"
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} />
      )}
    >
      {getLayout(<Component {...pageProps} />)}
    </AnalyticsErrorBoundary>
  </Provider>
</NextThemeProvider>
```

### 2.2 Optional: Granular Boundaries

For critical flows, add specific boundaries:

```typescript
// Example: Wrap send flow
<AnalyticsErrorBoundary componentName="SendFlow">
  <SendScreen />
</AnalyticsErrorBoundary>
```

---

## Phase 3: Native Integration

### 3.1 Wrap at Root Layout

Update `apps/expo/app/_layout.tsx`:

```typescript
import { AnalyticsErrorBoundary } from 'app/components/AnalyticsErrorBoundary'
import { ErrorFallback } from 'app/components/ErrorFallback'

// In RootLayout return:
<GestureHandlerRootView style={{ flex: 1 }}>
  <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
    <Provider initialSession={initialSession} i18n={getI18n()}>
      <AnalyticsErrorBoundary
        componentName="AppRoot"
        fallback={({ error, resetError }) => (
          <ErrorFallback error={error} resetError={resetError} />
        )}
      >
        <StackNavigator />
      </AnalyticsErrorBoundary>
    </Provider>
  </View>
</GestureHandlerRootView>
```

### 3.2 Native-Specific Fallback (Optional)

For native, use explicit routes in a platform override `ErrorFallback.native.tsx`:

```typescript
import { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'solito/router'

interface Props {
  error?: Error
  resetError?: () => void
}

export function ErrorFallback({ error, resetError }: Props) {
  const router = useRouter()

  const handleGoHome = useCallback(() => {
    router.replace('/(tabs)/home')
    // Reset after navigation to avoid immediately re-rendering the crashing tree
    setTimeout(() => resetError?.(), 0)
  }, [router, resetError])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>An unexpected error occurred.</Text>
      {__DEV__ && error && (
        <Text style={styles.error}>{error.message}</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={handleGoHome}>
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  message: { fontSize: 14, color: '#666', marginBottom: 16 },
  error: { fontSize: 12, color: 'red', fontFamily: 'monospace', marginBottom: 16 },
  button: { backgroundColor: '#22c55e', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '600' },
})
```

---

## Phase 4: Testing

### 4.1 Dev Testing Component

Create a temporary test button (remove after testing):

```typescript
// Add to any screen in DEV mode
{__DEV__ && (
  <Button
    onPress={() => {
      throw new Error('Test error boundary')
    }}
  >
    Test Error
  </Button>
)}
```

### 4.2 Verification Checklist

- [ ] **Web**: Trigger error, verify fallback renders, verify PostHog receives exception with `componentStack`
- [ ] **Web**: Click "Go Home", verify app recovers and navigates to `/`
- [ ] **Native**: Trigger error in iOS simulator, verify fallback renders
- [ ] **Native**: Trigger error in Android emulator, verify fallback renders
- [ ] **Native**: Verify "Reload App" recovers the app
- [ ] **PostHog**: Check Error Tracking dashboard shows exceptions with `source: AppRoot`

---

## Implementation Checklist

### Phase 1: Recovery UI
- [ ] Create `ErrorFallback.tsx` in `packages/app/components/`
- [ ] Update `AnalyticsErrorBoundary` to support render prop fallback
- [ ] Add `resetError` callback to boundary

### Phase 2: Web
- [ ] Import and wrap in `apps/next/pages/_app.tsx`
- [ ] Test error capture and recovery

### Phase 3: Native
- [ ] Import and wrap in `apps/expo/app/_layout.tsx`
- [ ] Create `ErrorFallback.native.tsx` if needed
- [ ] Test on iOS and Android

### Phase 4: Verification
- [ ] Test error capture in PostHog dashboard
- [ ] Remove test buttons
- [ ] Document in codebase

---

## Notes

- **Placement matters**: Place the boundary inside `Provider` so Tamagui/SafeArea context is available for the fallback; provider-level errors won’t be caught.
- **Multiple boundaries**: Consider wrapping critical flows (Send, Checkout) with named boundaries for better error attribution in PostHog.
- **Error boundaries don't catch**: Event handlers, async code, SSR errors, or errors in the boundary itself. PostHog autocapture handles those via `capture_exceptions`.

## References

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [PostHog Exception Handling](./posthog-exception-handling.md)
- Current component: `packages/app/components/AnalyticsErrorBoundary.tsx`
