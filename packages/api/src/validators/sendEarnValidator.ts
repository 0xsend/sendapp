import type { Validator, ValidationResult } from './types'
import {
  decodeSendEarnDepositUserOp,
  isFactoryDeposit,
  isVaultDeposit,
} from 'app/utils/decodeSendEarnDepositUserOp'
import { isAddress, parseUnits } from 'viem'
import debug from 'debug'

const log = debug('api:validators:sendEarn')
const MINIMUM_USDC_VAULT_DEPOSIT = parseUnits('5', 6) // 5 USDC

interface SendEarnContext {
  type: 'vault' | 'factory'
  owner: string
  assets: bigint
  vault?: string
}

export const sendEarnValidator: Validator<SendEarnContext> = {
  id: 'sendEarn',
  validate({ userop }): ValidationResult<SendEarnContext> {
    try {
      const depositArgs = decodeSendEarnDepositUserOp({ userOp: userop })

      if (isVaultDeposit(depositArgs)) {
        const { owner, assets, vault } = depositArgs
        if (isAddress(owner) && isAddress(vault) && assets >= MINIMUM_USDC_VAULT_DEPOSIT) {
          log('Validated as SendEarn vault deposit', { assets: String(assets) })
          return {
            ok: true,
            context: { type: 'vault', owner, assets, vault },
          }
        }
        if (assets < MINIMUM_USDC_VAULT_DEPOSIT) {
          return {
            ok: false,
            reason: 'Deposit amount below minimum required',
          }
        }
        return {
          ok: false,
          reason: 'Invalid vault deposit parameters',
        }
      }

      if (isFactoryDeposit(depositArgs)) {
        const { owner, assets } = depositArgs
        if (isAddress(owner) && assets >= MINIMUM_USDC_VAULT_DEPOSIT) {
          log('Validated as SendEarn factory deposit', { assets: String(assets) })
          return {
            ok: true,
            context: { type: 'factory', owner, assets },
          }
        }
        if (assets < MINIMUM_USDC_VAULT_DEPOSIT) {
          return {
            ok: false,
            reason: 'Deposit amount below minimum required',
          }
        }
        return {
          ok: false,
          reason: 'Invalid factory deposit parameters',
        }
      }

      return {
        ok: false,
        reason: 'Not a recognized SendEarn deposit type',
      }
    } catch (e) {
      log('Failed to decode SendEarn deposit', e)
      return {
        ok: false,
        reason: 'Not a SendEarn deposit operation',
      }
    }
  },
}
