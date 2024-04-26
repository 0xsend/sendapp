/**
 * Throws an error if the given value is not falsy
 */
export function throwIf(error: unknown) {
  if (!error) return // no error or falsy, do not throw
  if (error instanceof Error) throw error // error, throw it
  if (typeof error === 'string') throw new Error(error) // string, throw it
  throw new Error(`${error}`) // non-falsy, throw it
}
