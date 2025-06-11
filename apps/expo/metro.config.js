// Learn more https://docs.expo.io/guides/customizing-metro
/**
 * @type {import('expo/metro-config')}
 */
const { getDefaultConfig } = require('@expo/metro-config')
const path = require('node:path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(__dirname, '../..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Add support for package.json exports field and fix module resolution issues
config.resolver.resolverMainFields = ['react-native', 'browser', 'main']
config.resolver.platforms = ['ios', 'android', 'native', 'web']

// Custom resolver to handle packages with exports field that Metro doesn't support properly
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@0xsend/send-earn-contracts') {
    return {
      filePath: path.resolve(
        workspaceRoot,
        'node_modules/@0xsend/send-earn-contracts/dist/index.js'
      ),
      type: 'sourceFile',
    }
  }
  // Fall back to default resolver for all other modules
  return context.resolveRequest(context, moduleName, platform)
}

config.transformer = { ...config.transformer, unstable_allowRequireContext: true }
config.transformer.minifierPath = require.resolve('metro-minify-terser')

module.exports = config
