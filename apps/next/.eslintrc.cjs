/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['custom'],
  plugins: ['@next/next'],
  globals: {
    process: 'readonly',
    console: 'readonly',
  },
}
