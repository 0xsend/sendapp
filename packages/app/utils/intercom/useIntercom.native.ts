import { useEffect } from 'react'
import Intercom, { Visibility } from '@intercom/intercom-react-native'

export default function useIntercom() {
  useEffect(() => {
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

  const openChat = () => {
    void Intercom.present()
  }

  return { openChat }
}
