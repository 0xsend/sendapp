import { Platform } from 'react-native'

export function getRpId() {
  return Platform.select({
    web: undefined,
    ios: 'send.app',
    android: 'send.app',
  })
}
