import { applicationId } from 'expo-application'
import { Platform } from 'react-native'

export function getRpId() {
  return Platform.select({
    web: undefined,
    ios: applicationId,
    android: applicationId, // TODO this values for sure is wrong, gonna fix it when working on android
  })
}
