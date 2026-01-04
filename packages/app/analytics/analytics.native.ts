import type { PostHogEventProperties } from '@posthog/core'
import debug from 'debug'
import PostHog from 'posthog-react-native'
import type {
  AnalyticsEvent,
  AnalyticsService,
  AnalyticsUserProperties,
  ExceptionProperties,
} from './types'

const log = debug('app:analytics')

let client: PostHog | null = null
let isReady = false

const IGNORED_ERRORS = ['Network request failed', 'AbortError', 'The operation was aborted']

export const analytics: AnalyticsService = {
  async init() {
    if (isReady) return

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!key) {
      log('PostHog key not configured')
      return
    }

    log('initializing PostHog')
    client = new PostHog(key, {
      host,
      enableSessionReplay: false,
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
          console: ['error'],
        },
      },
    })

    await client.ready()
    isReady = true
    log('PostHog ready')
  },

  identify(distinctId: string, properties?: AnalyticsUserProperties) {
    if (!client) {
      log('identify called but client not initialized', { distinctId })
      return
    }
    log('identify', { distinctId, properties })
    client.identify(distinctId, {
      ...properties,
      $process_person_profile: true,
    } as PostHogEventProperties)
    // Flush immediately to ensure person profile is created
    client.flush()
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
    return isReady
  },

  captureException(error: unknown, properties?: ExceptionProperties) {
    if (!client) {
      log('Not initialized, cannot capture exception')
      return
    }

    // Filter known/expected errors
    const message = error instanceof Error ? error.message : String(error)
    if (IGNORED_ERRORS.some((ignored) => message.includes(ignored))) {
      return
    }

    client.captureException(error, {
      ...(properties?.source && { source: properties.source }),
      handled: properties?.handled ?? true,
      ...properties?.context,
    })
  },
}
