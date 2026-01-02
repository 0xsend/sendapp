import PostHog from 'posthog-react-native'
import type { PostHogEventProperties } from 'posthog-react-native/lib/posthog-core/src/types'
import type {
  AnalyticsEvent,
  AnalyticsService,
  AnalyticsUserProperties,
  ExceptionProperties,
} from './types'

let client: PostHog | null = null

const IGNORED_ERRORS = ['Network request failed', 'AbortError', 'The operation was aborted']

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
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
          console: ['error'],
        },
        rateLimiter: {
          refillRate: 5,
          bucketSize: 20,
        },
      },
    })

    await client.ready()
  },

  identify(distinctId: string, properties?: AnalyticsUserProperties) {
    client?.identify(distinctId, properties as PostHogEventProperties)
  },

  capture<E extends AnalyticsEvent>(event: E) {
    client?.capture(event.name, event.properties as PostHogEventProperties)
  },

  screen(name: string, properties?: Record<string, unknown>) {
    client?.screen(name, properties as PostHogEventProperties)
  },

  reset() {
    client?.reset()
  },

  isInitialized() {
    return client !== null
  },

  captureException(error: unknown, properties?: ExceptionProperties) {
    if (!client) {
      console.error('[Analytics] Not initialized, cannot capture exception')
      return
    }

    // Filter known/expected errors
    const message = error instanceof Error ? error.message : String(error)
    if (IGNORED_ERRORS.some((ignored) => message.includes(ignored))) {
      return
    }

    client.captureException(error, {
      source: properties?.source,
      handled: properties?.handled ?? true,
      ...properties?.context,
    })
  },
}
