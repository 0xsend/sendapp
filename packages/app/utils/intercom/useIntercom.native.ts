import { useEffect } from 'react'
import Intercom, { Visibility } from '@intercom/intercom-react-native'

// TODO
// testy na devie
// naprawić ciemny motyw na iphonie

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

    return () => {
      void Intercom.logout()
    }
  }, [])

  const openChat = () => {
    void Intercom.present()
  }

  return { openChat }
}
