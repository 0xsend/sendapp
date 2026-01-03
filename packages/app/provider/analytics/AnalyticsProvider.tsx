import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { analytics } from 'app/analytics'
import type { AnalyticsService } from 'app/analytics'
import { useUser } from 'app/utils/useUser'

const AnalyticsContext = createContext<AnalyticsService | null>(null)

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useUser()

  // Initialize on mount
  useEffect(() => {
    analytics.init()
  }, [])

  // Auto-identify when user changes
  useEffect(() => {
    if (!analytics.isInitialized()) return

    if (user?.id && profile?.send_id) {
      analytics.identify(String(profile.send_id), {
        send_account_id: String(profile.send_id),
        sendtag: profile.main_tag?.name ?? undefined,
      })
    } else {
      analytics.reset()
    }
  }, [user?.id, profile?.send_id, profile?.main_tag?.name])

  return <AnalyticsContext.Provider value={analytics}>{children}</AnalyticsContext.Provider>
}

export function useAnalytics(): AnalyticsService {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider')
  }
  return context
}
