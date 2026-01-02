import posthog from 'posthog-js'
import type {
  AnalyticsEvent,
  AnalyticsService,
  AnalyticsUserProperties,
  ExceptionProperties,
} from './types'

let initialized = false

const IGNORED_ERRORS = [
  'ResizeObserver loop limit exceeded',
  'Network request failed',
  'AbortError',
]

export const analytics: AnalyticsService = {
  async init() {
    if (initialized) return

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!key) {
      console.warn('[Analytics] PostHog key not configured')
      return
    }

    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      capture_exceptions: {
        capture_unhandled_errors: true,
        capture_unhandled_rejections: true,
        capture_console_errors: false,
      },
      error_tracking: {
        __exceptionRateLimiterRefillRate: 5,
        __exceptionRateLimiterBucketSize: 20,
      },
      before_send: (event) => {
        if (!event) return null
        if (event.event === '$exception') {
          const exceptionList = event.properties?.$exception_list
          const message = Array.isArray(exceptionList) ? exceptionList[0]?.value : undefined
          if (IGNORED_ERRORS.some((ignored) => message?.includes(ignored))) {
            return null
          }
        }
        return event
      },
    })

    initialized = true
  },

  identify(distinctId: string, properties?: AnalyticsUserProperties) {
    if (!initialized) return
    posthog.identify(distinctId, properties)
  },

  capture<E extends AnalyticsEvent>(event: E) {
    if (!initialized) return
    posthog.capture(event.name, event.properties)
  },

  screen(_name: string, _properties?: Record<string, unknown>) {
    // No-op on web - pageviews are captured automatically via capture_pageview option
  },

  reset() {
    if (!initialized) return
    posthog.reset()
  },

  isInitialized() {
    return initialized
  },

  captureException(error: unknown, properties?: ExceptionProperties) {
    if (!initialized) {
      console.error('[Analytics] Not initialized, cannot capture exception')
      return
    }

    posthog.captureException(error, {
      source: properties?.source,
      handled: properties?.handled ?? true,
      ...properties?.context,
    })
  },
}
