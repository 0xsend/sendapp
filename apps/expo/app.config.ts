import * as process from 'node:process'

const appVariant = process.env.APP_VARIANT || 'production'

const getAppConfig = () => {
  switch (appVariant) {
    case 'preview':
      return {
        displayName: 'Send (Preview)',
        iosBundleIdentifier: 'send.app.preview',
        androidPackage: 'app.send.preview',
      }
    case 'staging':
      return {
        displayName: 'Send (Staging)',
        iosBundleIdentifier: 'send.app.staging',
        androidPackage: 'app.send.staging',
      }
    default:
      return {
        displayName: 'Send',
        iosBundleIdentifier: 'send.app',
        androidPackage: 'app.send',
      }
  }
}

const appConfig = getAppConfig()

module.exports = {
  name: appConfig.displayName,
  owner: 'send-it',
  slug: 'send',
  scheme: 'send',
  version: '1.1.4',
  experiments: {
    reactCanary: true,
    reactCompiler: true,
  },
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/21a964cb-0d04-42e5-bc00-7f8bf0fd5064',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: appConfig.iosBundleIdentifier,
    displayName: appConfig.displayName,
    associatedDomains: ['webcredentials:send.app', 'applinks:send.app'],
    appleTeamId: '325JS7C582',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationCategoryType: 'public.app-category.finance',
      UIRequiredDeviceCapabilities: [],
    },
    icon: './assets/icons/ios-icon.icon',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icons/android-adaptive-icon.png',
      backgroundColor: '#40FB50',
    },
    package: appConfig.androidPackage,
    permissions: ['android.permission.RECORD_AUDIO'],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'send.app',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          newArchEnabled: true,
        },
        ios: {
          deploymentTarget: '15.1',
          newArchEnabled: true,
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
    'expo-secure-store',
    'expo-web-browser',
    [
      '@intercom/intercom-react-native',
      {
        appId: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
        androidApiKey: process.env.NEXT_PUBLIC_INTERCOM_ANDROID_API_KEY,
        iosApiKey: process.env.NEXT_PUBLIC_INTERCOM_IOS_API_KEY,
      },
    ],
    'expo-localization',
  ],
  extra: {
    eas: {
      projectId: '21a964cb-0d04-42e5-bc00-7f8bf0fd5064',
    },
  },
}
