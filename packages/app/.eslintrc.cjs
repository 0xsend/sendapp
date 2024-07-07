/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['custom', 'plugin:@tanstack/eslint-plugin-query/recommended'],
  ignorePatterns: ['.eslintrc.js', 'coverage/**'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  overrides: [
    {
      // Test files only
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: ['plugin:testing-library/react'],
    },
  ],
}
