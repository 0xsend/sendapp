import { Platform } from 'react-native'

export function getRpId() {
  return Platform.select({
    web: typeof window !== 'undefined' ? window.location.hostname : undefined,
    ios: 'send.app',
    android: 'send.app',
  })
}
