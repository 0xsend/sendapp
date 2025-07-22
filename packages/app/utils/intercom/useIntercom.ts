import { useEffect } from 'react'
import Intercom, { hide, showNewMessage } from '@intercom/messenger-js-sdk'

export default function useIntercom() {
  useEffect(() => {
    try {
      Intercom({ app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID, hide_default_launcher: true })
    } catch (error) {
      console.error('Failed to initialize Intercom:', error)
    }

    return () => {
      hide()
    }
  }, [])

  const openChat = () => {
    showNewMessage('')
  }

  return { openChat }
}
