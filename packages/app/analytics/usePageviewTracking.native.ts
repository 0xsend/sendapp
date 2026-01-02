import { usePathname } from 'expo-router'
import { useEffect, useRef } from 'react'
import { analytics } from 'app/analytics'

/**
 * Tracks $screen events on native using expo-router pathname.
 * Web uses usePageviewTracking.ts for $pageview events.
 */
export function usePageviewTracking() {
  const pathname = usePathname()
  const previousPathname = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!pathname) return
    if (pathname === previousPathname.current) return

    analytics.capture({
      name: '$screen',
      properties: {
        $screen_name: pathname,
      },
    })
    previousPathname.current = pathname
  }, [pathname])
}
