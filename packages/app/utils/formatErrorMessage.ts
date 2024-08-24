export const formatErrorMessage = (error: Error) => {
  if (error.message.startsWith('The operation either timed out or was not allowed')) {
    return 'Passkey Authentication Failed'
  }
  return error.message
}
