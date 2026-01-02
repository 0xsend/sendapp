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
      capture_pageview: true,
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
}
