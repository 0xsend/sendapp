/** @type {import('next').NextConfig} */
import { join } from 'node:path'
import withPlaiceholder from '@plaiceholder/next'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const withBundleAnalyzer = require('@next/bundle-analyzer')
const { withTamagui } = require('@tamagui/next-plugin')

const boolVals = {
  true: true,
  false: false,
}

const disableExtraction =
  boolVals[process.env.DISABLE_EXTRACTION] ?? process.env.NODE_ENV === 'development'

const plugins = [
  withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: process.env.ANALYZE === 'true',
  }),
  withPlaiceholder,
  withTamagui({
    themeBuilder: {
      input: '../../packages/ui/src/themes/theme.ts',
      output: '../../packages/ui/src/themes/theme-generated.ts',
    },
    config: '../../packages/ui/src/tamagui.config.ts',
    components: ['tamagui', '@my/ui'],
    importsWhitelist: ['constants.js', 'colors.js'],
    outputCSS: process.env.NODE_ENV === 'production' ? './public/tamagui.css' : null,
    logTimings: true,
    disableExtraction,
    shouldExtract: (path) => {
      if (path.includes(join('packages', 'app'))) {
        return true
      }
    },
    excludeReactNativeWebExports: ['Switch', 'ProgressBar', 'Picker', 'CheckBox', 'Touchable'],
  }),
  (nextConfig) => {
    return {
      webpack: (webpackConfig, options) => {
        // Add Temporal to externals when building for server
        if (options.isServer) {
          webpackConfig.externals = [...(webpackConfig.externals || []), '@temporalio/client']
        }
        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(webpackConfig, options)
        }
        return webpackConfig
      },
    }
  },
  (nextConfig) => {
    return {
      webpack: (webpackConfig, options) => {
        webpackConfig.resolve.alias = {
          ...webpackConfig.resolve.alias,
          'react-native-svg': '@tamagui/react-native-svg',
        }
        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(webpackConfig, options)
        }
        return webpackConfig
      },
    }
  },
  (nextConfig) => {
    return {
      webpack: (webpackConfig, options) => {
        if (webpackConfig.name === 'server') {
          // Disable minification for server builds to avoid temporal build errors
          webpackConfig.optimization.minimize = false
        }
        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(webpackConfig, options)
        }
        return webpackConfig
      },
    }
  },
]

export default () => {
  /** @type {import('next').NextConfig} */
  let config = {
    images: {
      remotePatterns: [
        {
          hostname: '*-0xsend.vercel.app',
        },
        {
          hostname: 'ugqtoulexhvahevsysuq.supabase.co', // staging
        },
        {
          hostname: 'fjswgwdweohwejbrmiil.supabase.co', // production
        },
        {
          hostname: 'ui-avatars.com',
        },
        {
          hostname: 'localhost',
        },
        {
          hostname: 'avatars.githubusercontent.com',
        },
        {
          hostname: 'cloudflare-ipfs.com',
        },
        {
          protocol: 'https',
          hostname: 'github.com',
          pathname: '/0xsend/assets/**',
        },
        {
          protocol: 'https',
          hostname: 'ghassets.send.app',
        },
      ],
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    modularizeImports: {
      '@tamagui/lucide-icons': {
        transform: '@tamagui/lucide-icons/dist/esm/icons/{{kebabCase member}}',
        skipDefaultConversion: true,
      },
    },
    transpilePackages: [
      'solito',
      'react-native-web',
      'expo-linking',
      'expo-constants',
      'expo-clipboard',
      'expo-sharing',
      'expo-modules-core',
      'expo-device',
      'expo-image-picker',
      'expo-crypto',
    ],
    experimental: {
      scrollRestoration: true,
    },
    output: process.env.NODE_ENV === 'production' ? 'standalone' : null,
    async redirects() {
      return [
        {
          source: '/swap',
          destination: '/trade',
          permanent: true,
        },
      ]
    },
  }

  for (const plugin of plugins) {
    config = {
      ...config,
      ...plugin(config),
    }
  }

  return config
}
