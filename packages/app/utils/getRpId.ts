import { Platform } from 'react-native'

export function getRpId() {
  return Platform.select({
    web: process.env.TAMAGUI_TARGET === 'web' ? window.location.hostname : undefined,
    ios: 'send.app',
    android: 'send.app',
  })
}
