import { useQuery } from '@tanstack/react-query'

/**
 * Current version of the app that is running.
 * This is set on first fetch and compared on subsequent fetches.
 */
let version: string | null = null

/**
 * Default interval time in seconds to check for new version.
 * By default, it is set to 120 seconds (2 minutes).
 */
const DEFAULT_REFETCH_INTERVAL = 120

/**
 * Environment variable to override the default refetch interval.
 * Can be set via NEXT_PUBLIC_VERSION_UPDATER_REFETCH_INTERVAL_SECONDS.
 */
const VERSION_UPDATER_REFETCH_INTERVAL_SECONDS =
  process.env.NEXT_PUBLIC_VERSION_UPDATER_REFETCH_INTERVAL_SECONDS

interface VersionUpdaterResult {
  currentVersion: string
  oldVersion: string | null
  didChange: boolean
}

interface UseVersionUpdaterProps {
  /**
   * Optional override for the refetch interval in seconds.
   * If not provided, uses the environment variable or default (120s).
   */
  intervalTimeInSeconds?: number
  /**
   * Whether to enable version checking.
   * Defaults to true. Set to false to disable in development or testing.
   */
  enabled?: boolean
}

/**
 * Hook to check for version changes between client and server.
 *
 * This hook polls the /api/version endpoint at regular intervals and
 * when the window regains focus. When a version mismatch is detected,
 * it returns didChange: true.
 *
 * Example from packages/app/utils/useOFACGeoBlock.ts
 *
 * @param props Configuration options
 * @returns Query result with version information
 */
export function useVersionUpdater(props: UseVersionUpdaterProps = {}) {
  const { intervalTimeInSeconds, enabled = true } = props

  const interval = VERSION_UPDATER_REFETCH_INTERVAL_SECONDS
    ? Number(VERSION_UPDATER_REFETCH_INTERVAL_SECONDS)
    : DEFAULT_REFETCH_INTERVAL

  const refetchInterval = (intervalTimeInSeconds ?? interval) * 1000

  // Start fetching new version after half of the interval time
  const staleTime = refetchInterval / 2

  return useQuery<VersionUpdaterResult>({
    queryKey: ['version-updater'],
    staleTime,
    gcTime: refetchInterval,
    refetchInterval,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    enabled,
    queryFn: async () => {
      const response = await fetch('/api/version')
      const currentVersion = await response.text()

      const oldVersion = version
      version = currentVersion

      // Only mark as changed if we had a previous version and it differs
      const didChange = oldVersion !== null && currentVersion !== oldVersion

      return {
        currentVersion,
        oldVersion,
        didChange,
      }
    },
  })
}
