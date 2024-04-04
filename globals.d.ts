export type {}

declare global {
  /**
   * This variable is set to true when react-native is running in Dev mode.
   * Ported here so we can share some react native code.
   * @example
   * if (__DEV__) console.log('Running in dev mode')
   */
  const __DEV__: boolean
}
