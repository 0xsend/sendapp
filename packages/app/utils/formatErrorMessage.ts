export const formatErrorMessage = (error: Error) => {
  if (
    error.message?.startsWith('The operation either timed out or was not allowed') ||
    error.message?.startsWith(
      'The request is not allowed by the user agent or the platform in the current context'
    )
  ) {
    return 'Passkey Authentication Failed'
  }
  return error.message
}
