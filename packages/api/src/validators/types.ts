import type { Address, Hex } from 'viem'

export type ValidationResult<T = unknown> = { ok: true; context: T } | { ok: false; reason: string }

export interface ValidatorParams {
  userop: {
    sender: Address
    nonce: bigint
    callData: Hex
    callGasLimit: bigint
    verificationGasLimit: bigint
    preVerificationGas: bigint
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
    signature: Hex
  }
  sendAccountCalls?: Array<{
    dest: Address
    value: bigint
    data: Hex
  }>
  chainId: number
  entryPoint: Address
  sendAccount: { address: Address }
}

export interface Validator<TContext = unknown> {
  id: string
  validate(params: ValidatorParams): ValidationResult<TContext>
}
