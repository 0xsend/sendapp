import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { analytics } from 'app/analytics'
import type { AnalyticsService } from 'app/analytics'
import { useUser } from 'app/utils/useUser'

const AnalyticsContext = createContext<AnalyticsService | null>(null)

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useUser()
  const initPromiseRef = useRef<Promise<void> | null>(null)

  // Initialize on mount
  useEffect(() => {
    if (!initPromiseRef.current) {
      initPromiseRef.current = analytics.init()
    }
  }, [])

  // Auto-identify when user changes (after initialization)
  useEffect(() => {
    const identify = async () => {
      // Wait for init to complete
      if (initPromiseRef.current) {
        await initPromiseRef.current
      }

      if (!analytics.isInitialized()) return

      if (user?.id && profile?.send_id) {
        analytics.identify(String(profile.send_id), {
          send_account_id: String(profile.send_id),
          sendtag: profile.main_tag?.name ?? undefined,
          profile_type: profile.is_business ? 'business' : 'personal',
        })
      } else {
        analytics.reset()
      }
    }
    identify()
  }, [user?.id, profile?.send_id, profile?.main_tag?.name, profile?.is_business])

  return <AnalyticsContext.Provider value={analytics}>{children}</AnalyticsContext.Provider>
}

export function useAnalytics(): AnalyticsService {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider')
  }
  return context
}
