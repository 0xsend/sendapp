import { applicationId } from 'expo-application'
import { Platform } from 'react-native'
const bundleId = applicationId?.split('.').reverse().join('.')
// web use window.location.hostname
export const rpId = Platform.select({
  web: window.location.hostname,
  ios: bundleId,
  android: bundleId?.replaceAll('_', '-'),
  default: 'send.app',
})
