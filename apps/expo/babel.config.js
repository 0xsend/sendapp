module.exports = (api) => {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
    plugins: [
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          root: ['../..'],
          alias: {
            // define aliases to shorten the import paths
            app: '../../packages/app',
            'apps-expo': '.',
            '@my/ui': '../../packages/ui',
            '@wagmi/core/codegen': '../../node_modules/@wagmi/core/dist/esm/exports/codegen.js',
            cbor2: '../../node_modules/cbor2/lib/index.js',
          },
          extensions: ['.js', '.jsx', '.tsx', '.ios.js', '.android.js'],
        },
      ],
      // if you want reanimated support
      'react-native-reanimated/plugin',
      ...(process.env.EAS_BUILD_PLATFORM === 'android'
        ? []
        : [
            [
              '@tamagui/babel-plugin',
              {
                components: ['@my/ui', 'tamagui'],
                config: './tamagui.config.ts',
              },
            ],
          ]),
      'transform-inline-environment-variables',
    ],
  }
}
