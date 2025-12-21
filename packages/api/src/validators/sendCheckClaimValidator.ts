import type { Validator, ValidationResult } from './types'
import { decodeSendCheckClaimUserOp } from 'app/utils/decodeSendCheckClaimUserOp'
import { isAddress } from 'viem'
import debug from 'debug'

const log = debug('api:validators:sendCheckClaim')

interface SendCheckClaimContext {
  ephemeralAddress: string
  checkContract: string
}

export const sendCheckClaimValidator: Validator<SendCheckClaimContext> = {
  id: 'sendCheckClaim',
  validate({ userop, chainId }): ValidationResult<SendCheckClaimContext> {
    try {
      const claimArgs = decodeSendCheckClaimUserOp({ userOp: userop, chainId })

      if (!isAddress(claimArgs.ephemeralAddress)) {
        return {
          ok: false,
          reason: 'Invalid ephemeral address',
        }
      }

      if (!isAddress(claimArgs.checkContract)) {
        return {
          ok: false,
          reason: 'Invalid check contract address',
        }
      }

      log('Validated as SendCheck claim', {
        ephemeralAddress: claimArgs.ephemeralAddress,
        checkContract: claimArgs.checkContract,
      })

      return {
        ok: true,
        context: {
          ephemeralAddress: claimArgs.ephemeralAddress,
          checkContract: claimArgs.checkContract,
        },
      }
    } catch (e) {
      log('Failed to decode SendCheck claim', e)
      return {
        ok: false,
        reason: 'Not a SendCheck claim operation',
      }
    }
  },
}
