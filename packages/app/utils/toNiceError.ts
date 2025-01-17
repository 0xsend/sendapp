interface ErrorWithDetails {
  message?: string
  details?: string
}

/**
 * Simple function to convert an unknown into a error string suitable for showing to a user.
 * If the error is an instance of Error, it will return the message of the error.
 * If the error is a string, it will return the first part of the string.
 * If the error is an object with a details property, it will return the first part of the details property.
 * If the error is an object without a details property, it will return the first part of the error when cast to a string.
 * If the error is unknown, it will return the string representation of the error.
 *
 * @param e - The error to convert to a nice error message.
 * @returns The nice error message.
 * biome-ignore lint/suspicious/noExplicitAny: this is a generic function
 */
export function toNiceError(e: ErrorWithDetails | any): string {
  console.error(e)
  if (!e) return 'Unknown error'
  // prioritzie details over message
  if (e.details !== undefined) return e.details.split('.').at(0) ?? e.details
  if (e instanceof Error || e.message) return e.message.split('.').at(0) ?? e.name
  if (typeof e === 'string') return e.split('.').at(0) ?? e

  // we don't know what this is
  console.error('Unknown error', e)
  return 'Unknown error'
}
