import { Platform } from 'react-native'

export function getRpId() {
  console.log('applicationId', applicationId)

  return Platform.select({
    web: undefined,
    ios: 'send.app',
    android: 'send.app',
  })
}
