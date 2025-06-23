// Learn more https://docs.expo.io/guides/customizing-metro
/**
 * @type {import('expo/metro-config')}
 */
const { getDefaultConfig } = require('@expo/metro-config')
const path = require('node:path')
const fs = require('node:fs')

// eslint-disable-next-line no-undef
const projectRoot = __dirname
// eslint-disable-next-line no-undef
const workspaceRoot = path.resolve(__dirname, '../..')

// Load environment variables from root .env.local
const envPath = path.resolve(workspaceRoot, '.env.local')
const envVars = {}

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim()
      // Only include NEXT_PUBLIC_ and EXPO_PUBLIC_ variables for client-side
      if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('EXPO_PUBLIC_')) {
        envVars[key] = value
      }
    }
  }
}

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

config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  // Inject environment variables into the bundle
  transform: {
    ...config.transformer.transform,
    // Add environment variable replacements
    inlineRequires: true,
  },
}

config.transformer.minifierPath = require.resolve('metro-minify-terser')

// Inject environment variables as global replacements
const originalGetTransformOptions = config.transformer.getTransformOptions
config.transformer.getTransformOptions = async (entryPoints, options, getDependenciesOf) => {
  const transformOptions = originalGetTransformOptions
    ? await originalGetTransformOptions(entryPoints, options, getDependenciesOf)
    : {}

  return {
    ...transformOptions,
    transform: {
      ...transformOptions.transform,
      inlineRequires: true,
    },
  }
}

// Set environment variables in process.env for Metro to use
for (const key of Object.keys(envVars)) {
  // eslint-disable-next-line no-undef
  process.env[key] = envVars[key]
}

module.exports = config
