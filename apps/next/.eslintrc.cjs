/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['custom'],
  plugins: ['@next/next'],
  ignorePatterns: ['./public', './.next', './.tamagui'],
}
