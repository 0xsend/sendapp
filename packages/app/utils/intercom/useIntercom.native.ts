import { useCallback, useEffect } from 'react'
import Intercom, { Visibility } from '@intercom/intercom-react-native'

const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID
const isIntercomConfigured = INTERCOM_APP_ID && INTERCOM_APP_ID !== 'XXX'

export default function useIntercom() {
  useEffect(() => {
    if (!isIntercomConfigured) {
      return
    }

    const initializeIntercom = async () => {
      try {
        await Intercom.loginUnidentifiedUser()
        await Intercom.setLauncherVisibility(Visibility.GONE)
      } catch (error) {
        console.error('Failed to initialize Intercom:', error)
      }
    }

    void initializeIntercom()
  }, [])

  const openChat = useCallback(() => {
    void Intercom.present()
  }, [])

  return { openChat }
}
