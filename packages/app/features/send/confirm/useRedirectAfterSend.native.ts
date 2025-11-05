import { useRouter } from 'expo-router'
import { useNavigationState } from '@react-navigation/native'

type NavigationSource = 'tab' | 'profile' | 'history' | 'unknown'

export default function useRedirectAfterSend() {
  const router = useRouter()

  // Determine where we came from before navigating to /send/form
  // This helps us decide how to handle the navigation stack after send completes
  const navigationSource = useNavigationState((state): NavigationSource => {
    if (!state) return 'unknown'

    const routes = state.routes
    const currentIndex = state.index

    // We're on /send/confirm (current)
    // /send/form should be at currentIndex - 1
    // The source screen should be at currentIndex - 2
    if (currentIndex >= 2) {
      const sourceRoute = routes[currentIndex - 2]
      const routeName = sourceRoute?.name || ''
      const routeParams = (sourceRoute?.params as Record<string, unknown>) || {}
      const routeScreen = (routeParams?.screen as string) || ''
      const routePath = (routeParams?.path as string) || ''

      // Check if we came from history screen
      if (
        routeName.includes('history') ||
        routeScreen.includes('history') ||
        routePath.includes('history')
      ) {
        return 'history'
      }

      // Check if we came from a tab screen (send tab)
      // Tab screens are under (tabs) group in expo-router
      if (routeName.includes('(tabs)') || routeName.includes('send/index')) {
        return 'tab'
      }

      // Check if we came from a profile screen
      if (routeName.includes('profile') && !routeName.includes('history')) {
        return 'profile'
      }
    }

    return 'unknown'
  })

  const redirect = (sendId?: number | null) => {
    const pathname = sendId ? `/profile/${sendId}/history` : '/activity'

    switch (navigationSource) {
      case 'history':
        // Flow: /profile/sendid/history -> form -> confirm -> /profile/sendid/history
        router.back()
        break

      default:
        // Fallback to the original behavior
        router.back()
        router.replace({ pathname })
        break
    }
  }

  return {
    redirect,
  }
}
