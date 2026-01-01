'use client'

import { useEffect, useRef, useState } from 'react'
import { useMedia, View } from '@my/ui'
import { useWebPush } from './WebPushSubscription'
import { useSessionContext } from 'app/utils/supabase/useSessionContext'
import { NotificationPrompt } from './NotificationPrompt'

/**
 * Automatically shows notification permission prompt after user logs in.
 *
 * Shows a UI banner that allows user to enable notifications if:
 * - User is authenticated
 * - Browser supports notifications
 * - Permission hasn't been requested yet (state is 'prompt')
 * - User hasn't denied permission
 * - This is a new session (hasn't seen banner this session)
 *
 * Note: Requires user interaction to request permission (browser security requirement)
 *
 * Usage: Add to your root layout or _app.tsx:
 * ```tsx
 * <NotificationAutoPrompt />
 * ```
 */
export function NotificationAutoPrompt() {
  const media = useMedia()
  const { session } = useSessionContext()
  const { permission, isSupported, isSubscribed } = useWebPush()
  const hasShown = useRef(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Don't show banner if:
    // - Already shown this session
    // - Not supported
    // - User not authenticated
    // - Permission already requested or denied
    // - Already subscribed
    if (
      hasShown.current ||
      !isSupported ||
      !session?.user ||
      permission !== 'prompt' ||
      isSubscribed
    ) {
      return
    }

    // Add a small delay to avoid interrupting login flow
    const timer = setTimeout(() => {
      hasShown.current = true
      setShowBanner(true)
    }, 2000) // 2 second delay after login

    return () => clearTimeout(timer)
  }, [session?.user, permission, isSupported, isSubscribed])

  if (!showBanner) {
    return null
  }

  return (
    <View
      position="absolute"
      right={20}
      maxWidth={400}
      zIndex={9999}
      {...(media.gtMd ? { bottom: 20, marginTop: 'auto' } : { top: 20, marginBottom: 'auto' })}
    >
      <NotificationPrompt
        onDismiss={() => setShowBanner(false)}
        title="Enable notifications"
        description="Get notified instantly when you receive payments"
      />
    </View>
  )
}
