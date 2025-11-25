import type { Validator, ValidationResult, ValidatorParams } from './types'
import { sendEarnValidator } from './sendEarnValidator'
import { sendTokenUpgradeValidator } from './sendTokenUpgradeValidator'
import { usdcPaymasterApprovalValidator } from './usdcPaymasterApprovalValidator'

export { sendEarnValidator, sendTokenUpgradeValidator, usdcPaymasterApprovalValidator }
export type { Validator, ValidationResult, ValidatorParams }

export const validators: Validator[] = [
  sendEarnValidator,
  sendTokenUpgradeValidator,
  usdcPaymasterApprovalValidator,
]

export function validateUserOp(params: ValidatorParams): ValidationResult {
  const reasons: string[] = []

  for (const validator of validators) {
    const result = validator.validate(params)
    if (result.ok) {
      return result
    }
    const msg = `[${validator.id}] ${result.reason}`
    reasons.push(msg)
  }

  const allReasons = reasons.join('; ')
  return {
    ok: false,
    reason: `Operation is not whitelisted for gas sponsorship. Validation failures: ${allReasons}`,
  }
}
