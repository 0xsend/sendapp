import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import { analytics } from 'app/analytics'

/**
 * Tracks $pageview events on web using Next.js router.
 * Native uses usePageviewTracking.native.ts for $screen events.
 */
export function usePageviewTracking() {
  const router = useRouter()
  const previousPath = useRef<string | undefined>(undefined)

  useEffect(() => {
    const trackPageview = (url: string) => {
      if (!analytics.isInitialized()) return
      if (url === previousPath.current) return

      analytics.capture({
        name: '$pageview',
        properties: {
          $current_url: `${window.location.origin}${url}`,
        },
      })
      previousPath.current = url
    }

    // Track initial page load
    trackPageview(router.asPath)

    // Track route changes
    router.events.on('routeChangeComplete', trackPageview)

    return () => {
      router.events.off('routeChangeComplete', trackPageview)
    }
  }, [router])
}
