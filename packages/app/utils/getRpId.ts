import { applicationId } from 'expo-application'
import { Platform } from 'react-native'

export function getRpId() {
  const bundleId = applicationId?.split('.').reverse().join('.')
  const web = window ? window.location.hostname : undefined
  return Platform.select({
    web,
    ios: bundleId,
    android: bundleId?.replaceAll('_', '-'),
  })
}
