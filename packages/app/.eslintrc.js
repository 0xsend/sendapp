/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['custom', 'plugin:@tanstack/eslint-plugin-query/recommended'],
  ignorePatterns: ['.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
}
