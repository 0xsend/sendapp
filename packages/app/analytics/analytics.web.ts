import posthog from 'posthog-js'
import type { AnalyticsEvent, AnalyticsService, AnalyticsUserProperties } from './types'

let initialized = false

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
      capture_pageview: false,
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
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

  captureException(error: Error, context?: Record<string, unknown>) {
    if (!initialized) return
    posthog.capture('$exception', {
      $exception_message: error.message,
      $exception_stack_trace_raw: error.stack,
      ...context,
    })
  },

  reset() {
    if (!initialized) return
    posthog.reset()
  },

  isInitialized() {
    return initialized
  },
}
