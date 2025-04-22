import { applicationId } from 'expo-application'
import { Platform } from 'react-native'
const bundleId = applicationId?.split('.').reverse().join('.')
export const rpId = Platform.select({
  web: undefined,
  ios: bundleId,
  android: bundleId?.replaceAll('_', '-'),
})
