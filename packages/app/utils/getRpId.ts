import { applicationId } from 'expo-application'
import { Platform } from 'react-native'

export function getRpId() {
  const bundleId = applicationId?.split('.').reverse().join('.')
  return Platform.select({
    web: undefined,
    ios: bundleId,
    android: bundleId?.replaceAll('_', '-'),
  })
}
