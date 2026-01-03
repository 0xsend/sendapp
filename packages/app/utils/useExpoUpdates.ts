import * as Updates from 'expo-updates'
import { useCallback, useEffect, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { analytics } from 'app/analytics'

interface UseExpoUpdatesResult {
  isUpdateAvailable: boolean
  isDownloading: boolean
  isDownloaded: boolean
  error: Error | null
  checkForUpdate: () => Promise<void>
  downloadUpdate: () => Promise<void>
  restartApp: () => Promise<void>
}

interface UseExpoUpdatesOptions {
  checkOnMount?: boolean
  checkOnForeground?: boolean
  checkIntervalMs?: number
}

const DEFAULT_CHECK_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Hook for managing Expo OTA updates on native platforms.
 *
 * Checks for updates periodically and when the app comes to foreground.
 * When an update is available, it automatically downloads it.
 * The app must be restarted to apply the update.
 */
export function useExpoUpdates(options: UseExpoUpdatesOptions = {}): UseExpoUpdatesResult {
  const {
    checkOnMount = true,
    checkOnForeground = true,
    checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS,
  } = options

  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const checkForUpdate = useCallback(async () => {
    // Skip in development or when updates are not available
    if (__DEV__ || !Updates.isEnabled) {
      return
    }

    try {
      const update = await Updates.checkForUpdateAsync()
      if (update.isAvailable) {
        setIsUpdateAvailable(true)
        // Track update available event
        analytics.capture({
          name: 'ota_update_available',
          properties: {
            runtime_version: Updates.runtimeVersion ?? undefined,
            update_id: update.manifest?.id,
          },
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to check for updates'))
    }
  }, [])

  const downloadUpdate = useCallback(async () => {
    if (!isUpdateAvailable || isDownloading || isDownloaded) {
      return
    }

    try {
      setIsDownloading(true)
      setError(null)

      // Track download started
      analytics.capture({
        name: 'ota_update_download_started',
        properties: {
          runtime_version: Updates.runtimeVersion ?? undefined,
        },
      })

      await Updates.fetchUpdateAsync()
      setIsDownloaded(true)

      // Track download completed
      analytics.capture({
        name: 'ota_update_download_completed',
        properties: {
          runtime_version: Updates.runtimeVersion ?? undefined,
        },
      })
    } catch (e) {
      const downloadError = e instanceof Error ? e : new Error('Failed to download update')
      setError(downloadError)

      // Track download failed
      analytics.capture({
        name: 'ota_update_download_failed',
        properties: {
          runtime_version: Updates.runtimeVersion ?? undefined,
          error_type: 'network',
        },
      })
    } finally {
      setIsDownloading(false)
    }
  }, [isUpdateAvailable, isDownloading, isDownloaded])

  const restartApp = useCallback(async () => {
    if (!isDownloaded) {
      return
    }

    try {
      await Updates.reloadAsync()
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to restart app'))
    }
  }, [isDownloaded])

  // Auto-download when update is available
  useEffect(() => {
    if (isUpdateAvailable && !isDownloading && !isDownloaded) {
      void downloadUpdate()
    }
  }, [isUpdateAvailable, isDownloading, isDownloaded, downloadUpdate])

  // Check on mount
  useEffect(() => {
    if (checkOnMount) {
      void checkForUpdate()
    }
  }, [checkOnMount, checkForUpdate])

  // Check on foreground
  useEffect(() => {
    if (!checkOnForeground) {
      return
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        void checkForUpdate()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [checkOnForeground, checkForUpdate])

  // Periodic check
  useEffect(() => {
    if (checkIntervalMs <= 0) {
      return
    }

    const intervalId = setInterval(checkForUpdate, checkIntervalMs)
    return () => clearInterval(intervalId)
  }, [checkIntervalMs, checkForUpdate])

  return {
    isUpdateAvailable,
    isDownloading,
    isDownloaded,
    error,
    checkForUpdate,
    downloadUpdate,
    restartApp,
  }
}
