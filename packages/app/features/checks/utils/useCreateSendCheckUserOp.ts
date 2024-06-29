import { type UseQueryResult, useQuery } from '@tanstack/react-query'
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
import { defaultUserOp } from 'app/utils/useUserOpTransferMutation'
import { assert } from '../../../utils/assert'

const defaultCreateSendCheckUserOp: Pick<
  UserOperation<'v0.7'>,
  | 'callGasLimit'
  | 'verificationGasLimit'
  | 'preVerificationGas'
  | 'maxFeePerGas'
  | 'maxPriorityFeePerGas'
  | 'paymasterVerificationGasLimit'
  | 'paymasterPostOpGasLimit'
> = {
  ...defaultUserOp,
  callGasLimit: 1000000n,
  verificationGasLimit: 5500000n,
}

/**
 * Tanstack query for /send check creation userOp
 * @param {CreateSendCheckUserOpProps} props - properties for /send check creation
 * @returns {UseQueryResult<UserOperation<'v0.7'>>}
 */
export const useCreateSendCheckUserOp = (
  props: CreateSendCheckUserOpProps
): UseQueryResult<UserOperation<'v0.7'>> => {
  return useQuery({
    queryKey: ['createSendCheckUserOp'],
    enabled: isEnabled(props),
    queryFn: () => getCreateSendCheckUserOp(props),
  })
}

/**
 * Generate a /send check creation userOp
 * @param {CreateSendCheckUserOpProps} props - properties for generating a create /send check userop
 * @returns {UserOperation<'v0.7'>} -
 */
export const getCreateSendCheckUserOp = (props: CreateSendCheckUserOpProps) => {
  assert(!!props.senderAddress && isAddress(props.senderAddress), 'Invalid send account address')
  assert(typeof props.nonce === 'bigint' && props.nonce >= 0n, 'Invalid nonce')

  // generate calldata and userop
  const callData = getCallData(props)
  const paymaster = tokenPaymasterAddress[baseMainnetClient.chain.id]
  const userOp: UserOperation<'v0.7'> = {
    ...defaultCreateSendCheckUserOp,
    callData,
    sender: props.senderAddress,
    nonce: props.nonce,
    paymaster,
    paymasterData: '0x',
    paymasterAndData: '0x',
    signature: '0x',
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
            args: [sendCheckAddress[845337], maxUint256],
          }),
        },
        {
          dest: sendCheckAddress[845337],
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

const isEnabled = (props: CreateSendCheckUserOpProps): boolean => {
  return (
    !!props.tokenAddress &&
    !!props.ephemeralKeypair.ephemeralAddress &&
    !!props.ephemeralKeypair.ephemeralPrivkey &&
    props.amount !== undefined &&
    props.amount > 0n &&
    props.nonce !== undefined
  )
}
