import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
// rollup.config.js
import typescript from '@rollup/plugin-typescript'
import nodePolyfills from 'rollup-plugin-node-polyfills'

export default {
  input: 'src/preload.ts',
  output: {
    name: 'WebAuthnAuthenticator',
    dir: 'dist',
    format: 'umd',
    intro: 'const global = window;',
  },
  plugins: [
    typescript(),
    nodeResolve(),
    commonjs(),
    nodePolyfills({
      include: null, // polyfills all files
    }),
  ],
}
