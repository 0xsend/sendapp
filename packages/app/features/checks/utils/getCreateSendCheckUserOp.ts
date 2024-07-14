import { type Hex, encodeFunctionData, erc20Abi, isAddress, maxUint256 } from 'viem'
import type { CreateSendCheckUserOpProps } from 'app/features/checks/types'
import {
  baseMainnetClient,
  sendAccountAbi,
  sendCheckAbi,
  sendCheckAddress,
  tokenPaymasterAddress,
} from '@my/wagmi'
import type { UserOperation } from 'permissionless'
import { assert } from '../../../utils/assert'
import { defaultSendCheckUserOp } from 'app/features/checks/utils/checkUtils'

/**
 * Generate a /send check creation userOp
 *
 * @param {CreateSendCheckUserOpProps} props - properties for generating a create /send check userop
 * @returns {UserOperation<'v0.7'>}
 */
export const getCreateSendCheckUserOp = (props: CreateSendCheckUserOpProps) => {
  validateCreateSendCheckUserOpProps(props)

  const callData = getCallData(props)
  const paymaster = tokenPaymasterAddress[baseMainnetClient.chain.id]

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

const getCallData = (props: CreateSendCheckUserOpProps): Hex => {
  return encodeFunctionData({
    abi: sendAccountAbi,
    functionName: 'executeBatch',
    args: [
      [
        {
          dest: props.tokenAddress,
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [sendCheckAddress[baseMainnetClient.chain.id], maxUint256],
          }),
        },
        {
          dest: sendCheckAddress[baseMainnetClient.chain.id],
          value: 0n,
          data: encodeFunctionData({
            abi: sendCheckAbi,
            functionName: 'createCheck',
            args: [props.tokenAddress, props.ephemeralKeypair.ephemeralAddress, props.amount],
          }),
        },
      ],
    ],
  })
}

const validateCreateSendCheckUserOpProps = (props: CreateSendCheckUserOpProps) => {
  assert(!!sendCheckAddress[baseMainnetClient.chain.id], 'Invalid send check address')
  assert(!!props.maxFeesPerGas && typeof props.maxFeesPerGas === 'bigint', 'Invalid maxFeesPerGas')
  assert(!!props.tokenAddress && isAddress(props.tokenAddress), 'Invalid token address')
  assert(
    !!props.ephemeralKeypair.ephemeralAddress && isAddress(props.ephemeralKeypair.ephemeralAddress),
    'Invalid ephemeral address'
  )
  assert(!!props.senderAddress && isAddress(props.senderAddress), 'Invalid sender address')
  assert(!!props.ephemeralKeypair.ephemeralPrivateKey, 'Invalid ephemeral privkey')
  assert(typeof props.amount === 'bigint' && props.amount > 0n, 'Invalid amount')
  assert(typeof props.nonce === 'bigint' && props.nonce >= 0n, 'Invalid nonce')
}
