// rollup.config.js
import typescript from '@rollup/plugin-typescript'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'src/preload.ts',
  output: {
    name: 'WebAuthnAuthenticator',
    dir: 'dist',
    format: 'umd',
    intro: 'const global = window;',
  },
  plugins: [
    typescript({
      noForceEmit: false,
      outputToFilesystem: true,
    }),
    nodePolyfills({
      include: null, // polyfills all files
    }),
    nodeResolve(),
    commonjs(),
  ],
}
