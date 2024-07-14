import {
  baseMainnetClient,
  sendAccountAbi,
  sendCheckAbi,
  sendCheckAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import type { ClaimSendCheckUserOpProps } from 'app/features/checks/types'
import { defaultSendCheckUserOp } from 'app/features/checks/utils/checkUtils'
import { assert } from 'app/utils/assert'
import type { UserOperation } from 'permissionless'
import { type Hex, encodeFunctionData, isAddress } from 'viem'

export const getClaimSendCheckUserOp = (
  props: ClaimSendCheckUserOpProps
): UserOperation<'v0.7'> => {
  validateClaimSendCheckUserOpProps(props)

  const callData = getCallData(props)
  const paymaster = tokenPaymasterAddress[baseMainnetClient.chain.id]

  // TODO: add paymaster sponsorship
  const paymasterData = getPaymasterData()

  const userOp: UserOperation<'v0.7'> = {
    ...defaultSendCheckUserOp,
    callData,
    sender: props.senderAddress,
    nonce: props.nonce,
    paymaster,
    paymasterData: '0x',
    signature: '0x',
    maxFeePerGas: props.maxFeesPerGas,
  }

  return userOp
}

const getPaymasterData = () => {
  // TODO: implement
}

const getCallData = (props: ClaimSendCheckUserOpProps): Hex => {
  return encodeFunctionData({
    abi: sendAccountAbi,
    functionName: 'executeBatch',
    args: [
      [
        {
          dest: sendCheckAddress[baseMainnetClient.chain.id],
          value: 0n,
          data: encodeFunctionData({
            abi: sendCheckAbi,
            functionName: 'claimCheck',
            args: [props.ephemeralKeypair.ephemeralAddress, props.signature],
          }),
        },
      ],
    ],
  })
}

const validateClaimSendCheckUserOpProps = (props: ClaimSendCheckUserOpProps) => {
  assert(
    !!sendCheckAddress[baseMainnetClient.chain.id] &&
      isAddress(sendCheckAddress[baseMainnetClient.chain.id]),
    'Invalid send check address'
  )
  assert(!!props.maxFeesPerGas && typeof props.maxFeesPerGas === 'bigint', 'Invalid maxFeesPerGas')
  assert(!!props.senderAddress && isAddress(props.senderAddress), 'Invalid senderAddress')
  assert(
    !!props.ephemeralKeypair.ephemeralAddress && isAddress(props.ephemeralKeypair.ephemeralAddress),
    'Invalid ephemeralAddress'
  )
  assert(!!props.ephemeralKeypair.ephemeralPrivateKey, 'Invalid ephemeralPrivateKey')
  assert(typeof props.nonce === 'bigint' && props.nonce >= 0n, 'Invalid nonce')
  assert(!!props.signature, 'Invalid signature')
}

export const canCreateClaimSendCheckUserOp = (props: ClaimSendCheckUserOpProps) => {
  try {
    validateClaimSendCheckUserOpProps(props)
    return true
  } catch (e) {
    return false
  }
}
