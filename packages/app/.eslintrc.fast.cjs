/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['custom', 'plugin:@tanstack/eslint-plugin-query/recommended'],
  ignorePatterns: ['.eslintrc.js', '.eslintrc.fast.cjs', 'coverage/**'],
  // NOTE: No parserOptions.project here - this is the "fast" config for local iteration.
  // The default .eslintrc.cjs includes type-aware linting for CI parity.
  overrides: [
    {
      // Test files only
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
    },
  ],
}
