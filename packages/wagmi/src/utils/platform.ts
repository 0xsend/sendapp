/**
 * Web platform detection
 * This is used to determine if we're running in a web environment vs. native
 */
export const isWeb = typeof document !== 'undefined'
