import { ZodError } from 'zod'

interface ErrorWithDetails {
  message?: string
  details?: string
}

/**
 * Simple function to convert an unknown into a error string suitable for showing to a user.
 * If the error has a details property, it will return the first part of the details property.
 * if the error is an instance of Error, it will return the message of the error.
 * If the error is a string, it will return the first part of the string.
 *
 * @param e - The error to convert to a nice error message.
 * @returns The nice error message.
 * biome-ignore lint/suspicious/noExplicitAny: this is a generic function
 */
export function toNiceError(e: ErrorWithDetails | any): string {
  if (!e) return 'Unknown error'
  if (e instanceof ZodError) {
    return e.errors.map((e) => `${e.message} ${e.path.join('.')}`).join(', ')
  }
  // prioritzie details over message
  if (e.details !== undefined) return e.details.split('.').at(0) ?? e.details
  if (e instanceof Error || e.message) return e.message.split('.').at(0) ?? e.name
  if (typeof e === 'string') return e.split('.').at(0) ?? e

  // we don't know what this is
  console.error('Unknown error', e)
  return 'Unknown error'
}
