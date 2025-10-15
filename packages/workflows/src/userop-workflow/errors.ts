import type { WaitForUserOperationReceiptErrorType } from 'viem/account-abstraction'

/**
 * Determines if a user operation receipt error is retryable.
 * RETRYABLE ERRORS ✅ (Temporary/Network Issues)
 */
export function isRetryableUserOpError(error: WaitForUserOperationReceiptErrorType) {
  // Timeout errors - explicitly retryable
  if (error.name === 'WaitForUserOperationReceiptTimeoutError') {
    return true
  }

  // Network/Infrastructure errors - temporary issues
  const retryableErrorNames = [
    'UserOperationReceiptNotFoundError', // Receipt not found yet, might be processing
    'UserOperationNotFoundError', // UserOp not found yet, might be processing
  ]

  if (retryableErrorNames.includes(error.name)) {
    return true
  }

  // Check for retryable error patterns in generic errors
  const retryablePatterns = [
    'timeout',
    'network',
    'connection',
    'unavailable',
    'rate limit',
    'internal error',
    'service unavailable',
    'temporarily unavailable',
  ]

  const errorMessage = error.message?.toLowerCase() || ''
  return retryablePatterns.some((pattern) => errorMessage.includes(pattern))
}

/**
 * Determines if a bundler error is retryable.
 * RETRYABLE ERRORS ✅ (Temporary/Network Issues)
 */
export function isRetryableBundlerError(error: Error) {
  // Rate limiting errors - temporary throttling
  if (error.name === 'PaymasterRateLimitError') {
    return true
  }

  // Network/Infrastructure errors
  const retryableErrorNames = [
    'UnknownBundlerError', // Generic bundler errors might be temporary
  ]

  if (retryableErrorNames.includes(error.name)) {
    return true
  }

  // Check for retryable error patterns
  const retryablePatterns = [
    'timeout',
    'network',
    'connection',
    'unavailable',
    'rate limit',
    'internal error',
    'service unavailable',
    'temporarily unavailable',
    'throttled',
    'banned', // Rate limiting related
  ]

  const errorMessage = error.message?.toLowerCase() || ''
  return retryablePatterns.some((pattern) => errorMessage.includes(pattern))
}

/**
 * Determines if an error is non-retryable.
 * NON-RETRYABLE ERRORS ❌ (Permanent/Client Issues)
 */
export function isNonRetryableError(error: Error) {
  // Account/Deployment errors - permanent issues
  const nonRetryableAccountErrors = [
    'AccountNotDeployedError',
    'SenderAlreadyConstructedError',
    'InitCodeFailedError',
    'InitCodeMustCreateSenderError',
    'InitCodeMustReturnSenderError',
  ]

  // Validation errors - permanent issues
  const nonRetryableValidationErrors = [
    'InvalidAccountNonceError',
    'InvalidFieldsError',
    'InvalidBeneficiaryError',
    'InvalidAggregatorError',
    'InvalidPaymasterAndDataError',
    'UnsupportedSignatureAggregatorError',
  ]

  // Signature/Authentication errors - permanent issues
  const nonRetryableAuthErrors = [
    'UserOperationSignatureError',
    'UserOperationPaymasterSignatureError',
    'SignatureCheckFailedError',
    'SmartAccountFunctionRevertedError',
    'PaymasterFunctionRevertedError',
    'PaymasterPostOpFunctionRevertedError',
  ]

  // Gas/Resource errors - permanent issues
  const nonRetryableResourceErrors = [
    'InsufficientPrefundError',
    'GasValuesOverflowError',
    'VerificationGasLimitExceededError',
    'VerificationGasLimitTooLowError',
    'HandleOpsOutOfGasError',
    'PaymasterDepositTooLowError',
    'PaymasterStakeTooLowError',
  ]

  // Expiration errors - permanent issues
  const nonRetryableExpirationErrors = [
    'UserOperationExpiredError',
    'UserOperationPaymasterExpiredError',
    'UserOperationOutOfTimeRangeError',
  ]

  // Rejection errors - permanent issues
  const nonRetryableRejectionErrors = [
    'UserOperationRejectedByEntryPointError',
    'UserOperationRejectedByPaymasterError',
    'UserOperationRejectedByOpCodeError',
    'ExecutionRevertedError',
    'FailedToSendToBeneficiaryError',
    'InternalCallOnlyError',
    'PaymasterNotDeployedError',
  ]

  const allNonRetryableErrors = [
    ...nonRetryableAccountErrors,
    ...nonRetryableValidationErrors,
    ...nonRetryableAuthErrors,
    ...nonRetryableResourceErrors,
    ...nonRetryableExpirationErrors,
    ...nonRetryableRejectionErrors,
  ]

  return allNonRetryableErrors.includes(error.name)
}
