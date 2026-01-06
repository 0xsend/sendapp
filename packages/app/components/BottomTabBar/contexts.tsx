import { useSyncExternalStore, type PropsWithChildren } from 'react'

type Listener = () => void
let currentRoute = ''
const listeners = new Set<Listener>()

const store = {
  getSnapshot: () => currentRoute,
  subscribe: (listener: Listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  setCurrentRoute: (route: string) => {
    if (currentRoute !== route) {
      currentRoute = route
      for (const listener of listeners) {
        listener()
      }
    }
  },
}

export const useCurrentRoute = () => {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}

export const useIsActiveRoute = (routeKey: string) => {
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot() === routeKey,
    () => store.getSnapshot() === routeKey
  )
}

export const CurrentRouteProvider = ({
  children,
  currentRoute: route,
}: PropsWithChildren<{ currentRoute: string }>) => {
  store.setCurrentRoute(route)
  return <>{children}</>
}
