import PostHog, { type PostHogEventProperties } from 'posthog-react-native'
import type { AnalyticsEvent, AnalyticsService, AnalyticsUserProperties } from './types'

let client: PostHog | null = null

export const analytics: AnalyticsService = {
  async init() {
    if (client) return

    const key = process.env.EXPO_PUBLIC_POSTHOG_KEY
    const host = process.env.EXPO_PUBLIC_POSTHOG_HOST

    if (!key) {
      console.warn('[Analytics] PostHog key not configured')
      return
    }

    client = new PostHog(key, {
      host,
      enableSessionReplay: false,
    })

    await client.ready()
  },

  identify(distinctId: string, properties?: AnalyticsUserProperties) {
    client?.identify(distinctId, properties as PostHogEventProperties)
  },

  capture<E extends AnalyticsEvent>(event: E) {
    client?.capture(event.name, event.properties as PostHogEventProperties)
  },

  captureException(error: Error, context?: Record<string, unknown>) {
    client?.capture('$exception', {
      $exception_message: error.message,
      $exception_stack_trace_raw: error.stack ?? '',
      ...(context as PostHogEventProperties),
    })
  },

  reset() {
    client?.reset()
  },

  isInitialized() {
    return client !== null
  },
}
