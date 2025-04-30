import { registerRootComponent } from 'expo'
import { ExpoRoot } from 'expo-router'
import 'react-native-url-polyfill/auto'
import React from 'react'

// biome-ignore lint/style/useNodejsImportProtocol: this is a polyfill
import { Buffer } from 'buffer'

global.Buffer = Buffer

//NOTE: do not remove. this is a workaround for build to work with expo v51.0.0
// eslint-disable-next-line react/display-name
React.AnimatedComponent = ({ children }) => <>{children}</>

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app')
  return <ExpoRoot context={ctx} />
}

registerRootComponent(App)
