// Preload script to initialize __DEV__ before any other module imports
// @ts-expect-error set __DEV__ for code shared between server and client
globalThis.__DEV__ = process.env.NODE_ENV !== 'production'
