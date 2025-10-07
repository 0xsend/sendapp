import * as process from 'node:process'

module.exports = {
  name: 'Send',
  owner: 'send-it',
  slug: 'send',
  scheme: 'send',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'send.app',
    displayName: 'Send',
    associatedDomains: ['webcredentials:send.app'],
    appleTeamId: '8S6R4SU556',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationCategoryType: 'public.app-category.finance',
    },
    icon: './assets/icons/ios-light-icon.png',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icons/android-adaptive-icon.png',
      backgroundColor: '#40FB50',
    },
    package: 'app.send',
    permissions: ['android.permission.RECORD_AUDIO'],
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
        },
        ios: {
          deploymentTarget: '15.1',
        },
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'The app accesses your photos to let you share them with your friends.',
      },
    ],
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/icons/splash-icon-light.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          image: './assets/icons/splash-icon-dark.png',
          backgroundColor: '#122023',
        },
      },
    ],
    'expo-font',
    [
      '@intercom/intercom-react-native',
      {
        appId: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
        androidApiKey: process.env.NEXT_PUBLIC_INTERCOM_ANDROID_API_KEY,
        iosApiKey: process.env.NEXT_PUBLIC_INTERCOM_IOS_API_KEY,
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '21a964cb-0d04-42e5-bc00-7f8bf0fd5064',
    },
  },
}
